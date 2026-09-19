import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { SalesRecord, SalespersonPerformance } from '../../types/sales';
import {
  aggregateSalespersonPerformance,
  formatCurrency,
  formatPercentage,
} from '../../utils/calculations';

export interface SalesChartProps {
  /** Aggregated performance data per salesperson (same data source as the table) */
  performances?: SalespersonPerformance[];
  /** Or raw sales records, which will be aggregated via the exact same utility */
  records?: SalesRecord[];
  /** Optional title */
  title?: string;
  /** Optional description */
  description?: string;
}

interface ChartItem {
  name: string;
  budget: number;
  actual: number;
  achievementPercentage: number;
  variance: number;
  status: string;
}

/**
 * Custom Tooltip for the Budget vs Actual Bar Chart.
 */
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: ChartItem;
  }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const isAboveTarget = data.status === 'Above Target';

  return (
    <div className="rounded-xl border border-[#EADBDE] bg-white/95 backdrop-blur-xs p-4 shadow-xl text-xs space-y-2.5 min-w-[220px]">
      <div className="flex items-center justify-between border-b border-[#F5EFF2] pb-2">
        <span className="font-bold text-slate-900 text-sm">
          {label}
        </span>
        <span
          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
            isAboveTarget
              ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="space-y-1.5 font-medium">
        <div className="flex justify-between items-center text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#DE5829] inline-block" />
            Budget Target:
          </span>
          <span className="font-bold text-slate-900">
            {formatCurrency(data.budget)}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#631244] inline-block" />
            Actual Sales:
          </span>
          <span className="font-bold text-slate-900">
            {formatCurrency(data.actual)}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-[#F5EFF2]">
          <span>Achievement %:</span>
          <span
            className={`font-extrabold ${
              isAboveTarget ? 'text-[#631244]' : 'text-rose-600'
            }`}
          >
            {formatPercentage(data.achievementPercentage)}
          </span>
        </div>

        <div className="flex justify-between items-center text-slate-500 text-[11px]">
          <span>Variance:</span>
          <span className="font-semibold text-slate-800">
            {data.variance >= 0 ? '+' : ''}
            {formatCurrency(data.variance)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SalesChart: React.FC<SalesChartProps> = ({
  performances: initialPerformances,
  records,
  title = 'Budget vs. Actual Sales per Salesperson',
  description = 'Side-by-side comparison of allocated sales target and revenue achieved',
}) => {
  // 1. Resolve performance data using the shared single source of truth
  const performances = useMemo<SalespersonPerformance[]>(() => {
    if (initialPerformances) {
      return initialPerformances;
    }
    if (records) {
      return aggregateSalespersonPerformance(records);
    }
    return [];
  }, [initialPerformances, records]);

  // 2. Format data specifically for Recharts BarChart consumption
  const chartData = useMemo<ChartItem[]>(() => {
    return performances.map((p) => ({
      name: p.salesperson,
      budget: p.totalBudget,
      actual: p.totalActual,
      achievementPercentage: p.achievementPercentage,
      variance: p.variance,
      status: p.status,
    }));
  }, [performances]);

  type ViewScope = 'top10' | 'top15' | 'all';
  const [viewScope, setViewScope] = useState<ViewScope>('all');

  // Sorted chart data by actual sales descending for clear visual ranking
  const sortedData = useMemo(() => {
    return [...chartData].sort((a, b) => b.actual - a.actual);
  }, [chartData]);

  // Sliced data based on active viewScope filter
  const displayedData = useMemo(() => {
    if (viewScope === 'top10') {
      return sortedData.slice(0, 10);
    }
    if (viewScope === 'top15') {
      return sortedData.slice(0, 15);
    }
    return sortedData;
  }, [sortedData, viewScope]);

  // Calculate dynamic minimum canvas width so each bar gets at least 56px
  const minCanvasWidth = useMemo(() => {
    if (viewScope !== 'all') return '100%';
    if (displayedData.length > 12) {
      return `${displayedData.length * 58}px`;
    }
    return '100%';
  }, [viewScope, displayedData.length]);

  // Truncate name on X-axis tick if long, while tooltip retains full name
  const formatXAxisTick = (name: string) => {
    if (!name) return '';
    if (name.length > 15) {
      return `${name.slice(0, 13)}…`;
    }
    return name;
  };

  // Y-axis tick formatter: abbreviates large wholesale sums (e.g. $450k)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  return (
    <div className="w-full rounded-2xl border border-[#EADBDE] bg-white shadow-2xs p-5 sm:p-6">
      {/* Header with View Scope Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#631244]" />
            {title}
          </h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {chartData.length > 10 && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* View Scope Segmented Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] text-xs">
              <span className="text-[11px] font-semibold text-slate-400 px-2">Show:</span>
              <button
                type="button"
                onClick={() => setViewScope('top10')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewScope === 'top10'
                    ? 'bg-[#631244] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setViewScope('top15')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewScope === 'top15'
                    ? 'bg-[#631244] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top 15
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewScope === 'all'
                    ? 'bg-[#631244] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({chartData.length})
              </button>
            </div>

            {viewScope === 'all' && displayedData.length > 12 && (
              <span className="text-[10px] font-semibold text-slate-400 hidden xl:inline">
                (Scroll canvas horizontally)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart Canvas or Empty State */}
      {chartData.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#EADBDE] rounded-xl bg-[#FAF8F6]">
          <BarChart3 className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-bold text-slate-800">
            No Chart Data Available
          </p>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Upload an Excel workbook or load sample data to view the Budget vs Actual comparison.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
          <div style={{ minWidth: minCanvasWidth, width: '100%', height: '390px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayedData}
                margin={{ top: 10, right: 20, left: 10, bottom: 55 }}
                barGap={4}
                barCategoryGap="22%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F2EAEF"
                />

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
                  tickFormatter={formatYAxis}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7A6B73', fontSize: 11 }}
                  width={65}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(251, 242, 247, 0.6)' }} />

                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600 }}
                />

                {/* Grouped Bars with Official BGH Logo Colors */}
                {/* Budget Bar in Terracotta Orange #DE5829 */}
                <Bar
                  dataKey="budget"
                  name="Budget Target"
                  fill="#DE5829"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />

                {/* Actual Sales Bar in Deep Plum #631244 */}
                <Bar
                  dataKey="actual"
                  name="Actual Sales"
                  fill="#631244"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
