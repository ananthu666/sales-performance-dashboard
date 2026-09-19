import type {
  SalesRecord,
  SalespersonPerformance,
  TargetStatus,
  CompanyPerformanceSummary,
} from '../types/sales';

/**
 * Calculates achievement percentage safely without producing NaN or Infinity.
 * 
 * Formula: (actual / budget) * 100
 * 
 * Safe Zero Budget Handling:
 * - If budget <= 0 and actual <= 0: returns 0
 * - If budget <= 0 and actual > 0: returns 100 (target surpassed with no allocated budget)
 * - Otherwise: standard ratio rounded to finite numeric value
 */
export function calculateAchievementPercentage(actual: number, budget: number): number {
  if (budget <= 0) {
    return actual > 0 ? 100 : 0;
  }

  const percentage = (actual / budget) * 100;
  return Number.isFinite(percentage) ? percentage : 0;
}

/**
 * Determines target status based on achievement percentage.
 * 
 * Rules:
 * - Above Target when Achievement >= 100%
 * - Below Target when Achievement < 100%
 */
export function determineTargetStatus(achievementPercentage: number): TargetStatus {
  return achievementPercentage >= 100 ? 'Above Target' : 'Below Target';
}

/**
 * Aggregates monthly sales records by salesperson.
 * 
 * IMPORTANT:
 * Total Budget = sum of all monthly budgets
 * Total Actual = sum of all monthly actuals
 * Achievement % = (Total Actual / Total Budget) * 100
 * 
 * Achievement % is computed from the cumulative sums, NEVER by averaging
 * monthly percentages (which would distort weighting).
 */
export function aggregateSalespersonPerformance(records: SalesRecord[]): SalespersonPerformance[] {
  const salespersonMap = new Map<
    string,
    {
      totalBudget: number;
      totalActual: number;
      monthlyRecords: SalesRecord[];
    }
  >();

  // Single pass to accumulate sums per salesperson
  for (const record of records) {
    const existing = salespersonMap.get(record.salesperson);

    if (existing) {
      existing.totalBudget += record.budget;
      existing.totalActual += record.actual;
      existing.monthlyRecords.push(record);
    } else {
      salespersonMap.set(record.salesperson, {
        totalBudget: record.budget,
        totalActual: record.actual,
        monthlyRecords: [record],
      });
    }
  }

  // Transform accumulated groups into typed performance metrics
  const results: SalespersonPerformance[] = [];

  for (const [salesperson, data] of salespersonMap.entries()) {
    const achievementPercentage = calculateAchievementPercentage(
      data.totalActual,
      data.totalBudget
    );

    results.push({
      salesperson,
      totalBudget: data.totalBudget,
      totalActual: data.totalActual,
      variance: data.totalActual - data.totalBudget,
      achievementPercentage,
      status: determineTargetStatus(achievementPercentage),
      monthlyRecords: data.monthlyRecords,
    });
  }

  return results;
}

/**
 * Computes company-wide totals and KPI overview across all salespeople.
 */
export function calculateCompanySummary(
  performances: SalespersonPerformance[]
): CompanyPerformanceSummary {
  const totalBudget = performances.reduce((acc, curr) => acc + curr.totalBudget, 0);
  const totalActual = performances.reduce((acc, curr) => acc + curr.totalActual, 0);
  const variance = totalActual - totalBudget;
  const overallAchievementPercentage = calculateAchievementPercentage(totalActual, totalBudget);
  const overallStatus = determineTargetStatus(overallAchievementPercentage);

  let salespeopleAboveTarget = 0;
  let salespeopleBelowTarget = 0;
  let topPerformer: SalespersonPerformance | null = null;

  for (const perf of performances) {
    if (perf.status === 'Above Target') {
      salespeopleAboveTarget += 1;
    } else {
      salespeopleBelowTarget += 1;
    }

    if (!topPerformer || perf.achievementPercentage > topPerformer.achievementPercentage) {
      topPerformer = perf;
    }
  }

  return {
    totalBudget,
    totalActual,
    variance,
    overallAchievementPercentage,
    overallStatus,
    salespeopleAboveTarget,
    salespeopleBelowTarget,
    topPerformer,
    totalSalespeople: performances.length,
  };
}

/**
 * Helper to format currency numbers cleanly (e.g. $125,000)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Helper to format percentages cleanly (e.g. 106.9%)
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

const MONTH_ORDER_MAP: Record<string, number> = {
  january: 1, jan: 1, '01': 1, '1': 1,
  february: 2, feb: 2, '02': 2, '2': 2,
  march: 3, mar: 3, '03': 3, '3': 3,
  april: 4, apr: 4, '04': 4, '4': 4,
  may: 5, '05': 5, '5': 5,
  june: 6, jun: 6, '06': 6, '6': 6,
  july: 7, jul: 7, '07': 7, '7': 7,
  august: 8, aug: 8, '08': 8, '8': 8,
  september: 9, sep: 9, sept: 9, '09': 9, '9': 9,
  october: 10, oct: 10, '10': 10,
  november: 11, nov: 11, '11': 11,
  december: 12, dec: 12, '12': 12,
};

const MONTH_SHORT_MAP: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

/**
 * Converts any month string or index to a standardized 3-letter short form (e.g. "January" -> "Jan").
 */
export function formatSingleMonthShort(monthStr: string): string {
  const clean = monthStr.toLowerCase().trim();
  const num = MONTH_ORDER_MAP[clean];
  if (num && MONTH_SHORT_MAP[num]) {
    return MONTH_SHORT_MAP[num];
  }
  const trimmed = monthStr.trim();
  return trimmed.length <= 3 ? trimmed : trimmed.slice(0, 3);
}

/**
 * Formats an array of selected months into a clean, comma-separated list of short months (e.g. "Jan, Mar, May").
 * Sorts months in chronological calendar order.
 * If all months are selected or empty, returns "All Months".
 */
export function formatMonthsShort(months?: string[], availableCount?: number): string {
  if (!months || months.length === 0 || months.includes('ALL')) {
    return 'All Months';
  }
  if (availableCount && availableCount > 0 && months.length === availableCount) {
    return 'All Months';
  }
  if (months.length === 12) {
    return 'All Months';
  }

  // Sort months chronologically by calendar order (Jan to Dec)
  const sorted = [...months].sort((a, b) => {
    const orderA = MONTH_ORDER_MAP[a.toLowerCase().trim()] ?? 99;
    const orderB = MONTH_ORDER_MAP[b.toLowerCase().trim()] ?? 99;
    return orderA - orderB;
  });

  // Map to 3-letter short forms and deduplicate
  const shortList: string[] = [];
  const seen = new Set<string>();

  for (const m of sorted) {
    const short = formatSingleMonthShort(m);
    if (!seen.has(short.toLowerCase())) {
      seen.add(short.toLowerCase());
      shortList.push(short);
    }
  }

  return shortList.join(', ');
}

