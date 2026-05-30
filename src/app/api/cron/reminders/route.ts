import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { format, addDays } from "date-fns";
import { sendReminderNotification } from "@/lib/email/notifications";

// Force dynamic — this route reads the DB and must never be cached/prerendered.
export const dynamic = "force-dynamic";

/**
 * Daily cron job: sends 24h reminders for tomorrow's appointments.
 *
 * Triggered by a scheduler (e.g. Vercel Cron) once per day. Protected by
 * CRON_SECRET so only the scheduler can invoke it.
 *
 * Idempotent: each appointment is marked `reminderSentAt` after a successful
 * send, so re-running the job never double-sends.
 *
 * NOTE on timezone: "tomorrow" is computed from the server's clock. With a
 * single daily run this gives ~24h notice. Per-clinic timezones are a future
 * enhancement.
 */
export async function GET(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  const provided = authHeader?.replace("Bearer ", "") ?? querySecret;
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Find tomorrow's appointments needing a reminder ────────────────────────
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const due = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.date, tomorrow),
        isNull(appointments.reminderSentAt),
        inArray(appointments.status, ["pending", "confirmed"])
      )
    );

  // ── Send and mark each ─────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;

  for (const appt of due) {
    const ok = await sendReminderNotification(appt.id);
    if (ok) {
      await db
        .update(appointments)
        .set({ reminderSentAt: new Date() })
        .where(eq(appointments.id, appt.id));
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({
    date: tomorrow,
    found: due.length,
    sent,
    failed,
  });
}
