import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, Check, RotateCcw } from 'lucide-react';

export interface MonthSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMonths: string[];
  selectedMonths: string[];
  onToggleMonth: (month: string) => void;
  onSelectAll: () => void;
  onSetSelectedMonths?: (months: string[]) => void;
}

interface CalendarMonthItem {
  name: string;
  code: string;
  num: string;
  quarter: string;
}

const CALENDAR_MONTHS: CalendarMonthItem[] = [
  { name: 'January', code: 'JAN', num: '01', quarter: 'Q1' },
  { name: 'February', code: 'FEB', num: '02', quarter: 'Q1' },
  { name: 'March', code: 'MAR', num: '03', quarter: 'Q1' },
  { name: 'April', code: 'APR', num: '04', quarter: 'Q2' },
  { name: 'May', code: 'MAY', num: '05', quarter: 'Q2' },
  { name: 'June', code: 'JUN', num: '06', quarter: 'Q2' },
  { name: 'July', code: 'JUL', num: '07', quarter: 'Q3' },
  { name: 'August', code: 'AUG', num: '08', quarter: 'Q3' },
  { name: 'September', code: 'SEP', num: '09', quarter: 'Q3' },
  { name: 'October', code: 'OCT', num: '10', quarter: 'Q4' },
  { name: 'November', code: 'NOV', num: '11', quarter: 'Q4' },
  { name: 'December', code: 'DEC', num: '12', quarter: 'Q4' },
];

export const MonthSelectionModal: React.FC<MonthSelectionModalProps> = ({
  isOpen,
  onClose,
  availableMonths,
  selectedMonths,
  onToggleMonth,
  onSelectAll,
  onSetSelectedMonths,
}) => {
  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isAllSelected =
    !selectedMonths ||
    selectedMonths.length === 0 ||
    selectedMonths.includes('ALL') ||
    (availableMonths.length > 0 && selectedMonths.length === availableMonths.length);

  const isMonthSelected = (monthName: string) => {
    if (isAllSelected) return false;
    return selectedMonths.some(
      (m) => m.toLowerCase() === monthName.toLowerCase()
    );
  };

  const isMonthAvailable = (monthName: string) => {
    return availableMonths.some(
      (m) => m.toLowerCase() === monthName.toLowerCase()
    );
  };

  const handleQuarterSelect = (quarter: string) => {
    const monthsInQuarter = CALENDAR_MONTHS.filter((m) => m.quarter === quarter).map(
      (m) => m.name
    );
    if (onSetSelectedMonths) {
      onSetSelectedMonths(monthsInQuarter);
    } else {
      monthsInQuarter.forEach((m) => onToggleMonth(m));
    }
  };

  const handleHalfYearSelect = (half: 'H1' | 'H2') => {
    const targetMonths =
      half === 'H1'
        ? CALENDAR_MONTHS.slice(0, 6).map((m) => m.name)
        : CALENDAR_MONTHS.slice(6, 12).map((m) => m.name);
    if (onSetSelectedMonths) {
      onSetSelectedMonths(targetMonths);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="month-selection-modal-title"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-[#EADBDE] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* 1. Compact Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F5EFF2] shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3
                  id="month-selection-modal-title"
                  className="text-sm font-bold text-slate-900 leading-tight"
                >
                  Reporting Period
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
                  {isAllSelected ? 'All Months' : `${selectedMonths.length} Selected`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Select one or multiple reporting months
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close month selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Compact Presets Bar */}
        <div className="px-3.5 py-1.5 bg-[#FAF7F5] border-b border-[#F5EFF2] flex items-center justify-between gap-1 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onSelectAll}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer border ${
                isAllSelected
                  ? 'bg-[#631244] text-white border-[#8C1B61] shadow-2xs'
                  : 'bg-white hover:bg-[#F5EFF2] text-slate-700 border-[#EADBDE]'
              }`}
            >
              All
            </button>
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleQuarterSelect(q)}
                className="px-1.5 py-0.5 text-[11px] font-semibold rounded-lg bg-white hover:bg-[#F5EFF2] text-slate-700 border border-[#EADBDE] hover:border-[#631244]/40 transition-all cursor-pointer"
                title={`Select ${q} months`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleHalfYearSelect('H1')}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-lg bg-white hover:bg-[#F5EFF2] text-slate-600 border border-[#EADBDE] transition-all cursor-pointer"
              title="First Half (Jan - Jun)"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => handleHalfYearSelect('H2')}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-lg bg-white hover:bg-[#F5EFF2] text-slate-600 border border-[#EADBDE] transition-all cursor-pointer"
              title="Second Half (Jul - Dec)"
            >
              H2
            </button>
          </div>
        </div>

        {/* 3. Compact 12-Month Grid (Reduced Month Cards) */}
        <div className="p-3 overflow-y-auto">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {CALENDAR_MONTHS.map((item) => {
              const isSelected = isMonthSelected(item.name);
              const isAvailable = isMonthAvailable(item.name);

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onToggleMonth(item.name)}
                  className={`relative py-2 px-1 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                    isSelected
                      ? 'bg-[#631244] text-white border-[#8C1B61] shadow-2xs ring-1 ring-[#631244]/30'
                      : isAvailable
                      ? 'bg-[#FAF7F5] hover:bg-white text-slate-800 border-[#EADBDE] hover:border-[#631244]/40 hover:shadow-2xs'
                      : 'bg-slate-50/70 text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                  title={`${item.name}${isAvailable ? ' (Data Available)' : ' (No records)'}`}
                >
                  {/* Top-right micro-badge: checkmark or month number */}
                  <div className="absolute top-1 right-1.5">
                    {isSelected ? (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#DE5829] text-white">
                        <Check className="w-2 h-2 stroke-[3]" />
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-mono leading-none ${
                          isAvailable ? 'text-slate-400' : 'text-slate-300'
                        }`}
                      >
                        {item.num}
                      </span>
                    )}
                  </div>

                  {/* 3-letter Month Code */}
                  <span
                    className={`text-xs sm:text-sm font-extrabold tracking-wide mt-0.5 ${
                      isSelected
                        ? 'text-white'
                        : isAvailable
                        ? 'text-slate-900 group-hover:text-[#631244]'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.code}
                  </span>

                  {/* Micro Month Name */}
                  <span
                    className={`text-[10px] font-medium leading-none truncate max-w-full mt-0.5 ${
                      isSelected
                        ? 'text-rose-100/90'
                        : isAvailable
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.name.slice(0, 4)}
                  </span>

                  {/* Data Availability Dot */}
                  {isAvailable && !isSelected && (
                    <span
                      className="w-1 h-1 rounded-full bg-emerald-500 mt-1"
                      title="Data available for this month"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Compact Footer Actions */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#FAF7F5] border-t border-[#F5EFF2] shrink-0">
          <button
            type="button"
            onClick={onSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white px-2.5 py-1 rounded-lg border border-transparent hover:border-[#EADBDE] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#631244]" />
            <span>Reset to All</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-[#631244] hover:bg-[#4E0C34] active:bg-[#3B0726] border border-[#8C1B61] transition-all shadow-2xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};


