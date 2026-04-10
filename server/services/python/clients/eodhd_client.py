"""EODHD API client class — intraday historical data + US options chains with Greeks."""

import pandas as pd


class EODHDClient:
    """EODHD API client — intraday historical data + US options chains with Greeks.

    Ticker format:  always use exchange suffix, e.g. 'AAPL.US', 'MSFT.US', 'SPY.US'.
    Bare tickers like 'AAPL' are auto-converted to 'AAPL.US'.

    Date/time inputs: all methods accept any of these for date parameters:
        - Unix timestamp (int or float)
        - ISO date string: 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'
        - Python datetime / pandas Timestamp / numpy datetime64

    Timezone note: EODHD returns datetimes in the exchange's local time (not UTC).
    For US intraday, times are already in US/Eastern — no conversion needed.
    """

    BASE_URL = 'https://eodhd.com/api'

    def __init__(self, api_key):
        self.api_key = api_key

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _request(self, endpoint, params=None):
        import requests
        if params is None:
            params = {}
        params.setdefault('api_token', self.api_key)
        params.setdefault('fmt', 'json')
        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        return response.json()

    @staticmethod
    def _to_unix(value):
        """Convert any date/time representation to a Unix timestamp (int).

        Accepts: int/float (already a timestamp), str ('YYYY-MM-DD' or
        'YYYY-MM-DD HH:MM:SS'), datetime, pd.Timestamp, np.datetime64.
        Returns None if value is None.
        """
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return int(value)
        # string → pd.Timestamp → unix
        ts = pd.Timestamp(value)
        # if tz-naive assume local time
        if ts.tzinfo is None:
            ts = ts.tz_localize('UTC')
        return int(ts.timestamp())

    @staticmethod
    def _normalize_ticker(ticker):
        """Append '.US' exchange suffix when no suffix is present.

        Examples:  'AAPL' → 'AAPL.US',  'AAPL.US' → 'AAPL.US'
        Non-US tickers already have a suffix: 'VOD.LSE' → unchanged.
        """
        return ticker if '.' in ticker else ticker + '.US'

    # ── Intraday ──────────────────────────────────────────────────────────────

    def get_intraday(self, ticker, interval='5m',
                     from_ts=None, to_ts=None,
                     from_date=None, to_date=None):
        """Fetch intraday OHLCV bars from EODHD.

        Args:
            ticker    : e.g. 'AAPL.US' or bare 'AAPL' (auto-normalized)
            interval  : '1m' (US only, since 2004), '5m', or '1h'
            from_ts   : start — Unix int, 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM', or datetime
            to_ts     : end   — same formats
            from_date : alias for from_ts
            to_date   : alias for to_ts

        Returns:
            list of dicts — datetime (exchange local time), gmtoffset,
            open, high, low, close, volume

        Note:
            Each request costs 5 EODHD API credits.
            For FOMC / event studies, pass exact window timestamps to limit data.
        """
        ticker = self._normalize_ticker(ticker)
        start = self._to_unix(from_ts or from_date)
        end   = self._to_unix(to_ts   or to_date)

        params = {'interval': interval}
        if start is not None:
            params['from'] = start
        if end is not None:
            params['to'] = end

        data = self._request(f'/intraday/{ticker}', params)

        if not data:
            print(f"⚠️  EODHD intraday: empty response for {ticker} "
                  f"(interval={interval}, from={from_ts or from_date}, to={to_ts or to_date}).\n"
                  f"   → Check ticker (needs '.US' suffix for US stocks) and date range.\n"
                  f"   → 1m data available for US stocks since 2004; 5m/1h since 2020.")
        return data if isinstance(data, list) else []

    def get_intraday_df(self, ticker, interval='5m',
                        from_ts=None, to_ts=None,
                        from_date=None, to_date=None):
        """Same as get_intraday() but returns a pandas DataFrame.

        Returns a DataFrame indexed by datetime (exchange local time, tz-naive)
        with columns: open, high, low, close, volume.
        Sorted ascending by time.

        Note on timezones:
            EODHD returns US intraday times already in US/Eastern (NYSE/NASDAQ).
            No conversion is needed for FOMC event studies — 14:00 ET in the
            data is exactly 14:00 Federal Reserve announcement time.
        """
        data = self.get_intraday(ticker, interval=interval,
                                 from_ts=from_ts, to_ts=to_ts,
                                 from_date=from_date, to_date=to_date)
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df['datetime'] = pd.to_datetime(df['datetime'])
        df = df.set_index('datetime').sort_index()
        for col in ['open', 'high', 'low', 'close', 'volume']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        return df

    # ── End-of-Day ────────────────────────────────────────────────────────────

    def get_eod(self, ticker, from_date=None, to_date=None, period='d', order='a'):
        """Fetch EOD historical prices.

        Args:
            ticker   : e.g. 'AAPL.US' or bare 'AAPL'
            from_date: start — 'YYYY-MM-DD', datetime, or Unix timestamp
            to_date  : end   — same formats
            period   : 'd' daily (default), 'w' weekly, 'm' monthly
            order    : 'a' ascending (default), 'd' descending

        Returns:
            list of dicts with date, open, high, low, close, adjusted_close, volume
        """
        ticker = self._normalize_ticker(ticker)
        params = {'period': period, 'order': order}
        # EOD endpoint uses YYYY-MM-DD strings (not Unix timestamps)
        if from_date is not None:
            v = from_date
            if isinstance(v, (int, float)):
                v = pd.Timestamp(v, unit='s').strftime('%Y-%m-%d')
            elif hasattr(v, 'strftime'):
                v = v.strftime('%Y-%m-%d')
            else:
                v = str(pd.Timestamp(v).date())
            params['from'] = v
        if to_date is not None:
            v = to_date
            if isinstance(v, (int, float)):
                v = pd.Timestamp(v, unit='s').strftime('%Y-%m-%d')
            elif hasattr(v, 'strftime'):
                v = v.strftime('%Y-%m-%d')
            else:
                v = str(pd.Timestamp(v).date())
            params['to'] = v
        return self._request(f'/eod/{ticker}', params)

    def get_eod_df(self, ticker, from_date=None, to_date=None, period='d', order='a'):
        """Same as get_eod() but returns a pandas DataFrame with a DatetimeIndex."""
        data = self.get_eod(ticker, from_date=from_date, to_date=to_date,
                            period=period, order=order)
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date').sort_index()
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
