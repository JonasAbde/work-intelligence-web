import React from 'react';
import { WorkspaceActor as WorkspaceActorType } from '../../../runtime/workspaceResource';

export interface WorkspaceActorProps {
  actor?: WorkspaceActorType;
  size?: 'sm' | 'md' | 'lg';
  showRole?: boolean;
  className?: string;
}

export const WorkspaceActor: React.FC<WorkspaceActorProps> = ({
  actor,
  size = 'md',
  showRole = true,
  className = '',
}) => {
  if (!actor) {
    return <span className="text-xs text-slate-500 font-mono italic">Anonymous</span>;
  }

  const initials = actor.name
    ? actor.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : actor.email.slice(0, 2).toUpperCase();

  const sizeStyles = {
    sm: { avatar: 'w-5 h-5 text-[10px]', text: 'text-xs', sub: 'text-[10px]' },
    md: { avatar: 'w-6 h-6 text-xs', text: 'text-xs', sub: 'text-[11px]' },
    lg: { avatar: 'w-8 h-8 text-sm', text: 'text-sm', sub: 'text-xs' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {actor.avatar ? (
        <img
          src={actor.avatar}
          alt={actor.name}
          className={`${sizeStyles.avatar} rounded-full object-cover ring-1 ring-slate-700`}
        />
      ) : (
        <div
          className={`${sizeStyles.avatar} rounded-full bg-slate-800 text-cyan-300 font-mono font-medium flex items-center justify-center ring-1 ring-slate-700 select-none`}
          title={actor.email}
        >
          {initials}
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span className={`${sizeStyles.text} font-medium text-slate-200 truncate leading-tight`}>
          {actor.name}
        </span>
        {showRole && actor.role && (
          <span className={`${sizeStyles.sub} text-slate-400 font-normal leading-tight truncate`}>
            {actor.role}
          </span>
        )}
      </div>
    </div>
  );
};
