import type { ClaudeToolDefinition } from './types';

export const PYTHON_TOOLS: ClaudeToolDefinition[] = [
  {
    name: 'execute_custom_python_analysis',
    description: `Execute custom Python code for research analysis (finance, statistics, ML, AI). Access to: numpy, pandas, matplotlib, scipy (stats, optimize), sklearn (full ML toolkit: RandomForest, GBM, SVM, PCA, cross_val_score, train_test_split, metrics, neural_network.MLPClassifier/MLPRegressor), statsmodels (OLS, ARIMA, ANOVA, adfuller), xgboost (xgb), lightgbm (lgb), arch (GARCH), cvxpy, seaborn, plotly, FMP API via fmp object, FRED API via fred object, EODHD via eodhd object, Claude Haiku NLP via claude object, OpenRouter multi-model AI & embeddings via openrouter object (400+ LLMs + semantic analysis), SDC Platinum IPO database via sdc_ipo object (452K IPOs, 1963-2024, DuckDB), and US Housing database via housing object (839K Zillow listings, 50 US states, DuckDB).

📊 METHODOLOGY SUPPORT:
- STATISTICS: scipy.stats (ttest_ind, f_oneway, mannwhitneyu, kruskal, chi2_contingency, shapiro, levene, pearsonr, spearmanr, ks_2samp, normaltest), statsmodels (anova_lm, multipletests, power), pingouin (install if needed)
- MACHINE LEARNING: sklearn (LinearRegression, LogisticRegression, RandomForestRegressor/Classifier, GradientBoostingRegressor/Classifier, SVR/SVC, ElasticNet, PCA, KMeans, DBSCAN, cross_val_score, GridSearchCV, train_test_split, StandardScaler, MinMaxScaler, Pipeline, FeatureUnion, metrics), xgboost, lightgbm
- AI / DEEP LEARNING: sklearn.neural_network (MLPClassifier, MLPRegressor) for tabular data. For PyTorch: call install_python_package('torch') first, then import torch, torch.nn, torch.optim. For custom architectures only.
- ECONOMETRICS: statsmodels (OLS, GLS, IV2SLS, PanelOLS), arch (GARCH, EGARCH), linearmodels (if installed)

🚀 CRITICAL RULE - DO EVERYTHING IN ONE CALL:
NEVER make multiple tool calls to execute_custom_python_analysis. Do EVERYTHING in a SINGLE Python script: data fetching + analysis + figures. Do NOT make separate calls for "fetch data" then "run analysis". That's SLOW!

📊 WRITE HEAVY, DATA-RICH PYTHON SCRIPTS:
Your Python scripts must be COMPREHENSIVE and DATA-INTENSIVE (150-400 lines, not 30-50):
- Fetch 15-20+ years of daily data, not just 2-5 years
- Build PANEL datasets: multiple assets × multiple time periods (e.g. 20-50 stocks × 20 years daily)
- Construct 10-15+ variables: raw + derived (rolling means, volatilities, betas, momentum, skewness, kurtosis)
- Add control variables: size, book-to-market, leverage, turnover, industry dummies
- Use MULTIPLE data sources in one script: EODHD prices + FRED macro + FMP fundamentals
- Run 4-6+ regression specifications: baseline → add controls → add fixed effects → robustness
- Include diagnostic tests: VIF, Breusch-Pagan, Durbin-Watson, Ramsey RESET, Hausman
- Bootstrap confidence intervals (n_boot=1000+) for key estimates
- Sub-sample analysis: pre/post event, by sector, by size quintile, by country
- Generate 8-12 separate figures (NEVER plt.subplots grids)
- Print ALL regression summaries and test statistics — without prints, results section will be empty
- Use store_results() after EVERY regression for structured JSON export

❌ WRONG (SLOW - multiple calls):
Call 1: "Fetch NVDA data" → fmp.get_historical_prices("NVDA")
Call 2: "Run Monte Carlo" → uses the data

✅ CORRECT (FAST - one call does everything):
Single call: Fetch data + Run Monte Carlo + Create figures all in one script

⚠️ NEVER HARDCODE DATA:
NEVER write hardcoded arrays of data (dates, prices, etc.) in your code. ALWAYS fetch data dynamically using fmp API methods like fmp.get_historical_prices(). Writing hardcoded data is SLOW and takes forever to stream to the user. Instead, fetch data with 1-2 lines of API calls.

❌ WRONG (SLOW - takes forever to write):
dates = ['2024-01-01', '2024-01-02', ...] # hundreds of lines
prices = [150.23, 151.45, ...] # takes forever to stream

✅ CORRECT (FAST):
data = fmp.get_historical_prices("AAPL")
df = pd.DataFrame(data["historical"])

🏛️ SDC PLATINUM IPO DATABASE — 452,475 IPOs from 1963–2024 (DuckDB):
The 'sdc_ipo' object is PRE-LOADED. It provides access to the comprehensive SDC Platinum New Issues database covering global IPOs over 60 years.
538 columns: issuer info, financials (assets, revenues, EPS, equity), offer pricing, underpricing returns (1-day to 365-day), fees/gross spread, underwriters/bookrunners, SIC codes, industries, exchanges, nations, SPAC flags, lockup dates, use of proceeds, and more.

Methods:
- sdc_ipo.info() → row count, year range, nation/industry/exchange counts
- sdc_ipo.columns() → all 538 column names
- sdc_ipo.search_columns('keyword') → find columns by keyword (e.g. 'price', 'return', 'fee', 'revenue')
- sdc_ipo.sample(n) → random sample of n rows (key columns)
- sdc_ipo.get(year_start, year_end, nation, exchange, industry, ticker, issuer_name, spac, min_proceeds, max_proceeds, columns, limit) → filtered query
- sdc_ipo.yearly_counts(nation, exchange) → IPO count, avg/total proceeds, avg first-day return by year
- sdc_ipo.describe_column('column_name') → unique value stats and top 20 values
- sdc_ipo.query("SELECT ... FROM sdc_ipo WHERE ...") → arbitrary SQL (DuckDB syntax)

⚠️ SDC IPO DATA RULES:
- ALL columns are VARCHAR — cast numeric columns with TRY_CAST(col AS DOUBLE) or pd.to_numeric(df['col'], errors='coerce')
- Date columns are strings — parse with pd.to_datetime(df['col'], errors='coerce')
- Use sdc_ipo.search_columns() to discover column names before writing queries
- For econometric analysis, always clean data: drop nulls, cast types, handle missing values
- Key return columns: percent_change_offer_price_to_closing_price_at_offerfirst_trade (first-day return), percent_change_offer_price_to_price_1_day_after_offer, ..._1_week_..., ..._4_weeks_..., ..._180_days_..., ..._365_days_...
- Key financial columns: financials_total_assets_before_offering_usd_millions, financials_total_revenues_before_offering_usd_millions, financials_net_income_after_taxes_before_offering_usd_millions
- Proceeds: proceeds_amount_all_markets_usd_millions
- SPAC filter: blank_check_spac_involvement_yn = 'Y' or 'N'

Example — IPO underpricing analysis:
df = sdc_ipo.get(year_start=2000, year_end=2023, nation='United States', min_proceeds=50)
df['first_day_return'] = pd.to_numeric(df['percent_change_offer_price_to_closing_price_at_offerfirst_trade'], errors='coerce')
df['proceeds'] = pd.to_numeric(df['proceeds_amount_all_markets_usd_millions'], errors='coerce')
df['year'] = df['dates_offer_year_ccyy'].astype(int)
df = df.dropna(subset=['first_day_return'])

Example — custom SQL:
hot_cold = sdc_ipo.query("""
    SELECT dates_offer_year_ccyy AS year, COUNT(*) AS n_ipos,
           AVG(TRY_CAST(percent_change_offer_price_to_closing_price_at_offerfirst_trade AS DOUBLE)) AS avg_underpricing
    FROM sdc_ipo
    WHERE issuerborrower_nation ILIKE '%United States%' AND dates_offer_year_ccyy >= '1980'
    GROUP BY 1 ORDER BY 1
""")

🏠 US HOUSING DATABASE — 839,313 Zillow property listings across 50 US states (DuckDB):
The 'housing' object is PRE-LOADED. It provides access to a comprehensive US residential real estate database.
5 tables: properties (116 cols, 839K rows), price_history (476K rows), tax_history (391K rows), schools (163K rows), meta_columns.
Columns include: price, zestimate, rent_zestimate, bedrooms, bathrooms, living_area_sqft, lot_size_sqft, year_built, home_type, address (street/city/state/zip), latitude/longitude, tax_assessed_value, property_tax_rate, walk_score, bike_score, transit_score, flood/fire/heat/wind/air risk factors, HOA fees, construction materials, school ratings, zip-level aggregates, and many derived features (price_per_sqft, gross_rent_yield, climate_risk_composite, luxury_score, etc.).

Methods:
- housing.info() → row counts, state coverage, price stats, home type distribution
- housing.tables() → list all 5 tables
- housing.columns(table='properties') → all column names and types
- housing.search_columns('price') → find columns matching keyword
- housing.describe_column('home_type') → unique values and counts
- housing.sample(n) → random sample of n properties (key columns)
- housing.get(state, city, zipcode, home_type, home_status, min_price, max_price, min_sqft, max_sqft, min_bedrooms, max_bedrooms, min_year_built, max_year_built, columns, limit) → filtered query
- housing.price_history(zpid) → price history for a specific property
- housing.tax_history(zpid) → tax assessment history for a property
- housing.schools(zpid) → nearby schools for a property
- housing.query("SELECT ... FROM properties WHERE ...") → arbitrary SQL (DuckDB syntax)

USE housing WHEN: hedonic pricing models, housing market analysis, property valuation, spatial econometrics, real estate investment analysis, climate risk & property values, school quality capitalization, tax assessment studies, urban economics research.

Example — hedonic pricing model:
df = housing.get(state='FL', min_price=100000, max_price=2000000, home_type='SINGLE_FAMILY', limit=50000)
df = df.dropna(subset=['price', 'living_area_sqft', 'bedrooms', 'bathrooms', 'year_built'])
import numpy as np
df['log_price'] = np.log(df['price'])
df['log_sqft'] = np.log(df['living_area_sqft'])
df['property_age'] = 2025 - df['year_built']

Example — spatial price analysis:
avg_by_zip = housing.query("""
    SELECT address_zipcode, address_city, COUNT(*) as n,
           AVG(price) as avg_price, AVG(price_per_sqft) as avg_ppsf,
           AVG(living_area_sqft) as avg_sqft, AVG(year_built) as avg_year
    FROM properties
    WHERE address_state = 'CA' AND price IS NOT NULL
    GROUP BY 1, 2 HAVING COUNT(*) >= 10
    ORDER BY avg_price DESC
""")

📈 FRED API (Federal Reserve Economic Data) — 840,000+ macroeconomic series:
The 'fred' object is PRE-LOADED in the global scope (like fmp). Do NOT import fredapi or any external FRED library!
Recommended: fred.get_series_df(series_id) → DataFrame with columns 'date' (datetime) and 'value' (float). Missing FRED values (".") are already converted to NaN.
Other: fred.get_series(id) metadata, fred.search_series(text) keyword search, fred.get_category(id), fred.get_releases().
Popular IDs: GDP, CPIAUCSL, UNRATE, DFF, DGS10, DGS2, T10Y2Y, FEDFUNDS, M2SL, UMCSENT, VIXCLS, DEXUSEU, DCOILWTICO, SP500.

⚠️ FRED DATA RULES:
- ALWAYS call .dropna() after get_series_df() before any analysis: df = fred.get_series_df('GDP').dropna()
- When merging multiple FRED series, use pd.merge(..., on='date', how='inner') to avoid NaN rows
- ALWAYS check len(df) > 0 before using .iloc[-1] or .iloc[0] — some series may have gaps
- Different series have different frequencies (daily, monthly, quarterly) — use the frequency= param to align them
- To rename the 'value' column: df = df.rename(columns={'value': 'gdp'})

❌ WRONG (will crash on empty DataFrame):
m2 = fred.get_series_df('M2SL')
latest = m2.iloc[-1]  # IndexError if empty!

✅ CORRECT FRED pattern:
m2 = fred.get_series_df('M2SL', observation_start='2000-01-01').dropna()
cpi = fred.get_series_df('CPIAUCSL', observation_start='2000-01-01').dropna()
m2 = m2.rename(columns={'value': 'm2'})
cpi = cpi.rename(columns={'value': 'cpi'})
# Merge on date (inner join keeps only matching dates)
df = pd.merge(m2, cpi, on='date', how='inner')
print(f"M2 latest: {df['m2'].iloc[-1]:,.0f}" if len(df) > 0 else "No data")

plt.figure(figsize=(12,6))
plt.plot(df['date'], df['m2'])
plt.title('US M2 Money Supply')
plt.tight_layout()

📊 FIGURE CREATION RULES - ALWAYS CREATE SEPARATE FIGURES:
NEVER use plt.subplots() with multiple rows/columns (like 2x2, 3x1, 4x4 grids).
ALWAYS create INDIVIDUAL SEPARATE figures using plt.figure() for each visualization.
This allows each figure to be displayed and commented individually in the response.

❌ WRONG (combined figures - hard to comment individually):
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes[0,0].plot(...)
axes[0,1].hist(...)
axes[1,0].plot(...)
axes[1,1].scatter(...)

✅ CORRECT (separate figures - each can be commented):
plt.figure(figsize=(12, 6))
plt.plot(df["date"], df["close"])
plt.title("Price Evolution")
plt.tight_layout()

plt.figure(figsize=(12, 6))
plt.hist(df["returns"], bins=50, alpha=0.7)
plt.title("Return Distribution")
plt.tight_layout()

plt.figure(figsize=(12, 6))
plt.plot(df["date"], df["volume"], color="green")
plt.title("Volume Analysis")
plt.tight_layout()

🎨 FIGURE STYLE — JOURNAL OF FINANCE (AUTOMATIC):
ALL figures are automatically rendered in Journal of Finance / academic publication style:
- Serif fonts matching the LaTeX paper (DejaVu Serif / Times)
- Muted academic color palette (deep navy, crimson, forest green, etc.) — pre-set in rcParams
- No top/right spines, inward ticks, subtle grid
- 300 dpi output, tight bbox
- Pre-loaded color palette: JF_COLORS = ['#2C3E6B', '#8B1A1A', '#2E6B4F', '#6B4C2C', '#4C2C6B', '#1A5C6B', '#6B6B1A', '#3D3D3D']

You do NOT need to set any rcParams manually — the style is applied globally.
Just write clean matplotlib code and it will automatically look publication-ready.

📊 MANDATORY: PRINT ALL REGRESSION/TEST RESULTS:
Every Fisher script MUST print() all numerical results. The printed output is how you (Euler) get the numbers to build LaTeX regression tables in the results section.
- After EVERY regression: print(model.summary()) or print(model.summary().as_text())
- After EVERY statistical test: print(f"Test_name: stat={val:.4f}, p-value={pval:.4f}")
- Descriptive stats: print(df.describe().to_string())
- For each coefficient: print(f"{var}: coef={c:.6f}, se={se:.6f}, t={t:.3f}, p={p:.4f}")
- Summary table: print a formatted comparison across all model specifications
Without these prints, the results section will lack specific numbers and be REJECTED.

Additionally, call store_results() after each regression to export STRUCTURED data:
  store_results("Model Name", model_obj)  # Auto-extracts coefficients, SEs, t-stats, p-values, R², N
  store_results("Test Name", statistic=val, p_value=pval)  # For diagnostic tests
The structured JSON output ensures you have EXACT numbers for LaTeX table construction.

When styling specific elements, use JF_COLORS directly:
plt.bar(x, y, color=JF_COLORS[0])         # navy bars
plt.plot(x, y1, color=JF_COLORS[0])       # navy line
plt.plot(x, y2, color=JF_COLORS[1])       # crimson line
plt.scatter(x, y, color=JF_COLORS[2])     # green scatter

For axis formatting (already available as mticker):
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f'{x:.1%}'))        # percentages
ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: '$' + f'{x:,.0f}')) # dollars

📥 EXCEL FILE GENERATION:
save_excel() generates professionally styled Excel files with title row, teal headers, zebra striping, auto-column-width, freeze panes, auto number formatting, REAL Excel formulas (SUM, AVERAGE, MIN, MAX, COUNT), and conditional formatting.

Every Excel file automatically includes:
- Professional title row (merged, teal 14pt bold) + generated date subtitle
- Summary formulas at the bottom of each numeric column (SUM, AVERAGE, MIN, MAX, COUNT) — these are REAL Excel formulas, not static values
- Conditional formatting: green/red color scales for return columns, teal data bars for volume columns, teal gradients for price/value columns
- Freeze panes on the first data row (A5)

Single sheet:
save_excel(df, "AAPL_prices.xlsx")

Multi-sheet workbook (PREFERRED when you have multiple DataFrames):
save_excel({
    "Summary": summary_df,
    "Details": details_df,
    "Raw Data": raw_df
}, "full_report.xlsx")

Custom title:
save_excel(df, "report.xlsx", title="Revenue Analysis Q4 2025")

Calculated formula columns (PREFERRED over pre-calculating values in Python):
save_excel(df, "report.xlsx", formulas=[
    {"col": "Margin", "formula": "=D{row}/B{row}", "format": "0.00%"},
    {"col": "Total", "formula": "=B{row}+C{row}", "format": "#,##0.00"}
])
{row} is replaced by the actual Excel row number. The user sees the formula logic in the formula bar.

Opt-out of auto features:
save_excel(df, "report.xlsx", summary=False, conditional_formatting=False)
save_excel(df, "report.xlsx", summary=['sum', 'average'])  # Only selected stats

⚠️ ALWAYS use multi-sheet format when you have multiple DataFrames — do NOT call save_excel() multiple times to create separate files. One workbook with multiple sheets is cleaner and more professional.
⚠️ PREFER using formulas= for calculated columns instead of computing values in Python — this lets the user see and modify the calculation logic directly in Excel.

📝 WORD DOCUMENT GENERATION:
save_word() generates branded AutoScholar Word documents (.docx) with professional styling.

From markdown string:
save_word("# Portfolio Analysis\\n\\n## Summary\\n\\nThe portfolio returned **12.5%**...\\n\\n- Strong performance in tech\\n- Underweight in energy", "portfolio_report.docx")

From structured dict (for including tables):
save_word({
    "title": "Portfolio Analysis",
    "sections": [
        {"heading": "Performance Summary", "body": "The portfolio returned **12.5%** annualized."},
        {"heading": "Holdings", "table": holdings_df},
        {"heading": "Risk Metrics", "body": "VaR (95%): -2.3%\\nMax Drawdown: -15.2%", "table": risk_df}
    ]
}, "portfolio_report.docx")

📄 LATEX PDF REPORT GENERATION:
save_latex() compiles LaTeX to a professional PDF using pdflatex. The PDF includes a branded AutoScholar title page, table of contents, and professional formatting.

Basic usage (body wrapped in AutoScholar template):
save_latex(r"""
\\section{Executive Summary}
Strong performance driven by tech sector allocation.

\\section{Price Analysis}
{{FIG:0}}
The chart above shows the price evolution.

\\section{Key Statistics}
""" + df_to_latex(summary_df, caption="Summary Statistics") + r"""

\\section{Conclusion}
Positive outlook based on fundamental analysis.
""", "AAPL_Analysis.pdf")

Figure embedding: create matplotlib figures first, then use {{FIG:0}}, {{FIG:1}}, etc. placeholders. Figures are saved at 300dpi for print quality. figures='auto' (default) captures all open figures; figures='none' skips figure embedding.

df_to_latex(df, caption="Title", label="tab:summary") converts a DataFrame to a professional booktabs table with teal headers and zebra striping.

Raw LaTeX mode: if the content starts with \\documentclass, it is compiled as-is (no template wrapping). Use this for fully custom documents.

Template options: template='financial' (default) includes title page, TOC, fancyhdr, tcolorbox callouts; template='minimal' is a clean document with just geometry and basic packages.

Branding parameters (optional):
- author="Name" — adds "Prepared by Name" on the title page and sets PDF metadata
- company="Company" — replaces "AutoScholar" in the title page heading and page headers
- logo="https://..." — fetches a PNG/JPG logo image and places it above the company name on the title page (graceful fallback if URL fails)
- title="Custom Title" — sets the subtitle on the title page (default: "Financial Intelligence Report")
Example: save_latex(content, "report.pdf", author="Marie Dupont", company="Desjardins", logo="https://logo.clearbit.com/desjardins.com", title="Apple Financial Analysis")

Available LaTeX environments in the financial template:
- \\begin{keyinsight}...\\end{keyinsight} — teal callout box for key findings
- \\begin{warningbox}...\\end{warningbox} — red callout box for warnings/risks
- \\begin{summarybox}[Title]...\\end{summarybox} — teal-tinted summary box (default title: "Executive Summary")
- Standard \\section, \\subsection, \\subsubsection with sans-serif teal styling and underline rules
- amsmath for equations, booktabs for tables, float for [H] placement
- Professional typography: Times body (newtxtext), Source Sans Pro headings, microtype kerning, 1.15x line spacing, "Page X / Y" footer

The download links for Excel, Word, and LaTeX PDF files will be automatically included in the tool result.

📦 DATA PROVENANCE HELPERS (for reproducibility):
These helpers automatically save data with provenance metadata for the reproducibility ZIP.

save_raw_data(df, filename, source, method, agent=None, description=None)
  — Saves a DataFrame to the raw data directory with provenance metadata JSON sidecar
  — method: "api" (for API calls) or "web" (for scraped/web data)
  — Use in TURING scripts for every dataset collected
  — Examples:
    save_raw_data(prices_df, "stock_prices.csv", source="EODHD API", method="api")
    save_raw_data(macro_df, "gdp_data.csv", source="FRED DGS10", method="api")
    save_raw_data(esg_df, "esg_scores.csv", source="https://example.com/esg", method="web")

save_processed_data(df, filename, source_files=None, transformation=None, agent=None)
  — Saves cleaned/merged data to processed directory with lineage metadata
  — Also creates a Parquet copy automatically alongside CSV
  — Use in NEWTON scripts after cleaning/merging
  — Examples:
    save_processed_data(panel_df, "final_dataset.csv",
        source_files=["stock_prices.csv", "gdp_data.csv"],
        transformation="merged on date, winsorized at 1%/99%, log-transformed prices")

save_metadata(metadata_dict, filename)
  — Save arbitrary metadata JSON (e.g. pipeline config, variable descriptions)
  — Example: save_metadata({"variables": {...}, "sample_period": "2000-2024"}, "data_dictionary.json")

DISPLAYING FIGURES - CRITICAL:
When your code creates matplotlib figures, they are saved as PNG files and you will receive markdown image references in the tool result output.

⚠️ YOU MUST INCLUDE EVERY ![Figure X](url) IMAGE IN YOUR RESPONSE!
Do NOT skip or omit the figure references - they MUST appear in your markdown response.

For each figure, include it with your analysis like this:

"Voici l'évolution des prix:

![Figure 1](/figures/fig-12345-0.png)

Le graphique montre une tendance haussière sur la période...

Analysons maintenant la distribution des rendements:

![Figure 2](/figures/fig-12345-1.png)

La distribution présente une légère asymétrie..."`,
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code. ⚠️ NEVER HARDCODE DATA ARRAYS! Always fetch with fmp or fred APIs. CRITICAL: fmp.get_historical_prices() returns dict with "historical" key! ALWAYS use: df = pd.DataFrame(data["historical"]). Convert dates: df["date"] = pd.to_datetime(df["date"]). Always .dropna(). ⚠️ ALWAYS CREATE SEPARATE FIGURES with plt.figure() - NEVER use plt.subplots(2,2) or grids!\n⚠️ FRED: the fred object is PRE-LOADED — NEVER import fredapi! Use fred.get_series_df(id).dropna() and ALWAYS check len(df) > 0 before .iloc[-1].\nCORRECT PATTERN:\n```python\n# ✅ FMP data:\ndata = fmp.get_historical_prices("AAPL")\ndf = pd.DataFrame(data["historical"])  # ← MUST use ["historical"]\ndf["date"] = pd.to_datetime(df["date"])\ndf = df.sort_values("date").dropna()\n\n# ✅ FRED data (pre-loaded, NO import needed):\ngdp = fred.get_series_df("GDP", observation_start="2000-01-01").dropna()\ncpi = fred.get_series_df("CPIAUCSL", observation_start="2000-01-01").dropna()\ngdp = gdp.rename(columns={"value": "gdp"})\ncpi = cpi.rename(columns={"value": "cpi"})\ndf = pd.merge(gdp, cpi, on="date", how="inner")\n\nplt.figure(figsize=(12,6))\nplt.plot(df["date"], df["gdp"])\nplt.title("US GDP")\nplt.tight_layout()\n```\n❌ WRONG: plt.subplots(2,2) or dates = [\'2024-01-01\', ...] or import fredapi\nLIBS: np, pd, plt, sns, scipy, sklearn, statsmodels, ta, cvxpy, numba, networkx, sympy, arch, fmp, fred, sdc_ipo, housing\n\n📊 SDC IPO (pre-loaded): sdc_ipo.get(year_start=2000, nation=\'United States\'), sdc_ipo.query("SQL"), sdc_ipo.yearly_counts(), sdc_ipo.search_columns(\'keyword\'), sdc_ipo.columns(). ALL columns are VARCHAR — use TRY_CAST or pd.to_numeric().\n🏠 US Housing (pre-loaded): housing.get(state=\'FL\', min_price=200000), housing.query("SQL"), housing.search_columns(\'price\'), housing.columns(). 839K Zillow listings, 116 columns. Ideal for hedonic models.',
        },
        description: {
          type: 'string',
          description: 'Brief description of what this analysis does (shown to user, e.g., "Custom correlation analysis between tech stocks")',
        },
        context: {
          type: 'object',
          description: 'Optional context variables to inject into the Python environment as global variables. Example: {"symbols": ["AAPL", "MSFT"], "threshold": 0.5}',
        },
      },
      required: ['code'],
    },
  },
  // ==================== INCREMENTAL REPAIR TOOLS ====================
  {
    name: 'read_python_script',
    description: 'Read the content of a previously saved Python script by its script ID. Use this after a failed execution to inspect the code before generating a patch.',
    input_schema: {
      type: 'object',
      properties: {
        script_id: {
          type: 'string',
          description: 'The script ID returned by execute_custom_python_analysis (e.g., "script-1709312345-abc123").',
        },
      },
      required: ['script_id'],
    },
  },
  {
    name: 'apply_patch',
    description: `Apply a patch to an existing Python script. Supports TWO formats — use whichever is easier:

FORMAT 1 — SEARCH/REPLACE (RECOMMENDED — most reliable):
<<<< SEARCH
old code to find
====
new replacement code
>>>> REPLACE

FORMAT 2 — Unified diff (standard):
@@ -<old_start>,<old_count> +<new_start>,<new_count> @@
 context line
-removed line
+added line

PREFER FORMAT 1 (search/replace) — it doesn't need line numbers and handles whitespace changes better.
You can include multiple <<<< SEARCH ... >>>> REPLACE blocks in one patch.

RULES:
- Read the script first with read_python_script
- Generate the SMALLEST possible patch
- Never rewrite >40% of the file — use execute_custom_python_analysis for full rewrites
- Max 5 repair attempts per script

EXAMPLE (search/replace — fixing a KeyError):
<<<< SEARCH
returns = df["return"].pct_change()
====
returns = df["close"].pct_change()
>>>> REPLACE

EXAMPLE (search/replace — adding an import):
<<<< SEARCH
import pandas as pd
import numpy as np
====
import pandas as pd
import numpy as np
import scipy.stats as stats
>>>> REPLACE

EXAMPLE (unified diff):
@@ -1,3 +1,4 @@
 import pandas as pd
 import numpy as np
+import scipy.stats as stats`,
    input_schema: {
      type: 'object',
      properties: {
        script_id: {
          type: 'string',
          description: 'The script ID to patch.',
        },
        diff: {
          type: 'string',
          description: 'Patch content. Use <<<< SEARCH / ==== / >>>> REPLACE blocks (recommended) or unified diff @@ format.',
        },
      },
      required: ['script_id', 'diff'],
    },
  },
  {
    name: 'run_python_script',
    description: 'Re-run a previously saved (and optionally patched) Python script by its script ID. Use this after applying a patch to verify the fix works.',
    input_schema: {
      type: 'object',
      properties: {
        script_id: {
          type: 'string',
          description: 'The script ID to execute.',
        },
      },
      required: ['script_id'],
    },
  },
  {
    name: 'inspect_python_logs',
    description: 'Get the structured error logs from the most recent execution of a Python script. Returns JSON with error_type, file, line, message, and traceback.',
    input_schema: {
      type: 'object',
      properties: {
        script_id: {
          type: 'string',
          description: 'The script ID to inspect logs for.',
        },
      },
      required: ['script_id'],
    },
  },
];
