/**
 * OECD Data API Service
 * Provides access to OECD SDMX API — 1,475+ dataflows covering economics, health, education, environment, etc.
 * No API key required.
 */
import axios from 'axios';

const BASE_URL_V1 = 'https://sdmx.oecd.org/public/rest';
const TIMEOUT = 20000;
const JSON_HEADER = { Accept: 'application/vnd.sdmx.structure+json; charset=utf-8; version=1.0' };

// ── Data queries ──────────────────────────────────────────────────────────

export async function getOECDData(
  agencyId: string,
  dataflowId: string,
  filter: string,
  startPeriod?: string,
  endPeriod?: string,
  lastNObservations?: number,
  version?: string
) {
  const ver = version || '';
  const url = `${BASE_URL_V1}/data/${agencyId},${dataflowId}${ver ? ',' + ver : ''}/${filter}`;
  const params: Record<string, string | number> = {
    dimensionAtObservation: 'AllDimensions',
    format: 'csvfilewithlabels',
  };
  if (startPeriod) params.startPeriod = startPeriod;
  if (endPeriod) params.endPeriod = endPeriod;
  if (lastNObservations) params.lastNObservations = lastNObservations;
  const response = await axios.get(url, {
    params,
    timeout: TIMEOUT,
    headers: { 'Accept-Encoding': 'gzip, deflate, br' },
  });
  return response.data;
}

// ── List all dataflows ────────────────────────────────────────────────────

export async function getOECDDataflows() {
  const url = `${BASE_URL_V1}/dataflow/all`;
  const response = await axios.get(url, {
    headers: { ...JSON_HEADER, 'Accept-Encoding': 'gzip, deflate, br' },
    timeout: TIMEOUT,
  });
  const dataflows = response.data?.data?.dataflows;
  if (!Array.isArray(dataflows)) return response.data;
  // Return a simplified list
  return dataflows.map((df: any) => ({
    id: df.id,
    agencyID: df.agencyID,
    version: df.version,
    name: typeof df.name === 'object' ? df.name.en || Object.values(df.name)[0] : df.name,
  }));
}

// ── Dataflow structure (dimensions + codelists) ───────────────────────────

export async function getOECDDataflowStructure(
  agencyId: string,
  dataflowId: string,
  version?: string
) {
  const ver = version || '1.0';
  const url = `${BASE_URL_V1}/dataflow/${agencyId}/${dataflowId}/${ver}`;
  const response = await axios.get(url, {
    params: { references: 'all', detail: 'referencepartial' },
    headers: { ...JSON_HEADER, 'Accept-Encoding': 'gzip, deflate, br' },
    timeout: TIMEOUT,
  });
  return response.data;
}

// ── Search dataflows by keyword ───────────────────────────────────────────

export async function searchOECDDataflows(query: string) {
  const url = `${BASE_URL_V1}/dataflow/all`;
  const response = await axios.get(url, {
    headers: { ...JSON_HEADER, 'Accept-Encoding': 'gzip, deflate, br' },
    timeout: TIMEOUT,
  });
  const dataflows = response.data?.data?.dataflows;
  if (!Array.isArray(dataflows)) return [];
  const q = query.toLowerCase();
  return dataflows
    .filter((df: any) => {
      const name = typeof df.name === 'object' ? (df.name.en || JSON.stringify(df.name)) : (df.name || '');
      return name.toLowerCase().includes(q) || (df.id || '').toLowerCase().includes(q);
    })
    .map((df: any) => ({
      id: df.id,
      agencyID: df.agencyID,
      version: df.version,
      name: typeof df.name === 'object' ? df.name.en || Object.values(df.name)[0] : df.name,
    }))
    .slice(0, 50);
}
