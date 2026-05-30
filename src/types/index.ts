// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = "patient" | "clinic_admin" | "professional";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

// ─── Clinic ──────────────────────────────────────────────────────────────────

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  specialty: ClinicSpecialty;
  description?: string;
  address: Address;
  phone: string;
  email: string;
  logoUrl?: string;
  coverUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: Date;
}

export type ClinicSpecialty =
  | "general_practice"
  | "dentistry"
  | "aesthetics"
  | "cardiology"
  | "dermatology"
  | "neurology"
  | "orthopedics"
  | "ophthalmology"
  | "gynecology"
  | "pediatrics"
  | "psychiatry"
  | "other";

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ─── Professional ────────────────────────────────────────────────────────────

export interface Professional {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  crm?: string; // registration number
  bio?: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  availableDays: number[]; // 0=Sun, 1=Mon, ...
  workingHours: WorkingHours;
}

export interface WorkingHours {
  start: string; // "08:00"
  end: string;   // "18:00"
  slotDuration: number; // minutes
  breakStart?: string;
  breakEnd?: string;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface Appointment {
  id: string;
  patientId: string;
  clinicId: string;
  professionalId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  preAnamnesisId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  patient?: User;
  clinic?: Clinic;
  professional?: Professional;
  preAnamnesis?: PreAnamnesis;
}

// ─── Pre-Anamnesis ───────────────────────────────────────────────────────────

export interface PreAnamnesis {
  id: string;
  appointmentId: string;
  patientId: string;

  // Personal
  fullName: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  phone: string;
  emergencyContact?: string;

  // Medical History
  chiefComplaint: string;
  symptomsDescription?: string;
  symptomsDuration?: string;
  painScale?: number; // 0-10

  // Current Health
  currentMedications: string[];
  allergies: string[];
  chronicConditions: string[];
  previousSurgeries?: string;
  familyHistory?: string;

  // Vitals (optional, can be filled at clinic)
  bloodType?: string;
  height?: number; // cm
  weight?: number; // kg

  // Insurance
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePlanNumber?: string;

  // Consent
  consentGiven: boolean;
  consentDate: Date;

  createdAt: Date;
}

// ─── Booking Flow ─────────────────────────────────────────────────────────────

export interface BookingStep {
  id: number;
  title: string;
  description: string;
}

export interface BookingState {
  clinicId?: string;
  professionalId?: string;
  date?: Date;
  timeSlot?: string;
  patientInfo?: Partial<PreAnamnesis>;
  step: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchFilters {
  specialty?: ClinicSpecialty;
  city?: string;
  date?: Date;
  timePreference?: "morning" | "afternoon" | "evening" | "any";
  rating?: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingConfirmations: number;
  totalPatients: number;
  cancelledThisMonth: number;
  completedThisMonth: number;
}
