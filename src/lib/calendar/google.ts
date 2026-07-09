import type { CalendarEvent, TimeSlot } from "./types";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

let _accessToken: string | null = null;

async function getAccessToken(): Promise<string> {
  if (_accessToken) return _accessToken;

  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_EMAIL and GOOGLE_CALENDAR_PRIVATE_KEY must be set"
    );
  }

  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  _accessToken = token.token || null;

  return _accessToken!;
}

async function fetchGoogleApi(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar API error: ${err}`);
  }

  return res.json();
}

export async function listAvailableSlots(
  calendarId: string,
  date: string,
  workingHoursStart = "08:00",
  workingHoursEnd = "18:00",
  slotDuration = 30
): Promise<TimeSlot[]> {
  const dayStart = `${date}T${workingHoursStart}:00`;
  const dayEnd = `${date}T${workingHoursEnd}:00`;

  const busyData = (await fetchGoogleApi(
    `/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${encodeURIComponent(dayStart)}Z` +
      `&timeMax=${encodeURIComponent(dayEnd)}Z` +
      `&singleEvents=true&orderBy=startTime`
  )) as { items?: Array<{ start: { dateTime: string }; end: { dateTime: string } }> };

  const busySlots: Array<{ start: number; end: number }> =
    busyData.items?.map((ev) => ({
      start: new Date(ev.start.dateTime).getTime(),
      end: new Date(ev.end.dateTime).getTime(),
    })) || [];

  const [startH, startM] = workingHoursStart.split(":").map(Number);
  const [endH, endM] = workingHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: TimeSlot[] = [];
  let current = startMinutes;

  while (current + slotDuration <= endMinutes) {
    const slotStart = new Date(`${date}T${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}:00`).getTime();
    const slotEnd = slotStart + slotDuration * 60 * 1000;

    const isBusy = busySlots.some(
      (busy) => slotStart < busy.end && slotEnd > busy.start
    );

    slots.push({
      date,
      time: `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`,
      available: !isBusy,
    });

    current += slotDuration;
  }

  return slots;
}

export async function createCalendarEvent(
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    attendees?: Array<{ email: string; displayName?: string }>;
  }
): Promise<CalendarEvent> {
  const data = (await fetchGoogleApi(
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: event.attendees?.map((a) => ({
          email: a.email,
          displayName: a.displayName,
        })),
        reminders: {
          useDefault: true,
        },
      }),
    }
  )) as CalendarEvent;

  return data;
}

export async function cancelCalendarEvent(
  calendarId: string,
  eventId: string
): Promise<void> {
  await fetchGoogleApi(
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" }
  );
}

export async function listUpcomingEvents(
  calendarId: string,
  maxResults = 50
): Promise<CalendarEvent[]> {
  const data = (await fetchGoogleApi(
    `/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${encodeURIComponent(new Date().toISOString())}` +
      `&orderBy=startTime&singleEvents=true&maxResults=${maxResults}`
  )) as { items: CalendarEvent[] };

  return data.items || [];
}
