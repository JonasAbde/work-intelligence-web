import React from 'react';
import { ShieldCheck, ExternalLink, Hash, Check } from 'lucide-react';

export interface WorkspaceEvidenceLinkProps {
  hash?: string;
  sourceUri?: string;
  confidence?: number;
  label?: string;
  onPreview?: () => void;
  className?: string;
}

export const WorkspaceEvidenceLink: React.FC<WorkspaceEvidenceLinkProps> = ({
  hash,
  sourceUri,
  confidence,
  label = 'Evidence Attached',
  onPreview,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  const shortHash = hash ? (hash.length > 20 ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : hash) : null;

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hash) {
      navigator.clipboard?.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 px-2 py-1 rounded-md bg-cyan-950/30 border border-cyan-800/60 text-cyan-300 text-xs ${className}`}>
      <div className="flex items-center gap-1.5 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>{label}</span>
      </div>

      {confidence !== undefined && (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 font-mono text-cyan-200">
          {Math.round(confidence * 100)}% conf
        </span>
      )}

      {shortHash && (
        <button
          type="button"
          onClick={handleCopyHash}
          title="Click to copy cryptographic SHA-256 hash"
          className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-cyan-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Hash className="w-2.5 h-2.5" />}
          <span>{shortHash}</span>
        </button>
      )}

      {sourceUri && (
        <a
          href={sourceUri}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-slate-400 hover:text-cyan-300 transition-colors"
          title="Open original resource provenance"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {onPreview && (
        <button
          onClick={e => {
            e.stopPropagation();
            onPreview();
          }}
          className="text-[11px] underline text-cyan-400 hover:text-cyan-200 cursor-pointer ml-1"
        >
          Inspect
        </button>
      )}
    </div>
  );
};
