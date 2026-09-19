import * as XLSX from 'xlsx';
import type { SalesRecord, ExcelParseResult, RowValidationError } from '../types/sales';
import {
  parseNumericCell,
  isRowEmpty,
  validateHeaders,
  REQUIRED_COLUMNS,
} from './validation';

/**
 * Validates the file extension to ensure it is a supported Excel spreadsheet.
 */
export function isValidExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.xlsx') || name.endsWith('.xls');
}

/**
 * Parses an uploaded Excel File (.xlsx or .xls) entirely in the browser using SheetJS.
 * 
 * Guarantees:
 * - Runs 100% in-browser; zero data leaves the client.
 * - Enforces required columns: Salesperson, Month, Budget Amount, Actual Sales.
 * - Rejects malformed rows with clear, 1-based Excel row numbering.
 * - Skips empty or blank rows automatically.
 * - Prevents NaN, Infinity, or unparsed currency strings from entering the data layer.
 * - Strictly typed without leaky 'any' types.
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  const result: ExcelParseResult = {
    success: false,
    records: [],
    errors: [],
    rowErrors: [],
    fileName: file.name,
    sheetNames: [],
    totalRowsProcessed: 0,
    validRowsCount: 0,
  };

  // 1. Validate file format extension
  if (!isValidExcelFile(file)) {
    result.errors.push(
      `Invalid file format for "${file.name}". Please upload an Excel workbook with .xlsx or .xls extension.`
    );
    return result;
  }

  // 2. Read file as ArrayBuffer in the browser
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    result.errors.push(`Failed to read the file "${file.name}". The file may be locked or inaccessible.`);
    return result;
  }

  // 3. Parse workbook with SheetJS
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: false,
      raw: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown SheetJS error';
    result.errors.push(`Could not parse the Excel file. It may be corrupt or encrypted. (${message})`);
    return result;
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    result.errors.push('The Excel workbook contains no worksheets.');
    return result;
  }

  // Temporary container to collect records across all sheets before committing
  const accumulatedRecords: SalesRecord[] = [];
  const validSheetNames: string[] = [];
  let totalProcessedAcrossWorkbook = 0;

  // Track unique (salesperson, month) pairs across the entire workbook
  // key: "salesperson|month" -> location description
  const seenSalespersonMonthPairs = new Map<string, string>();

  // Count non-empty sheets evaluated
  let sheetsWithDataCount = 0;

  // 4. Iterate over each sheet in the workbook
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      continue;
    }

    // Inspect headers from the first row of this sheet
    const sheetHeaderMatrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
    });

    // If worksheet is completely blank (0 rows), check if there are other sheets
    if (sheetHeaderMatrix.length === 0) {
      continue;
    }

    const firstRow = sheetHeaderMatrix[0];
    const detectedHeaders: string[] = Array.isArray(firstRow)
      ? firstRow.map((cell) => String(cell ?? '').trim()).filter((h) => h.length > 0)
      : [];

    // If first row has no content at all, skip if no rows
    if (detectedHeaders.length === 0 && sheetHeaderMatrix.length <= 1) {
      continue;
    }

    sheetsWithDataCount++;

    // Strict validation: Template headers must exist on any sheet containing data
    const headerValidation = validateHeaders(detectedHeaders);

    if (!headerValidation.isValid) {
      result.errors.push(
        `Sheet "${sheetName}": Template variation detected! Missing required column(s): ${headerValidation.missingHeaders.map((h) => `"${h}"`).join(', ')}. ` +
        `All sheets in the workbook must strictly contain: ${REQUIRED_COLUMNS.map((h) => `"${h}"`).join(', ')}.`
      );
      // Strict rule: Do not continue, or record error so entire transaction is aborted
      continue;
    }

    // Convert sheet rows to row objects
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: null,
      raw: true,
    });

    const canonicalMap = headerValidation.canonicalToActualMap;
    const colSalesperson = canonicalMap.get('Salesperson')!;
    const colMonth = canonicalMap.get('Month')!;
    const colBudget = canonicalMap.get('Budget Amount')!;
    const colActual = canonicalMap.get('Actual Sales')!;

    let sheetRowsProcessed = 0;
    const sheetRecords: SalesRecord[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      const excelRowNumber = i + 2; // Row 1 is header (1-indexed)

      // Skip completely empty rows
      if (isRowEmpty(rawRow)) {
        continue;
      }

      sheetRowsProcessed++;
      totalProcessedAcrossWorkbook++;

      const rowErrors: RowValidationError[] = [];

      // Validate Salesperson
      const rawSalesperson = rawRow[colSalesperson];
      let salesperson = '';
      if (rawSalesperson === null || rawSalesperson === undefined || String(rawSalesperson).trim() === '') {
        rowErrors.push({
          sheetName,
          rowNumber: excelRowNumber,
          field: 'Salesperson',
          value: rawSalesperson,
          message: `Sheet "${sheetName}", Row ${excelRowNumber}: "Salesperson" name is missing or blank.`,
        });
      } else {
        salesperson = String(rawSalesperson).trim();
      }

      // Validate Month
      const rawMonth = rawRow[colMonth];
      let month = '';
      if (rawMonth === null || rawMonth === undefined || String(rawMonth).trim() === '') {
        rowErrors.push({
          sheetName,
          rowNumber: excelRowNumber,
          field: 'Month',
          value: rawMonth,
          message: `Sheet "${sheetName}", Row ${excelRowNumber}: "Month" is missing or blank.`,
        });
      } else {
        month = String(rawMonth).trim();
      }

      // Check for duplicate (salesperson, month) records across entire workbook
      if (salesperson && month) {
        const pairKey = `${salesperson.toLowerCase()}|${month.toLowerCase()}`;
        const existingLocation = seenSalespersonMonthPairs.get(pairKey);
        if (existingLocation) {
          rowErrors.push({
            sheetName,
            rowNumber: excelRowNumber,
            field: 'Duplicate Entry',
            value: `${salesperson} - ${month}`,
            message: `Sheet "${sheetName}", Row ${excelRowNumber}: Duplicate record for "${salesperson}" in "${month}" (already recorded in ${existingLocation}). Each salesperson can only have one target per month.`,
          });
        } else {
          seenSalespersonMonthPairs.set(pairKey, `Sheet "${sheetName}", Row ${excelRowNumber}`);
        }
      }

      // Validate Budget Amount (Strict numeric validation - rejects text)
      const rawBudget = rawRow[colBudget];
      const budgetResult = parseNumericCell(rawBudget, 'Budget Amount');
      if (!budgetResult.isValid) {
        const valueDesc = typeof rawBudget === 'string' ? `"${rawBudget}"` : String(rawBudget);
        rowErrors.push({
          sheetName,
          rowNumber: excelRowNumber,
          field: 'Budget Amount',
          value: rawBudget,
          message: `Sheet "${sheetName}", Row ${excelRowNumber}: Invalid value ${valueDesc} for "Budget Amount". Numeric value expected, text is not allowed.`,
        });
      }

      // Validate Actual Sales (Strict numeric validation - rejects text)
      const rawActual = rawRow[colActual];
      const actualResult = parseNumericCell(rawActual, 'Actual Sales');
      if (!actualResult.isValid) {
        const valueDesc = typeof rawActual === 'string' ? `"${rawActual}"` : String(rawActual);
        rowErrors.push({
          sheetName,
          rowNumber: excelRowNumber,
          field: 'Actual Sales',
          value: rawActual,
          message: `Sheet "${sheetName}", Row ${excelRowNumber}: Invalid value ${valueDesc} for "Actual Sales". Numeric value expected, text is not allowed.`,
        });
      }

      if (rowErrors.length > 0) {
        result.rowErrors.push(...rowErrors);
      } else {
        sheetRecords.push({
          salesperson,
          month,
          budget: budgetResult.value,
          actual: actualResult.value,
        });
      }
    }

    if (sheetRecords.length > 0) {
      accumulatedRecords.push(...sheetRecords);
      validSheetNames.push(sheetName);
    }
  }

  result.totalRowsProcessed = totalProcessedAcrossWorkbook;
  result.sheetNames = validSheetNames;

  // Verify that at least one worksheet had data
  if (sheetsWithDataCount === 0 || totalProcessedAcrossWorkbook === 0) {
    result.errors.push(
      'The uploaded Excel workbook contains no data rows. Please ensure your spreadsheet has rows filled beneath the column headers.'
    );
  }

  // ATOMIC TRANSACTION RULE:
  // If ANY header error or ANY row error occurred anywhere in the workbook,
  // the ENTIRE transaction is stopped. Zero records are imported!
  const hasErrors = result.errors.length > 0 || result.rowErrors.length > 0;

  if (hasErrors) {
    result.success = false;
    result.records = []; // Atomic abort - nothing stored
    result.validRowsCount = 0;
  } else {
    result.success = accumulatedRecords.length > 0;
    result.records = accumulatedRecords;
    result.validRowsCount = accumulatedRecords.length;
  }

  return result;
}

/**
 * Utility to generate an in-memory Excel workbook (.xlsx binary Uint8Array)
 * from sales records or sample data for demonstration / download templates.
 */
