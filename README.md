# Bettergrow Holding Group — Sales Performance Dashboard

A modern, client-side web dashboard built for a wholesale trading company to track individual salesperson sales performance against budgeted targets.

---

## 1. Problem Statement

Wholesale trading operations require regular evaluation of sales performance across regional representatives and quarterly timeframes. Sales leadership frequently receives monthly spreadsheets containing sales quotas (Budget) and realized revenues (Actual Sales). 

Evaluating performance manually in spreadsheets can lead to unweighted averaging errors, inconsistent percentage calculations, and lack of visual comparison. This application solves this by providing:
- Instant in-browser ingestion and validation of monthly Excel spreadsheets.
- Accurate cumulative sales achievement metrics (avoiding flawed unweighted averages).
- Clear visual distinction between representatives who are on-track (`Above Target`) vs. off-track (`Below Target`).
- Side-by-side grouped bar chart visualization and interactive sortable breakdown tables.
- Zero server setup or database overhead — 100% private, client-side execution.

---

## 2. Features

- **In-Browser Excel Upload**: Drag-and-drop or file picker accepting `.xlsx` and `.xls` workbooks.
- **Preload Sample Data**: One-click demo dataset (15 monthly records across 5 salespeople) allowing instant reviewer evaluation without preparing an Excel file.
- **Download Sample Excel**: Built-in template generator to download `Bettergrow_Sample_Sales.xlsx` with the exact required columns for testing.
- **Executive KPI Summary Cards**:
  - Total Salespeople (with count of above vs. below target reps).
  - Total Budget (formatted USD).
  - Total Actual Sales (with surplus/deficit dollar variance badge).
  - Overall Achievement % (with target progress bar and status badge).
  - Top Performer Spotlight (highlighting highest achiever).
- **Grouped Bar Chart (Recharts)**: Side-by-side comparison of Budget vs. Actual Sales per representative with custom tooltips.
- **Performance Breakdown Table**:
  - Aggregates multi-month records per salesperson.
  - Interactive multi-column sorting (Salesperson, Budget, Actual, Achievement %).
  - Live salesperson search filter.
  - Inline progress bars and color-coded status badges.
  - Table footer displaying Grand Totals across all filtered rows.
- **Timeframe Filtering**: Interactive tabs to toggle between "All Months (Cumulative)" and individual monthly breakdowns.
- **Cross-Refresh Persistence**: Preserves active dataset and demo flags in `sessionStorage` across page reloads.
- **Graceful Error Handling**: Detects and reports invalid file types, missing required columns, non-numeric values, blank fields, and duplicate monthly rows with 1-based Excel row numbering.

---

