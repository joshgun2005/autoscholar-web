#!/usr/bin/env python3
"""
Plot Service
Generates customizable plots and charts for financial data visualization
"""
import json
import sys
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server-side rendering
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import matplotlib.dates as mdates
import seaborn as sns
from io import BytesIO
import base64
from datetime import datetime
import os

# Import our FMP client for data fetching
sys.path.insert(0, os.path.dirname(__file__))
from fmpClient import get_historical_prices

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = 'white'


def create_plot(data_json: str) -> dict:
    """
    Create customizable plots for data visualization

    Args:
        data_json: JSON string containing:
            - plot_type: Type of plot ('line', 'bar', 'scatter', 'histogram', 'candlestick', 'area', 'pie', 'heatmap')
            - data: Plot data - can be:
                * dict with x and y keys (for simple plots)
                * dict with multiple series (for multi-line plots)
                * symbol (string) to auto-fetch from FMP API
            - title: Plot title (optional)
            - xlabel: X-axis label (optional)
            - ylabel: Y-axis label (optional)
            - color: Color or list of colors (optional, defaults: blue, green, red, etc.)
            - figsize: Figure size as [width, height] (optional, default: [12, 6])
            - grid: Show grid (optional, default: True)
            - legend: Show legend (optional, default: True if multiple series)
            - style: Line style for line plots (optional: '-', '--', '-.', ':')
            - marker: Marker style for scatter/line plots (optional: 'o', 's', '^', etc.)
            - alpha: Transparency (optional, 0-1, default: 0.8)
            - theme: Color theme ('default', 'dark', 'colorful') (optional)

    Returns:
        Dictionary containing plot as base64-encoded PNG image
    """
    try:
        data = json.loads(data_json)

        plot_type = data.get('plot_type', 'line').lower()
        plot_data = data.get('data')
        title = data.get('title', 'Financial Chart')
        xlabel = data.get('xlabel', '')
        ylabel = data.get('ylabel', '')
        color = data.get('color', None)
        figsize = data.get('figsize', [12, 6])
        show_grid = data.get('grid', True)
        show_legend = data.get('legend', None)
        style = data.get('style', '-')
        marker = data.get('marker', None)
        alpha = data.get('alpha', 0.8)
        theme = data.get('theme', 'default')

        # Handle symbol-based data fetching
        if isinstance(plot_data, str):
            symbol = plot_data
            print(f"Fetching historical data for {symbol}...", file=sys.stderr)
            hist_data = get_historical_prices(symbol)
            historical = hist_data['historical']

            # Convert to format suitable for plotting
            dates = [h['date'] for h in reversed(historical)]
            closes = [h['close'] for h in reversed(historical)]

            # Convert date strings to datetime objects for better formatting
            dates_parsed = [datetime.strptime(d, '%Y-%m-%d') if isinstance(d, str) else d for d in dates]

            # Only include close price by default (volume would dwarf price on same scale)
            plot_data = {
                'x': dates_parsed,
                'y': closes
            }

            if not title or title == 'Financial Chart':
                title = f'{symbol} Stock Price'
            if not ylabel:
                ylabel = 'Price ($)'
            if not xlabel:
                xlabel = 'Date'

        # Apply theme
        if theme == 'dark':
            plt.style.use('dark_background')
        elif theme == 'colorful':
            sns.set_palette("husl")

        # Create figure
        fig, ax = plt.subplots(figsize=tuple(figsize))

        # Parse data format
        if isinstance(plot_data, dict):
            # Check if it's simple x/y format or multi-series
            if 'x' in plot_data and 'y' in plot_data:
                # Simple x/y plot
                x_data = plot_data['x']
                y_data = plot_data['y']
                series_data = {'data': {'x': x_data, 'y': y_data}}
            elif 'x' in plot_data:
                # Multi-series with shared x-axis
                x_data = plot_data['x']
                series_data = {}
                for key, values in plot_data.items():
                    if key != 'x':
                        series_data[key] = {'x': x_data, 'y': values}
            else:
                return {
                    "success": False,
                    "error": "Invalid data format. Must include 'x' key."
                }
        elif isinstance(plot_data, list):
            # List of values, create auto x-axis
            x_data = list(range(len(plot_data)))
            y_data = plot_data
            series_data = {'data': {'x': x_data, 'y': y_data}}
        else:
            return {
                "success": False,
                "error": "Data must be a dict or list"
            }

        # Color palette
        if color is None:
            colors = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2']
        elif isinstance(color, str):
            colors = [color]
        else:
            colors = color

        # Generate plot based on type
        if plot_type == 'line':
            for idx, (label, data_dict) in enumerate(series_data.items()):
                x = data_dict['x']
                y = data_dict['y']
                plot_color = colors[idx % len(colors)]
                ax.plot(x, y, label=label, color=plot_color, linewidth=2,
                       linestyle=style, marker=marker, alpha=alpha)

        elif plot_type == 'bar':
            if len(series_data) == 1:
                # Single series bar chart
                label, data_dict = list(series_data.items())[0]
                x = data_dict['x']
                y = data_dict['y']
                ax.bar(x, y, color=colors[0], alpha=alpha, label=label)
            else:
                # Multiple series bar chart
                x = list(series_data.values())[0]['x']
                width = 0.8 / len(series_data)
                for idx, (label, data_dict) in enumerate(series_data.items()):
                    y = data_dict['y']
                    offset = width * idx - (width * len(series_data) / 2)
                    x_pos = np.arange(len(x)) + offset
                    ax.bar(x_pos, y, width, label=label, color=colors[idx % len(colors)], alpha=alpha)
                ax.set_xticks(np.arange(len(x)))
                ax.set_xticklabels(x, rotation=45, ha='right')

        elif plot_type == 'scatter':
            for idx, (label, data_dict) in enumerate(series_data.items()):
                x = data_dict['x']
                y = data_dict['y']
                plot_color = colors[idx % len(colors)]
                marker_style = marker if marker else 'o'
                ax.scatter(x, y, label=label, color=plot_color, alpha=alpha,
                          s=100, marker=marker_style)

        elif plot_type == 'area':
            for idx, (label, data_dict) in enumerate(series_data.items()):
                x = data_dict['x']
                y = data_dict['y']
                plot_color = colors[idx % len(colors)]
                ax.fill_between(x, y, alpha=alpha*0.6, color=plot_color, label=label)
                ax.plot(x, y, color=plot_color, linewidth=2, alpha=alpha)

        elif plot_type == 'histogram':
            # Histogram only uses y values
            for idx, (label, data_dict) in enumerate(series_data.items()):
                y = data_dict['y']
                plot_color = colors[idx % len(colors)]
                ax.hist(y, bins=30, alpha=alpha*0.7, color=plot_color,
                       edgecolor='black', label=label)

        elif plot_type == 'pie':
            # Pie chart uses first series only
            label, data_dict = list(series_data.items())[0]
            labels = data_dict['x']
            values = data_dict['y']
            ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=90,
                  colors=colors[:len(values)], textprops={'fontsize': 10})
            ax.axis('equal')

        elif plot_type == 'candlestick':
            # Candlestick requires OHLC data
            if 'open' in plot_data and 'high' in plot_data and 'low' in plot_data and 'close' in plot_data:
                dates = plot_data.get('x', list(range(len(plot_data['open']))))
                opens = plot_data['open']
                highs = plot_data['high']
                lows = plot_data['low']
                closes = plot_data['close']

                # Convert dates to numbers if they're strings
                if isinstance(dates[0], str):
                    x_pos = np.arange(len(dates))
                else:
                    x_pos = dates

                # Plot candlesticks
                for i, (o, h, l, c, x) in enumerate(zip(opens, highs, lows, closes, x_pos)):
                    color_candle = colors[0] if c >= o else colors[2]  # green if up, red if down
                    # High-low line
                    ax.plot([x, x], [l, h], color=color_candle, linewidth=1, alpha=alpha)
                    # Open-close rectangle
                    height = abs(c - o)
                    bottom = min(o, c)
                    ax.add_patch(plt.Rectangle((x - 0.3, bottom), 0.6, height,
                                              facecolor=color_candle, alpha=alpha))

                # Set x-axis labels if dates are strings
                if isinstance(dates[0], str):
                    # Show every nth label to avoid crowding
                    step = max(1, len(dates) // 10)
                    ax.set_xticks(x_pos[::step])
                    ax.set_xticklabels([dates[i] for i in range(0, len(dates), step)],
                                      rotation=45, ha='right')
            else:
                return {
                    "success": False,
                    "error": "Candlestick plot requires 'open', 'high', 'low', 'close' data"
                }

        elif plot_type == 'heatmap':
            # Heatmap requires 2D data
            if isinstance(plot_data, dict) and 'values' in plot_data:
                values = np.array(plot_data['values'])
                xlabels = plot_data.get('xlabels', None)
                ylabels = plot_data.get('ylabels', None)

                im = ax.imshow(values, cmap='RdYlGn', aspect='auto', alpha=alpha)

                if xlabels:
                    ax.set_xticks(np.arange(len(xlabels)))
                    ax.set_xticklabels(xlabels, rotation=45, ha='right')
                if ylabels:
                    ax.set_yticks(np.arange(len(ylabels)))
                    ax.set_yticklabels(ylabels)

                plt.colorbar(im, ax=ax)
            else:
                return {
                    "success": False,
                    "error": "Heatmap requires 'values' as 2D array in data"
                }

        else:
            return {
                "success": False,
                "error": f"Unknown plot type: {plot_type}. Supported types: line, bar, scatter, histogram, area, pie, candlestick, heatmap"
            }

        # Customize plot
        ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
        if xlabel:
            ax.set_xlabel(xlabel, fontsize=12)
        if ylabel:
            ax.set_ylabel(ylabel, fontsize=12)

        if show_grid and plot_type not in ['pie', 'heatmap']:
            ax.grid(True, alpha=0.3, linestyle='--')

        # Show legend if multiple series or explicitly requested
        if show_legend is None:
            show_legend = len(series_data) > 1 or plot_type == 'pie'

        if show_legend and plot_type not in ['pie', 'heatmap', 'candlestick']:
            ax.legend(loc='best', framealpha=0.9, fontsize=10)

        # Format axes for better readability
        if plot_type in ['line', 'area', 'scatter', 'bar']:
            x_values = list(series_data.values())[0]['x']

            # Check if x-axis contains datetime objects
            if len(x_values) > 0 and isinstance(x_values[0], datetime):
                # Use matplotlib date formatting
                ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
                ax.xaxis.set_major_locator(mdates.AutoDateLocator())
                plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
            elif len(x_values) > 0 and isinstance(x_values[0], str):
                # Show every nth label to avoid crowding for string labels
                step = max(1, len(x_values) // 15)
                ax.set_xticks(range(0, len(x_values), step))
                ax.set_xticklabels([x_values[i] for i in range(0, len(x_values), step)],
                                  rotation=45, ha='right')

            # Format y-axis with thousand separators for financial data
            if ylabel and ('$' in ylabel or 'Price' in ylabel or 'Revenue' in ylabel or 'Value' in ylabel):
                ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}' if abs(x) >= 1 else f'${x:.2f}'))
            elif ylabel and '%' in ylabel:
                ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'{x:.1f}%'))
            else:
                # General number formatting with thousand separators
                ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'{x:,.0f}' if abs(x) >= 1 else f'{x:.2f}'))

        plt.tight_layout()

        # Generate unique filename with timestamp and random UUID
        import uuid
        import time
        timestamp = int(time.time() * 1000)
        unique_id = str(uuid.uuid4())[:8]
        filename = f"plot_{timestamp}_{unique_id}.png"

        # Get the project root directory (2 levels up from this file)
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        plots_dir = os.path.join(project_root, 'public', 'plots')

        # Create directory if it doesn't exist
        os.makedirs(plots_dir, exist_ok=True)

        # Save the plot to file
        filepath = os.path.join(plots_dir, filename)
        plt.savefig(filepath, format='png', dpi=100, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        plt.close(fig)

        # Return the relative URL path
        image_url = f"/plots/{filename}"

        return {
            "success": True,
            "plot_type": plot_type,
            "image_url": image_url,
            "format": "png",
            "title": title
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

    # Create plot
    result = create_plot(input_data)

    # Output result as JSON
    print(json.dumps(result))
