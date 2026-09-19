import React from 'react';
import type { CompanyPerformanceSummary, SalespersonPerformance, UploadedExcelFile } from '../../types/sales';
import type { ReportSectionsConfig } from '../../utils/exportUtils';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export interface PrintableReportDocumentProps {
  summary: CompanyPerformanceSummary;
  performances: SalespersonPerformance[];
  selectedMonth: string;
  uploadedFiles: UploadedExcelFile[];
  config: ReportSectionsConfig;
}

export const PrintableReportDocument: React.FC<PrintableReportDocumentProps> = ({
  summary,
  performances,
  selectedMonth,
  uploadedFiles,
  config,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const periodLabel = selectedMonth === 'ALL' ? 'Cumulative (All Recorded Months)' : selectedMonth;
  const isSurplus = summary.variance >= 0;
  const totalReps = summary.totalSalespeople || 1;
  const abovePct = Math.round((summary.salespeopleAboveTarget / totalReps) * 100);

  return (
    <div
      id="printable-report-document"
      className="bg-white text-slate-900 p-8 sm:p-12 max-w-4xl mx-auto shadow-sm border border-[#EADBDE] rounded-2xl print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-xs sm:text-sm font-sans space-y-8"
    >
      {/* 1. Official Corporate Letterhead */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#631244]">
        <div className="flex items-center gap-3">
          <div className="h-12 w-auto px-3 py-1.5 rounded-xl bg-white border border-[#EADBDE] flex items-center justify-center">
            <img
              src="/bgh-logo.svg"
              alt="Bettergrow Holding Group"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#631244] tracking-tight">
              BETTERGROW HOLDING GROUP
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Wholesale Food Ingredients Trading • Dubai Investment Park 2, Dubai, UAE
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <div className="inline-block px-2.5 py-1 rounded-md bg-[#FAF7F5] border border-[#EADBDE] text-[11px] font-bold text-[#631244]">
            Executive Briefing Document
          </div>
          <p className="text-xs text-slate-600">
            <strong>Published:</strong> {currentDate}
          </p>
          <p className="text-xs text-slate-600">
            <strong>Period:</strong> <span className="font-semibold text-slate-900">{periodLabel}</span>
          </p>
        </div>
      </header>

      {/* Meta Audit Box */}
      <div className="p-3.5 rounded-xl bg-[#FAF7F5] border border-[#EADBDE] text-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-700">Source Workbooks: </span>
          <span className="text-slate-600">
            {uploadedFiles.length > 0
              ? uploadedFiles.map((f) => f.fileName).join(', ')
              : 'Session In-Memory Records'}{' '}
            ({performances.length} Active Representatives)
          </span>
        </div>
        <div>
          <span className="font-bold text-slate-700">Status: </span>
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              summary.overallStatus === 'Above Target'
                ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
                : 'bg-[#FDF4F0] text-[#DE5829] border border-[#F8CBBA]'
            }`}
          >
            {summary.overallStatus}
          </span>
        </div>
      </div>

      {/* 2. Executive Narrative Summary */}
      {config.includeNarrative && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#631244] flex items-center gap-2 border-b border-[#F5EFF2] pb-1">
            <span>1. Executive Summary & Operational Context</span>
          </h2>
          <div className="p-4 rounded-xl border-l-4 border-[#631244] bg-[#FBF2F7]/50 text-slate-800 text-xs sm:text-sm leading-relaxed">
            During the evaluated reporting period of <strong>{periodLabel}</strong>, Bettergrow Holding Group achieved total wholesale trading sales of{' '}
            <strong className="text-[#631244]">{formatCurrency(summary.totalActual)}</strong> against an allocated target budget of{' '}
            <strong>{formatCurrency(summary.totalBudget)}</strong>, yielding an overall team attainment rate of{' '}
            <strong>{formatPercentage(summary.overallAchievementPercentage)}</strong> ({summary.overallStatus}). This reflects a net financial{' '}
            {isSurplus ? 'surplus' : 'shortfall'} of <strong>{formatCurrency(Math.abs(summary.variance))}</strong>.{' '}
            {summary.topPerformer && (
              <span>
                The top revenue contributor was <strong>{summary.topPerformer.salesperson}</strong> with{' '}
                {formatCurrency(summary.topPerformer.totalActual)} in gross revenue ({formatPercentage(summary.topPerformer.achievementPercentage)} quota attainment).
              </span>
            )}
          </div>
        </section>
      )}

      {/* 3. KPI Scoreboard Matrix */}
      {config.includeKPIs && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#631244] flex items-center gap-2 border-b border-[#F5EFF2] pb-1">
            <span>2. Key Performance Indicators Scoreboard</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#EADBDE] text-xs">
              <thead>
                <tr className="bg-[#631244] text-white">
                  <th className="p-2.5 font-bold border border-[#631244]">Metric Classification</th>
                  <th className="p-2.5 font-bold border border-[#631244] text-right">Target Allocation</th>
                  <th className="p-2.5 font-bold border border-[#631244] text-right">Actual Revenue</th>
                  <th className="p-2.5 font-bold border border-[#631244] text-right">Net Variance</th>
                  <th className="p-2.5 font-bold border border-[#631244] text-right">Attainment %</th>
                  <th className="p-2.5 font-bold border border-[#631244] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBDE]">
                <tr className="hover:bg-[#FAF7F5]">
                  <td className="p-2.5 font-bold text-slate-900 border border-[#EADBDE]">Wholesale Sales Revenue</td>
                  <td className="p-2.5 text-right border border-[#EADBDE]">{formatCurrency(summary.totalBudget)}</td>
                  <td className="p-2.5 text-right font-bold text-[#631244] border border-[#EADBDE]">{formatCurrency(summary.totalActual)}</td>
                  <td className={`p-2.5 text-right font-semibold border border-[#EADBDE] ${isSurplus ? 'text-[#631244]' : 'text-rose-600'}`}>
                    {isSurplus ? '+' : ''}{formatCurrency(summary.variance)}
                  </td>
                  <td className="p-2.5 text-right font-bold border border-[#EADBDE]">{formatPercentage(summary.overallAchievementPercentage)}</td>
                  <td className="p-2.5 text-center border border-[#EADBDE]">
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-[#FBF2F7] text-[#631244]">
                      {summary.overallStatus}
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#FAF7F5]">
                  <td className="p-2.5 font-bold text-slate-900 border border-[#EADBDE]">Sales Team Headcount</td>
                  <td className="p-2.5 text-right border border-[#EADBDE]">{summary.totalSalespeople} Reps</td>
                  <td className="p-2.5 text-right border border-[#EADBDE]">{summary.salespeopleAboveTarget} Surpassed</td>
                  <td className="p-2.5 text-right border border-[#EADBDE]">{summary.salespeopleBelowTarget} Below</td>
                  <td className="p-2.5 text-right font-bold border border-[#EADBDE]">{abovePct}% Success</td>
                  <td className="p-2.5 text-center border border-[#EADBDE]">Team Metric</td>
                </tr>
                {summary.topPerformer && (
                  <tr className="bg-[#FAF7F5]">
                    <td className="p-2.5 font-bold text-slate-900 border border-[#EADBDE]">Top Representative ({summary.topPerformer.salesperson})</td>
                    <td className="p-2.5 text-right border border-[#EADBDE]">{formatCurrency(summary.topPerformer.totalBudget)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-900 border border-[#EADBDE]">{formatCurrency(summary.topPerformer.totalActual)}</td>
                    <td className="p-2.5 text-right font-bold text-[#631244] border border-[#EADBDE]">+{formatCurrency(summary.topPerformer.variance)}</td>
                    <td className="p-2.5 text-right font-bold text-[#631244] border border-[#EADBDE]">{formatPercentage(summary.topPerformer.achievementPercentage)}</td>
                    <td className="p-2.5 text-center border border-[#EADBDE]">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-[#DE5829] text-white">
                        Rank #1
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. Team Attainment & Productivity Distribution */}
      {config.includeTeamHealth && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#631244] flex items-center gap-2 border-b border-[#F5EFF2] pb-1">
            <span>3. Team Attainment & Productivity Breakdown</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-[#EADBDE] bg-[#FAF7F5]">
              <span className="text-[11px] text-slate-500 block">Quota Success Rate</span>
              <span className="text-base font-bold text-[#631244] mt-0.5 block">{abovePct}%</span>
              <span className="text-[10px] text-slate-400">{summary.salespeopleAboveTarget} of {summary.totalSalespeople} reps</span>
            </div>
            <div className="p-3 rounded-xl border border-[#EADBDE] bg-[#FAF7F5]">
              <span className="text-[11px] text-slate-500 block">Avg. Revenue / Rep</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                {formatCurrency(summary.totalActual / totalReps)}
              </span>
              <span className="text-[10px] text-slate-400">Headcount average</span>
            </div>
            <div className="p-3 rounded-xl border border-[#EADBDE] bg-[#FAF7F5]">
              <span className="text-[11px] text-slate-500 block">Avg. Target / Rep</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                {formatCurrency(summary.totalBudget / totalReps)}
              </span>
              <span className="text-[10px] text-slate-400">Standard quota</span>
            </div>
            <div className="p-3 rounded-xl border border-[#EADBDE] bg-[#FAF7F5]">
              <span className="text-[11px] text-slate-500 block">Avg. Variance / Rep</span>
              <span className={`text-base font-bold mt-0.5 block ${isSurplus ? 'text-[#631244]' : 'text-rose-600'}`}>
                {isSurplus ? '+' : ''}{formatCurrency(summary.variance / totalReps)}
              </span>
              <span className="text-[10px] text-slate-400">{isSurplus ? 'Surplus' : 'Deficit'}</span>
            </div>
          </div>
        </section>
      )}

      {/* 5. Detailed Salesperson Performance Ledger Table */}
      {config.includeRosterTable && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#631244] flex items-center gap-2 border-b border-[#F5EFF2] pb-1">
            <span>4. Detailed Salesperson Performance Ledger</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#EADBDE] text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="p-2 border border-[#EADBDE] font-bold">Salesperson</th>
                  <th className="p-2 border border-[#EADBDE] font-bold text-right">Target Budget</th>
                  <th className="p-2 border border-[#EADBDE] font-bold text-right">Actual Sales</th>
                  <th className="p-2 border border-[#EADBDE] font-bold text-right">Variance</th>
                  <th className="p-2 border border-[#EADBDE] font-bold text-right">Attainment %</th>
                  <th className="p-2 border border-[#EADBDE] font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBDE]">
                {performances.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAF7F5]' : 'bg-white'}>
                    <td className="p-2 border border-[#EADBDE] font-semibold text-slate-900">{p.salesperson}</td>
                    <td className="p-2 border border-[#EADBDE] text-right text-slate-600">{formatCurrency(p.totalBudget)}</td>
                    <td className="p-2 border border-[#EADBDE] text-right font-bold text-slate-900">{formatCurrency(p.totalActual)}</td>
                    <td className={`p-2 border border-[#EADBDE] text-right font-semibold ${p.variance >= 0 ? 'text-[#631244]' : 'text-rose-600'}`}>
                      {p.variance >= 0 ? '+' : ''}{formatCurrency(p.variance)}
                    </td>
                    <td className="p-2 border border-[#EADBDE] text-right font-bold text-slate-900">
                      {formatPercentage(p.achievementPercentage)}
                    </td>
                    <td className="p-2 border border-[#EADBDE] text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'Above Target'
                            ? 'bg-[#FBF2F7] text-[#631244] border border-[#EDC6DD]'
                            : 'bg-[#FDF4F0] text-[#DE5829] border border-[#F8CBBA]'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Grand Totals */}
                <tr className="bg-[#F5EFF2] font-bold text-slate-900 border-t-2 border-[#631244]">
                  <td className="p-2.5 border border-[#EADBDE]">GRAND TOTALS</td>
                  <td className="p-2.5 border border-[#EADBDE] text-right">{formatCurrency(summary.totalBudget)}</td>
                  <td className="p-2.5 border border-[#EADBDE] text-right font-extrabold text-[#631244]">{formatCurrency(summary.totalActual)}</td>
                  <td className={`p-2.5 border border-[#EADBDE] text-right font-bold ${isSurplus ? 'text-[#631244]' : 'text-rose-600'}`}>
                    {isSurplus ? '+' : ''}{formatCurrency(summary.variance)}
                  </td>
                  <td className="p-2.5 border border-[#EADBDE] text-right font-extrabold">{formatPercentage(summary.overallAchievementPercentage)}</td>
                  <td className="p-2.5 border border-[#EADBDE] text-center">
                    <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-[#631244] text-white">
                      {summary.overallStatus}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. Corporate Approval Block */}
      {config.includeSignoff && (
        <section className="space-y-2 pt-4 border-t border-[#EADBDE]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#631244] flex items-center gap-2 pb-1">
            <span>5. Governance & Executive Approval</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#CBD5E0] bg-[#FAF7F5] space-y-4">
              <span className="font-bold text-slate-700 block">Prepared By</span>
              <div className="space-y-2 text-slate-500">
                <p>Name: _______________________</p>
                <p>Title: Sales Operations Lead</p>
                <p>Date: ____ / ____ / _________</p>
                <p>Signature: __________________</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#CBD5E0] bg-[#FAF7F5] space-y-4">
              <span className="font-bold text-slate-700 block">Reviewed By</span>
              <div className="space-y-2 text-slate-500">
                <p>Name: _______________________</p>
                <p>Title: Head of Commercial Finance</p>
                <p>Date: ____ / ____ / _________</p>
                <p>Signature: __________________</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#CBD5E0] bg-[#FAF7F5] space-y-4">
              <span className="font-bold text-slate-700 block">Approved By</span>
              <div className="space-y-2 text-slate-500">
                <p>Name: _______________________</p>
                <p>Title: Managing Director</p>
                <p>Date: ____ / ____ / _________</p>
                <p>Signature: __________________</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Corporate Print Footer */}
      <footer className="pt-6 border-t border-[#EADBDE] text-center text-[11px] text-slate-400 space-y-1">
        <p className="font-bold text-slate-600">
          Bettergrow Holding Group • Wholesale Food Ingredients • Dubai Investment Park 2, Dubai, UAE
        </p>
        <p>
          Generated from Client-Side Session Analytics Engine • Confidential Corporate Documentation
        </p>
      </footer>
    </div>
  );
};
