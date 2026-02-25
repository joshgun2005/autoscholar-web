#!/usr/bin/env python3
"""
Value at Risk (VaR) Calculator Service
Calculates VaR using multiple methodologies for risk assessment
"""
import json
import sys
import numpy as np
import pandas as pd
import os
from scipy import stats

# Import our FMP client
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices


def calculate_historical_var(returns, confidence_level=0.95):
    """
    Calculate Historical VaR using the empirical distribution of returns

    Args:
        returns: Array of historical returns
        confidence_level: Confidence level (default 0.95 for 95%)

    Returns:
        VaR as a positive number (loss)
    """
    if len(returns) == 0:
        return 0.0

    # VaR is the negative of the percentile (we want loss, not gain)
    var = -np.percentile(returns, (1 - confidence_level) * 100)
    return float(var)


def calculate_parametric_var(returns, confidence_level=0.95):
    """
    Calculate Parametric VaR assuming normal distribution

    Args:
        returns: Array of historical returns
        confidence_level: Confidence level (default 0.95 for 95%)

    Returns:
        VaR as a positive number (loss)
    """
    if len(returns) == 0:
        return 0.0

    mean = np.mean(returns)
    std = np.std(returns, ddof=1)

    # Z-score for the confidence level
    z_score = stats.norm.ppf(1 - confidence_level)

    # VaR = -(mean + z_score * std)
    var = -(mean + z_score * std)
    return float(var)


def calculate_monte_carlo_var(returns, confidence_level=0.95, num_simulations=10000):
    """
    Calculate Monte Carlo VaR using simulated returns

    Args:
        returns: Array of historical returns
        confidence_level: Confidence level (default 0.95 for 95%)
        num_simulations: Number of Monte Carlo simulations

    Returns:
        VaR as a positive number (loss)
    """
    if len(returns) == 0:
        return 0.0

    mean = np.mean(returns)
    std = np.std(returns, ddof=1)

    # Generate simulated returns assuming normal distribution
    simulated_returns = np.random.normal(mean, std, num_simulations)

    # Calculate VaR from simulated returns
    var = -np.percentile(simulated_returns, (1 - confidence_level) * 100)
    return float(var)


def calculate_cvar(returns, confidence_level=0.95):
    """
    Calculate Conditional VaR (Expected Shortfall/CVaR)
    Average of losses beyond the VaR threshold

    Args:
        returns: Array of historical returns
        confidence_level: Confidence level (default 0.95 for 95%)

    Returns:
        CVaR as a positive number (loss)
    """
    if len(returns) == 0:
        return 0.0

    # Get the VaR threshold
    var_threshold = -calculate_historical_var(returns, confidence_level)

    # Calculate mean of returns below the VaR threshold
    tail_losses = returns[returns <= var_threshold]

    if len(tail_losses) == 0:
        return float(calculate_historical_var(returns, confidence_level))

    cvar = -np.mean(tail_losses)
    return float(cvar)


