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
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')  # Suppress warnings for cleaner output

# Monkey-patch plt.tight_layout to silently ignore Colorbar layout conflicts
_original_tight_layout = plt.tight_layout
def _safe_tight_layout(*args, **kwargs):
    try:
        _original_tight_layout(*args, **kwargs)
    except RuntimeError as e:
        if 'Colorbar' in str(e):
            pass  # Silently skip — colorbar is incompatible with tight_layout
        else:
            raise
plt.tight_layout = _safe_tight_layout

# ─────────────────────────────────────────────────────────────────────────────
# Add this directory to sys.path so sub-packages (clients/, exporters/, figures/)
# are importable when this script is executed as a subprocess.
# ─────────────────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ─────────────────────────────────────────────────────────────────────────────
# Matplotlib academic style (Journal of Finance)
# ─────────────────────────────────────────────────────────────────────────────
from figures.matplotlib_config import _JF_COLORS

# ─────────────────────────────────────────────────────────────────────────────
# Figure capture utilities
# ─────────────────────────────────────────────────────────────────────────────
from figures.figure_capture import is_figure_empty, add_watermark, capture_figures

# ─────────────────────────────────────────────────────────────────────────────
# API client classes
# ─────────────────────────────────────────────────────────────────────────────
from clients.fmp_client import FMPClient
from clients.fred_client import FREDClient
from clients.eodhd_client import EODHDClient
from clients.macro_clients import WorldBankClient, IMFClient, OECDClient, PolymarketClient
from clients.claude_client import ClaudeClient
from clients.openrouter_client import OpenRouterClient

# ─────────────────────────────────────────────────────────────────────────────
# File export functions
# ─────────────────────────────────────────────────────────────────────────────
from exporters.file_exporters import (
    save_excel as _save_excel_impl,
    save_word as _save_word_impl,
    save_latex as _save_latex_impl,
    df_to_latex,
    _convert_numpy,
    _detect_number_format,
    _escape_latex,
)

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

# === linearmodels (Panel Data, IV, GMM) ===
try:
    from linearmodels.panel import PanelOLS, RandomEffects, PooledOLS, BetweenOLS, FirstDifferenceOLS
    from linearmodels.panel.results import PanelEffectsResults
    from linearmodels.iv import IV2SLS, IVGMM, IVLIML
    from linearmodels.iv.results import IVResults
    AVAILABLE_LIBS['PanelOLS'] = PanelOLS
    AVAILABLE_LIBS['RandomEffects'] = RandomEffects
    AVAILABLE_LIBS['PooledOLS'] = PooledOLS
    AVAILABLE_LIBS['BetweenOLS'] = BetweenOLS
    AVAILABLE_LIBS['FirstDifferenceOLS'] = FirstDifferenceOLS
    AVAILABLE_LIBS['IV2SLS'] = IV2SLS
    AVAILABLE_LIBS['IVGMM'] = IVGMM
    AVAILABLE_LIBS['IVLIML'] = IVLIML
except ImportError:
    pass

# === pyfixest (Two-Way Fixed Effects, DiD, Event Study) ===
try:
    import pyfixest as pf
    from pyfixest.estimation import feols, fepois
    AVAILABLE_LIBS['pf'] = pf
    AVAILABLE_LIBS['pyfixest'] = pf
    AVAILABLE_LIBS['feols'] = feols
    AVAILABLE_LIBS['fepois'] = fepois
except ImportError:
    pass

# === statsmodels extras (DiD, Quantile Regression, Cointegration, GMM) ===
try:
    from statsmodels.tsa.stattools import coint, grangercausalitytests, kpss
    from statsmodels.tsa.vector_ar.vecm import VECM, select_coint_rank
    from statsmodels.regression.quantile_regression import QuantReg
    from statsmodels.stats.sandwich_covariance import cov_hac, cov_cluster
    from statsmodels.stats.diagnostic import het_breuschpagan, acorr_ljungbox
    from statsmodels.stats.stattools import durbin_watson
    from statsmodels.tsa.filters.hp_filter import hpfilter
    from statsmodels.sandbox.regression.gmm import GMM
    AVAILABLE_LIBS['coint'] = coint
    AVAILABLE_LIBS['grangercausalitytests'] = grangercausalitytests
    AVAILABLE_LIBS['kpss'] = kpss
    AVAILABLE_LIBS['VECM'] = VECM
    AVAILABLE_LIBS['select_coint_rank'] = select_coint_rank
    AVAILABLE_LIBS['QuantReg'] = QuantReg
    AVAILABLE_LIBS['cov_hac'] = cov_hac
    AVAILABLE_LIBS['cov_cluster'] = cov_cluster
    AVAILABLE_LIBS['het_breuschpagan'] = het_breuschpagan
    AVAILABLE_LIBS['acorr_ljungbox'] = acorr_ljungbox
    AVAILABLE_LIBS['durbin_watson'] = durbin_watson
    AVAILABLE_LIBS['hpfilter'] = hpfilter
    AVAILABLE_LIBS['GMM'] = GMM
except ImportError:
    pass

# === arch extras (EGARCH, GJR-GARCH, DCC, RealGARCH) ===
try:
    from arch.univariate import EGARCH, GARCH, FIGARCH, EWMAVariance, RiskMetrics2006
    from arch.univariate import Normal, StudentsT, SkewStudent, GeneralizedError
    AVAILABLE_LIBS['EGARCH'] = EGARCH
    AVAILABLE_LIBS['FIGARCH'] = FIGARCH
    AVAILABLE_LIBS['EWMAVariance'] = EWMAVariance
    AVAILABLE_LIBS['StudentsT'] = StudentsT
    AVAILABLE_LIBS['SkewStudent'] = SkewStudent
    AVAILABLE_LIBS['GeneralizedError'] = GeneralizedError
except ImportError:
    pass

# === causalinference / DoWhy (Causal Inference) ===
try:
    import dowhy
    from dowhy import CausalModel
    AVAILABLE_LIBS['dowhy'] = dowhy
    AVAILABLE_LIBS['CausalModel'] = CausalModel
except ImportError:
    pass

# === scikit-learn extras (not yet exposed) ===
try:
    from sklearn.linear_model import (
        Lasso, Ridge, ElasticNet, LassoCV, RidgeCV, ElasticNetCV,
        LogisticRegression, BayesianRidge, HuberRegressor, QuantileRegressor
    )
    from sklearn.ensemble import (
        AdaBoostRegressor, AdaBoostClassifier,
        BaggingRegressor, BaggingClassifier,
        ExtraTreesRegressor, ExtraTreesClassifier,
        IsolationForest
    )
    from sklearn.svm import SVR, SVC
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import PolynomialFeatures, MinMaxScaler, RobustScaler
    from sklearn.feature_selection import SelectKBest, f_regression, mutual_info_regression
    from sklearn.inspection import permutation_importance
    AVAILABLE_LIBS['Lasso'] = Lasso
    AVAILABLE_LIBS['Ridge'] = Ridge
    AVAILABLE_LIBS['ElasticNet'] = ElasticNet
    AVAILABLE_LIBS['LassoCV'] = LassoCV
    AVAILABLE_LIBS['RidgeCV'] = RidgeCV
    AVAILABLE_LIBS['ElasticNetCV'] = ElasticNetCV
    AVAILABLE_LIBS['LogisticRegression'] = LogisticRegression
    AVAILABLE_LIBS['BayesianRidge'] = BayesianRidge
    AVAILABLE_LIBS['HuberRegressor'] = HuberRegressor
    AVAILABLE_LIBS['QuantileRegressor'] = QuantileRegressor
    AVAILABLE_LIBS['AdaBoostRegressor'] = AdaBoostRegressor
    AVAILABLE_LIBS['IsolationForest'] = IsolationForest
    AVAILABLE_LIBS['SVR'] = SVR
    AVAILABLE_LIBS['SVC'] = SVC
    AVAILABLE_LIBS['Pipeline'] = Pipeline
    AVAILABLE_LIBS['PolynomialFeatures'] = PolynomialFeatures
    AVAILABLE_LIBS['MinMaxScaler'] = MinMaxScaler
    AVAILABLE_LIBS['RobustScaler'] = RobustScaler
    AVAILABLE_LIBS['SelectKBest'] = SelectKBest
    AVAILABLE_LIBS['f_regression'] = f_regression
    AVAILABLE_LIBS['mutual_info_regression'] = mutual_info_regression
    AVAILABLE_LIBS['permutation_importance'] = permutation_importance
