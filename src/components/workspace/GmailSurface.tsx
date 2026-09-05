import React, { useState, useEffect } from 'react';
import { 
  fetchGmailMessages, 
  sendGmailMessage 
} from '../../services/workspace/gmailApi';
import { GmailMessageItem } from '../../runtime/runtimeTypes';
import { WorkspaceResource } from '../../runtime/workspaceResource';
import { adaptGmailMessageToWorkspaceResource } from '../../runtime/resourceAdapters';
import { telemetry } from '../../runtime/telemetry';
import { InHouseButton } from '../../runtime/primitives/Actions';
import { ConfirmationDialog } from '../../runtime/primitives/Dialogs';
import { GoogleAuthBar } from './GoogleAuthBar';
import { WorkspaceResourceRow } from './primitives/WorkspaceResourceRow';
import { WorkspaceBulkActions } from './primitives/WorkspaceBulkActions';
import { WorkspaceEvidenceLink } from './primitives/WorkspaceEvidenceLink';
import { WorkspaceActionBar } from './primitives/WorkspaceActionBar';
import { WorkspaceSource } from './primitives/WorkspaceSource';
import { WorkspacePermissionState } from './primitives/WorkspacePermissionState';
import { WorkspaceSyncState } from './primitives/WorkspaceSyncState';
import { 
  Mail, 
  Send, 
  Search, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Plus,
  ShieldCheck
} from 'lucide-react';

export interface GmailSurfaceProps {
  onPromoteToWorkItem?: (msg: GmailMessageItem) => void;
  onCreateWorkItem?: (resource: WorkspaceResource) => void;
  onAttachEvidence?: (resource: WorkspaceResource) => void;
  onLinkWorkItem?: (resource: WorkspaceResource) => void;
  onNavigateToWorkItem?: (id: string) => void;
}

