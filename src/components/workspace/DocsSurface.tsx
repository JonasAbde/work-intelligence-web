import React, { useState, useEffect } from 'react';
import { 
  fetchDocs, 
  createGoogleDoc 
} from '../../services/workspace/docsApi';
import { DocDocumentItem } from '../../runtime/runtimeTypes';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { adaptDocItemToWorkspaceResource } from '../../runtime/resourceAdapters';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { ConfirmationDialog } from '../../runtime/primitives/Dialogs';
import { GoogleAuthBar } from './GoogleAuthBar';
import { WorkspaceResourceRow } from './primitives/WorkspaceResourceRow';
import { WorkspaceBulkActions } from './primitives/WorkspaceBulkActions';
import { WorkspaceActionBar } from './primitives/WorkspaceActionBar';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { WorkspaceEvidenceLink } from './primitives/WorkspaceEvidenceLink';
import { WorkspaceSyncState } from './primitives/WorkspaceSyncState';
import { WorkspacePermissionState } from './primitives/WorkspacePermissionState';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  RefreshCw, 
  Search
} from 'lucide-react';

export interface DocsSurfaceProps {
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
}

export const DocsSurface: React.FC<DocsSurfaceProps> = ({
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onNavigateToWorkItem,
}) => {
  const [docs, setDocs] = useState<DocDocumentItem[]>([]);
  const [selectedResource, setSelectedResource] = useState<WorkspaceResource | null>(null);
  const [checkedResources, setCheckedResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const items = await fetchDocs();
      setDocs(items);
      const adapted = items.map(adaptDocItemToWorkspaceResource);
      if (adapted.length > 0 && !selectedResource) {
        setSelectedResource(adapted[0]);
      }
      telemetry.record('resource_loaded', {
        provider: 'docs',
        durationMs: Math.round(performance.now() - startTime),
        details: { count: items.length },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!newTitle) return;
    setIsCreating(true);
    try {
      const doc = await createGoogleDoc(newTitle, newContent);
      setDocs(prev => [doc, ...prev]);
      const res = adaptDocItemToWorkspaceResource(doc);
      setSelectedResource(res);
      setShowCreateConfirmation(false);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredDocs = docs.filter(d => 
    !search || d.title.toLowerCase().includes(search.toLowerCase())
  );

  const adaptedResources = filteredDocs.map(adaptDocItemToWorkspaceResource);

  const toggleCheck = (res: WorkspaceResource) => {
    setCheckedResources(prev => {
      const exists = prev.some(r => r.id === res.id);
      if (exists) return prev.filter(r => r.id !== res.id);
      return [...prev, res];
    });
  };

  // Find currently selected doc raw item for full section rendering
  const currentDocItem = docs.find(d => d.id === selectedResource?.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Google Auth Status Banner */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]">
        <GoogleAuthBar onAuthChange={() => loadDocs()} />
      </div>

      {/* Surface Header & Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Google Docs Operational Specifications
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800/80 text-indigo-300 font-normal">
                {docs.length} documents
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Synchronize architectural specifications, decision audits, and postmortem records with Google Docs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InHouseButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            New Google Doc
          </InHouseButton>
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadDocs()}
            loading={isLoading}
          >
            Refresh
          </InHouseButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-800/80 overflow-y-auto p-3 space-y-1">
          {isLoading && docs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading documents from Google Docs...</div>
          ) : adaptedResources.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No documents found.</div>
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
                onAttachEvidence={onAttachEvidence}
                onLinkWorkItem={onLinkWorkItem}
                onNavigateToWorkItem={onNavigateToWorkItem}
              />
            ))
          )}
        </div>

        {/* Document Reader Pane */}
        <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-6 bg-[#090d16]">
          {selectedResource ? (
            <div className="max-w-2xl space-y-6">
              <div className="p-5 rounded-2xl bg-[#0c101d] border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <WorkspaceSource provider="docs" kind="document" />
                      <span className="font-mono text-[11px] text-slate-400">{selectedResource.id}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-100">{selectedResource.title}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Author: {selectedResource.actor?.name || 'Self'}</span>
                      <span>•</span>
                      <span>
                        Modified: {selectedResource.modifiedAt ? new Date(selectedResource.modifiedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>

                  {selectedResource.provenanceUri && (
                    <a
                      href={selectedResource.provenanceUri}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open in Docs</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <WorkspaceSyncState state="saved" />
                    <WorkspacePermissionState permissions={selectedResource.permissions} showDetails />
                  </div>
                  {selectedResource.evidenceHash && (
                    <WorkspaceEvidenceLink
                      hash={selectedResource.evidenceHash}
                      sourceUri={selectedResource.provenanceUri}
                    />
                  )}
                </div>

                {/* Action Bar */}
                <div className="pt-2 border-t border-slate-800/80">
                  <WorkspaceActionBar
                    resource={selectedResource}
                    size="md"
                    onCreateWorkItem={onCreateWorkItem}
                    onAttachEvidence={onAttachEvidence}
                    onLinkWorkItem={onLinkWorkItem}
                  />
                </div>
              </div>

              {/* Document Sections */}
              <div className="space-y-4">
                {currentDocItem?.sections ? (
                  currentDocItem.sections.map((section, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-[#0c101d] border border-slate-800/80 space-y-2">
                      {section.heading && (
                        <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                          {section.heading}
                        </h3>
                      )}
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                        {section.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-5 rounded-2xl bg-[#0c101d] border border-slate-800/80 text-xs text-slate-300">
                    {selectedResource.summary}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 my-auto">Select a document to read contents</div>
          )}
        </div>
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

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1424] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Create New Google Doc
            </h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Incident 409 Postmortem & Resolution Architecture"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Initial Draft Content</label>
              <textarea
                rows={5}
                placeholder="Write the initial specification or audit outline..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <InHouseButton variant="quiet" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </InHouseButton>
              <InHouseButton
                variant="primary"
                size="sm"
                disabled={!newTitle}
                onClick={() => setShowCreateConfirmation(true)}
              >
                Review & Create...
              </InHouseButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Creating Google Doc */}
      <ConfirmationDialog
        isOpen={showCreateConfirmation}
        title="Create New Google Doc?"
        description={`This will generate a new document titled "${newTitle}" in your Google Drive.`}
        impactWarning="A new Google Doc will be allocated and linked into your workspace account."
        affectedCount={1}
        affectedItemNames={[newTitle]}
        confirmLabel="Confirm & Create Doc"
        cancelLabel="Keep Editing"
        isDestructive={false}
        isLoading={isCreating}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowCreateConfirmation(false)}
      />
    </div>
  );
};
