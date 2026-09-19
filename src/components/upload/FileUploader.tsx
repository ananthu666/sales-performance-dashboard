import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileDown,
} from 'lucide-react';
import type { SalesRecord, RowValidationError, UploadedExcelFile } from '../../types/sales';
import { parseExcelFile, isValidExcelFile, downloadSalesTemplateFile } from '../../utils/excelParser';
import { UploadedFilesList } from './UploadedFilesList';

export interface FileUploaderProps {
  /** Callback invoked when an Excel file is successfully parsed and validated */
  onSuccess: (records: SalesRecord[], fileName: string) => void;
  /** Callback to reset/clear data from parent state and storage */
  onReset?: () => void;
  /** Name of the currently active file (if any) */
  currentFileName?: string;
  /** Whether the dashboard currently holds valid data */
  hasExistingData?: boolean;
  /** Optional callback invoked on validation/format error */
  onError?: (errorTitle: string, errorMessage: string) => void;
  /** Optional callback invoked on download template */
  onDownloadTemplate?: () => void;
  /** Ledger of uploaded files in the current session */
  uploadedFiles?: UploadedExcelFile[];
  /** Callback to add a newly parsed UploadedExcelFile */
  onAddFile?: (file: UploadedExcelFile) => void;
  /** Callback to delete an uploaded file from the session */
  onDeleteFile?: (fileId: string, fileName: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onSuccess,
  onReset,
  currentFileName,
  hasExistingData = false,
  onError,
  onDownloadTemplate,
  uploadedFiles = [],
  onAddFile,
  onDeleteFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    currentFileName || null
  );
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<RowValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when data is cleared externally after confirmed reset
  const [prevHasExistingData, setPrevHasExistingData] = useState(hasExistingData);
  if (prevHasExistingData !== hasExistingData) {
    setPrevHasExistingData(hasExistingData);
    if (!hasExistingData) {
      setUploadedFileName(null);
      setFileSize(null);
      setSuccessMessage(null);
    } else if (currentFileName) {
      setUploadedFileName(currentFileName);
    }
  }

  // Helper to format file size in KB/MB
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Clear all error/success banners
  const clearMessages = () => {
    setGeneralErrors([]);
    setRowErrors([]);
    setSuccessMessage(null);
  };

  // Handle template download with optional parent notification
  const handleDownloadTemplate = () => {
    downloadSalesTemplateFile();
    if (onDownloadTemplate) {
      onDownloadTemplate();
    }
  };

  // Main file processing handler
  const processFile = useCallback(
    async (file: File) => {
      clearMessages();

      // 1. Check file extension before reading
      if (!isValidExcelFile(file)) {
        const errMsg = `"${file.name}" is not a supported file format. Please upload an Excel workbook (.xlsx or .xls).`;
        setGeneralErrors([errMsg]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onError) {
          onError(
            'Unsupported File Format',
            'Please upload a valid .xlsx or .xls Excel workbook using our official template.'
          );
        }
        return;
      }

      setIsLoading(true);

      try {
        const result = await parseExcelFile(file);

        if (!result.success) {
          const errors = result.errors || ['Failed to parse Excel file.'];
          setGeneralErrors(errors);
          setRowErrors(result.rowErrors || []);
          setUploadedFileName(null);
          setFileSize(null);

          // Raise notification prompting to download template
          if (onError) {
            const firstMessage =
              result.rowErrors.length > 0
                ? result.rowErrors[0].message
                : errors[0] || 'Template or data type variation detected.';
            onError(
              'Upload Stopped: Invalid Template / Data Type',
              `${firstMessage} Entire file transaction was halted. Please download the official template.`
            );
          }
        } else {
          const newFile: UploadedExcelFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            sheetNames: result.sheetNames,
            recordCount: result.records.length,
            totalBudget: result.records.reduce((sum, r) => sum + r.budget, 0),
            totalActual: result.records.reduce((sum, r) => sum + r.actual, 0),
            records: result.records,
          };

          if (onAddFile) {
            onAddFile(newFile);
          }

          setUploadedFileName(file.name);
          setFileSize(formatFileSize(file.size));
          setRowErrors([]);

          onSuccess(result.records, file.name);

          const sheetDesc =
            result.sheetNames.length > 1
              ? `across ${result.sheetNames.length} sheets (${result.sheetNames.join(', ')})`
              : `from sheet "${result.sheetNames[0] || 'Sheet1'}"`;

          setSuccessMessage(
            `Successfully processed "${file.name}" (${result.records.length} records parsed ${sheetDesc}).`
          );
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : 'An unexpected error occurred during parsing.';
        setGeneralErrors([errorMsg]);
        if (onError) {
          onError('Spreadsheet Parsing Error', `${errorMsg}. Please download our template to check formatting.`);
        }
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onSuccess, onError, onAddFile]
  );

  // File input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and Drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Keyboard navigation on dropzone
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // Reset handler triggers confirmation flow
  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="excel-file-input"
        type="file"
        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="sr-only"
        onChange={handleInputChange}
        disabled={isLoading}
        aria-label="Upload Excel sales spreadsheet"
      />

      {/* Main Drag-and-Drop Area */}
      <div
        role="button"
        tabIndex={isLoading ? -1 : 0}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={(e) => {
          handleDrop(e);
          if (isLoading) return;
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) {
            processFile(droppedFile);
          }
        }}
        aria-disabled={isLoading}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#631244]/20 ${
          isDragging
            ? 'border-[#631244] bg-[#FBF2F7]/80 scale-[1.01]'
            : 'border-[#EADBDE] bg-white hover:border-[#631244] hover:bg-[#FAF7F5]'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {isLoading ? (
            <div className="p-4 rounded-full bg-[#FBF2F7] text-[#631244] animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
          ) : (
            <div
              className={`p-4 rounded-full transition-colors ${
                isDragging
                  ? 'bg-[#631244] text-white'
                  : 'bg-[#FBF2F7] text-[#631244]'
              }`}
            >
              <Upload className="w-8 h-8" />
            </div>
          )}

