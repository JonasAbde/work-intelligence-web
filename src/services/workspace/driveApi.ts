import { DriveItem } from '../../runtime/runtimeTypes';
import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { getAccessToken } from './googleAuth';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const defaultDriveItems: DriveItem[] = [
  {
    id: 'drive_doc_01',
    name: 'Q3 Aftergraph Operational Architecture Spec.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    size: '142 KB',
    modifiedTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    ownerName: 'Alex Chen',
    webViewLink: 'https://docs.google.com/document/d/drive_doc_01/edit',
    shared: true,
  },
  {
    id: 'drive_sheet_02',
    name: 'Core System Health & Latency Metrics.gsheet',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    size: '1.2 MB',
    modifiedTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    ownerName: 'Emma Watson',
    webViewLink: 'https://docs.google.com/spreadsheets/d/drive_sheet_02/edit',
    shared: true,
  },
];

let localDriveItems: DriveItem[] = loadPersistedState(STORAGE_KEYS.DRIVE_ITEMS, defaultDriveItems);

function persistPreviewItems() {
  savePersistedState(STORAGE_KEYS.DRIVE_ITEMS, localDriveItems);
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Drive authorization required.');
  return token;
}

function previewFiles(query?: string): DriveItem[] {
  if (!query) return [...localDriveItems];
  const normalized = query.toLowerCase();
  return localDriveItems.filter(item => item.name.toLowerCase().includes(normalized));
}

export const fetchDriveFiles = async (query?: string): Promise<DriveItem[]> => {
  if (isExplicitPreviewMode()) return previewFiles(query);

  const token = await requireToken();
  const q = query
    ? `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    : 'trashed = false';
  const params = new URLSearchParams({
    pageSize: '30',
    fields: 'files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,thumbnailLink,owners,shared)',
    orderBy: 'modifiedTime desc',
    q,
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Drive list failed (${res.status}).`);

  const data = await res.json() as { files?: any[] };
  return (data.files ?? []).map(f => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? `${(Number.parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
    modifiedTime: f.modifiedTime,
    iconUrl: f.iconLink,
    webViewLink: f.webViewLink,
    thumbnailLink: f.thumbnailLink,
    ownerName: f.owners?.[0]?.displayName || 'Google Drive user',
    shared: Boolean(f.shared),
  }));
};

export const deleteDriveFile = async (fileId: string): Promise<void> => {
  if (isExplicitPreviewMode()) {
    localDriveItems = localDriveItems.filter(item => item.id !== fileId);
    persistPreviewItems();
    return;
  }

  const token = await requireToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Google Drive delete failed (${res.status}).`);
  }
};

export const createDriveFile = async (name: string, mimeType: string, content: string): Promise<DriveItem> => {
  if (isExplicitPreviewMode()) {
    const item: DriveItem = {
      id: `preview_drive_${Date.now()}`,
      name,
      mimeType,
      size: `${content.length} B`,
      modifiedTime: new Date().toISOString(),
      ownerName: 'Preview user',
      webViewLink: '#preview',
      shared: false,
    };
    localDriveItems.unshift(item);
    persistPreviewItems();
    return item;
  }

  const token = await requireToken();
  const metadata = { name, mimeType };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Google Drive create failed (${res.status}).`);

  const file = await res.json();
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: `${content.length} B`,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
    ownerName: 'Current Google user',
    webViewLink: file.webViewLink,
    shared: false,
  };
};
