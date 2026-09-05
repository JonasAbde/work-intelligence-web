import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs hover:shadow-sm font-semibold',
    secondary: 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80',
    danger: 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60',
    ghost: 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-200',
    outline: 'border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
