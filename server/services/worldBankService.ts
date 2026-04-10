/**
 * World Bank API Service
 * Provides access to World Bank Indicators API v2 — 16,000+ development indicators
 * No API key required.
 */
import axios from 'axios';

const BASE_URL = 'https://api.worldbank.org/v2';
const TIMEOUT = 15000;

async function wbRequest(path: string, params: Record<string, string | number> = {}): Promise<any> {
  params.format = 'json';
  params.per_page = params.per_page || 1000;
  const url = `${BASE_URL}${path}`;
  const response = await axios.get(url, { params, timeout: TIMEOUT });
  return response.data;
}

// ── Country metadata ──────────────────────────────────────────────────────

export async function getWBCountries(countryCode?: string, incomeLevel?: string, region?: string) {
  const path = countryCode ? `/country/${countryCode}` : '/country';
  const params: Record<string, string | number> = {};
  if (incomeLevel) params.incomeLevel = incomeLevel;
  if (region) params.region = region;
  const data = await wbRequest(path, params);
  return Array.isArray(data) && data.length > 1 ? data[1] : data;
}

// ── Indicator metadata ────────────────────────────────────────────────────

export async function getWBIndicators(indicatorCode?: string, topicId?: number, source?: number) {
  let path: string;
  if (indicatorCode) {
    path = `/indicator/${indicatorCode}`;
  } else if (topicId) {
    path = `/topic/${topicId}/indicator`;
  } else {
    path = '/indicator';
  }
  const params: Record<string, string | number> = {};
  if (source) params.source = source;
  const data = await wbRequest(path, params);
  return Array.isArray(data) && data.length > 1 ? data[1] : data;
}

// ── Indicator data (main endpoint) ────────────────────────────────────────

export async function getWBIndicatorData(
  countryCode: string,
  indicatorCode: string,
  dateRange?: string,
  mrv?: number,
  mrnev?: number,
  frequency?: string,
  source?: number,
  perPage?: number
) {
  const path = `/country/${countryCode}/indicator/${indicatorCode}`;
  const params: Record<string, string | number> = {};
  if (dateRange) params.date = dateRange;
  if (mrv) params.mrv = mrv;
  if (mrnev) params.mrnev = mrnev;
  if (frequency) params.frequency = frequency;
  if (source) params.source = source;
  if (perPage) params.per_page = perPage;
  const data = await wbRequest(path, params);
  if (Array.isArray(data) && data.length > 1) {
    return { metadata: data[0], data: data[1] };
  }
  return data;
}

// ── Topics ────────────────────────────────────────────────────────────────

export async function getWBTopics() {
  const data = await wbRequest('/topic');
  return Array.isArray(data) && data.length > 1 ? data[1] : data;
}

// ── Regions ───────────────────────────────────────────────────────────────

export async function getWBRegions() {
  const data = await wbRequest('/region');
  return Array.isArray(data) && data.length > 1 ? data[1] : data;
}

// ── Income levels ─────────────────────────────────────────────────────────

export async function getWBIncomeLevels() {
  const data = await wbRequest('/incomelevel');
  return Array.isArray(data) && data.length > 1 ? data[1] : data;
}

// ── Sources ───────────────────────────────────────────────────────────────

export async function getWBSources(sourceId?: number) {
  const path = sourceId ? `/sources/${sourceId}` : '/sources';
  const data = await wbRequest(path);
  return Array.isArray(data) && data.length > 1 ? data[1] : data;
}

// ── Search indicators ─────────────────────────────────────────────────────

export async function searchWBIndicators(query: string, topicId?: number) {
  // Use the indicator list endpoint with source filtering or search via metadata API
  let path: string;
  if (topicId) {
    path = `/topic/${topicId}/indicator`;
  } else {
    path = '/indicator';
  }
  // The WB API doesn't have a direct keyword search for indicators in v2,
  // so we fetch by topic or use the metadata search endpoint
  const params: Record<string, string | number> = { per_page: 500 };
  const data = await wbRequest(path, params);
  const indicators = Array.isArray(data) && data.length > 1 ? data[1] : [];

  if (!Array.isArray(indicators)) return [];

  // Client-side filter by query
  const q = query.toLowerCase();
  return indicators.filter((ind: any) => {
    const name = (ind.name || '').toLowerCase();
    const note = (ind.sourceNote || '').toLowerCase();
    const id = (ind.id || '').toLowerCase();
    return name.includes(q) || note.includes(q) || id.includes(q);
  }).slice(0, 50);
}
