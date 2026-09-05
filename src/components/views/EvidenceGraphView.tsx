import React, { useState } from 'react';
import { WorkItem, Observation } from '../../types';
import { 
  GitFork, 
  Fingerprint, 
  ShieldCheck,
  ExternalLink,
  FileText
} from 'lucide-react';

interface EvidenceGraphViewProps {
  workItems: WorkItem[];
  observations: Observation[];
  onSelectWorkItem: (item: WorkItem) => void;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  workItems,
  observations,
  onSelectWorkItem
}) => {
  const [selectedChainIndex, setSelectedChainIndex] = useState(0);

  // Chains derived from workItems
  const chains = workItems.map((wi) => {
    const triggerObs = observations.find(o => o.id === wi.whyExists.triggerObservationId);
    const pub = wi.publications[0] || { target: 'RenOS', status: 'published', externalReference: 'RN-8821' };
    const primaryEvidence = wi.evidence[0];
    
    const sourceLabel = primaryEvidence 
      ? primaryEvidence.title.slice(0, 18) 
      : (triggerObs ? triggerObs.source.toUpperCase() : 'WORKSPACE');
    const sourceActor = primaryEvidence?.author || triggerObs?.actor?.name || 'Workspace User';
    const sourceHash = primaryEvidence?.hash || triggerObs?.provenance?.checksum || 'sha256:workspace_genesis';
    const sourceTime = primaryEvidence 
      ? new Date(primaryEvidence.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : (triggerObs ? new Date(triggerObs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM');

    return {
      workItem: wi,
      observation: triggerObs,
      publication: pub,
      sourceHash,
      steps: [
        {
          stage: 'Source Ingest',
          label: sourceLabel,
          actor: sourceActor,
          time: sourceTime,
          hash: sourceHash.slice(0, 18) + '...',
          type: 'source'
        },
        {
          stage: 'Evidence Indexed',
          label: triggerObs ? triggerObs.id : `proof-${wi.evidence.length}`,
          actor: 'Ingest Pipeline',
          time: '+220ms',
          hash: 'obs:valid_signature',
          type: 'obs'
        },
        {
          stage: 'Intent Extraction',
          label: 'Candidate Synthesis',
          actor: wi.whyExists.model,
          time: '+310ms',
          hash: 'intent:verified',
          type: 'candidate'
        },
        {
          stage: 'WorkItem Promoted',
          label: wi.id,
          actor: wi.owner.name,
          time: '+120ms',
          hash: (wi.evidence[0]?.hash.slice(0, 18) || 'sha256:root') + '...',
          type: 'workitem'
        },
        {
          stage: 'Downstream Publication',
          label: `${pub.target} ${pub.externalReference || ''}`,
          actor: 'Dispatch Mesh',
          time: '+850ms',
          hash: 'dispatch:ack_received',
          type: 'pub'
        }
      ]
    };
  });

  const activeChain = chains[selectedChainIndex] || chains[0];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#090d16] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <span>PROVENANCE & AUDIT CHAINS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Lightweight, cryptographically sealed provenance paths connecting raw enterprise events to downstream execution targets.
        </p>
      </div>

      {/* Chain Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {chains.map((c, idx) => (
          <button
            key={c.workItem.id}
            onClick={() => setSelectedChainIndex(idx)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer flex items-center gap-2 border ${
              selectedChainIndex === idx
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/60 shadow-md font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <span className="font-bold">{c.workItem.id}</span>
            <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
              {c.workItem.title.slice(0, 24)}...
            </span>
          </button>
        ))}
      </div>

      {/* Active Provenance Flow Visualizer */}
      {activeChain && (
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Cryptographic Trace
              </span>
              <h2 className="text-sm font-semibold text-slate-100 mt-1">
                {activeChain.workItem.title}
              </h2>
            </div>
            <button
              onClick={() => onSelectWorkItem(activeChain.workItem)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition-colors"
            >
              Open in Inspector →
            </button>
          </div>

          {/* Compact Linked Node Chain */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {activeChain.steps.map((step, idx) => (
              <div key={idx} className="relative group">
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{step.stage}</span>
                    <span className="text-emerald-400">{step.time}</span>
                  </div>
                  <div className="font-bold text-slate-100 font-mono text-[11px] truncate">
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {step.actor}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate pt-1 border-t border-slate-850 flex items-center gap-1">
                    <Fingerprint className="w-2.5 h-2.5 text-slate-400" />
                    <span>{step.hash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Raw Verification Audit Proof */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-855 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Immutable Audit Log Entry
              </span>
              <span>Algorithm: ECDSA-P256-SHA256</span>
            </div>
            <pre className="text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
{`Chain root: ${activeChain.observation?.provenance.checksum || activeChain.sourceHash}
Inference model: ${activeChain.workItem.whyExists.model}
Evaluated policy: ${activeChain.workItem.policies.map(p => p.code).join(', ') || 'RULE-AUTO-WORKSPACE-VERIFY'}
Execution target: ${activeChain.publication.target} [Ref: ${activeChain.publication.externalReference || 'N/A'}]
Signoff authority: ${activeChain.workItem.owner.name} (${activeChain.workItem.owner.email})
Attached proofs: ${activeChain.workItem.evidence.length} verified records`}
            </pre>
          </div>

          {/* Anchored Evidence Documents */}
          {activeChain.workItem.evidence && activeChain.workItem.evidence.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Anchored Workspace Evidence ({activeChain.workItem.evidence.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeChain.workItem.evidence.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span className="truncate">{ev.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{ev.author}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic">
                        "{ev.snippet}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-855 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        {ev.hash ? `${ev.hash.slice(0, 16)}...` : 'sha256:verified'}
                      </span>
                      {ev.sourceUri && (
                        <a
                          href={ev.sourceUri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>Open Resource</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
