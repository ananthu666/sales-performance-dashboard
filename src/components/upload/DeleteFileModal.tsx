import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { UploadedExcelFile } from '../../types/sales';
import { formatCurrency } from '../../utils/calculations';

export interface DeleteFileModalProps {
  isOpen: boolean;
  file: UploadedExcelFile | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteFileModal: React.FC<DeleteFileModalProps> = ({
  isOpen,
  file,
  onConfirm,
  onCancel,
}) => {
  const [prevFileId, setPrevFileId] = useState<string | null>(null);
  const [typedName, setTypedName] = useState('');

  // Idiomatic React pattern: reset typed name when target file changes during render
  if (file && file.id !== prevFileId) {
    setPrevFileId(file.id);
    setTypedName('');
  }

  if (!isOpen || !file) {
    return null;
  }

  const isMatching = typedName.trim() === file.fileName;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && isMatching) {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-file-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EADBDE] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F5EFF2]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="delete-file-modal-title" className="text-base font-bold text-slate-900">
              Confirm File Deletion
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close deletion modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete this Excel file? All records associated with it will be immediately removed from your active session.
          </p>

          {/* File Card Summary */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EADBDE] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Target Spreadsheet
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
                {file.recordCount} rows
              </span>
            </div>
            <p className="font-mono text-xs font-bold text-slate-900 break-all select-all">
              {file.fileName}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-[#F5EFF2]">
              <span>Sheets: {file.sheetNames.join(', ')}</span>
              <span>Total Actual: {formatCurrency(file.totalActual)}</span>
            </div>
          </div>

          {/* Protection Input Prompt */}
          <div className="space-y-2 pt-1">
            <label
              htmlFor="confirm-filename-input"
              className="block text-xs font-medium text-slate-700"
            >
              To prevent accidental deletion, type{' '}
              <span className="font-mono font-bold text-[#631244] bg-[#FBF2F7] px-1.5 py-0.5 rounded border border-[#EDC6DD]">
                {file.fileName}
              </span>{' '}
              to confirm:
            </label>
            <input
              id="confirm-filename-input"
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type exact file name here..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#631244] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 bg-[#FAF7F5] border-t border-[#F5EFF2]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatching}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              isMatching
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete File
          </button>
        </div>
      </div>
    </div>
  );
};
