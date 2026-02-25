#!/usr/bin/env python3
"""
GARCH Model Service
Estimates GARCH volatility models using financial data from FMP API directly
"""
import json
import sys
import numpy as np
import pandas as pd
import os
from datetime import datetime, timedelta

# Import our FMP client
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices

# Import GARCH from arch library
try:
    from arch import arch_model
    from arch.__future__ import reindexing
except ImportError:
    print("ERROR: arch library not installed. Please run: pip install arch", file=sys.stderr)
    sys.exit(1)


def run_garch_analysis(data_json: str) -> dict:
    """
    Run GARCH volatility model analysis on financial data

    Args:
        data_json: JSON string containing:
            - symbol: Stock ticker symbol (e.g., 'AAPL')
            - p: GARCH p parameter (default: 1)
            - q: GARCH q parameter (default: 1)
            - forecast_horizon: Number of days to forecast (default: 30)
            - data_period: Historical data period in days (default: 504 for ~2 years)

    Returns:
        Dictionary containing GARCH model results and volatility forecasts
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

        p = data.get('p', 1)  # GARCH order for lagged variance
        q = data.get('q', 1)  # GARCH order for lagged squared residuals
        forecast_horizon = data.get('forecast_horizon', 30)
        data_period = data.get('data_period', 504)

        # Fetch historical prices from FMP API
        print(f"Fetching historical prices for {symbol} from FMP API...", file=sys.stderr)
        hist_data = get_historical_prices(symbol)

        # Extract closing prices (most recent first, so reverse for chronological order)
        prices = [h['close'] for h in reversed(hist_data['historical'])]
        dates = [h['date'] for h in reversed(hist_data['historical'])]

        # Limit to requested period
        if len(prices) > data_period:
            prices = prices[-data_period:]
            dates = dates[-data_period:]

        print(f"Using {len(prices)} historical prices for GARCH analysis", file=sys.stderr)

        if len(prices) < 30:
            return {
                "error": f"Need at least 30 historical prices for GARCH model (got {len(prices)})",
                "success": False
            }

        # Convert to pandas Series with date index
        price_series = pd.Series(prices, index=pd.to_datetime(dates))

        # Calculate percentage returns (multiply by 100 for better numerical stability)
        returns = 100 * price_series.pct_change().dropna()

        print(f"Calculated {len(returns)} returns for GARCH model", file=sys.stderr)

        # Fit GARCH model
        print(f"Fitting GARCH({p},{q}) model...", file=sys.stderr)

        # Use constant mean model with GARCH volatility
        model = arch_model(
            returns,
            vol='Garch',
            p=p,
            q=q,
            mean='constant',
            dist='normal'
        )

        # Fit the model
        model_fit = model.fit(disp='off', show_warning=False)

        # Extract model parameters
        params = model_fit.params

        # Get parameter names and values
        param_dict = {}
        for param_name in params.index:
            param_dict[param_name] = float(params[param_name])

        # Extract GARCH-specific parameters
        omega = float(params.get('omega', 0))
        alpha = [float(params.get(f'alpha[{i+1}]', 0)) for i in range(q)]
        beta = [float(params.get(f'beta[{i+1}]', 0)) for i in range(p)]

        # Calculate persistence (sum of alpha and beta)
        persistence = sum(alpha) + sum(beta)

        # Get conditional volatility
        conditional_volatility = model_fit.conditional_volatility

        # Annualize conditional volatility (from daily to annual)
        annualized_volatility = conditional_volatility * np.sqrt(252) / 100  # Convert back from percentage

        # Get recent volatility values
        recent_volatility = annualized_volatility.tail(30).tolist()
        recent_dates = annualized_volatility.tail(30).index.strftime('%Y-%m-%d').tolist()

        # Current volatility
        current_volatility = float(annualized_volatility.iloc[-1])

        # Forecast volatility
        print(f"Forecasting volatility for {forecast_horizon} days...", file=sys.stderr)
        forecasts = model_fit.forecast(horizon=forecast_horizon, reindex=False)

        # Get variance forecasts and convert to volatility
        forecast_variance = forecasts.variance.values[-1, :]  # Last row contains the forecasts
        forecast_volatility = np.sqrt(forecast_variance) * np.sqrt(252) / 100  # Annualize and convert from percentage

        # Generate forecast dates
        last_date = pd.to_datetime(dates[-1])
        forecast_dates = [(last_date + timedelta(days=i+1)).strftime('%Y-%m-%d') for i in range(forecast_horizon)]

        # Model statistics
        aic = float(model_fit.aic)
        bic = float(model_fit.bic)
        log_likelihood = float(model_fit.loglikelihood)

        # Calculate summary statistics
        avg_volatility = float(annualized_volatility.mean())
        min_volatility = float(annualized_volatility.min())
        max_volatility = float(annualized_volatility.max())
        std_volatility = float(annualized_volatility.std())

        # Return results
        results = {
            "success": True,
            "symbol": symbol,
            "model_specification": {
                "type": f"GARCH({p},{q})",
                "p": p,
                "q": q,
                "mean_model": "constant",
                "distribution": "normal"
            },
            "parameters": {
                "all_params": param_dict,
                "omega": omega,
                "alpha": alpha,
                "beta": beta,
                "persistence": persistence,
                "mean": float(params.get('mu', 0))
            },
            "model_fit": {
                "aic": aic,
                "bic": bic,
                "log_likelihood": log_likelihood,
                "num_observations": len(returns)
            },
            "volatility_statistics": {
                "current_volatility": current_volatility,
                "average_volatility": avg_volatility,
                "min_volatility": min_volatility,
                "max_volatility": max_volatility,
                "std_volatility": std_volatility
            },
            "historical_volatility": {
                "dates": recent_dates,
                "values": recent_volatility
            },
            "volatility_forecast": {
                "dates": forecast_dates,
                "values": forecast_volatility.tolist(),
                "horizon": forecast_horizon
            },
            "interpretation": {
                "is_mean_reverting": persistence < 1,
                "persistence_level": "high" if persistence > 0.95 else "moderate" if persistence > 0.85 else "low",
                "shock_impact": "high" if sum(alpha) > 0.2 else "moderate" if sum(alpha) > 0.1 else "low",
                "volatility_clustering": "strong" if persistence > 0.9 else "moderate" if persistence > 0.7 else "weak"
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

    # Run GARCH analysis
    result = run_garch_analysis(input_data)

    # Output result as JSON
    print(json.dumps(result))
