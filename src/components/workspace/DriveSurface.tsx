import React, { useState, useEffect } from 'react';
import { 
  fetchDriveFiles, 
  deleteDriveFile, 
  createDriveFile 
} from '../../services/workspace/driveApi';
import { DriveItem } from '../../runtime/runtimeTypes';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { adaptDriveItemToWorkspaceResource } from '../../runtime/resourceAdapters';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { ConfirmationDialog } from '../../runtime/primitives/Dialogs';
import { GooglePickerModal } from './GooglePickerModal';
import { GoogleAuthBar } from './GoogleAuthBar';
import { WorkspaceBreadcrumbs } from './primitives/WorkspaceBreadcrumbs';
import { WorkspaceResourceRow } from './primitives/WorkspaceResourceRow';
import { WorkspaceBulkActions } from './primitives/WorkspaceBulkActions';
import { WorkspaceEvidenceLink } from './primitives/WorkspaceEvidenceLink';
import { WorkspacePermissionState } from './primitives/WorkspacePermissionState';
import { WorkspaceSyncState } from './primitives/WorkspaceSyncState';
import { WorkspaceActionBar } from './primitives/WorkspaceActionBar';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { 
  HardDrive, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  RefreshCw
} from 'lucide-react';

export interface DriveSurfaceProps {
  onAttachToWorkItem?: (file: DriveItem) => void;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
}

