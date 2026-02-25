#!/usr/bin/env python3
"""
Portfolio Optimizer Service
Implements Modern Portfolio Theory (Markowitz) for optimal asset allocation
"""
import json
import sys
import numpy as np
import pandas as pd
import os
from scipy.optimize import minimize
from typing import List, Dict, Tuple

# Import our FMP client
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices


def get_portfolio_returns_and_covariance(symbols: List[str], data_period: int = 504) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Fetch historical data and calculate returns and covariance matrix

    Args:
        symbols: List of stock ticker symbols
        data_period: Number of days of historical data

    Returns:
        Tuple of (mean_returns, cov_matrix, prices_df)
    """
    prices_dict = {}

    # Fetch historical prices for each symbol
    for symbol in symbols:
        print(f"Fetching data for {symbol}...", file=sys.stderr)
        hist_data = get_historical_prices(symbol)

        # Extract closing prices
        prices = [h['close'] for h in reversed(hist_data['historical'])]
        dates = [h['date'] for h in reversed(hist_data['historical'])]

        # Limit to requested period
        if len(prices) > data_period:
            prices = prices[-data_period:]
            dates = dates[-data_period:]

        prices_dict[symbol] = pd.Series(prices, index=pd.to_datetime(dates))

    # Create DataFrame with all prices
    prices_df = pd.DataFrame(prices_dict)

    # Remove any rows with missing data
    prices_df = prices_df.dropna()

    if len(prices_df) < 30:
        raise ValueError(f"Not enough data points after alignment. Need at least 30, got {len(prices_df)}")

    # Calculate daily returns
    returns_df = prices_df.pct_change().dropna()

    # Calculate mean returns (annualized)
    mean_returns = returns_df.mean() * 252

    # Calculate covariance matrix (annualized)
    cov_matrix = returns_df.cov() * 252

    return mean_returns.values, cov_matrix.values, prices_df


def calculate_portfolio_performance(weights: np.ndarray, mean_returns: np.ndarray, cov_matrix: np.ndarray) -> Tuple[float, float]:
    """
    Calculate portfolio return and volatility

    Args:
        weights: Portfolio weights
        mean_returns: Expected returns for each asset
        cov_matrix: Covariance matrix

    Returns:
        Tuple of (portfolio_return, portfolio_volatility)
    """
    portfolio_return = np.sum(weights * mean_returns)
    portfolio_std = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

    return portfolio_return, portfolio_std


def negative_sharpe_ratio(weights: np.ndarray, mean_returns: np.ndarray, cov_matrix: np.ndarray, risk_free_rate: float) -> float:
    """
    Calculate negative Sharpe ratio (for minimization)

    Args:
        weights: Portfolio weights
        mean_returns: Expected returns for each asset
        cov_matrix: Covariance matrix
        risk_free_rate: Risk-free rate

    Returns:
        Negative Sharpe ratio
    """
    portfolio_return, portfolio_std = calculate_portfolio_performance(weights, mean_returns, cov_matrix)

    if portfolio_std == 0:
        return 0

    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_std
    return -sharpe_ratio


def portfolio_volatility(weights: np.ndarray, mean_returns: np.ndarray, cov_matrix: np.ndarray) -> float:
    """
    Calculate portfolio volatility (for minimization)

    Args:
        weights: Portfolio weights
        mean_returns: Expected returns for each asset
        cov_matrix: Covariance matrix

    Returns:
        Portfolio volatility
    """
    return calculate_portfolio_performance(weights, mean_returns, cov_matrix)[1]


def optimize_portfolio(mean_returns: np.ndarray, cov_matrix: np.ndarray, risk_free_rate: float,
                      target_return: float = None, min_weight: float = 0.0, max_weight: float = 1.0) -> dict:
    """
    Optimize portfolio allocation

    Args:
        mean_returns: Expected returns for each asset
        cov_matrix: Covariance matrix
        risk_free_rate: Risk-free rate
        target_return: Target return for minimum variance portfolio (optional)
        min_weight: Minimum weight per asset
        max_weight: Maximum weight per asset

    Returns:
        Dictionary with optimal weights and performance metrics
    """
    num_assets = len(mean_returns)

    # Constraints: weights sum to 1
    constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]

    # Add target return constraint if specified
    if target_return is not None:
        constraints.append({
            'type': 'eq',
            'fun': lambda x: calculate_portfolio_performance(x, mean_returns, cov_matrix)[0] - target_return
        })

    # Bounds for weights
    bounds = tuple((min_weight, max_weight) for _ in range(num_assets))

    # Initial guess (equal weights)
    init_guess = np.array([1.0 / num_assets] * num_assets)

    # Optimize for maximum Sharpe ratio
    result_sharpe = minimize(
        negative_sharpe_ratio,
        init_guess,
        args=(mean_returns, cov_matrix, risk_free_rate),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )

    # Optimize for minimum volatility
    result_min_vol = minimize(
        portfolio_volatility,
        init_guess,
        args=(mean_returns, cov_matrix),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )

    # Calculate performance for optimal portfolios
    sharpe_weights = result_sharpe.x
    sharpe_return, sharpe_vol = calculate_portfolio_performance(sharpe_weights, mean_returns, cov_matrix)
    sharpe_ratio = (sharpe_return - risk_free_rate) / sharpe_vol if sharpe_vol > 0 else 0

    min_vol_weights = result_min_vol.x
    min_vol_return, min_vol_vol = calculate_portfolio_performance(min_vol_weights, mean_returns, cov_matrix)
    min_vol_sharpe = (min_vol_return - risk_free_rate) / min_vol_vol if min_vol_vol > 0 else 0

    return {
        'max_sharpe': {
            'weights': sharpe_weights.tolist(),
            'return': float(sharpe_return),
            'volatility': float(sharpe_vol),
            'sharpe_ratio': float(sharpe_ratio),
            'success': result_sharpe.success
        },
        'min_volatility': {
            'weights': min_vol_weights.tolist(),
            'return': float(min_vol_return),
            'volatility': float(min_vol_vol),
            'sharpe_ratio': float(min_vol_sharpe),
            'success': result_min_vol.success
        }
    }


def generate_efficient_frontier(mean_returns: np.ndarray, cov_matrix: np.ndarray, risk_free_rate: float,
                                num_points: int = 50, min_weight: float = 0.0, max_weight: float = 1.0) -> dict:
    """
    Generate efficient frontier

    Args:
        mean_returns: Expected returns for each asset
        cov_matrix: Covariance matrix
        risk_free_rate: Risk-free rate
        num_points: Number of points on the frontier
        min_weight: Minimum weight per asset
        max_weight: Maximum weight per asset

    Returns:
        Dictionary with frontier points
    """
    num_assets = len(mean_returns)

    # Find minimum and maximum possible returns
    min_return = np.min(mean_returns)
    max_return = np.max(mean_returns)

    # Generate target returns
    target_returns = np.linspace(min_return, max_return, num_points)

    frontier_returns = []
    frontier_volatilities = []
    frontier_sharpe_ratios = []

    constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]
    bounds = tuple((min_weight, max_weight) for _ in range(num_assets))
    init_guess = np.array([1.0 / num_assets] * num_assets)

    for target_return in target_returns:
        # Add target return constraint
        target_constraints = constraints + [
            {'type': 'eq', 'fun': lambda x, tr=target_return: calculate_portfolio_performance(x, mean_returns, cov_matrix)[0] - tr}
        ]

        try:
            result = minimize(
                portfolio_volatility,
                init_guess,
                args=(mean_returns, cov_matrix),
                method='SLSQP',
                bounds=bounds,
                constraints=target_constraints,
                options={'maxiter': 1000}
            )

            if result.success:
                ret, vol = calculate_portfolio_performance(result.x, mean_returns, cov_matrix)
                sharpe = (ret - risk_free_rate) / vol if vol > 0 else 0

                frontier_returns.append(float(ret))
                frontier_volatilities.append(float(vol))
                frontier_sharpe_ratios.append(float(sharpe))
        except:
            continue

    return {
        'returns': frontier_returns,
        'volatilities': frontier_volatilities,
        'sharpe_ratios': frontier_sharpe_ratios
    }


def run_portfolio_optimization(data_json: str) -> dict:
    """
    Run portfolio optimization analysis

    Args:
        data_json: JSON string containing:
            - symbols: List of stock ticker symbols (e.g., ['AAPL', 'GOOGL', 'MSFT'])
            - risk_free_rate: Risk-free rate (default: 0.02 for 2%)
            - min_weight: Minimum weight per asset (default: 0.0)
            - max_weight: Maximum weight per asset (default: 1.0)
            - data_period: Historical data period in days (default: 504 for ~2 years)
            - generate_frontier: Whether to generate efficient frontier (default: true)
            - frontier_points: Number of points on efficient frontier (default: 50)

    Returns:
        Dictionary containing optimal portfolios and efficient frontier
    """
    try:
        data = json.loads(data_json)

        # Extract parameters
        symbols = data.get('symbols')
        if not symbols or len(symbols) < 2:
            return {
                "error": "At least 2 symbols are required for portfolio optimization",
                "success": False
            }

        risk_free_rate = data.get('risk_free_rate', 0.02)
        min_weight = data.get('min_weight', 0.0)
        max_weight = data.get('max_weight', 1.0)
        data_period = data.get('data_period', 504)
        generate_frontier_flag = data.get('generate_frontier', True)
        frontier_points = data.get('frontier_points', 50)

        print(f"Optimizing portfolio for {len(symbols)} assets: {', '.join(symbols)}", file=sys.stderr)

        # Get returns and covariance matrix
        mean_returns, cov_matrix, prices_df = get_portfolio_returns_and_covariance(symbols, data_period)

        print(f"Calculated returns and covariance from {len(prices_df)} data points", file=sys.stderr)

        # Calculate correlation matrix
        returns_df = prices_df.pct_change().dropna()
        corr_matrix = returns_df.corr()

        # Optimize portfolio
        print("Optimizing portfolio allocations...", file=sys.stderr)
        optimization_results = optimize_portfolio(
            mean_returns, cov_matrix, risk_free_rate, min_weight=min_weight, max_weight=max_weight
        )

        # Calculate equal-weight portfolio for comparison
        equal_weights = np.array([1.0 / len(symbols)] * len(symbols))
        equal_return, equal_vol = calculate_portfolio_performance(equal_weights, mean_returns, cov_matrix)
        equal_sharpe = (equal_return - risk_free_rate) / equal_vol if equal_vol > 0 else 0

        # Generate efficient frontier if requested
        efficient_frontier = None
        if generate_frontier_flag:
            print("Generating efficient frontier...", file=sys.stderr)
            efficient_frontier = generate_efficient_frontier(
                mean_returns, cov_matrix, risk_free_rate, frontier_points, min_weight, max_weight
            )

        # Prepare results
        results = {
            "success": True,
            "symbols": symbols,
            "parameters": {
                "num_assets": len(symbols),
                "risk_free_rate": risk_free_rate,
                "min_weight": min_weight,
                "max_weight": max_weight,
                "data_points": len(prices_df),
                "data_period_days": data_period
            },
            "asset_statistics": {
                symbol: {
                    "expected_return": round(float(mean_returns[i]) * 100, 2),
                    "volatility": round(float(np.sqrt(cov_matrix[i, i])) * 100, 2),
                    "sharpe_ratio": round(float((mean_returns[i] - risk_free_rate) / np.sqrt(cov_matrix[i, i])), 4) if cov_matrix[i, i] > 0 else 0
                }
                for i, symbol in enumerate(symbols)
            },
            "correlation_matrix": {
                symbols[i]: {
                    symbols[j]: round(float(corr_matrix.iloc[i, j]), 4)
                    for j in range(len(symbols))
                }
                for i in range(len(symbols))
            },
            "optimal_portfolios": {
                "max_sharpe_ratio": {
                    "description": "Portfolio with maximum Sharpe ratio",
                    "allocation": {
                        symbols[i]: round(optimization_results['max_sharpe']['weights'][i] * 100, 2)
                        for i in range(len(symbols))
                    },
                    "expected_return": round(optimization_results['max_sharpe']['return'] * 100, 2),
                    "volatility": round(optimization_results['max_sharpe']['volatility'] * 100, 2),
                    "sharpe_ratio": round(optimization_results['max_sharpe']['sharpe_ratio'], 4),
                    "optimization_success": optimization_results['max_sharpe']['success']
                },
                "min_volatility": {
                    "description": "Portfolio with minimum volatility",
                    "allocation": {
                        symbols[i]: round(optimization_results['min_volatility']['weights'][i] * 100, 2)
                        for i in range(len(symbols))
                    },
                    "expected_return": round(optimization_results['min_volatility']['return'] * 100, 2),
                    "volatility": round(optimization_results['min_volatility']['volatility'] * 100, 2),
                    "sharpe_ratio": round(optimization_results['min_volatility']['sharpe_ratio'], 4),
                    "optimization_success": optimization_results['min_volatility']['success']
                },
                "equal_weight": {
                    "description": "Equal weight portfolio (benchmark)",
                    "allocation": {
                        symbols[i]: round(equal_weights[i] * 100, 2)
                        for i in range(len(symbols))
                    },
                    "expected_return": round(equal_return * 100, 2),
                    "volatility": round(equal_vol * 100, 2),
                    "sharpe_ratio": round(equal_sharpe, 4)
                }
            },
            "efficient_frontier": efficient_frontier,
            "interpretation": {
                "diversification_benefit": round(
                    (equal_vol - optimization_results['min_volatility']['volatility']) / equal_vol * 100, 2
                ) if equal_vol > 0 else 0,
                "notes": [
                    "Max Sharpe portfolio optimizes risk-adjusted returns",
                    "Min Volatility portfolio minimizes risk",
                    "Equal Weight portfolio is the naive 1/N allocation",
                    "Diversification benefit shows risk reduction vs. equal weighting",
                    f"Correlations range from {round(float(corr_matrix.min().min()), 2)} to {round(float(corr_matrix.max().max()), 2)}"
                ]
            }
        }

        return results

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"ERROR: {error_details}", file=sys.stderr)
        return {
            "error": str(e),
            "success": False
        }


if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()

    # Run portfolio optimization
    result = run_portfolio_optimization(input_data)

    # Output result as JSON
    print(json.dumps(result))
