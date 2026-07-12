import { NextRequest, NextResponse } from "next/server";
import { createPortalSession } from "@/lib/stripe";
import { db } from "@/db";
import { clinics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    const session = await verifySessionToken(cookie.value);
    if (!session || !session.clinicId) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }
    const clinicId = session.clinicId;

    const [clinic] = await db
      .select()
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    if (!clinic.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portal = await createPortalSession({
      customerId: clinic.stripeCustomerId,
      returnUrl: `${appUrl}/admin/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error: any) {
    console.error("[Portal API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
