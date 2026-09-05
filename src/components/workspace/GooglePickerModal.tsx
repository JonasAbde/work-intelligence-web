import React, { useState, useEffect } from 'react';
import { 
  openGooglePicker, 
  PickedFileResult 
} from '../../services/workspace/pickerService';
import { 
  WorkspaceResource, 
  PickerIntent, 
  WorkspaceProvider 
} from '../../runtime/workspaceResource';
import { workspaceRuntime } from '../../runtime/workspaceService';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { WorkspacePermissionState } from './primitives/WorkspacePermissionState';
import { WorkspaceEvidenceLink } from './primitives/WorkspaceEvidenceLink';
import { 
  HardDrive, 
  Search, 
  X, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CheckSquare, 
  Square 
} from 'lucide-react';

export interface GooglePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: { id: string; name: string; mimeType: string; webViewLink?: string; resource?: WorkspaceResource }) => void;
  onBatchSelect?: (resources: WorkspaceResource[]) => void;
  title?: string;
  intent?: PickerIntent;
  allowedTypes?: 'all' | 'docs' | 'sheets' | 'files';
  multiSelect?: boolean;
}

export const GooglePickerModal: React.FC<GooglePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onBatchSelect,
  title,
  intent = 'attach_evidence',
  allowedTypes = 'all',
  multiSelect = false,
}) => {
  const [resources, setResources] = useState<WorkspaceResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<WorkspaceResource | null>(null);
  const [checkedItems, setCheckedItems] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<WorkspaceProvider | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      telemetry.record('picker_opened', { details: { intent } });
      loadResources();
    }
  }, [isOpen, intent]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const all = await workspaceRuntime.loadAllResources();
      const prioritized = workspaceRuntime.getResourcesForIntent(intent, all);
      setResources(prioritized);
      if (prioritized.length > 0 && !selectedItem) {
        setSelectedItem(prioritized[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativePicker = async () => {
    const success = await openGooglePicker((picked: PickedFileResult) => {
      telemetry.record('picker_selected', { details: { mode: 'native', fileId: picked.id } });
      onSelect({
        id: picked.id,
        name: picked.name,
        mimeType: picked.mimeType,
        webViewLink: picked.url,
      });
      onClose();
    });
    if (!success) {
      console.log('Opened in-house picker modal fallback');
    }
  };

  const handleClose = () => {
    telemetry.record('picker_abandoned', { details: { intent } });
    onClose();
  };

  if (!isOpen) return null;

  const filtered = resources.filter(item => {
    if (activeProvider !== 'all' && item.provider !== activeProvider) {
      return false;
    }
    if (allowedTypes === 'docs' && item.kind !== 'document') return false;
    if (allowedTypes === 'sheets' && item.kind !== 'spreadsheet') return false;
    if (allowedTypes === 'files' && !['file', 'document', 'spreadsheet'].includes(item.kind)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q) || false;
      const matchSum = item.summary?.toLowerCase().includes(q) || false;
      return matchTitle || matchSub || matchSum;
    }
    return true;
  });

  const toggleCheck = (res: WorkspaceResource) => {
    setCheckedItems(prev => {
      const exists = prev.some(r => r.id === res.id);
      if (exists) return prev.filter(r => r.id !== res.id);
      return [...prev, res];
    });
  };

  const getIntentMeta = () => {
    switch (intent) {
      case 'attach_evidence':
        return {
          badge: 'Evidence Extraction Mode',
          headline: title || 'Select Google Artifact as Cryptographic Evidence',
          subtitle: 'Prioritizing audited Docs, Sheets data ranges, and verified communication records.',
          actionLabel: multiSelect && checkedItems.length > 1 ? `Attach ${checkedItems.length} Evidence Items` : 'Attach Evidence',
        };
      case 'schedule_work':
        return {
          badge: 'Calendar Integration Mode',
          headline: title || 'Select Calendar Event or Milestone',
          subtitle: 'Link release gates, standby reviews, and operational timelines to Work Items.',
          actionLabel: 'Link Calendar Event',
        };
      case 'link_communication':
        return {
          badge: 'Communication Ingest Mode',
          headline: title || 'Select Inbound Gmail Thread',
          subtitle: 'Extract stakeholder requests and generate validated delivery specs.',
          actionLabel: 'Ingest Communication',
        };
      case 'source_material':
        return {
          badge: 'Source Repository Mode',
          headline: title || 'Select Source Specifications & Spreadsheets',
          subtitle: 'Load reference documents and structured datasets into execution scope.',
          actionLabel: 'Select Source Material',
        };
      default:
        return {
          badge: 'Universal Workspace Picker',
          headline: title || 'Select Google Workspace Artifact',
          subtitle: 'Cross-service resource selector with cryptographic provenance.',
          actionLabel: 'Select Resource',
        };
    }
  };

  const intentMeta = getIntentMeta();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl bg-[#0c111f] border border-slate-700/80 shadow-2xl flex flex-col h-[600px] overflow-hidden text-slate-100">
        {/* Header with intent banner */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100">{intentMeta.headline}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300">
                  {intentMeta.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{intentMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InHouseButton 
              variant="contextual" 
              size="sm" 
              icon={Sparkles}
              onClick={handleNativePicker}
              title="Launch official Google Picker popup window"
            >
              Native Google Picker
            </InHouseButton>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Provider Filter Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search across all Workspace services..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs overflow-x-auto self-start sm:self-auto pb-1 sm:pb-0">
            {(['all', 'drive', 'docs', 'sheets', 'gmail', 'calendar', 'keep'] as const).map(p => (
              <button
                key={p}
                onClick={() => setActiveProvider(p)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeProvider === p
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Content Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* List Pane */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 border-r border-slate-800/80">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Querying Workspace resources...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No resources found matching filter criteria.</div>
            ) : (
              filtered.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const isChecked = checkedItems.some(r => r.id === item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-slate-100 shadow-xs'
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {multiSelect && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleCheck(item);
                          }}
                          className="text-slate-400 hover:text-cyan-300 p-0.5 rounded cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <WorkspaceSource provider={item.provider} kind={item.kind} size="sm" />

                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate flex items-center gap-2">
                          <span className="truncate">{item.title}</span>
                          {item.evidenceHash && (
                            <span className="shrink-0 text-[10px] font-mono text-cyan-400">
                              [Proof]
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                          {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                          {item.actor && <span>• {item.actor.name}</span>}
                          {item.modifiedAt && (
                            <span>• {new Date(item.modifiedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <WorkspacePermissionState permissions={item.permissions} />
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inspector Preview Pane */}
          <div className="w-72 sm:w-80 p-4 bg-slate-900/40 flex flex-col justify-between overflow-y-auto text-xs">
            {selectedItem ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
                    Selected Artifact
                  </span>
                  <h3 className="text-xs font-semibold text-slate-200 mt-1 break-words">
                    {selectedItem.title}
                  </h3>
                  {selectedItem.subtitle && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedItem.subtitle}</p>
                  )}
                </div>

                <div className="space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span>Provider:</span>
                    <span className="text-slate-300 font-mono capitalize">{selectedItem.provider}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span>Kind:</span>
                    <span className="text-slate-300 font-mono capitalize">{selectedItem.kind}</span>
                  </div>
                  {selectedItem.modifiedAt && (
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span>Modified:</span>
                      <span className="text-slate-300">{new Date(selectedItem.modifiedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedItem.actor && (
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span>Actor:</span>
                      <span className="text-slate-300 truncate max-w-[140px]">{selectedItem.actor.name}</span>
                    </div>
                  )}
                </div>

                {selectedItem.summary && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-h-28 overflow-y-auto">
                    {selectedItem.summary}
                  </div>
                )}

                {selectedItem.evidenceHash && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Verification Hash
                    </span>
                    <WorkspaceEvidenceLink hash={selectedItem.evidenceHash} />
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-[11px] text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Registering this artifact attaches a verifiable SHA-256 fingerprint into the Aftergraph audit graph.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 my-auto">Select an artifact to preview</div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <InHouseButton variant="quiet" size="sm" onClick={handleClose}>
                Cancel
              </InHouseButton>
              <InHouseButton
                variant="primary"
                size="sm"
                disabled={!selectedItem && checkedItems.length === 0}
                onClick={() => {
                  if (multiSelect && checkedItems.length > 0 && onBatchSelect) {
                    telemetry.record('picker_selected', { details: { count: checkedItems.length } });
                    onBatchSelect(checkedItems);
                    onClose();
                  } else if (selectedItem) {
                    telemetry.record('picker_selected', { details: { resourceId: selectedItem.id } });
                    onSelect({
                      id: (selectedItem.metadata?.rawId as string) || selectedItem.id,
                      name: selectedItem.title,
                      mimeType: (selectedItem.metadata?.mimeType as string) || 'application/octet-stream',
                      webViewLink: selectedItem.provenanceUri,
                      resource: selectedItem,
                    });
                    onClose();
                  }
                }}
              >
                {intentMeta.actionLabel}
              </InHouseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
