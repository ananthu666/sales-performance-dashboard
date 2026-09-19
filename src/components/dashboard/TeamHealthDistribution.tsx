import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Calculator,
} from 'lucide-react';
import type { CompanyPerformanceSummary, SalespersonPerformance } from '../../types/sales';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export interface TeamHealthDistributionProps {
  summary: CompanyPerformanceSummary;
  performances: SalespersonPerformance[];
  onViewAnalytics?: () => void;
  onViewTable?: () => void;
}

export const TeamHealthDistribution: React.FC<TeamHealthDistributionProps> = ({
  summary,
  performances,
  onViewAnalytics,
  onViewTable,
}) => {
  const total = summary.totalSalespeople || 1;
  const aboveCount = summary.salespeopleAboveTarget;
  const belowCount = summary.salespeopleBelowTarget;

  const abovePct = Math.round((aboveCount / total) * 100);
  const belowPct = 100 - abovePct;

  const avgBudget = summary.totalBudget / total;
  const avgActual = summary.totalActual / total;
  const avgVariance = summary.variance / total;

  // Identify highest and lowest achievement reps
  const sortedByAchievement = [...performances].sort(
    (a, b) => b.achievementPercentage - a.achievementPercentage
  );
  const highestRep = sortedByAchievement[0];
  const lowestRep = sortedByAchievement[sortedByAchievement.length - 1];

  return (
    <div className="rounded-2xl border border-[#EADBDE] bg-white shadow-2xs p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F5EFF2]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#631244]" />
            Team Target Health & Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive breakdown of team quota attainment and average salesperson productivity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewAnalytics && (
            <button
              type="button"
              onClick={onViewAnalytics}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-[#631244] bg-[#FBF2F7] hover:bg-[#F5EFF2] border border-[#EDC6DD] transition-colors cursor-pointer"
            >
              Open Charts →
            </button>
          )}
          {onViewTable && (
            <button
              type="button"
              onClick={onViewTable}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 bg-[#FAF7F5] hover:bg-[#F5EFF2] border border-[#EADBDE] transition-colors cursor-pointer"
            >
              View Roster →
            </button>
          )}
        </div>
      </div>

      {/* Target Attainment Segmented Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-[#631244]">
            <CheckCircle2 className="w-4 h-4 text-[#631244]" />
            <span>
              Above Target: {aboveCount} ({abovePct}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#DE5829]">
            <span>
              Below Target: {belowCount} ({belowPct}%)
            </span>
            <AlertCircle className="w-4 h-4 text-[#DE5829]" />
          </div>
        </div>

        {/* Two-tone distribution bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${abovePct}%` }}
            className="h-full bg-gradient-to-r from-[#8C1B61] to-[#631244] transition-all duration-500"
            title={`Above Target: ${aboveCount} salespeople (${abovePct}%)`}
          />
          <div
            style={{ width: `${belowPct}%` }}
            className="h-full bg-gradient-to-r from-[#DE5829] to-[#F17347] transition-all duration-500"
            title={`Below Target: ${belowCount} salespeople (${belowPct}%)`}
          />
        </div>
      </div>

      {/* Productivity Averages & Individual Spread */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Metric 1: Average Revenue Per Rep */}
        <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Avg. Sales / Representative</span>
            <Calculator className="w-4 h-4 text-[#631244]" />
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(avgActual)}</p>
          <p className="text-[11px] text-slate-500">
            Target Avg: <span className="font-medium text-slate-700">{formatCurrency(avgBudget)}</span>
          </p>
        </div>

        {/* Metric 2: Net Team Variance Per Rep */}
        <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Avg. Variance / Rep</span>
            <TrendingUp
              className={`w-4 h-4 ${avgVariance >= 0 ? 'text-[#631244]' : 'text-rose-600 rotate-180'}`}
            />
          </div>
          <p
            className={`text-lg font-bold ${
              avgVariance >= 0 ? 'text-[#631244]' : 'text-rose-600'
            }`}
          >
            {avgVariance >= 0 ? '+' : ''}
            {formatCurrency(avgVariance)}
          </p>
          <p className="text-[11px] text-slate-500">
            {avgVariance >= 0 ? 'Overall surplus per headcount' : 'Net shortfall per headcount'}
          </p>
        </div>

        {/* Metric 3: Team Achievement Spread */}
        <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Attainment Range</span>
            <Target className="w-4 h-4 text-[#DE5829]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900">
              {highestRep ? formatPercentage(highestRep.achievementPercentage) : '0%'}
            </span>
            <span className="text-xs text-slate-400">high</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-sm font-semibold text-slate-600">
              {lowestRep ? formatPercentage(lowestRep.achievementPercentage) : '0%'}
            </span>
            <span className="text-xs text-slate-400">low</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            Top: {highestRep?.salesperson || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};
