import React, { useMemo, useState } from 'react';
import { WorkItem, Observation } from '../../types';
import {
  GitFork,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  FileText,
} from 'lucide-react';

interface EvidenceGraphViewProps {
  workItems: WorkItem[];
  observations: Observation[];
  onSelectWorkItem: (item: WorkItem) => void;
}

function short(value?: string): string {
  if (!value) return 'not supplied';
  return value.length > 22 ? `${value.slice(0, 22)}…` : value;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({ workItems, observations, onSelectWorkItem }) => {
  const [selectedChainIndex, setSelectedChainIndex] = useState(0);

  const chains = useMemo(() => workItems.map(workItem => {
    const triggerObservation = observations.find(observation =>
      observation.id === workItem.whyExists.triggerObservationId ||
      workItem.sourceObservationIds.includes(observation.id),
    );
    const evidence = workItem.evidence;
    const publications = workItem.publications;

    return {
      workItem,
      triggerObservation,
      evidence,
      publications,
      hasVerifiedMaterial: evidence.some(item => Boolean(item.hash)) || Boolean(triggerObservation?.provenance?.checksum),
    };
  }), [observations, workItems]);

  const activeChain = chains[selectedChainIndex] || chains[0];

  if (chains.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#090d16] text-slate-100 p-8">
        <GitFork className="w-8 h-8 text-slate-600 mb-3" />
        <h1 className="text-sm font-semibold">No provenance data loaded</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md text-center">
          Provenance is shown only from observations, evidence envelopes and publication receipts returned by the authoritative Work Intelligence backend.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#090d16] text-slate-100 p-6 space-y-6">
      <div className="pb-3 border-b border-slate-800/80">
        <h1 className="text-base font-bold tracking-tight flex items-center gap-2 font-mono">
          <GitFork className="w-4 h-4 text-cyan-400" />
          <span>PROVENANCE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Backend-supplied source context, evidence identifiers and publication receipts. Missing proof is shown as missing rather than inferred.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {chains.map((chain, index) => (
          <button
            key={chain.workItem.id}
            type="button"
            onClick={() => setSelectedChainIndex(index)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer flex items-center gap-2 border ${
              selectedChainIndex === index
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/60 shadow-md font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <span className="font-bold">{chain.workItem.id}</span>
            <span className="text-slate-400 text-[11px] truncate max-w-[180px]">{chain.workItem.title}</span>
          </button>
        ))}
      </div>

      {activeChain && (
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                activeChain.hasVerifiedMaterial
                  ? 'text-cyan-300 bg-cyan-950/40 border-cyan-800/50'
                  : 'text-amber-300 bg-amber-950/30 border-amber-800/50'
              }`}>
                {activeChain.hasVerifiedMaterial ? 'Evidence material supplied' : 'No cryptographic material loaded'}
              </span>
              <h2 className="text-sm font-semibold text-slate-100 mt-1">{activeChain.workItem.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectWorkItem(activeChain.workItem)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition-colors"
            >
              Open in Inspector →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Source observation</div>
              <div className="font-semibold text-slate-200">{activeChain.triggerObservation?.source || 'Not linked'}</div>
              <div className="text-[10px] text-slate-400">{activeChain.triggerObservation?.actor?.name || 'No actor supplied'}</div>
              <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-850">
                <Fingerprint className="w-2.5 h-2.5" />
                {short(activeChain.triggerObservation?.provenance?.checksum)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Canonical WorkItem</div>
              <div className="font-semibold text-slate-200">{activeChain.workItem.id}</div>
              <div className="text-[10px] text-slate-400">{activeChain.workItem.status}</div>
              <div className="text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-850">
                {activeChain.evidence.length} evidence record(s) loaded
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Publication receipts</div>
              <div className="font-semibold text-slate-200">{activeChain.publications.length}</div>
              <div className="text-[10px] text-slate-400">
                {activeChain.publications.length ? activeChain.publications.map(publication => `${publication.target}: ${publication.status}`).join(' · ') : 'None loaded'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-855 space-y-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              {activeChain.hasVerifiedMaterial ? <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
              Evidence summary
            </div>
            <pre className="text-[11px] text-slate-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
{`Observation: ${activeChain.triggerObservation?.id || 'not linked'}
Observation checksum: ${activeChain.triggerObservation?.provenance?.checksum || 'not supplied'}
Inference model: ${activeChain.workItem.whyExists.model || 'not reported'}
Policy records loaded: ${activeChain.workItem.policies.length}
Evidence records loaded: ${activeChain.evidence.length}
Publication receipts loaded: ${activeChain.publications.length}`}
            </pre>
          </div>

          {activeChain.evidence.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Evidence records ({activeChain.evidence.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeChain.evidence.map(evidence => (
                  <div key={evidence.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                        <span className="truncate">{evidence.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{evidence.author}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic">“{evidence.snippet}”</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-855 text-[10px] font-mono">
                      {evidence.hash ? (
                        <span className="flex items-center gap-1 text-cyan-300">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          {short(evidence.hash)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <ShieldAlert className="w-3 h-3" />
                          Hash not supplied
                        </span>
                      )}
                      {evidence.sourceUri && (
                        <a href={evidence.sourceUri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors">
                          <span>Open source</span>
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
