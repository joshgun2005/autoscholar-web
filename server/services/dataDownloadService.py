#!/usr/bin/env python3
"""
FMP Data Download Service
Downloads financial data from FMP API and exports to various formats (CSV, XLSX, JSON, TXT)
"""

import sys
import json
import os
import pandas as pd
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List

# Get API key from environment
FMP_API_KEY = os.environ.get('FMP_API_KEY')
FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3'


def call_fmp_api(endpoint: str, params: Dict[str, Any] = None) -> Any:
    """
    Make a call to the FMP API
    """
    if not FMP_API_KEY:
        raise ValueError("FMP_API_KEY environment variable not set")

    url = f"{FMP_BASE_URL}/{endpoint}"
    api_params = {'apikey': FMP_API_KEY}

    if params:
        api_params.update(params)

    try:
        response = requests.get(url, params=api_params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch data from FMP API: {str(e)}")


def fetch_data(data_type, params):
    """
    Fetch data from FMP API based on data_type and params
    Returns a tuple of (data, metadata)
    """
    symbol = params.get('symbol')
    period = params.get('period', 'annual')
    limit = params.get('limit', 10)
    from_date = params.get('from_date')
    to_date = params.get('to_date')

    metadata = {
        'data_type': data_type,
        'symbol': symbol,
        'fetched_at': datetime.now().isoformat(),
        'params': params
    }

    try:
        # Fundamental Data
        if data_type == 'company_profile':
            data = call_fmp_api(f'profile/{symbol}')
            metadata['description'] = f'Company Profile for {symbol}'

        elif data_type == 'income_statement':
            data = call_fmp_api(f'income-statement/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Income Statement for {symbol} ({period}, limit: {limit})'

        elif data_type == 'balance_sheet':
            data = call_fmp_api(f'balance-sheet-statement/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Balance Sheet for {symbol} ({period}, limit: {limit})'

        elif data_type == 'cash_flow':
            data = call_fmp_api(f'cash-flow-statement/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Cash Flow Statement for {symbol} ({period}, limit: {limit})'

        elif data_type == 'key_metrics':
            data = call_fmp_api(f'key-metrics/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Key Metrics for {symbol} ({period}, limit: {limit})'

        elif data_type == 'financial_ratios':
            data = call_fmp_api(f'ratios/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Financial Ratios for {symbol} ({period}, limit: {limit})'

        elif data_type == 'financial_growth':
            data = call_fmp_api(f'financial-growth/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Financial Growth for {symbol} ({period}, limit: {limit})'

        # Market Data
        elif data_type == 'stock_quote':
            result = call_fmp_api(f'quote/{symbol}')
            data = result if isinstance(result, list) else [result]
            metadata['description'] = f'Stock Quote for {symbol}'

        elif data_type == 'historical_price':
            api_params = {}
            if from_date:
                api_params['from'] = from_date
            if to_date:
                api_params['to'] = to_date
            result = call_fmp_api(f'historical-price-full/{symbol}', api_params)
            data = result.get('historical', [])
            # Reverse to get chronological order
            data = list(reversed(data))
            metadata['description'] = f'Historical Prices for {symbol}'
            if from_date:
                metadata['description'] += f' from {from_date}'
            if to_date:
                metadata['description'] += f' to {to_date}'

        elif data_type == 'intraday_price':
            interval = params.get('interval', '15min')
            result = call_fmp_api(f'historical-chart/{interval}/{symbol}')
            data = result if isinstance(result, list) else []
            metadata['description'] = f'Intraday Prices for {symbol} ({interval} interval)'

        # Technical Indicators
        elif data_type == 'rsi':
            period_val = params.get('indicator_period', 14)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'rsi', 'period': period_val})
            metadata['description'] = f'RSI for {symbol} (period: {period_val}, {time_period})'

        elif data_type == 'macd':
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'macd'})
            metadata['description'] = f'MACD for {symbol} ({time_period})'

        elif data_type == 'ema':
            period_val = params.get('indicator_period', 50)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'ema', 'period': period_val})
            metadata['description'] = f'EMA for {symbol} (period: {period_val}, {time_period})'

        elif data_type == 'sma':
            period_val = params.get('indicator_period', 50)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'sma', 'period': period_val})
            metadata['description'] = f'SMA for {symbol} (period: {period_val}, {time_period})'

        elif data_type == 'adx':
            period_val = params.get('indicator_period', 14)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'adx', 'period': period_val})
            metadata['description'] = f'ADX for {symbol} (period: {period_val}, {time_period})'

        elif data_type == 'williams_r':
            period_val = params.get('indicator_period', 14)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'williamsr', 'period': period_val})
            metadata['description'] = f'Williams %R for {symbol} (period: {period_val}, {time_period})'

        elif data_type == 'cci':
            period_val = params.get('indicator_period', 20)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'cci', 'period': period_val})
            metadata['description'] = f'CCI for {symbol} (period: {period_val}, {time_period})'

        elif data_type == 'stochastic':
            period_val = params.get('indicator_period', 14)
            time_period = params.get('time_period', 'daily')
            data = call_fmp_api(f'technical_indicator/{time_period}/{symbol}', {'type': 'stoch', 'period': period_val})
            metadata['description'] = f'Stochastic Oscillator for {symbol} (period: {period_val}, {time_period})'

        # News & Events
        elif data_type == 'financial_news':
            news_limit = params.get('news_limit', 20)
            data = call_fmp_api(f'stock_news', {'tickers': symbol, 'limit': news_limit})
            metadata['description'] = f'Financial News for {symbol} (limit: {news_limit})'

        elif data_type == 'earnings_calendar':
            api_params = {}
            if from_date:
                api_params['from'] = from_date
            if to_date:
                api_params['to'] = to_date
            data = call_fmp_api('earning_calendar', api_params)
            metadata['description'] = f'Earnings Calendar'
            if from_date:
                metadata['description'] += f' from {from_date}'
            if to_date:
                metadata['description'] += f' to {to_date}'

        elif data_type == 'earnings_surprises':
            data = call_fmp_api(f'earnings-surprises/{symbol}')
            metadata['description'] = f'Earnings Surprises for {symbol}'

        elif data_type == 'analyst_estimates':
            data = call_fmp_api(f'analyst-estimates/{symbol}', {'period': period, 'limit': limit})
            metadata['description'] = f'Analyst Estimates for {symbol} ({period})'

        elif data_type == 'price_target':
            data = call_fmp_api(f'price-target', {'symbol': symbol})
            metadata['description'] = f'Analyst Price Targets for {symbol}'

        elif data_type == 'upgrades_downgrades':
            data = call_fmp_api(f'upgrades-downgrades', {'symbol': symbol})
            metadata['description'] = f'Analyst Upgrades & Downgrades for {symbol}'

        # Dividends & Corporate Actions
        elif data_type == 'dividend_history':
            data = call_fmp_api(f'historical-price-full/stock_dividend/{symbol}')
            if isinstance(data, dict) and 'historical' in data:
                data = data['historical']
            metadata['description'] = f'Dividend History for {symbol}'

        elif data_type == 'stock_splits':
            data = call_fmp_api(f'historical-price-full/stock_split/{symbol}')
            if isinstance(data, dict) and 'historical' in data:
                data = data['historical']
            metadata['description'] = f'Stock Split History for {symbol}'

        # Institutional & Insider Data
        elif data_type == 'insider_trading':
            data = call_fmp_api(f'insider-trading', {'symbol': symbol, 'limit': limit})
            metadata['description'] = f'Insider Trading for {symbol} (limit: {limit})'

        elif data_type == 'institutional_holders':
            data = call_fmp_api(f'institutional-holder/{symbol}')
            metadata['description'] = f'Institutional Holders for {symbol}'

        elif data_type == 'congressional_trading':
            api_params = {'symbol': symbol} if symbol else {}
            data = call_fmp_api('senate-trading', api_params)
            metadata['description'] = f'Congressional Trading{" for " + symbol if symbol else ""}'

        # ESG Data
        elif data_type == 'esg_score':
            data = call_fmp_api(f'esg-environmental-social-governance-data', {'symbol': symbol})
            metadata['description'] = f'ESG Score for {symbol}'

        # Macro Data
        elif data_type == 'treasury_rates':
            api_params = {}
            if from_date:
                api_params['from'] = from_date
            if to_date:
                api_params['to'] = to_date
            data = call_fmp_api('treasury', api_params)
            metadata['description'] = f'US Treasury Rates'

        elif data_type == 'economic_calendar':
            api_params = {}
            if from_date:
                api_params['from'] = from_date
            if to_date:
                api_params['to'] = to_date
            data = call_fmp_api('economic_calendar', api_params)
            metadata['description'] = f'Economic Calendar'

        # Forex & Commodities
        elif data_type == 'forex_quote':
            pair = params.get('pair', 'EURUSD')
            data = call_fmp_api(f'fx/{pair}')
            metadata['description'] = f'Forex Quote for {pair}'

        elif data_type == 'commodity_quotes':
            data = call_fmp_api('quotes/commodity')
            metadata['description'] = f'Commodity Quotes'

        else:
            return None, {'error': f'Unknown data_type: {data_type}'}

        metadata['record_count'] = len(data) if isinstance(data, list) else 1
        return data, metadata

    except Exception as e:
        return None, {'error': str(e)}


