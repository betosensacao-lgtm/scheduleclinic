import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["patient", "clinic_admin"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ─── Booking ─────────────────────────────────────────────────────────────────

export const bookingSearchSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  date: z.date().optional(),
  timePreference: z.enum(["morning", "afternoon", "evening", "any"]).default("any"),
});

// ─── Pre-Anamnesis ───────────────────────────────────────────────────────────

export const preAnamnesisSchema = z.object({
  // Personal
  fullName: z.string().min(2, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  phone: z.string().min(6, "Phone number is required"),
  emergencyContact: z.string().optional(),

  // Chief complaint
  chiefComplaint: z.string().min(5, "Please describe your main complaint"),
  symptomsDescription: z.string().optional(),
  symptomsDuration: z.string().optional(),
  painScale: z.number().min(0).max(10).optional(),

  // Medical history
  currentMedications: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  previousSurgeries: z.string().optional(),
  familyHistory: z.string().optional(),

  // Vitals
  bloodType: z.string().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),

  // Insurance
  hasInsurance: z.boolean().default(false),
  insuranceProvider: z.string().optional(),
  insurancePlanNumber: z.string().optional(),

  // Consent
  consentGiven: z.boolean().refine((v) => v === true, {
    message: "You must give consent to proceed",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PreAnamnesisInput = z.infer<typeof preAnamnesisSchema>;
export type BookingSearchInput = z.infer<typeof bookingSearchSchema>;