export function createSalesExcelBuffer(records: SalesRecord[]): Uint8Array {
  // Transform to the official Excel column headers
  const excelData = records.map((r) => ({
    'Salesperson': r.salesperson,
    'Month': r.month,
    'Budget Amount': r.budget,
    'Actual Sales': r.actual,
  }));


  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Performance');

  // Write as binary array
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
  return buffer;
}

/**
 * Official template guidance rows to demonstrate column layout and formatting.
 */
export const OFFICIAL_TEMPLATE_ROWS: SalesRecord[] = [
  {
    salesperson: 'Ahmed Hassan',
    month: 'January',
    budget: 50000,
    actual: 54200,
  },
  {
    salesperson: 'Sara Ali',
    month: 'January',
    budget: 45000,
    actual: 43100,
  },
  {
    salesperson: 'Mohammed Salem',
    month: 'January',
    budget: 60000,
    actual: 61500,
  },
  {
    salesperson: 'Fatima Noor',
    month: 'January',
    budget: 40000,
    actual: 38800,
  },
];

/**
 * Downloads the official Bettergrow Excel template (.xlsx)
 * with the exact required column headers:
 * - Salesperson
 * - Month
 * - Budget Amount
 * - Actual Sales
 */
export function downloadSalesTemplateFile(): void {
  try {
    const buffer = createSalesExcelBuffer(OFFICIAL_TEMPLATE_ROWS);
    const blob = new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bettergrow_Sales_Template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to trigger template Excel download:', err);
  }
}

/**
 * Backward-compatible helper for downloading template or sales records.
 */
export function downloadSampleExcelFile(_records: SalesRecord[] = OFFICIAL_TEMPLATE_ROWS): void {
  downloadSalesTemplateFile();
}


