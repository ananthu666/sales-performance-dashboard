import type { SalesRecord, UploadedExcelFile } from '../types/sales';

/**
 * The standard sessionStorage key for storing normalized sales data.
 */
export const SALES_STORAGE_KEY = 'bgh-sales-data';

/**
 * Checks if browser sessionStorage is available and functional.
 * Handles incognito mode, disabled storage, and security restrictions.
 */
export function isSessionStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    const testKey = '__bgh_storage_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to validate whether an unknown parsed object matches the SalesRecord contract.
 */
function isValidSalesRecord(item: unknown): item is SalesRecord {
  if (!item || typeof item !== 'object') return false;
  const record = item as Record<string, unknown>;

  return (
    typeof record.salesperson === 'string' &&
    record.salesperson.trim().length > 0 &&
    typeof record.month === 'string' &&
    record.month.trim().length > 0 &&
    typeof record.budget === 'number' &&
    !Number.isNaN(record.budget) &&
    Number.isFinite(record.budget) &&
    typeof record.actual === 'number' &&
    !Number.isNaN(record.actual) &&
    Number.isFinite(record.actual)
  );
}

/**
 * Saves normalized SalesRecord[] array into sessionStorage.
 * 
 * Rules:
 * - Only stores normalized JSON dataset (never raw File objects).
 * - Catches any storage quota or access exceptions gracefully.
 */
export function saveSalesDataToSession(records: SalesRecord[]): boolean {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(records);
    window.sessionStorage.setItem(SALES_STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn('Failed to persist sales data to sessionStorage:', error);
    return false;
  }
}

/**
 * Loads and validates sales records from sessionStorage.
 * 
 * Rules:
 * - If key is missing or empty, returns empty array [].
 * - If JSON is corrupted or does not conform to SalesRecord[], safely clears
 *   the corrupted value from sessionStorage and returns [].
 * - Never throws an exception.
 */
export function loadSalesDataFromSession(): SalesRecord[] {
  if (!isSessionStorageAvailable()) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    // Verify it is an array
    if (!Array.isArray(parsed)) {
      console.warn('Corrupted data in sessionStorage: expected array. Clearing storage.');
      clearSalesDataFromSession();
      return [];
    }

    // Verify all records conform to schema
    const validRecords: SalesRecord[] = [];
    for (const item of parsed) {
      if (!isValidSalesRecord(item)) {
        console.warn('Invalid record found in sessionStorage dataset. Clearing storage.');
        clearSalesDataFromSession();
        return [];
      }
      validRecords.push(item);
    }

    return validRecords;
  } catch (error) {
    console.warn('Error parsing JSON from sessionStorage. Clearing corrupted entry:', error);
    clearSalesDataFromSession();
    return [];
  }
}

export const SALES_META_KEY = 'bgh-sales-meta';

export interface SalesMetadata {
  fileName: string | null;
  isSampleData: boolean;
}

/**
 * Saves dataset metadata (file name and sample-data indicator) to sessionStorage.
 */
export function saveMetaToSession(meta: SalesMetadata): void {
  if (!isSessionStorageAvailable()) return;
  try {
    window.sessionStorage.setItem(SALES_META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.warn('Failed to save metadata to session:', err);
  }
}

/**
 * Loads stored dataset metadata from sessionStorage.
 */
export function loadMetaFromSession(): SalesMetadata {
  if (!isSessionStorageAvailable()) {
    return { fileName: null, isSampleData: false };
  }
  try {
    const raw = window.sessionStorage.getItem(SALES_META_KEY);
    if (!raw) return { fileName: null, isSampleData: false };
    const parsed = JSON.parse(raw);
    return {
      fileName: typeof parsed.fileName === 'string' ? parsed.fileName : null,
      isSampleData: Boolean(parsed.isSampleData),
    };
  } catch {
    return { fileName: null, isSampleData: false };
  }
}

/**
 * Storage key for the collection of uploaded Excel files.
 */
export const UPLOADED_FILES_KEY = 'bgh-uploaded-files';

/**
 * Validates whether an unknown object conforms to the UploadedExcelFile contract.
 */
function isValidUploadedFile(item: unknown): item is UploadedExcelFile {
  if (!item || typeof item !== 'object') return false;
  const file = item as Record<string, unknown>;

  return (
    typeof file.id === 'string' &&
    typeof file.fileName === 'string' &&
    typeof file.fileSize === 'number' &&
    typeof file.uploadedAt === 'string' &&
    Array.isArray(file.sheetNames) &&
    typeof file.recordCount === 'number' &&
    typeof file.totalBudget === 'number' &&
    typeof file.totalActual === 'number' &&
    Array.isArray(file.records) &&
    file.records.every(isValidSalesRecord)
  );
}

/**
 * Saves the list of uploaded Excel files to sessionStorage.
 */
export function saveUploadedFilesToSession(files: UploadedExcelFile[]): boolean {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(files);
    window.sessionStorage.setItem(UPLOADED_FILES_KEY, serialized);

    // Also synchronize flattened records into SALES_STORAGE_KEY for backward compatibility
    const flattened = files.flatMap((f) => f.records);
    saveSalesDataToSession(flattened);
    saveMetaToSession({
      fileName: files.length > 0 ? files[files.length - 1].fileName : null,
      isSampleData: false,
    });

    return true;
  } catch (error) {
    console.warn('Failed to persist uploaded files to sessionStorage:', error);
    return false;
  }
}

/**
 * Loads uploaded Excel files from sessionStorage, with fallback migration for legacy single-file sessions.
 */
export function loadUploadedFilesFromSession(): UploadedExcelFile[] {
  if (!isSessionStorageAvailable()) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(UPLOADED_FILES_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validFiles = parsed.filter(isValidUploadedFile);
        return validFiles;
      }
    }

    // Migration fallback: If legacy records exist in sessionStorage, migrate them
    const legacyRecords = loadSalesDataFromSession();
    if (legacyRecords.length > 0) {
      const legacyMeta = loadMetaFromSession();
      const migratedFile: UploadedExcelFile = {
        id: 'legacy-session-file',
        fileName: legacyMeta.fileName || 'Uploaded_Sales.xlsx',
        fileSize: 0,
        uploadedAt: new Date().toISOString(),
        sheetNames: ['Sheet1'],
        recordCount: legacyRecords.length,
        totalBudget: legacyRecords.reduce((sum, r) => sum + r.budget, 0),
        totalActual: legacyRecords.reduce((sum, r) => sum + r.actual, 0),
        records: legacyRecords,
      };
      saveUploadedFilesToSession([migratedFile]);
      return [migratedFile];
    }

    return [];
  } catch (error) {
    console.warn('Error reading uploaded files from sessionStorage:', error);
    return [];
  }
}

/**
 * Clears all uploaded files, sales datasets, and metadata from sessionStorage.
 */
export function clearSalesDataFromSession(): void {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(UPLOADED_FILES_KEY);
    window.sessionStorage.removeItem(SALES_STORAGE_KEY);
    window.sessionStorage.removeItem(SALES_META_KEY);
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
  }
}

