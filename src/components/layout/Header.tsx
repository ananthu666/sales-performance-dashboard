import React, { useState } from 'react';
import {
  Menu,
  Calendar,
  LayoutDashboard,
  BarChart3,
  Users,
  UploadCloud,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { DashboardView } from './Sidebar';
import type { SalespersonPerformance } from '../../types/sales';
import { MonthSelectionModal } from './MonthSelectionModal';
import { formatMonthsShort } from '../../utils/calculations';

export interface HeaderProps {
  onToggleMobileSidebar: () => void;
  activeView: DashboardView;
  activeViewTitle: string;
  hasData: boolean;
  availableMonths?: string[];
  selectedMonth?: string;
  selectedMonths?: string[];
  onSelectMonth?: (month: string) => void;
  onToggleMonth?: (month: string) => void;
  onSetSelectedMonths?: (months: string[]) => void;
  // Optional legacy props preserved for interface stability
  fileName?: string | null;
  onReset?: () => void;
  onDownloadTemplate?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  salespersonPerformances?: SalespersonPerformance[];
  onSelectSalesperson?: (salespersonName: string) => void;
  totalRecords?: number;
  filesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  activeView,
  activeViewTitle,
  hasData,
  availableMonths = [],
  selectedMonth = 'ALL',
  selectedMonths = [],
  onSelectMonth,
  onToggleMonth,
  onSetSelectedMonths,
}) => {
  // Modal state for square month selection calendar modal
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  const isAllSelected = React.useMemo(() => {
    if (selectedMonths && selectedMonths.length > 0) {
      return (
        selectedMonths.includes('ALL') ||
        (availableMonths.length > 0 && selectedMonths.length === availableMonths.length)
      );
    }
    return selectedMonth === 'ALL';
  }, [selectedMonths, selectedMonth, availableMonths.length]);

  const periodDisplay = React.useMemo(() => {
    return formatMonthsShort(selectedMonths, availableMonths.length);
  }, [selectedMonths, availableMonths.length]);

  const handleSelectAll = () => {
    if (onToggleMonth) {
      onToggleMonth('ALL');
    } else if (onSelectMonth) {
      onSelectMonth('ALL');
    }
  };

  const handleToggleMonth = (m: string) => {
    if (onToggleMonth) {
      onToggleMonth(m);
    } else if (onSelectMonth) {
      onSelectMonth(m);
    }
  };

  // Contextual icon per active view
  const getViewIcon = () => {
    switch (activeView) {
      case 'dashboard':
        return <LayoutDashboard className="w-4 h-4 text-[#631244]" />;
      case 'chart':
        return <BarChart3 className="w-4 h-4 text-[#631244]" />;
      case 'table':
        return <Users className="w-4 h-4 text-[#631244]" />;
      case 'upload':
        return <UploadCloud className="w-4 h-4 text-[#631244]" />;
      case 'export':
        return <FileText className="w-4 h-4 text-[#631244]" />;
      default:
        return <LayoutDashboard className="w-4 h-4 text-[#631244]" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-2xs border-b border-[#EADBDE]">
      {/* 1. Top Brand Gradient Accent Ribbon */}
      <div className="h-1 bg-gradient-to-r from-[#631244] via-[#DE5829] to-[#631244] w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* ============================================================ */}
          {/* LEFT: Mobile Menu + View Icon & Contextual Title             */}
          {/* ============================================================ */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-[#F5EFF2] border border-[#EADBDE] transition-colors cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-[#631244]" />
            </button>

            {/* Mobile Brand Logo */}
            <div className="lg:hidden flex items-center shrink-0">
              <img
                src="/bgh-logo.svg"
                alt="Bettergrow Holding"
                className="h-7 w-auto object-contain"
              />
            </div>

            {/* Desktop Contextual View Icon Box */}
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-[#FBF2F7] border border-[#EDC6DD] shrink-0">
              {getViewIcon()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                  {activeViewTitle}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
                  BGH Wholesale
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Bettergrow Holding Group • DIP 2, Dubai
              </p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT: Calendar Period Selector Modal Trigger                */}
          {/* ============================================================ */}
          {hasData && (
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#FAF7F5] hover:bg-[#F5EFF2] active:bg-[#EADBDE] border border-[#EADBDE] hover:border-[#631244]/40 shadow-2xs transition-all cursor-pointer group shrink-0"
                title="Click calendar to open month selection modal"
                aria-haspopup="dialog"
                aria-expanded={isMonthModalOpen}
              >
                <div className="p-1.5 rounded-lg bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD] group-hover:bg-[#631244] group-hover:text-white transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                      Period
                    </span>
                    {!isAllSelected && selectedMonths.length > 1 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#DE5829] text-white leading-none">
                        {selectedMonths.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[200px] leading-tight mt-0.5">
                    {periodDisplay}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#631244] transition-transform ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Square Month Selection Modal */}
      <MonthSelectionModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        availableMonths={availableMonths}
        selectedMonths={selectedMonths}
        onToggleMonth={handleToggleMonth}
        onSelectAll={handleSelectAll}
        onSetSelectedMonths={onSetSelectedMonths}
      />
    </header>
  );
};

