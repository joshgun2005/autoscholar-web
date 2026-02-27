#!/usr/bin/env python3
"""
Generic Python Executor with FMP API Access
Allows Claude to write custom Python code with direct access to FMP endpoints
"""

import sys
import json
import io
import base64
import traceback
import os
import re
import time
import tempfile
from contextlib import redirect_stdout, redirect_stderr
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')  # Suppress warnings for cleaner output

# Create a comprehensive FMP API client class
class FMPClient:
    """Comprehensive FMP API client for Python custom code"""

    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://financialmodelingprep.com/api/v3'
        self.base_url_stable = 'https://financialmodelingprep.com/stable'

    def _request(self, endpoint, params=None):
        """Make API request"""
        import requests
        if params is None:
            params = {}
        params['apikey'] = self.api_key

        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    def _request_stable(self, endpoint, params=None):
        """Make API request to stable endpoint"""
        import requests
        if params is None:
            params = {}
        params['apikey'] = self.api_key

        url = f"{self.base_url_stable}{endpoint}"
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    # ===== MOST USED METHODS =====

    def get_quote(self, symbol):
        """Get current stock quote"""
        data = self._request(f'/quote/{symbol}')
        return data[0] if data else None

    def get_historical_prices(self, symbol, from_date=None, to_date=None):
        """Get historical prices - returns dict with 'historical' array"""
        params = {}
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        return self._request(f'/historical-price-full/{symbol}', params)

    def get_income_statement(self, symbol, period='annual', limit=5):
        """Get income statement"""
        return self._request(f'/income-statement/{symbol}', {'period': period, 'limit': limit})

    def get_balance_sheet(self, symbol, period='annual', limit=5):
        """Get balance sheet"""
        return self._request(f'/balance-sheet-statement/{symbol}', {'period': period, 'limit': limit})

    def get_cash_flow(self, symbol, period='annual', limit=5):
        """Get cash flow statement"""
        return self._request(f'/cash-flow-statement/{symbol}', {'period': period, 'limit': limit})

    def get_key_metrics(self, symbol, period='annual', limit=5):
        """Get key metrics"""
        return self._request(f'/key-metrics/{symbol}', {'period': period, 'limit': limit})

    def get_financial_ratios(self, symbol, period='annual', limit=5):
        """Get financial ratios"""
        return self._request(f'/ratios/{symbol}', {'period': period, 'limit': limit})

    def get_company_profile(self, symbol):
        """Get company profile"""
        return self._request(f'/profile/{symbol}')

    def get_stock_news(self, symbol, limit=20):
        """Get stock news"""
        return self._request(f'/stock_news', {'tickers': symbol, 'limit': limit})

    def get_rsi(self, symbol, period=14, time_period='daily'):
        """Get RSI indicator"""
        data = self._request(f'/technical_indicator/{time_period}/{symbol}', {'type': 'rsi', 'period': period})
        return data[:10]  # Limit for performance

    def get_macd(self, symbol, time_period='daily'):
        """Get MACD indicator"""
        data = self._request(f'/technical_indicator/{time_period}/{symbol}', {'type': 'macd'})
        return data[:10]

    def search(self, query, limit=10):
        """Search for companies"""
        return self._request('/search', {'query': query, 'limit': limit})

# Import additional libraries (optional - fail silently if not available)
AVAILABLE_LIBS = {}

try:
    import seaborn as sns
    AVAILABLE_LIBS['sns'] = sns
    AVAILABLE_LIBS['seaborn'] = sns
except ImportError:
    pass

try:
    import plotly.graph_objects as go
    import plotly.express as px
    AVAILABLE_LIBS['go'] = go
    AVAILABLE_LIBS['px'] = px
except ImportError:
    pass

try:
    from scipy import stats, optimize, signal
    AVAILABLE_LIBS['stats'] = stats
    AVAILABLE_LIBS['optimize'] = optimize
    AVAILABLE_LIBS['signal'] = signal
except ImportError:
    pass

try:
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.decomposition import PCA
    AVAILABLE_LIBS['LinearRegression'] = LinearRegression
    AVAILABLE_LIBS['StandardScaler'] = StandardScaler
    AVAILABLE_LIBS['PCA'] = PCA