          <div>
            <p className="text-base font-bold text-slate-900">
              {isLoading
                ? 'Parsing spreadsheet in-browser...'
                : isDragging
                ? 'Drop the Excel file here'
                : 'Drag and drop your filled Excel template here, or browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports <span className="font-semibold text-slate-700">.xlsx</span>{' '}
              and <span className="font-semibold text-slate-700">.xls</span>{' '}
              (Required columns: Salesperson, Month, Budget Amount, Actual Sales)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#631244] hover:bg-[#4E0C34] active:bg-[#3B0726] transition-colors shadow-xs cursor-pointer border border-[#8C1B61]"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Select File from Device
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadTemplate();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-slate-800 bg-[#FDF4F0] hover:bg-[#FCE7DE] transition-colors border border-[#F8CBBA] cursor-pointer shadow-2xs"
            >
              <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />
              Download Template (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Action / Convenience Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-slate-700 bg-[#F5EFF2] hover:bg-[#EADBDE] border border-[#EADBDE] transition-colors cursor-pointer"
            title="Download the official Excel template with required columns"
          >
            <FileDown className="w-3.5 h-3.5 text-[#631244]" />
            Download Excel Template
          </button>
        </div>

        {hasExistingData && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear / Reset Dataset
          </button>
        )}
      </div>

      {/* Active Uploaded File Status Card */}
      {hasExistingData && uploadedFileName && !generalErrors.length && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#EDC6DD] bg-[#FBF2F7] text-[#631244]">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-[#F7E4EE] text-[#631244] shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-slate-900 truncate">{uploadedFileName}</p>
              {fileSize && (
                <p className="text-xs text-[#631244]">
                  Size: {fileSize} • Processed locally in-browser
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#631244] text-white">
              <CheckCircle2 className="w-3 h-3" />
              Active File
            </span>
            <button
              type="button"
              onClick={handleReset}
              title="Remove file"
              className="p-1 rounded-md text-slate-600 hover:bg-[#F7E4EE] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Message Banner */}
      {successMessage && (
        <div className="flex items-start justify-between p-3 rounded-xl border border-[#EDC6DD] bg-[#FBF2F7] text-[#631244] text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#631244] shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[#631244] hover:text-[#4E0C34] ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Prominent Format Error Notification with Template Download Action */}
      {(generalErrors.length > 0 || rowErrors.length > 0) && (
        <div className="p-5 rounded-2xl border-2 border-[#DE5829] bg-[#FDF4F0] text-slate-900 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F8CBBA] pb-3">
            <div className="flex items-center gap-2 text-[#A33411] font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-[#DE5829] shrink-0" />
              <span>Spreadsheet Format / Validation Error Detected</span>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors shadow-xs cursor-pointer shrink-0 border border-[#8C1B61]"
            >
              <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />
              <span>Download Official Template (.xlsx)</span>
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            The uploaded file could not be processed due to formatting discrepancies. Please download the official Bettergrow template, paste your records under the four required column headers, and upload again.
          </p>

          {/* Detailed Error List */}
          {generalErrors.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-xs font-bold text-[#A33411] uppercase tracking-wider block">
                Issues Encountered:
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-800 pl-1 font-medium">
                {generalErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {rowErrors.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-xs font-bold text-[#A33411] uppercase tracking-wider block">
                Row-Level Discrepancies ({rowErrors.length}):
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-rose-800 max-h-36 overflow-y-auto pl-1 font-mono">
                {rowErrors.map((rErr, idx) => (
                  <li key={idx}>
                    {rErr.sheetName ? (
                      <span className="font-bold text-[#631244]">[{rErr.sheetName}] </span>
                    ) : null}
                    Row {rErr.rowNumber}: <span className="font-semibold">{rErr.field}</span> - {rErr.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Upload History & File Ledger */}
      {onDeleteFile && (
        <div className="pt-2">
          <UploadedFilesList files={uploadedFiles} onDeleteFile={onDeleteFile} />
        </div>
      )}
    </div>
  );
};
