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
