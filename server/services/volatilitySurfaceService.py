#!/usr/bin/env python3
"""
Volatility Surface Service
Generates 3D volatility surface visualization for options
"""
import json
import sys
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
from datetime import datetime, timedelta
import os
import requests
from scipy.interpolate import griddata

# API Configuration
FINANCIAL_DATA_API_KEY = os.environ.get('FINANCIAL_DATA_API_KEY', 'a44ec329c25a58c0bff4947cb649eec3')
API_BASE_URL = 'https://financialdata.net/api/v1'


def fetch_option_chain(symbol: str) -> dict:
    """
    Fetch option chain data from Financial Data API
    """
    try:
        url = f"{API_BASE_URL}/option-chain"
        params = {
            'identifier': symbol,
            'key': FINANCIAL_DATA_API_KEY
        }
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching option chain: {e}", file=sys.stderr)
        raise


def fetch_option_price(identifier: str) -> dict:
    """
    Fetch option price data (including IV) from Financial Data API
    """
    try:
        url = f"{API_BASE_URL}/option-prices"
        params = {
            'identifier': identifier,
            'key': FINANCIAL_DATA_API_KEY
        }
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        # API might return array or single object
        return data[0] if isinstance(data, list) else data
    except Exception as e:
        print(f"Error fetching option price for {identifier}: {e}", file=sys.stderr)
        return None


