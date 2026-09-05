import React from 'react';
import { ComponentLifecycleState, WorkspaceProvider } from '../../../runtime/workspaceResource';
import { InHouseButton } from '../../../runtime/primitives/Actions';
import { 
  AlertTriangle, 
  Lock, 
  ShieldAlert, 
  RefreshCw, 
  WifiOff, 
  HelpCircle 
} from 'lucide-react';

export interface WorkspaceErrorStateProps {
  state: ComponentLifecycleState;
  provider?: WorkspaceProvider;
  impactMessage?: string;
  technicalDetails?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export const WorkspaceErrorState: React.FC<WorkspaceErrorStateProps> = ({
  state,
  provider = 'gmail',
  impactMessage,
  technicalDetails,
  onAction,
  actionLabel,
  className = '',
}) => {
  const getDefaultContent = () => {
    switch (state) {
      case 'token_expired':
      case 'unauthorized':
        return {
          icon: Lock,
          title: 'Google Authorization Expired',
          impact: impactMessage || `Live synchronization with ${provider.toUpperCase()} is paused. Operational intent cannot be inferred until access is renewed.`,
          action: actionLabel || `Reconnect ${provider.toUpperCase()}`,
          color: 'border-rose-800/80 bg-rose-950/20 text-rose-300',
        };
      case 'rate_limited':
        return {
          icon: AlertTriangle,
          title: 'Provider Rate Limited (429)',
          impact: impactMessage || `Google Workspace API quota exceeded for ${provider}. Automatic backoff is active.`,
          action: actionLabel || 'Retry Request Now',
          color: 'border-amber-800/80 bg-amber-950/20 text-amber-300',
        };
      case 'permission_denied':
        return {
          icon: ShieldAlert,
          title: 'Restricted Access',
          impact: impactMessage || `Your Google Workspace account does not possess the requisite OAuth scopes or file permissions.`,
          action: actionLabel || 'Request Scopes',
          color: 'border-rose-800/80 bg-rose-950/20 text-rose-300',
        };
      case 'offline':
      case 'reconnecting':
        return {
          icon: WifiOff,
          title: 'Network Disconnected',
          impact: impactMessage || 'Operating from offline local storage cache. Changes will be queued until reconnection.',
          action: actionLabel || 'Test Network',
          color: 'border-slate-700 bg-slate-900/60 text-slate-300',
        };
      default:
        return {
          icon: HelpCircle,
          title: 'Workspace Synchronization Warning',
          impact: impactMessage || `An unexpected condition occurred while accessing ${provider}.`,
          action: actionLabel || 'Retry Operation',
          color: 'border-amber-800/60 bg-amber-950/20 text-amber-300',
        };
    }
  };

  const config = getDefaultContent();
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${config.color} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            {config.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {config.impact}
          </p>
          {technicalDetails && (
            <p className="text-[11px] font-mono text-slate-500 pt-0.5">
              Code: {technicalDetails}
            </p>
          )}
        </div>
      </div>

      {onAction && (
        <div className="shrink-0 self-end sm:self-center">
          <InHouseButton
            variant="secondary"
            size="sm"
            onClick={onAction}
            className="border-slate-600 hover:border-slate-500 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            {config.action}
          </InHouseButton>
        </div>
      )}
    </div>
  );
};
