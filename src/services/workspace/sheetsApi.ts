import { SheetDataset, SheetRowData } from '../../runtime/runtimeTypes';
import { getAccessToken } from './googleAuth';
import { loadPersistedState, savePersistedState, STORAGE_KEYS } from '../../runtime/persistence';

const defaultSheets: SheetDataset[] = [
  {
    spreadsheetId: 'sheet_core_metrics_01',
    title: 'Core System Health & Latency Metrics',
    sheetName: 'Latency_SLO',
    columns: ['Service', 'P50_ms', 'P99_ms', 'ErrorRate_Pct', 'SLA_Status', 'LastAudited'],
    rows: [
      { Service: 'inference-mesh-gateway', P50_ms: 42, P99_ms: 180, ErrorRate_Pct: '0.01%', SLA_Status: 'HEALTHY', LastAudited: '2026-09-05 09:12' },
      { Service: 'postgres-spanner-bridge', P50_ms: 18, P99_ms: 65, ErrorRate_Pct: '0.00%', SLA_Status: 'HEALTHY', LastAudited: '2026-09-05 09:14' },
      { Service: 'vector-evidence-indexer', P50_ms: 88, P99_ms: 340, ErrorRate_Pct: '0.04%', SLA_Status: 'MONITORING', LastAudited: '2026-09-05 08:55' },
      { Service: 'renos-work-dispatcher', P50_ms: 55, P99_ms: 210, ErrorRate_Pct: '0.00%', SLA_Status: 'HEALTHY', LastAudited: '2026-09-05 09:15' },
      { Service: 'audit-provenance-signer', P50_ms: 24, P99_ms: 92, ErrorRate_Pct: '0.00%', SLA_Status: 'HEALTHY', LastAudited: '2026-09-05 09:10' }
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    spreadsheetId: 'sheet_work_backlog_02',
    title: 'Aftergraph Autonomous Backlog Export',
    sheetName: 'Discovered_Work',
    columns: ['ID', 'Title', 'Priority', 'Status', 'Confidence', 'InferredBy'],
    rows: [
      { ID: 'WI-1024', Title: 'Approve Primary Root Key Rotation SLA', Priority: 'urgent', Status: 'needs_review', Confidence: '94%', InferredBy: 'Security Bot' },
      { ID: 'WI-1025', Title: 'Document Webhook Schemas & Retry Policy', Priority: 'high', Status: 'in_progress', Confidence: '89%', InferredBy: 'Email Scanner' },
      { ID: 'WI-1026', Title: 'Database replica synchronization lag mitigation', Priority: 'high', Status: 'approved', Confidence: '96%', InferredBy: 'Telemetry Engine' },
      { ID: 'WI-1027', Title: 'Kubelet node drain script timeout fix', Priority: 'medium', Status: 'completed', Confidence: '91%', InferredBy: 'Git Hook' },
    ],
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  }
];

let localSheets: SheetDataset[] = loadPersistedState(STORAGE_KEYS.SHEETS_DATASETS, defaultSheets);

const persistSheets = () => {
  savePersistedState(STORAGE_KEYS.SHEETS_DATASETS, localSheets);
};

export const fetchSheetDataset = async (spreadsheetId?: string): Promise<SheetDataset> => {
  const token = await getAccessToken();
  const targetId = spreadsheetId || localSheets[0].spreadsheetId;

  if (token && targetId && !targetId.startsWith('sheet_')) {
    try {
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetId}?fields=properties.title,sheets.properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const sheetTitle = meta.sheets?.[0]?.properties?.title || 'Sheet1';
        const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (valuesRes.ok) {
          const valData = await valuesRes.json();
          const rawRows: string[][] = valData.values || [];
          if (rawRows.length > 0) {
            const columns = rawRows[0];
            const rows = rawRows.slice(1).map(row => {
              const rowObj: SheetRowData = {};
              columns.forEach((col, idx) => {
                rowObj[col] = row[idx] !== undefined ? row[idx] : '';
              });
              return rowObj;
            });
            return {
              spreadsheetId: targetId,
              title: meta.properties.title,
              sheetName: sheetTitle,
              columns,
              rows,
              updatedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (err) {
      console.warn('Live Sheets API error, using local dataset:', err);
    }
  }

  const found = localSheets.find(s => s.spreadsheetId === targetId);
  return found || localSheets[0];
};

export const appendSheetRow = async (spreadsheetId: string, rowData: SheetRowData): Promise<void> => {
  const token = await getAccessToken();
  if (token && !spreadsheetId.startsWith('sheet_')) {
    try {
      const values = [Object.values(rowData)];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });
    } catch (err) {
      console.warn('Live Sheets append row error:', err);
    }
  }

  const sheet = localSheets.find(s => s.spreadsheetId === spreadsheetId);
  if (sheet) {
    sheet.rows.push(rowData);
    sheet.updatedAt = new Date().toISOString();
    persistSheets();
  }
};
