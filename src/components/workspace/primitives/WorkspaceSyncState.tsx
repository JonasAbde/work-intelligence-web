import React from 'react';
import { ComponentLifecycleState } from '../../../runtime/workspaceResource';
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  WifiOff, 
  Lock, 
  ShieldAlert, 
  AlertCircle 
} from 'lucide-react';

export interface WorkspaceSyncStateProps {
  state: ComponentLifecycleState;
  showLabel?: boolean;
  className?: string;
  onRetry?: () => void;
}

export const WorkspaceSyncState: React.FC<WorkspaceSyncStateProps> = ({
  state,
  showLabel = true,
  className = '',
  onRetry,
}) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'syncing':
      case 'refreshing':
      case 'loading':
      case 'streaming':
        return {
          icon: RefreshCw,
          label: state === 'streaming' ? 'Streaming...' : 'Syncing...',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60 animate-pulse',
          iconClass: 'animate-spin',
        };
      case 'optimistic':
        return {
          icon: Clock,
          label: 'Optimistic (Local)',
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
          iconClass: '',
        };
      case 'saved':
      case 'idle':
        return {
          icon: CheckCircle2,
          label: 'In Sync',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
          iconClass: '',
        };
      case 'stale':
        return {
          icon: Clock,
          label: 'Stale Cache',
          color: 'text-amber-300 bg-amber-950/40 border-amber-800/60',
          iconClass: '',
        };
      case 'rate_limited':
        return {
          icon: AlertTriangle,
          label: 'Rate Limited',
          color: 'text-amber-400 bg-amber-950/60 border-amber-700',
          iconClass: '',
        };
      case 'token_expired':
      case 'unauthorized':
        return {
          icon: Lock,
          label: 'Auth Required',
          color: 'text-rose-400 bg-rose-950/60 border-rose-800',
          iconClass: '',
        };
      case 'permission_denied':
        return {
          icon: ShieldAlert,
          label: 'Permission Denied',
          color: 'text-rose-400 bg-rose-950/60 border-rose-800',
          iconClass: '',
        };
      case 'offline':
      case 'reconnecting':
        return {
          icon: WifiOff,
          label: state === 'reconnecting' ? 'Reconnecting...' : 'Offline',
          color: 'text-slate-400 bg-slate-900 border-slate-700',
          iconClass: state === 'reconnecting' ? 'animate-spin' : '',
        };
      case 'failed':
      case 'conflict':
        return {
          icon: AlertCircle,
          label: state === 'conflict' ? 'Conflict Detected' : 'Sync Error',
          color: 'text-rose-400 bg-rose-950/60 border-rose-800',
          iconClass: '',
        };
      default:
        return {
          icon: CheckCircle2,
          label: 'Ready',
          color: 'text-slate-400 bg-slate-900 border-slate-700',
          iconClass: '',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium font-mono ${config.color} ${className}`}
      title={`Workspace State: ${state}`}
    >
      <Icon className={`w-3 h-3 ${config.iconClass}`} />
      {showLabel && <span>{config.label}</span>}
      {onRetry && (state === 'failed' || state === 'rate_limited' || state === 'stale') && (
        <button
          onClick={e => {
            e.stopPropagation();
            onRetry();
          }}
          className="ml-1 text-[10px] underline text-cyan-300 hover:text-cyan-200 cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
};
