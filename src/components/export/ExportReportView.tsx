import React, { useState } from 'react';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Check,
  UploadCloud,
  FileDown,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  CompanyPerformanceSummary,
  SalespersonPerformance,
  UploadedExcelFile,
} from '../../types/sales';
import {
  generateWordDoc,
  triggerPrintPdf,
  exportExecutiveSummaryExcel,
  type ReportSectionsConfig,
} from '../../utils/exportUtils';
import { PrintableReportDocument } from './PrintableReportDocument';

export interface ExportReportViewProps {
  summary: CompanyPerformanceSummary;
  performances: SalespersonPerformance[];
  selectedMonth: string;
  uploadedFiles: UploadedExcelFile[];
  hasData: boolean;
  onNavigateToUpload: () => void;
  onDownloadTemplate: () => void;
  onNotifySuccess: (title: string, message: string) => void;
}

export const ExportReportView: React.FC<ExportReportViewProps> = ({
  summary,
  performances,
  selectedMonth,
  uploadedFiles,
  hasData,
  onNavigateToUpload,
  onDownloadTemplate,
  onNotifySuccess,
}) => {
  const [config, setConfig] = useState<ReportSectionsConfig>({
    includeNarrative: true,
    includeKPIs: true,
    includeTeamHealth: true,
    includeRosterTable: true,
    includeSignoff: true,
  });

  const toggleSection = (key: keyof ReportSectionsConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrintPdf = () => {
    triggerPrintPdf();
  };

  const handleDownloadWord = () => {
    generateWordDoc({
      summary,
      performances,
      selectedMonth,
      uploadedFiles,
      config,
    });
    onNotifySuccess(
      'Word Document Generated',
      'Executive briefing has been downloaded as a Word-compatible (.doc) file.'
    );
  };

  const handleDownloadExcel = () => {
    exportExecutiveSummaryExcel({
      summary,
      performances,
      selectedMonth,
      uploadedFiles,
      config,
    });
    onNotifySuccess(
      'Excel Summary Exported',
      'Aggregated executive performance workbook (.xlsx) has been downloaded.'
    );
  };

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-[#EADBDE]">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Export Data & Executive Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Generate, customize, and export executive sales briefings in PDF, Microsoft Word (.doc), and Excel spreadsheet formats.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-[#EADBDE] bg-white p-12 text-center shadow-2xs">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            No Sales Data Available for Export
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Please upload your monthly salesperson workbook using the official template to preview and export executive reports.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#631244] hover:bg-[#4E0C34] transition-colors cursor-pointer border border-[#8C1B61]"
            >
              <FileDown className="w-3.5 h-3.5 text-[#DE5829]" />
              Download Template
            </button>
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-[#F5EFF2] hover:bg-[#EADBDE] border border-[#EADBDE] transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#631244]" />
              Upload Spreadsheets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EADBDE]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Export Data & Executive Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Generate and export official wholesale performance briefings in PDF, Word (.doc), or Excel (.xlsx) formats.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-xl bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD] self-start sm:self-auto shrink-0">
          Period: {selectedMonth === 'ALL' ? 'All Months' : selectedMonth}
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EADBDE] shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Export Actions
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred report document format:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Print / Save as PDF */}
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#631244] hover:bg-[#4E0C34] active:bg-[#3B0726] transition-all shadow-xs cursor-pointer border border-[#8C1B61]"
              title="Print document or save directly as PDF"
            >
              <Printer className="w-4 h-4 text-[#DE5829]" />
              Print / Save as PDF
            </button>

            {/* 2. Download as Microsoft Word (.doc) */}
            <button
              type="button"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-slate-800 bg-[#FDF4F0] hover:bg-[#FCE7DE] active:bg-[#F8CBBA] transition-all shadow-2xs border border-[#F8CBBA] cursor-pointer"
              title="Export as Microsoft Word (.doc) document"
            >
              <FileText className="w-4 h-4 text-[#DE5829]" />
              Download Word Doc (.doc)
            </button>

            {/* 3. Export Summary Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-[#FAF7F5] transition-all border border-[#EADBDE] shadow-2xs cursor-pointer"
              title="Export summary workbook in Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#631244]" />
              Export Summary Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Section Customization Toggles */}
        <div className="pt-3 border-t border-[#F5EFF2] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#631244]" />
            <span>Customize Report Sections to Include:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {[
              { key: 'includeNarrative' as const, label: 'Executive Narrative' },
              { key: 'includeKPIs' as const, label: 'KPI Scoreboard' },
              { key: 'includeTeamHealth' as const, label: 'Team Quota Distribution' },
              { key: 'includeRosterTable' as const, label: 'Salespeople Ledger Table' },
              { key: 'includeSignoff' as const, label: 'Approval Sign-off' },
            ].map(({ key, label }) => {
              const active = config[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#FBF2F7] text-[#631244] border-[#EDC6DD]'
                      : 'bg-white text-slate-400 border-slate-200 line-through'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                      active ? 'bg-[#631244] text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {active && <Check className="w-2.5 h-2.5" />}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Document Preview Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Live Document Preview
          </span>
          <span className="text-[11px] text-slate-400">
            Updates in real-time as section toggles change
          </span>
        </div>

        <div className="p-4 sm:p-8 rounded-3xl bg-slate-100/80 border border-[#EADBDE] overflow-x-auto shadow-inner">
          <PrintableReportDocument
            summary={summary}
            performances={performances}
            selectedMonth={selectedMonth}
            uploadedFiles={uploadedFiles}
            config={config}
          />
        </div>
      </div>
    </div>
  );
};
