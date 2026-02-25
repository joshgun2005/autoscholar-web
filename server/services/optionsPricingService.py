#!/usr/bin/env python3
"""
Black-Scholes Options Pricing Model
Calculates theoretical option prices and Greeks for European options
Supports direct API integration for fetching real market data
"""

import sys
import json
import math
import os
from scipy import stats

# Import our FMP client
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices, get_stock_quote, calculate_historical_volatility

def black_scholes_call(S, K, T, r, sigma):
    """Calculate Black-Scholes call option price"""
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    call_price = S * stats.norm.cdf(d1) - K * math.exp(-r * T) * stats.norm.cdf(d2)
    return call_price

def black_scholes_put(S, K, T, r, sigma):
    """Calculate Black-Scholes put option price"""
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    put_price = K * math.exp(-r * T) * stats.norm.cdf(-d2) - S * stats.norm.cdf(-d1)
    return put_price

def calculate_greeks(S, K, T, r, sigma, option_type):
    """Calculate option Greeks: Delta, Gamma, Theta, Vega, Rho"""
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    # Delta
    if option_type == "call":
        delta = stats.norm.cdf(d1)
    else:  # put
        delta = stats.norm.cdf(d1) - 1

    # Gamma (same for call and put)
    gamma = stats.norm.pdf(d1) / (S * sigma * math.sqrt(T))

    # Vega (same for call and put)
    vega = S * stats.norm.pdf(d1) * math.sqrt(T) / 100  # divided by 100 for 1% change

    # Theta
    if option_type == "call":
        theta = (-(S * stats.norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
                 - r * K * math.exp(-r * T) * stats.norm.cdf(d2)) / 365
    else:  # put
        theta = (-(S * stats.norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
                 + r * K * math.exp(-r * T) * stats.norm.cdf(-d2)) / 365

    # Rho
    if option_type == "call":
        rho = K * T * math.exp(-r * T) * stats.norm.cdf(d2) / 100  # divided by 100 for 1% change
    else:  # put
        rho = -K * T * math.exp(-r * T) * stats.norm.cdf(-d2) / 100

    return {
        "delta": round(delta, 4),
        "gamma": round(gamma, 4),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
        "rho": round(rho, 4)
    }

def calculate_implied_volatility(option_price, S, K, T, r, option_type, max_iterations=100, tolerance=0.0001):
    """Calculate implied volatility using Newton-Raphson method"""
    sigma = 0.3  # Initial guess

    for i in range(max_iterations):
        if option_type == "call":
            price = black_scholes_call(S, K, T, r, sigma)
        else:
            price = black_scholes_put(S, K, T, r, sigma)

        # Vega for Newton-Raphson
        d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
        vega = S * stats.norm.pdf(d1) * math.sqrt(T)

        if abs(vega) < 1e-10:
            break

        diff = option_price - price
        if abs(diff) < tolerance:
            return round(sigma, 4)

        sigma = sigma + diff / vega

        # Ensure sigma stays positive
        if sigma <= 0:
            sigma = 0.01

    return round(sigma, 4)

def main():
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())

        # Check if symbol is provided (new API mode)
        symbol = input_data.get('symbol')

        if symbol:
            # DIRECT API MODE - Fetch data from FMP
            print(f"Fetching market data for {symbol} from FMP API...", file=sys.stderr)

            # Get current stock quote for current price
            quote = get_stock_quote(symbol)
            S = quote['price']
            print(f"Current stock price: ${S:.2f}", file=sys.stderr)

            # Get historical prices to calculate volatility
            hist_data = get_historical_prices(symbol)
            closing_prices = [h['close'] for h in reversed(hist_data['historical'])]

            # Calculate historical volatility (annualized)
            sigma_provided = input_data.get('volatility')
            if sigma_provided:
                sigma = sigma_provided
                print(f"Using provided volatility: {sigma*100:.2f}%", file=sys.stderr)
            else:
                # Use 30 days of history for volatility calculation
                recent_prices = closing_prices[-30:] if len(closing_prices) >= 30 else closing_prices
                sigma = calculate_historical_volatility(recent_prices, annualize=True)
                print(f"Calculated 30-day historical volatility: {sigma*100:.2f}%", file=sys.stderr)

            # Extract other required parameters
            K = input_data.get('strike_price')
            T = input_data.get('time_to_maturity')
            r = input_data.get('risk_free_rate', 0.05)
            option_type = input_data.get('option_type', 'call').lower()

            # Validate required inputs
            if K is None or T is None:
                raise ValueError("strike_price and time_to_maturity are required")
        else:
            # MANUAL MODE - Use provided parameters
            S = input_data.get('stock_price')
            K = input_data.get('strike_price')
            T = input_data.get('time_to_maturity')
            r = input_data.get('risk_free_rate', 0.05)
            sigma = input_data.get('volatility')
            option_type = input_data.get('option_type', 'call').lower()

            # Validate inputs
            if S is None or K is None or T is None:
                raise ValueError("Either provide 'symbol' OR all of: stock_price, strike_price, time_to_maturity")

            # If volatility not provided, use default
            if sigma is None:
                sigma = 0.3  # 30% default volatility
                print("Using default volatility: 30%", file=sys.stderr)

        # Common validation for all modes
        if S <= 0 or K <= 0 or T <= 0:
            raise ValueError("stock_price, strike_price, and time_to_maturity must be positive")

        if option_type not in ['call', 'put']:
            raise ValueError("option_type must be 'call' or 'put'")

        if sigma <= 0:
            raise ValueError("volatility must be positive")

        # Calculate option prices
        call_price = black_scholes_call(S, K, T, r, sigma)
        put_price = black_scholes_put(S, K, T, r, sigma)

        # Calculate Greeks for both call and put
        call_greeks = calculate_greeks(S, K, T, r, sigma, "call")
        put_greeks = calculate_greeks(S, K, T, r, sigma, "put")

        # Calculate intrinsic and time value
        call_intrinsic = max(0, S - K)
        put_intrinsic = max(0, K - S)
        call_time_value = call_price - call_intrinsic
        put_time_value = put_price - put_intrinsic

        # Calculate moneyness
        if S > K:
            moneyness = "ITM" if option_type == "call" else "OTM"
        elif S < K:
            moneyness = "OTM" if option_type == "call" else "ITM"
        else:
            moneyness = "ATM"

        # Prepare result
        result = {
            "success": True,
            "parameters": {
                "stock_price": round(S, 2),
                "strike_price": round(K, 2),
                "time_to_maturity": round(T, 4),
                "risk_free_rate": round(r, 4),
                "volatility": round(sigma, 4),
                "option_type": option_type
            },
            "call_option": {
                "price": round(call_price, 4),
                "intrinsic_value": round(call_intrinsic, 4),
                "time_value": round(call_time_value, 4),
                "greeks": call_greeks,
                "moneyness": "ITM" if S > K else ("ATM" if S == K else "OTM")
            },
            "put_option": {
                "price": round(put_price, 4),
                "intrinsic_value": round(put_intrinsic, 4),
                "time_value": round(put_time_value, 4),
                "greeks": put_greeks,
                "moneyness": "ITM" if S < K else ("ATM" if S == K else "OTM")
            },
            "parity_check": {
                "call_minus_put": round(call_price - put_price, 4),
                "stock_minus_pv_strike": round(S - K * math.exp(-r * T), 4),
                "parity_holds": bool(abs((call_price - put_price) - (S - K * math.exp(-r * T))) < 0.01)
            }
        }

        # Output result as JSON
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
