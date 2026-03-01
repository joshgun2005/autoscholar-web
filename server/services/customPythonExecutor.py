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


class CustomPythonExecutor:
    """Executor for custom Python code with FMP & FRED API access"""

    def __init__(self, fmp_api_key=None, fred_api_key=None):
        self.fmp_api_key = fmp_api_key or os.getenv('FMP_API_KEY')
        self.fmp = FMPClient(self.fmp_api_key) if FMPClient and self.fmp_api_key else None
        self.fred_api_key = fred_api_key or os.getenv('FRED_API_KEY')
        self.fred = FREDClient(self.fred_api_key) if FREDClient and self.fred_api_key else None
        self.output_text = []
        self.figures = []

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
                # Custom print
                'print': self._custom_print,
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
                'error': None
            }

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}\n\n{traceback.format_exc()}"
            return {
                'success': False,
                'output': '\n'.join(self.output_text),
                'result': None,
                'figures': self.figures,
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
            # Add VibeQuant watermark — bottom-right, teal, subtle
            fig.text(
                0.99, 0.01, 'VibeQuant',
                fontsize=9, color='#119993', alpha=0.6,
                ha='right', va='bottom',
                transform=fig.transFigure,
                fontweight='bold', style='italic'
            )

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

        if not code:
            print(json.dumps({
                'success': False,
                'error': 'No code provided'
            }))
            return

        # Execute the code
        executor = CustomPythonExecutor(fmp_api_key=fmp_api_key, fred_api_key=fred_api_key)
        result = executor.execute(code, context)

        # Return result as JSON
        print(json.dumps(result, default=str))  # default=str to handle datetime, etc.

    except Exception as e:
        error_result = {
            'success': False,
            'error': f'Executor error: {str(e)}\n{traceback.format_exc()}',
            'output': '',
            'result': None,
            'figures': []
        }
        print(json.dumps(error_result))


if __name__ == '__main__':
    main()