def smart_sample_contracts(options: list, max_contracts: int = 60) -> list:
    """
    Intelligently sample option contracts to get good coverage of strikes and expirations
    while keeping the number of API calls reasonable.
    """
    if len(options) <= max_contracts:
        return options

    # Group by expiration date
    by_expiration = {}
    for opt in options:
        exp = opt.get('expiration_date') or opt.get('expirationDate') or opt.get('expiration')
        if exp:
            if exp not in by_expiration:
                by_expiration[exp] = []
            by_expiration[exp].append(opt)

    # Select contracts: take a subset from each expiration
    sampled = []
    contracts_per_exp = max(3, max_contracts // len(by_expiration))

    for exp_date, contracts in by_expiration.items():
        # Sort by strike (handle both strike and strike_price fields)
        sorted_contracts = sorted(contracts, key=lambda x: float(x.get('strike_price') or x.get('strike', 0)))

        # Sample evenly across strike range
        if len(sorted_contracts) <= contracts_per_exp:
            sampled.extend(sorted_contracts)
        else:
            # Take contracts at regular intervals
            step = len(sorted_contracts) // contracts_per_exp
            for i in range(0, len(sorted_contracts), step):
                if len(sampled) < max_contracts:
                    sampled.append(sorted_contracts[i])

    print(f"Sampled {len(sampled)} contracts from {len(options)} total", file=sys.stderr)
    return sampled


def calculate_days_to_expiration(expiration_date: str) -> int:
    """
    Calculate days until option expiration
    """
    try:
        exp_date = datetime.strptime(expiration_date, '%Y-%m-%d')
        today = datetime.now()
        delta = exp_date - today
        return max(1, delta.days)  # At least 1 day
    except:
        # If date format is different, try other formats
        try:
            # Try YYMMDD format (from option identifier)
            exp_date = datetime.strptime(expiration_date, '%y%m%d')
            today = datetime.now()
            delta = exp_date - today
            return max(1, delta.days)
        except:
            return 30  # Default to 30 days if parsing fails


def create_volatility_surface(data_json: str) -> dict:
    """
    Create 3D volatility surface visualization

    Args:
        data_json: JSON string containing:
            - symbol: Stock ticker symbol
            - title: Optional custom title
            - figsize: Optional figure size [width, height]
            - color_map: Optional colormap name (default: 'viridis')

    Returns:
        Dictionary with success status and image URL
    """
    try:
        data = json.loads(data_json)
        symbol = data.get('symbol')
        title = data.get('title', f'{symbol} Options - Volatility Surface')
        figsize = data.get('figsize', [14, 10])
        color_map = data.get('color_map', 'viridis')

        if not symbol:
            return {
                "success": False,
                "error": "Symbol is required"
            }

        print(f"Fetching option chain for {symbol}...", file=sys.stderr)

        # Fetch option chain data
        chain_data = fetch_option_chain(symbol)

        # Extract option contracts
        options = chain_data if isinstance(chain_data, list) else chain_data.get('options', [])

        if not options or len(options) == 0:
            return {
                "success": False,
                "error": f"No option data found for {symbol}"
            }

        print(f"Processing {len(options)} option contracts...", file=sys.stderr)

        # Sample contracts intelligently to reduce API calls
        sampled_contracts = smart_sample_contracts(options, max_contracts=60)
        print(f"Fetching IV data for {len(sampled_contracts)} contracts...", file=sys.stderr)

        # Prepare data for surface plot
        strikes = []
        days_to_exp = []
        implied_vols = []
        option_types = []

        # Fetch IV for each sampled contract
        for i, option in enumerate(sampled_contracts):
            # Extract contract identifier
            identifier = option.get('contract_name') or option.get('identifier') or option.get('contractSymbol')

            if not identifier:
                # Try to construct identifier from option data
                # Format: SYMBOL + YYMMDD + C/P + STRIKE (8 digits, padded)
                continue

            # Fetch option price data (includes IV)
            price_data = fetch_option_price(identifier)

            if not price_data:
                continue

            # Extract IV from price data
            iv = price_data.get('implied_volatility') or price_data.get('impliedVolatility') or price_data.get('iv')

            if not iv or iv <= 0:
                continue

            strike = option.get('strike_price') or option.get('strike') or price_data.get('strike_price') or price_data.get('strike')
            expiration = option.get('expiration_date') or option.get('expirationDate') or option.get('expiration') or price_data.get('expiration_date')
            option_type = option.get('option_type') or option.get('type') or price_data.get('option_type', 'call')

            if strike and expiration:
                days = calculate_days_to_expiration(expiration)

                strikes.append(float(strike))
                days_to_exp.append(days)
                implied_vols.append(float(iv) * 100)  # Convert to percentage
                option_types.append(option_type.lower())

            # Progress indicator
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1}/{len(sampled_contracts)} contracts, found {len(strikes)} with IV", file=sys.stderr)

        if len(strikes) < 3:
            return {
                "success": False,
                "error": f"Insufficient option data with implied volatility. Found only {len(strikes)} valid contracts."
            }

        print(f"Valid contracts with IV: {len(strikes)}", file=sys.stderr)

        # Convert to numpy arrays
        strikes = np.array(strikes)
        days_to_exp = np.array(days_to_exp)
        implied_vols = np.array(implied_vols)

        # Create figure with 3D subplot
        fig = plt.figure(figsize=tuple(figsize))
        ax = fig.add_subplot(111, projection='3d')

        # Create grid for surface interpolation
        strike_range = np.linspace(strikes.min(), strikes.max(), 30)
        days_range = np.linspace(days_to_exp.min(), days_to_exp.max(), 30)
        strike_grid, days_grid = np.meshgrid(strike_range, days_range)

        # Interpolate volatility surface
        try:
            iv_grid = griddata(
                (strikes, days_to_exp),
                implied_vols,
                (strike_grid, days_grid),
                method='cubic',
                fill_value=np.nan
            )

            # Handle NaN values (replace with linear interpolation)
            mask = np.isnan(iv_grid)
            if mask.any():
                iv_grid_linear = griddata(
                    (strikes, days_to_exp),
                    implied_vols,
                    (strike_grid, days_grid),
                    method='linear',
                    fill_value=implied_vols.mean()
                )
                iv_grid[mask] = iv_grid_linear[mask]

        except Exception as e:
            print(f"Cubic interpolation failed, using linear: {e}", file=sys.stderr)
            iv_grid = griddata(
                (strikes, days_to_exp),
                implied_vols,
                (strike_grid, days_grid),
                method='linear',
                fill_value=implied_vols.mean()
            )

        # Plot surface
        surf = ax.plot_surface(
            strike_grid,
            days_grid,
            iv_grid,
            cmap=color_map,
            alpha=0.8,
            edgecolor='none',
            antialiased=True
        )

        # Scatter actual data points
        ax.scatter(
            strikes,
            days_to_exp,
            implied_vols,
            c='red',
            marker='o',
            s=20,
            alpha=0.6,
            label='Market Data'
        )

        # Labels and title
        ax.set_xlabel('Strike Price ($)', fontsize=11, labelpad=10)
        ax.set_ylabel('Days to Expiration', fontsize=11, labelpad=10)
        ax.set_zlabel('Implied Volatility (%)', fontsize=11, labelpad=10)
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)

        # Add colorbar
        fig.colorbar(surf, ax=ax, shrink=0.5, aspect=5, label='Implied Volatility (%)')

        # Set viewing angle for better perspective
        ax.view_init(elev=25, azim=45)

        # Add legend
        ax.legend(loc='upper left', fontsize=9)

        # Grid
        ax.grid(True, alpha=0.3)

        # Statistics text
        stats_text = f'Contracts: {len(strikes)} | IV Range: {implied_vols.min():.1f}%-{implied_vols.max():.1f}%'
        fig.text(0.5, 0.02, stats_text, ha='center', fontsize=9, style='italic', color='gray')

        plt.tight_layout()

        # Generate unique filename
        import uuid
        import time
        timestamp = int(time.time() * 1000)
        unique_id = str(uuid.uuid4())[:8]
        filename = f"volatility_surface_{timestamp}_{unique_id}.png"

        # Get project root and create plots directory
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        plots_dir = os.path.join(project_root, 'public', 'plots')
        os.makedirs(plots_dir, exist_ok=True)

        # Save plot
        filepath = os.path.join(plots_dir, filename)
        plt.savefig(filepath, format='png', dpi=120, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        plt.close(fig)

        print(f"Volatility surface saved: {filename}", file=sys.stderr)

        return {
            "success": True,
            "image_url": f"/plots/{filename}",
            "format": "png",
            "title": title,
            "stats": {
                "total_contracts": len(strikes),
                "min_iv": float(implied_vols.min()),
                "max_iv": float(implied_vols.max()),
                "avg_iv": float(implied_vols.mean()),
                "strike_range": [float(strikes.min()), float(strikes.max())],
                "expiration_range_days": [int(days_to_exp.min()), int(days_to_exp.max())]
            }
        }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR: {error_details}", file=sys.stderr)
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()

    # Create volatility surface
    result = create_volatility_surface(input_data)

    # Output result as JSON
    print(json.dumps(result))