def convert_to_dataframe(data):
    """
    Convert data to pandas DataFrame
    """
    if isinstance(data, list):
        if len(data) > 0:
            return pd.DataFrame(data)
        else:
            return pd.DataFrame()
    elif isinstance(data, dict):
        return pd.DataFrame([data])
    else:
        return pd.DataFrame()


def export_data(data, output_format, output_path):
    """
    Export data to specified format
    """
    df = convert_to_dataframe(data)

    if df.empty:
        raise ValueError('No data to export')

    if output_format == 'csv':
        df.to_csv(output_path, index=False, encoding='utf-8')

    elif output_format == 'xlsx':
        # Use openpyxl engine for better compatibility
        df.to_excel(output_path, index=False, engine='openpyxl')

    elif output_format == 'json':
        # Export as pretty JSON
        df.to_json(output_path, orient='records', indent=2)

    elif output_format == 'txt':
        # Export as formatted text table
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(df.to_string(index=False))

    else:
        raise ValueError(f'Unsupported format: {output_format}')


def main():
    """
    Main execution function
    """
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        params = json.loads(input_data)

        data_type = params.get('data_type')
        output_format = params.get('format', 'csv').lower()

        if not data_type:
            result = {
                'success': False,
                'error': 'data_type is required'
            }
            print(json.dumps(result))
            sys.exit(1)

        # Validate format
        valid_formats = ['csv', 'xlsx', 'json', 'txt']
        if output_format not in valid_formats:
            result = {
                'success': False,
                'error': f'Invalid format. Must be one of: {", ".join(valid_formats)}'
            }
            print(json.dumps(result))
            sys.exit(1)

        # Fetch data
        data, metadata = fetch_data(data_type, params)

        if data is None:
            result = {
                'success': False,
                'error': metadata.get('error', 'Failed to fetch data')
            }
            print(json.dumps(result))
            sys.exit(1)

        # Generate filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        symbol = params.get('symbol', 'data')
        filename = f"{symbol}_{data_type}_{timestamp}.{output_format}"

        # Create downloads directory if it doesn't exist
        downloads_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'downloads')
        os.makedirs(downloads_dir, exist_ok=True)

        output_path = os.path.join(downloads_dir, filename)

        # Export data
        export_data(data, output_format, output_path)

        # Get file size
        file_size = os.path.getsize(output_path)

        # Return success result
        result = {
            'success': True,
            'filename': filename,
            'filepath': output_path,
            'format': output_format,
            'file_size': file_size,
            'metadata': metadata
        }

        print(json.dumps(result))

    except Exception as e:
        result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(result))
        sys.exit(1)


if __name__ == '__main__':
    main()