export const DriveSurface: React.FC<DriveSurfaceProps> = ({ 
  onAttachToWorkItem,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onNavigateToWorkItem,
}) => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WorkspaceResource | null>(null);
  const [checkedResources, setCheckedResources] = useState<WorkspaceResource[]>([]);
  const [fileToDelete, setFileToDelete] = useState<DriveItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'doc' | 'sheet' | 'pdf'>('all');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async (q?: string) => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const files = await fetchDriveFiles(q);
      setItems(files);
      const adapted = files.map(adaptDriveItemToWorkspaceResource);
      if (adapted.length > 0 && !selectedResource) {
        setSelectedResource(adapted[0]);
      }
      telemetry.record('resource_loaded', {
        provider: 'drive',
        durationMs: Math.round(performance.now() - startTime),
        details: { count: files.length },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setItems(prev => prev.filter(f => f.id !== fileToDelete.id));
      if (selectedResource?.id === fileToDelete.id) {
        setSelectedResource(null);
      }
      setCheckedResources(prev => prev.filter(r => r.id !== fileToDelete.id));
      setFileToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName) return;
    setIsLoading(true);
    try {
      const created = await createDriveFile(
        newFileName,
        'application/vnd.google-apps.document',
        newFileContent || 'Initial operational notes and specification draft.'
      );
      setItems(prev => [created, ...prev]);
      const res = adaptDriveItemToWorkspaceResource(created);
      setSelectedResource(res);
      setShowNewFileDialog(false);
      setNewFileName('');
      setNewFileContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterType === 'doc') return item.mimeType.includes('document');
    if (filterType === 'sheet') return item.mimeType.includes('spreadsheet');
    if (filterType === 'pdf') return item.mimeType.includes('pdf');
    return true;
  });

  const adaptedResources = filteredItems.map(adaptDriveItemToWorkspaceResource);

  const handleAttachEvidenceCombined = (res: WorkspaceResource) => {
    if (onAttachEvidence) onAttachEvidence(res);
    if (onAttachToWorkItem) {
      const raw = items.find(i => i.id === res.id || `drive-${i.id}` === res.id);
      if (raw) onAttachToWorkItem(raw);
    }
  };

  const toggleCheck = (res: WorkspaceResource) => {
    setCheckedResources(prev => {
      const exists = prev.some(r => r.id === res.id);
      if (exists) return prev.filter(r => r.id !== res.id);
      return [...prev, res];
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Google Auth Status Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]">
        <GoogleAuthBar onAuthChange={() => loadFiles()} />
      </div>

      {/* Surface Header & Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Google Drive Explorer
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950/70 border border-blue-800/80 text-blue-300 font-normal">
                {items.length} artifacts
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Browse, inspect, and link Drive documents directly to Aftergraph operational evidence trails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <InHouseButton
            variant="contextual"
            size="sm"
            icon={Sparkles}
            onClick={() => setShowPickerModal(true)}
          >
            Resource Picker
          </InHouseButton>
          <InHouseButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowNewFileDialog(true)}
          >
            New Document
          </InHouseButton>
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadFiles()}
            loading={isLoading}
          >
            Refresh
          </InHouseButton>
        </div>
      </div>

      {/* Breadcrumbs & Filter Bar */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <WorkspaceBreadcrumbs
          provider="drive"
          items={[
            { id: 'root', label: 'My Drive' },
            { id: 'ops', label: 'Operational Specifications' },
          ]}
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Drive files..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                loadFiles(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs shrink-0">
            {(['all', 'doc', 'sheet', 'pdf'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Files Canonical List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading && items.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading files from Google Drive...</div>
          ) : adaptedResources.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No documents found matching criteria.</div>
          ) : (
            adaptedResources.map(res => (
              <WorkspaceResourceRow
                key={res.id}
                resource={res}
                isSelected={selectedResource?.id === res.id}
                isChecked={checkedResources.some(c => c.id === res.id)}
                onSelect={r => setSelectedResource(r)}
                onToggleCheck={toggleCheck}
                onCreateWorkItem={onCreateWorkItem}
                onAttachEvidence={handleAttachEvidenceCombined}
                onLinkWorkItem={onLinkWorkItem}
                onNavigateToWorkItem={onNavigateToWorkItem}
              />
            ))
          )}
        </div>

        {/* Selected File Details Pane */}
        {selectedResource && (
          <aside className="w-80 border-l border-slate-800/80 bg-[#0c101d] p-4 flex flex-col justify-between overflow-y-auto text-xs">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <WorkspaceSource provider="drive" kind={selectedResource.kind} />
                <h3 className="text-sm font-bold text-slate-100 break-words mt-1">
                  {selectedResource.title}
                </h3>
                {selectedResource.subtitle && (
                  <p className="text-xs text-slate-400 font-mono">{selectedResource.subtitle}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <WorkspaceSyncState state="saved" />
                  <WorkspacePermissionState permissions={selectedResource.permissions} showDetails />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>File ID:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[120px]">
                    {selectedResource.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified:</span>
                  <span className="text-slate-300">
                    {selectedResource.modifiedAt ? new Date(selectedResource.modifiedAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="text-slate-300">{selectedResource.actor?.name || 'Self'}</span>
                </div>
              </div>

              {selectedResource.evidenceHash && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Evidence Hash
                  </span>
                  <WorkspaceEvidenceLink
                    hash={selectedResource.evidenceHash}
                    sourceUri={selectedResource.provenanceUri}
                  />
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-2 border-t border-slate-800/80">
                <WorkspaceActionBar
                  resource={selectedResource}
                  size="md"
                  onCreateWorkItem={onCreateWorkItem}
                  onAttachEvidence={handleAttachEvidenceCombined}
                  onLinkWorkItem={onLinkWorkItem}
                />
              </div>

              {selectedResource.provenanceUri && (
                <a
                  href={selectedResource.provenanceUri}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Open in Google Drive ↗
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <InHouseButton
                variant="destructive"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  const raw = items.find(i => i.id === selectedResource.id);
                  if (raw) setFileToDelete(raw);
                }}
              >
                Delete File...
              </InHouseButton>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Multi-Select Bulk Actions */}
      <WorkspaceBulkActions
        selectedResources={checkedResources}
        onClearSelection={() => setCheckedResources([])}
        onBatchCreateWork={resources => {
          resources.forEach(r => onCreateWorkItem && onCreateWorkItem(r));
          setCheckedResources([]);
        }}
        onBatchAttachEvidence={resources => {
          resources.forEach(r => onAttachEvidence && onAttachEvidence(r));
          setCheckedResources([]);
        }}
      />

      {/* Confirmation Dialog for Deleting Drive File */}
      <ConfirmationDialog
        isOpen={!!fileToDelete}
        title="Delete Google Drive File?"
        description={`You are about to delete "${fileToDelete?.name}" from Google Drive.`}
        impactWarning="Deleting this file removes it permanently from your Google Drive storage and invalidates any linked evidence hashes referencing this artifact."
        affectedCount={1}
        affectedItemNames={fileToDelete ? [fileToDelete.name] : []}
        confirmLabel="Confirm & Delete File"
        cancelLabel="Keep File"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setFileToDelete(null)}
      />

      {/* New Document Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1424] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h2 className="text-sm font-semibold">Create New Specification Document</h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Incident Postmortem & Remediation Plan"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Initial Content Outline</label>
              <textarea
                rows={4}
                placeholder="Key objectives, evidence summary, and proposed policy changes..."
                value={newFileContent}
                onChange={e => setNewFileContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <InHouseButton variant="quiet" size="sm" onClick={() => setShowNewFileDialog(false)}>
                Cancel
              </InHouseButton>
              <InHouseButton variant="primary" size="sm" onClick={handleCreateFile} disabled={!newFileName}>
                Create in Drive
              </InHouseButton>
            </div>
          </div>
        </div>
      )}

      {/* Google Picker Modal */}
      <GooglePickerModal
        isOpen={showPickerModal}
        intent="attach_evidence"
        onClose={() => setShowPickerModal(false)}
        onSelect={picked => {
          if (picked.resource) {
            setSelectedResource(picked.resource);
          }
          loadFiles();
        }}
      />
    </div>
  );
};
