import React, { useState, useEffect } from 'react';
import { 
  fetchKeepNotes, 
  createKeepNote, 
  toggleChecklistItem, 
  deleteKeepNote 
} from '../../services/workspace/keepApi';
import { createGoogleDoc } from '../../services/workspace/docsApi';
import { KeepNoteItem } from '../../runtime/runtimeTypes';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { adaptKeepNoteToWorkspaceResource } from '../../runtime/resourceAdapters';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { ConfirmationDialog } from '../../runtime/primitives/Dialogs';
import { GoogleAuthBar } from './GoogleAuthBar';
import { WorkspaceBulkActions } from './primitives/WorkspaceBulkActions';
import { WorkspaceActionBar } from './primitives/WorkspaceActionBar';
import { 
  StickyNote, 
  Plus, 
  Pin, 
  Trash2, 
  CheckSquare, 
  Square, 
  FileText, 
  RefreshCw,
  Search,
  Check,
  Link2
} from 'lucide-react';

export interface KeepSurfaceProps {
  onPromoteToWorkItem?: (note: KeepNoteItem) => void;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
}

export const KeepSurface: React.FC<KeepSurfaceProps> = ({ 
  onPromoteToWorkItem,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onNavigateToWorkItem,
}) => {
  const [notes, setNotes] = useState<KeepNoteItem[]>([]);
  const [checkedResources, setCheckedResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<KeepNoteItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklistItemsRaw, setChecklistItemsRaw] = useState('');
  const [newColor, setNewColor] = useState<'default' | 'amber' | 'cyan' | 'emerald' | 'rose' | 'purple'>('amber');
  const [newLabels, setNewLabels] = useState('');

  // Export to Docs state
  const [exportingDocNote, setExportingDocNote] = useState<KeepNoteItem | null>(null);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const items = await fetchKeepNotes();
      setNotes(items);
      telemetry.record('resource_loaded', {
        provider: 'keep',
        durationMs: Math.round(performance.now() - startTime),
        details: { count: items.length },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (noteId: string, itemId: string) => {
    await toggleChecklistItem(noteId, itemId);
    setNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          checklistItems: n.checklistItems.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
        };
      }
      return n;
    }));
  };

  const handleCreateNote = async () => {
    if (!newTitle) return;
    setIsLoading(true);
    try {
      const items = isChecklist
        ? checklistItemsRaw
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean)
            .map((text, idx) => ({ id: `chk_${Date.now()}_${idx}`, text, done: false }))
        : [];

      const labels = newLabels.split(',').map(l => l.trim()).filter(Boolean);

      const created = await createKeepNote({
        title: newTitle,
        content: newContent,
        isChecklist,
        checklistItems: items,
        color: newColor,
        isPinned: false,
        labels,
      });

      setNotes(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setChecklistItemsRaw('');
      setIsChecklist(false);
      setNewLabels('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteKeepNote(noteToDelete.id);
      setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
      setCheckedResources(prev => prev.filter(r => r.id !== noteToDelete.id));
      setNoteToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmExportToDocs = async () => {
    if (!exportingDocNote) return;
    setIsExporting(true);
    try {
      const body = exportingDocNote.isChecklist
        ? exportingDocNote.checklistItems.map(i => `[${i.done ? 'X' : ' '}] ${i.text}`).join('\n')
        : exportingDocNote.content;

      await createGoogleDoc(`Keep Note: ${exportingDocNote.title}`, body);
      setShowExportConfirmation(false);
      setExportingDocNote(null);
    } finally {
      setIsExporting(false);
    }
  };

  const getColorClasses = (color: KeepNoteItem['color']) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-950/30 border-amber-800/70 text-amber-200';
      case 'cyan':
        return 'bg-cyan-950/30 border-cyan-800/70 text-cyan-200';
      case 'emerald':
        return 'bg-emerald-950/30 border-emerald-800/70 text-emerald-200';
      case 'rose':
        return 'bg-rose-950/30 border-rose-800/70 text-rose-200';
      case 'purple':
        return 'bg-purple-950/30 border-purple-800/70 text-purple-200';
      default:
        return 'bg-[#0c101d] border-slate-800 text-slate-200';
    }
  };

  const filteredNotes = notes.filter(n => 
    !search || 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.labels.some(l => l.toLowerCase().includes(search.toLowerCase()))
  );

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
        <GoogleAuthBar onAuthChange={() => loadNotes()} />
      </div>

      {/* Surface Header & Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Google Keep Operational Notes & Checklists
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/80 text-amber-300 font-normal">
                {notes.length} notes
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage operational scratchpads, checklists, and sync notes into Google Docs or Aftergraph Work Items
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
            New Note / Checklist
          </InHouseButton>
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadNotes()}
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
            placeholder="Search notes, checklists, or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading && notes.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notes from Keep...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No notes found matching search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => {
              const res = adaptKeepNoteToWorkspaceResource(note);
              const isChecked = checkedResources.some(r => r.id === res.id);

              return (
                <div
                  key={note.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all shadow-xs relative group ${getColorClasses(note.color)} ${
                    isChecked ? 'ring-2 ring-cyan-400' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCheck(res)}
                          className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                        >
                          {isChecked ? (
                            <div className="w-3.5 h-3.5 rounded bg-cyan-500 flex items-center justify-center text-slate-950">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-3.5 h-3.5 rounded border border-slate-600 hover:border-slate-400" />
                          )}
                        </button>
                        <h3 className="text-xs font-bold text-slate-100">{note.title}</h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {note.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        )}
                        <button
                          onClick={() => setNoteToDelete(note)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Checklist vs Plain Content */}
                    {note.isChecklist ? (
                      <div className="space-y-1.5 my-3">
                        {note.checklistItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => handleToggle(note.id, item.id)}
                            className="flex items-start gap-2 text-xs cursor-pointer select-none group/item"
                          >
                            {item.done ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 group-hover/item:text-slate-300 shrink-0 mt-0.5" />
                            )}
                            <span className={`${item.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 my-2 leading-relaxed whitespace-pre-wrap font-sans">
                        {note.content}
                      </p>
                    )}

                    {/* Labels / Tags */}
                    {note.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.labels.map((lbl, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-slate-400 font-mono">
                            #{lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-800/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">
                          {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {note.linkedWorkItemId && onNavigateToWorkItem && (
                          <button
                            type="button"
                            onClick={() => onNavigateToWorkItem(note.linkedWorkItemId!)}
                            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-1 py-0.5 rounded border border-cyan-800/60"
                          >
                            <Link2 className="w-2.5 h-2.5" />
                            {note.linkedWorkItemId}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setExportingDocNote(note);
                          setShowExportConfirmation(true);
                        }}
                        className="p-1 px-1.5 rounded bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Export note into a new Google Doc"
                      >
                        <FileText className="w-2.5 h-2.5 text-indigo-400" />
                        <span>To Doc</span>
                      </button>
                    </div>

                    <WorkspaceActionBar
                      resource={res}
                      size="sm"
                      onCreateWorkItem={r => {
                        if (onCreateWorkItem) onCreateWorkItem(r);
                        else if (onPromoteToWorkItem) onPromoteToWorkItem(note);
                      }}
                      onAttachEvidence={onAttachEvidence}
                      onLinkWorkItem={onLinkWorkItem}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Multi-Select Bulk Actions */}
      <WorkspaceBulkActions
        selectedResources={checkedResources}
        onClearSelection={() => setCheckedResources([])}
        onBatchCreateWork={resources => {
          resources.forEach(r => {
            if (onCreateWorkItem) onCreateWorkItem(r);
            else if (onPromoteToWorkItem) {
              const raw = notes.find(n => n.id === r.id);
              if (raw) onPromoteToWorkItem(raw);
            }
          });
          setCheckedResources([]);
        }}
        onBatchAttachEvidence={resources => {
          resources.forEach(r => onAttachEvidence && onAttachEvidence(r));
          setCheckedResources([]);
        }}
      />

      {/* New Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1424] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              Create Keep Note or Checklist
            </h2>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Title</label>
              <input
                type="text"
                placeholder="e.g. Sprint 34 Production Handoff Checklist"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isChecklistToggle"
                checked={isChecklist}
                onChange={e => setIsChecklist(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-cyan-500 focus:ring-0"
              />
              <label htmlFor="isChecklistToggle" className="text-xs text-slate-300 cursor-pointer">
                Create as Interactive Checklist
              </label>
            </div>

            {isChecklist ? (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Checklist Items (one per line)</label>
                <textarea
                  rows={4}
                  placeholder={`Verify KMS Key rotation\nCheck staging canary latency\nUpdate Linear ticket`}
                  value={checklistItemsRaw}
                  onChange={e => setChecklistItemsRaw(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Note Content</label>
                <textarea
                  rows={4}
                  placeholder="Notes, observed anomalies, or quick ideas..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Labels (comma-separated)</label>
              <input
                type="text"
                placeholder="Operations, Security, Sprint 34"
                value={newLabels}
                onChange={e => setNewLabels(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Color Accent</label>
              <div className="flex items-center gap-2">
                {(['amber', 'cyan', 'emerald', 'rose', 'purple', 'default'] as const).map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewColor(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      col === 'amber' ? 'bg-amber-500' :
                      col === 'cyan' ? 'bg-cyan-500' :
                      col === 'emerald' ? 'bg-emerald-500' :
                      col === 'rose' ? 'bg-rose-500' :
                      col === 'purple' ? 'bg-purple-500' : 'bg-slate-700'
                    } ${newColor === col ? 'scale-110 border-white ring-2 ring-cyan-400' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <InHouseButton variant="quiet" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </InHouseButton>
              <InHouseButton
                variant="primary"
                size="sm"
                disabled={!newTitle}
                onClick={handleCreateNote}
              >
                Create Note
              </InHouseButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Keep Note */}
      <ConfirmationDialog
        isOpen={!!noteToDelete}
        title="Delete Google Keep Note?"
        description={`You are about to delete "${noteToDelete?.title}".`}
        impactWarning="This removes the note or checklist permanently."
        affectedCount={1}
        affectedItemNames={noteToDelete ? [noteToDelete.title] : []}
        confirmLabel="Confirm & Delete"
        cancelLabel="Keep Note"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNoteToDelete(null)}
      />

      {/* Confirmation Dialog for Exporting Note to Google Doc */}
      <ConfirmationDialog
        isOpen={showExportConfirmation}
        title="Export Note to Google Doc?"
        description={`This will generate a new document in Google Docs titled "Keep Note: ${exportingDocNote?.title}".`}
        impactWarning="A new document will be created in your Google Drive."
        affectedCount={1}
        affectedItemNames={exportingDocNote ? [exportingDocNote.title] : []}
        confirmLabel="Confirm & Export"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isExporting}
        onConfirm={handleConfirmExportToDocs}
        onCancel={() => setShowExportConfirmation(false)}
      />
    </div>
  );
};
