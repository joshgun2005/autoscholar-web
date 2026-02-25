# Python Quantitative Analysis

VibeQuant includes a powerful Python engine for quantitative financial analysis. All Python code executes in an isolated environment with 17 scientific libraries.

## Built-in Analysis Models

### 1. Monte Carlo Simulation

Simulate future price paths using geometric Brownian motion.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbol` | string | required | Stock ticker symbol |
| `num_simulations` | int | 10,000 | Number of simulation paths |
| `time_horizon` | int | 252 | Trading days to simulate |
| `initial_investment` | float | 10,000 | Starting portfolio value |

**Example prompt**:
```
"Run a Monte Carlo simulation on NVDA with 50,000 paths over 500 trading days"
```

**Output**: Distribution statistics, probability of profit, VaR estimates, simulation chart.

---

### 2. Options Pricing (Black-Scholes)

Price European options with full Greeks calculation.

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `symbol` | string | Underlying asset |
| `strike_price` | float | Strike price |
| `expiry_days` | int | Days to expiration |
| `risk_free_rate` | float | Risk-free rate (default: 0.05) |
| `option_type` | string | "call" or "put" |

**Output**: Option price, delta, gamma, theta, vega, rho, put-call parity check.

**Example prompt**:
```
"Price a call option on AAPL with strike $200, 30 days to expiry"
```

---

### 3. GARCH Volatility Model

Estimate and forecast volatility using GARCH(1,1).

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `symbol` | string | Stock ticker |
| `data_period` | int | Historical days (default: 756) |
| `forecast_horizon` | int | Days to forecast (default: 30) |

**Output**: GARCH parameters (omega, alpha, beta), historical volatility, forecast, interpretation.

---

### 4. Value at Risk (VaR)

Calculate VaR using three methods: Historical, Parametric, and Monte Carlo.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbol` | string | required | Stock ticker |
| `portfolio_value` | float | 100,000 | Portfolio value |
| `confidence_levels` | float[] | [0.90, 0.95, 0.99] | Confidence levels |
| `time_horizon` | int | 1 | Holding period (days) |
| `num_simulations` | int | 10,000 | MC simulations |

**Output**: VaR by method and confidence level, CVaR (Expected Shortfall), distribution statistics.

---

### 5. Portfolio Optimization

Mean-variance optimization using Modern Portfolio Theory.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbols` | string[] | required | Portfolio tickers |
| `risk_free_rate` | float | 0.05 | Risk-free rate |
| `min_weight` | float | 0.0 | Minimum allocation per asset |
| `max_weight` | float | 1.0 | Maximum allocation per asset |
| `generate_frontier` | bool | false | Generate efficient frontier |

**Example prompt**:
```
"Optimize a portfolio of AAPL, MSFT, GOOGL, AMZN, NVDA for maximum Sharpe ratio"
```

**Output**: Optimal weights (max Sharpe, min variance, equal weight), efficient frontier, correlation matrix.

---

### 6. Risk Metrics Analysis

Comprehensive risk-adjusted performance metrics.

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `symbol` | string | required | Stock ticker |
| `benchmark_symbol` | string | SPY | Benchmark |
| `risk_free_rate` | float | 0.05 | Risk-free rate |

**Output**:
- **Return metrics**: Annualized return, volatility, excess return
- **Risk-adjusted**: Sharpe, Sortino, Calmar, Information, Treynor ratios
- **Market**: Beta, Alpha, Correlation, R-squared, Tracking error
- **Drawdown**: Max drawdown, recovery days
- **Trading**: Win rate, profit factor, average win/loss

---

### 7. Chart Generation (`create_plot`)

Create publication-quality charts.

**Plot types**: `line`, `bar`, `scatter`, `histogram`, `candlestick`, `area`, `pie`, `heatmap`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `plot_type` | string | Chart type |
| `data` | object | Data to plot |
| `title` | string | Chart title |
| `xlabel` / `ylabel` | string | Axis labels |
| `color` | string/string[] | Colors |
| `figsize` | [w, h] | Figure size |
| `theme` | string | "default", "dark", "colorful" |

---

### 8. Custom Python Code

Execute arbitrary Python code with access to all 17 libraries and FMP data.

**Example prompt**:
```
"Write Python code to:
1. Fetch 2 years of daily prices for AAPL and MSFT
2. Calculate 30-day rolling correlation
3. Plot correlation over time with a heatmap of monthly averages"
```

The AI will generate and execute Python code, returning charts and output.

**Available in custom code**:
- All 17 scientific libraries
- `fmp_api_key` for fetching financial data
- Matplotlib figure generation (saved as PNG)
- Print output captured and returned

---

## Python Libraries Reference

| Library | Import | Key Functions |
|---------|--------|---------------|
| **numpy** | `import numpy as np` | Arrays, linear algebra, random |
| **pandas** | `import pandas as pd` | DataFrames, time series, IO |
| **scipy** | `from scipy import stats, optimize` | Statistics, optimization |
| **scikit-learn** | `from sklearn import ...` | ML models, preprocessing |
| **statsmodels** | `import statsmodels.api as sm` | OLS, ARIMA, tests |
| **matplotlib** | `import matplotlib.pyplot as plt` | Plotting |
| **seaborn** | `import seaborn as sns` | Statistical plots |
| **plotly** | `import plotly.graph_objects as go` | Interactive charts |
| **arch** | `from arch import arch_model` | GARCH, EGARCH |
| **cvxpy** | `import cvxpy as cp` | Convex optimization |
| **yfinance** | `import yfinance as yf` | Market data |
| **ta** | `import ta` | 40+ technical indicators |
| **quantstats** | `import quantstats as qs` | Portfolio analytics |
| **beautifulsoup4** | `from bs4 import BeautifulSoup` | HTML parsing |
| **requests** | `import requests` | HTTP client |
| **lxml** | `from lxml import etree` | XML parsing |
| **Pillow** | `from PIL import Image` | Image processing |
