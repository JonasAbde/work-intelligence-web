import { DocDocumentItem } from '../../runtime/runtimeTypes';
import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { getAccessToken } from './googleAuth';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const previewDocs: DocDocumentItem[] = [
  {
    id: 'preview_doc_1',
    title: 'Preview operational specification',
    author: 'Preview User',
    lastModified: new Date().toISOString(),
    wordCount: 12,
    webViewLink: 'https://docs.google.com',
    sections: [{
      heading: 'Preview',
      body: 'Explicit preview content. This document is not loaded from Google Docs.',
    }],
  },
];

let localDocs: DocDocumentItem[] = loadPersistedState(STORAGE_KEYS.DOCS_ITEMS, previewDocs);

function persistPreviewDocs() {
  savePersistedState(STORAGE_KEYS.DOCS_ITEMS, localDocs);
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Docs authorization required.');
  return token;
}

function documentText(document: any): string {
  const parts: string[] = [];
  for (const element of document.body?.content ?? []) {
    for (const paragraphElement of element.paragraph?.elements ?? []) {
      const text = paragraphElement.textRun?.content;
      if (typeof text === 'string') parts.push(text);
    }
  }
  return parts.join('').trim();
}

export const fetchDocs = async (): Promise<DocDocumentItem[]> => {
  if (isExplicitPreviewMode()) return [...localDocs];

  const token = await requireToken();
  const params = new URLSearchParams({
    pageSize: '10',
    orderBy: 'modifiedTime desc',
    q: "mimeType = 'application/vnd.google-apps.document' and trashed = false",
    fields: 'files(id,name,modifiedTime,webViewLink,owners)',
  });
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`Google Docs listing failed via Drive (${listRes.status}).`);

  const listData = await listRes.json() as { files?: any[] };
  return Promise.all((listData.files ?? []).map(async file => {
    const docRes = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(file.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!docRes.ok) throw new Error(`Google Docs fetch failed (${docRes.status}).`);
    const document = await docRes.json();
    const text = documentText(document);
    return {
      id: file.id,
      title: document.title || file.name || '(Untitled document)',
      author: file.owners?.[0]?.displayName || 'Google Docs user',
      lastModified: file.modifiedTime || new Date().toISOString(),
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
      sections: text ? [{ heading: 'Document body', body: text }] : [],
    } satisfies DocDocumentItem;
  }));
};

export const createGoogleDoc = async (title: string, initialBody: string): Promise<DocDocumentItem> => {
  if (isExplicitPreviewMode()) {
    const item: DocDocumentItem = {
      id: `preview_doc_${Date.now()}`,
      title,
      author: 'Preview User',
      lastModified: new Date().toISOString(),
      wordCount: initialBody.trim() ? initialBody.trim().split(/\s+/).length : 0,
      webViewLink: 'https://docs.google.com',
      sections: [{ heading: 'Preview document body', body: initialBody }],
    };
    localDocs.unshift(item);
    persistPreviewDocs();
    return item;
  }

  const token = await requireToken();
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!createRes.ok) throw new Error(`Google Docs create failed (${createRes.status}).`);

  const created = await createRes.json();
  if (initialBody) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(created.documentId)}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{ insertText: { location: { index: 1 }, text: `${initialBody}\n` } }],
      }),
    });
    if (!updateRes.ok) throw new Error(`Google Docs initial content write failed (${updateRes.status}).`);
  }

  return {
    id: created.documentId,
    title: created.title || title,
    author: 'Current Google user',
    lastModified: new Date().toISOString(),
    wordCount: initialBody.trim() ? initialBody.trim().split(/\s+/).length : 0,
    webViewLink: `https://docs.google.com/document/d/${created.documentId}/edit`,
    sections: initialBody ? [{ heading: 'Document body', body: initialBody }] : [],
  };
};
