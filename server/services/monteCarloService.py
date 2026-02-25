#!/usr/bin/env python3
"""
Monte Carlo Simulation Service
Executes Monte Carlo simulations using financial data from FMP API directly
"""
import json
import sys
import numpy as np
from scipy import stats
import pandas as pd
import os

# Import our FMP client
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices

def run_monte_carlo_simulation(data_json: str) -> dict:
    """
    Run Monte Carlo simulation based on provided financial data

    Args:
        data_json: JSON string containing EITHER:
            Option 1 (Direct API mode - RECOMMENDED):
                - symbol: Stock ticker symbol (e.g., 'AAPL')
                - num_simulations: Number of Monte Carlo simulations to run
                - time_horizon: Number of days to project
                - initial_investment: Starting investment amount

            Option 2 (Manual data mode):
                - historical_prices: List of historical prices
                - num_simulations: Number of Monte Carlo simulations to run
                - time_horizon: Number of days to project
                - initial_investment: Starting investment amount

    Returns:
        Dictionary containing simulation results and statistics
    """
    try:
        data = json.loads(data_json)

        # Check if symbol is provided (new API mode)
        symbol = data.get('symbol')
        if symbol:
            # Fetch historical prices directly from FMP API
            print(f"Fetching historical prices for {symbol} from FMP API...", file=sys.stderr)
            hist_data = get_historical_prices(symbol)

            # Extract closing prices (most recent first, so reverse for chronological order)
            historical_prices = np.array([h['close'] for h in reversed(hist_data['historical'])])
            print(f"Fetched {len(historical_prices)} historical prices for {symbol}", file=sys.stderr)
        else:
            # Use provided historical prices (old mode)
            historical_prices = np.array(data.get('historical_prices', []))

        # Extract parameters
        num_simulations = data.get('num_simulations', 10000)
        time_horizon = data.get('time_horizon', 252)  # Default 1 year trading days
        initial_investment = data.get('initial_investment', 10000)
        
        if len(historical_prices) < 2:
            return {
                "error": "Need at least 2 historical prices for simulation",
                "success": False
            }
        
        # Calculate daily returns
        returns = np.diff(historical_prices) / historical_prices[:-1]
        
        # Calculate mean and standard deviation of returns
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        # Run Monte Carlo simulations
        simulation_results = np.zeros((num_simulations, time_horizon))
        final_values = np.zeros(num_simulations)
        
        for i in range(num_simulations):
            # Generate random returns based on historical distribution
            daily_returns = np.random.normal(mean_return, std_return, time_horizon)
            
            # Calculate price path
            price_path = initial_investment * np.cumprod(1 + daily_returns)
            simulation_results[i] = price_path
            final_values[i] = price_path[-1]
        
        # Calculate statistics
        mean_final_value = np.mean(final_values)
        median_final_value = np.median(final_values)
        std_final_value = np.std(final_values)
        min_final_value = np.min(final_values)
        max_final_value = np.max(final_values)
        
        # Calculate percentiles
        percentile_5 = np.percentile(final_values, 5)
        percentile_25 = np.percentile(final_values, 25)
        percentile_75 = np.percentile(final_values, 75)
        percentile_95 = np.percentile(final_values, 95)
        
        # Calculate probability of profit
        prob_profit = np.sum(final_values > initial_investment) / num_simulations * 100
        
        # Get sample paths for visualization (10 random simulations)
        sample_indices = np.random.choice(num_simulations, min(10, num_simulations), replace=False)
        sample_paths = simulation_results[sample_indices].tolist()
        
        # Return results
        results = {
            "success": True,
            "parameters": {
                "num_simulations": num_simulations,
                "time_horizon": time_horizon,
                "initial_investment": initial_investment,
                "mean_return": float(mean_return),
                "std_return": float(std_return)
            },
            "statistics": {
                "mean_final_value": float(mean_final_value),
                "median_final_value": float(median_final_value),
                "std_final_value": float(std_final_value),
                "min_final_value": float(min_final_value),
                "max_final_value": float(max_final_value),
                "percentile_5": float(percentile_5),
                "percentile_25": float(percentile_25),
                "percentile_75": float(percentile_75),
                "percentile_95": float(percentile_95),
                "probability_of_profit": float(prob_profit)
            },
            "sample_paths": sample_paths,
            "final_values_distribution": {
                "bins": np.histogram(final_values, bins=50)[1].tolist(),
                "counts": np.histogram(final_values, bins=50)[0].tolist()
            }
        }
        
        return results
        
    except Exception as e:
        return {
            "error": str(e),
            "success": False
        }

if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()
    
    # Run simulation
    result = run_monte_carlo_simulation(input_data)
    
    # Output result as JSON
    print(json.dumps(result))
