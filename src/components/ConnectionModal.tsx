import React from 'react';
import { ConnectionState } from '../types';
import { HealthCheckResult } from '../api/client';
import { 
  Server, 
  RefreshCw, 
  X, 
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionState: ConnectionState;
  healthResult: HealthCheckResult | null;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onRetry: () => void;
  isChecking: boolean;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  connectionState,
  healthResult,
  isMockMode,
  onToggleMockMode,
  onRetry,
  isChecking
}) => {
  if (!isOpen) return null;

  const isConnected = connectionState === 'connected';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-[#0e1424] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-slate-100 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-100">
              System State & Backend Diagnostics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Status Badge */}
          <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : isMockMode
              ? 'bg-amber-950/50 border-amber-800/60 text-amber-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? 'bg-emerald-400' : isMockMode ? 'bg-amber-400' : 'bg-rose-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-emerald-500' : isMockMode ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
              </span>
              <div>
                <div className="font-bold text-xs uppercase tracking-wide">
                  {isConnected 
                    ? 'Authoritative Backend Connected' 
                    : isMockMode 
                    ? 'PREVIEW DATA (DEMO FIXTURES ACTIVE)' 
                    : 'Backend Unavailable'}
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isConnected 
                    ? 'Streaming real telemetry from work-intelligence-v2 backend'
                    : isMockMode
                    ? 'Displaying high-fidelity operational test fixtures to evaluate UX density'
                    : 'No response from WORK_INTELLIGENCE_API_URL endpoint'}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Details */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-850 font-mono text-[11px] space-y-2">
            <div className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
              Endpoint Telemetry
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>
                <span className="text-slate-400">Endpoint: </span>
                <span className="text-cyan-300">/api/health</span>
              </div>
              <div>
                <span className="text-slate-400">Latency: </span>
                <span>{healthResult?.latencyMs ? `${healthResult.latencyMs}ms` : 'Timeout'}</span>
              </div>
              <div>
                <span className="text-slate-400">HTTP Status: </span>
                <span>{healthResult?.statusCode || '503 (Proxy refused)'}</span>
              </div>
              <div>
                <span className="text-slate-400">Last Checked: </span>
                <span>{healthResult?.timestamp ? new Date(healthResult.timestamp).toLocaleTimeString() : 'Just now'}</span>
              </div>
            </div>
            {healthResult?.errorMessage && (
              <div className="pt-1 text-rose-400 text-[10px] border-t border-slate-850">
                Error: {healthResult.errorMessage}
              </div>
            )}
          </div>

          {/* Explicit Preview Fixture Switch */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200 text-xs">Dev Preview Mode (Mock Fixtures)</div>
              <p className="text-[11px] text-slate-400">
                Enables evaluation of complete UI with populated 2026 data when the backend service is offline.
              </p>
            </div>
            <button
              onClick={onToggleMockMode}
              className={`p-1 rounded cursor-pointer transition-colors ${
                isMockMode ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              {isMockMode ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-400">
            Proxying to WORK_INTELLIGENCE_API_URL
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRetry}
              disabled={isChecking}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Pinging...' : 'Ping Backend Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
