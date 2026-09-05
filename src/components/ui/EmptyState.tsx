import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-slate-900/30 border border-slate-800/60 max-w-lg mx-auto my-8">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 mb-4 shadow-inner">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-100 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-sm">
        {description}
      </p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2.5">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
