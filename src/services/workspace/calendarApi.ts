import { CalendarEventItem } from '../../runtime/runtimeTypes';
import { getAccessToken } from './googleAuth';

let localCalendarEvents: CalendarEventItem[] = [
  {
    id: 'cal_event_01',
    title: 'Root Key Rotation Review & Blast Radius Signoff',
    description: 'Review staged AWS/GCP KMS key rotation and verify staging canary health logs before executing.',
    start: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    location: 'Google Meet: meet.google.com/xyz-ops-key',
    attendees: [
      { name: 'Alex Chen', email: 'alex.chen@internal', status: 'accepted' },
      { name: 'SecOps Officer', email: 'secops@internal', status: 'accepted' },
    ],
    htmlLink: 'https://calendar.google.com/calendar/event?eid=cal_event_01',
    linkedWorkItemId: 'WI-1024',
  },
  {
    id: 'cal_event_02',
    title: 'Sprint 34 Architecture Backlog Grooming',
    description: 'Autonomous work discovery candidates triage and Linear target publishing roadmap.',
    start: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    location: 'Conference Room B / Virtual',
    attendees: [
      { name: 'Sarah Miller', email: 'sarah.miller@product.io', status: 'accepted' },
      { name: 'Emma Watson', email: 'emma.watson@internal', status: 'tentative' },
    ],
    htmlLink: 'https://calendar.google.com/calendar/event?eid=cal_event_02',
    linkedWorkItemId: 'WI-1025',
  },
  {
    id: 'cal_event_03',
    title: 'Weekly Reliability & Error Budget Postmortem',
    description: 'Reviewing 99.98% uptime SLA compliance and database replica sync delays.',
    start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
    location: 'Google Meet: meet.google.com/ops-reliability',
    attendees: [
      { name: 'DevOps Lead', email: 'devops@internal', status: 'accepted' },
    ],
    htmlLink: 'https://calendar.google.com/calendar/event?eid=cal_event_03',
  }
];

export const fetchCalendarEvents = async (): Promise<CalendarEventItem[]> => {
  const token = await getAccessToken();
  if (token) {
    try {
      const now = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=25`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return data.items.map((ev: any) => ({
            id: ev.id,
            title: ev.summary || '(Untitled Meeting)',
            description: ev.description || '',
            start: ev.start.dateTime || ev.start.date,
            end: ev.end.dateTime || ev.end.date,
            isAllDay: !ev.start.dateTime,
            location: ev.location || '',
            attendees: (ev.attendees || []).map((a: any) => ({
              name: a.displayName || a.email.split('@')[0],
              email: a.email,
              status: a.responseStatus,
            })),
            htmlLink: ev.htmlLink,
          }));
        }
      }
    } catch (err) {
      console.warn('Live Calendar API fetch error, fallback to local events:', err);
    }
  }
  return [...localCalendarEvents];
};

export const createCalendarEvent = async (event: {
  title: string;
  description: string;
  startIso: string;
  endIso: string;
  location?: string;
  attendeeEmails?: string[];
}): Promise<CalendarEventItem> => {
  const token = await getAccessToken();
  if (token) {
    try {
      const body = {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startIso },
        end: { dateTime: event.endIso },
        location: event.location || 'Google Meet',
        conferenceData: {
          createRequest: { requestId: `meet_${Date.now()}` }
        },
        attendees: (event.attendeeEmails || []).map(email => ({ email })),
      };
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const ev = await res.json();
        const newItem: CalendarEventItem = {
          id: ev.id,
          title: ev.summary,
          description: ev.description,
          start: ev.start.dateTime || ev.start.date,
          end: ev.end.dateTime || ev.end.date,
          location: ev.location,
          attendees: (ev.attendees || []).map((a: any) => ({
            name: a.displayName || a.email,
            email: a.email,
            status: a.responseStatus,
          })),
          htmlLink: ev.htmlLink,
        };
        localCalendarEvents.push(newItem);
        return newItem;
      }
    } catch (err) {
      console.warn('Live Calendar create error:', err);
    }
  }

  const newLocalItem: CalendarEventItem = {
    id: `local_cal_${Date.now()}`,
    title: event.title,
    description: event.description,
    start: event.startIso,
    end: event.endIso,
    location: event.location || 'Google Meet',
    attendees: (event.attendeeEmails || []).map(e => ({ name: e.split('@')[0], email: e, status: 'accepted' })),
    htmlLink: 'https://calendar.google.com',
  };
  localCalendarEvents.push(newLocalItem);
  return newLocalItem;
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const token = await getAccessToken();
  if (token) {
    try {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Live calendar delete error:', err);
    }
  }
  localCalendarEvents = localCalendarEvents.filter(e => e.id !== eventId);
};