## 3. Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Bundler**: [Vite 8](https://vite.dev/) (Optimized vendor chunk code-splitting)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Spreadsheet Engine**: [SheetJS (xlsx)](https://docs.sheetjs.com/) — 100% in-browser parsing
- **Data Visualization**: [Recharts](https://recharts.org/) — Responsive grouped bar chart
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 4. Architecture

The application adopts a **Client-Side, Utility-First Unidirectional Data Architecture**:

```
[ User Upload / Preload Sample Data ]
                 │
                 ▼
     [ SheetJS Excel Parser ] (xlsx)
                 │
                 ▼
    [ Normalizer & Data Validator ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
 [ Error / Alert UI ]   [ React State (useSalesData) ]
                          │
                          ├────────► [ Browser sessionStorage ] (Persist across reload)
                          ▼
                 [ Aggregation Engine ]
             (Filter by Month, Sum Totals,
            Calculate Achievement %, Status)
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
  [ KPI Cards ]    [ Recharts Chart ]  [ Summary Table ]
```

### Architectural Principles:
1. **Zero-Backend / Serverless**: All parsing, sanitization, and calculations occur in the user's browser. No data ever leaves the client machine, ensuring complete privacy.
2. **Single Source of Truth**: The raw normalized records (`SalesRecord[]`) live in React state. Aggregated metrics per salesperson and company KPIs are derived via `useMemo` from a pure calculation utility, guaranteeing that the chart and table cannot disagree.
3. **Storage Boundary**: Low-level `sessionStorage` serialization and deserialization are encapsulated in a dedicated utility with type guards and automatic recovery from corrupted data.

---

## 5. Excel Data Flow

```
[ Excel File (.xlsx / .xls) ]
              │
              ▼
1. Format Validation (.xlsx / .xls extension check)
              │
              ▼
2. Binary Stream Read (file.arrayBuffer() in-browser)
              │
              ▼
3. Workbook Extraction (SheetJS XLSX.read with first sheet)
              │
              ▼
4. Header Verification:
   • Salesperson
   • Month
   • Budget Amount
   • Actual Sales
   (Case-insensitive, whitespace-trimmed mapping)
              │
              ▼
5. Row Processing & Sanitization:
   • Silently skip empty spacer rows
   • Verify non-blank Salesperson & Month
   • Detect and flag duplicate (salesperson, month) records
   • Sanitize numeric strings (strip $, commas; prevent NaN/Infinity)
              │
              ▼
6. State & Storage Handoff:
   • setSalesData(records) -> Updates primary React state
   • saveSalesDataToSession(records) -> Caches JSON in sessionStorage
              │
              ▼
7. Reactive Render:
   • KPI Cards, Recharts Chart, and SalesTable update instantly
```

---

## 6. Storage Approach

- **Primary Working State**: **React State** (`useState<SalesRecord[]>`). All dashboard components bind reactively to this in-memory state.
- **Persistence Mechanism**: **`sessionStorage`** (`key: 'bgh-sales-data'`). 
  - Survives accidental page reloads (`F5`) without forcing re-upload.
  - Automatically clears when the browser tab is closed, leaving no persistent footprint.
- **Why NOT `localStorage`?**: Wholesale sales figures are confidential and session-specific. `sessionStorage` avoids cross-tab race conditions and stale persistent storage.
- **Why NOT store the raw Excel File?**: Native `File` binary objects cannot be serialized to JSON. Storing the normalized `SalesRecord[]` minimizes storage footprint (~2 KB) and eliminates redundant SheetJS reparsing.
- **Error Recovery**: If `sessionStorage` data is missing or corrupted, the storage adapter clears the invalid key and initializes with an empty dataset without crashing the UI.

---

## 7. Calculation Logic

### A. Salesperson Cumulative Totals
$$\text{Total Budget} = \sum \text{Monthly Budgets}$$
$$\text{Total Actual} = \sum \text{Monthly Actual Sales}$$
$$\text{Variance} = \text{Total Actual} - \text{Total Budget}$$

### B. Achievement Percentage
$$\text{Achievement \%} = \left(\frac{\text{Total Actual}}{\text{Total Budget}}\right) \times 100$$

> **Critical Rule: No Averaging of Monthly Percentages**  
> Averaging monthly percentages treats small and large revenue months identically, causing mathematical distortion. The dashboard sums total actual sales first, then divides by total budget to produce the true cumulative achievement.

### C. Safe Zero Budget Handling
$$\text{Achievement \%} = \begin{cases} 
0\% & \text{if Budget } \le 0 \text{ and Actual } \le 0 \\
100\% & \text{if Budget } \le 0 \text{ and Actual } > 0 \\
\left(\frac{\text{Actual}}{\text{Budget}}\right) \times 100 & \text{if Budget } > 0 
\end{cases}$$
*Guarantees that `NaN` or `Infinity` is never produced.*

### D. Target Status Classification
- **`Above Target`**: $\text{Achievement \%} \ge 100\%$ (Green indicator badge)
- **`Below Target`**: $\text{Achievement \%} < 100\%$ (Rose indicator badge)

---

## 8. Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher)
- `npm` (version 9.0.0 or higher)

### Steps

1. **Clone or navigate to the project directory**:
   ```bash
   cd d:/Projects/bgh
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173/` in your browser.

---

## 9. Build Instructions

To test TypeScript compilation and generate the production bundle:

```bash
npm run build
```

The compiled assets will be created in the `dist/` directory with vendor code-splitting:
- `dist/index.html` — Lightweight HTML entrypoint
- `dist/assets/vendor-react-*.js` — React runtime
- `dist/assets/vendor-charts-*.js` — Recharts visualization library
- `dist/assets/vendor-xlsx-*.js` — SheetJS spreadsheet engine
- `dist/assets/index-*.js` — Application logic (~63 KB)
- `dist/assets/index-*.css` — Tailwind CSS v4 styles

To locally preview the production build:
```bash
npm run preview
```

To run the linter:
```bash
npm run lint
```

---

## 10. Deployment Instructions (Vercel)

The application is zero-config ready for deployment on [Vercel](https://vercel.com/):

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option B: Via Vercel Web Dashboard (GitHub Import)
1. Push this repository to GitHub.
2. In Vercel, click **"Add New"** > **"Project"** and select the repository.
3. Vercel automatically detects the Vite framework settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Variables**: None required! The app is fully self-contained.
5. Click **"Deploy"**.

A `vercel.json` file is included in the project root to ensure standard single-page app (SPA) rewrites.

---

## 11. Testing & QA Checklist

The application includes automated and manual test scenarios covering:
- Uploading non-Excel files (`.pdf`, `.csv`) -> Friendly format rejection.
- Spreadsheets with missing required columns -> Explicit missing header notice.
- Spreadsheets with empty trailing rows -> Automatically skipped.
- Invalid or non-numeric currency cells -> Row-level error reporting with Excel row numbers.
- Blank salesperson or month cells -> Caught and flagged.
- Zero budget cells -> Handled defensively without `NaN`/`Infinity`.
- Duplicate salesperson and month entries -> Caught with reference to the original row.
- Page refresh simulation -> Preserved via `sessionStorage`.
- Reset action -> Purges state and cache.

---

## 12. Future Improvements

Given more development time, the following enhancements could be added:
1. **Multi-Currency Support**: Automated conversion between USD, EUR, and local wholesale trading currencies based on the active month.
2. **Export Aggregated Results**: Option to export the summarized performance table and KPI metrics to an Excel or PDF report.
3. **Target Quota Scenarios**: Interactive "What-if" slider allowing sales directors to model the impact of adjusting sales quotas by $\pm 10\%$.
4. **Salesperson Comparison Mode**: Drilldown modal to select two representatives and directly contrast their monthly performance trajectories.
