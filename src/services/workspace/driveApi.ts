import { DriveItem } from '../../runtime/runtimeTypes';
import { getAccessToken } from './googleAuth';

// Mock initial data for offline / preview before live sign-in
let localDriveItems: DriveItem[] = [
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
  {
    id: 'drive_pdf_03',
    name: 'Infra_Security_Rotation_Policy_v2.pdf',
    mimeType: 'application/pdf',
    size: '3.4 MB',
    modifiedTime: new Date(Date.now() - 86400000 * 1).toISOString(),
    ownerName: 'DevOps Lead',
    webViewLink: 'https://drive.google.com/file/d/drive_pdf_03/view',
    shared: false,
  },
  {
    id: 'drive_folder_04',
    name: 'Production Evidence Dumps',
    mimeType: 'application/vnd.google-apps.folder',
    size: '24 items',
    modifiedTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    ownerName: 'Autonomous Agent',
    webViewLink: 'https://drive.google.com/drive/folders/drive_folder_04',
    shared: true,
  },
  {
    id: 'drive_doc_05',
    name: 'Sprint 34 Retrospective & Handoff.gdoc',
    mimeType: 'application/vnd.google-apps.document',
    size: '88 KB',
    modifiedTime: new Date(Date.now() - 86400000 * 4).toISOString(),
    ownerName: 'Alex Chen',
    webViewLink: 'https://docs.google.com/document/d/drive_doc_05/edit',
    shared: true,
  }
];

export const fetchDriveFiles = async (query?: string): Promise<DriveItem[]> => {
  const token = await getAccessToken();
  if (token) {
    try {
      let url = 'https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,thumbnailLink,owners)&orderBy=modifiedTime desc';
      if (query) {
        url += `&q=name contains '${encodeURIComponent(query)}' and trashed = false`;
      } else {
        url += `&q=trashed = false`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          return data.files.map((f: any) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : undefined,
            modifiedTime: f.modifiedTime,
            iconUrl: f.iconLink,
            webViewLink: f.webViewLink,
            thumbnailLink: f.thumbnailLink,
            ownerName: f.owners?.[0]?.displayName || 'Google Drive User',
            shared: f.shared || false,
          }));
        }
      }
    } catch (err) {
      console.warn('Live Drive API fetch error, falling back to local items:', err);
    }
  }

  // Filter local items
  if (query) {
    const q = query.toLowerCase();
    return localDriveItems.filter(item => item.name.toLowerCase().includes(q));
  }
  return [...localDriveItems];
};

export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (token) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 404) {
        throw new Error(`Failed to delete file from Drive: ${res.statusText}`);
      }
    } catch (err) {
      console.warn('Live delete error:', err);
    }
  }
  localDriveItems = localDriveItems.filter(item => item.id !== fileId);
};

export const createDriveFile = async (name: string, mimeType: string, content: string): Promise<DriveItem> => {
  const token = await getAccessToken();
  if (token) {
    try {
      const metadata = { name, mimeType };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: mimeType }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const f = await res.json();
        const newItem: DriveItem = {
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: `${content.length} B`,
          modifiedTime: new Date().toISOString(),
          ownerName: 'Current User',
          webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        };
        localDriveItems.unshift(newItem);
        return newItem;
      }
    } catch (err) {
      console.warn('Live create file error:', err);
    }
  }

  const newItem: DriveItem = {
    id: `local_drive_${Date.now()}`,
    name,
    mimeType,
    size: `${content.length} B`,
    modifiedTime: new Date().toISOString(),
    ownerName: 'Current User',
    webViewLink: '#',
    shared: false,
  };
  localDriveItems.unshift(newItem);
  return newItem;
};