except ImportError:
    pass

# === pingouin (Statistical Tests) ===
try:
    import pingouin as pg
    AVAILABLE_LIBS['pg'] = pg
    AVAILABLE_LIBS['pingouin'] = pg
except ImportError:
    pass

# === pymc (Bayesian Econometrics) ===
try:
    import pymc as pymc_lib
    AVAILABLE_LIBS['pymc'] = pymc_lib
except ImportError:
    pass

# === shap (Model Explainability) ===
try:
    import shap
    AVAILABLE_LIBS['shap'] = shap
except ImportError:
    pass

# === duckdb (HF data queries) ===
try:
    import duckdb as _duckdb
    AVAILABLE_LIBS['duckdb'] = _duckdb
except ImportError:
    pass


# ═══════════════════════════════════════════════════════════════════
# HF Data Client — DuckDB-backed high-frequency OHLCV data
# ═══════════════════════════════════════════════════════════════════

class HFDataClient:
    """
    High-frequency OHLCV data client backed by DuckDB.
    Supports two resolutions: 1-minute and 5-minute.

    6 asset classes: crypto, futures, fx, index, etf, stock
    5min: ~1.76 BILLION rows, 12,500+ symbols, data from 2000-2026.
    1min: ~5.93 BILLION rows, 13,270+ symbols, data from 2000-2026.

    Usage (default resolution = '5min'):
        hfdb.symbols('crypto')                                → list crypto symbols
        hfdb.get('stock', 'AAPL')                             → AAPL 5min OHLCV
        hfdb.get('stock', 'AAPL', resolution='1min', start='2024-01-01')  → AAPL 1min from 2024
        hfdb.get('etf', 'SPY', start='2024-01-01', freq='1h')
        hfdb.get('crypto', 'BTC', resolution='1min')          → BTC 1-minute bars
        hfdb.query('crypto', "SELECT * FROM ohlcv WHERE symbol='ETH' LIMIT 100")
        hfdb.query('crypto', "SELECT * FROM crypto_1min WHERE ticker='ETH' LIMIT 100", resolution='1min')
    """

    DATABASES_5MIN = {
        'crypto': 'crypto_5min.duckdb',
        'futures': 'futures_5min.duckdb',
        'fx': 'fx_5min.duckdb',
        'index': 'index_5min.duckdb',
        'etf': 'etf_5min.duckdb',
        'stock': 'stock_5min.duckdb',
    }

    DATABASES_1MIN = {
        'crypto': 'crypto_1min.duckdb',
        'futures': 'futures_1min.duckdb',
        'fx': 'fx_1min.duckdb',
        'index': 'index_1min.duckdb',
        'etf': 'etf_1min.duckdb',
        'stock': 'stock_1min.duckdb',
    }

    # 1min DBs use table named '{asset}_1min' with column 'ticker'
    # 5min DBs use table 'ohlcv' with column 'symbol'
    TABLE_1MIN = {
        'crypto': 'crypto_1min',
        'futures': 'futures_1min',
        'fx': 'fx_1min',
        'index': 'index_1min',
        'etf': 'etf_1min',
        'stock': 'stock_1min',
    }

    def __init__(self, base_dir=None):
        if base_dir:
            self.base_dir = base_dir
        else:
            candidates = [
                os.environ.get('HF_DATA_DIR', ''),
                os.path.join(os.getcwd(), 'hf_data'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'hf_data'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'hf_data'),
                os.path.expanduser('~/Desktop/hf_data'),
            ]
            candidates = [c for c in candidates if c]  # remove empty
            self.base_dir = next((c for c in candidates if os.path.isdir(c)), candidates[0])

    def _resolve(self, db_name, resolution='5min'):
        """Return (filename, table_name, symbol_col) for the given resolution."""
        if resolution == '1min':
            db_map = self.DATABASES_1MIN
            table = self.TABLE_1MIN.get(db_name)
            sym_col = 'ticker'
        else:
            db_map = self.DATABASES_5MIN
            table = 'ohlcv'
            sym_col = 'symbol'
        filename = db_map.get(db_name)
        if not filename:
            raise ValueError(f"Unknown database '{db_name}'. Available: {list(db_map.keys())}")
        return filename, table, sym_col

    def _connect(self, db_name, resolution='5min'):
        """Get a read-only DuckDB connection."""
        try:
            import duckdb
        except ImportError:
            raise ImportError("duckdb not installed. Run: pip install duckdb")
        filename, _, _ = self._resolve(db_name, resolution)
        path = os.path.join(self.base_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Database file not found: {path}")
        return duckdb.connect(path, read_only=True)

    def symbols(self, db_name, resolution='5min'):
        """List all available symbols in a database. Returns list of strings."""
        _, table, sym_col = self._resolve(db_name, resolution)
        con = self._connect(db_name, resolution)
        try:
            result = con.execute(f"SELECT DISTINCT {sym_col} FROM {table} ORDER BY {sym_col}").fetchall()
            return [row[0] for row in result]
        finally:
            con.close()

    def info(self, db_name, symbol=None, resolution='5min'):
        """Get row count, date range, and symbol count. If symbol given, info for that symbol only."""
        _, table, sym_col = self._resolve(db_name, resolution)
        con = self._connect(db_name, resolution)
        try:
            if symbol:
                result = con.execute(
                    f"SELECT COUNT(*) AS rows, MIN(datetime) AS first, MAX(datetime) AS last FROM {table} WHERE {sym_col} = ?",
                    [symbol]
                ).fetchdf()
            else:
                result = con.execute(
                    f"SELECT COUNT(*) AS rows, COUNT(DISTINCT {sym_col}) AS symbols, MIN(datetime) AS first, MAX(datetime) AS last FROM {table}"
                ).fetchdf()
            return result
        finally:
            con.close()

    def get(self, db_name, symbol, start=None, end=None, freq=None, resolution='5min'):
        """
        Get OHLCV data for a symbol as a pandas DataFrame.

        Args:
            db_name: 'crypto', 'futures', 'fx', 'index', 'etf', 'stock'
            symbol: e.g. 'BTC', 'ES', 'EURUSD', 'SPX', 'AAPL'
            start: optional start date string (e.g. '2024-01-01')
            end: optional end date string (e.g. '2024-12-31')
            freq: optional resample frequency: '5min', '15min', '30min', '1h', '4h', '1D', '1W'
            resolution: '5min' (default) or '1min' — selects the underlying database

        Returns:
            pandas DataFrame with columns: datetime, open, high, low, close, volume
        """
        _, table, sym_col = self._resolve(db_name, resolution)
        con = self._connect(db_name, resolution)
        try:
            conditions = [f"{sym_col} = ?"]
            params = [symbol]
            if start:
                conditions.append("datetime >= ?")
                params.append(start)
            if end:
                conditions.append("datetime <= ?")
                params.append(end)

            where = " AND ".join(conditions)

            native_freq = '1min' if resolution == '1min' else '5min'
            if freq and freq != native_freq:
                interval_map = {
                    '1min': '1 minute', '2min': '2 minutes', '3min': '3 minutes',
                    '5min': '5 minutes', '10min': '10 minutes',
                    '15min': '15 minutes', '30min': '30 minutes',
                    '1h': '1 hour', '2h': '2 hours', '4h': '4 hours',
                    '1D': '1 day', '1W': '1 week', '1M': '1 month',
                }
                interval = interval_map.get(freq)
                if not interval:
                    raise ValueError(f"Unknown freq '{freq}'. Use: {list(interval_map.keys())}")

                sql = f"""
                    SELECT
                        time_bucket(INTERVAL '{interval}', datetime) AS datetime,
                        FIRST(open) AS open,
                        MAX(high) AS high,
                        MIN(low) AS low,
                        LAST(close) AS close,
                        SUM(volume) AS volume
                    FROM {table}
                    WHERE {where}
                    GROUP BY 1
                    ORDER BY 1
                """
            else:
                sql = f"SELECT datetime, open, high, low, close, volume FROM {table} WHERE {where} ORDER BY datetime"

            df = con.execute(sql, params).fetchdf()
            if 'datetime' in df.columns:
                df['datetime'] = pd.to_datetime(df['datetime'])
                df = df.set_index('datetime')
            return df
        finally:
            con.close()

    def query(self, db_name, sql, resolution='5min'):
        """Run arbitrary SQL on a database. Returns pandas DataFrame."""
        con = self._connect(db_name, resolution)
        try:
            return con.execute(sql).fetchdf()
        finally:
            con.close()

    def __repr__(self):
        lines = ["HFDataClient (1min + 5min OHLCV)"]
        for res, db_map in [('5min', self.DATABASES_5MIN), ('1min', self.DATABASES_1MIN)]:
            for name, fname in db_map.items():
                path = os.path.join(self.base_dir, fname)
                exists = "OK" if os.path.exists(path) else "MISSING"
                lines.append(f"  {name} ({res}): {exists}")
        return "\\n".join(lines)


class OptionsDataClient:
    """
    Options chain data client backed by DuckDB.

    3.83 BILLION rows of daily option chain snapshots for 11,077 US tickers.
    Coverage: 2010-01-04 to 2025-12-31, partitioned by quarter.

    Table: option_chain
    Columns: ticker, quarter, trade_date, strike, expiry_date, call_put,
             last_trade_price, bid_price, ask_price, bid_iv, ask_iv,
             open_interest, volume, delta, gamma, vega, theta, rho

    Usage:
        optdb.tickers()                                       → list all 11,077 tickers
        optdb.get('AAPL', '2024-01-01', '2024-03-31')        → AAPL chain for Q1 2024
        optdb.get('SPY', '2024-06-01', '2024-06-30', call_put='c')  → SPY calls June 2024
        optdb.get('TSLA', '2024-01-15', '2024-01-15', strike_min=200, strike_max=300)
        optdb.surface('AAPL', '2024-06-15')                   → IV surface snapshot for a single date
        optdb.query("SELECT * FROM option_chain WHERE ticker='AAPL' AND trade_date='2024-06-15' LIMIT 10")
    """

    def __init__(self, base_dir=None):
        if base_dir:
            self.base_dir = base_dir
        else:
            candidates = [
                os.environ.get('HF_DATA_DIR', ''),
                os.path.join(os.getcwd(), 'hf_data'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'hf_data'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'hf_data'),
                os.path.expanduser('~/Desktop/hf_data'),
            ]
            candidates = [c for c in candidates if c]  # remove empty
            self.base_dir = next((c for c in candidates if os.path.isdir(c)), candidates[0])

    def _connect(self):
        try:
            import duckdb
        except ImportError:
            raise ImportError("duckdb not installed. Run: pip install duckdb")
        path = os.path.join(self.base_dir, 'options.duckdb')
        if not os.path.exists(path):
            raise FileNotFoundError(f"Options database not found: {path}")
        return duckdb.connect(path, read_only=True)

    def tickers(self):
        """List all available tickers. Returns list of strings."""
        con = self._connect()
        try:
            result = con.execute("SELECT DISTINCT ticker FROM option_chain ORDER BY ticker").fetchall()
            return [row[0] for row in result]
        finally:
            con.close()

    def get(self, ticker, start_date, end_date, call_put=None, strike_min=None, strike_max=None, expiry_min=None, expiry_max=None):
        """
        Get option chain data for a ticker within a date range.

        Args:
            ticker: e.g. 'AAPL', 'SPY', 'TSLA'
            start_date: trade date start (e.g. '2024-01-01')
            end_date: trade date end (e.g. '2024-03-31')
            call_put: optional 'c' for calls or 'p' for puts
            strike_min: optional minimum strike price
            strike_max: optional maximum strike price
            expiry_min: optional minimum expiry date
            expiry_max: optional maximum expiry date

        Returns:
            pandas DataFrame with all option chain columns
        """
        con = self._connect()
        try:
            conditions = ["ticker = ?", "trade_date >= ?", "trade_date <= ?"]
            params = [ticker, start_date, end_date]
            if call_put:
                conditions.append("call_put = ?")
                params.append(call_put)
            if strike_min is not None:
                conditions.append("strike >= ?")
                params.append(strike_min)
            if strike_max is not None:
                conditions.append("strike <= ?")
                params.append(strike_max)
            if expiry_min:
                conditions.append("expiry_date >= ?")
                params.append(expiry_min)
            if expiry_max:
                conditions.append("expiry_date <= ?")
                params.append(expiry_max)

            where = " AND ".join(conditions)
            sql = f"SELECT * FROM option_chain WHERE {where} ORDER BY trade_date, expiry_date, strike, call_put"
            df = con.execute(sql, params).fetchdf()
            if 'trade_date' in df.columns:
                df['trade_date'] = pd.to_datetime(df['trade_date'])
            if 'expiry_date' in df.columns:
                df['expiry_date'] = pd.to_datetime(df['expiry_date'])
            return df
        finally:
            con.close()

    def surface(self, ticker, trade_date, call_put='c'):
        """
        Get implied volatility surface for a single trade date.
        Returns DataFrame with columns: strike, expiry_date, bid_iv, ask_iv, mid_iv, delta, gamma, vega, theta.
        """
        con = self._connect()
        try:
            sql = """
                SELECT strike, expiry_date, bid_iv, ask_iv,
                       (bid_iv + ask_iv) / 2.0 AS mid_iv,
                       delta, gamma, vega, theta, open_interest, volume
                FROM option_chain
                WHERE ticker = ? AND trade_date = ? AND call_put = ?
                ORDER BY expiry_date, strike
            """
            df = con.execute(sql, [ticker, trade_date, call_put]).fetchdf()
            if 'expiry_date' in df.columns:
                df['expiry_date'] = pd.to_datetime(df['expiry_date'])
            return df
        finally:
            con.close()

    def query(self, sql):
        """Run arbitrary SQL on the options database. Returns pandas DataFrame."""
        con = self._connect()
        try:
            return con.execute(sql).fetchdf()
        finally:
            con.close()

    def __repr__(self):
        path = os.path.join(self.base_dir, 'options.duckdb')
        exists = "OK" if os.path.exists(path) else "MISSING"
        return f"OptionsDataClient (3.8B rows, 11,077 tickers, 2010-2025): {exists}"


class SDCIPOClient:
    """
    SDC Platinum IPO database client backed by DuckDB.

    452,475 IPO records from 1963–2024, covering global markets.
    Table: sdc_ipo — 538 columns including issuer info, financials, pricing,
    underpricing returns, fees, underwriters, SIC codes, industries, and more.

    Usage:
        sdc_ipo.info()                          → row count, year range
        sdc_ipo.columns()                       → list all 538 column names
        sdc_ipo.search_columns('price')         → find columns matching keyword
        sdc_ipo.sample(5)                       → random sample of 5 rows (key columns)
        sdc_ipo.query("SELECT * FROM sdc_ipo WHERE dates_offer_year_ccyy='2020' LIMIT 10")
        sdc_ipo.get(year_start='2000', year_end='2010', nation='United States', exchange='NYSE')
        sdc_ipo.get(industry='Technology', min_proceeds=100)
    """

    KEY_COLUMNS = [
        'issuerborrower_name_full', 'new_issues_ticker_symbol', 'isin',
        'dates_issue_date', 'first_trade_date', 'dates_offer_year_ccyy',
        'adjusted_offer_price_usd', 'proceeds_amount_all_markets_usd_millions',
        'percent_change_offer_price_to_closing_price_at_offerfirst_trade',
        'percent_change_offer_price_to_price_1_day_after_offer',
        'percent_change_offer_price_to_price_1_week_after_offer',
        'percent_change_offer_price_to_price_4_weeks_after_offer',
        'percent_change_offer_price_to_price_180_days_after_offer',
        'percent_change_offer_price_to_price_365_days_after_offer',
        'issuerborrower_nation', 'issuerborrower_nation_region',
        'new_issues_stock_exchange', 'new_issues_sdc_industry',
        'new_issues_macro_industry', 'sic',
        'blank_check_spac_involvement_yn',
        'bookrunner_short_name',
        'financials_total_assets_before_offering_usd_millions',
        'financials_total_revenues_before_offering_usd_millions',
        'financials_net_income_after_taxes_before_offering_usd_millions',
        'financials_shares_outstanding_after_offer',
        'new_issues_fees_gross_spread_as_pct_of_offer_price',
        'new_issues_number_of_employees',
        'new_issues_date_company_founded',
        'transaction_status',
    ]

    def __init__(self, base_dir=None):
        if base_dir:
            self.base_dir = base_dir
        else:
            candidates = [
                os.environ.get('SDC_IPO_DIR', ''),
                os.path.join(os.getcwd(), 'SDC_IPO'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'SDC_IPO'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'SDC_IPO'),
            ]
            candidates = [c for c in candidates if c]  # remove empty
            self.base_dir = next((c for c in candidates if os.path.isdir(c)), candidates[0])

    def _connect(self):
        """Get a read-only DuckDB connection."""
        try:
            import duckdb
        except ImportError:
            raise ImportError("duckdb not installed. Run: pip install duckdb")
        path = os.path.join(self.base_dir, 'sdc_ipo.duckdb')
        if not os.path.exists(path):
            raise FileNotFoundError(f"SDC IPO database not found: {path}")
        return duckdb.connect(path, read_only=True)

    def info(self):
        """Get row count, year range, nation count, and industry count."""
        con = self._connect()
        try:
            return con.execute("""
                SELECT
                    COUNT(*) AS total_ipos,
                    MIN(dates_offer_year_ccyy) AS first_year,
                    MAX(dates_offer_year_ccyy) AS last_year,
                    COUNT(DISTINCT issuerborrower_nation) AS nations,
                    COUNT(DISTINCT new_issues_sdc_industry) AS industries,
                    COUNT(DISTINCT new_issues_stock_exchange) AS exchanges
                FROM sdc_ipo
                WHERE dates_offer_year_ccyy IS NOT NULL
            """).fetchdf()
        finally:
            con.close()

    def columns(self):
        """List all column names in the sdc_ipo table."""
        con = self._connect()
        try:
            cols = con.execute("DESCRIBE sdc_ipo").fetchall()
            return [c[0] for c in cols]
        finally:
            con.close()

    def search_columns(self, keyword):
        """Find columns whose name contains the keyword (case-insensitive)."""
        kw = keyword.lower()
        return [c for c in self.columns() if kw in c.lower()]

    def sample(self, n=5):
        """Random sample of n rows with key columns only."""
        con = self._connect()
        try:
            cols_str = ', '.join(f'"{c}"' for c in self.KEY_COLUMNS)
            return con.execute(f"SELECT {cols_str} FROM sdc_ipo USING SAMPLE {n}").fetchdf()
        finally:
            con.close()

    def get(self, year_start=None, year_end=None, nation=None, exchange=None,
            industry=None, ticker=None, issuer_name=None, spac=None,
            min_proceeds=None, max_proceeds=None, columns=None, limit=None):
        """
        Query IPOs with filters. Returns pandas DataFrame.

        Args:
            year_start: Minimum offer year (e.g. '2000' or 2000)
            year_end: Maximum offer year (e.g. '2023' or 2023)
            nation: Issuer nation filter (e.g. 'United States', 'Japan')
            exchange: Stock exchange filter (contains, e.g. 'NYSE', 'NASDAQ')
            industry: SDC industry filter (contains, e.g. 'Technology', 'Manufacturing')
            ticker: Ticker symbol filter (exact or LIKE pattern)
            issuer_name: Issuer name filter (contains, case-insensitive)
            spac: Filter by SPAC ('Y' or 'N')
            min_proceeds: Minimum proceeds in USD millions
            max_proceeds: Maximum proceeds in USD millions
            columns: List of column names to return (default: KEY_COLUMNS)
            limit: Max rows to return (default: no limit)

        Returns:
            pandas DataFrame
        """
        con = self._connect()
        try:
            conditions = []
            params = []

            if year_start is not None:
                conditions.append("dates_offer_year_ccyy >= ?")
                params.append(str(year_start))
            if year_end is not None:
                conditions.append("dates_offer_year_ccyy <= ?")
                params.append(str(year_end))
            if nation:
                conditions.append("issuerborrower_nation ILIKE ?")
                params.append(f"%{nation}%")
            if exchange:
                conditions.append("new_issues_stock_exchange ILIKE ?")
                params.append(f"%{exchange}%")
            if industry:
                conditions.append("(new_issues_sdc_industry ILIKE ? OR new_issues_macro_industry ILIKE ?)")
                params.extend([f"%{industry}%", f"%{industry}%"])
            if ticker:
                conditions.append("new_issues_ticker_symbol ILIKE ?")
                params.append(f"%{ticker}%")
            if issuer_name:
                conditions.append("issuerborrower_name_full ILIKE ?")
                params.append(f"%{issuer_name}%")
            if spac:
                conditions.append("blank_check_spac_involvement_yn = ?")
                params.append(spac)
            if min_proceeds is not None:
                conditions.append("TRY_CAST(proceeds_amount_all_markets_usd_millions AS DOUBLE) >= ?")
                params.append(float(min_proceeds))
            if max_proceeds is not None:
                conditions.append("TRY_CAST(proceeds_amount_all_markets_usd_millions AS DOUBLE) <= ?")
                params.append(float(max_proceeds))

            cols = columns or self.KEY_COLUMNS
            cols_str = ', '.join(f'"{c}"' for c in cols)

            where = " AND ".join(conditions) if conditions else "1=1"
            sql = f"SELECT {cols_str} FROM sdc_ipo WHERE {where} ORDER BY dates_offer_year_ccyy DESC, dates_issue_date DESC"
            if limit:
                sql += f" LIMIT {int(limit)}"

            return con.execute(sql, params).fetchdf()
        finally:
            con.close()

    def query(self, sql):
        """Run arbitrary SQL on the sdc_ipo database. Returns pandas DataFrame."""
        con = self._connect()
        try:
            return con.execute(sql).fetchdf()
        finally:
            con.close()

    def describe_column(self, column_name):
        """Get unique value counts and sample values for a specific column."""
        con = self._connect()
        try:
            stats = con.execute(f"""
                SELECT
                    COUNT(*) AS total_rows,
                    COUNT("{column_name}") AS non_null,
                    COUNT(DISTINCT "{column_name}") AS unique_values
                FROM sdc_ipo
            """).fetchdf()
            top_values = con.execute(f"""
                SELECT "{column_name}" AS value, COUNT(*) AS cnt
                FROM sdc_ipo
                WHERE "{column_name}" IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC LIMIT 20
            """).fetchdf()
            return {'stats': stats, 'top_values': top_values}
        finally:
            con.close()

    def yearly_counts(self, nation=None, exchange=None):
        """Get IPO counts by year, optionally filtered by nation or exchange."""
        con = self._connect()
        try:
            conditions = ["dates_offer_year_ccyy IS NOT NULL"]
            params = []
            if nation:
                conditions.append("issuerborrower_nation ILIKE ?")
                params.append(f"%{nation}%")
            if exchange:
                conditions.append("new_issues_stock_exchange ILIKE ?")
                params.append(f"%{exchange}%")
            where = " AND ".join(conditions)
            return con.execute(f"""
                SELECT dates_offer_year_ccyy AS year, COUNT(*) AS ipo_count,
                       AVG(TRY_CAST(proceeds_amount_all_markets_usd_millions AS DOUBLE)) AS avg_proceeds_usd_m,
                       SUM(TRY_CAST(proceeds_amount_all_markets_usd_millions AS DOUBLE)) AS total_proceeds_usd_m,
                       AVG(TRY_CAST(percent_change_offer_price_to_closing_price_at_offerfirst_trade AS DOUBLE)) AS avg_first_day_return_pct
                FROM sdc_ipo WHERE {where}
                GROUP BY 1 ORDER BY 1
            """, params).fetchdf()
        finally:
            con.close()

    def __repr__(self):
        path = os.path.join(self.base_dir, 'sdc_ipo.duckdb')
        exists = "OK" if os.path.exists(path) else "MISSING"
        return f"SDCIPOClient (452K IPOs, 1963-2024): {exists}"


class USHousingClient:
    """
    US Housing data client backed by DuckDB.

    839,313 property listings across all 50 US states (Zillow data).
    5 tables: properties (116 cols), price_history, tax_history, schools, meta_columns.

    Ideal for hedonic pricing models, housing market analysis, spatial econometrics,
    property valuation, and real estate research.

    Usage:
        housing.info()                                      -> row counts, state coverage
        housing.tables()                                    -> list all tables
        housing.columns(table='properties')                 -> column names for a table
        housing.search_columns('price')                     -> find columns matching keyword
        housing.describe_column('home_type')                -> unique values & counts
        housing.sample(5)                                   -> random sample of 5 properties (key columns)
        housing.get(state='FL', city='Miami', home_type='SINGLE_FAMILY', min_price=200000, max_price=500000, limit=1000)
        housing.query("SELECT address_state, AVG(price) FROM properties GROUP BY 1 ORDER BY 2 DESC")
        housing.price_history(zpid=12345678)                -> price history for a property
        housing.tax_history(zpid=12345678)                  -> tax history for a property
        housing.schools(zpid=12345678)                      -> nearby schools for a property
    """

    KEY_COLUMNS = [
        'zpid', 'address_street', 'address_city', 'address_state', 'address_zipcode',
        'price', 'zestimate', 'bedrooms', 'bathrooms', 'living_area_sqft', 'lot_size_sqft',
        'year_built', 'home_type', 'home_status', 'price_per_sqft', 'days_on_zillow',
    ]

    def __init__(self, base_dir=None):
        if base_dir:
            self.base_dir = base_dir
        else:
            candidates = [
                os.path.join(os.getcwd(), 'us_housing_data'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'us_housing_data'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'us_housing_data'),
            ]
            self.base_dir = next((c for c in candidates if os.path.isdir(c)), candidates[0])

    def _connect(self):
        """Get a read-only DuckDB connection."""
        try:
            import duckdb
        except ImportError:
            raise ImportError("duckdb not installed. Run: pip install duckdb")
        path = os.path.join(self.base_dir, 'us_housing.duckdb')
        if not os.path.exists(path):
            raise FileNotFoundError(f"US Housing database not found: {path}")
        return duckdb.connect(path, read_only=True)

    def info(self):
        """Get summary: row counts per table, state coverage, home type distribution."""
        con = self._connect()
        try:
            props = con.execute("SELECT COUNT(*) FROM properties").fetchone()[0]
            states = con.execute("SELECT COUNT(DISTINCT address_state) FROM properties").fetchone()[0]
            cities = con.execute("SELECT COUNT(DISTINCT address_city) FROM properties").fetchone()[0]
            price_hist = con.execute("SELECT COUNT(*) FROM price_history").fetchone()[0]
            tax_hist = con.execute("SELECT COUNT(*) FROM tax_history").fetchone()[0]
            schools = con.execute("SELECT COUNT(*) FROM schools").fetchone()[0]
            top_states = con.execute(
                "SELECT address_state, COUNT(*) as cnt FROM properties GROUP BY 1 ORDER BY 2 DESC LIMIT 10"
            ).fetchall()
            home_types = con.execute(
                "SELECT home_type, COUNT(*) as cnt FROM properties GROUP BY 1 ORDER BY 2 DESC LIMIT 10"
            ).fetchall()
            price_stats = con.execute(
                "SELECT MIN(price), AVG(price), MEDIAN(price), MAX(price) FROM properties WHERE price IS NOT NULL"
            ).fetchone()
            return {
                'properties': props, 'price_history_rows': price_hist,
                'tax_history_rows': tax_hist, 'school_rows': schools,
                'states': states, 'cities': cities,
                'top_states': {r[0]: r[1] for r in top_states},
                'home_types': {r[0]: r[1] for r in home_types},
                'price_min': price_stats[0], 'price_avg': price_stats[1],
                'price_median': price_stats[2], 'price_max': price_stats[3],
            }
        finally:
            con.close()

    def tables(self):
        """List all tables in the database."""
        con = self._connect()
        try:
            return [r[0] for r in con.execute("SHOW TABLES").fetchall()]
        finally:
            con.close()

    def columns(self, table='properties'):
        """List all column names and types for a table."""
        con = self._connect()
        try:
            cols = con.execute(f"DESCRIBE {table}").fetchall()
            return [(c[0], c[1]) for c in cols]
        finally:
            con.close()

    def search_columns(self, keyword, table='properties'):
        """Search column names matching a keyword (case-insensitive)."""
        con = self._connect()
        try:
            cols = con.execute(f"DESCRIBE {table}").fetchall()
            kw = keyword.lower()
            return [(c[0], c[1]) for c in cols if kw in c[0].lower()]
        finally:
            con.close()

    def describe_column(self, column, table='properties'):
        """Get unique value counts and top 20 values for a column."""
        con = self._connect()
        try:
            n_unique = con.execute(f"SELECT COUNT(DISTINCT {column}) FROM {table}").fetchone()[0]
            n_null = con.execute(f"SELECT COUNT(*) FROM {table} WHERE {column} IS NULL").fetchone()[0]
            top = con.execute(
                f"SELECT {column}, COUNT(*) as cnt FROM {table} WHERE {column} IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 20"
            ).fetchall()
            return {'unique': n_unique, 'nulls': n_null, 'top_20': {str(r[0]): r[1] for r in top}}
        finally:
            con.close()

    def sample(self, n=5):
        """Random sample of n properties (key columns). Returns pandas DataFrame."""
        con = self._connect()
        try:
            cols_str = ', '.join(self.KEY_COLUMNS)
            return con.execute(f"SELECT {cols_str} FROM properties USING SAMPLE {n}").fetchdf()
        finally:
            con.close()

    def get(self, state=None, city=None, zipcode=None, home_type=None, home_status=None,
            min_price=None, max_price=None, min_sqft=None, max_sqft=None,
            min_bedrooms=None, max_bedrooms=None, min_year_built=None, max_year_built=None,
            columns=None, limit=5000):
        """Filtered query on properties table. Returns pandas DataFrame."""
        con = self._connect()
        try:
            cols_str = ', '.join(columns) if columns else '*'
            where = []
            params = []
            if state:
                where.append("address_state = ?")
                params.append(state)
            if city:
                where.append("address_city ILIKE ?")
                params.append(f"%{city}%")
            if zipcode:
                where.append("address_zipcode = ?")
                params.append(str(zipcode))
            if home_type:
                where.append("home_type = ?")
                params.append(home_type)
            if home_status:
                where.append("home_status = ?")
                params.append(home_status)
            if min_price is not None:
                where.append("price >= ?")
                params.append(min_price)
            if max_price is not None:
                where.append("price <= ?")
                params.append(max_price)
            if min_sqft is not None:
                where.append("living_area_sqft >= ?")
                params.append(min_sqft)
            if max_sqft is not None:
                where.append("living_area_sqft <= ?")
                params.append(max_sqft)
            if min_bedrooms is not None:
                where.append("bedrooms >= ?")
                params.append(min_bedrooms)
            if max_bedrooms is not None:
                where.append("bedrooms <= ?")
                params.append(max_bedrooms)
            if min_year_built is not None:
                where.append("year_built >= ?")
                params.append(min_year_built)
            if max_year_built is not None:
                where.append("year_built <= ?")
                params.append(max_year_built)
            where_clause = " AND ".join(where) if where else "1=1"
            sql = f"SELECT {cols_str} FROM properties WHERE {where_clause} LIMIT {limit}"
            return con.execute(sql, params).fetchdf()
        finally:
            con.close()

    def price_history(self, zpid):
        """Get price history for a property by zpid. Returns pandas DataFrame."""
        con = self._connect()
        try:
            return con.execute("SELECT * FROM price_history WHERE zpid = ?", [zpid]).fetchdf()
        finally:
            con.close()

    def tax_history(self, zpid):
        """Get tax history for a property by zpid. Returns pandas DataFrame."""
        con = self._connect()
        try:
            return con.execute("SELECT * FROM tax_history WHERE zpid = ?", [zpid]).fetchdf()
        finally:
            con.close()

    def schools(self, zpid):
        """Get nearby schools for a property by zpid. Returns pandas DataFrame."""
        con = self._connect()
        try:
            return con.execute("SELECT * FROM schools WHERE zpid = ?", [zpid]).fetchdf()
        finally:
            con.close()

    def query(self, sql):
        """Run arbitrary SQL on the US Housing database. Returns pandas DataFrame."""
        con = self._connect()
        try:
            return con.execute(sql).fetchdf()
        finally:
            con.close()

    def __repr__(self):
        path = os.path.join(self.base_dir, 'us_housing.duckdb')
        exists = "OK" if os.path.exists(path) else "MISSING"
        return f"USHousingClient (839K properties, 50 US states): {exists}"


class CustomPythonExecutor:
    """Executor for custom Python code with FMP & FRED API access"""

    def __init__(self, fmp_api_key=None, fred_api_key=None, eodhd_api_key=None, anthropic_api_key=None, openrouter_api_key=None):
        self.fmp_api_key = fmp_api_key or os.getenv('FMP_API_KEY')
        self.fmp = FMPClient(self.fmp_api_key) if FMPClient and self.fmp_api_key else None
        self.fred_api_key = fred_api_key or os.getenv('FRED_API_KEY')
        self.fred = FREDClient(self.fred_api_key) if FREDClient and self.fred_api_key else None
        self.eodhd_api_key = eodhd_api_key or os.getenv('EODHD_API_KEY')
        self.eodhd = EODHDClient(self.eodhd_api_key) if self.eodhd_api_key else None
        self.anthropic_api_key = anthropic_api_key or os.getenv('ANTHROPIC_API_KEY')
        self.claude = ClaudeClient(self.anthropic_api_key) if self.anthropic_api_key else None
        self.openrouter_api_key = openrouter_api_key or os.getenv('OPENROUTER_API_KEY')
        self.openrouter = OpenRouterClient(self.openrouter_api_key) if self.openrouter_api_key else None
        self.wb = WorldBankClient()
        self.imf = IMFClient()
        self.oecd = OECDClient()
        self.polymarket = PolymarketClient()
        self.output_text = []
        self.figures = []
        self.files = []
        self.metadata_entries = []
        self.data_dir = tempfile.mkdtemp(prefix='autoscholar_data_')

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
            # Create bound wrappers for the export functions that pass self.files
            def save_excel(data, filename='analysis.xlsx', sheet_name='Sheet1', index=False,
                           title=None, summary=True, conditional_formatting=True, formulas=None):
                return _save_excel_impl(self.files, data, filename=filename, sheet_name=sheet_name,
                                        index=index, title=title, summary=summary,
                                        conditional_formatting=conditional_formatting, formulas=formulas)

            def save_word(content, filename='document.docx'):
                return _save_word_impl(self.files, content, filename=filename)

            def save_latex(content, filename='report.pdf', figures='auto', template='financial',
                           author=None, company=None, logo=None, title=None, bibtex=None, **kwargs):
                return _save_latex_impl(self.files, content, filename=filename, figures=figures,
                                        template=template, author=author, company=company,
                                        logo=logo, title=title, bibtex=bibtex, **kwargs)

            # ── Data provenance helpers (Reproducible Research Engine) ──

            def save_raw_data(data, filename, source='unknown', method='api', agent=None, description=None):
                """Save raw data with provenance metadata for reproducibility.

                Args:
                    data: DataFrame, dict, or list to save
                    filename: Output filename (e.g. 'stock_prices.csv')
                    source: Data source identifier (e.g. 'EODHD API', 'https://...')
                    method: 'api' or 'web'
                    agent: Agent name (e.g. 'turing')
                    description: Optional description of the data
                Returns:
                    filepath of the saved data file
                """
                subdir = 'raw/web' if method in ('web', 'scrape') else 'raw/api'
                out_dir = os.path.join(self.data_dir, subdir)
                os.makedirs(out_dir, exist_ok=True)

                # Convert to DataFrame if needed
                if isinstance(data, (dict, list)):
                    data = pd.DataFrame(data)

                stem, ext = os.path.splitext(filename)
                if not ext:
                    ext = '.csv'
                    filename = stem + ext

                filepath = os.path.join(out_dir, filename)
                if ext.lower() == '.parquet':
                    data.to_parquet(filepath, index=False)
                else:
                    data.to_csv(filepath, index=False)

                # Create provenance metadata
                meta = {
                    'source': source,
                    'timestamp': datetime.now().isoformat(),
                    'method': method,
                    'agent': agent or 'turing',
                    'transformation': 'none',
                    'rows': int(len(data)),
                    'columns': int(len(data.columns)) if hasattr(data, 'columns') else 0,
                    'filename': filename,
                    'description': description,
                }
                meta_path = os.path.join(out_dir, f'{stem}_metadata.json')
                with open(meta_path, 'w') as f:
                    json.dump(meta, f, indent=2, default=str)

                # Track files for ZIP inclusion
                self.files.append({'filename': filename, 'filepath': filepath, 'data_type': subdir})
                self.files.append({'filename': f'{stem}_metadata.json', 'filepath': meta_path, 'data_type': subdir})
                self.metadata_entries.append(meta)

                self._custom_print(f"[DATA] Saved {subdir}/{filename} ({len(data)} rows) — source: {source}")
                return filepath

            def save_processed_data(data, filename, source_files=None, transformation=None, agent=None):
                """Save processed/cleaned data with lineage metadata.

                Args:
                    data: DataFrame to save
                    filename: Output filename (e.g. 'final_dataset.csv')
                    source_files: List of raw filenames this derives from
                    transformation: Description of transformations applied
                    agent: Agent name (e.g. 'newton')
                Returns:
                    filepath of the saved data file
                """
                out_dir = os.path.join(self.data_dir, 'processed')
                os.makedirs(out_dir, exist_ok=True)

                if isinstance(data, (dict, list)):
                    data = pd.DataFrame(data)

                stem, ext = os.path.splitext(filename)
                if not ext:
                    ext = '.csv'
                    filename = stem + ext

                filepath = os.path.join(out_dir, filename)
                if ext.lower() == '.parquet':
                    data.to_parquet(filepath, index=False)
                else:
                    data.to_csv(filepath, index=False)

                # Also save parquet version alongside CSV for reproducibility
                if ext.lower() == '.csv':
                    try:
                        data.to_parquet(os.path.join(out_dir, f'{stem}.parquet'), index=False)
                        pq_path = os.path.join(out_dir, f'{stem}.parquet')
                        self.files.append({'filename': f'{stem}.parquet', 'filepath': pq_path, 'data_type': 'processed'})
                    except Exception:
                        pass  # pyarrow may not be available

                meta = {
                    'source': 'processed',
                    'timestamp': datetime.now().isoformat(),
                    'method': 'pipeline',
                    'agent': agent or 'newton',
                    'transformation': transformation or 'cleaned and merged',
                    'source_files': source_files or [],
                    'rows': int(len(data)),
                    'columns': int(len(data.columns)) if hasattr(data, 'columns') else 0,
                    'filename': filename,
                }
                meta_path = os.path.join(out_dir, f'{stem}_metadata.json')
                with open(meta_path, 'w') as f:
                    json.dump(meta, f, indent=2, default=str)

                self.files.append({'filename': filename, 'filepath': filepath, 'data_type': 'processed'})
                self.files.append({'filename': f'{stem}_metadata.json', 'filepath': meta_path, 'data_type': 'processed'})
                self.metadata_entries.append(meta)

                self._custom_print(f"[DATA] Saved processed/{filename} ({len(data)} rows) — {transformation or 'processed'}")
                return filepath

            def save_metadata(metadata_dict, filename):
                """Save arbitrary metadata JSON for reproducibility.

                Args:
                    metadata_dict: Dictionary to save as JSON
                    filename: Output filename (e.g. 'pipeline_config.json')
                Returns:
                    filepath of the saved metadata file
                """
                out_dir = os.path.join(self.data_dir, 'metadata')
                os.makedirs(out_dir, exist_ok=True)
                filepath = os.path.join(out_dir, filename)
                with open(filepath, 'w') as f:
                    json.dump(metadata_dict, f, indent=2, default=str)
                self.files.append({'filename': filename, 'filepath': filepath, 'data_type': 'metadata'})
                self.metadata_entries.append(metadata_dict)
                return filepath

            # ── Structured results store ──
            # Lets Fisher scripts export regression results as structured data
            # so Claude can extract exact numbers without parsing text.
            _structured_results = []

            def _store_results(model_name, model_obj=None, **kwargs):
                """Store structured regression/test results for Claude.

                Usage 1 — pass a statsmodels result object:
                    store_results("OLS Baseline", model)

                Usage 2 — pass explicit values:
                    store_results("Breusch-Pagan", statistic=12.3, p_value=0.002, interpretation="Reject H0")
                """
                entry = {'model': model_name}

                if model_obj is not None:
                    try:
                        # Extract from statsmodels-like result objects
                        params = model_obj.params
                        entry['coefficients'] = {}
                        # Handle both Series (named) and ndarray (positional)
                        is_series = hasattr(params, 'index')
                        if is_series:
                            var_names = [str(v) for v in params.index]
                        else:
                            var_names = [f'x{i}' for i in range(len(params))]
                        for i, var in enumerate(var_names):
                            key = var if is_series else i  # Series uses label, array uses int
                            coef_entry = {'coef': float(params[key])}
                            if hasattr(model_obj, 'bse'):
                                coef_entry['se'] = float(model_obj.bse[key])
                            if hasattr(model_obj, 'tvalues'):
                                coef_entry['t'] = float(model_obj.tvalues[key])
                            if hasattr(model_obj, 'pvalues'):
                                p = float(model_obj.pvalues[key])
                                coef_entry['p'] = p
                                if p < 0.01:
                                    coef_entry['stars'] = '***'
                                elif p < 0.05:
                                    coef_entry['stars'] = '**'
                                elif p < 0.10:
                                    coef_entry['stars'] = '*'
                            entry['coefficients'][str(var)] = coef_entry
                        if hasattr(model_obj, 'nobs'):
                            entry['N'] = int(model_obj.nobs)
                        if hasattr(model_obj, 'rsquared'):
                            entry['R2'] = float(model_obj.rsquared)
                        if hasattr(model_obj, 'rsquared_adj'):
                            entry['R2_adj'] = float(model_obj.rsquared_adj)
                        if hasattr(model_obj, 'fvalue') and model_obj.fvalue is not None:
                            entry['F_stat'] = float(model_obj.fvalue)
                        if hasattr(model_obj, 'f_pvalue') and model_obj.f_pvalue is not None:
                            entry['F_pvalue'] = float(model_obj.f_pvalue)
                        if hasattr(model_obj, 'aic'):
                            entry['AIC'] = float(model_obj.aic)
                        if hasattr(model_obj, 'bic'):
                            entry['BIC'] = float(model_obj.bic)
                    except Exception:
                        pass

                # Merge any explicit kwargs
                entry.update({k: v for k, v in kwargs.items() if v is not None})
                _structured_results.append(entry)

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
                'wb': self.wb,
                'imf': self.imf,
                'oecd': self.oecd,
                'polymarket': self.polymarket,
                'claude': self.claude,
                'openrouter': self.openrouter,
                'hfdb': HFDataClient(),
                'optdb': OptionsDataClient(),
                'sdc_ipo': SDCIPOClient(),
                'housing': USHousingClient(),
                # Custom print
                'print': self._custom_print,
                # Structured results export
                'store_results': _store_results,
                # Journal of Finance style palette (pre-set in rcParams, also accessible directly)
                'JF_COLORS': _JF_COLORS,
                'mticker': mticker,
                # File export helpers
                'save_excel': save_excel,
                'save_word': save_word,
                'save_latex': save_latex,
                'df_to_latex': df_to_latex,
                # Data provenance helpers (Reproducible Research Engine)
                'save_raw_data': save_raw_data,
                'save_processed_data': save_processed_data,
                'save_metadata': save_metadata,
                'DATA_DIR': self.data_dir,
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

                # ── Auto-capture DataFrames not explicitly saved ──────────
                # Scans exec namespace for pd.DataFrame variables that weren't
                # already saved via save_raw_data / save_processed_data, and
                # persists them so they end up in the project ZIP.
                saved_filenames = {f['filename'] for f in self.files}
                _auto_save_skip = {
                    'pd', 'np', 'plt', 'sns', 'scipy', 'os', 'sys', 'json',
                    'math', 'datetime', 're', 'io', 'base64', 'warnings',
                    'fmp', 'fred', 'eodhd', 'wb', 'imf', 'oecd', 'polymarket',
                    'claude', 'openrouter', 'hfdb', 'optdb', 'sdc_ipo', 'housing',
                    'save_raw_data', 'save_processed_data', 'save_metadata',
                    'save_excel', 'save_word', 'save_latex', 'store_results',
                    'df_to_latex', 'print', 'DATA_DIR', 'JF_COLORS', 'mticker',
                    'convert_to_datetime', 'safe_strftime', '__builtins__',
                }
                try:
                    for var_name, var_val in exec_globals.items():
                        if var_name.startswith('_') or var_name in _auto_save_skip:
                            continue
                        if isinstance(var_val, pd.DataFrame) and len(var_val) > 0:
                            # Sanitize filename
                            safe_name = var_name.replace(' ', '_')[:60]
                            csv_name = f'{safe_name}.csv'
                            if csv_name not in saved_filenames:
                                out_dir = os.path.join(self.data_dir, 'processed')
                                os.makedirs(out_dir, exist_ok=True)
                                fpath = os.path.join(out_dir, csv_name)
                                try:
                                    var_val.to_csv(fpath, index=False)
                                    self.files.append({'filename': csv_name, 'filepath': fpath, 'data_type': 'processed'})
                                    saved_filenames.add(csv_name)
                                    self._custom_print(f"[AUTO-SAVE] {csv_name} ({len(var_val)} rows)")
                                except Exception:
                                    pass  # skip unsaveable DataFrames
                except Exception:
                    pass  # never let auto-save crash the executor

            # Get captured output
            stdout_text = stdout_capture.getvalue()
            stderr_text = stderr_capture.getvalue()

            combined_output = '\n'.join(self.output_text)
            if stdout_text:
                combined_output += '\n' + stdout_text
            if stderr_text and not stderr_text.strip().startswith('WARNING'):
                combined_output += '\nStderr: ' + stderr_text

            # Append structured results if any were stored via store_results()
            if _structured_results:
                combined_output += '\n\n=== STRUCTURED RESULTS (use exact numbers for LaTeX tables) ===\n'
                combined_output += json.dumps(_structured_results, indent=2, default=str)

            return {
                'success': True,
                'output': combined_output.strip(),
                'result': result_value,
                'figures': self.figures,
                'files': self.files,
                'metadata': self.metadata_entries,
                'error': None
            }

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}\n\n{traceback.format_exc()}"

            # Smart suggestions for common errors
            suggestions = []
            if isinstance(e, ModuleNotFoundError):
                missing_module = str(e).replace("No module named '", "").replace("'", "").split('.')[0]
                MODULE_ALTERNATIVES = {
                    'torch': 'Use sklearn.ensemble.GradientBoostingRegressor, xgboost, or lightgbm instead of PyTorch neural networks',
                    'pytorch': 'Use sklearn.ensemble.GradientBoostingRegressor, xgboost, or lightgbm instead of PyTorch',
                    'tensorflow': 'Use sklearn, xgboost, or lightgbm instead of TensorFlow',
                    'tf': 'Use sklearn, xgboost, or lightgbm instead of TensorFlow',
                    'keras': 'Use sklearn, xgboost, or lightgbm instead of Keras',
                    'jax': 'Use numpy + scipy for numerical computing instead of JAX',
                    'flax': 'Use sklearn instead of Flax',
                    'transformers': 'Use sklearn or statsmodels instead of HuggingFace Transformers',
                    'catboost': 'Use xgboost (xgb) or lightgbm (lgb) instead — both are available',
                    'prophet': 'Use statsmodels ARIMA or arch GARCH for time series forecasting',
                    'pmdarima': 'Use statsmodels ARIMA with manual order selection',
                    'darts': 'Use statsmodels or sklearn with rolling window features',
                    'sktime': 'Use sklearn with manual feature engineering for time series',
                    'optuna': 'Use sklearn.model_selection.GridSearchCV or RandomizedSearchCV',
                    'polars': 'Use pandas (pd) instead — same functionality',
                    'pyspark': 'Use pandas (pd) instead for single-machine data',
                }
                alt = MODULE_ALTERNATIVES.get(missing_module)
                if alt:
                    suggestions.append(f"💡 SUGGESTION: {alt}")
                else:
                    suggestions.append(f"💡 Module '{missing_module}' is not installed. Available packages: sklearn, xgboost, lightgbm, statsmodels, arch, scipy, linearmodels, pyfixest, pingouin, shap, pymc, dowhy")
                suggestions.append(f"📦 Available packages: numpy, pandas, matplotlib, scipy, sklearn, statsmodels, arch, xgboost, lightgbm, seaborn, plotly, cvxpy, pypfopt, yfinance, ta, numba, networkx, sympy, linearmodels (PanelOLS/RandomEffects/IV2SLS/IVGMM), pyfixest (feols/fepois TWFE/DiD), VECM, QuantReg, coint, EGARCH, StudentsT, pingouin, shap, dowhy/CausalModel")

            elif isinstance(e, TypeError) and 'fillna' in str(e) and 'method' in str(e):
                suggestions.append("💡 FIX: fillna(method='ffill') is deprecated in Pandas 2.2+. Use df.ffill() or df.bfill() instead")

            elif isinstance(e, TypeError) and 'append' in str(e):
                suggestions.append("💡 FIX: DataFrame.append() is removed in Pandas 2.0+. Use pd.concat([df, new_row]) instead")

            if suggestions:
                error_msg += "\n\n" + "\n".join(suggestions)

            return {
                'success': False,
                'output': '\n'.join(self.output_text),
                'result': None,
                'figures': self.figures,
                'files': self.files,
                'metadata': self.metadata_entries,
                'error': error_msg
            }

    def _custom_print(self, *args, **kwargs):
        """Custom print function to capture output"""
        output = ' '.join(str(arg) for arg in args)
        self.output_text.append(output)

    def _is_figure_empty(self, fig):
        """Check if a matplotlib figure is empty (no meaningful content drawn)."""
        return is_figure_empty(fig)

    def _capture_figures(self):
        """Capture all matplotlib figures as base64 images, skipping empty ones"""
        capture_figures(self.figures, self.output_text, self._custom_print)


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
        anthropic_api_key = input_data.get('anthropic_api_key') or os.getenv('ANTHROPIC_API_KEY')
        openrouter_api_key = input_data.get('openrouter_api_key') or os.getenv('OPENROUTER_API_KEY')

        if not code:
            print(json.dumps({
                'success': False,
                'error': 'No code provided'
            }))
            return

        # Execute the code
        executor = CustomPythonExecutor(fmp_api_key=fmp_api_key, fred_api_key=fred_api_key, eodhd_api_key=eodhd_api_key, anthropic_api_key=anthropic_api_key, openrouter_api_key=openrouter_api_key)
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
