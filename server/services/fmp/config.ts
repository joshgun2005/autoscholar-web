import axios from 'axios';

export const FMP_API_KEY = process.env.FMP_API_KEY;
export const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
export const FMP_V4_URL = 'https://financialmodelingprep.com/api/v4';

interface FMPResponse<T> {
  data: T;
  error?: string;
}

// Helper function to make FMP API calls
export async function fmpRequest<T>(url: string): Promise<T> {
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (error) {
    console.error('FMP API Error:', error);
    throw error;
  }
}
