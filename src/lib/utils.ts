import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "MMM dd, yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

export function generateTimeSlots(
  start: string,
  end: string,
  slotDuration: number,
  breakStart?: string,
  breakEnd?: string
): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const breakStartMin = breakStart
    ? parseInt(breakStart.split(":")[0]) * 60 + parseInt(breakStart.split(":")[1])
    : null;
  const breakEndMin = breakEnd
    ? parseInt(breakEnd.split(":")[0]) * 60 + parseInt(breakEnd.split(":")[1])
    : null;

  while (currentMinutes + slotDuration <= endMinutes) {
    if (
      breakStartMin !== null &&
      breakEndMin !== null &&
      currentMinutes >= breakStartMin &&
      currentMinutes < breakEndMin
    ) {
      currentMinutes = breakEndMin;
      continue;
    }

    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    currentMinutes += slotDuration;
  }

  return slots;
}

export function getSpecialtyLabel(specialty: string): string {
  const labels: Record<string, string> = {
    general_practice: "General Practice",
    dentistry: "Dentistry",
    aesthetics: "Aesthetic Clinic",
    cardiology: "Cardiology",
    dermatology: "Dermatology",
    neurology: "Neurology",
    orthopedics: "Orthopedics",
    ophthalmology: "Ophthalmology",
    gynecology: "Gynecology",
    pediatrics: "Pediatrics",
    psychiatry: "Psychiatry",
    other: "Other",
  };
  return labels[specialty] ?? specialty;
}

export function getSpecialtyEmoji(specialty: string): string {
  const emojis: Record<string, string> = {
    general_practice: "🩺",
    dentistry: "🦷",
    aesthetics: "✨",
    cardiology: "🫀",
    dermatology: "🧴",
    neurology: "🧠",
    orthopedics: "🦴",
    ophthalmology: "👁️",
    gynecology: "🌸",
    pediatrics: "👶",
    psychiatry: "💭",
    other: "🏥",
  };
  return emojis[specialty] ?? "🏥";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-teal-100 text-teal-800 border-teal-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    no_show: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
