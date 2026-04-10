"""FRED (Federal Reserve Economic Data) API client class."""

import pandas as pd


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
        response = requests.get(url, params=params, timeout=60)
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
