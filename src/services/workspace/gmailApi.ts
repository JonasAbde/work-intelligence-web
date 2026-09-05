import { GmailMessageItem } from '../../runtime/runtimeTypes';
import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { getAccessToken } from './googleAuth';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const previewMessages: GmailMessageItem[] = [
  {
    id: 'preview_msg_1',
    threadId: 'preview_thread_1',
    from: 'customer@example.com',
    fromName: 'Preview Customer',
    to: 'ops@example.com',
    subject: 'Preview: request confirmation before Friday',
    snippet: 'This is explicit preview data and is not a live Gmail message.',
    body: 'This is explicit preview data and is not a live Gmail message.',
    date: new Date().toISOString(),
    isUnread: true,
    hasAttachments: false,
    labels: ['INBOX'],
    extractedWorkItemCandidate: {
      suggestedTitle: 'Preview follow-up request',
      suggestedAction: 'Review the preview request.',
      priority: 'medium',
      confidence: 0.8,
      reasoning: 'Preview-only candidate. No backend inference claim.',
    },
  },
];

let localMessages: GmailMessageItem[] = loadPersistedState(STORAGE_KEYS.GMAIL_MESSAGES, previewMessages);

function persistPreviewMessages() {
  savePersistedState(STORAGE_KEYS.GMAIL_MESSAGES, localMessages);
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Gmail authorization required.');
  return token;
}

function getHeader(headers: Array<{ name?: string; value?: string }>, name: string): string {
  return headers.find(header => header.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function parseFrom(raw: string): { name: string; email: string } {
  const match = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || match[2], email: match[2] };
  return { name: raw.split('@')[0] || raw || 'Unknown sender', email: raw };
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function filterPreviewMessages(query?: string): GmailMessageItem[] {
  if (!query) return [...localMessages];
  const normalized = query.toLowerCase();
  return localMessages.filter(message =>
    message.subject.toLowerCase().includes(normalized) ||
    message.from.toLowerCase().includes(normalized) ||
    message.snippet.toLowerCase().includes(normalized),
  );
}

export const fetchGmailMessages = async (query?: string): Promise<GmailMessageItem[]> => {
  if (isExplicitPreviewMode()) return filterPreviewMessages(query);

  const token = await requireToken();
  const params = new URLSearchParams({ maxResults: '20' });
  if (query) params.set('q', query);

  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`Gmail list failed (${listRes.status}).`);

  const listData = await listRes.json() as { messages?: Array<{ id: string }> };
  const refs = (listData.messages ?? []).slice(0, 20);
  if (refs.length === 0) return [];

  const details = await Promise.all(refs.map(async ({ id }) => {
    const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!detailRes.ok) throw new Error(`Gmail message fetch failed (${detailRes.status}).`);

    const full = await detailRes.json();
    const headers = (full.payload?.headers ?? []) as Array<{ name?: string; value?: string }>;
    const from = parseFrom(getHeader(headers, 'From'));
    const rawDate = getHeader(headers, 'Date');
    const parsedDate = rawDate ? new Date(rawDate) : new Date();

    const item: GmailMessageItem = {
      id: full.id,
      threadId: full.threadId,
      from: from.email,
      fromName: from.name,
      to: getHeader(headers, 'To'),
      subject: getHeader(headers, 'Subject') || '(No subject)',
      snippet: full.snippet || '',
      date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
      isUnread: full.labelIds?.includes('UNREAD') ?? false,
      hasAttachments: false,
      labels: full.labelIds ?? [],
    };
    return item;
  }));

  return details;
};

export const sendGmailMessage = async (to: string, subject: string, bodyText: string): Promise<void> => {
  if (isExplicitPreviewMode()) {
    const now = Date.now();
    localMessages.unshift({
      id: `preview_sent_${now}`,
      threadId: `preview_thread_sent_${now}`,
      from: 'preview-user@example.com',
      fromName: 'Preview User',
      to,
      subject,
      snippet: bodyText.slice(0, 120),
      body: bodyText,
      date: new Date(now).toISOString(),
      isUnread: false,
      hasAttachments: false,
      labels: ['SENT'],
    });
    persistPreviewMessages();
    return;
  }

  const token = await requireToken();
  const message = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    bodyText,
  ].join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodeBase64Url(message) }),
  });
  if (!res.ok) throw new Error(`Gmail send failed (${res.status}).`);
};
