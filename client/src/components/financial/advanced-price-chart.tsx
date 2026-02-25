import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  Legend,
  Brush,
} from "recharts";

interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string;
  changeOverTime: number;
}

interface AdvancedPriceChartProps {
  data: {
    symbol: string;
    historical: HistoricalPrice[];
  };
}

export function AdvancedPriceChart({ data }: AdvancedPriceChartProps) {
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [showVolume, setShowVolume] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL'>('3M');

  if (!data || !data.historical || data.historical.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Advanced Price Chart</CardTitle>
          <CardDescription>No price data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const symbol = data.symbol;
  const allData = [...data.historical].reverse();

  // Filter data based on time range
  const filterDataByRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        return allData;
    }

    return allData.filter(item => new Date(item.date) >= startDate);
  };

  const filteredData = filterDataByRange();

  // Calculate moving averages
  const calculateMA = (period: number) => {
    return filteredData.map((item, index) => {
      if (index < period - 1) return null;
      const sum = filteredData
        .slice(index - period + 1, index + 1)
        .reduce((acc, curr) => acc + curr.close, 0);
      return sum / period;
    });
  };

  const calculateEMA = (period: number) => {
    const multiplier = 2 / (period + 1);
    const ema = [];

    // Start with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      if (i >= filteredData.length) break;
      sum += filteredData[i].close;
      ema.push(i === period - 1 ? sum / period : null);
    }

    // Calculate EMA
    for (let i = period; i < filteredData.length; i++) {
      const prevEMA = ema[i - 1] || filteredData[i - 1].close;
      ema.push(filteredData[i].close * multiplier + prevEMA * (1 - multiplier));
    }

    return ema;
  };

  const ma20 = calculateMA(20);
  const ma50 = calculateMA(50);
  const ema12 = calculateEMA(12);
  const ema26 = calculateEMA(26);

  const enrichedData = filteredData.map((item, index) => ({
    ...item,
    dateFormatted: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    }),
    ma20: ma20[index],
    ma50: ma50[index],
    ema12: ema12[index],
    ema26: ema26[index],
    isGreen: item.close >= item.open,
  }));

  const firstPrice = enrichedData[0]?.close || 0;
  const lastPrice = enrichedData[enrichedData.length - 1]?.close || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = (priceChange / firstPrice) * 100;
  const isPositive = priceChange >= 0;

  const minPrice = Math.min(...enrichedData.map(d => d.low));
  const maxPrice = Math.max(...enrichedData.map(d => d.high));
  const avgVolume = enrichedData.reduce((sum, d) => sum + d.volume, 0) / enrichedData.length;

  const high52w = Math.max(...allData.slice(-252).map(d => d.high));
  const low52w = Math.min(...allData.slice(-252).map(d => d.low));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-4 shadow-lg">
          <div className="text-sm font-semibold mb-2">{data.label}</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono font-semibold">${data.open?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono font-semibold text-green-600">${data.high?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono font-semibold text-red-600">${data.low?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Close:</span>
              <span className="font-mono font-semibold">${data.close?.toFixed(2)}</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between gap-6">
              <span className="text-muted-foreground">Change:</span>
              <span className={`font-mono ${data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.changePercent >= 0 ? '+' : ''}{data.changePercent?.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-mono">{(data.volume / 1_000_000).toFixed(2)}M</span>
            </div>
            {showMA && (
              <>
                {data.ma20 && (
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">MA(20):</span>
                    <span className="font-mono text-blue-600">${data.ma20?.toFixed(2)}</span>
                  </div>
                )}
                {data.ma50 && (
                  <div className="flex justify-between gap-6">
                    <span className="text-muted-foreground">MA(50):</span>
                    <span className="font-mono text-purple-600">${data.ma50?.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl">{symbol} - Historical Price Chart</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Advanced charting with technical indicators · {enrichedData.length} trading days
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-3xl font-bold">${lastPrice.toFixed(2)}</div>
              <div className={`flex items-center gap-1 justify-end text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-semibold">
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Time Range Selector */}
          <div className="flex gap-1 border rounded-lg p-1">
            {(['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('area')}
            >
              <LineChartIcon className="h-4 w-4 mr-1" />
              Area
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
            >
              Line
            </Button>
          </div>

          <Button
            variant={showVolume ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowVolume(!showVolume)}
          >
            Volume
          </Button>

          <Button
            variant={showMA ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowMA(!showMA)}
          >
            Indicators
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <div className="text-xs text-muted-foreground mb-1">Period High</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">${maxPrice.toFixed(2)}</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <div className="text-xs text-muted-foreground mb-1">Period Low</div>
            <div className="text-lg font-bold text-red-700 dark:text-red-400">${minPrice.toFixed(2)}</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <div className="text-xs text-muted-foreground mb-1">52W High</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-400">${high52w.toFixed(2)}</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <div className="text-xs text-muted-foreground mb-1">52W Low</div>
            <div className="text-lg font-bold text-orange-700 dark:text-orange-400">${low52w.toFixed(2)}</div>
          </div>
          <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <div className="text-xs text-muted-foreground mb-1">Avg Volume</div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
              {(avgVolume / 1_000_000).toFixed(1)}M
            </div>
          </div>
        </div>

        {/* Main Price Chart */}
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={enrichedData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPriceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                height={60}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                yAxisId="price"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

              {/* 52-week high/low reference lines */}
              <ReferenceLine
                yAxisId="price"
                y={high52w}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: '52W High', fontSize: 10, fill: '#10b981', position: 'right' }}
              />
              <ReferenceLine
                yAxisId="price"
                y={low52w}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: '52W Low', fontSize: 10, fill: '#ef4444', position: 'right' }}
              />

              {/* Chart Types */}
              {chartType === 'area' && (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill="url(#colorPriceArea)"
                  name="Price"
                />
              )}

              {chartType === 'line' && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
              )}

              {/* Moving Averages */}
              {showMA && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ma20"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    name="MA(20)"
                    strokeDasharray="5 5"
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="ma50"
                    stroke="#8b5cf6"
                    strokeWidth={1.5}
                    dot={false}
                    name="MA(50)"
                    strokeDasharray="3 3"
                  />
                </>
              )}

              <Brush
                dataKey="dateFormatted"
                height={30}
                stroke="#8b5cf6"
                fill="hsl(var(--muted))"
                travellerWidth={10}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        {showVolume && (
          <div>
            <div className="text-sm font-medium mb-3">Trading Volume</div>
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="dateFormatted"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}M`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [(value / 1_000_000).toFixed(2) + 'M', 'Volume']}
                  />
                  <Bar
                    dataKey="volume"
                    radius={[4, 4, 0, 0]}
                  >
                    {enrichedData.map((entry, index) => (
                      <Bar
                        key={index}
                        fill={entry.isGreen ? '#10b981' : '#ef4444'}
                        opacity={0.6}
                      />
                    ))}
                  </Bar>
                  <ReferenceLine
                    y={avgVolume}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{ value: 'Avg', fontSize: 10, fill: '#f59e0b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Price Performance Summary */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="text-sm font-medium mb-3">📊 Period Performance</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Period Start</div>
              <div className="font-semibold">${firstPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Period End</div>
              <div className="font-semibold">${lastPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Return</div>
              <div className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Volatility</div>
              <div className="font-semibold">
                {((maxPrice - minPrice) / firstPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Vol Traded</div>
              <div className="font-semibold">
                {(enrichedData.reduce((sum, d) => sum + d.volume, 0) / 1_000_000_000).toFixed(2)}B
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
