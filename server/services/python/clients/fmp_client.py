"""FMP (Financial Modeling Prep) API client class — uses /stable endpoints."""


class FMPClient:
    """Comprehensive FMP API client for Python custom code (stable API)"""

    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://financialmodelingprep.com/stable'

    def _request(self, endpoint, params=None):
        """Make API request to the stable endpoint"""
        import requests
        if params is None:
            params = {}
        params['apikey'] = self.api_key

        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        return response.json()

    # ===== MOST USED METHODS =====

    def get_quote(self, symbol):
        """Get current stock quote"""
        data = self._request('/quote', {'symbol': symbol})
        return data[0] if data else None

    def get_historical_prices(self, symbol, from_date=None, to_date=None):
        """Get historical prices - returns dict with 'historical' array"""
        params = {'symbol': symbol}
        if from_date:
            params['from'] = from_date
        if to_date:
            params['to'] = to_date
        data = self._request('/historical-price-eod/full', params)
        # Normalize to the same shape the rest of the codebase expects
        if isinstance(data, list):
            return {'symbol': symbol, 'historical': data}
        return data

    def get_income_statement(self, symbol, period='annual', limit=5):
        """Get income statement"""
        return self._request('/income-statement', {'symbol': symbol, 'period': period, 'limit': limit})

    def get_balance_sheet(self, symbol, period='annual', limit=5):
        """Get balance sheet"""
        return self._request('/balance-sheet-statement', {'symbol': symbol, 'period': period, 'limit': limit})

    def get_cash_flow(self, symbol, period='annual', limit=5):
        """Get cash flow statement"""
        return self._request('/cash-flow-statement', {'symbol': symbol, 'period': period, 'limit': limit})

    def get_key_metrics(self, symbol, period='annual', limit=5):
        """Get key metrics"""
        return self._request('/key-metrics', {'symbol': symbol, 'period': period, 'limit': limit})

    def get_financial_ratios(self, symbol, period='annual', limit=5):
        """Get financial ratios"""
        return self._request('/ratios', {'symbol': symbol, 'period': period, 'limit': limit})

    def get_company_profile(self, symbol):
        """Get company profile"""
        return self._request('/profile', {'symbol': symbol})

    def get_stock_news(self, symbol, limit=20):
        """Get stock news"""
        return self._request('/news/stock', {'symbol': symbol, 'limit': limit})

    def get_rsi(self, symbol, period=14, time_period='daily'):
        """Compute RSI from historical prices (technical_indicator endpoint
        is not available on /stable, so we calculate manually)."""
        import numpy as np
        hist = self.get_historical_prices(symbol)
        prices = [d['close'] for d in hist.get('historical', [])[:200]]
        if len(prices) < period + 1:
            return []
        prices = list(reversed(prices))  # oldest first
        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0.0)
        losses = np.where(deltas < 0, -deltas, 0.0)
        avg_gain = np.mean(gains[:period])
        avg_loss = np.mean(losses[:period])
        results = []
        for i in range(period, len(deltas)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
            rs = avg_gain / avg_loss if avg_loss != 0 else 100
            rsi = 100 - (100 / (1 + rs))
            results.append({'rsi': round(rsi, 4)})
        return results[-10:]  # Most recent 10

    def get_macd(self, symbol, time_period='daily', fast=12, slow=26, signal=9):
        """Compute MACD from historical prices (technical_indicator endpoint
        is not available on /stable, so we calculate manually)."""
        import numpy as np
        hist = self.get_historical_prices(symbol)
        prices = np.array([d['close'] for d in hist.get('historical', [])[:200]])
        if len(prices) < slow + signal:
            return []
        prices = prices[::-1]  # oldest first

        def ema(data, span):
            alpha = 2 / (span + 1)
            out = np.empty_like(data)
            out[0] = data[0]
            for i in range(1, len(data)):
                out[i] = alpha * data[i] + (1 - alpha) * out[i - 1]
            return out

        ema_fast = ema(prices, fast)
        ema_slow = ema(prices, slow)
        macd_line = ema_fast - ema_slow
        signal_line = ema(macd_line, signal)
        histogram = macd_line - signal_line
        results = []
        for i in range(len(macd_line)):
            results.append({
                'macd': round(float(macd_line[i]), 4),
                'signal': round(float(signal_line[i]), 4),
                'histogram': round(float(histogram[i]), 4),
            })
        return results[-10:]

    def search(self, query, limit=10):
        """Search for companies"""
        return self._request('/search-name', {'query': query, 'limit': limit})
