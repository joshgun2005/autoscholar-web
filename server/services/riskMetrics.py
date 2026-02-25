#!/usr/bin/env python3
"""
Risk Metrics Analyzer Service
Calculates comprehensive risk and performance metrics for investment analysis
"""
import json
import sys
import numpy as np
import pandas as pd
import os
from typing import Tuple

# Import our FMP client
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices


def calculate_returns(prices: np.ndarray) -> np.ndarray:
    """Calculate daily returns from prices"""
    return np.diff(prices) / prices[:-1]


def calculate_sharpe_ratio(returns: np.ndarray, risk_free_rate: float = 0.02) -> float:
    """
    Calculate Sharpe Ratio

    Args:
        returns: Array of returns
        risk_free_rate: Annual risk-free rate

    Returns:
        Sharpe ratio
    """
    if len(returns) == 0:
        return 0.0

    # Annualize returns and volatility
    mean_return = np.mean(returns) * 252
    std_return = np.std(returns, ddof=1) * np.sqrt(252)

    if std_return == 0:
        return 0.0

    sharpe = (mean_return - risk_free_rate) / std_return
    return float(sharpe)


def calculate_sortino_ratio(returns: np.ndarray, risk_free_rate: float = 0.02, target_return: float = 0.0) -> float:
    """
    Calculate Sortino Ratio (uses downside deviation instead of total volatility)

    Args:
        returns: Array of returns
        risk_free_rate: Annual risk-free rate
        target_return: Target return threshold (daily)

    Returns:
        Sortino ratio
    """
    if len(returns) == 0:
        return 0.0

    # Annualize returns
    mean_return = np.mean(returns) * 252

    # Calculate downside deviation (only negative returns)
    downside_returns = returns[returns < target_return]
    if len(downside_returns) == 0:
        return 0.0

    downside_std = np.std(downside_returns, ddof=1) * np.sqrt(252)

    if downside_std == 0:
        return 0.0

    sortino = (mean_return - risk_free_rate) / downside_std
    return float(sortino)


def calculate_calmar_ratio(returns: np.ndarray, prices: np.ndarray) -> float:
    """
    Calculate Calmar Ratio (annualized return / maximum drawdown)

    Args:
        returns: Array of returns
        prices: Array of prices

    Returns:
        Calmar ratio
    """
    if len(returns) == 0:
        return 0.0

    mean_return = np.mean(returns) * 252
    max_dd = calculate_max_drawdown(prices)[0]

    if max_dd == 0:
        return 0.0

    calmar = mean_return / abs(max_dd)
    return float(calmar)


def calculate_max_drawdown(prices: np.ndarray) -> Tuple[float, int, int, int]:
    """
    Calculate maximum drawdown and recovery time

    Args:
        prices: Array of prices

    Returns:
        Tuple of (max_drawdown, start_idx, end_idx, recovery_days)
    """
    if len(prices) == 0:
        return 0.0, 0, 0, 0

    # Calculate cumulative maximum
    cummax = np.maximum.accumulate(prices)

    # Calculate drawdown
    drawdown = (prices - cummax) / cummax

    # Find maximum drawdown
    max_dd_idx = np.argmin(drawdown)
    max_dd = drawdown[max_dd_idx]

    # Find start of drawdown (last peak before max drawdown)
    start_idx = np.argmax(cummax[:max_dd_idx + 1] == cummax[max_dd_idx])

    # Find recovery point (when price exceeds previous peak)
    recovery_idx = None
    peak_price = prices[start_idx]
    for i in range(max_dd_idx + 1, len(prices)):
        if prices[i] >= peak_price:
            recovery_idx = i
            break

    # Calculate recovery time
    if recovery_idx is not None:
        recovery_days = recovery_idx - max_dd_idx
    else:
        recovery_days = len(prices) - max_dd_idx  # Still in drawdown

    return float(max_dd), int(start_idx), int(max_dd_idx), int(recovery_days)


def calculate_beta_alpha(asset_returns: np.ndarray, benchmark_returns: np.ndarray, risk_free_rate: float = 0.02) -> Tuple[float, float]:
    """
    Calculate Beta and Alpha relative to benchmark

    Args:
        asset_returns: Asset returns
        benchmark_returns: Benchmark returns
        risk_free_rate: Annual risk-free rate

    Returns:
        Tuple of (beta, alpha)
    """
    if len(asset_returns) != len(benchmark_returns) or len(asset_returns) == 0:
        return 0.0, 0.0

    # Calculate beta (covariance / variance)
    covariance = np.cov(asset_returns, benchmark_returns)[0, 1]
    benchmark_variance = np.var(benchmark_returns, ddof=1)

    if benchmark_variance == 0:
        beta = 0.0
    else:
        beta = covariance / benchmark_variance

    # Calculate alpha (annualized)
    asset_return = np.mean(asset_returns) * 252
    benchmark_return = np.mean(benchmark_returns) * 252

    alpha = asset_return - (risk_free_rate + beta * (benchmark_return - risk_free_rate))

    return float(beta), float(alpha)


