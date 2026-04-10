import axios from 'axios';

export const FMP_API_KEY = process.env.FMP_API_KEY;
export const FMP_STABLE_URL = 'https://financialmodelingprep.com/stable';

export async function fmpStableRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  const url = `${FMP_STABLE_URL}${endpoint}`;
  const response = await axios.get(url, {
    params: {
      ...params,
      apikey: FMP_API_KEY,
    },
    timeout: 60000,
  });
  return response.data;
}