except ImportError:
    pass

try:
    import ta  # Technical analysis library
    AVAILABLE_LIBS['ta'] = ta
except ImportError:
    pass

try:
    import yfinance as yf
    AVAILABLE_LIBS['yf'] = yf
except ImportError:
    pass

try:
    from statsmodels.tsa.stattools import adfuller, acf, pacf
    from statsmodels.tsa.arima.model import ARIMA
    AVAILABLE_LIBS['adfuller'] = adfuller
    AVAILABLE_LIBS['acf'] = acf
    AVAILABLE_LIBS['pacf'] = pacf
    AVAILABLE_LIBS['ARIMA'] = ARIMA
except ImportError:
    pass

try:
    import cvxpy as cp
    AVAILABLE_LIBS['cp'] = cp
    AVAILABLE_LIBS['cvxpy'] = cp
except ImportError:
    pass

# === ARCH / GARCH Models ===
try:
    from arch import arch_model
    from arch.__future__ import reindexing
    AVAILABLE_LIBS['arch_model'] = arch_model
except ImportError:
    pass

# === Numba (JIT compilation) ===
try:
    import numba
    from numba import jit, njit, prange
    AVAILABLE_LIBS['numba'] = numba
    AVAILABLE_LIBS['jit'] = jit
    AVAILABLE_LIBS['njit'] = njit
    AVAILABLE_LIBS['prange'] = prange
except ImportError:
    pass

# === NetworkX (Graph analysis) ===
try:
    import networkx as nx
    AVAILABLE_LIBS['nx'] = nx
    AVAILABLE_LIBS['networkx'] = nx
except ImportError:
    pass

# === SymPy (Symbolic math) ===
try:
    import sympy
    AVAILABLE_LIBS['sympy'] = sympy
except ImportError:
    pass

# === XGBoost ===
try:
    import xgboost as xgb
    AVAILABLE_LIBS['xgb'] = xgb
    AVAILABLE_LIBS['xgboost'] = xgb
except ImportError:
    pass

# === LightGBM ===
try:
    import lightgbm as lgb
    AVAILABLE_LIBS['lgb'] = lgb
    AVAILABLE_LIBS['lightgbm'] = lgb
except ImportError:
    pass

# === PyPortfolioOpt (Portfolio optimization) ===
try:
    from pypfopt import EfficientFrontier, risk_models, expected_returns, HRPOpt, BlackLittermanModel
    from pypfopt.discrete_allocation import DiscreteAllocation
    AVAILABLE_LIBS['EfficientFrontier'] = EfficientFrontier
    AVAILABLE_LIBS['risk_models'] = risk_models
    AVAILABLE_LIBS['expected_returns'] = expected_returns
    AVAILABLE_LIBS['HRPOpt'] = HRPOpt
    AVAILABLE_LIBS['BlackLittermanModel'] = BlackLittermanModel
    AVAILABLE_LIBS['DiscreteAllocation'] = DiscreteAllocation
except ImportError:
    pass

# === Riskfolio-lib (Advanced portfolio optimization) ===
try:
    import riskfolio as rp
    AVAILABLE_LIBS['rp'] = rp
    AVAILABLE_LIBS['riskfolio'] = rp
except ImportError:
    pass

# === Prophet (Time series forecasting) ===
try:
    from prophet import Prophet
    AVAILABLE_LIBS['Prophet'] = Prophet
except ImportError:
    pass

# === pmdarima (Auto ARIMA) ===
try:
    import pmdarima as pm
    from pmdarima import auto_arima
    AVAILABLE_LIBS['pm'] = pm
    AVAILABLE_LIBS['pmdarima'] = pm
    AVAILABLE_LIBS['auto_arima'] = auto_arima
except ImportError:
    pass

# === Polars (Fast DataFrames) ===
try:
    import polars as pl
    AVAILABLE_LIBS['pl'] = pl
    AVAILABLE_LIBS['polars'] = pl
except ImportError:
    pass

