/**
 * Required column headers expected in the Excel sheet.
 */
export const REQUIRED_COLUMNS = [
  'Salesperson',
  'Month',
  'Budget Amount',
  'Actual Sales',
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

/**
 * Result of validating and parsing a numeric cell.
 */
export interface NumericParseResult {
  isValid: boolean;
  value: number;
  error?: string;
}

/**
 * Safely parses an unknown cell value into a valid finite number.
 * 
 * - Strips currency symbols ($, €, £, etc.) and commas
 * - Rejects non-numeric strings, empty cells, boolean, objects
 * - Guarantees that neither NaN nor Infinity is returned
 */
export function parseNumericCell(value: unknown, fieldName: string): NumericParseResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      value: 0,
      error: `Missing value for "${fieldName}". Expected a valid number.`,
    };
  }

  // If already a JavaScript number
  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return {
        isValid: false,
        value: 0,
        error: `Invalid number format for "${fieldName}". Got NaN or Infinity.`,
      };
    }
    return {
      isValid: true,
      value,
    };
  }

  // If string, clean and parse
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return {
        isValid: false,
        value: 0,
        error: `Empty value for "${fieldName}". Expected a valid number.`,
      };
    }

    // Strip currency symbols, commas, and extraneous spaces
    const sanitized = trimmed.replace(/[$€£¥₹\s,]/g, '');

    // Strict regex check for numeric format (allows optional minus and decimal)
    if (!/^-?\d+(\.\d+)?$/.test(sanitized)) {
      return {
        isValid: false,
        value: 0,
        error: `"${trimmed}" is not a valid numeric value for "${fieldName}".`,
      };
    }

    const parsed = parseFloat(sanitized);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      return {
        isValid: false,
        value: 0,
        error: `Unable to parse "${trimmed}" as a number for "${fieldName}".`,
      };
    }

    return {
      isValid: true,
      value: parsed,
    };
  }

  return {
    isValid: false,
    value: 0,
    error: `Unsupported cell data type for "${fieldName}".`,
  };
}

/**
 * Checks whether an Excel row is entirely empty (e.g. trailing blanks).
 */
export function isRowEmpty(row: Record<string, unknown>): boolean {
  if (!row || typeof row !== 'object') return true;

  const values = Object.values(row);
  if (values.length === 0) return true;

  return values.every((val) => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string' && val.trim() === '') return true;
    return false;
  });
}

/**
 * Validates that all required headers exist in the sheet, allowing for
 * case-insensitivity and whitespace trimming.
 * 
 * Returns a map from canonical column name -> actual column name in worksheet.
 */
export function validateHeaders(
  actualHeaders: string[]
): {
  isValid: boolean;
  missingHeaders: string[];
  canonicalToActualMap: Map<RequiredColumn, string>;
} {
  const canonicalToActualMap = new Map<RequiredColumn, string>();
  const missingHeaders: string[] = [];

  // Normalize actual headers for comparison: lowercased, spaces normalized
  const normalizedActual = actualHeaders.map((h) => ({
    raw: h,
    normalized: (h || '').trim().toLowerCase().replace(/\s+/g, ' '),
  }));

  for (const required of REQUIRED_COLUMNS) {
    const requiredNormalized = required.toLowerCase();
    
    // Find matching actual header
    const match = normalizedActual.find(
      (a) => a.normalized === requiredNormalized
    );

    if (match) {
      canonicalToActualMap.set(required, match.raw);
    } else {
      missingHeaders.push(required);
    }
  }

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
    canonicalToActualMap,
  };
}
