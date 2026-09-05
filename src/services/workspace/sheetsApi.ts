import { SheetDataset, SheetRowData } from '../../runtime/runtimeTypes';
import { isExplicitPreviewMode } from '../../runtime/runtimeMode';
import { getAccessToken } from './googleAuth';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const previewSheets: SheetDataset[] = [
  {
    spreadsheetId: 'preview_sheet_1',
    title: 'Preview operational metrics',
    sheetName: 'Preview',
    columns: ['Metric', 'Value'],
    rows: [{ Metric: 'preview_only', Value: 'true' }],
    updatedAt: new Date().toISOString(),
  },
];

let localSheets: SheetDataset[] = loadPersistedState(STORAGE_KEYS.SHEETS_DATASETS, previewSheets);

function persistPreviewSheets() {
  savePersistedState(STORAGE_KEYS.SHEETS_DATASETS, localSheets);
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Google Sheets authorization required.');
  return token;
}

async function resolveSpreadsheetId(token: string, spreadsheetId?: string): Promise<string> {
  if (spreadsheetId) return spreadsheetId;
  const params = new URLSearchParams({
    pageSize: '1',
    orderBy: 'modifiedTime desc',
    q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: 'files(id)',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Sheets discovery failed via Drive (${res.status}).`);
  const data = await res.json() as { files?: Array<{ id: string }> };
  const id = data.files?.[0]?.id;
  if (!id) throw new Error('No Google Sheets spreadsheet is available.');
  return id;
}

function rowsToObjects(values: unknown[][]): { columns: string[]; rows: SheetRowData[] } {
  if (values.length === 0) return { columns: [], rows: [] };
  const columns = values[0].map(value => String(value ?? ''));
  const rows = values.slice(1).map(row => {
    const result: SheetRowData = {};
    columns.forEach((column, index) => {
      result[column] = row[index] === undefined ? '' : row[index] as any;
    });
    return result;
  });
  return { columns, rows };
}

export const fetchSheetDataset = async (spreadsheetId?: string): Promise<SheetDataset> => {
  if (isExplicitPreviewMode()) {
    return localSheets.find(sheet => sheet.spreadsheetId === spreadsheetId) || localSheets[0];
  }

  const token = await requireToken();
  const targetId = await resolveSpreadsheetId(token, spreadsheetId);
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(targetId)}?fields=properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Google Sheets metadata fetch failed (${metaRes.status}).`);

  const meta = await metaRes.json();
  const sheetTitle = meta.sheets?.[0]?.properties?.title || 'Sheet1';
  const range = `${sheetTitle}!A1:Z100`;
  const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(targetId)}/values/${encodeURIComponent(range)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!valuesRes.ok) throw new Error(`Google Sheets values fetch failed (${valuesRes.status}).`);

  const valuesData = await valuesRes.json() as { values?: unknown[][] };
  const { columns, rows } = rowsToObjects(valuesData.values ?? []);
  return {
    spreadsheetId: targetId,
    title: meta.properties?.title || '(Untitled spreadsheet)',
    sheetName: sheetTitle,
    columns,
    rows,
    updatedAt: new Date().toISOString(),
  };
};

export const appendSheetRow = async (spreadsheetId: string, rowData: SheetRowData): Promise<void> => {
  if (isExplicitPreviewMode()) {
    const sheet = localSheets.find(candidate => candidate.spreadsheetId === spreadsheetId) || localSheets[0];
    sheet.rows.push(rowData);
    sheet.updatedAt = new Date().toISOString();
    persistPreviewSheets();
    return;
  }

  const token = await requireToken();
  const dataset = await fetchSheetDataset(spreadsheetId);
  const values = [dataset.columns.map(column => rowData[column] ?? '')];
  const range = `${dataset.sheetName}!A1`;
  const params = new URLSearchParams({ valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' });
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw new Error(`Google Sheets append failed (${res.status}).`);
};
