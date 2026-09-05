import React, { useEffect, useState } from 'react';
import { telemetry } from '../../runtime/telemetry';
import { TelemetryEvent } from '../../runtime/workspaceResource';
import { InHouseButton } from '../../runtime/primitives/Actions';
import {
  Activity,
  Clock,
  Sparkles,
  ShieldCheck,
  HardDrive,
  X,
  Trash2,
} from 'lucide-react';

export interface TelemetryHUDProps {
  isOpen: boolean;
  onClose: () => void;
}

function metric(value: number | null, suffix = ''): string {
  return value === null ? 'No samples' : `${value}${suffix}`;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => telemetry.subscribe(setEvents), []);

  if (!isOpen) return null;
  const summary = telemetry.getSummary();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-[#0c111f] border border-cyan-800/80 shadow-2xl flex flex-col h-[620px] overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-700 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Local UX Telemetry
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700">
                  Browser session
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Measured interaction events from this tab only. This is not backend observability or business telemetry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => telemetry.clear()} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors" title="Clear local telemetry">
              <Trash2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors" title="Close HUD">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-400" /> Avg Time-to-Resource</span>
            <div className="text-lg font-bold font-mono text-cyan-300">{metric(summary.avgResourceTimeMs, ' ms')}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-400" /> UI Work Events</span>
            <div className="text-lg font-bold font-mono text-amber-300">{summary.workCreated}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> UI Evidence Events</span>
            <div className="text-lg font-bold font-mono text-emerald-300">{summary.evidenceAttached}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1"><HardDrive className="w-3 h-3 text-blue-400" /> Picker Conversion</span>
            <div className="text-lg font-bold font-mono text-blue-300">{metric(summary.pickerConversion, '%')}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider">Measured local interaction events ({events.length})</span>
            <span className="text-[11px] text-slate-500">Provider payloads and query details are not retained</span>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">No measured interaction events in this browser session.</div>
          ) : events.map(event => (
            <div key={event.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1 rounded bg-slate-800 text-cyan-300 font-mono text-[10px] shrink-0">{event.type}</span>
                {event.provider && <span className="font-mono text-[10px] uppercase text-slate-400 shrink-0">[{event.provider}]</span>}
                {event.durationMs !== undefined && <span className="font-mono text-cyan-400 text-xs shrink-0">{event.durationMs}ms</span>}
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-[#0e1424] flex items-center justify-end">
          <InHouseButton variant="secondary" size="sm" onClick={onClose}>Close Telemetry</InHouseButton>
        </div>
      </div>
    </div>
  );
};