# === mplfinance (Financial charts) ===
try:
    import mplfinance as mpf
    AVAILABLE_LIBS['mpf'] = mpf
    AVAILABLE_LIBS['mplfinance'] = mpf
except ImportError:
    pass

# === VectorBT (Backtesting) ===
try:
    import vectorbt as vbt
    AVAILABLE_LIBS['vbt'] = vbt
    AVAILABLE_LIBS['vectorbt'] = vbt
except ImportError:
    pass

# === HMMLearn (Hidden Markov Models) ===
try:
    from hmmlearn import hmm
    AVAILABLE_LIBS['hmm'] = hmm
    AVAILABLE_LIBS['hmmlearn'] = hmm
except ImportError:
    pass

# === Additional sklearn modules ===
try:
    from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
    from sklearn.cluster import KMeans, DBSCAN
    from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
    from sklearn.metrics import mean_squared_error, accuracy_score, r2_score
    AVAILABLE_LIBS['RandomForestRegressor'] = RandomForestRegressor
    AVAILABLE_LIBS['RandomForestClassifier'] = RandomForestClassifier
    AVAILABLE_LIBS['GradientBoostingRegressor'] = GradientBoostingRegressor
    AVAILABLE_LIBS['KMeans'] = KMeans
    AVAILABLE_LIBS['DBSCAN'] = DBSCAN
    AVAILABLE_LIBS['train_test_split'] = train_test_split
    AVAILABLE_LIBS['cross_val_score'] = cross_val_score
    AVAILABLE_LIBS['GridSearchCV'] = GridSearchCV
    AVAILABLE_LIBS['mean_squared_error'] = mean_squared_error
    AVAILABLE_LIBS['accuracy_score'] = accuracy_score
    AVAILABLE_LIBS['r2_score'] = r2_score
except ImportError:
    pass

# === Additional scipy modules ===
try:
    from scipy.interpolate import interp1d, griddata, CubicSpline
    from scipy.integrate import quad, odeint
    from scipy.fft import fft, ifft
    AVAILABLE_LIBS['interp1d'] = interp1d
    AVAILABLE_LIBS['griddata'] = griddata
    AVAILABLE_LIBS['CubicSpline'] = CubicSpline
    AVAILABLE_LIBS['quad'] = quad
    AVAILABLE_LIBS['odeint'] = odeint
    AVAILABLE_LIBS['fft'] = fft
    AVAILABLE_LIBS['ifft'] = ifft
except ImportError:
    pass

# === Additional statsmodels ===
try:
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from statsmodels.tsa.vector_ar.var_model import VAR
    from statsmodels.regression.rolling import RollingOLS
    AVAILABLE_LIBS['seasonal_decompose'] = seasonal_decompose
    AVAILABLE_LIBS['ExponentialSmoothing'] = ExponentialSmoothing
    AVAILABLE_LIBS['VAR'] = VAR
    AVAILABLE_LIBS['RollingOLS'] = RollingOLS
except ImportError:
    pass

# === python-docx (Word documents) ===
try:
    from docx import Document as DocxDocument
    from docx.shared import Pt, RGBColor, Inches, Cm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT
    AVAILABLE_LIBS['DocxDocument'] = DocxDocument
except ImportError:
    pass


