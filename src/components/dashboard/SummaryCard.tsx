import React from 'react';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'brand' | 'gold' | 'terra';
  progressPercentage?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'default',
  progressPercentage,
}) => {
  // BGH Theme styling for icon containers: Plum #631244 and Terracotta #DE5829
  const iconVariants = {
    default: 'bg-[#F5EFF2] text-slate-700 border border-[#EADBDE]',
    brand: 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]',
    emerald: 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]',
    gold: 'bg-[#FDF4F0] text-[#DE5829] border border-[#F8CBBA]',
    amber: 'bg-[#FDF4F0] text-[#DE5829] border border-[#F8CBBA]',
    terra: 'bg-[#FDF4F0] text-[#DE5829] border border-[#F8CBBA]',
    blue: 'bg-[#F5EFF2] text-[#631244] border border-[#EADBDE]',
    indigo: 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#EADBDE] bg-white p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className={`p-2.5 rounded-xl shrink-0 ${iconVariants[variant]}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      </div>

      {(subtitle || typeof progressPercentage === 'number') && (
        <div className="mt-4 pt-3 border-t border-[#F5EFF2]">
          {typeof progressPercentage === 'number' && (
            <div className="mb-2">
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-500 mb-1">
                <span>Target Progress</span>
                <span className="font-bold text-slate-700">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#F5EFF2] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercentage >= 100
                      ? 'bg-[#631244]'
                      : progressPercentage >= 90
                      ? 'bg-[#DE5829]'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {subtitle && (
            <p className="text-xs text-slate-500 truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
