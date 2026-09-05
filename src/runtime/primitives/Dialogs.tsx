import React, { ReactNode } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { InHouseButton } from './Actions';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  impactWarning?: string;
  affectedCount?: number;
  affectedItemNames?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  impactWarning,
  affectedCount,
  affectedItemNames,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl bg-[#0e1424] border border-slate-700/80 shadow-2xl p-6 text-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isDestructive ? 'bg-rose-950/50 border-rose-800 text-rose-400' : 'bg-cyan-950/50 border-cyan-800 text-cyan-400'}`}>
              {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {impactWarning && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Impact Assessment:</span>
              <p className="text-amber-300/90 mt-0.5">{impactWarning}</p>
            </div>
          </div>
        )}

        {affectedItemNames && affectedItemNames.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div className="text-slate-400 mb-1.5 font-medium">
              Affected item{affectedItemNames.length > 1 ? 's' : ''} ({affectedCount || affectedItemNames.length}):
            </div>
            <ul className="max-h-28 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300 pr-1">
              {affectedItemNames.map((name, i) => (
                <li key={i} className="truncate flex items-center gap-1.5 bg-slate-800/40 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {children}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
          <InHouseButton
            variant="quiet"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </InHouseButton>
          <InHouseButton
            variant={isDestructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </InHouseButton>
        </div>
      </div>
    </div>
  );
};
