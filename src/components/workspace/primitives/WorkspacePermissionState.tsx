import React from 'react';
import { ResourcePermissions } from '../../../runtime/workspaceResource';
import { ShieldCheck, Eye, Edit3, MessageSquare } from 'lucide-react';

export interface WorkspacePermissionStateProps {
  permissions: ResourcePermissions;
  showDetails?: boolean;
  className?: string;
}

export const WorkspacePermissionState: React.FC<WorkspacePermissionStateProps> = ({
  permissions,
  showDetails = false,
  className = '',
}) => {
  const role = permissions.role || (permissions.canEdit ? 'editor' : 'viewer');

  const getBadge = () => {
    switch (role) {
      case 'owner':
        return {
          icon: ShieldCheck,
          label: 'Owner',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
        };
      case 'editor':
        return {
          icon: Edit3,
          label: 'Editor',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
        };
      case 'commenter':
        return {
          icon: MessageSquare,
          label: 'Commenter',
          color: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
        };
      case 'viewer':
      default:
        return {
          icon: Eye,
          label: 'Viewer',
          color: 'text-slate-400 bg-slate-900 border-slate-800',
        };
    }
  };

  const badge = getBadge();
  const Icon = badge.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium font-mono ${badge.color}`}
        title={`Permission Level: ${badge.label}`}
      >
        <Icon className="w-2.5 h-2.5" />
        <span>{badge.label}</span>
      </span>

      {showDetails && (
        <span className="text-[10px] text-slate-500 font-mono">
          {permissions.canEdit ? 'write' : 'read-only'} • {permissions.canShare ? 'shareable' : 'private'}
        </span>
      )}
    </div>
  );
};
