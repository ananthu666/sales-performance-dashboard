import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import type { UploadedExcelFile } from '../../types/sales';
import { formatCurrency } from '../../utils/calculations';
import { DeleteFileModal } from './DeleteFileModal';

export interface UploadedFilesListProps {
  files: UploadedExcelFile[];
  onDeleteFile: (fileId: string, fileName: string) => void;
}

export const UploadedFilesList: React.FC<UploadedFilesListProps> = ({
  files,
  onDeleteFile,
}) => {
  const [filePendingDelete, setFilePendingDelete] = useState<UploadedExcelFile | null>(null);

  // Format timestamp into clean local readable string
  const formatUploadTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes <= 0) return 'Template / In-Memory';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleConfirmDelete = () => {
    if (filePendingDelete) {
      onDeleteFile(filePendingDelete.id, filePendingDelete.fileName);
      setFilePendingDelete(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-[#EADBDE] bg-white text-center">
        <div className="w-10 h-10 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] text-slate-400 flex items-center justify-center mx-auto mb-2">
          <HardDrive className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-slate-700">No Excel Files in Active Session</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Uploaded workbooks will appear here. You can upload multiple spreadsheets and delete them anytime with typing verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#631244]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Uploaded Session Workbooks ({files.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">
          Combined into unified dashboard analytics
        </span>
      </div>

      <div className="space-y-2.5">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-[#EADBDE] hover:border-[#631244]/40 hover:shadow-xs transition-all gap-4"
          >
            {/* Left: File icon & details */}
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD] shrink-0 mt-0.5 sm:mt-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF7F5] text-slate-600 border border-[#EADBDE]">
                    <HardDrive className="w-3 h-3 text-slate-400" />
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatUploadTime(file.uploadedAt)}
                  </span>

                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#DE5829]" />
                    <span className="font-semibold text-slate-700">
                      {file.sheetNames.length} sheet{file.sheetNames.length > 1 ? 's' : ''}
                    </span>{' '}
                    ({file.sheetNames.join(', ')})
                  </span>

                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#631244]" />
                    <span className="font-semibold text-slate-700">{file.recordCount}</span> rows parsed
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Metrics & Delete Action */}
            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F5EFF2]">
              <div className="text-left sm:text-right text-xs">
                <div className="text-[11px] text-slate-400">Total Actual Sales</div>
                <div className="font-bold text-[#631244] sm:text-sm">
                  {formatCurrency(file.totalActual)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFilePendingDelete(file)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title={`Delete ${file.fileName}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Safe Deletion */}
      <DeleteFileModal
        isOpen={Boolean(filePendingDelete)}
        file={filePendingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFilePendingDelete(null)}
      />
    </div>
  );
};
