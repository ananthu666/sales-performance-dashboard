import { useState, useMemo, useCallback } from 'react';
import type {
  SalesRecord,
  SalespersonPerformance,
  CompanyPerformanceSummary,
  UploadedExcelFile,
} from '../types/sales';
import {
  loadUploadedFilesFromSession,
  saveUploadedFilesToSession,
  clearSalesDataFromSession,
} from '../utils/storage';
import {
  aggregateSalespersonPerformance,
  calculateCompanySummary,
} from '../utils/calculations';

const MONTH_ORDER: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

export interface UseSalesDataReturn {
  // Multi-file ledger state
  uploadedFiles: UploadedExcelFile[];
  salesData: SalesRecord[];
  fileName: string | null;
  hasData: boolean;

  // Month filtering (supports single and multiple month selections)
  selectedMonth: string;
  selectedMonths: string[];
  setSelectedMonth: (month: string) => void;
  setSelectedMonths: (months: string[]) => void;
  toggleMonth: (month: string) => void;
  availableMonths: string[];

  // Derived calculations (based on active filter)
  activeRecords: SalesRecord[];
  salespersonPerformances: SalespersonPerformance[];
  companySummary: CompanyPerformanceSummary;

  // State actions
  addUploadedFile: (file: UploadedExcelFile) => void;
  removeUploadedFile: (fileId: string) => void;
  setAndPersistSalesData: (records: SalesRecord[], fileName?: string) => void;
  resetSalesData: () => void;
}

/**
 * Custom hook managing the multi-file application sales dataset.
 * 
 * Architecture:
 * - Multi-file ledger (UploadedExcelFile[]) is the primary session source.
 * - Flat salesData is derived directly from all active uploaded files.
 * - Hydrates safely from sessionStorage on mount.
 * - Deleting or adding a file recalculates all metrics, KPIs, and aggregations reactively.
 * - Reset clears all files from React state and sessionStorage.
 */
export function useSalesData(): UseSalesDataReturn {
  // 1. Multi-file ledger state initialized lazily from sessionStorage
  const [uploadedFiles, setUploadedFiles] = useState<UploadedExcelFile[]>(() => {
    return loadUploadedFilesFromSession();
  });

  // Filter state: empty array represents ALL months included
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Derived: Flattened sales records across all uploaded workbooks
  const salesData = useMemo(() => {
    return uploadedFiles.flatMap((file) => file.records);
  }, [uploadedFiles]);

  // Derived: Active file name description
  const fileName = useMemo(() => {
    if (uploadedFiles.length === 0) return null;
    if (uploadedFiles.length === 1) return uploadedFiles[0].fileName;
    return `${uploadedFiles.length} files (${uploadedFiles[0].fileName} + ${uploadedFiles.length - 1} more)`;
  }, [uploadedFiles]);

  // 2. Add an uploaded file into the ledger and synchronize sessionStorage
  const addUploadedFile = useCallback((newFile: UploadedExcelFile) => {
    setUploadedFiles((prev) => {
      // If a file with the same filename was previously uploaded, replace it; otherwise prepend
      const filtered = prev.filter(
        (f) => f.id !== newFile.id && f.fileName.toLowerCase() !== newFile.fileName.toLowerCase()
      );
      const updated = [newFile, ...filtered];
      saveUploadedFilesToSession(updated);
      return updated;
    });
    setSelectedMonths([]); // Reset month filter on new data upload
  }, []);

  // 3. Remove a specific file from the session ledger
  const removeUploadedFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      if (updated.length === 0) {
        clearSalesDataFromSession();
      } else {
        saveUploadedFilesToSession(updated);
      }
      return updated;
    });
  }, []);

  // 4. Legacy / simple setter: wraps into an UploadedExcelFile
  const setAndPersistSalesData = useCallback(
    (records: SalesRecord[], uploadedName?: string) => {
      const resolvedName = uploadedName || 'Uploaded_Sales.xlsx';
      const newFile: UploadedExcelFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: resolvedName,
        fileSize: 0,
        uploadedAt: new Date().toISOString(),
        sheetNames: ['Sheet1'],
        recordCount: records.length,
        totalBudget: records.reduce((sum, r) => sum + r.budget, 0),
        totalActual: records.reduce((sum, r) => sum + r.actual, 0),
        records,
      };
      addUploadedFile(newFile);
    },
    [addUploadedFile]
  );

  // 5. Reset data: clears all files and removes sessionStorage entries
  const resetSalesData = useCallback(() => {
    setUploadedFiles([]);
    clearSalesDataFromSession();
    setSelectedMonths([]);
  }, []);

  // Derived: List of unique months present in current active records (chronologically sorted)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const record of salesData) {
      if (record.month) {
        months.add(record.month.trim());
      }
    }
    return Array.from(months).sort((a, b) => {
      const orderA = MONTH_ORDER[a.toLowerCase()] ?? 99;
      const orderB = MONTH_ORDER[b.toLowerCase()] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [salesData]);

  // Toggle single or multiple months
  const toggleMonth = useCallback((month: string) => {
    if (month === 'ALL') {
      setSelectedMonths([]);
      return;
    }

    setSelectedMonths((prev) => {
      // If currently all months are active, clicking a month isolates that month
      if (prev.length === 0) {
        return [month];
      }

      const lower = month.toLowerCase();
      const exists = prev.some((m) => m.toLowerCase() === lower);

      if (exists) {
        const next = prev.filter((m) => m.toLowerCase() !== lower);
        // If nothing left, automatically revert to all months
        return next;
      } else {
        const next = [...prev, month];
        // If all available months are selected, revert to [] representing ALL
        if (availableMonths.length > 0 && next.length === availableMonths.length) {
          return [];
        }
        return next;
      }
    });
  }, [availableMonths]);

  // Backward compatibility setter
  const setSelectedMonth = useCallback((month: string) => {
    if (month === 'ALL') {
      setSelectedMonths([]);
    } else {
      setSelectedMonths([month]);
    }
  }, []);

  // Formatted string label for single/multiple periods
  const selectedMonth = useMemo(() => {
    if (selectedMonths.length === 0) return 'ALL';
    if (selectedMonths.length === 1) return selectedMonths[0];
    return selectedMonths.join(', ');
  }, [selectedMonths]);

  // Derived: Active records based on selected month filter
  const activeRecords = useMemo(() => {
    if (selectedMonths.length === 0 || selectedMonths.includes('ALL')) {
      return salesData;
    }
    const lowerSet = new Set(selectedMonths.map((m) => m.toLowerCase()));
    return salesData.filter((r) => lowerSet.has(r.month.toLowerCase()));
  }, [salesData, selectedMonths]);

  // Derived: Performance aggregated per salesperson
  const salespersonPerformances = useMemo(() => {
    return aggregateSalespersonPerformance(activeRecords);
  }, [activeRecords]);

  // Derived: High-level company metrics & KPI summary
  const companySummary = useMemo(() => {
    return calculateCompanySummary(salespersonPerformances);
  }, [salespersonPerformances]);

  return {
    uploadedFiles,
    salesData,
    fileName,
    hasData: salesData.length > 0,
    selectedMonth,
    selectedMonths,
    setSelectedMonth,
    setSelectedMonths,
    toggleMonth,
    availableMonths,
    activeRecords,
    salespersonPerformances,
    companySummary,
    addUploadedFile,
    removeUploadedFile,
    setAndPersistSalesData,
    resetSalesData,
  };
}