class CustomPythonExecutor:
    """Executor for custom Python code with FMP API access"""

    def __init__(self, fmp_api_key=None):
        self.fmp_api_key = fmp_api_key or os.getenv('FMP_API_KEY')
        self.fmp = FMPClient(self.fmp_api_key) if FMPClient and self.fmp_api_key else None
        self.output_text = []
        self.figures = []
        self.files = []

    def execute(self, code: str, context: dict = None) -> dict:
        """
        Execute custom Python code with access to FMP API

        Args:
            code: Python code to execute
            context: Optional context variables to inject

        Returns:
            dict with:
                - success: bool
                - output: str (printed output)
                - result: any (return value if function defined)
                - figures: list of base64 encoded images
                - error: str (if failed)
        """
        try:
            # Prepare safe execution environment with all available libraries

            def _convert_numpy(val):
                """Convert numpy types to Python native types for openpyxl compatibility"""
                if val is None or (hasattr(val, '__class__') and val.__class__.__name__ in ('NaT', 'NaTType')):
                    return None
                if hasattr(np, 'integer') and isinstance(val, np.integer):
                    return int(val)
                if hasattr(np, 'floating') and isinstance(val, np.floating):
                    if np.isnan(val) or np.isinf(val):
                        return None
                    return float(val)
                if hasattr(np, 'bool_') and isinstance(val, np.bool_):
                    return bool(val)
                if hasattr(np, 'ndarray') and isinstance(val, np.ndarray):
                    return val.tolist()
                if isinstance(val, pd.Timestamp):
                    return val.to_pydatetime()
                if hasattr(val, 'item'):
                    return val.item()
                return val

            def _detect_number_format(col_name):
                """Auto-detect number format based on column name"""
                col_lower = str(col_name).lower()
                pct_keywords = ['pct', 'percent', 'return', 'margin', 'yield', 'rate', 'ratio',
                                'growth', 'change', 'weight', 'allocation', 'drawdown', 'sharpe',
                                'sortino', 'alpha', 'beta', 'volatility', 'vol']
                if any(kw in col_lower for kw in pct_keywords):
                    return '0.00%'
                price_keywords = ['price', 'close', 'open', 'high', 'low', 'adj', 'value',
                                  'revenue', 'income', 'profit', 'cost', 'expense', 'ebitda',
                                  'earnings', 'sales', 'assets', 'liabilities', 'equity',
                                  'market_cap', 'marketcap', 'nav', 'amount']
                if any(kw in col_lower for kw in price_keywords):
                    return '#,##0.00'
                vol_keywords = ['volume', 'shares', 'count', 'qty', 'quantity']
                if any(kw in col_lower for kw in vol_keywords):
                    return '#,##0'
                return None

            def save_excel(data, filename='analysis.xlsx', sheet_name='Sheet1', index=False):
                """Save DataFrame(s) as a professionally styled Excel file.

                Args:
                    data: DataFrame for single sheet, or dict {sheet_name: DataFrame} for multi-sheet
                    filename: Output filename (.xlsx)
                    sheet_name: Sheet name (only used if data is a single DataFrame)
                    index: Whether to include the DataFrame index
                """
                from openpyxl import Workbook
                from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
                from openpyxl.utils import get_column_letter

                if not filename.endswith('.xlsx'):
                    filename += '.xlsx'
                safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
                filepath = os.path.join(tempfile.gettempdir(), f'vq_{int(time.time())}_{safe_name}')

                # Normalize input to dict of DataFrames
                if isinstance(data, pd.DataFrame):
                    sheets = {sheet_name: data}
                elif isinstance(data, dict):
                    sheets = data
                else:
                    raise ValueError("save_excel expects a DataFrame or dict of DataFrames")

                wb = Workbook()
                first = True

                # Styles
                header_fill = PatternFill(start_color='119993', end_color='119993', fill_type='solid')
                header_font = Font(bold=True, color='FFFFFF', size=11, name='Calibri')
                header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
                thin_border = Border(
                    left=Side(style='thin', color='D0D0D0'),
                    right=Side(style='thin', color='D0D0D0'),
                    top=Side(style='thin', color='D0D0D0'),
                    bottom=Side(style='thin', color='D0D0D0'),
                )
                even_fill = PatternFill(start_color='F2F9F9', end_color='F2F9F9', fill_type='solid')
                data_font = Font(size=10, name='Calibri')
                data_alignment = Alignment(vertical='center')

                for sname, df in sheets.items():
                    if not isinstance(df, pd.DataFrame):
                        continue
                    if first:
                        ws = wb.active
                        ws.title = sname[:31]
                        first = False
                    else:
                        ws = wb.create_sheet(title=sname[:31])

                    # Optionally reset index
                    if index and df.index.name:
                        df = df.reset_index()

                    cols = list(df.columns)
                    num_formats = [_detect_number_format(c) for c in cols]

                    # Write headers
                    for col_idx, col_name in enumerate(cols, 1):
                        cell = ws.cell(row=1, column=col_idx, value=str(col_name))
                        cell.font = header_font
                        cell.fill = header_fill
                        cell.alignment = header_alignment
                        cell.border = thin_border

                    # Write data
                    for row_idx, (_, row) in enumerate(df.iterrows(), 2):
                        for col_idx, col_name in enumerate(cols, 1):
                            val = _convert_numpy(row[col_name])
                            cell = ws.cell(row=row_idx, column=col_idx, value=val)
                            cell.font = data_font
                            cell.alignment = data_alignment
                            cell.border = thin_border
                            # Zebra striping
                            if row_idx % 2 == 0:
                                cell.fill = even_fill
                            # Number format
                            fmt = num_formats[col_idx - 1]
                            if fmt and isinstance(val, (int, float)):
                                cell.number_format = fmt

                    # Freeze header row
                    ws.freeze_panes = 'A2'

                    # Auto-width columns
                    for col_idx, col_name in enumerate(cols, 1):
                        max_len = len(str(col_name))
                        for row_idx in range(2, min(len(df) + 2, 102)):  # Sample first 100 rows
                            cell_val = ws.cell(row=row_idx, column=col_idx).value
                            if cell_val is not None:
                                max_len = max(max_len, len(str(cell_val)))
                        adjusted_width = min(max_len + 3, 50)
                        ws.column_dimensions[get_column_letter(col_idx)].width = adjusted_width

                wb.save(filepath)
                self.files.append({'filename': safe_name, 'filepath': filepath})
                sheet_count = len(sheets)
                return f"Excel saved: {safe_name} ({sheet_count} sheet{'s' if sheet_count > 1 else ''})"

            def save_word(content, filename='document.docx'):
                """Generate a professionally styled Word document.

                Args:
                    content: Either a markdown string OR a dict with structure:
                        {"title": "...", "sections": [{"heading": "...", "body": "...", "table": DataFrame}]}
                    filename: Output filename (.docx)
                """
                try:
                    from docx import Document as _DocxDoc
                    from docx.shared import Pt as _Pt, RGBColor as _RGB, Inches as _Inches
                    from docx.enum.text import WD_ALIGN_PARAGRAPH as _ALIGN
                except ImportError:
                    return "Error: python-docx is not installed. Cannot generate Word documents."

                if not filename.endswith('.docx'):
                    filename += '.docx'
                safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
                filepath = os.path.join(tempfile.gettempdir(), f'vq_{int(time.time())}_{safe_name}')

                doc = _DocxDoc()

                # Set default font
                style = doc.styles['Normal']
                font = style.font
                font.name = 'Calibri'
                font.size = _Pt(10)

                teal = _RGB(0x11, 0x99, 0x93)
                dark_gray = _RGB(0x33, 0x33, 0x33)

                def _add_branded_header(doc, title_text='VQuant Report'):
                    """Add VQuant branded header"""
                    title_para = doc.add_paragraph()
                    title_para.alignment = _ALIGN.LEFT
                    run = title_para.add_run(title_text)
                    run.font.size = _Pt(24)
                    run.font.color.rgb = teal
                    run.font.bold = True

                    subtitle = doc.add_paragraph()
                    subtitle.alignment = _ALIGN.LEFT
                    run = subtitle.add_run('VQuant Financial Analytics')
                    run.font.size = _Pt(10)
                    run.font.color.rgb = _RGB(0x88, 0x88, 0x88)

                    date_para = doc.add_paragraph()
                    date_para.alignment = _ALIGN.LEFT
                    run = date_para.add_run(f'Generated: {datetime.now().strftime("%B %d, %Y")}')
                    run.font.size = _Pt(9)
                    run.font.color.rgb = _RGB(0xAA, 0xAA, 0xAA)
                    run.font.italic = True

                    # Add a thin line separator
                    border_para = doc.add_paragraph()
                    border_para.alignment = _ALIGN.LEFT
                    run = border_para.add_run('_' * 70)
                    run.font.color.rgb = _RGB(0xDD, 0xDD, 0xDD)
                    run.font.size = _Pt(6)
                    doc.add_paragraph()  # Spacer

                def _add_df_table(doc, df, max_rows=200):
                    """Add a styled DataFrame table to the document"""
                    if not isinstance(df, pd.DataFrame) or df.empty:
                        return
                    df_display = df.head(max_rows)
                    cols = list(df_display.columns)
                    table = doc.add_table(rows=1 + len(df_display), cols=len(cols))
                    table.style = 'Table Grid'

                    # Header row
                    for i, col in enumerate(cols):
                        cell = table.rows[0].cells[i]
                        cell.text = str(col)
                        for paragraph in cell.paragraphs:
                            for run in paragraph.runs:
                                run.font.bold = True
                                run.font.color.rgb = _RGB(0xFF, 0xFF, 0xFF)
                                run.font.size = _Pt(9)
                        from docx.oxml.ns import qn
                        shading = cell._element.get_or_add_tcPr()
                        shading_elm = shading.makeelement(qn('w:shd'), {
                            qn('w:fill'): '119993',
                            qn('w:val'): 'clear',
                        })
                        shading.append(shading_elm)

                    # Data rows
                    for row_idx, (_, row) in enumerate(df_display.iterrows()):
                        for col_idx, col in enumerate(cols):
                            val = _convert_numpy(row[col])
                            cell = table.rows[row_idx + 1].cells[col_idx]
                            cell.text = str(val) if val is not None else ''
                            for paragraph in cell.paragraphs:
                                for run in paragraph.runs:
                                    run.font.size = _Pt(8)

                def _parse_markdown(doc, text):
                    """Parse basic markdown and add to document"""
                    lines = text.split('\n')
                    i = 0
                    while i < len(lines):
                        line = lines[i]
                        stripped = line.strip()

                        # Headings
                        if stripped.startswith('### '):
                            h = doc.add_heading(stripped[4:], level=3)
                            for run in h.runs:
                                run.font.color.rgb = dark_gray
                        elif stripped.startswith('## '):
                            h = doc.add_heading(stripped[3:], level=2)
                            for run in h.runs:
                                run.font.color.rgb = teal
                        elif stripped.startswith('# '):
                            h = doc.add_heading(stripped[2:], level=1)
                            for run in h.runs:
                                run.font.color.rgb = teal
                        # List items
                        elif stripped.startswith('- ') or stripped.startswith('* '):
                            text_content = stripped[2:]
                            para = doc.add_paragraph(style='List Bullet')
                            _add_formatted_runs(para, text_content)
                        elif re.match(r'^\d+\.\s', stripped):
                            text_content = re.sub(r'^\d+\.\s', '', stripped)
                            para = doc.add_paragraph(style='List Number')
                            _add_formatted_runs(para, text_content)
                        # Empty line
                        elif not stripped:
                            pass  # Skip empty lines (paragraph spacing handles this)
                        # Regular text
                        else:
                            para = doc.add_paragraph()
                            _add_formatted_runs(para, stripped)
                        i += 1

                def _add_formatted_runs(para, text):
                    """Parse bold (**text**) and add as runs"""
                    parts = re.split(r'(\*\*[^*]+\*\*)', text)
                    for part in parts:
                        if part.startswith('**') and part.endswith('**'):
                            run = para.add_run(part[2:-2])
                            run.bold = True
                            run.font.size = _Pt(10)
                        else:
                            run = para.add_run(part)
                            run.font.size = _Pt(10)

                # Handle structured dict input
                if isinstance(content, dict):
                    title = content.get('title', 'VQuant Report')
                    _add_branded_header(doc, title)

                    for section in content.get('sections', []):
                        if 'heading' in section:
                            h = doc.add_heading(section['heading'], level=2)
                            for run in h.runs:
                                run.font.color.rgb = teal
                        if 'body' in section:
                            _parse_markdown(doc, section['body'])
                        if 'table' in section and isinstance(section['table'], pd.DataFrame):
                            _add_df_table(doc, section['table'])
                            doc.add_paragraph()  # Spacer after table

                # Handle markdown string input
                elif isinstance(content, str):
                    # Extract title from first heading if present
                    first_line = content.strip().split('\n')[0]
                    if first_line.startswith('# '):
                        title = first_line[2:].strip()
                        _add_branded_header(doc, title)
                        remaining = '\n'.join(content.strip().split('\n')[1:])
                        _parse_markdown(doc, remaining)
                    else:
                        _add_branded_header(doc)
                        _parse_markdown(doc, content)
                else:
                    return "Error: save_word expects a string or dict"

                doc.save(filepath)
                self.files.append({'filename': safe_name, 'filepath': filepath})
                return f"Word document saved: {safe_name}"

            exec_globals = {
                '__builtins__': __builtins__,
                # Core libraries
                'np': np,
                'numpy': np,
                'pd': pd,
                'pandas': pd,
                'plt': plt,
                'matplotlib': matplotlib,
                'datetime': datetime,
                'timedelta': timedelta,
                # FMP API client
                'fmp': self.fmp,
                # Custom print
                'print': self._custom_print,
                # File export helpers
                'save_excel': save_excel,
                'save_word': save_word,
                # Helper functions for common tasks
                'convert_to_datetime': lambda x: pd.to_datetime(x, errors='coerce'),
                'safe_strftime': lambda dt, fmt: dt.strftime(fmt) if pd.notna(dt) and hasattr(dt, 'strftime') else str(dt),
            }

            # Add all available optional libraries
            exec_globals.update(AVAILABLE_LIBS)

            # Add context variables if provided
            if context:
                exec_globals.update(context)

            # Capture stdout/stderr
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()

            result_value = None

            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                # Execute the code using a single namespace so variables
                # persist across steps and are visible in nested scopes
                # (functions, comprehensions, lambdas, etc.)
                exec(code, exec_globals)

                # If a 'main' function is defined, call it
                if 'main' in exec_globals and callable(exec_globals['main']):
                    result_value = exec_globals['main']()

                # Capture any matplotlib figures
                self._capture_figures()

            # Get captured output
            stdout_text = stdout_capture.getvalue()
            stderr_text = stderr_capture.getvalue()

            combined_output = '\n'.join(self.output_text)
            if stdout_text:
                combined_output += '\n' + stdout_text
            if stderr_text and not stderr_text.strip().startswith('WARNING'):
                combined_output += '\nStderr: ' + stderr_text

            return {
                'success': True,
                'output': combined_output.strip(),
                'result': result_value,
                'figures': self.figures,
                'files': self.files,
                'error': None
            }

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}\n\n{traceback.format_exc()}"
            return {
                'success': False,
                'output': '\n'.join(self.output_text),
                'result': None,
                'figures': self.figures,
                'files': self.files,
                'error': error_msg
            }

    def _custom_print(self, *args, **kwargs):
        """Custom print function to capture output"""
        output = ' '.join(str(arg) for arg in args)
        self.output_text.append(output)

    def _capture_figures(self):
        """Capture all matplotlib figures as base64 images"""
        figs = [plt.figure(i) for i in plt.get_fignums()]

        for fig in figs:
            # Save figure to bytes buffer
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=150, bbox_inches='tight')
            buf.seek(0)

            # Encode to base64
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            self.figures.append(img_base64)

            buf.close()

        # Close all figures to free memory
        plt.close('all')


def main():
    """Main entry point for the executor"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        code = input_data.get('code', '')
        context = input_data.get('context', {})
        fmp_api_key = input_data.get('fmp_api_key') or os.getenv('FMP_API_KEY')

        if not code:
            print(json.dumps({
                'success': False,
                'error': 'No code provided'
            }))
            return

        # Execute the code
        executor = CustomPythonExecutor(fmp_api_key=fmp_api_key)
        result = executor.execute(code, context)

        # Return result as JSON
        print(json.dumps(result, default=str))  # default=str to handle datetime, etc.

    except Exception as e:
        error_result = {
            'success': False,
            'error': f'Executor error: {str(e)}\n{traceback.format_exc()}',
            'output': '',
            'result': None,
            'figures': [],
            'files': []
        }
        print(json.dumps(error_result))


if __name__ == '__main__':
    main()
