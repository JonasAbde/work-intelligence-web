import React from 'react';
import { WorkspaceProvider, WorkspaceResourceKind } from '../../../runtime/workspaceResource';
import { 
  Mail, 
  Calendar, 
  HardDrive, 
  FileText, 
  FileSpreadsheet, 
  StickyNote, 
  File,
  Folder,
  CheckSquare
} from 'lucide-react';

export interface WorkspaceSourceProps {
  provider: WorkspaceProvider;
  kind?: WorkspaceResourceKind;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const WorkspaceSource: React.FC<WorkspaceSourceProps> = ({
  provider,
  kind,
  showName = true,
  size = 'md',
  className = '',
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'gmail':
        return {
          name: 'Gmail',
          icon: Mail,
          color: 'text-red-400 bg-red-950/40 border-red-900/60',
          accent: 'border-red-500/30',
        };
      case 'calendar':
        return {
          name: 'Calendar',
          icon: Calendar,
          color: 'text-blue-400 bg-blue-950/40 border-blue-900/60',
          accent: 'border-blue-500/30',
        };
      case 'drive':
        return {
          name: 'Drive',
          icon: kind === 'folder' ? Folder : HardDrive,
          color: 'text-amber-400 bg-amber-950/40 border-amber-900/60',
          accent: 'border-amber-500/30',
        };
      case 'docs':
        return {
          name: 'Docs',
          icon: FileText,
          color: 'text-sky-400 bg-sky-950/40 border-sky-900/60',
          accent: 'border-sky-500/30',
        };
      case 'sheets':
        return {
          name: 'Sheets',
          icon: FileSpreadsheet,
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60',
          accent: 'border-emerald-500/30',
        };
      case 'keep':
        return {
          name: 'Keep',
          icon: kind === 'checklist' ? CheckSquare : StickyNote,
          color: 'text-amber-300 bg-amber-950/40 border-amber-900/60',
          accent: 'border-amber-400/30',
        };
      default:
        return {
          name: 'Google',
          icon: File,
          color: 'text-slate-400 bg-slate-800 border-slate-700',
          accent: 'border-slate-600',
        };
    }
  };

  const config = getProviderConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] gap-1 px-1.5 py-0.5',
    md: 'text-xs gap-1.5 px-2 py-1',
    lg: 'text-sm gap-2 px-2.5 py-1.5',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.color} ${sizeClasses} ${className}`}
      title={`${config.name} (${kind || 'resource'})`}
    >
      <Icon className={`${iconSizes} flex-shrink-0`} />
      {showName && <span className="tracking-tight">{config.name}</span>}
      {kind && showName && (
        <span className="text-[10px] text-slate-400 font-normal">/ {kind}</span>
      )}
    </span>
  );
};
