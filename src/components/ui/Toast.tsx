import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, RotateCcw } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type?: 'success' | 'warning' | 'info';
  onUndo?: () => void;
  undoLabel?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration || 6000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    setProgress(100);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-[#0f172a] text-slate-100 rounded-xl border border-slate-700/90 shadow-2xl p-3.5 flex items-start justify-between gap-3 relative overflow-hidden">
        {/* Progress bar */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 bg-cyan-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-100">{toast.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{toast.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {toast.onUndo && (
            <button
              onClick={() => {
                toast.onUndo?.();
                onDismiss();
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-medium border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{toast.undoLabel || 'Undo'}</span>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
