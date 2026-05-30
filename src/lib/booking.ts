import { db } from "@/db";
import { clinics, professionals, appointments } from "@/db/schema";
import { eq, and, ne, ilike } from "drizzle-orm";
import { generateTimeSlots } from "@/lib/utils";
import { format } from "date-fns";

// ─── Clinic search & detail ──────────────────────────────────────────────────

export async function searchClinics(filters: { specialty?: string; query?: string } = {}) {
  const conditions = [];

  if (filters.specialty && filters.specialty !== "all") {
    conditions.push(eq(clinics.specialty, filters.specialty as any));
  }
  if (filters.query) {
    conditions.push(ilike(clinics.name, `%${filters.query}%`));
  }

  return db
    .select()
    .from(clinics)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(clinics.rating)
    .limit(50);
}

export async function getClinicBySlug(slug: string) {
  const result = await db
    .select()
    .from(clinics)
    .where(eq(clinics.slug, slug))
    .limit(1);

  return result[0] ?? null;
}

export async function getClinicProfessionals(clinicId: string) {
  return db
    .select()
    .from(professionals)
    .where(and(eq(professionals.clinicId, clinicId), eq(professionals.isActive, true)));
}

// ─── Slot availability (core scheduling logic) ────────────────────────────────

export type Professional = typeof professionals.$inferSelect;

/**
 * Computes which time slots are bookable for a professional on a given date.
 *
 * A slot is available when ALL hold:
 *  1. The date's weekday is within the professional's `availableDays`.
 *  2. The slot falls inside working hours, excluding the lunch break
 *     (handled by `generateTimeSlots`).
 *  3. No existing non-cancelled appointment occupies that start time.
 *  4. The slot is not in the past (when the date is today).
 */
export async function getAvailableSlots(
  professional: Professional,
  dateStr: string // "yyyy-MM-dd"
): Promise<{ time: string; available: boolean }[]> {
  // getDay(): 0=Sun … 6=Sat. Parse as local date (avoid TZ shift from new Date("yyyy-mm-dd")).
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.getDay();

  const availableDays = professional.availableDays ?? [1, 2, 3, 4, 5];
  if (!availableDays.includes(weekday)) {
    return []; // professional does not work this weekday
  }

  // 2. Generate the candidate grid from working hours + break
  const allSlots = generateTimeSlots(
    professional.workingHoursStart ?? "08:00",
    professional.workingHoursEnd ?? "18:00",
    professional.slotDuration,
    professional.breakStart ?? undefined,
    professional.breakEnd ?? undefined
  );

  // 3. Fetch booked start times (anything not cancelled blocks the slot)
  const booked = await db
    .select({ startTime: appointments.startTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalId, professional.id),
        eq(appointments.date, dateStr),
        ne(appointments.status, "cancelled")
      )
    );

  // start_time comes back as "HH:MM:SS" — normalize to "HH:MM"
  const bookedSet = new Set(booked.map((b) => b.startTime.slice(0, 5)));

  // 4. If the date is today, past slots are unavailable
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const nowMinutes =
    dateStr === todayStr ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  return allSlots.map((time) => {
    const [h, mm] = time.split(":").map(Number);
    const slotMinutes = h * 60 + mm;
    const isPast = nowMinutes >= 0 && slotMinutes <= nowMinutes;
    const isBooked = bookedSet.has(time);
    return { time, available: !isBooked && !isPast };
  });
}

/** Adds `slotDuration` minutes to a "HH:MM" string, returns "HH:MM". */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
