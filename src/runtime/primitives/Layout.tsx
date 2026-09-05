import React, { ReactNode } from 'react';
import { useDensity } from './DensityProvider';

export const Stack: React.FC<{
  children: ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
}> = ({ children, spacing = 'md', className = '', align = 'stretch' }) => {
  const { spacing: tokens } = useDensity();
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];

  return (
    <div className={`flex flex-col ${tokens[spacing]} ${alignClass} ${className}`}>
      {children}
    </div>
  );
};

export const Row: React.FC<{
  children: ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  justify?: 'start' | 'center' | 'end' | 'between';
  align?: 'start' | 'center' | 'end' | 'baseline';
  className?: string;
}> = ({ children, spacing = 'md', justify = 'start', align = 'center', className = '' }) => {
  const { spacing: tokens } = useDensity();
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }[justify];

  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  }[align];

  return (
    <div className={`flex flex-row ${tokens[spacing]} ${justifyClass} ${alignClass} ${className}`}>
      {children}
    </div>
  );
};

export const Cluster: React.FC<{
  children: ReactNode;
  spacing?: 'xs' | 'sm' | 'md';
  className?: string;
}> = ({ children, spacing = 'xs', className = '' }) => {
  const { spacing: tokens } = useDensity();
  return (
    <div className={`flex flex-wrap items-center ${tokens[spacing]} ${className}`}>
      {children}
    </div>
  );
};

export const Split: React.FC<{
  children: [ReactNode, ReactNode];
  leftWidth?: string;
  rightWidth?: string;
  className?: string;
}> = ({ children, leftWidth = 'w-full lg:w-2/3', rightWidth = 'w-full lg:w-1/3', className = '' }) => {
  return (
    <div className={`flex flex-col lg:flex-row gap-6 w-full ${className}`}>
      <div className={`${leftWidth} flex flex-col min-w-0`}>{children[0]}</div>
      <div className={`${rightWidth} flex flex-col min-w-0`}>{children[1]}</div>
    </div>
  );
};

export const Grid: React.FC<{
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, cols = 3, gap = 'md', className = '' }) => {
  const { spacing: tokens } = useDensity();
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${colClass} ${tokens[gap]} ${className}`}>
      {children}
    </div>
  );
};

export const Workspace: React.FC<{
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}> = ({ children, title, subtitle, badge, actions, className = '' }) => {
  return (
    <div className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#090d16] text-slate-100 ${className}`}>
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h1>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 min-w-0">
        {children}
      </div>
    </div>
  );
};

export const Toolbar: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 ${className}`}>
      {children}
    </div>
  );
};

export const DetailPane: React.FC<{
  children: ReactNode;
  title: string;
  onClose: () => void;
  actions?: ReactNode;
  width?: string;
}> = ({ children, title, onClose, actions, width = 'w-full md:w-96' }) => {
  return (
    <aside className={`${width} flex-shrink-0 border-l border-slate-800/80 bg-[#0c101d] flex flex-col h-full z-10 text-slate-100 shadow-xl`}>
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">{title}</h3>
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {children}
      </div>
    </aside>
  );
};
