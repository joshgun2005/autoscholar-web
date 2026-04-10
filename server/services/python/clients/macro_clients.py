"""
Macro data API clients: World Bank, IMF, OECD, Polymarket.
No API keys required — all endpoints are free and public.
"""

import io
import pandas as pd


class WorldBankClient:
    """World Bank Indicators API v2 client — 16,000+ development indicators, 200+ countries.

    No API key required. All data is free and public.

    Common indicator codes:
        SP.POP.TOTL       Population, total
        NY.GDP.MKTP.CD    GDP (current US$)
        NY.GDP.PCAP.CD    GDP per capita (current US$)
        NY.GNP.PCAP.CD    GNI per capita (current US$)
        FP.CPI.TOTL.ZG    Inflation, consumer prices (annual %)
        SL.UEM.TOTL.ZS    Unemployment, total (% of labor force)
        SI.POV.DDAY       Poverty headcount ratio at $1.90/day
        SE.ADT.LITR.ZS    Literacy rate, adult total (%)
        EN.ATM.CO2E.PC    CO2 emissions (metric tons per capita)
        SH.DYN.MORT       Mortality rate, under-5 (per 1,000 live births)
        EG.USE.PCAP.KG.OE Energy use (kg oil equiv per capita)
        NE.EXP.GNFS.ZS    Exports of goods and services (% of GDP)
        BX.KLT.DINV.CD.WD Foreign direct investment, net inflows (BoP, current US$)

    Common country codes: US, CN, IN, BR, FR, DE, JP, GB, ZA, NG
    Aggregate codes: WLD (World), EAP, ECA, LAC, MNA, NAC, SAS, SSA, HIC, LIC
    """

    BASE_URL = 'https://api.worldbank.org/v2'

    def __init__(self):
        pass

    def _request(self, path, params=None):
        import requests
        if params is None:
            params = {}
        params['format'] = 'json'
        params.setdefault('per_page', 1000)
        url = f"{self.BASE_URL}{path}"
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, list) and len(data) > 1:
            return data[1]
        return data

    # ── Indicator data (main method) ──────────────────────────────────────

    def get_indicator(self, indicator_code, country='all',
                      date_range=None, mrv=None, mrnev=None,
                      frequency=None, source=None):
        """Fetch raw indicator data as a list of dicts.

        Args:
            indicator_code: e.g. 'SP.POP.TOTL', 'NY.GDP.MKTP.CD'
            country: ISO2/ISO3 code(s), semicolon-separated, or 'all'
            date_range: year or range, e.g. '2020', '2010:2023'
            mrv: Most Recent Values (int)
            mrnev: Most Recent Non-Empty Values (int)
            frequency: 'Y' yearly, 'Q' quarterly, 'M' monthly
            source: source DB id (e.g. 2 = WDI)

        Returns: list of dicts with keys: indicator, country, countryiso3code, date, value, ...
        """
        path = f"/country/{country}/indicator/{indicator_code}"
        params = {}
        if date_range:
            params['date'] = date_range
        if mrv:
            params['mrv'] = mrv
        if mrnev:
            params['mrnev'] = mrnev
        if frequency:
            params['frequency'] = frequency
        if source:
            params['source'] = source
        return self._request(path, params)

    def get_indicator_df(self, indicator_code, country='all',
                         date_range=None, mrv=None, mrnev=None,
                         frequency=None, source=None):
        """Fetch indicator data as a pandas DataFrame.

        Returns DataFrame with columns: country, country_code, date, value
        Sorted by country then date ascending.
        Missing values (None) are kept as NaN.
        """
        raw = self.get_indicator(
            indicator_code, country=country,
            date_range=date_range, mrv=mrv, mrnev=mrnev,
            frequency=frequency, source=source
        )
        if not raw or not isinstance(raw, list):
            return pd.DataFrame()
        rows = []
        for entry in raw:
            rows.append({
                'country': entry.get('country', {}).get('value', ''),
                'country_code': entry.get('countryiso3code', ''),
                'date': entry.get('date', ''),
                'value': entry.get('value')
            })
        df = pd.DataFrame(rows)
        if df.empty:
            return df
        df['date'] = pd.to_numeric(df['date'], errors='coerce')
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        df = df.sort_values(['country', 'date']).reset_index(drop=True)
        return df

    # ── Multi-indicator helper ────────────────────────────────────────────

    def get_multi_indicators_df(self, indicator_codes, country='all',
                                 date_range=None, mrv=None):
        """Fetch multiple indicators and return a merged wide DataFrame.

        Args:
            indicator_codes: dict mapping indicator_code -> column_name
                e.g. {'SP.POP.TOTL': 'population', 'NY.GDP.MKTP.CD': 'gdp'}
            country, date_range, mrv: same as get_indicator_df

        Returns: DataFrame with columns: country, country_code, date, <col1>, <col2>, ...
        """
        merged = None
        for code, col_name in indicator_codes.items():
            df = self.get_indicator_df(code, country=country,
                                        date_range=date_range, mrv=mrv)
            if df.empty:
                continue
            df = df.rename(columns={'value': col_name})
            if merged is None:
                merged = df
            else:
                merged = pd.merge(merged, df[['country', 'country_code', 'date', col_name]],
                                  on=['country', 'country_code', 'date'], how='outer')
        return merged if merged is not None else pd.DataFrame()

    # ── Country metadata ──────────────────────────────────────────────────

    def get_countries(self, country_code=None, income_level=None, region=None):
        """Get country metadata (region, income level, capital, coordinates).

        Args:
            country_code: ISO2/ISO3 or semicolon-separated, or None for all
            income_level: 'HIC', 'UMC', 'LMC', 'LIC'
            region: 'EAP', 'ECA', 'LCN', 'MNA', 'NAC', 'SAS', 'SSA'
        """
        path = f"/country/{country_code}" if country_code else "/country"
        params = {}
        if income_level:
            params['incomeLevel'] = income_level
        if region:
            params['region'] = region
        return self._request(path, params)

    # ── Topics, Regions, Income Levels ────────────────────────────────────

    def get_topics(self):
        """Get all 21 World Bank topics (Agriculture, Economy, Health, etc.)."""
        return self._request('/topic')

    def get_regions(self):
        """Get all World Bank regions."""
        return self._request('/region')

    def get_income_levels(self):
        """Get income level classifications."""
        return self._request('/incomelevel')

    # ── Indicator search ──────────────────────────────────────────────────

    def search_indicators(self, query, topic_id=None, per_page=100):
        """Search for indicators by keyword.

        Args:
            query: keyword (e.g. 'GDP', 'population', 'CO2')
            topic_id: filter by topic (1-21). See get_topics().

        Returns: list of matching indicator dicts with id, name, sourceNote
        """
        path = f"/topic/{topic_id}/indicator" if topic_id else "/indicator"
        all_indicators = self._request(path, {'per_page': per_page})
        if not isinstance(all_indicators, list):
            return []
        q = query.lower()
        return [ind for ind in all_indicators if
                q in (ind.get('name', '') or '').lower() or
                q in (ind.get('sourceNote', '') or '').lower() or
                q in (ind.get('id', '') or '').lower()][:50]

    # ── Sources ───────────────────────────────────────────────────────────

    def get_sources(self, source_id=None):
        """Get data sources (WDI, IDS, Gender Stats, etc.)."""
        path = f"/sources/{source_id}" if source_id else "/sources"
        return self._request(path)


