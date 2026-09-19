import React from 'react';
import {
  Users,
  Target,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import type { CompanyPerformanceSummary } from '../../types/sales';
import { formatCurrency, formatPercentage } from '../../utils/calculations';
import { SummaryCard } from './SummaryCard';
import { StatusBadge } from '../common/StatusBadge';

export interface KPISummaryGridProps {
  /** Pre-calculated high-level company performance summary metrics */
  summary: CompanyPerformanceSummary;
}

export const KPISummaryGrid: React.FC<KPISummaryGridProps> = ({ summary }) => {
  const isPositiveVariance = summary.variance >= 0;

  return (
    <section aria-label="Wholesale Performance Summary" className="w-full space-y-4">
      {/* 4 Core Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Salespeople */}
        <SummaryCard
          title="Total Salespeople"
          value={summary.totalSalespeople}
          subtitle={`${summary.salespeopleAboveTarget} on track • ${summary.salespeopleBelowTarget} below target`}
          icon={<Users className="w-5 h-5" />}
          variant="brand"
        />

        {/* 2. Total Budget */}
        <SummaryCard
          title="Total Budget"
          value={formatCurrency(summary.totalBudget)}
          subtitle="Allocated wholesale revenue target"
          icon={<Target className="w-5 h-5" />}
          variant="terra"
        />

        {/* 3. Total Actual Sales */}
        <SummaryCard
          title="Total Actual Sales"
          value={formatCurrency(summary.totalActual)}
          subtitle={
            isPositiveVariance
              ? `Surplus of ${formatCurrency(summary.variance)}`
              : `Shortfall of ${formatCurrency(Math.abs(summary.variance))}`
          }
          icon={
            isPositiveVariance ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5 rotate-180" />
            )
          }
          variant={isPositiveVariance ? 'brand' : 'rose'}
          badge={
            <span
              className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                isPositiveVariance
                  ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isPositiveVariance ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {isPositiveVariance ? '+' : ''}
              {formatCurrency(summary.variance)}
            </span>
          }
        />

        {/* 4. Overall Achievement % */}
        <SummaryCard
          title="Overall Achievement"
          value={formatPercentage(summary.overallAchievementPercentage)}
          subtitle={
            summary.overallStatus === 'Above Target'
              ? 'Wholesale target surpassed'
              : 'Below allocated sales target'
          }
          icon={<Award className="w-5 h-5" />}
          variant={summary.overallStatus === 'Above Target' ? 'brand' : 'terra'}
          badge={<StatusBadge status={summary.overallStatus} size="sm" />}
          progressPercentage={summary.overallAchievementPercentage}
        />
      </div>

      {/* Top Performer Spotlight Card (When available) */}
      {summary.topPerformer && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#F8CBBA] bg-gradient-to-r from-[#FDF4F0] via-[#FAF0EA] to-white text-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FCE7DE] text-[#DE5829] shrink-0 border border-[#F8CBBA]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A33411]">
                  Top Sales Performer
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DE5829] text-white">
                  Rank #1
                </span>
              </div>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {summary.topPerformer.salesperson}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Actual Sales</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(summary.topPerformer.totalActual)}
              </span>
            </div>
            <div className="h-8 w-px bg-[#EADBDE]" />
            <div>
              <span className="text-xs text-slate-500 block">Achievement</span>
              <span className="font-extrabold text-[#631244]">
                {formatPercentage(summary.topPerformer.achievementPercentage)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
