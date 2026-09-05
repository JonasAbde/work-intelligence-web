import { CalendarEventItem } from '../../runtime/runtimeTypes';
import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { getAccessToken } from './googleAuth';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const previewEvents: CalendarEventItem[] = [
  {
    id: 'preview_cal_1',
    title: 'Preview: operational review',
    description: 'Explicit preview event. Not loaded from Google Calendar.',
    start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: 'Preview',
    attendees: [],
    htmlLink: 'https://calendar.google.com',
  },
];

let localEvents: CalendarEventItem[] = loadPersistedState(STORAGE_KEYS.CALENDAR_EVENTS, previewEvents);

function persistPreviewEvents() {
  savePersistedState(STORAGE_KEYS.CALENDAR_EVENTS, localEvents);
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Calendar authorization required.');
  return token;
}

function mapCalendarEvent(ev: any): CalendarEventItem {
  return {
    id: ev.id,
    title: ev.summary || '(Untitled event)',
    description: ev.description || '',
    start: ev.start?.dateTime || ev.start?.date,
    end: ev.end?.dateTime || ev.end?.date,
    isAllDay: !ev.start?.dateTime,
    location: ev.location || '',
    attendees: (ev.attendees || []).map((attendee: any) => ({
      name: attendee.displayName || attendee.email || 'Calendar attendee',
      email: attendee.email || '',
      status: attendee.responseStatus || 'needsAction',
    })),
    htmlLink: ev.htmlLink,
  };
}

export const fetchCalendarEvents = async (): Promise<CalendarEventItem[]> => {
  if (isExplicitPreviewMode()) return [...localEvents];

  const token = await requireToken();
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '25',
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Calendar list failed (${res.status}).`);

  const data = await res.json() as { items?: any[] };
  return (data.items ?? []).map(mapCalendarEvent);
};

export const createCalendarEvent = async (event: {
  title: string;
  description: string;
  startIso: string;
  endIso: string;
  location?: string;
  attendeeEmails?: string[];
}): Promise<CalendarEventItem> => {
  if (isExplicitPreviewMode()) {
    const item: CalendarEventItem = {
      id: `preview_cal_${Date.now()}`,
      title: event.title,
      description: event.description,
      start: event.startIso,
      end: event.endIso,
      location: event.location || 'Preview',
      attendees: (event.attendeeEmails || []).map(email => ({ name: email, email, status: 'needsAction' })),
      htmlLink: 'https://calendar.google.com',
    };
    localEvents.push(item);
    persistPreviewEvents();
    return item;
  }

  const token = await requireToken();
  const body = {
    summary: event.title,
    description: event.description,
    start: { dateTime: event.startIso },
    end: { dateTime: event.endIso },
    location: event.location || undefined,
    attendees: (event.attendeeEmails || []).map(email => ({ email })),
  };
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google Calendar create failed (${res.status}).`);
  return mapCalendarEvent(await res.json());
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  if (isExplicitPreviewMode()) {
    localEvents = localEvents.filter(event => event.id !== eventId);
    persistPreviewEvents();
    return;
  }

  const token = await requireToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Google Calendar delete failed (${res.status}).`);
};