class IMFClient:
    """IMF Data API client — DataMapper (WEO) + SDMX 3.0 (CPI, IFS, BOP, etc.).

    No API key required. All data is free and public.

    DataMapper API (simple, WEO-focused):
        Common indicator codes (World Economic Outlook):
            NGDP_RPCH      Real GDP growth (annual %)
            PCPIPCH        Inflation, avg consumer prices (annual %)
            LUR            Unemployment rate (%)
            BCA_NGDPD      Current account balance (% of GDP)
            GGXWDG_NGDP    Govt gross debt (% of GDP)
            NGDPD          GDP, current prices (billions USD)
            NGDPDPC        GDP per capita, current prices (USD)
            PPPPC          GDP per capita, PPP (intl $)
            PPPSH          Share of world GDP (PPP, %)
            LP             Population (millions)
            GGR_NGDP       Govt revenue (% of GDP)
            GGX_NGDP       Govt total expenditure (% of GDP)
            GGXCNL_NGDP    Govt net lending/borrowing (% of GDP)
            TM_RPCH        Import volume growth (%)
            TX_RPCH        Export volume growth (%)

    SDMX 3.0 API (advanced, multi-dimensional):
        Common dataflows: CPI, IFS, BOP, DOT, GFSR, FSI, COFER, CDIS
    """

    DATAMAPPER_URL = 'https://www.imf.org/external/datamapper/api/v1'
    SDMX_URL = 'https://api.imf.org/external/sdmx/3.0'

    def __init__(self):
        pass

    # ── DataMapper API (simple WEO data) ──────────────────────────────────

    def get_indicator(self, indicator_id, countries=None, periods=None):
        """Fetch indicator data from IMF DataMapper.

        Args:
            indicator_id: e.g. 'NGDP_RPCH' (real GDP growth), 'PCPIPCH' (inflation)
            countries: ISO3 code(s), slash-separated (e.g. 'USA', 'USA/CHN/DEU'), or None for all
            periods: comma-separated years (e.g. '2020,2021,2022,2023') or None for all

        Returns: dict with 'values' -> indicator -> country -> year -> value
        """
        import requests
        country_path = f"/{countries}" if countries else ''
        url = f"{self.DATAMAPPER_URL}/{indicator_id}{country_path}"
        params = {}
        if periods:
            params['periods'] = periods
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        return response.json()

    def get_indicator_df(self, indicator_id, countries=None, periods=None):
        """Fetch indicator data as a pandas DataFrame.

        Returns DataFrame with columns: country, year, value
        Sorted by country then year ascending.
        """
        raw = self.get_indicator(indicator_id, countries=countries, periods=periods)
        values = raw.get('values', {}).get(indicator_id, {})
        rows = []
        for country_code, year_dict in values.items():
            for year, value in year_dict.items():
                if value is not None:
                    rows.append({
                        'country': country_code,
                        'year': int(year),
                        'value': float(value) if value is not None else None
                    })
        df = pd.DataFrame(rows)
        if df.empty:
            return df
        df = df.sort_values(['country', 'year']).reset_index(drop=True)
        return df

    def get_multi_indicators_df(self, indicator_codes, countries=None, periods=None):
        """Fetch multiple indicators and return a merged wide DataFrame.

        Args:
            indicator_codes: dict mapping indicator_code -> column_name
                e.g. {'NGDP_RPCH': 'gdp_growth', 'PCPIPCH': 'inflation'}
            countries, periods: same as get_indicator_df

        Returns: DataFrame with columns: country, year, <col1>, <col2>, ...
        """
        merged = None
        for code, col_name in indicator_codes.items():
            df = self.get_indicator_df(code, countries=countries, periods=periods)
            if df.empty:
                continue
            df = df.rename(columns={'value': col_name})
            if merged is None:
                merged = df
            else:
                merged = pd.merge(merged, df[['country', 'year', col_name]],
                                  on=['country', 'year'], how='outer')
        return merged if merged is not None else pd.DataFrame()

    def get_indicators(self):
        """List all available DataMapper indicators with labels and descriptions."""
        import requests
        response = requests.get(f"{self.DATAMAPPER_URL}/indicators", timeout=60)
        response.raise_for_status()
        return response.json()

    def get_countries(self):
        """List all countries available in the DataMapper."""
        import requests
        response = requests.get(f"{self.DATAMAPPER_URL}/countries", timeout=60)
        response.raise_for_status()
        return response.json()

    def get_regions(self):
        """List all IMF regions."""
        import requests
        response = requests.get(f"{self.DATAMAPPER_URL}/regions", timeout=60)
        response.raise_for_status()
        return response.json()

    # ── SDMX 3.0 API (advanced) ──────────────────────────────────────────

    def get_sdmx_data(self, dataflow_id, key, time_filter=None):
        """Fetch data via IMF SDMX 3.0 API. Returns CSV string.

        Args:
            dataflow_id: e.g. 'CPI', 'IFS', 'BOP'
            key: dimension key with dots (e.g. 'BRA.CPI._T.IX.M')
                 Use + for multiple values (e.g. 'BRA+CHL')
                 Leave blank between dots for wildcard
            time_filter: e.g. 'ge:2020-M01', 'ge:2020'

        Returns: CSV string (parse with pd.read_csv(io.StringIO(result)))
        """
        import requests
        url = f"{self.SDMX_URL}/data/dataflow/IMF.STA/{dataflow_id}/~/{key}"
        params = {'detail': 'dataonly'}
        if time_filter:
            params['c[TIME_PERIOD]'] = time_filter
        response = requests.get(url, params=params,
                                headers={'Accept': 'text/csv'}, timeout=60)
        response.raise_for_status()
        return response.text

    def get_sdmx_df(self, dataflow_id, key, time_filter=None):
        """Same as get_sdmx_data() but returns a parsed pandas DataFrame."""
        csv_text = self.get_sdmx_data(dataflow_id, key, time_filter=time_filter)
        return pd.read_csv(io.StringIO(csv_text))

    def get_dataflows(self, dataflow_id=None):
        """List available SDMX datasets (dataflows)."""
        import requests
        agency = 'IMF.STA' if dataflow_id else 'all'
        df_id = dataflow_id or 'all'
        url = f"{self.SDMX_URL}/structure/dataflow/{agency}/{df_id}/~"
        response = requests.get(url, headers={'Accept': 'application/json'}, timeout=60)
        response.raise_for_status()
        return response.json()

    def get_data_structure(self, dsd_id):
        """Get dimension structure of a dataset (e.g. 'DSD_CPI')."""
        import requests
        url = f"{self.SDMX_URL}/structure/datastructure/IMF.STA/{dsd_id}/~"
        response = requests.get(url, headers={'Accept': 'application/json'}, timeout=60)
        response.raise_for_status()
        return response.json()

    def get_codelist(self, codelist_id):
        """Get valid codes for a dimension (e.g. 'CL_COUNTRY_CPI')."""
        import requests
        url = f"{self.SDMX_URL}/structure/codelist/IMF.STA/{codelist_id}/~"
        response = requests.get(url, headers={'Accept': 'application/json'}, timeout=60)
        response.raise_for_status()
        return response.json()


