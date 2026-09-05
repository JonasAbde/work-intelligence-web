import React, { useState, useEffect } from 'react';
import { 
  fetchSheetDataset, 
  appendSheetRow 
} from '../../services/workspace/sheetsApi';
import { SheetDataset, SheetRowData } from '../../runtime/runtimeTypes';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { adaptSheetDatasetToWorkspaceResource } from '../../runtime/resourceAdapters';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { ConfirmationDialog } from '../../runtime/primitives/Dialogs';
import { GoogleAuthBar } from './GoogleAuthBar';
import { WorkspaceActionBar } from './primitives/WorkspaceActionBar';
import { WorkspaceEvidenceLink } from './primitives/WorkspaceEvidenceLink';
import { WorkspaceSyncState } from './primitives/WorkspaceSyncState';
import { WorkspacePermissionState } from './primitives/WorkspacePermissionState';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  ArrowUpDown, 
  RefreshCw
} from 'lucide-react';

export interface SheetsSurfaceProps {
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
}

export const SheetsSurface: React.FC<SheetsSurfaceProps> = ({
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
}) => {
  const [dataset, setDataset] = useState<SheetDataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState('sheet_core_metrics_01');

  // Append Row Form
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [newRowValues, setNewRowValues] = useState<SheetRowData>({});
  const [showAppendConfirmation, setShowAppendConfirmation] = useState(false);
  const [isAppending, setIsAppending] = useState(false);

  useEffect(() => {
    loadSheet(activeSpreadsheetId);
  }, [activeSpreadsheetId]);

  const loadSheet = async (id: string) => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const data = await fetchSheetDataset(id);
      setDataset(data);
      const initRow: SheetRowData = {};
      data.columns.forEach(c => { initRow[c] = ''; });
      setNewRowValues(initRow);
      telemetry.record('resource_loaded', {
        provider: 'sheets',
        durationMs: Math.round(performance.now() - startTime),
        details: { rowCount: data.rows.length },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const handleConfirmAppend = async () => {
    if (!dataset) return;
    setIsAppending(true);
    try {
      await appendSheetRow(dataset.spreadsheetId, newRowValues);
      setShowAppendConfirmation(false);
      setShowAppendModal(false);
      await loadSheet(dataset.spreadsheetId);
    } finally {
      setIsAppending(false);
    }
  };

  const filteredRows = (dataset?.rows || []).filter(row => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(row).some(val => String(val).toLowerCase().includes(q));
  }).sort((a, b) => {
    if (!sortCol) return 0;
    const valA = a[sortCol];
    const valB = b[sortCol];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc 
      ? String(valA).localeCompare(String(valB)) 
      : String(valB).localeCompare(String(valA));
  });

  const currentResource: WorkspaceResource | null = dataset
    ? adaptSheetDatasetToWorkspaceResource(dataset)
    : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Google Auth Status Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]">
        <GoogleAuthBar onAuthChange={() => loadSheet(activeSpreadsheetId)} />
      </div>

      {/* Surface Header & Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Google Sheets Live Metric Grid
              {dataset && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 font-normal">
                  {dataset.sheetName} ({dataset.rows.length} rows)
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              Synchronize operational SLO telemetry and discovered work item backlogs in real time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Spreadsheet Selector */}
          <select
            value={activeSpreadsheetId}
            onChange={e => setActiveSpreadsheetId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="sheet_core_metrics_01">Core System Health & Latency Metrics</option>
            <option value="sheet_work_backlog_02">Aftergraph Autonomous Backlog Export</option>
          </select>

          <InHouseButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowAppendModal(true)}
          >
            Append Row
          </InHouseButton>
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadSheet(activeSpreadsheetId)}
            loading={isLoading}
          >
            Refresh
          </InHouseButton>
        </div>
      </div>

      {/* Action and Provenance Ribbon */}
      {currentResource && (
        <div className="px-4 py-2 border-b border-slate-800 bg-[#0c101d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <WorkspaceSyncState state="saved" />
            <WorkspacePermissionState permissions={currentResource.permissions} />
            {currentResource.evidenceHash && (
              <WorkspaceEvidenceLink hash={currentResource.evidenceHash} confidence={0.99} />
            )}
          </div>

          <WorkspaceActionBar
            resource={currentResource}
            size="sm"
            onCreateWorkItem={onCreateWorkItem}
            onAttachEvidence={onAttachEvidence}
            onLinkWorkItem={onLinkWorkItem}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search spreadsheet cells..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {dataset && (
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Last synced: {new Date(dataset.updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* In-House Tabular Grid Component */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && !dataset ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading spreadsheet data from Google Sheets...</div>
        ) : !dataset ? (
          <div className="p-12 text-center text-xs text-slate-500">No sheet data available.</div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0c101d] shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-slate-500 w-12 text-center">#</th>
                  {dataset.columns.map(col => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-300 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col}</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortCol === col ? 'text-cyan-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-2 px-3 text-slate-500 text-center font-mono">{idx + 1}</td>
                    {dataset.columns.map(col => {
                      const val = row[col];
                      const isStatus = String(val).toUpperCase() === 'HEALTHY' || String(val).toUpperCase() === 'MONITORING';
                      return (
                        <td key={col} className="py-2 px-3 text-slate-200">
                          {isStatus ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              String(val).toUpperCase() === 'HEALTHY' 
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                            }`}>
                              {String(val)}
                            </span>
                          ) : (
                            String(val ?? '')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Append Row Modal */}
      {showAppendModal && dataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1424] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 max-h-[85vh] overflow-y-auto">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Append New Record to {dataset.title}
            </h2>

            <div className="space-y-3">
              {dataset.columns.map(col => (
                <div key={col}>
                  <label className="text-xs text-slate-400 block mb-1 font-mono">{col}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${col}...`}
                    value={String(newRowValues[col] ?? '')}
                    onChange={e => setNewRowValues({ ...newRowValues, [col]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <InHouseButton variant="quiet" size="sm" onClick={() => setShowAppendModal(false)}>
                Cancel
              </InHouseButton>
              <InHouseButton
                variant="primary"
                size="sm"
                onClick={() => setShowAppendConfirmation(true)}
              >
                Review & Append...
              </InHouseButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Appending Row to Sheet */}
      <ConfirmationDialog
        isOpen={showAppendConfirmation}
        title="Append Row to Google Sheet?"
        description={`This will write a new entry to the sheet "${dataset?.title}".`}
        impactWarning="Changes are written directly to your cloud spreadsheet and will be immediately visible to all viewers and connected dashboards."
        affectedCount={1}
        affectedItemNames={Object.entries(newRowValues).map(([k, v]) => `${k}: ${v}`)}
        confirmLabel="Confirm & Write Row"
        cancelLabel="Keep Editing"
        isDestructive={false}
        isLoading={isAppending}
        onConfirm={handleConfirmAppend}
        onCancel={() => setShowAppendConfirmation(false)}
      />
    </div>
  );
};
