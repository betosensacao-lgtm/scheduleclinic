import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { clinics, pricingPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set, skipping verification");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!sig) {
    return NextResponse.json({ error: "No stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();
  let event: any;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const clinicId = session.metadata?.clinicId;
        if (!clinicId) break;

        const customerId = session.customer;
        const subscriptionId = session.subscription;

        let planId: string | null = null;
        if (session.mode === "subscription" && subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          if (priceId) {
            const [plan] = await db
              .select()
              .from(pricingPlans)
              .where(
                eq(pricingPlans.stripePriceIdMonthly, priceId)
              )
              .limit(1);
            if (plan) {
              planId = plan.id;
            } else {
              const [plan2] = await db
                .select()
                .from(pricingPlans)
                .where(
                  eq(pricingPlans.stripePriceIdYearly, priceId)
                )
                .limit(1);
              if (plan2) planId = plan2.id;
            }
          }
        }

        await db
          .update(clinics)
          .set({
            stripeCustomerId: customerId,
            subscriptionId: subscriptionId,
            subscriptionStatus: "active",
            planId: planId || undefined,
            trialEndsAt: null,
          })
          .where(eq(clinics.id, clinicId));

        console.log(`[Stripe Webhook] Checkout completed for clinic ${clinicId}`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const clinicIdSub = sub.metadata?.clinicId;
        if (!clinicIdSub) break;

        const status = sub.status;
        await db
          .update(clinics)
          .set({
            subscriptionStatus: status,
            subscriptionId: sub.id,
          })
          .where(eq(clinics.id, clinicIdSub));
        console.log(`[Stripe Webhook] Subscription ${sub.id} updated to ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subDel = event.data.object;
        const clinicIdDel = subDel.metadata?.clinicId;
        if (!clinicIdDel) break;

        await db
          .update(clinics)
          .set({
            subscriptionStatus: "canceled",
            planId: null,
            trialEndsAt: null,
          })
          .where(eq(clinics.id, clinicIdDel));
        console.log(`[Stripe Webhook] Subscription ${subDel.id} deleted`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const clinicIdInv = invoice.metadata?.clinicId || invoice.subscription_details?.metadata?.clinicId;
        if (!clinicIdInv) break;

        await db
          .update(clinics)
          .set({ subscriptionStatus: "past_due" })
          .where(eq(clinics.id, clinicIdInv));
        console.log(`[Stripe Webhook] Payment failed for clinic ${clinicIdInv}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
