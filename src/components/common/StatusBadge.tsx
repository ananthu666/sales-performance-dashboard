import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { TargetStatus } from '../../types/sales';

export interface StatusBadgeProps {
  status: TargetStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const isAbove = status === 'Above Target';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full transition-colors ${
        sizeClasses[size]
      } ${
        isAbove
          ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
          : 'bg-rose-50 text-rose-700 border border-rose-200'
      } ${className}`}
    >
      {isAbove ? (
        <CheckCircle2 className={`${iconSizes[size]} text-[#631244] shrink-0`} />
      ) : (
        <AlertCircle className={`${iconSizes[size]} text-rose-600 shrink-0`} />
      )}
      <span>{status}</span>
    </span>
  );
};