def calculate_information_ratio(asset_returns: np.ndarray, benchmark_returns: np.ndarray) -> float:
    """
    Calculate Information Ratio (excess return / tracking error)

    Args:
        asset_returns: Asset returns
        benchmark_returns: Benchmark returns

    Returns:
        Information ratio
    """
    if len(asset_returns) != len(benchmark_returns) or len(asset_returns) == 0:
        return 0.0

    # Calculate excess returns
    excess_returns = asset_returns - benchmark_returns

    # Annualized excess return
    mean_excess = np.mean(excess_returns) * 252

    # Tracking error (annualized)
    tracking_error = np.std(excess_returns, ddof=1) * np.sqrt(252)

    if tracking_error == 0:
        return 0.0

    information_ratio = mean_excess / tracking_error
    return float(information_ratio)


def calculate_treynor_ratio(asset_returns: np.ndarray, benchmark_returns: np.ndarray, risk_free_rate: float = 0.02) -> float:
    """
    Calculate Treynor Ratio (excess return / beta)

    Args:
        asset_returns: Asset returns
        benchmark_returns: Benchmark returns
        risk_free_rate: Annual risk-free rate

    Returns:
        Treynor ratio
    """
    if len(asset_returns) == 0:
        return 0.0

    beta, _ = calculate_beta_alpha(asset_returns, benchmark_returns, risk_free_rate)

    if beta == 0:
        return 0.0

    asset_return = np.mean(asset_returns) * 252
    treynor = (asset_return - risk_free_rate) / beta

    return float(treynor)


def calculate_tracking_error(asset_returns: np.ndarray, benchmark_returns: np.ndarray) -> float:
    """
    Calculate Tracking Error (annualized standard deviation of excess returns)

    Args:
        asset_returns: Asset returns
        benchmark_returns: Benchmark returns

    Returns:
        Tracking error
    """
    if len(asset_returns) != len(benchmark_returns) or len(asset_returns) == 0:
        return 0.0

    excess_returns = asset_returns - benchmark_returns
    tracking_error = np.std(excess_returns, ddof=1) * np.sqrt(252)

    return float(tracking_error)


def calculate_downside_capture(asset_returns: np.ndarray, benchmark_returns: np.ndarray) -> float:
    """
    Calculate Downside Capture Ratio

    Args:
        asset_returns: Asset returns
        benchmark_returns: Benchmark returns

    Returns:
        Downside capture ratio (%)
    """
    if len(asset_returns) != len(benchmark_returns) or len(asset_returns) == 0:
        return 0.0

    # Filter for periods when benchmark was negative
    down_periods = benchmark_returns < 0

    if not np.any(down_periods):
        return 0.0

    asset_down = asset_returns[down_periods]
    benchmark_down = benchmark_returns[down_periods]

    # Calculate average returns during down periods
    asset_down_avg = np.mean(asset_down)
    benchmark_down_avg = np.mean(benchmark_down)

    if benchmark_down_avg == 0:
        return 0.0

    downside_capture = (asset_down_avg / benchmark_down_avg) * 100

    return float(downside_capture)


def calculate_upside_capture(asset_returns: np.ndarray, benchmark_returns: np.ndarray) -> float:
    """
    Calculate Upside Capture Ratio

    Args:
        asset_returns: Asset returns
        benchmark_returns: Benchmark returns

    Returns:
        Upside capture ratio (%)
    """
    if len(asset_returns) != len(benchmark_returns) or len(asset_returns) == 0:
        return 0.0

    # Filter for periods when benchmark was positive
    up_periods = benchmark_returns > 0

    if not np.any(up_periods):
        return 0.0

    asset_up = asset_returns[up_periods]
    benchmark_up = benchmark_returns[up_periods]

    # Calculate average returns during up periods
    asset_up_avg = np.mean(asset_up)
    benchmark_up_avg = np.mean(benchmark_up)

    if benchmark_up_avg == 0:
        return 0.0

    upside_capture = (asset_up_avg / benchmark_up_avg) * 100

    return float(upside_capture)


