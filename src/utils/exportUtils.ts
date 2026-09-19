import * as XLSX from 'xlsx';
import type { CompanyPerformanceSummary, SalespersonPerformance, UploadedExcelFile } from '../types/sales';
import { formatCurrency, formatPercentage } from './calculations';

export interface ReportSectionsConfig {
  includeNarrative: boolean;
  includeKPIs: boolean;
  includeTeamHealth: boolean;
  includeRosterTable: boolean;
  includeSignoff: boolean;
}

export interface ExportReportData {
  summary: CompanyPerformanceSummary;
  performances: SalespersonPerformance[];
  selectedMonth: string;
  uploadedFiles: UploadedExcelFile[];
  config?: ReportSectionsConfig;
}

const DEFAULT_CONFIG: ReportSectionsConfig = {
  includeNarrative: true,
  includeKPIs: true,
  includeTeamHealth: true,
  includeRosterTable: true,
  includeSignoff: true,
};

/**
 * Triggers the browser's native print preview dialog.
 * Tuned with print-specific stylesheets for A4 / Letter PDF generation.
 */
export function triggerPrintPdf(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

/**
 * Generates an executive Microsoft Word document (.doc) containing
 * formatted corporate tables, narrative summaries, and company metrics.
 */
export function generateWordDoc({
  summary,
  performances,
  selectedMonth,
  uploadedFiles,
  config = DEFAULT_CONFIG,
}: ExportReportData): void {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const periodLabel = selectedMonth === 'ALL' ? 'Cumulative (All Recorded Months)' : selectedMonth;
  const isSurplus = summary.variance >= 0;
  const abovePct = Math.round((summary.salespeopleAboveTarget / (summary.totalSalespeople || 1)) * 100);

  // Construct Word-compatible HTML string with embedded corporate styling
  const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Bettergrow Sales Performance Report</title>
  <style>
    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      color: #2D3748;
      line-height: 1.5;
      padding: 20px;
    }
    h1 {
      color: #631244;
      font-size: 22pt;
      margin-bottom: 4px;
      font-weight: bold;
    }
    h2 {
      color: #631244;
      font-size: 14pt;
      border-bottom: 2px solid #DE5829;
      padding-bottom: 4px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .header-sub {
      color: #718096;
      font-size: 10pt;
      margin-bottom: 20px;
    }
    .meta-box {
      background-color: #FAF7F5;
      border: 1px solid #EADBDE;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    .narrative-box {
      background-color: #FBF2F7;
      border-left: 4px solid #631244;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 11pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    th {
      background-color: #631244;
      color: #ffffff;
      font-weight: bold;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #631244;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #CBD5E0;
    }
    tr:nth-child(even) {
      background-color: #FAF7F5;
    }
    .totals-row td {
      background-color: #F5EFF2;
      font-weight: bold;
      border-top: 2px solid #631244;
    }
    .badge-above {
      background-color: #FBF2F7;
      color: #631244;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .badge-below {
      background-color: #FDF4F0;
      color: #DE5829;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .signoff-table td {
      height: 60px;
      vertical-align: top;
      border: 1px solid #CBD5E0;
    }
  </style>
</head>
<body>

  <!-- Corporate Header -->
  <h1>BETTERGROW HOLDING GROUP</h1>
  <div class="header-sub">
    Wholesale Food Ingredients Trading • Executive Sales Performance Briefing<br>
    <strong>Reporting Period:</strong> ${periodLabel} • <strong>Published Date:</strong> ${currentDate}
  </div>

  <!-- Meta Information -->
  <div class="meta-box">
    <strong>Document Scope:</strong> Executive sales targets vs. revenue achievement audit.<br>
    <strong>Source Workbooks:</strong> ${
      uploadedFiles.length > 0
        ? uploadedFiles.map((f) => f.fileName).join(', ')
        : 'Session In-Memory Dataset'
    } (${performances.length} Active Representatives).
  </div>

  ${
    config.includeNarrative
      ? `
  <!-- Executive Narrative Summary -->
  <h2>1. Executive Summary & Context</h2>
  <div class="narrative-box">
    For the reporting timeframe of <strong>${periodLabel}</strong>, Bettergrow Holding Group recorded total wholesale sales of 
    <strong>${formatCurrency(summary.totalActual)}</strong> against an allocated target budget of 
    <strong>${formatCurrency(summary.totalBudget)}</strong>, delivering an overall attainment rate of 
    <strong>${formatPercentage(summary.overallAchievementPercentage)}</strong> (${summary.overallStatus}). 
    This represents a net revenue ${isSurplus ? 'surplus' : 'shortfall'} of 
    <strong>${formatCurrency(Math.abs(summary.variance))}</strong>. 
    Currently, <strong>${summary.salespeopleAboveTarget} of ${summary.totalSalespeople}</strong> representatives (${abovePct}%) are performing on or above their allocated quota.
  </div>
  `
      : ''
  }

  ${
    config.includeKPIs
      ? `
  <!-- Key Performance Scoreboard -->
  <h2>2. Key Performance Indicators (KPI Scoreboard)</h2>
  <table>
    <thead>
      <tr>
        <th>Metric Classification</th>
        <th>Target Allocation</th>
        <th>Actual Achievement</th>
        <th>Variance (+ / -)</th>
        <th>Attainment %</th>
        <th>Quota Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Wholesale Trading Revenue</strong></td>
        <td>${formatCurrency(summary.totalBudget)}</td>
        <td><strong>${formatCurrency(summary.totalActual)}</strong></td>
        <td>${isSurplus ? '+' : ''}${formatCurrency(summary.variance)}</td>
        <td><strong>${formatPercentage(summary.overallAchievementPercentage)}</strong></td>
        <td><span class="${summary.overallStatus === 'Above Target' ? 'badge-above' : 'badge-below'}">${summary.overallStatus}</span></td>
      </tr>
      <tr>
        <td><strong>Sales Team Headcount</strong></td>
        <td>${summary.totalSalespeople} Assigned</td>
        <td>${summary.salespeopleAboveTarget} Surpassed</td>
        <td>${summary.salespeopleBelowTarget} Below Target</td>
        <td>${abovePct}% Success</td>
        <td>Team Attainment</td>
      </tr>
      ${
        summary.topPerformer
          ? `
      <tr>
        <td><strong>Top Sales Representative</strong></td>
        <td>${formatCurrency(summary.topPerformer.totalBudget)}</td>
        <td><strong>${formatCurrency(summary.topPerformer.totalActual)}</strong></td>
        <td>+${formatCurrency(summary.topPerformer.variance)}</td>
        <td><strong>${formatPercentage(summary.topPerformer.achievementPercentage)}</strong></td>
        <td><span class="badge-above">#1 Performer (${summary.topPerformer.salesperson})</span></td>
      </tr>`
          : ''
      }
    </tbody>
  </table>
  `
      : ''
  }

  ${
    config.includeTeamHealth
      ? `
  <!-- Team Productivity Breakdown -->
  <h2>3. Team Attainment & Productivity Distribution</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Operational Takeaway</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Quota Success Rate</strong></td>
        <td><strong>${abovePct}%</strong> of team (${summary.salespeopleAboveTarget} / ${summary.totalSalespeople})</td>
        <td>Percentage of representatives meeting or exceeding target allocation</td>
      </tr>
      <tr>
        <td><strong>Average Sales per Representative</strong></td>
        <td><strong>${formatCurrency(summary.totalActual / (summary.totalSalespeople || 1))}</strong></td>
        <td>Average revenue generated per individual headcount</td>
      </tr>
      <tr>
        <td><strong>Average Target Allocation per Rep</strong></td>
        <td>${formatCurrency(summary.totalBudget / (summary.totalSalespeople || 1))}</td>
        <td>Standard benchmark requirement per representative</td>
      </tr>
      <tr>
        <td><strong>Net Team Variance per Headcount</strong></td>
        <td><strong>${isSurplus ? '+' : ''}${formatCurrency(summary.variance / (summary.totalSalespeople || 1))}</strong></td>
        <td>Net financial surplus contribution per sales executive</td>
      </tr>
    </tbody>
  </table>
  `
      : ''
  }

  ${
    config.includeRosterTable
      ? `
  <!-- Detailed Sales Representative Roster -->
  <h2>4. Detailed Salesperson Performance Ledger</h2>
  <table>
    <thead>
      <tr>
        <th>Salesperson Name</th>
        <th style="text-align: right;">Target Budget</th>
        <th style="text-align: right;">Actual Sales</th>
        <th style="text-align: right;">Variance (+ / -)</th>
        <th style="text-align: right;">Attainment %</th>
        <th style="text-align: center;">Target Status</th>
      </tr>
    </thead>
    <tbody>
      ${performances
        .map(
          (p) => `
      <tr>
        <td><strong>${p.salesperson}</strong></td>
        <td style="text-align: right;">${formatCurrency(p.totalBudget)}</td>
        <td style="text-align: right; font-weight: bold;">${formatCurrency(p.totalActual)}</td>
        <td style="text-align: right; color: ${p.variance >= 0 ? '#631244' : '#C53030'};">
          ${p.variance >= 0 ? '+' : ''}${formatCurrency(p.variance)}
        </td>
        <td style="text-align: right; font-weight: bold;">${formatPercentage(p.achievementPercentage)}</td>
        <td style="text-align: center;">
          <span class="${p.status === 'Above Target' ? 'badge-above' : 'badge-below'}">${p.status}</span>
        </td>
      </tr>
      `
        )
        .join('')}
      <!-- Totals Row -->
      <tr class="totals-row">
        <td>GRAND TOTALS</td>
        <td style="text-align: right;">${formatCurrency(summary.totalBudget)}</td>
        <td style="text-align: right;">${formatCurrency(summary.totalActual)}</td>
        <td style="text-align: right; color: ${isSurplus ? '#631244' : '#C53030'};">
          ${isSurplus ? '+' : ''}${formatCurrency(summary.variance)}
        </td>
        <td style="text-align: right;">${formatPercentage(summary.overallAchievementPercentage)}</td>
        <td style="text-align: center;">
          <span class="${summary.overallStatus === 'Above Target' ? 'badge-above' : 'badge-below'}">${summary.overallStatus}</span>
        </td>
      </tr>
    </tbody>
  </table>
  `
      : ''
  }

  ${
    config.includeSignoff
      ? `
  <!-- Corporate Approval Block -->
  <h2>5. Governance & Executive Approval</h2>
  <table class="signoff-table">
    <thead>
      <tr>
        <th>Prepared By</th>
        <th>Reviewed By (Finance)</th>
        <th>Approved By (Director)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Name:<br><br>Date:<br>Signature:</td>
        <td>Name:<br><br>Date:<br>Signature:</td>
        <td>Name:<br><br>Date:<br>Signature:</td>
      </tr>
    </tbody>
  </table>
  `
      : ''
  }

  <p style="font-size: 9pt; color: #A0AEC0; text-align: center; margin-top: 30px;">
    Bettergrow Holding Group • Dubai Investment Park 2, Dubai, UAE • Generated via BGH Sales Analytics System
  </p>

</body>
</html>
`;

  const blob = new Blob(['\ufeff' + docHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safePeriod = selectedMonth.replace(/[^a-zA-Z0-9]/g, '_');
  a.href = url;
  a.download = `Bettergrow_Sales_Report_${safePeriod}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports an executive aggregated spreadsheet (.xlsx) using SheetJS
 * containing an Executive Summary sheet and a Salesperson Rankings sheet.
 */
export function exportExecutiveSummaryExcel({
  summary,
  performances,
  selectedMonth,
}: ExportReportData): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Executive KPI Scoreboard
  const kpiData = [
    { 'Metric': 'Reporting Period', 'Value': selectedMonth === 'ALL' ? 'All Recorded Months' : selectedMonth },
    { 'Metric': 'Total Sales Representatives', 'Value': summary.totalSalespeople },
    { 'Metric': 'Total Budget Target (AED)', 'Value': summary.totalBudget },
    { 'Metric': 'Total Actual Sales (AED)', 'Value': summary.totalActual },
    { 'Metric': 'Revenue Variance (AED)', 'Value': summary.variance },
    { 'Metric': 'Overall Achievement %', 'Value': `${summary.overallAchievementPercentage.toFixed(1)}%` },
    { 'Metric': 'Executive Quota Status', 'Value': summary.overallStatus },
    { 'Metric': 'Representatives Above Target', 'Value': summary.salespeopleAboveTarget },
    { 'Metric': 'Representatives Below Target', 'Value': summary.salespeopleBelowTarget },
    {
      'Metric': 'Top Performer',
      'Value': summary.topPerformer
        ? `${summary.topPerformer.salesperson} (${formatPercentage(summary.topPerformer.achievementPercentage)})`
        : 'N/A',
    },
  ];

  const wsKpi = XLSX.utils.json_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(workbook, wsKpi, 'Executive KPIs');

  // Sheet 2: Detailed Salesperson Performance Ledger
  const rosterData = performances.map((p) => ({
    'Salesperson': p.salesperson,
    'Budget Target': p.totalBudget,
    'Actual Revenue': p.totalActual,
    'Variance': p.variance,
    'Achievement %': `${p.achievementPercentage.toFixed(1)}%`,
    'Status': p.status,
  }));

  // Append grand totals row
  rosterData.push({
    'Salesperson': 'GRAND TOTALS',
    'Budget Target': summary.totalBudget,
    'Actual Revenue': summary.totalActual,
    'Variance': summary.variance,
    'Achievement %': `${summary.overallAchievementPercentage.toFixed(1)}%`,
    'Status': summary.overallStatus,
  });

  const wsRoster = XLSX.utils.json_to_sheet(rosterData);
  XLSX.utils.book_append_sheet(workbook, wsRoster, 'Salesperson Rankings');

  // Trigger download
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safePeriod = selectedMonth.replace(/[^a-zA-Z0-9]/g, '_');
  a.href = url;
  a.download = `Bettergrow_Executive_Summary_${safePeriod}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
