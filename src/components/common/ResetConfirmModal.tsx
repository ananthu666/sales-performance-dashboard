import React, { useState } from 'react';
import { RotateCcw, X, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  totalFilesCount?: number;
  totalRecordsCount?: number;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  totalFilesCount = 0,
  totalRecordsCount = 0,
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');

  if (!isOpen) {
    return null;
  }

  const isConfirmed = typedConfirmation.trim().toLowerCase() === 'reset';

  const handleClose = () => {
    setTypedConfirmation('');
    onCancel();
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      setTypedConfirmation('');
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && isConfirmed) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EADBDE] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F5EFF2]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reset-confirm-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                Confirm Session Reset
              </h3>
              <p className="text-[11px] text-slate-500">
                Action requires explicit confirmation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close reset modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Are you sure you want to reset? This will <strong className="font-bold text-rose-800">permanently remove all uploaded workbooks</strong> and clear all in-memory analytics.
            </p>
          </div>

          {/* Session Overview Card */}
          {(totalFilesCount > 0 || totalRecordsCount > 0) && (
            <div className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-[#EADBDE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#631244]" />
                <span className="font-semibold text-slate-700">Data to be deleted:</span>
              </div>
              <span className="font-bold px-2 py-0.5 rounded-full bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
                {totalFilesCount} {totalFilesCount === 1 ? 'Workbook' : 'Workbooks'} • {totalRecordsCount} Rows
              </span>
            </div>
          )}

          {/* Type-to-Confirm Prompt */}
          <div className="space-y-2 pt-1">
            <label
              htmlFor="confirm-reset-input"
              className="block text-xs font-medium text-slate-700 leading-normal"
            >
              To prevent accidental deletion, type{' '}
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                reset
              </span>{' '}
              in the box below:
            </label>
            <input
              id="confirm-reset-input"
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder='Type "reset" to confirm...'
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 bg-[#FAF7F5] border-t border-[#F5EFF2]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Reset & Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
