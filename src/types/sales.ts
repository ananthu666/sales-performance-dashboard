/**
 * Core sales transaction record representing a salesperson's performance
 * for a specific month.
 */
export interface SalesRecord {
  salesperson: string;
  month: string;
  budget: number;
  actual: number;
}

/**
 * Performance status classification against target budget.
 */
export type TargetStatus = 'Above Target' | 'Below Target';

/**
 * Aggregated sales performance metrics for a single salesperson
 * computed across multiple months or a filtered timeframe.
 */
export interface SalespersonPerformance {
  salesperson: string;
  totalBudget: number;
  totalActual: number;
  variance: number;               // totalActual - totalBudget
  achievementPercentage: number;  // (totalActual / totalBudget) * 100
  status: TargetStatus;
  monthlyRecords: SalesRecord[];
}

/**
 * Company-wide aggregated summary across all salespeople.
 */
export interface CompanyPerformanceSummary {
  totalBudget: number;
  totalActual: number;
  variance: number;
  overallAchievementPercentage: number;
  overallStatus: TargetStatus;
  salespeopleAboveTarget: number;
  salespeopleBelowTarget: number;
  topPerformer: SalespersonPerformance | null;
  totalSalespeople: number;
}

/**
 * Specific error detailing an invalid row during Excel parsing.
 */
export interface RowValidationError {
  sheetName?: string; // Worksheet where the error occurred
  rowNumber: number;  // 1-based Excel row number (e.g. Row 2, Row 3...)
  field: string;
  value: unknown;
  message: string;
}

/**
 * Structured outcome returned by the client-side Excel parser.
 */
export interface ExcelParseResult {
  success: boolean;
  records: SalesRecord[];
  errors: string[];
  rowErrors: RowValidationError[];
  fileName: string;
  sheetNames: string[];
  totalRowsProcessed: number;
  validRowsCount: number;
}

/**
 * Metadata and payload for an uploaded Excel spreadsheet persisted in session.
 */
export interface UploadedExcelFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string; // ISO 8601 timestamp string
  sheetNames: string[];
  recordCount: number;
  totalBudget: number;
  totalActual: number;
  records: SalesRecord[];
}

