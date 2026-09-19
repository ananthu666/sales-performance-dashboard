import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Award } from 'lucide-react';
import type { SalespersonPerformance } from '../../types/sales';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export interface AchievementRankingChartProps {
  performances: SalespersonPerformance[];
}

interface RankingItem {
  name: string;
  achievementPercentage: number;
  variance: number;
  budget: number;
  actual: number;
  isAboveTarget: boolean;
}

const CustomRankingTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: RankingItem;
  }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isAbove = data.isAboveTarget;

  return (
    <div className="rounded-xl border border-[#EADBDE] bg-white/95 backdrop-blur-xs p-3.5 shadow-xl text-xs space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-[#F5EFF2] pb-1.5">
        <span className="font-bold text-slate-900">{label}</span>
        <span
          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
            isAbove
              ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
              : 'bg-[#FDF4F0] text-[#DE5829] border border-[#F8CBBA]'
          }`}
        >
          {isAbove ? 'Above Target' : 'Below Target'}
        </span>
      </div>

      <div className="space-y-1 text-slate-600 font-medium">
        <div className="flex justify-between">
          <span>Achievement:</span>
          <span className={`font-extrabold ${isAbove ? 'text-[#631244]' : 'text-[#DE5829]'}`}>
            {formatPercentage(data.achievementPercentage)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Actual Sales:</span>
          <span className="font-bold text-slate-900">{formatCurrency(data.actual)}</span>
        </div>
        <div className="flex justify-between">
          <span>Target Budget:</span>
          <span>{formatCurrency(data.budget)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-[#F5EFF2]">
          <span>Variance:</span>
          <span className={`font-bold ${data.variance >= 0 ? 'text-[#631244]' : 'text-rose-600'}`}>
            {data.variance >= 0 ? '+' : ''}
            {formatCurrency(data.variance)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const AchievementRankingChart: React.FC<AchievementRankingChartProps> = ({
  performances,
}) => {
  // Sort representatives descending by achievement %
  const chartData = useMemo<RankingItem[]>(() => {
    return [...performances]
      .sort((a, b) => b.achievementPercentage - a.achievementPercentage)
      .map((p) => ({
        name: p.salesperson,
        achievementPercentage: Math.round(p.achievementPercentage * 10) / 10,
        variance: p.variance,
        budget: p.totalBudget,
        actual: p.totalActual,
        isAboveTarget: p.status === 'Above Target',
      }));
  }, [performances]);

  type RankingScope = 'top10' | 'top15' | 'bottom10' | 'all';
  const [rankingScope, setRankingScope] = useState<RankingScope>('all');

  // Sliced data based on active rankingScope filter
  const displayedData = useMemo(() => {
    if (rankingScope === 'top10') {
      return chartData.slice(0, 10);
    }
    if (rankingScope === 'top15') {
      return chartData.slice(0, 15);
    }
    if (rankingScope === 'bottom10') {
      return [...chartData].reverse().slice(0, 10);
    }
    return chartData;
  }, [chartData, rankingScope]);

  // Calculate dynamic minimum canvas width so each bar gets at least 56px
  const minCanvasWidth = useMemo(() => {
    if (rankingScope !== 'all') return '100%';
    if (displayedData.length > 12) {
      return `${displayedData.length * 56}px`;
    }
    return '100%';
  }, [rankingScope, displayedData.length]);

  // Truncate name on X-axis tick if long
  const formatXAxisTick = (name: string) => {
    if (!name) return '';
    if (name.length > 15) {
      return `${name.slice(0, 13)}…`;
    }
    return name;
  };

  return (
    <div className="w-full rounded-2xl border border-[#EADBDE] bg-white shadow-2xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#DE5829]" />
            Achievement Rate & Target Benchmark (100%)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Representatives ranked by quota achievement percentage against the 100% target baseline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {chartData.length > 10 && (
            <div className="flex items-center p-1 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] text-xs">
              <span className="text-[11px] font-semibold text-slate-400 px-2">Show:</span>
              <button
                type="button"
                onClick={() => setRankingScope('top10')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  rankingScope === 'top10'
                    ? 'bg-[#631244] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setRankingScope('top15')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  rankingScope === 'top15'
                    ? 'bg-[#631244] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top 15
              </button>
              <button
                type="button"
                onClick={() => setRankingScope('bottom10')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  rankingScope === 'bottom10'
                    ? 'bg-[#DE5829] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bottom 10
              </button>
              <button
                type="button"
                onClick={() => setRankingScope('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  rankingScope === 'all'
                    ? 'bg-[#631244] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({chartData.length})
              </button>
            </div>
          )}

          <div className="hidden md:flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#631244]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#631244]" />
              Above 100%
            </span>
            <span className="flex items-center gap-1.5 text-[#DE5829]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#DE5829]" />
              Below 100%
            </span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#EADBDE] rounded-xl bg-[#FAF8F6]">
          <Award className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-600">No achievement data available</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
          <div style={{ minWidth: minCanvasWidth, width: '100%', height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedData}
                margin={{ top: 15, right: 20, left: 10, bottom: 55 }}
                barCategoryGap="24%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EAEF" />

                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#EADBDE', strokeWidth: 1 }}
                  tick={{ fill: '#4A3B43', fontSize: 11, fontWeight: 500 }}
                  interval={0}
                  angle={displayedData.length > 5 ? -35 : 0}
                  textAnchor={displayedData.length > 5 ? 'end' : 'middle'}
                  height={displayedData.length > 5 ? 65 : 30}
                  tickFormatter={formatXAxisTick}
                />

                <YAxis
                  unit="%"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7A6B73', fontSize: 11 }}
                  width={50}
                />

                {/* 100% Target Reference Benchmark */}
                <ReferenceLine
                  y={100}
                  stroke="#DE5829"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '100% Target',
                    position: 'top',
                    fill: '#DE5829',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />

                <Tooltip content={<CustomRankingTooltip />} cursor={{ fill: 'rgba(251, 242, 247, 0.6)' }} />

                <Bar dataKey="achievementPercentage" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {displayedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isAboveTarget ? '#631244' : '#DE5829'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