class OECDClient:
    """OECD Data API client — 1,475+ SDMX dataflows (economics, health, education, etc.).

    No API key required. All data is free and public.
    Uses the OECD SDMX REST API v1 at https://sdmx.oecd.org/public/rest/

    Key datasets:
        Composite Leading Indicators (CLI): agency='OECD.SDD.STES', dataflow='DSD_STES@DF_CLI'
        National Accounts (GDP):            agency='OECD.SDD.NAD',  dataflow='DSD_NAAG@DF_NAAG_I'
        Consumer Prices:                    agency='OECD.SDD.TPS',  dataflow='DSD_PRICES@DF_PRICES_ALL'
        Health Statistics:                  agency='OECD.ELS.HD',   (various dataflows)
        Education (PISA):                   agency='OECD.EDU.IMEP', (various dataflows)

    Workflow:
        1. search_dataflows('GDP') to find dataset IDs
        2. get_dataflow_structure(agency, dataflow) to see dimensions
        3. get_data_df(agency, dataflow, filter) to fetch data
    """

    BASE_URL = 'https://sdmx.oecd.org/public/rest'

    def __init__(self):
        self._json_header = {
            'Accept': 'application/vnd.sdmx.structure+json; charset=utf-8; version=1.0',
            'Accept-Encoding': 'gzip, deflate, br',
        }

    # ── Data retrieval ────────────────────────────────────────────────────

    def get_data(self, agency_id, dataflow_id, filter_expr,
                 start_period=None, end_period=None, last_n=None, version=None):
        """Fetch OECD data as CSV string with labels.

        Args:
            agency_id: e.g. 'OECD.SDD.STES'
            dataflow_id: e.g. 'DSD_STES@DF_CLI'
            filter_expr: dot-separated dimension filter, e.g. 'FRA.M.LI...AA...H'
                         Use + for multiple values, empty segments for wildcard, 'all' for everything
            start_period: e.g. '2020', '2020-Q1', '2020-M01'
            end_period: e.g. '2024'
            last_n: return only last N observations per series
            version: dataflow version (e.g. '1.0'), default latest

        Returns: CSV string (parse with pd.read_csv(io.StringIO(result)))
        """
        import requests
        ver = f",{version}" if version else ''
        url = f"{self.BASE_URL}/data/{agency_id},{dataflow_id}{ver}/{filter_expr}"
        params = {
            'dimensionAtObservation': 'AllDimensions',
            'format': 'csvfilewithlabels',
        }
        if start_period:
            params['startPeriod'] = start_period
        if end_period:
            params['endPeriod'] = end_period
        if last_n:
            params['lastNObservations'] = last_n
        response = requests.get(url, params=params,
                                headers={'Accept-Encoding': 'gzip, deflate, br'},
                                timeout=60)
        response.raise_for_status()
        return response.text

    def get_data_df(self, agency_id, dataflow_id, filter_expr,
                    start_period=None, end_period=None, last_n=None, version=None):
        """Same as get_data() but returns a parsed pandas DataFrame."""
        csv_text = self.get_data(agency_id, dataflow_id, filter_expr,
                                  start_period=start_period, end_period=end_period,
                                  last_n=last_n, version=version)
        return pd.read_csv(io.StringIO(csv_text))

    # ── Structure / discovery ─────────────────────────────────────────────

    def get_dataflows(self):
        """List all available OECD dataflows (1,475+ datasets).
        Returns list of dicts with keys: id, agencyID, version, name
        """
        import requests
        url = f"{self.BASE_URL}/dataflow/all"
        response = requests.get(url, headers=self._json_header, timeout=60)
        response.raise_for_status()
        data = response.json()
        dataflows = data.get('data', {}).get('dataflows', [])
        return [{
            'id': df.get('id'),
            'agencyID': df.get('agencyID'),
            'version': df.get('version'),
            'name': df.get('name', {}).get('en', '') if isinstance(df.get('name'), dict)
                    else df.get('name', ''),
        } for df in dataflows]

    def search_dataflows(self, query):
        """Search dataflows by keyword.
        Args:
            query: keyword (e.g. 'GDP', 'health', 'trade', 'inflation')
        Returns: list of matching dataflows (max 50)
        """
        all_dfs = self.get_dataflows()
        q = query.lower()
        return [df for df in all_dfs
                if q in (df.get('name', '') or '').lower()
                or q in (df.get('id', '') or '').lower()][:50]

    def get_dataflow_structure(self, agency_id, dataflow_id, version='1.0'):
        """Get structure (dimensions, codelists) of a dataset.

        Returns the full structure JSON. Key paths:
            data.dataStructures[0].dataStructureComponents.dimensionList.dimensions
            data.codelists
        """
        import requests
        url = f"{self.BASE_URL}/dataflow/{agency_id}/{dataflow_id}/{version}"
        params = {'references': 'all', 'detail': 'referencepartial'}
        response = requests.get(url, params=params,
                                headers=self._json_header, timeout=60)
        response.raise_for_status()
        return response.json()

    def get_dimensions(self, agency_id, dataflow_id, version='1.0'):
        """Get ordered list of dimensions for a dataset.
        Returns list of dicts with keys: position, id, codelist_id
        """
        structure = self.get_dataflow_structure(agency_id, dataflow_id, version)
        dsds = structure.get('data', {}).get('dataStructures', [])
        if not dsds:
            return []
        dims = dsds[0].get('dataStructureComponents', {}).get('dimensionList', {}).get('dimensions', [])
        result = []
        for dim in dims:
            cl_id = None
            lr = dim.get('localRepresentation', {})
            enum = lr.get('enumeration')
            if enum:
                cl_id = enum.split('/')[-1] if isinstance(enum, str) else None
            result.append({
                'position': dim.get('position'),
                'id': dim.get('id'),
                'codelist_id': cl_id,
            })
        return sorted(result, key=lambda x: x.get('position', 0))


