export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
  status?: "confirmed" | "cancelled";
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface CalendarAvailability {
  professionalId: string;
  professionalName: string;
  date: string;
  slots: TimeSlot[];
}
