#!/usr/bin/env python3
"""
Generic Python Executor with FMP & FRED API Access
Allows Claude to write custom Python code with direct access to FMP and FRED endpoints
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

# Create a comprehensive FRED API client class
class FREDClient:
    """FRED (Federal Reserve Economic Data) API client — 840,000+ macroeconomic series"""

    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://api.stlouisfed.org/fred'

    def _request(self, endpoint, params=None):
        """Make API request to FRED"""
        import requests
        if params is None:
            params = {}
        params['api_key'] = self.api_key
        params['file_type'] = 'json'

        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    # ===== CORE DATA METHODS =====

    def get_series_observations(self, series_id, observation_start=None, observation_end=None,
                                 units=None, frequency=None, aggregation_method=None):
        """Get raw observations for a FRED series.
        Args:
            series_id: e.g. 'GDP', 'CPIAUCSL', 'UNRATE', 'DFF'
            observation_start/end: 'YYYY-MM-DD'
            units: 'lin' (default), 'chg', 'ch1', 'pch', 'pc1', 'pca', 'cch', 'cca', 'log'
            frequency: 'd','w','bw','m','q','sa','a' (aggregate to lower frequency)
            aggregation_method: 'avg','sum','eop' (used with frequency)
        """
        params = {'series_id': series_id}
        if observation_start:
            params['observation_start'] = observation_start
        if observation_end:
            params['observation_end'] = observation_end
        if units:
            params['units'] = units
        if frequency:
            params['frequency'] = frequency
        if aggregation_method:
            params['aggregation_method'] = aggregation_method
        data = self._request('/series/observations', params)
        return data.get('observations', [])

    def get_series_df(self, series_id, observation_start=None, observation_end=None,
                       units=None, frequency=None, aggregation_method=None):
        """Get observations as a pandas DataFrame with 'date' (datetime) and 'value' (float) columns.
        Missing values (reported as '.') are converted to NaN.
        This is the RECOMMENDED method for analysis — returns clean, ready-to-use data.
        """
        obs = self.get_series_observations(
            series_id,
            observation_start=observation_start,
            observation_end=observation_end,
            units=units,
            frequency=frequency,
            aggregation_method=aggregation_method,
        )
        df = pd.DataFrame(obs)
        if df.empty:
            return df
        df['date'] = pd.to_datetime(df['date'])
        df['value'] = pd.to_numeric(df['value'], errors='coerce')  # '.' → NaN
        return df[['date', 'value']]

    # ===== METADATA =====

    def get_series(self, series_id):
        """Get metadata for a series (title, units, frequency, seasonal adjustment, etc.)"""
        data = self._request('/series', {'series_id': series_id})
        serieses = data.get('serieses', [])
        return serieses[0] if serieses else data

    def search_series(self, search_text, limit=20, order_by='search_rank',
                       filter_variable=None, filter_value=None, tag_names=None):
        """Search for FRED series by keyword.
        Args:
            search_text: keywords (e.g. 'housing starts', 'inflation expectations')
            limit: max results (default 20)
            order_by: 'search_rank','series_id','title','units','frequency',
                      'seasonal_adjustment','realtime_start','realtime_end',
                      'last_updated','observation_start','observation_end','popularity'
            filter_variable/filter_value: e.g. filter_variable='frequency', filter_value='Monthly'
            tag_names: semicolon-separated tags (e.g. 'monetary aggregates;weekly')
        """
        params = {'search_text': search_text, 'limit': limit, 'order_by': order_by}
        if filter_variable:
            params['filter_variable'] = filter_variable
        if filter_value:
            params['filter_value'] = filter_value
        if tag_names:
            params['tag_names'] = tag_names
        data = self._request('/series/search', params)
        return data.get('serieses', [])

    # ===== CATEGORIES =====

    def get_category(self, category_id=0):
        """Get a FRED category (default 0 = root)"""
        data = self._request('/category', {'category_id': category_id})
        return data.get('categories', [])

    def get_category_series(self, category_id, limit=100):
        """Get all series in a category"""
        data = self._request('/category/series', {'category_id': category_id, 'limit': limit})
        return data.get('serieses', [])

    # ===== RELEASES =====

    def get_releases(self):
        """Get all FRED data releases"""
        data = self._request('/releases')
        return data.get('releases', [])

    def get_release_series(self, release_id, limit=100):
        """Get series belonging to a specific release"""
        data = self._request('/release/series', {'release_id': release_id, 'limit': limit})
        return data.get('serieses', [])

    # ===== SERIES RELATED =====

    def get_series_categories(self, series_id):
        """Get categories a series belongs to"""
        data = self._request('/series/categories', {'series_id': series_id})
        return data.get('categories', [])

    def get_series_tags(self, series_id):
        """Get tags for a series"""
        data = self._request('/series/tags', {'series_id': series_id})
        return data.get('tags', [])


class EODHDClient:
    """EODHD API client — intraday historical data + US options chains with Greeks"""

    BASE_URL = 'https://eodhd.com/api'

    def __init__(self, api_key):
        self.api_key = api_key

    def _request(self, endpoint, params=None):
        import requests
        if params is None:
            params = {}
        params.setdefault('api_token', self.api_key)
        params.setdefault('fmt', 'json')
        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        return response.json()

    # ── Intraday ──────────────────────────────────────────────────────────────

    def get_intraday(self, ticker, interval='5m', from_ts=None, to_ts=None):
        """Fetch intraday OHLCV bars.

        Args:
            ticker  : e.g. 'AAPL.US'  (append '.US' for US stocks)
            interval: '1m', '5m', or '1h'
            from_ts : Unix timestamp (int) — default: last 120 days
            to_ts   : Unix timestamp (int)

        Returns:
            list of dicts with keys: datetime, gmtoffset, open, high, low, close, volume
        """
        params = {'interval': interval}
        if from_ts:
            params['from'] = int(from_ts)
        if to_ts:
            params['to'] = int(to_ts)
        return self._request(f'/intraday/{ticker}', params)

    def get_intraday_df(self, ticker, interval='5m', from_ts=None, to_ts=None):
        """Same as get_intraday() but returns a pandas DataFrame with a DatetimeIndex."""
        data = self.get_intraday(ticker, interval=interval, from_ts=from_ts, to_ts=to_ts)
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df['datetime'] = pd.to_datetime(df['datetime'])
        df = df.set_index('datetime')
        for col in ['open', 'high', 'low', 'close', 'volume']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        return df

    # ── End-of-Day ────────────────────────────────────────────────────────────

    def get_eod(self, ticker, from_date=None, to_date=None, period='d', order='d'):
        """Fetch EOD historical prices.

        Args:
            ticker   : e.g. 'AAPL.US'
            from_date: 'YYYY-MM-DD'
            to_date  : 'YYYY-MM-DD'
            period   : 'd' daily, 'w' weekly, 'm' monthly
            order    : 'd' descending, 'a' ascending

        Returns:
            list of dicts with date, open, high, low, close, adjusted_close, volume
        """
        params = {'period': period, 'order': order}
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        return self._request(f'/eod/{ticker}', params)

    def get_eod_df(self, ticker, from_date=None, to_date=None, period='d', order='a'):
        """Same as get_eod() but returns a pandas DataFrame with a DatetimeIndex."""
        data = self.get_eod(ticker, from_date=from_date, to_date=to_date, period=period, order=order)
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        for col in ['open', 'high', 'low', 'close', 'adjusted_close', 'volume']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        return df

    # ── Options ───────────────────────────────────────────────────────────────

    def get_options(self, ticker, from_date=None, to_date=None,
                    contract_name=None, expiration_date_from=None, expiration_date_to=None):
        """Fetch US options chain with Greeks (EOD).

        Args:
            ticker              : e.g. 'AAPL.US'
            from_date           : 'YYYY-MM-DD' trade date start
            to_date             : 'YYYY-MM-DD' trade date end
            contract_name       : specific contract, e.g. 'AAPL230616C00150000'
            expiration_date_from: 'YYYY-MM-DD' filter expiry
            expiration_date_to  : 'YYYY-MM-DD' filter expiry

        Returns:
            dict with keys:
              - 'code'        : ticker
              - 'exchange'    : exchange code
              - 'lastTradeDate': most recent trade date
              - 'data'        : list of expiration buckets, each containing:
                  - 'expirationDate'
                  - 'options': {'CALL': [...], 'PUT': [...]}
                  Each contract has: contractName, lastTradeDate, strike, currency,
                  lastPrice, bid, ask, change, changePercent, volume, openInterest,
                  impliedVolatility, delta, gamma, theta, vega, rho, inTheMoney
        """
        params = {}
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        if contract_name:
            params['contract_name'] = contract_name
        if expiration_date_from:
            params['expiration_date_from'] = expiration_date_from
        if expiration_date_to:
            params['expiration_date_to'] = expiration_date_to
        return self._request(f'/options/{ticker}', params)

    def get_options_df(self, ticker, from_date=None, to_date=None,
                       option_type=None, expiration_date_from=None, expiration_date_to=None):
        """Flatten options chain into a single pandas DataFrame.

        Args:
            option_type: 'CALL', 'PUT', or None for both

        Returns:
            DataFrame with columns: expirationDate, type, contractName, strike, lastPrice,
            bid, ask, volume, openInterest, impliedVolatility, delta, gamma, theta, vega, rho, inTheMoney
        """
        raw = self.get_options(ticker, from_date=from_date, to_date=to_date,
                               expiration_date_from=expiration_date_from,
                               expiration_date_to=expiration_date_to)
        rows = []
        for bucket in raw.get('data', []):
            exp = bucket.get('expirationDate', '')
            opts = bucket.get('options', {})
            types = ['CALL', 'PUT'] if option_type is None else [option_type.upper()]
            for t in types:
                for contract in opts.get(t, []):
                    contract['expirationDate'] = exp
                    contract['type'] = t
                    rows.append(contract)
        if not rows:
            return pd.DataFrame()
        df = pd.DataFrame(rows)
        numeric_cols = ['strike', 'lastPrice', 'bid', 'ask', 'change', 'changePercent',
                        'volume', 'openInterest', 'impliedVolatility',
                        'delta', 'gamma', 'theta', 'vega', 'rho']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        return df

    # ── Live Quote ────────────────────────────────────────────────────────────

    def get_live_quote(self, ticker):
        """Get live (delayed ~15 min) quote for a ticker.

        Returns dict with: code, timestamp, gmtoffset, open, high, low, close,
        volume, previousClose, change, change_p
        """
        return self._request(f'/real-time/{ticker}')


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
    """Executor for custom Python code with FMP & FRED API access"""

    def __init__(self, fmp_api_key=None, fred_api_key=None, eodhd_api_key=None):
        self.fmp_api_key = fmp_api_key or os.getenv('FMP_API_KEY')
        self.fmp = FMPClient(self.fmp_api_key) if FMPClient and self.fmp_api_key else None
        self.fred_api_key = fred_api_key or os.getenv('FRED_API_KEY')
        self.fred = FREDClient(self.fred_api_key) if FREDClient and self.fred_api_key else None
        self.eodhd_api_key = eodhd_api_key or os.getenv('EODHD_API_KEY')
        self.eodhd = EODHDClient(self.eodhd_api_key) if self.eodhd_api_key else None
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

            def save_excel(data, filename='analysis.xlsx', sheet_name='Sheet1', index=False,
                           title=None, summary=True, conditional_formatting=True, formulas=None):
                """Save DataFrame(s) as a professionally styled Excel file with formulas and conditional formatting.

                Args:
                    data: DataFrame for single sheet, or dict {sheet_name: DataFrame} for multi-sheet
                    filename: Output filename (.xlsx)
                    sheet_name: Sheet name (only used if data is a single DataFrame)
                    index: Whether to include the DataFrame index
                    title: Title row text (defaults to sheet name)
                    summary: True (all), False (none), or list like ['sum', 'average'] for selected stats
                    conditional_formatting: True to auto-apply color scales and data bars
                    formulas: List of dicts [{"col": "Total", "formula": "=B{row}+C{row}", "format": "#,##0.00"}]
                """
                from openpyxl import Workbook
                from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
                from openpyxl.utils import get_column_letter
                from openpyxl.formatting.rule import ColorScaleRule, DataBarRule

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
                teal_hex = '119993'
                header_fill = PatternFill(start_color=teal_hex, end_color=teal_hex, fill_type='solid')
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
                title_font = Font(bold=True, color=teal_hex, size=14, name='Calibri')
                subtitle_font = Font(italic=True, color='888888', size=9, name='Calibri')
                summary_label_font = Font(bold=True, size=10, name='Calibri', color='333333')
                summary_value_font = Font(bold=True, size=10, name='Calibri', color=teal_hex)
                summary_fill = PatternFill(start_color='F0F0F0', end_color='F0F0F0', fill_type='solid')
                teal_top_border = Border(top=Side(style='thin', color=teal_hex))

                # Determine which summary rows to include
                all_summary_funcs = ['sum', 'average', 'min', 'max', 'count']
                if summary is True:
                    active_summaries = all_summary_funcs
                elif summary is False or summary is None:
                    active_summaries = []
                elif isinstance(summary, (list, tuple)):
                    active_summaries = [s.lower() for s in summary if s.lower() in all_summary_funcs]
                else:
                    active_summaries = all_summary_funcs

                summary_labels = {
                    'sum': 'SUM', 'average': 'AVERAGE', 'min': 'MIN', 'max': 'MAX', 'count': 'COUNT'
                }
                summary_excel_funcs = {
                    'sum': 'SUM', 'average': 'AVERAGE', 'min': 'MIN', 'max': 'MAX', 'count': 'COUNT'
                }

                def _classify_column(col_name):
                    """Classify column for conditional formatting: 'return', 'volume', 'price', or None"""
                    col_lower = str(col_name).lower()
                    return_kw = ['return', 'performance', 'pnl', 'gain', 'loss', 'change', 'alpha',
                                 'excess', 'spread', 'drawdown']
                    if any(kw in col_lower for kw in return_kw):
                        return 'return'
                    vol_kw = ['volume', 'quantity', 'qty', 'count', 'shares', 'trades', 'transactions']
                    if any(kw in col_lower for kw in vol_kw):
                        return 'volume'
                    price_kw = ['price', 'close', 'open', 'high', 'low', 'value', 'nav', 'amount',
                                'revenue', 'income', 'cost', 'expense', 'assets', 'equity', 'market_cap']
                    if any(kw in col_lower for kw in price_kw):
                        return 'price'
                    return None

                for sname, df in sheets.items():
                    if not isinstance(df, pd.DataFrame):
                        continue
                    if first:
                        ws = wb.active
                        ws.title = sname[:31]
                        first = False
                    else:
                        ws = wb.create_sheet(title=sname[:31])

                    # Tab color (teal)
                    try:
                        ws.sheet_properties.tabColor = teal_hex
                    except Exception:
                        pass

                    # Optionally reset index
                    if index and df.index.name:
                        df = df.reset_index()

                    cols = list(df.columns)

                    # Handle empty DataFrame
                    if len(df) == 0 or len(cols) == 0:
                        ws.cell(row=1, column=1, value=title or sname).font = title_font
                        ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%B %d, %Y')}").font = subtitle_font
                        ws.cell(row=4, column=1, value="No data").font = data_font
                        continue

                    num_formats = [_detect_number_format(c) for c in cols]

                    # === TITLE ROWS (rows 1-3) ===
                    sheet_title = title or sname
                    # Row 1: Merged title
                    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(cols))
                    title_cell = ws.cell(row=1, column=1, value=sheet_title)
                    title_cell.font = title_font
                    title_cell.alignment = Alignment(horizontal='left', vertical='center')

                    # Row 2: Subtitle with date
                    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(cols))
                    subtitle_cell = ws.cell(row=2, column=1, value=f"Generated: {datetime.now().strftime('%B %d, %Y')}")
                    subtitle_cell.font = subtitle_font
                    subtitle_cell.alignment = Alignment(horizontal='left', vertical='center')

                    # Row 3: Spacer
                    ws.row_dimensions[3].height = 6

                    # === HEADERS (row 4) ===
                    header_row = 4
                    data_start_row = 5

                    for col_idx, col_name in enumerate(cols, 1):
                        cell = ws.cell(row=header_row, column=col_idx, value=str(col_name))
                        cell.font = header_font
                        cell.fill = header_fill
                        cell.alignment = header_alignment
                        cell.border = thin_border

                    # === CUSTOM FORMULA COLUMNS ===
                    formula_cols = []
                    if formulas and isinstance(formulas, list):
                        for f_def in formulas:
                            try:
                                f_col_name = f_def.get('col', 'Calculated')
                                f_formula_tpl = f_def.get('formula', '')
                                f_format = f_def.get('format', None)
                                cols.append(f_col_name)
                                formula_cols.append({
                                    'col_idx': len(cols),
                                    'name': f_col_name,
                                    'template': f_formula_tpl,
                                    'format': f_format
                                })
                                num_formats.append(None)
                                # Write header for formula column
                                cell = ws.cell(row=header_row, column=len(cols), value=str(f_col_name))
                                cell.font = header_font
                                cell.fill = header_fill
                                cell.alignment = header_alignment
                                cell.border = thin_border
                            except Exception:
                                pass

                    # === DATA ROWS (starting at row 5) ===
                    for row_idx_0, (_, row) in enumerate(df.iterrows()):
                        excel_row = data_start_row + row_idx_0
                        for col_idx, col_name in enumerate(list(df.columns), 1):
                            val = _convert_numpy(row[col_name])
                            cell = ws.cell(row=excel_row, column=col_idx, value=val)
                            cell.font = data_font
                            cell.alignment = data_alignment
                            cell.border = thin_border
                            # Zebra striping
                            if row_idx_0 % 2 == 1:
                                cell.fill = even_fill
                            # Number format
                            fmt = num_formats[col_idx - 1]
                            if fmt and isinstance(val, (int, float)):
                                cell.number_format = fmt

                        # Write formula columns for this row
                        for fc in formula_cols:
                            try:
                                formula_str = fc['template'].replace('{row}', str(excel_row))
                                cell = ws.cell(row=excel_row, column=fc['col_idx'], value=formula_str)
                                cell.font = data_font
                                cell.alignment = data_alignment
                                cell.border = thin_border
                                if row_idx_0 % 2 == 1:
                                    cell.fill = even_fill
                                if fc['format']:
                                    cell.number_format = fc['format']
                            except Exception:
                                pass

                    last_data_row = data_start_row + len(df) - 1

                    # === SUMMARY FORMULAS ===
                    # Detect numeric columns
                    numeric_col_indices = []
                    for col_idx, col_name in enumerate(list(df.columns), 1):
                        try:
                            if pd.api.types.is_numeric_dtype(df[col_name]):
                                numeric_col_indices.append(col_idx)
                        except Exception:
                            pass
                    # Also include formula columns as numeric for summary
                    for fc in formula_cols:
                        numeric_col_indices.append(fc['col_idx'])

                    if active_summaries and numeric_col_indices and len(df) > 0:
                        summary_start = last_data_row + 2  # One blank row separator

                        for s_offset, func_key in enumerate(active_summaries):
                            s_row = summary_start + s_offset
                            excel_func = summary_excel_funcs[func_key]
                            label_text = summary_labels[func_key]

                            # Label in column A
                            label_cell = ws.cell(row=s_row, column=1, value=label_text)
                            label_cell.font = summary_label_font
                            label_cell.fill = summary_fill
                            if s_offset == 0:
                                label_cell.border = teal_top_border

                            # Formulas for numeric columns
                            for col_idx in numeric_col_indices:
                                col_letter = get_column_letter(col_idx)
                                formula = f"={excel_func}({col_letter}{data_start_row}:{col_letter}{last_data_row})"
                                cell = ws.cell(row=s_row, column=col_idx, value=formula)
                                cell.font = summary_value_font
                                cell.fill = summary_fill
                                if s_offset == 0:
                                    cell.border = teal_top_border
                                # Apply same number format as the column
                                if col_idx <= len(num_formats) and num_formats[col_idx - 1]:
                                    cell.number_format = num_formats[col_idx - 1]

                    # === CONDITIONAL FORMATTING ===
                    if conditional_formatting and len(df) > 0:
                        for col_idx, col_name in enumerate(list(df.columns), 1):
                            try:
                                if not pd.api.types.is_numeric_dtype(df[col_name]):
                                    continue
                            except Exception:
                                continue

                            col_letter = get_column_letter(col_idx)
                            cell_range = f"{col_letter}{data_start_row}:{col_letter}{last_data_row}"
                            col_type = _classify_column(col_name)

                            try:
                                if col_type == 'return':
                                    # Green/white/red scale for returns
                                    ws.conditional_formatting.add(cell_range, ColorScaleRule(
                                        start_type='min', start_color='F8696B',
                                        mid_type='num', mid_value=0, mid_color='FFFFFF',
                                        end_type='max', end_color='63BE7B'
                                    ))
                                elif col_type == 'volume':
                                    # Teal data bars for volume
                                    ws.conditional_formatting.add(cell_range, DataBarRule(
                                        start_type='min', end_type='max',
                                        color=teal_hex
                                    ))
                                elif col_type == 'price':
                                    # Teal gradient for price/value
                                    ws.conditional_formatting.add(cell_range, ColorScaleRule(
                                        start_type='min', start_color='E8F5F4',
                                        end_type='max', end_color='119993'
                                    ))
                            except Exception:
                                pass

                    # === FREEZE PANES on A5 ===
                    ws.freeze_panes = 'A5'

                    # === AUTO-WIDTH COLUMNS ===
                    for col_idx, col_name in enumerate(cols, 1):
                        max_len = len(str(col_name))
                        for r in range(data_start_row, min(last_data_row + 1, data_start_row + 100)):
                            cell_val = ws.cell(row=r, column=col_idx).value
                            if cell_val is not None:
                                max_len = max(max_len, len(str(cell_val)))
                        adjusted_width = min(max_len + 3, 50)
                        ws.column_dimensions[get_column_letter(col_idx)].width = adjusted_width

                wb.save(filepath)
                self.files.append({'filename': safe_name, 'filepath': filepath})
                sheet_count = len(sheets)
                features = []
                if active_summaries:
                    features.append(f"formulas: {', '.join(active_summaries).upper()}")
                if conditional_formatting:
                    features.append("conditional formatting")
                if formulas:
                    features.append(f"{len(formulas)} calculated column(s)")
                feat_str = f" — {', '.join(features)}" if features else ""
                return f"Excel saved: {safe_name} ({sheet_count} sheet{'s' if sheet_count > 1 else ''}{feat_str})"

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

            # ── LaTeX helpers ────────────────────────────────────

            def _escape_latex(text):
                """Escape special LaTeX characters in plain text."""
                if not isinstance(text, str):
                    text = str(text)
                specials = {
                    '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#',
                    '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}',
                    '^': r'\textasciicircum{}',
                }
                for char, replacement in specials.items():
                    text = text.replace(char, replacement)
                return text

            def df_to_latex(df, caption=None, label=None, max_rows=200):
                r"""Convert a DataFrame to a LaTeX booktabs table with teal headers and zebra striping.

                Args:
                    df: pandas DataFrame
                    caption: Optional table caption
                    label: Optional \label for cross-referencing
                    max_rows: Maximum rows to include (default 200)

                Returns:
                    str: LaTeX table code ready for embedding
                """
                if not isinstance(df, pd.DataFrame) or df.empty:
                    return '% Empty DataFrame — no table generated'

                df_display = df.head(max_rows)
                cols = list(df_display.columns)
                num_cols = len(cols)

                lines = []
                lines.append(r'\begin{table}[H]')
                lines.append(r'\centering')
                lines.append(r'\rowcolors{2}{gray!8}{white}')
                col_spec = 'l' + 'r' * (num_cols - 1)
                lines.append(r'\begin{tabular}{' + col_spec + '}')
                lines.append(r'\toprule')
                # Header row with teal background
                header_cells = [r'\textbf{\textcolor{white}{' + _escape_latex(str(c)) + '}}' for c in cols]
                lines.append(r'\rowcolor{vqteal}')
                lines.append(' & '.join(header_cells) + r' \\')
                lines.append(r'\midrule')
                # Data rows
                for _, row in df_display.iterrows():
                    cells = []
                    for c in cols:
                        val = row[c]
                        if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
                            cells.append('—')
                        elif isinstance(val, float):
                            cells.append(f'{val:,.2f}')
                        else:
                            cells.append(_escape_latex(str(val)))
                    lines.append(' & '.join(cells) + r' \\')
                lines.append(r'\bottomrule')
                lines.append(r'\end{tabular}')
                if caption:
                    lines.append(r'\caption{' + _escape_latex(caption) + '}')
                if label:
                    lines.append(r'\label{' + label + '}')
                lines.append(r'\end{table}')
                return '\n'.join(lines)

            def save_latex(content, filename='report.pdf', figures='auto', template='financial',
                           author=None, company=None, logo=None, title=None, **kwargs):
                r"""Generate a professional PDF report via LaTeX compilation.

                If content contains \documentclass, it is treated as raw LaTeX and compiled as-is.
                Otherwise the content is treated as the body and wrapped in a professional VQuant template.

                Figure placeholders: use {{FIG:0}}, {{FIG:1}}, etc. in the content to insert
                the corresponding open matplotlib figures (numbered by creation order).

                Args:
                    content: LaTeX body text or full LaTeX document
                    filename: Output filename (forced to .pdf)
                    figures: 'auto' (save all open figs) or 'none'
                    template: 'financial' (full branding) or 'minimal' (clean, no title page)
                    author: Author name for the title page and PDF metadata
                    company: Company name for the title page and headers
                    logo: URL to a company logo image (PNG/JPG) for the title page
                    title: Custom subtitle for the title page (default: 'Financial Intelligence Report')

                Returns:
                    str: confirmation message
                """
                import subprocess
                import shutil

                # Force .pdf extension
                base = os.path.splitext(filename)[0]
                if not base:
                    base = 'report'
                pdf_name = re.sub(r'[^a-zA-Z0-9._-]', '_', base) + '.pdf'

                work_dir = tempfile.mkdtemp(prefix='vq_latex_')

                # ── Download company logo if provided ──
                logo_path = None
                if logo:
                    try:
                        import requests as _req
                        resp = _req.get(logo, timeout=10)
                        resp.raise_for_status()
                        ctype = resp.headers.get('content-type', '').lower()
                        if 'svg' in ctype:
                            raise ValueError('SVG logos are not supported; use PNG or JPG')
                        ext = '.jpg' if 'jpeg' in ctype or 'jpg' in ctype else '.png'
                        logo_file = os.path.join(work_dir, f'company_logo{ext}')
                        with open(logo_file, 'wb') as lf:
                            lf.write(resp.content)
                        if os.path.getsize(logo_file) > 100:
                            logo_path = logo_file
                    except Exception:
                        logo_path = None  # graceful fallback

                # ── Escape branding strings for LaTeX safety ──
                safe_company = _escape_latex(company) if company else None
                safe_author = _escape_latex(author) if author else None

                # Plain-text versions for PDF metadata (hypersetup cannot contain LaTeX commands)
                def _sanitize_pdf_meta(text):
                    """Strip characters that break pdflatex hypersetup metadata."""
                    if not text:
                        return ''
                    # Remove characters that break \hypersetup (keep basic ASCII + spaces)
                    return re.sub(r'[^\x20-\x7E]', '', text).replace('\\', '')

                # ── Save open matplotlib figures as PNGs ──
                fig_paths = []
                if figures != 'none':
                    fig_nums = plt.get_fignums()
                    for idx, fnum in enumerate(fig_nums):
                        fig = plt.figure(fnum)
                        fig_file = os.path.join(work_dir, f'fig_{idx}.png')
                        fig.savefig(fig_file, format='png', dpi=300, bbox_inches='tight',
                                    facecolor='white', edgecolor='none')
                        fig_paths.append(fig_file)

                # ── Replace {{FIG:N}} placeholders ──
                referenced_figs = set()
                def _replace_fig_placeholders(text):
                    import re as _re
                    def _fig_repl(m):
                        idx = int(m.group(1))
                        if idx < len(fig_paths):
                            referenced_figs.add(idx)
                            fname = os.path.basename(fig_paths[idx])
                            return (
                                r'\begin{figure}[H]' '\n'
                                r'\centering' '\n'
                                r'\includegraphics[width=\linewidth]{' + fname + '}\n'
                                r'\end{figure}'
                            )
                        return m.group(0)  # leave unresolved placeholders as-is
                    return _re.sub(r'\{\{FIG:(\d+)\}\}', _fig_repl, text)

                content = _replace_fig_placeholders(content)

                # ── Auto-append unreferenced figures at end of content ──
                if fig_paths:
                    unreferenced = [i for i in range(len(fig_paths)) if i not in referenced_figs]
                    if unreferenced:
                        fig_blocks = []
                        for idx in unreferenced:
                            fname = os.path.basename(fig_paths[idx])
                            fig_blocks.append(
                                r'\begin{figure}[H]' '\n'
                                r'\centering' '\n'
                                r'\includegraphics[width=\linewidth]{' + fname + '}\n'
                                r'\end{figure}'
                            )
                        content = content + '\n\n' + '\n\n'.join(fig_blocks)

                # ── Detect raw vs template mode ──
                is_raw = r'\documentclass' in content

                if is_raw:
                    full_latex = content
                else:
                    today_str = datetime.now().strftime('%B %d, %Y')

                    # Branding: company name for header, or default
                    header_company = safe_company if safe_company else 'VQuant'
                    # Custom subtitle
                    safe_title = _escape_latex(title) if title else 'Financial Intelligence Report'
                    # PDF metadata (plain ASCII — no LaTeX commands, no Unicode)
                    meta_company = _sanitize_pdf_meta(company) if company else 'VQuant'
                    pdf_author = _sanitize_pdf_meta(author) if author else 'VQuant Analytics'
                    meta_title_str = _sanitize_pdf_meta(title) if title else 'Financial Intelligence Report'
                    pdf_title = f'{meta_company} - {meta_title_str}'

                    if template == 'minimal':
                        full_latex = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{newtxtext}
\usepackage{newtxmath}
\usepackage[sfdefault,scale=0.92]{sourcesanspro}
\usepackage{microtype}
\usepackage[margin=2.5cm]{geometry}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage[table]{xcolor}
\usepackage{float}
\usepackage{amsmath}
\usepackage{parskip}
\usepackage{hyperref}

\definecolor{vqteal}{HTML}{119993}

\hypersetup{colorlinks=true,linkcolor=vqteal,urlcolor=vqteal,citecolor=vqteal,
  pdfauthor={""" + pdf_author + r"""},pdftitle={""" + pdf_title + r"""}}

\begin{document}
""" + content + r"""
\end{document}
"""
                    else:
                        # ── Logo include command ──
                        logo_include = ''
                        if logo_path:
                            logo_basename = os.path.basename(logo_path)
                            logo_include = (
                                r'\includegraphics[height=2cm]{' + logo_basename + r'}'
                                '\n' r'\vspace{0.8cm}' '\n'
                            )

                        # ── Title-page blocks ──
                        company_block = (
                            r'{\fontsize{36}{42}\selectfont\sffamily\bfseries\textcolor{vqcharcoal}{'
                            + header_company + r'}\par}'
                        )
                        subtitle_block = (
                            r'\vspace{0.4cm}' '\n'
                            r'{\Large\sffamily\textcolor{vqsubtitle}{' + safe_title + r'}\par}'
                        )
                        author_block = ''
                        if safe_author:
                            author_block = (
                                r'\vspace{0.6cm}' '\n'
                                r'{\large\sffamily\textcolor{vqsubtitle}{Prepared by ' + safe_author + r'}\par}'
                            )

                        # Full financial template — pro styling
                        full_latex = r"""\documentclass[11pt,a4paper]{article}

%% ── Encoding & Fonts ──
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{newtxtext}
\usepackage{newtxmath}
\usepackage[sfdefault,scale=0.92]{sourcesanspro}

%% ── Micro-typography ──
\usepackage{microtype}

%% ── Layout ──
\usepackage[margin=2.5cm]{geometry}
\usepackage{parskip}
\usepackage{setspace}
\setstretch{1.15}

%% ── Colors ──
\usepackage[table]{xcolor}
\definecolor{vqteal}{HTML}{119993}
\definecolor{vqdark}{HTML}{1A1A2E}
\definecolor{vqgray}{HTML}{666666}
\definecolor{vqlight}{HTML}{F2F9F9}
\definecolor{vqcharcoal}{HTML}{3C3C3C}
\definecolor{vqrule}{HTML}{BFBFBF}
\definecolor{vqsubtitle}{HTML}{5A6A72}

%% ── Graphics & Floats ──
\usepackage{graphicx}
\usepackage{float}

%% ── Tables ──
\usepackage{booktabs}
\usepackage{tabularx}

%% ── Lists ──
\usepackage{enumitem}
\setlist{nosep,leftmargin=1.5em}

%% ── Math ──
\usepackage{amsmath}

%% ── Page count ──
\usepackage{lastpage}

%% ── Headers/Footers ──
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small\sffamily\textcolor{vqteal}{\textbf{""" + header_company + r"""}} \textcolor{vqrule}{|} \textcolor{vqsubtitle}{Financial Intelligence}}
\fancyhead[R]{\small\sffamily\textcolor{vqsubtitle}{""" + today_str + r"""}}
\fancyfoot[C]{\small\sffamily\textcolor{vqsubtitle}{Page \thepage\ / \pageref{LastPage}}}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\headrule}{\hbox to\headwidth{\color{vqteal}\leaders\hrule height \headrulewidth\hfill}}
\renewcommand{\footrulewidth}{0pt}

%% ── Section Styling ──
\usepackage{titlesec}
\titleformat{\section}{\Large\sffamily\bfseries\color{vqteal}}{\thesection}{1em}{}[\vspace{2pt}{\color{vqteal}\titlerule[0.4pt]}]
\titleformat{\subsection}{\large\sffamily\bfseries\color{vqdark}}{\thesubsection}{1em}{}
\titleformat{\subsubsection}{\normalsize\sffamily\bfseries\color{vqsubtitle}}{\thesubsubsection}{1em}{}

%% ── Callout Boxes ──
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\newtcolorbox{keyinsight}{
  colback=vqlight,colframe=vqteal,
  fonttitle=\sffamily\bfseries,title=Key Insight,
  boxrule=0.5pt,arc=3pt,left=8pt,right=8pt,top=6pt,bottom=6pt,
  breakable
}
\newtcolorbox{warningbox}{
  colback=red!5,colframe=red!60!black,
  fonttitle=\sffamily\bfseries,title=Warning,
  boxrule=0.5pt,arc=3pt,left=8pt,right=8pt,top=6pt,bottom=6pt,
  breakable
}
\newtcolorbox{summarybox}[1][Executive Summary]{
  colback=vqteal!4,colframe=vqteal,
  fonttitle=\sffamily\bfseries\large,title=#1,
  boxrule=0.6pt,arc=4pt,left=10pt,right=10pt,top=8pt,bottom=8pt,
  toptitle=4pt,bottomtitle=4pt,
  breakable
}

%% ── Links ──
\usepackage{hyperref}
\hypersetup{colorlinks=true,linkcolor=vqteal,urlcolor=vqteal,citecolor=vqteal,
  pdfauthor={""" + pdf_author + r"""},pdftitle={""" + pdf_title + r"""}}

%% ── Title Page ──
\begin{document}

\begin{titlepage}
\centering
\vspace*{2cm}
""" + logo_include + r"""
""" + company_block + r"""
""" + subtitle_block + r"""
\vspace{2cm}
{\large\sffamily\textcolor{vqcharcoal}{""" + today_str + r"""}\par}
\vspace{0.8cm}
\textcolor{vqteal}{\rule{0.6\textwidth}{0.8pt}}
""" + author_block + r"""
\vfill
{\footnotesize\sffamily\textcolor{vqrule}{Confidential — For intended recipients only}\par}
\vspace{0.3cm}
{\footnotesize\sffamily\textcolor{vqsubtitle}{Generated by VQuant Analytics Platform}\par}
\end{titlepage}

%% ── Table of Contents ──
\tableofcontents
\newpage

""" + content + r"""

\end{document}
"""

                # ── Write .tex file ──
                tex_path = os.path.join(work_dir, 'report.tex')
                with open(tex_path, 'w', encoding='utf-8') as f:
                    f.write(full_latex)

                # ── Find pdflatex ──
                pdflatex = shutil.which('pdflatex')
                if not pdflatex:
                    # MacTeX default location
                    mac_tex = '/Library/TeX/texbin/pdflatex'
                    if os.path.isfile(mac_tex):
                        pdflatex = mac_tex
                if not pdflatex:
                    raise RuntimeError(
                        'pdflatex not found. Install MacTeX (brew install --cask mactex) '
                        'or TeX Live to compile LaTeX documents.'
                    )

                # ── Compile (2 passes for TOC & cross-refs) ──
                for pass_num in range(2):
                    proc = subprocess.run(
                        [pdflatex, '-interaction=nonstopmode', '-halt-on-error', 'report.tex'],
                        cwd=work_dir,
                        capture_output=True,
                        text=True,
                        timeout=60,
                    )
                    if proc.returncode != 0 and pass_num == 1:
                        # Read log tail for diagnostics
                        log_path = os.path.join(work_dir, 'report.log')
                        log_tail = ''
                        if os.path.isfile(log_path):
                            with open(log_path, 'r', errors='replace') as lf:
                                log_lines = lf.readlines()
                                # Find lines with '!' (LaTeX errors)
                                error_lines = [l.rstrip() for l in log_lines if l.startswith('!')]
                                if error_lines:
                                    log_tail = '\n'.join(error_lines[:10])
                                else:
                                    log_tail = ''.join(log_lines[-30:])
                        raise RuntimeError(
                            f'pdflatex compilation failed (pass {pass_num + 1}).\n'
                            f'--- Log ---\n{log_tail}\n'
                            f'--- stderr ---\n{proc.stderr[-500:] if proc.stderr else "(empty)"}'
                        )

                # ── Collect output PDF ──
                compiled_pdf = os.path.join(work_dir, 'report.pdf')
                if not os.path.isfile(compiled_pdf):
                    raise RuntimeError('pdflatex ran but report.pdf was not produced.')

                dest_path = os.path.join(tempfile.gettempdir(), f'vq_{int(time.time())}_{pdf_name}')
                shutil.copy2(compiled_pdf, dest_path)

                # Cleanup work directory (best-effort)
                try:
                    shutil.rmtree(work_dir)
                except Exception:
                    pass

                self.files.append({'filename': pdf_name, 'filepath': dest_path})
                n_figs = len(fig_paths)
                fig_info = f", {n_figs} figure{'s' if n_figs != 1 else ''}" if n_figs else ""
                tmpl_info = f"template={template}" if not is_raw else "raw LaTeX"
                brand_parts = []
                if company:
                    brand_parts.append(f"company={company}")
                if author:
                    brand_parts.append(f"author={author}")
                if logo_path:
                    brand_parts.append("logo=yes")
                brand_info = f", {', '.join(brand_parts)}" if brand_parts else ""
                return f"LaTeX PDF saved: {pdf_name} ({tmpl_info}{fig_info}{brand_info})"

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
                # API clients
                'fmp': self.fmp,
                'fred': self.fred,
                'eodhd': self.eodhd,
                # Custom print
                'print': self._custom_print,
                # File export helpers
                'save_excel': save_excel,
                'save_word': save_word,
                'save_latex': save_latex,
                'df_to_latex': df_to_latex,
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
        fred_api_key = input_data.get('fred_api_key') or os.getenv('FRED_API_KEY')
        eodhd_api_key = input_data.get('eodhd_api_key') or os.getenv('EODHD_API_KEY')

        if not code:
            print(json.dumps({
                'success': False,
                'error': 'No code provided'
            }))
            return

        # Execute the code
        executor = CustomPythonExecutor(fmp_api_key=fmp_api_key, fred_api_key=fred_api_key, eodhd_api_key=eodhd_api_key)
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