def run_var_analysis(data_json: str) -> dict:
    """
    Run comprehensive VaR analysis on financial data

    Args:
        data_json: JSON string containing:
            - symbol: Stock ticker symbol (e.g., 'AAPL')
            - portfolio_value: Total portfolio value (default: 100000)
            - confidence_levels: List of confidence levels (default: [0.90, 0.95, 0.99])
            - time_horizon: Days to project (default: 1 for 1-day VaR)
            - num_simulations: Monte Carlo simulations (default: 10000)
            - data_period: Historical data period in days (default: 504 for ~2 years)

    Returns:
        Dictionary containing VaR calculations using multiple methods
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

        portfolio_value = data.get('portfolio_value', 100000)
        confidence_levels = data.get('confidence_levels', [0.90, 0.95, 0.99])
        time_horizon = data.get('time_horizon', 1)
        num_simulations = data.get('num_simulations', 10000)
        data_period = data.get('data_period', 504)

        # Fetch historical prices from FMP API
        print(f"Fetching historical prices for {symbol} from FMP API...", file=sys.stderr)
        hist_data = get_historical_prices(symbol)

        # Extract closing prices (most recent first, so reverse for chronological order)
        prices = np.array([h['close'] for h in reversed(hist_data['historical'])])
        dates = [h['date'] for h in reversed(hist_data['historical'])]

        # Limit to requested period
        if len(prices) > data_period:
            prices = prices[-data_period:]
            dates = dates[-data_period:]

        print(f"Using {len(prices)} historical prices for VaR analysis", file=sys.stderr)

        if len(prices) < 30:
            return {
                "error": f"Need at least 30 historical prices for VaR calculation (got {len(prices)})",
                "success": False
            }

        # Calculate daily returns
        returns = np.diff(prices) / prices[:-1]

        # Scale returns for time horizon (assuming independent daily returns)
        if time_horizon > 1:
            returns_scaled = returns * np.sqrt(time_horizon)
        else:
            returns_scaled = returns

        # Calculate VaR for each confidence level using all methods
        var_results = {}

        for conf_level in confidence_levels:
            conf_pct = int(conf_level * 100)

            # Historical VaR
            hist_var = calculate_historical_var(returns_scaled, conf_level)
            hist_var_dollar = hist_var * portfolio_value

            # Parametric VaR
            param_var = calculate_parametric_var(returns_scaled, conf_level)
            param_var_dollar = param_var * portfolio_value

            # Monte Carlo VaR
            mc_var = calculate_monte_carlo_var(returns_scaled, conf_level, num_simulations)
            mc_var_dollar = mc_var * portfolio_value

            # Conditional VaR (CVaR)
            cvar = calculate_cvar(returns_scaled, conf_level)
            cvar_dollar = cvar * portfolio_value

            var_results[f"{conf_pct}%"] = {
                "confidence_level": conf_level,
                "historical": {
                    "var_percentage": round(hist_var * 100, 4),
                    "var_dollar": round(hist_var_dollar, 2)
                },
                "parametric": {
                    "var_percentage": round(param_var * 100, 4),
                    "var_dollar": round(param_var_dollar, 2)
                },
                "monte_carlo": {
                    "var_percentage": round(mc_var * 100, 4),
                    "var_dollar": round(mc_var_dollar, 2)
                },
                "conditional_var": {
                    "cvar_percentage": round(cvar * 100, 4),
                    "cvar_dollar": round(cvar_dollar, 2)
                }
            }

        # Calculate additional statistics
        mean_return = float(np.mean(returns))
        std_return = float(np.std(returns, ddof=1))
        skewness = float(stats.skew(returns))
        kurtosis = float(stats.kurtosis(returns))

        # Annualize statistics
        annual_return = mean_return * 252
        annual_volatility = std_return * np.sqrt(252)

        # Test for normality (Jarque-Bera test)
        jb_stat, jb_pvalue = stats.jarque_bera(returns)
        is_normal = bool(jb_pvalue > 0.05)

        # Calculate worst historical loss
        worst_loss = float(-np.min(returns))
        worst_loss_dollar = worst_loss * portfolio_value

        # Calculate best historical gain
        best_gain = float(np.max(returns))
        best_gain_dollar = best_gain * portfolio_value

        # Return results
        results = {
            "success": True,
            "symbol": symbol,
            "parameters": {
                "portfolio_value": portfolio_value,
                "time_horizon": time_horizon,
                "time_horizon_description": f"{time_horizon}-day VaR",
                "num_simulations": num_simulations,
                "data_points": len(returns),
                "data_period_days": data_period
            },
            "var_by_confidence": var_results,
            "distribution_statistics": {
                "mean_daily_return": round(mean_return * 100, 4),
                "std_daily_return": round(std_return * 100, 4),
                "annual_return": round(annual_return * 100, 2),
                "annual_volatility": round(annual_volatility * 100, 2),
                "skewness": round(skewness, 4),
                "kurtosis": round(kurtosis, 4),
                "is_normally_distributed": is_normal,
                "jarque_bera_pvalue": round(jb_pvalue, 4)
            },
            "extreme_values": {
                "worst_daily_loss_pct": round(worst_loss * 100, 4),
                "worst_daily_loss_dollar": round(worst_loss_dollar, 2),
                "best_daily_gain_pct": round(best_gain * 100, 4),
                "best_daily_gain_dollar": round(best_gain_dollar, 2)
            },
            "interpretation": {
                "distribution_type": "normal" if is_normal else "non-normal",
                "tail_risk": "high" if abs(skewness) > 1 or kurtosis > 3 else "moderate" if abs(skewness) > 0.5 or kurtosis > 1 else "low",
                "recommended_method": "historical" if not is_normal else "parametric",
                "notes": [
                    "Historical VaR uses actual distribution of returns",
                    "Parametric VaR assumes normal distribution",
                    "Monte Carlo VaR uses simulated returns",
                    "CVaR shows average loss beyond VaR threshold",
                    f"Distribution is {'normal' if is_normal else 'non-normal'} (Jarque-Bera test)"
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

    # Run VaR analysis
    result = run_var_analysis(input_data)

    # Output result as JSON
    print(json.dumps(result))
