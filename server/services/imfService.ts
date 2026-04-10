/**
 * IMF Data API Service
 * Provides access to IMF DataMapper API and SDMX 3.0 API
 * No API key required.
 */
import axios from 'axios';

const DATAMAPPER_URL = 'https://www.imf.org/external/datamapper/api/v1';
const SDMX_URL = 'https://api.imf.org/external/sdmx/3.0';
const TIMEOUT = 20000;

// ── DataMapper API (simple, WEO-focused) ──────────────────────────────────

export async function getIMFIndicatorData(
  indicatorId: string,
  countries?: string,
  periods?: string
) {
  const countryPath = countries ? `/${countries}` : '';
  const url = `${DATAMAPPER_URL}/${indicatorId}${countryPath}`;
  const params: Record<string, string> = {};
  if (periods) params.periods = periods;
  const response = await axios.get(url, { params, timeout: TIMEOUT });
  return response.data;
}

export async function getIMFIndicators() {
  const response = await axios.get(`${DATAMAPPER_URL}/indicators`, { timeout: TIMEOUT });
  return response.data;
}

export async function getIMFCountries() {
  const response = await axios.get(`${DATAMAPPER_URL}/countries`, { timeout: TIMEOUT });
  return response.data;
}

export async function getIMFRegions() {
  const response = await axios.get(`${DATAMAPPER_URL}/regions`, { timeout: TIMEOUT });
  return response.data;
}

export async function getIMFGroups() {
  const response = await axios.get(`${DATAMAPPER_URL}/groups`, { timeout: TIMEOUT });
  return response.data;
}

// ── SDMX 3.0 API (comprehensive, multi-dimensional) ──────────────────────

export async function getIMFDataflows(dataflowId?: string) {
  const agencyId = dataflowId ? 'IMF.STA' : 'all';
  const dfId = dataflowId || 'all';
  const url = `${SDMX_URL}/structure/dataflow/${agencyId}/${dfId}/~`;
  const response = await axios.get(url, {
    headers: { Accept: 'application/json' },
    timeout: TIMEOUT,
  });
  return response.data;
}

export async function getIMFDataStructure(datastructureId: string) {
  const url = `${SDMX_URL}/structure/datastructure/IMF.STA/${datastructureId}/~`;
  const response = await axios.get(url, {
    headers: { Accept: 'application/json' },
    timeout: TIMEOUT,
  });
  return response.data;
}

export async function getIMFCodeList(codelistId: string) {
  const url = `${SDMX_URL}/structure/codelist/IMF.STA/${codelistId}/~`;
  const response = await axios.get(url, {
    headers: { Accept: 'application/json' },
    timeout: TIMEOUT,
  });
  return response.data;
}

export async function getIMFSDMXData(
  dataflowId: string,
  key: string,
  timePeriodFilter?: string
) {
  let url = `${SDMX_URL}/data/dataflow/IMF.STA/${dataflowId}/~/${key}`;
  const params: Record<string, string> = { detail: 'dataonly' };
  if (timePeriodFilter) params['c[TIME_PERIOD]'] = timePeriodFilter;
  const response = await axios.get(url, {
    params,
    headers: { Accept: 'text/csv' },
    timeout: TIMEOUT,
  });
  return response.data;
}
