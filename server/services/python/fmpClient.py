#!/usr/bin/env python3
"""
FMP API Client for Python Services
Fetches financial data directly from Financial Modeling Prep API
"""

import os
import requests
from typing import List, Dict, Any, Optional
import sys

# Get API key from environment
FMP_API_KEY = os.environ.get('FMP_API_KEY')
FMP_BASE_URL = 'https://financialmodelingprep.com/stable'

def get_historical_prices(symbol: str, from_date: Optional[str] = None, to_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch historical stock prices from FMP stable API
    """
    if not FMP_API_KEY:
        raise ValueError("FMP_API_KEY environment variable not set")

    url = f"{FMP_BASE_URL}/historical-price-eod/full"
    params = {'apikey': FMP_API_KEY, 'symbol': symbol}

    if from_date:
        params['from'] = from_date
    if to_date:
        params['to'] = to_date

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        # Stable endpoint may return a list directly
        if isinstance(data, list):
            data = {'symbol': symbol, 'historical': data}

        if 'historical' not in data:
            raise ValueError(f"No historical data found for symbol {symbol}")

        # Limit to 504 most recent data points (2 years) for performance
        if len(data['historical']) > 504:
            data['historical'] = data['historical'][:504]

        return data
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch data from FMP API: {str(e)}")


def get_stock_quote(symbol: str) -> Dict[str, Any]:
    """
    Fetch current stock quote from FMP stable API
    """
    if not FMP_API_KEY:
        raise ValueError("FMP_API_KEY environment variable not set")

    url = f"{FMP_BASE_URL}/quote"
    params = {'apikey': FMP_API_KEY, 'symbol': symbol}

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        if not data or len(data) == 0:
            raise ValueError(f"No quote data found for symbol {symbol}")

        return data[0]  # Return first item
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch quote from FMP API: {str(e)}")


def calculate_historical_volatility(prices: List[float], annualize: bool = True) -> float:
    """
    Calculate historical volatility from price data

    Args:
        prices: List of historical prices
        annualize: Whether to annualize the volatility (default: True, uses 252 trading days)

    Returns:
        Annualized volatility as a decimal (e.g., 0.25 for 25%)
    """
    import numpy as np

    if len(prices) < 2:
        raise ValueError("Need at least 2 prices to calculate volatility")

    # Calculate daily returns
    prices_array = np.array(prices)
    returns = np.diff(prices_array) / prices_array[:-1]

    # Calculate standard deviation of returns
    volatility = np.std(returns)

    # Annualize if requested (252 trading days per year)
    if annualize:
        volatility = volatility * np.sqrt(252)

    return float(volatility)


if __name__ == "__main__":
    # Test the module
    try:
        print("Testing FMP Client...")

        # Test historical prices
        print("\n1. Testing get_historical_prices('AAPL')...")
        hist_data = get_historical_prices('AAPL')
        print(f"   ✓ Fetched {len(hist_data['historical'])} historical records")

        # Test stock quote
        print("\n2. Testing get_stock_quote('AAPL')...")
        quote = get_stock_quote('AAPL')
        print(f"   ✓ Current price: ${quote['price']}")

        # Test volatility calculation
        print("\n3. Testing calculate_historical_volatility()...")
        prices = [h['close'] for h in hist_data['historical'][:30]]  # Last 30 days
        vol = calculate_historical_volatility(prices)
        print(f"   ✓ 30-day volatility: {vol*100:.2f}%")

        print("\n✓ All tests passed!")

    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        sys.exit(1)
