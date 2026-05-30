import { db } from "@/db";
import { appointments, clinics, professionals, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { format, parseISO } from "date-fns";
import { formatTime } from "@/lib/utils";
import { sendEmail } from "./client";
import { patientConfirmationEmail, clinicNotificationEmail, reminderEmail } from "./templates";

// Loads the full appointment context needed by every email template.
async function loadAppointmentContext(appointmentId: string) {
  const [row] = await db
    .select({
      appointment: appointments,
      patientName: users.name,
      patientEmail: users.email,
      clinicName: clinics.name,
      clinicEmail: clinics.email,
      professionalName: professionals.name,
      professionalSpecialty: professionals.specialty,
    })
    .from(appointments)
    .innerJoin(users, eq(appointments.patientId, users.id))
    .innerJoin(clinics, eq(appointments.clinicId, clinics.id))
    .innerJoin(professionals, eq(appointments.professionalId, professionals.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row) return null;

  return {
    appointmentId,
    patientName: row.patientName,
    patientEmail: row.patientEmail,
    clinicName: row.clinicName,
    clinicEmail: row.clinicEmail,
    professionalName: row.professionalName,
    professionalSpecialty: row.professionalSpecialty,
    date: format(parseISO(row.appointment.date), "EEEE, MMMM dd, yyyy"),
    startTime: formatTime(row.appointment.startTime),
    endTime: formatTime(row.appointment.endTime),
  };
}

/**
 * Fires the two booking emails (patient confirmation + clinic notification).
 * Best-effort: never throws, runs both in parallel, returns a summary.
 */
export async function sendBookingNotifications(appointmentId: string) {
  const ctx = await loadAppointmentContext(appointmentId);
  if (!ctx) {
    console.warn("[email] booking notifications: appointment not found", appointmentId);
    return;
  }

  const patientMsg = patientConfirmationEmail(ctx);
  const clinicMsg = clinicNotificationEmail(ctx);

  const [patientRes, clinicRes] = await Promise.all([
    sendEmail({ to: ctx.patientEmail, subject: patientMsg.subject, html: patientMsg.html }),
    sendEmail({ to: ctx.clinicEmail, subject: clinicMsg.subject, html: clinicMsg.html }),
  ]);

  if (!patientRes.ok) console.warn("[email] patient confirmation failed:", patientRes.error);
  if (!clinicRes.ok) console.warn("[email] clinic notification failed:", clinicRes.error);
}

/**
 * Sends the 24h reminder to the patient. Returns whether it succeeded so the
 * caller can decide whether to mark reminderSentAt.
 */
export async function sendReminderNotification(appointmentId: string): Promise<boolean> {
  const ctx = await loadAppointmentContext(appointmentId);
  if (!ctx) return false;

  const msg = reminderEmail(ctx);
  const res = await sendEmail({ to: ctx.patientEmail, subject: msg.subject, html: msg.html });
  return res.ok;
}