def run_risk_metrics_analysis(data_json: str) -> dict:
    """
    Run comprehensive risk metrics analysis

    Args:
        data_json: JSON string containing:
            - symbol: Stock ticker symbol (e.g., 'AAPL')
            - benchmark_symbol: Benchmark symbol (e.g., 'SPY') - optional
            - risk_free_rate: Annual risk-free rate (default: 0.02 for 2%)
            - data_period: Historical data period in days (default: 504 for ~2 years)

    Returns:
        Dictionary containing comprehensive risk metrics
    """
    try:
        data = json.loads(data_json)

        # Extract parameters
        symbol = data.get('symbol')
        if not symbol:
            return {
                "error": "Symbol is required",
                "success": False
            }

        benchmark_symbol = data.get('benchmark_symbol', 'SPY')
        risk_free_rate = data.get('risk_free_rate', 0.02)
        data_period = data.get('data_period', 504)

        # Fetch asset historical prices
        print(f"Fetching historical prices for {symbol} from FMP API...", file=sys.stderr)
        asset_hist = get_historical_prices(symbol)
        asset_prices = np.array([h['close'] for h in reversed(asset_hist['historical'])])
        asset_dates = [h['date'] for h in reversed(asset_hist['historical'])]

        # Limit to requested period
        if len(asset_prices) > data_period:
            asset_prices = asset_prices[-data_period:]
            asset_dates = asset_dates[-data_period:]

        print(f"Using {len(asset_prices)} historical prices for {symbol}", file=sys.stderr)

        if len(asset_prices) < 30:
            return {
                "error": f"Need at least 30 historical prices (got {len(asset_prices)})",
                "success": False
            }

        # Calculate asset returns
        asset_returns = calculate_returns(asset_prices)

        # Fetch benchmark historical prices
        print(f"Fetching benchmark data for {benchmark_symbol}...", file=sys.stderr)
        benchmark_hist = get_historical_prices(benchmark_symbol)
        benchmark_prices = np.array([h['close'] for h in reversed(benchmark_hist['historical'])])
        benchmark_dates = [h['date'] for h in reversed(benchmark_hist['historical'])]

        # Align benchmark with asset dates
        asset_dates_set = set(asset_dates)
        aligned_benchmark = []
        for i, date in enumerate(benchmark_dates):
            if date in asset_dates_set:
                aligned_benchmark.append(benchmark_prices[i])

        benchmark_prices_aligned = np.array(aligned_benchmark)

        # Ensure same length
        min_len = min(len(asset_prices), len(benchmark_prices_aligned))
        asset_prices = asset_prices[-min_len:]
        benchmark_prices_aligned = benchmark_prices_aligned[-min_len:]

        benchmark_returns = calculate_returns(benchmark_prices_aligned)
        asset_returns = asset_returns[-len(benchmark_returns):]

        print(f"Calculated {len(asset_returns)} aligned returns for analysis", file=sys.stderr)

        # Calculate all metrics
        print("Calculating risk metrics...", file=sys.stderr)

        # Return statistics
        mean_return = float(np.mean(asset_returns) * 252)
        volatility = float(np.std(asset_returns, ddof=1) * np.sqrt(252))

        # Sharpe, Sortino, Calmar
        sharpe = calculate_sharpe_ratio(asset_returns, risk_free_rate)
        sortino = calculate_sortino_ratio(asset_returns, risk_free_rate)
        calmar = calculate_calmar_ratio(asset_returns, asset_prices)

        # Maximum Drawdown
        max_dd, dd_start, dd_end, recovery_days = calculate_max_drawdown(asset_prices)

        # Beta and Alpha
        beta, alpha = calculate_beta_alpha(asset_returns, benchmark_returns, risk_free_rate)

        # Information Ratio and Treynor Ratio
        information_ratio = calculate_information_ratio(asset_returns, benchmark_returns)
        treynor = calculate_treynor_ratio(asset_returns, benchmark_returns, risk_free_rate)

        # Tracking Error
        tracking_error = calculate_tracking_error(asset_returns, benchmark_returns)

        # Capture Ratios
        downside_capture = calculate_downside_capture(asset_returns, benchmark_returns)
        upside_capture = calculate_upside_capture(asset_returns, benchmark_returns)

        # Win rate
        winning_days = np.sum(asset_returns > 0)
        total_days = len(asset_returns)
        win_rate = (winning_days / total_days * 100) if total_days > 0 else 0

        # Average win/loss
        wins = asset_returns[asset_returns > 0]
        losses = asset_returns[asset_returns < 0]
        avg_win = float(np.mean(wins)) if len(wins) > 0 else 0
        avg_loss = float(np.mean(losses)) if len(losses) > 0 else 0

        # Profit factor
        total_wins = float(np.sum(wins)) if len(wins) > 0 else 0
        total_losses = float(abs(np.sum(losses))) if len(losses) > 0 else 0
        profit_factor = (total_wins / total_losses) if total_losses > 0 else 0

        # Benchmark statistics
        benchmark_return = float(np.mean(benchmark_returns) * 252)
        benchmark_volatility = float(np.std(benchmark_returns, ddof=1) * np.sqrt(252))

        # Correlation
        correlation = float(np.corrcoef(asset_returns, benchmark_returns)[0, 1]) if len(asset_returns) > 1 else 0

        # Results
        results = {
            "success": True,
            "symbol": symbol,
            "benchmark": benchmark_symbol,
            "parameters": {
                "risk_free_rate": risk_free_rate,
                "data_points": len(asset_returns),
                "data_period_days": data_period,
                "start_date": asset_dates[-len(asset_returns)],
                "end_date": asset_dates[-1]
            },
            "return_metrics": {
                "annualized_return": round(mean_return * 100, 2),
                "annualized_volatility": round(volatility * 100, 2),
                "benchmark_return": round(benchmark_return * 100, 2),
                "benchmark_volatility": round(benchmark_volatility * 100, 2),
                "excess_return": round((mean_return - benchmark_return) * 100, 2)
            },
            "risk_adjusted_metrics": {
                "sharpe_ratio": round(sharpe, 4),
                "sortino_ratio": round(sortino, 4),
                "calmar_ratio": round(calmar, 4),
                "information_ratio": round(information_ratio, 4),
                "treynor_ratio": round(treynor, 4)
            },
            "market_metrics": {
                "beta": round(beta, 4),
                "alpha_annualized": round(alpha * 100, 2),
                "correlation": round(correlation, 4),
                "tracking_error": round(tracking_error * 100, 2),
                "r_squared": round(correlation ** 2, 4)
            },
            "drawdown_metrics": {
                "max_drawdown_pct": round(max_dd * 100, 2),
                "max_drawdown_start_idx": dd_start,
                "max_drawdown_end_idx": dd_end,
                "recovery_days": recovery_days,
                "currently_in_drawdown": dd_end == len(asset_prices) - 1,
                "current_drawdown_pct": round(((asset_prices[-1] - np.max(asset_prices)) / np.max(asset_prices)) * 100, 2)
            },
            "capture_ratios": {
                "upside_capture_pct": round(upside_capture, 2),
                "downside_capture_pct": round(downside_capture, 2),
                "capture_ratio": round(upside_capture / downside_capture, 4) if downside_capture != 0 else 0
            },
            "trading_statistics": {
                "win_rate_pct": round(win_rate, 2),
                "average_win_pct": round(avg_win * 100, 4),
                "average_loss_pct": round(avg_loss * 100, 4),
                "profit_factor": round(profit_factor, 4),
                "win_loss_ratio": round(abs(avg_win / avg_loss), 4) if avg_loss != 0 else 0
            },
            "interpretation": {
                "risk_rating": "low" if volatility < 0.15 else "moderate" if volatility < 0.25 else "high",
                "performance_vs_benchmark": "outperforming" if mean_return > benchmark_return else "underperforming",
                "risk_adjusted_performance": "excellent" if sharpe > 2 else "good" if sharpe > 1 else "moderate" if sharpe > 0 else "poor",
                "market_sensitivity": "defensive" if beta < 0.8 else "neutral" if beta < 1.2 else "aggressive",
                "notes": [
                    f"Sharpe ratio of {round(sharpe, 2)} indicates {'excellent' if sharpe > 2 else 'good' if sharpe > 1 else 'moderate' if sharpe > 0 else 'poor'} risk-adjusted returns",
                    f"Beta of {round(beta, 2)} means the asset is {'less' if beta < 1 else 'more'} volatile than the market",
                    f"Maximum drawdown of {round(abs(max_dd) * 100, 2)}% shows the worst peak-to-trough decline",
                    f"Downside capture of {round(downside_capture, 2)}% shows protection in market declines",
                    f"Alpha of {round(alpha * 100, 2)}% shows {'outperformance' if alpha > 0 else 'underperformance'} vs. expected return"
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

    # Run risk metrics analysis
    result = run_risk_metrics_analysis(input_data)

    # Output result as JSON
    print(json.dumps(result))
