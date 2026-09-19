import React, { useState, useMemo } from 'react';
import {
  Info,
  CheckCircle2,
  FileDown,
  BarChart3,
  Users,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { useSalesData } from './hooks/useSalesData';
import { Sidebar, type DashboardView } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FileUploader } from './components/upload/FileUploader';
import { KPISummaryGrid } from './components/dashboard/KPISummaryGrid';
import { TeamHealthDistribution } from './components/dashboard/TeamHealthDistribution';
import { SalesChart } from './components/dashboard/SalesChart';
import { AchievementRankingChart } from './components/dashboard/AchievementRankingChart';
import { SalesTable } from './components/dashboard/SalesTable';
import { ExportReportView } from './components/export/ExportReportView';
import { downloadSalesTemplateFile } from './utils/excelParser';
import { formatMonthsShort } from './utils/calculations';
import { ToastProvider } from './components/common/Toast';
import { useToast } from './context/ToastContext';
import { ResetConfirmModal } from './components/common/ResetConfirmModal';
import type { SalesRecord, UploadedExcelFile } from './types/sales';

const DashboardContent: React.FC = () => {
  const { toast } = useToast();
  const {
    uploadedFiles,
    salesData,
    fileName,
    hasData,
    selectedMonth,
    selectedMonths,
    setSelectedMonth,
    setSelectedMonths,
    toggleMonth,
    availableMonths,
    salespersonPerformances,
    companySummary,
    addUploadedFile,
    removeUploadedFile,
    setAndPersistSalesData,
    resetSalesData,
  } = useSalesData();

  // Navigation, search, and layout state
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Formatted period label for headers, charts, tables, and exports (e.g. "Jan, Mar, May")
  const periodLabel = useMemo(() => {
    return formatMonthsShort(selectedMonths, availableMonths.length);
  }, [selectedMonths, availableMonths.length]);

  // View title labels for the top header
  const viewTitles: Record<DashboardView, string> = {
    dashboard: 'Dashboard Overview',
    chart: 'Sales Analytics & Charts',
    table: 'Salesperson Performance Table',
    upload: 'Excel Data Source & Import',
    export: 'Export Data & Executive Reports',
  };

  // Activity Handler: Download Template
  const handleDownloadTemplate = () => {
    downloadSalesTemplateFile();
    toast.success(
      'Template Downloaded',
      '"Bettergrow_Sales_Template.xlsx" has been downloaded. Open in Excel, fill in your records, and upload.'
    );
  };

  // Activity Handler: File Added into Ledger
  const handleAddFile = (file: UploadedExcelFile) => {
    addUploadedFile(file);
    toast.success(
      'Workbook Added to Session',
      `"${file.fileName}" with ${file.sheetNames.length} sheet(s) and ${file.recordCount} records is now active.`
    );
  };

  // Activity Handler: File Deleted from Session
  const handleDeleteFile = (fileId: string, deletedFileName: string) => {
    removeUploadedFile(fileId);
    toast.info(
      'File Removed from Session',
      `"${deletedFileName}" and its associated records have been removed.`
    );
  };

  // Activity Handler: Upload Success
  const handleUploadSuccess = (records: SalesRecord[], fname: string) => {
    // If addUploadedFile wasn't triggered directly, fallback to setAndPersistSalesData
    if (uploadedFiles.length === 0) {
      setAndPersistSalesData(records, fname);
    }
  };

  // Activity Handler: Upload / Validation Error with Template CTA
  const handleUploadError = (title: string, message: string) => {
    toast.error(
      title,
      message,
      {
        label: 'Download Template',
        onClick: handleDownloadTemplate,
      }
    );
  };

  // Activity Handler: Dashboard Reset (opens safe confirmation modal)
  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    setIsResetModalOpen(false);
    resetSalesData();
    toast.info(
      'Dashboard Reset',
      'All sales data and cached session records have been cleared.'
    );
  };

  const handleCancelReset = () => {
    setIsResetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-slate-900 flex font-sans selection:bg-[#631244] selection:text-white">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        hasData={hasData}
        fileName={fileName}
        recordsCount={salesData.length}
        salespeopleCount={salespersonPerformances.length}
        filesCount={uploadedFiles.length}
        onReset={handleOpenResetModal}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {/* 2. Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header with Brand Ribbon & Calendar Period Selector */}
        <Header
          onToggleMobileSidebar={() => setIsOpenMobile(true)}
          activeView={activeView}
          activeViewTitle={viewTitles[activeView]}
          hasData={hasData}
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          selectedMonths={selectedMonths}
          onSelectMonth={setSelectedMonth}
          onToggleMonth={toggleMonth}
          onSetSelectedMonths={setSelectedMonths}
        />

        {/* Dynamic View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* ========================================================== */}
          {/* VIEW 1: DASHBOARD OVERVIEW                                 */}
          {/* ========================================================== */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Overview Header Banner */}
              <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#EADBDE]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    Executive Sales Overview
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Wholesale trading performance against allocated revenue budgets.
                    Monitor team achievement, identify top sales drivers, and track target health.
                  </p>
                </div>

                {hasData && (
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveView('upload')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#EADBDE] text-slate-700 hover:bg-[#F5EFF2] transition-colors shadow-2xs cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#631244]" />
                      Manage Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('chart')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#631244] text-white hover:bg-[#4E0C34] transition-colors shadow-2xs cursor-pointer border border-[#8C1B61]"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#DE5829]" />
                      Open Analytics
                    </button>
                  </div>
                )}
              </section>

              {/* Populated vs Empty State */}
              {hasData ? (
                <>
                  {/* High-Level Summary KPI Grid with Top Performer Spotlight */}
                  <KPISummaryGrid summary={companySummary} />

                  {/* Team Target Health & Distribution Breakdown */}
                  <TeamHealthDistribution
                    summary={companySummary}
                    performances={salespersonPerformances}
                    onViewAnalytics={() => setActiveView('chart')}
                    onViewTable={() => setActiveView('table')}
                  />

                  {/* Active Session & Data Source Summary Card */}
                  <div className="p-5 rounded-2xl border border-[#EADBDE] bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD] shrink-0 mt-0.5 sm:mt-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Active Session Dataset
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Currently aggregating <span className="font-semibold text-slate-700">{uploadedFiles.length} workbook{uploadedFiles.length > 1 ? 's' : ''}</span> ({salesData.length} total rows) in browser session.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setActiveView('upload')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-[#FAF7F5] hover:bg-[#F5EFF2] border border-[#EADBDE] transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#631244]" />
                        Manage Workbooks
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('chart')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors shadow-2xs cursor-pointer border border-[#8C1B61]"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-[#DE5829]" />
                        Explore Charts
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Branded Empty State */
                <div className="rounded-3xl border-2 border-dashed border-[#EADBDE] bg-white p-8 sm:p-14 text-center shadow-2xs">
                  <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="h-16 px-4 py-2 rounded-2xl bg-white flex items-center justify-center mb-5 border border-[#EADBDE] shadow-xs">
                      <img
                        src="/bgh-logo.svg"
                        alt="Bettergrow Holding Group"
                        className="h-10 w-auto object-contain"
                      />
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Welcome to Bettergrow Sales Dashboard
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                      Download our official Excel template, enter your monthly salesperson budgets and actual sales, and upload the completed workbook.
                    </p>

                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#631244] hover:bg-[#4E0C34] active:bg-[#3B0726] transition-colors shadow-sm cursor-pointer border border-[#8C1B61]"
                      >
                        <FileDown className="w-4 h-4 text-[#DE5829]" />
                        Download Template (.xlsx)
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveView('upload')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-[#F5EFF2] hover:bg-[#EADBDE] border border-[#EADBDE] transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4 text-[#631244]" />
                        Upload Excel File
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 2: SALES ANALYTICS & CHARTS                           */}
          {/* ========================================================== */}
          {activeView === 'chart' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EADBDE]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    Visual Analytics & Performance Charts
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Interactive Recharts visualizations comparing quota allocation, revenue earned, and attainment benchmarks.
                  </p>
                </div>

                {hasData && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]">
                      Period: {periodLabel}
                    </span>
                  </div>
                )}
              </div>

              {hasData ? (
                <>
                  {/* Primary Visual Chart: Grouped Budget vs Actual Bar Chart */}
                  <SalesChart
                    performances={salespersonPerformances}
                    title={
                      periodLabel === 'All Months'
                        ? 'Budget Target vs. Actual Sales Comparison'
                        : `Budget Target vs. Actual Sales (${periodLabel})`
                    }
                    description="Grouped side-by-side comparison with terracotta orange (#DE5829) for target budgets and plum (#631244) for actual revenue"
                  />

                  {/* Secondary Visual Chart: Quota Achievement Ranking against 100% Benchmark */}
                  <AchievementRankingChart performances={salespersonPerformances} />
                </>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#EADBDE] bg-white p-12 text-center shadow-2xs">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">
                    No Analytics Data Available
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Please upload your sales records using the official template to view the performance visualization.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors cursor-pointer border border-[#8C1B61]"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />
                      Download Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('upload')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-[#F5EFF2] hover:bg-[#EADBDE] border border-[#EADBDE] transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#631244]" />
                      Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 3: SALESPERSON PERFORMANCE TABLE                      */}
          {/* ========================================================== */}
          {activeView === 'table' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EADBDE]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                    Salesperson Performance Ledger
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Detailed monthly salesperson aggregation with budget variance, achievement rates, and status badges.
                  </p>
                </div>

                {hasData && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-[#EADBDE] text-slate-700 hover:bg-[#F5EFF2] transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#631244]" />
                      Download Template
                    </button>
                  </div>
                )}
              </div>

              {hasData ? (
                <SalesTable
                  performances={salespersonPerformances}
                  title={
                    periodLabel === 'All Months'
                      ? 'Salesperson Performance Summary (All Months)'
                      : `Salesperson Performance (${periodLabel})`
                  }
                  description="Aggregated budget versus actual sales with automated target status classification"
                  searchTerm={searchQuery}
                  onSearchTermChange={setSearchQuery}
                />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#EADBDE] bg-white p-12 text-center shadow-2xs">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">
                    No Table Records Available
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Please upload your sales records using the official template to view individual sales representatives.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors cursor-pointer border border-[#8C1B61]"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />
                      Download Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('upload')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-[#F5EFF2] hover:bg-[#EADBDE] border border-[#EADBDE] transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-[#631244]" />
                      Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 4: DATA IMPORT & EXCEL SOURCE                         */}
          {/* ========================================================== */}
          {activeView === 'upload' && (
            <div className="space-y-6">
              <div className="pb-2 border-b border-[#EADBDE]">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  Data Source & Excel Management
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Download the official Bettergrow template, fill in your monthly salesperson budgets and actual sales, and upload the workbook.
                  Spreadsheets are parsed 100% locally in your browser using SheetJS.
                </p>
              </div>

              {/* Uploader Component with Upload History Ledger */}
              <FileUploader
                onSuccess={handleUploadSuccess}
                onReset={handleOpenResetModal}
                currentFileName={fileName || undefined}
                hasExistingData={hasData}
                onError={handleUploadError}
                onDownloadTemplate={handleDownloadTemplate}
                uploadedFiles={uploadedFiles}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
              />

              {/* Specification Guide for Required Excel Columns */}
              <div className="p-5 rounded-2xl bg-white border border-[#EADBDE] shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Info className="w-4 h-4 text-[#631244]" />
                  <span>Required Excel Spreadsheet Columns Specification:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF7F5] border border-[#EADBDE]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#631244]" />
                      <span>Salesperson</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Representative full name (e.g. Ahmed Hassan)
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F5] border border-[#EADBDE]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#631244]" />
                      <span>Month</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Reporting month (e.g. January, Feb, 2024-03)
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F5] border border-[#EADBDE]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#DE5829]" />
                      <span>Budget Amount</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Numeric target revenue (e.g. 50000)
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F5] border border-[#EADBDE]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#631244]" />
                      <span>Actual Sales</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Numeric revenue achieved (e.g. 52300)
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <p>
                    Tip: Multiple rows for the same salesperson are automatically combined and aggregated.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 font-bold text-[#631244] hover:text-[#4E0C34] transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-[#DE5829]" />
                    Download Official Template (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* VIEW 5: EXPORT DATA & EXECUTIVE REPORTS                    */}
          {/* ========================================================== */}
          {activeView === 'export' && (
            <ExportReportView
              summary={companySummary}
              performances={salespersonPerformances}
              selectedMonth={periodLabel}
              uploadedFiles={uploadedFiles}
              hasData={hasData}
              onNavigateToUpload={() => setActiveView('upload')}
              onDownloadTemplate={handleDownloadTemplate}
              onNotifySuccess={(title, message) => toast.success(title, message)}
            />
          )}
        </main>

        {/* Corporate Footer */}
        <footer className="border-t border-[#EADBDE] bg-white/70 py-4 mt-auto text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p className="font-bold text-slate-800">
              Bettergrow Holding Group • Wholesale Food Ingredients • Dubai Investment Park 2
            </p>
            <p className="text-[11px] text-slate-400">
              Client-side SheetJS processor • Active dataset persisted in sessionStorage • Zero external server dependencies
            </p>
          </div>
        </footer>
      </div>

      {/* 3. Global Confirmation Modal for Safe Session Reset */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
        totalFilesCount={uploadedFiles.length}
        totalRecordsCount={salesData.length}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
};

export default App;
