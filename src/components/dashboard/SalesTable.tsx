import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { SalesRecord, SalespersonPerformance } from '../../types/sales';
import {
  aggregateSalespersonPerformance,
  calculateAchievementPercentage,
  determineTargetStatus,
  formatCurrency,
  formatPercentage,
} from '../../utils/calculations';
import { StatusBadge } from '../common/StatusBadge';

export interface SalesTableProps {
  /** Aggregated performance data per salesperson */
  performances?: SalespersonPerformance[];
  /** Or raw sales records to be aggregated internally */
  records?: SalesRecord[];
  /** Optional title for the table section */
  title?: string;
  /** Optional subtitle or description */
  description?: string;
  /** Optional controlled search term from Header */
  searchTerm?: string;
  /** Optional callback when search term changes */
  onSearchTermChange?: (term: string) => void;
  /** Initial rows per page (default: 10) */
  defaultPageSize?: number;
  /** Initial fit to screen state (default: true) */
  defaultFitToScreen?: boolean;
}

type SortField = 'salesperson' | 'totalBudget' | 'totalActual' | 'achievementPercentage';
type SortDirection = 'asc' | 'desc';

export const SalesTable: React.FC<SalesTableProps> = ({
  performances: initialPerformances,
  records,
  title = 'Salesperson Performance Summary',
  description = 'Aggregated monthly budget versus actual sales performance per salesperson',
  searchTerm: externalSearchTerm,
  onSearchTermChange,
  defaultPageSize = 10,
  defaultFitToScreen = true,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const activeSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  const handleSearchChange = (val: string) => {
    if (onSearchTermChange) {
      onSearchTermChange(val);
    } else {
      setInternalSearchTerm(val);
    }
  };

  const [sortField, setSortField] = useState<SortField>('achievementPercentage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination & Screen Fit State
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFitToScreen, setIsFitToScreen] = useState<boolean>(defaultFitToScreen);

  // 1. Resolve aggregated salesperson performances
  const data = useMemo<SalespersonPerformance[]>(() => {
    if (initialPerformances) {
      return initialPerformances;
    }
    if (records) {
      return aggregateSalespersonPerformance(records);
    }
    return [];
  }, [initialPerformances, records]);

  // 2. Filter data by salesperson search term
  const filteredData = useMemo(() => {
    if (!activeSearchTerm.trim()) return data;
    const term = activeSearchTerm.toLowerCase().trim();
    return data.filter((item) => item.salesperson.toLowerCase().includes(term));
  }, [data, activeSearchTerm]);

  // 3. Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'salesperson') {
        comparison = a.salesperson.localeCompare(b.salesperson);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Track external search changes during render to reset page without useEffect cascading renders
  const [prevSearch, setPrevSearch] = useState(activeSearchTerm);
  if (prevSearch !== activeSearchTerm) {
    setPrevSearch(activeSearchTerm);
    setCurrentPage(1);
  }

  // 4. Pagination math & slicing
  const totalRecords = sortedData.length;
  const effectivePageSize = pageSize === -1 ? totalRecords || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalRecords / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    if (pageSize === -1) {
      return sortedData;
    }
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  const startRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const endRecord = Math.min(safeCurrentPage * effectivePageSize, totalRecords);

  // Helper for visible page number buttons with ellipsis
  const visiblePages = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, 'ellipsis', totalPages];
  }, [totalPages, safeCurrentPage]);

  // 5. Calculate table grand totals for the footer (calculated across all filtered records, not just current page)
  const totals = useMemo(() => {
    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.totalBudget, 0);
    const totalActual = filteredData.reduce((acc, curr) => acc + curr.totalActual, 0);
    const achievementPercentage = calculateAchievementPercentage(totalActual, totalBudget);
    const status = determineTargetStatus(achievementPercentage);

    return {
      totalBudget,
      totalActual,
      achievementPercentage,
      status,
      count: filteredData.length,
    };
  }, [filteredData]);

  // Handle column header click to toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'salesperson' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#631244]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#631244]" />
    );
  };

  return (
    <div className="w-full rounded-2xl border border-[#EADBDE] bg-white shadow-2xs overflow-hidden flex flex-col">
      {/* Table Section Header */}
      <div className="p-5 sm:p-6 border-b border-[#EADBDE] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-5 h-5 text-[#631244]" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {title}
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
              {filteredData.length} {filteredData.length === 1 ? 'person' : 'salespeople'}
            </span>
            {totalPages > 1 && (
              <span className="text-xs font-medium text-slate-500 bg-[#FAF7F5] px-2 py-0.5 rounded-md border border-[#EADBDE]">
                Page {safeCurrentPage} of {totalPages}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search salesperson..."
            value={activeSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#FAF7F5] border border-[#EADBDE] rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#631244] focus:border-transparent transition-all"
            aria-label="Filter salesperson by name"
          />
          {activeSearchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-0.5"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Responsive Table Wrapper with Overflow Scroll & Screen Fit Constraint */}
      <div
        className={`w-full overflow-x-auto overflow-y-auto relative transition-all duration-200 ${
          isFitToScreen ? 'max-h-[460px] sm:max-h-[520px]' : 'max-h-none'
        }`}
      >
        <table className="w-full min-w-[680px] text-left border-collapse text-xs sm:text-sm">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-[#F7EFF4] shadow-2xs">
            <tr className="border-b border-[#EADBDE] bg-[#F7EFF4] text-slate-700 font-bold">
              {/* Salesperson Column */}
              <th scope="col" className="sticky top-0 z-10 bg-[#F7EFF4] py-3 px-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => handleSort('salesperson')}
                  className="flex items-center gap-1.5 font-bold hover:text-slate-900 transition-colors group cursor-pointer"
                >
                  <span>Salesperson</span>
                  {getSortIcon('salesperson')}
                </button>
              </th>

              {/* Budget Target Column */}
              <th scope="col" className="sticky top-0 z-10 bg-[#F7EFF4] py-3 px-4 sm:px-6 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalBudget')}
                  className="inline-flex items-center gap-1.5 font-bold hover:text-slate-900 transition-colors group cursor-pointer ml-auto"
                >
                  <span>Budget</span>
                  {getSortIcon('totalBudget')}
                </button>
              </th>

              {/* Actual Sales Column */}
              <th scope="col" className="sticky top-0 z-10 bg-[#F7EFF4] py-3 px-4 sm:px-6 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalActual')}
                  className="inline-flex items-center gap-1.5 font-bold hover:text-slate-900 transition-colors group cursor-pointer ml-auto"
                >
                  <span>Actual</span>
                  {getSortIcon('totalActual')}
                </button>
              </th>

              {/* Achievement % Column */}
              <th scope="col" className="sticky top-0 z-10 bg-[#F7EFF4] py-3 px-4 sm:px-6 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('achievementPercentage')}
                  className="inline-flex items-center gap-1.5 font-bold hover:text-slate-900 transition-colors group cursor-pointer ml-auto"
                >
                  <span>Achievement %</span>
                  {getSortIcon('achievementPercentage')}
                </button>
              </th>

              {/* Target Status Column */}
              <th scope="col" className="sticky top-0 z-10 bg-[#F7EFF4] py-3 px-4 sm:px-6 text-center">
                <span className="font-bold">Status</span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#F5EFF2]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-800">
                      {activeSearchTerm ? 'No matching salesperson found' : 'No salesperson records available'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeSearchTerm ? 'Try adjusting your search criteria' : 'Upload an Excel spreadsheet to begin'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const isAboveTarget = row.status === 'Above Target';

                return (
                  <tr
                    key={row.salesperson}
                    className={`transition-colors hover:bg-[#FAF7F5] ${
                      index % 2 === 0 ? 'bg-white' : 'bg-[#FCFBFB]'
                    }`}
                  >
                    {/* Salesperson Name with Avatar Initials */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FBF2F7] border border-[#EDC6DD] text-[#631244] font-bold text-xs flex items-center justify-center shrink-0">
                          {row.salesperson
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {row.salesperson}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {row.monthlyRecords.length} {row.monthlyRecords.length === 1 ? 'month' : 'months'} reported
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Budget Amount */}
                    <td className="py-3 px-4 sm:px-6 text-right font-medium text-slate-700 font-mono">
                      {formatCurrency(row.totalBudget)}
                    </td>

                    {/* Actual Sales */}
                    <td className="py-3 px-4 sm:px-6 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(row.totalActual)}
                    </td>

                    {/* Achievement Percentage with Variance */}
                    <td className="py-3 px-4 sm:px-6 text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-extrabold ${
                            isAboveTarget ? 'text-[#631244]' : 'text-rose-600'
                          }`}
                        >
                          {formatPercentage(row.achievementPercentage)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {row.variance >= 0 ? '+' : ''}
                          {formatCurrency(row.variance)}
                        </span>
                      </div>
                    </td>

                    {/* Target Status Badge */}
                    <td className="py-3 px-4 sm:px-6 text-center">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Table Footer: Grand Totals (Calculated on All Filtered Data) */}
          {sortedData.length > 0 && (
            <tfoot className="sticky bottom-0 z-10 bg-[#FBF2F7] border-t-2 border-[#631244] shadow-[0_-2px_6px_rgba(0,0,0,0.04)]">
              <tr className="text-slate-900 font-bold">
                <td className="sticky bottom-0 z-10 bg-[#FBF2F7] py-3.5 px-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-xs tracking-wider text-[#631244] font-extrabold">
                      Company Total
                    </span>
                    <span className="text-xs font-normal text-slate-600">
                      ({totals.count} {totals.count === 1 ? 'person' : 'salespeople'})
                    </span>
                  </div>
                </td>

                <td className="sticky bottom-0 z-10 bg-[#FBF2F7] py-3.5 px-4 sm:px-6 text-right font-mono font-bold text-slate-800">
                  {formatCurrency(totals.totalBudget)}
                </td>

                <td className="sticky bottom-0 z-10 bg-[#FBF2F7] py-3.5 px-4 sm:px-6 text-right font-mono font-black text-slate-900">
                  {formatCurrency(totals.totalActual)}
                </td>

                <td className="sticky bottom-0 z-10 bg-[#FBF2F7] py-3.5 px-4 sm:px-6 text-right font-mono">
                  <span
                    className={`font-black text-sm ${
                      totals.status === 'Above Target' ? 'text-[#631244]' : 'text-rose-600'
                    }`}
                  >
                    {formatPercentage(totals.achievementPercentage)}
                  </span>
                </td>

                <td className="sticky bottom-0 z-10 bg-[#FBF2F7] py-3.5 px-4 sm:px-6 text-center">
                  <StatusBadge status={totals.status} size="sm" />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination & Screen Fit Control Bar */}
      <div className="px-4 sm:px-6 py-3 bg-white border-t border-[#EADBDE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Left Side: Summary & Options */}
        <div className="flex flex-wrap items-center gap-3 text-slate-600">
          <span>
            Showing <strong className="font-bold text-slate-900">{startRecord}</strong>–<strong className="font-bold text-slate-900">{endRecord}</strong> of{' '}
            <strong className="font-bold text-slate-900">{totalRecords}</strong> {totalRecords === 1 ? 'salesperson' : 'salespeople'}
          </span>

          <div className="h-4 w-px bg-[#EADBDE] hidden sm:block" />

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-[#FAF7F5] border border-[#EADBDE] text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-[#631244] cursor-pointer"
              aria-label="Select rows per page"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>All</option>
            </select>
          </div>

          <div className="h-4 w-px bg-[#EADBDE] hidden sm:block" />

          {/* Screen Fit Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFitToScreen((prev) => !prev)}
            title={
              isFitToScreen
                ? 'Current: Scrollable Screen Fit. Click to expand full height without scrollbar.'
                : 'Current: Full Height. Click to enable scrollable screen fit.'
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 bg-[#FAF7F5] hover:bg-[#F5EFF2] border border-[#EADBDE] transition-colors cursor-pointer"
          >
            {isFitToScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#631244]" />
                <span className="font-medium">Screen Fit (Scroll)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#DE5829]" />
                <span className="font-medium">Full Height</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Page Navigation Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-end sm:self-auto">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-[#EADBDE] text-slate-600 hover:bg-[#FAF7F5] hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="First Page"
              aria-label="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-[#EADBDE] text-slate-600 hover:bg-[#FAF7F5] hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 px-1">
              {visiblePages.map((item, idx) => {
                if (item === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold select-none">
                      …
                    </span>
                  );
                }

                const isCurrent = item === safeCurrentPage;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentPage(item)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#631244] text-white border-[#631244] shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-[#FAF7F5] border-[#EADBDE]'
                    }`}
                    aria-label={`Go to page ${item}`}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#EADBDE] text-slate-600 hover:bg-[#FAF7F5] hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#EADBDE] text-slate-600 hover:bg-[#FAF7F5] hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Last Page"
              aria-label="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

