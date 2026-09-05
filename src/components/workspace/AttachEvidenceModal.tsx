import React, { useState } from 'react';
import { WorkItem } from '../../types';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { PriorityBadge, StatusBadge } from '../ui/StatusBadge';
import { 
  X, 
  Search, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  FileText,
  Link2
} from 'lucide-react';

export interface AttachEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: WorkspaceResource | null;
  workItems: WorkItem[];
  onSelectWorkItem: (targetItem: WorkItem, resource: WorkspaceResource) => void;
  onCreateNewWithEvidence: (resource: WorkspaceResource) => void;
}

export const AttachEvidenceModal: React.FC<AttachEvidenceModalProps> = ({
  isOpen,
  onClose,
  resource,
  workItems,
  onSelectWorkItem,
  onCreateNewWithEvidence,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen || !resource) return null;

  const filteredItems = workItems.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c101d] border border-slate-700/90 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#090d16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-800 text-cyan-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Bind Workspace Evidence
              </h2>
              <p className="text-xs text-slate-400">
                Select target Work Item to anchor provenance from this resource
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Resource Preview Ribbon */}
        <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <WorkspaceSource provider={resource.provider} kind={resource.kind} size="sm" />
            <span className="font-semibold text-slate-200 truncate">{resource.title}</span>
          </div>
          {resource.evidenceHash && (
            <span className="shrink-0 flex items-center gap-1 font-mono text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3" />
              {resource.evidenceHash.slice(0, 18)}...
            </span>
          )}
        </div>

        {/* Search & Actions Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-[#090d16]/60 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search active work items by title, ID, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <InHouseButton
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => {
              onCreateNewWithEvidence(resource);
              onClose();
            }}
          >
            New Work Item
          </InHouseButton>
        </div>

        {/* Work Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <FileText className="w-8 h-8 text-slate-600 mx-auto stroke-1" />
              <p>No work items found matching "{search}".</p>
              <InHouseButton
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  onCreateNewWithEvidence(resource);
                  onClose();
                }}
              >
                Create New Work Item From This Resource
              </InHouseButton>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectWorkItem(item, resource);
                  onClose();
                }}
                className="group p-3.5 rounded-xl border border-slate-800/80 bg-[#0c101d] hover:bg-slate-900/80 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] text-cyan-400 font-semibold">{item.id}</span>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-200 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    {item.evidence.length} proofs
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-300 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#090d16] flex items-center justify-between text-xs text-slate-500">
          <span>{workItems.length} active work items in backlog</span>
          <button
            onClick={onClose}
            className="hover:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
