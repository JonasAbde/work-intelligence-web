import React, { useState, useRef, ReactNode } from 'react';
import { LucideIcon, Loader2, ShieldAlert } from 'lucide-react';
import { useDensity } from './DensityProvider';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'quiet' 
  | 'destructive' 
  | 'contextual'
  | 'outline';

export interface InHouseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const InHouseButton: React.FC<InHouseButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  title,
  type = 'button',
}) => {
  const { density } = useDensity();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-semibold shadow-xs hover:shadow-cyan-500/20';
      case 'destructive':
        return 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 active:bg-rose-950';
      case 'quiet':
        return 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-transparent';
      case 'contextual':
        return 'bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-cyan-900/60 hover:border-cyan-700/80';
      case 'outline':
        return 'bg-transparent border border-slate-700 text-slate-200 hover:bg-slate-850 hover:border-slate-600';
      case 'secondary':
      default:
        return 'bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-slate-200 border border-slate-700/80';
    }
  };

  const getSizeStyles = () => {
    if (density === 'dense') {
      return size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2.5 py-1 text-xs';
    }
    if (density === 'compact') {
      return size === 'sm' ? 'px-2.5 py-1 text-xs' : size === 'lg' ? 'px-4 py-1.5 text-xs' : 'px-3 py-1.5 text-xs';
    }
    return size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-2.5 text-sm' : 'px-4 py-2 text-xs';
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none whitespace-nowrap ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 flex-shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-3.5 h-3.5 ml-1.5 flex-shrink-0" />
      )}
    </button>
  );
};

export const HoldToConfirmButton: React.FC<{
  children: ReactNode;
  onConfirm: () => void;
  holdDurationMs?: number;
  className?: string;
  variant?: 'destructive' | 'primary';
}> = ({
  children,
  onConfirm,
  holdDurationMs = 1200,
  className = '',
  variant = 'destructive',
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const handleStart = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        handleCancel();
        onConfirm();
      }
    }, 20);
  };

  const handleCancel = () => {
    setIsHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const bgStyle = variant === 'destructive' ? 'bg-rose-950/80 border-rose-800 text-rose-200' : 'bg-cyan-950/80 border-cyan-800 text-cyan-200';
  const fillStyle = variant === 'destructive' ? 'bg-rose-600/40' : 'bg-cyan-600/40';

  return (
    <button
      type="button"
      onMouseDown={handleStart}
      onMouseUp={handleCancel}
      onMouseLeave={handleCancel}
      onTouchStart={handleStart}
      onTouchEnd={handleCancel}
      className={`relative overflow-hidden px-3.5 py-1.5 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-colors ${bgStyle} ${className}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-75 ${fillStyle}`}
        style={{ width: `${progress}%` }}
      />
      <div className="relative z-10 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>{isHolding ? 'Holding...' : children}</span>
      </div>
    </button>
  );
};
