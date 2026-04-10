import { fmpStableRequest } from './client';
import type { TechnicalIndicator, HistoricalPrice } from './types';

// technical_indicator endpoint not available on /stable — compute from historical prices
async function fetchPrices(symbol: string, limit: number = 200): Promise<number[]> {
  const data = await fmpStableRequest<HistoricalPrice[]>('/historical-price-eod/full', { symbol });
  const arr = Array.isArray(data) ? data : [];
  // Most recent first — reverse for chronological order
  return arr.slice(0, limit).map(d => d.close).reverse();
}

function computeEMA(prices: number[], span: number): number[] {
  const alpha = 2 / (span + 1);
  const out: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    out.push(alpha * prices[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

export async function getRSI(symbol: string, period: number = 14): Promise<TechnicalIndicator[]> {
  const prices = await fetchPrices(symbol);
  if (prices.length < period + 1) return [];
  const deltas = prices.slice(1).map((p, i) => p - prices[i]);
  let avgGain = deltas.slice(0, period).reduce((s, d) => s + Math.max(d, 0), 0) / period;
  let avgLoss = deltas.slice(0, period).reduce((s, d) => s + Math.max(-d, 0), 0) / period;
  const results: TechnicalIndicator[] = [];
  for (let i = period; i < deltas.length; i++) {
    avgGain = (avgGain * (period - 1) + Math.max(deltas[i], 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-deltas[i], 0)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    results.push({ rsi: Math.round((100 - 100 / (1 + rs)) * 10000) / 10000 } as any);
  }
  return results.slice(-10);
}

export async function getMACD(symbol: string): Promise<TechnicalIndicator[]> {
  const prices = await fetchPrices(symbol);
  if (prices.length < 35) return [];
  const emaFast = computeEMA(prices, 12);
  const emaSlow = computeEMA(prices, 26);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = computeEMA(macdLine, 9);
  const results: TechnicalIndicator[] = macdLine.map((v, i) => ({
    macd: Math.round(v * 10000) / 10000,
    signal: Math.round(signalLine[i] * 10000) / 10000,
    histogram: Math.round((v - signalLine[i]) * 10000) / 10000,
  } as any));
  return results.slice(-10);
}

export async function getEMA(symbol: string, period: number = 50): Promise<TechnicalIndicator[]> {
  const prices = await fetchPrices(symbol);
  if (prices.length < period) return [];
  const ema = computeEMA(prices, period);
  return ema.slice(-10).map(v => ({ ema: Math.round(v * 10000) / 10000 } as any));
}

export async function getSMA(symbol: string, period: number = 50): Promise<TechnicalIndicator[]> {
  const prices = await fetchPrices(symbol);
  if (prices.length < period) return [];
  const results: TechnicalIndicator[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    results.push({ sma: Math.round((sum / period) * 10000) / 10000 } as any);
  }
  return results.slice(-10);
}

export async function getADX(symbol: string, period: number = 14): Promise<TechnicalIndicator[]> {
  // ADX requires OHLC data — fetch full historical
  const data = await fmpStableRequest<HistoricalPrice[]>('/historical-price-eod/full', { symbol });
  const arr = (Array.isArray(data) ? data : []).slice(0, 200).reverse();
  if (arr.length < period + 1) return [];

  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < arr.length; i++) {
    const high = arr[i].high, low = arr[i].low, prevClose = arr[i - 1].close;
    const prevHigh = arr[i - 1].high, prevLow = arr[i - 1].low;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    const upMove = high - prevHigh, downMove = prevLow - low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smoothed averages
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let aPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let aMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const dxValues: number[] = [];

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    aPlusDM = (aPlusDM * (period - 1) + plusDM[i]) / period;
    aMinusDM = (aMinusDM * (period - 1) + minusDM[i]) / period;
    const plusDI = atr === 0 ? 0 : (aPlusDM / atr) * 100;
    const minusDI = atr === 0 ? 0 : (aMinusDM / atr) * 100;
    const dx = plusDI + minusDI === 0 ? 0 : (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dxValues.push(dx);
  }

  if (dxValues.length < period) return [];
  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const results: TechnicalIndicator[] = [];
  for (let i = period; i < dxValues.length; i++) {
    adx = (adx * (period - 1) + dxValues[i]) / period;
    results.push({ adx: Math.round(adx * 10000) / 10000 } as any);
  }
  return results.slice(-10);
}

export async function getWilliamsR(symbol: string, period: number = 14): Promise<TechnicalIndicator[]> {
  const data = await fmpStableRequest<HistoricalPrice[]>('/historical-price-eod/full', { symbol });
  const arr = (Array.isArray(data) ? data : []).slice(0, 200).reverse();
  if (arr.length < period) return [];
  const results: TechnicalIndicator[] = [];
  for (let i = period - 1; i < arr.length; i++) {
    const window = arr.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...window.map(d => d.high));
    const lowestLow = Math.min(...window.map(d => d.low));
    const wr = highestHigh === lowestLow ? 0 : ((highestHigh - arr[i].close) / (highestHigh - lowestLow)) * -100;
    results.push({ williams: Math.round(wr * 10000) / 10000 } as any);
  }
  return results.slice(-10);
}

export async function getCCI(symbol: string, period: number = 20): Promise<TechnicalIndicator[]> {
  const data = await fmpStableRequest<HistoricalPrice[]>('/historical-price-eod/full', { symbol });
  const arr = (Array.isArray(data) ? data : []).slice(0, 200).reverse();
  if (arr.length < period) return [];
  const results: TechnicalIndicator[] = [];
  for (let i = period - 1; i < arr.length; i++) {
    const window = arr.slice(i - period + 1, i + 1);
    const tps = window.map(d => (d.high + d.low + d.close) / 3);
    const avgTP = tps.reduce((a, b) => a + b, 0) / period;
    const meanDev = tps.reduce((a, b) => a + Math.abs(b - avgTP), 0) / period;
    const cci = meanDev === 0 ? 0 : (tps[tps.length - 1] - avgTP) / (0.015 * meanDev);
    results.push({ cci: Math.round(cci * 10000) / 10000 } as any);
  }
  return results.slice(-10);
}

export async function getStochasticOscillator(symbol: string, period: number = 14): Promise<TechnicalIndicator[]> {
  const data = await fmpStableRequest<HistoricalPrice[]>('/historical-price-eod/full', { symbol });
  const arr = (Array.isArray(data) ? data : []).slice(0, 200).reverse();
  if (arr.length < period) return [];
  const results: TechnicalIndicator[] = [];
  for (let i = period - 1; i < arr.length; i++) {
    const window = arr.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...window.map(d => d.high));
    const lowestLow = Math.min(...window.map(d => d.low));
    const k = highestHigh === lowestLow ? 0 : ((arr[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
    results.push({ stoch: Math.round(k * 10000) / 10000 } as any);
  }
  return results.slice(-10);
}

// Weighted Moving Average API
export async function getWMA(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/wma', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// Double Exponential Moving Average API
export async function getDEMA(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/dema', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// Triple Exponential Moving Average API
export async function getTEMA(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/tema', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// Standard Deviation API
export async function getStandardDeviation(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/standarddeviation', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}