export const GmailSurface: React.FC<GmailSurfaceProps> = ({ 
  onPromoteToWorkItem,
  onCreateWorkItem,
  onAttachEvidence,
  onLinkWorkItem,
  onNavigateToWorkItem,
}) => {
  const [messages, setMessages] = useState<GmailMessageItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<WorkspaceResource | null>(null);
  const [checkedResources, setCheckedResources] = useState<WorkspaceResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [promotedIds, setPromotedIds] = useState<string[]>([]);

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async (q?: string) => {
    const startTime = performance.now();
    setIsLoading(true);
    try {
      const msgs = await fetchGmailMessages(q);
      setMessages(msgs);
      const adapted = msgs.map(adaptGmailMessageToWorkspaceResource);
      if (adapted.length > 0 && !selectedResource) {
        setSelectedResource(adapted[0]);
      }
      telemetry.record('resource_loaded', {
        provider: 'gmail',
        durationMs: Math.round(performance.now() - startTime),
        details: { count: msgs.length },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      await sendGmailMessage(composeTo, composeSubject, composeBody);
      setShowSendConfirmation(false);
      setShowCompose(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      await loadEmails();
    } finally {
      setIsSending(false);
    }
  };

  const handlePromoteResource = (res: WorkspaceResource) => {
    if (onCreateWorkItem) {
      onCreateWorkItem(res);
      setPromotedIds(prev => [...prev, res.id]);
    } else if (onPromoteToWorkItem) {
      const raw = messages.find(m => m.id === res.id);
      if (raw) {
        onPromoteToWorkItem(raw);
        setPromotedIds(prev => [...prev, res.id]);
      }
    }
  };

  const adaptedResources = messages.map(adaptGmailMessageToWorkspaceResource);

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
        <GoogleAuthBar onAuthChange={() => loadEmails()} />
      </div>

      {/* Surface Header & Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0c101d]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-950/60 border border-red-800 text-red-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Gmail Operational Intent Stream
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/70 border border-red-800/80 text-red-300 font-normal">
                {messages.length} messages
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Observe incoming communications, extract autonomous work items, and send policy-verified updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InHouseButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setComposeTo('');
              setComposeSubject('');
              setComposeBody('');
              setShowCompose(true);
            }}
          >
            Compose Email
          </InHouseButton>
          <InHouseButton
            variant="quiet"
            size="sm"
            icon={RefreshCw}
            onClick={() => loadEmails()}
            loading={isLoading}
          >
            Sync Mail
          </InHouseButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/40">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails or extracted intents..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              loadEmails(e.target.value);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email Message List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-slate-800/80 overflow-y-auto p-2 space-y-1">
          {isLoading && messages.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading messages from Gmail...</div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No emails in inbox.</div>
          ) : (
            adaptedResources.map(res => (
              <WorkspaceResourceRow
                key={res.id}
                resource={res}
                isSelected={selectedResource?.id === res.id}
                isChecked={checkedResources.some(c => c.id === res.id)}
                onSelect={r => setSelectedResource(r)}
                onToggleCheck={toggleCheck}
                onCreateWorkItem={handlePromoteResource}
                onAttachEvidence={onAttachEvidence}
                onLinkWorkItem={onLinkWorkItem}
                onNavigateToWorkItem={onNavigateToWorkItem}
              />
            ))
          )}
        </div>

        {/* Selected Email Detail & Intelligence Analysis */}
        <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-6 bg-[#090d16]">
          {selectedResource ? (
            <div className="max-w-2xl space-y-5">
              {/* Header */}
              <div className="p-4 rounded-2xl bg-[#0c101d] border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <WorkspaceSource provider="gmail" kind="email" />
                      <span className="font-mono text-[11px] text-slate-400">{selectedResource.id}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-100">{selectedResource.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-semibold text-slate-300">{selectedResource.actor?.name}</span>
                      <span className="font-mono text-slate-500">&lt;{selectedResource.actor?.email}&gt;</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400">
                      {selectedResource.modifiedAt ? new Date(selectedResource.modifiedAt).toLocaleString() : ''}
                    </span>
                  </div>
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
              </div>

              {/* Extracted Work Item Candidate (Operational Intelligence UX) */}
              {selectedResource.detectedWork && (
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                        Extracted Work Item Candidate
                      </span>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700 text-cyan-200">
                      Confidence: {Math.round(selectedResource.detectedWork.confidence * 100)}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {selectedResource.detectedWork.suggestedTitle}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {selectedResource.detectedWork.suggestedAction}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-300 block">Provenance Reasoning:</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedResource.detectedWork.reasoning}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <InHouseButton
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      onClick={() => handlePromoteResource(selectedResource)}
                      disabled={promotedIds.includes(selectedResource.id)}
                    >
                      {promotedIds.includes(selectedResource.id)
                        ? 'Promoted to Work Item'
                        : 'Promote to Work Item Queue'}
                    </InHouseButton>
                  </div>
                </div>
              )}

              {/* Email Body */}
              <div className="p-5 rounded-2xl bg-[#0c101d] border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {(selectedResource.metadata?.body as string) || selectedResource.summary}
              </div>

              {/* Contextual Action Bar */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <WorkspaceActionBar
                  resource={selectedResource}
                  size="md"
                  onCreateWorkItem={handlePromoteResource}
                  onAttachEvidence={onAttachEvidence}
                  onLinkWorkItem={onLinkWorkItem}
                  onReply={() => {
                    setComposeTo(selectedResource.actor?.email || '');
                    setComposeSubject(`Re: ${selectedResource.title}`);
                    setComposeBody(`\n\n--- In reply to ---\n${selectedResource.summary}`);
                    setShowCompose(true);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 my-auto">
              Select a message to view content and extracted intelligence
            </div>
          )}
        </div>
      </div>

      {/* Floating Multi-Select Bulk Actions */}
      <WorkspaceBulkActions
        selectedResources={checkedResources}
        onClearSelection={() => setCheckedResources([])}
        onBatchCreateWork={resources => {
          resources.forEach(r => handlePromoteResource(r));
          setCheckedResources([]);
        }}
        onBatchAttachEvidence={resources => {
          resources.forEach(r => onAttachEvidence && onAttachEvidence(r));
          setCheckedResources([]);
        }}
      />

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e1424] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-red-400" />
                Compose Operational Email
              </h2>
              <button 
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">To</label>
              <input
                type="email"
                placeholder="recipient@company.com"
                value={composeTo}
                onChange={e => setComposeTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="Operational status or handoff confirmation..."
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Message Content</label>
              <textarea
                rows={5}
                placeholder="Write your email body here..."
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <InHouseButton variant="quiet" size="sm" onClick={() => setShowCompose(false)}>
                Cancel
              </InHouseButton>
              <InHouseButton
                variant="primary"
                size="sm"
                icon={Send}
                disabled={!composeTo || !composeSubject || !composeBody}
                onClick={() => setShowSendConfirmation(true)}
              >
                Review & Send...
              </InHouseButton>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Sending Email */}
      <ConfirmationDialog
        isOpen={showSendConfirmation}
        title="Confirm Outgoing Email Dispatch"
        description={`You are about to send an email to "${composeTo}".`}
        impactWarning="This message will be dispatched immediately through your verified Gmail account. Recipient will receive this email in their inbox."
        affectedCount={1}
        affectedItemNames={[`To: ${composeTo}`, `Subject: ${composeSubject}`]}
        confirmLabel="Confirm & Send Email"
        cancelLabel="Keep Editing"
        isDestructive={false}
        isLoading={isSending}
        onConfirm={handleSendEmail}
        onCancel={() => setShowSendConfirmation(false)}
      />
    </div>
  );
};