class PolymarketClient:
    """Polymarket prediction market API client (read-only, public endpoints).

    No API key required. All endpoints are public.

    Polymarket is a prediction market where prices represent implied probabilities (0 to 1).
    A market priced at 0.65 implies a 65% probability of that outcome.

    Architecture:
        Gamma API  (gamma-api.polymarket.com) — events, markets, tags, search
        Data API   (data-api.polymarket.com)  — trades, leaderboard
        CLOB API   (clob.polymarket.com)      — order book, prices, price history
    """

    GAMMA_URL = 'https://gamma-api.polymarket.com'
    DATA_URL = 'https://data-api.polymarket.com'
    CLOB_URL = 'https://clob.polymarket.com'

    def __init__(self):
        pass

    def _get(self, url, params=None):
        import requests
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        return response.json()

    # ── Events & Markets ──────────────────────────────────────────────────

    def get_events(self, active=True, closed=False, tag_slug=None,
                   order='volume_24hr', ascending=False, limit=50, offset=0):
        """Get prediction market events (groups of related markets).

        Args:
            active: filter active events
            closed: filter closed events
            tag_slug: category filter (e.g. 'politics', 'sports', 'finance', 'crypto')
            order: sort by 'volume_24hr', 'volume', 'liquidity', 'startDate'
            limit: max results (default 50)

        Returns: list of event dicts with title, volume, markets, etc.
        """
        params = {'active': active, 'closed': closed, 'order': order,
                  'ascending': ascending, 'limit': limit, 'offset': offset}
        if tag_slug:
            params['tag_slug'] = tag_slug
        return self._get(f"{self.GAMMA_URL}/events", params)

    def get_markets(self, active=True, closed=False, limit=50, offset=0,
                    tag_id=None, order=None, market_id=None, slug=None):
        """Get individual prediction markets.

        Returns: list of market dicts with question, outcomes, outcomePrices, volume, tokens
        """
        params = {'active': active, 'closed': closed, 'limit': limit, 'offset': offset}
        if tag_id:
            params['tag_id'] = tag_id
        if order:
            params['order'] = order
        if market_id:
            params['id'] = market_id
        if slug:
            params['slug'] = slug
        return self._get(f"{self.GAMMA_URL}/markets", params)

    def search(self, query, limit=20):
        """Search for events, markets, and profiles by keyword."""
        return self._get(f"{self.GAMMA_URL}/search", {'q': query, 'limit': limit})

    def get_tags(self):
        """Get all available categories/tags."""
        return self._get(f"{self.GAMMA_URL}/tags")

    def get_event_by_slug(self, slug):
        """Get event details by slug."""
        return self._get(f"{self.GAMMA_URL}/events/slug/{slug}")

    # ── Price History ─────────────────────────────────────────────────────

    def get_price_history(self, token_id, interval=None, start_ts=None, end_ts=None, fidelity=None):
        """Get historical prices for a token (implied probabilities over time).

        Args:
            token_id: token ID from market data (tokens[].token_id)
            interval: relative period: '1m', '1h', '6h', '1d', '1w', '1M'
            start_ts/end_ts: Unix timestamps (exclusive with interval)
            fidelity: resolution in minutes

        Returns: dict with 'history' list of {t: timestamp, p: price}
        """
        params = {'market': token_id}
        if interval:
            params['interval'] = interval
        if start_ts:
            params['startTs'] = start_ts
        if end_ts:
            params['endTs'] = end_ts
        if fidelity:
            params['fidelity'] = fidelity
        return self._get(f"{self.CLOB_URL}/prices-history", params)

    def get_price_history_df(self, token_id, interval=None, start_ts=None, end_ts=None, fidelity=None):
        """Same as get_price_history() but returns a DataFrame with datetime index and 'price' column."""
        data = self.get_price_history(token_id, interval=interval,
                                       start_ts=start_ts, end_ts=end_ts, fidelity=fidelity)
        history = data.get('history', [])
        if not history:
            return pd.DataFrame()
        df = pd.DataFrame(history)
        df['datetime'] = pd.to_datetime(df['t'], unit='s')
        df = df.rename(columns={'p': 'price'}).set_index('datetime').sort_index()
        df['price'] = pd.to_numeric(df['price'], errors='coerce')
        return df[['price']]

    # ── Order Book & Prices ───────────────────────────────────────────────

    def get_order_book(self, token_id):
        """Get full order book (bids and asks) for a token."""
        return self._get(f"{self.CLOB_URL}/book", {'token_id': token_id})

    def get_midpoint(self, token_id):
        """Get midpoint price (implied probability) for a token."""
        return self._get(f"{self.CLOB_URL}/midpoint", {'token_id': token_id})

    def get_spread(self, token_id):
        """Get bid-ask spread for a token."""
        return self._get(f"{self.CLOB_URL}/spread", {'token_id': token_id})

    # ── Trades & Leaderboard ──────────────────────────────────────────────

    def get_trades(self, market=None, user=None, limit=100):
        """Get recent trades, optionally filtered by market or user."""
        params = {'limit': limit}
        if market:
            params['market'] = market
        if user:
            params['user'] = user
        return self._get(f"{self.DATA_URL}/trades", params)

    def get_leaderboard(self, limit=50):
        """Get top traders leaderboard."""
        return self._get(f"{self.DATA_URL}/leaderboard/trader", {'limit': limit})
