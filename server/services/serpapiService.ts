import { getJson } from 'serpapi';

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

export interface ImageResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
  width?: number;
  height?: number;
}

export interface MapDirections {
  from: string;
  to: string;
  distance: string;
  duration: string;
  steps: Array<{
    instruction: string;
    distance: string;
    duration: string;
  }>;
  mapUrl: string;
}

export interface ShoppingProduct {
  title: string;
  price: string;
  source: string;
  link: string;
  thumbnail: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
}

export async function searchImages(query: string, limit: number = 10): Promise<ImageResult[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_images',
      q: query,
      api_key: SERPAPI_API_KEY,
      num: Math.min(limit, 20),
    });

    const images: ImageResult[] = (response.images_results || []).slice(0, limit).map((img: any) => ({
      title: img.title || '',
      url: img.original || img.link || '',
      thumbnail: img.thumbnail || img.original || '',
      source: img.source || '',
      width: img.original_width,
      height: img.original_height,
    }));

    return images;
  } catch (error) {
    console.error('SerpAPI image search error:', error);
    throw new Error(`Failed to search images: ${(error as Error).message}`);
  }
}

export async function getMapDirections(from: string, to: string): Promise<MapDirections> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_maps_directions',
      start_addr: from,
      end_addr: to,
      api_key: SERPAPI_API_KEY,
    });

    const directions = response.directions || [];
    const route = directions[0] || {};
    const placesInfo = response.places_info || [];
    
    const steps = (route.steps || []).map((step: any) => ({
      instruction: step.instruction || '',
      distance: formatDistance(step.distance),
      duration: step.duration || '',
    }));

    const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;

    return {
      from: placesInfo[0]?.address || from,
      to: placesInfo[1]?.address || to,
      distance: formatDistance(route.distance),
      duration: route.duration || 'N/A',
      steps: steps.slice(0, 10),
      mapUrl,
    };
  } catch (error) {
    console.error('SerpAPI directions error:', error);
    throw new Error(`Failed to get directions: ${(error as Error).message}`);
  }
}

function formatDistance(meters: number | undefined): string {
  if (!meters) return 'N/A';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

export async function searchGoogleShopping(query: string, limit: number = 10): Promise<ShoppingProduct[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_shopping',
      q: query,
      api_key: SERPAPI_API_KEY,
      num: Math.min(limit, 20),
    });

    const products: ShoppingProduct[] = (response.shopping_results || []).slice(0, limit).map((product: any) => ({
      title: product.title || '',
      price: product.price || product.extracted_price || 'N/A',
      source: product.source || '',
      link: product.link || '',
      thumbnail: product.thumbnail || '',
      rating: product.rating ? parseFloat(product.rating) : undefined,
      reviews: product.reviews ? parseInt(product.reviews) : undefined,
      delivery: product.delivery || undefined,
    }));

    return products;
  } catch (error) {
    console.error('SerpAPI shopping search error:', error);
    throw new Error(`Failed to search products: ${(error as Error).message}`);
  }
}

export interface FinanceData {
  symbol: string;
  price: string;
  currency: string;
  changePercent?: string;
  marketCap?: string;
  priceHistory?: Array<{
    date: string;
    price: number;
  }>;
}

export async function searchFinance(query: string): Promise<FinanceData> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_finance',
      q: query,
      api_key: SERPAPI_API_KEY,
    });

    const summary = response.summary || {};
    const graph = response.graph || [];
    
    const extractedPrice = summary.extracted_price;
    const price = extractedPrice ? `${extractedPrice}` : (summary.price || 'N/A');
    const currency = summary.currency || 'USD';
    const symbol = summary.stock || query;
    
    let changePercent = summary.price_movement?.percentage;
    if (changePercent) {
      changePercent = changePercent > 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
    }
    
    const priceHistory = graph.slice(-30).map((point: any) => ({
      date: point.date || '',
      price: parseFloat(point.price || 0),
    })).filter((p: any) => p.price > 0 && p.date);

    return {
      symbol,
      price,
      currency,
      changePercent,
      marketCap: summary.market_cap || undefined,
      priceHistory: priceHistory.length > 0 ? priceHistory : undefined,
    };
  } catch (error) {
    console.error('SerpAPI finance search error:', error);
    throw new Error(`Failed to search finance data: ${(error as Error).message}`);
  }
}

export interface JobPosting {
  title: string;
  company: string;
  location: string;
  description: string;
  link: string;
  thumbnail?: string;
  postedAt?: string;
  salary?: string;
}

export async function searchJobs(query: string, location?: string, limit: number = 10): Promise<JobPosting[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_jobs',
      q: query,
      location: location || '',
      api_key: SERPAPI_API_KEY,
    });

    const jobs: JobPosting[] = (response.jobs_results || []).slice(0, limit).map((job: any) => ({
      title: job.title || '',
      company: job.company_name || '',
      location: job.location || '',
      description: job.description || '',
      link: job.share_link || job.apply_link || '',
      thumbnail: job.thumbnail || undefined,
      postedAt: job.detected_extensions?.posted_at || undefined,
      salary: job.detected_extensions?.salary || undefined,
    }));

    return jobs;
  } catch (error) {
    console.error('SerpAPI jobs search error:', error);
    throw new Error(`Failed to search jobs: ${(error as Error).message}`);
  }
}

export interface FlightOption {
  airline: string;
  flightNumber?: string;
  departure: {
    airport: string;
    time: string;
  };
  arrival: {
    airport: string;
    time: string;
  };
  duration: string;
  price: string;
  stops?: number;
  link?: string;
}

export async function searchFlights(
  departureId: string,
  arrivalId: string,
  outboundDate: string,
  returnDate?: string
): Promise<FlightOption[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_flights',
      departure_id: departureId,
      arrival_id: arrivalId,
      outbound_date: outboundDate,
      return_date: returnDate,
      api_key: SERPAPI_API_KEY,
      currency: 'USD',
    });

    const flights: FlightOption[] = (response.best_flights || response.other_flights || []).slice(0, 10).map((flight: any) => {
      const firstFlight = flight.flights?.[0] || {};
      return {
        airline: firstFlight.airline || 'Unknown',
        flightNumber: firstFlight.flight_number || undefined,
        departure: {
          airport: firstFlight.departure_airport?.id || departureId,
          time: firstFlight.departure_airport?.time || '',
        },
        arrival: {
          airport: firstFlight.arrival_airport?.id || arrivalId,
          time: firstFlight.arrival_airport?.time || '',
        },
        duration: flight.total_duration || 'N/A',
        price: flight.price || 'N/A',
        stops: (flight.flights?.length || 1) - 1,
        link: flight.booking_token ? `https://www.google.com/travel/flights` : undefined,
      };
    });

    return flights;
  } catch (error) {
    console.error('SerpAPI flights search error:', error);
    throw new Error(`Failed to search flights: ${(error as Error).message}`);
  }
}

export interface HotelOption {
  name: string;
  rating?: number;
  reviews?: number;
  price: string;
  thumbnail?: string;
  link: string;
  address?: string;
  amenities?: string[];
}

export async function searchHotels(
  query: string,
  checkInDate?: string,
  checkOutDate?: string,
  limit: number = 10
): Promise<HotelOption[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  if (checkInDate && !checkOutDate) {
    throw new Error('check_out_date is required when check_in_date is provided');
  }

  try {
    const params: any = {
      engine: 'google_hotels',
      q: query,
      api_key: SERPAPI_API_KEY,
      currency: 'USD',
    };

    if (checkInDate && checkOutDate) {
      params.check_in_date = checkInDate;
      params.check_out_date = checkOutDate;
    }

    const response = await getJson(params);

    const hotels: HotelOption[] = (response.properties || []).slice(0, limit).map((hotel: any) => ({
      name: hotel.name || '',
      rating: hotel.overall_rating ? parseFloat(hotel.overall_rating) : undefined,
      reviews: hotel.reviews ? parseInt(hotel.reviews) : undefined,
      price: hotel.rate_per_night?.lowest || hotel.total_rate?.lowest || 'N/A',
      thumbnail: hotel.images?.[0]?.thumbnail || undefined,
      link: hotel.link || '',
      address: hotel.description || undefined,
      amenities: hotel.amenities?.slice(0, 5) || undefined,
    }));

    return hotels;
  } catch (error) {
    console.error('SerpAPI hotels search error:', error);
    throw new Error(`Failed to search hotels: ${(error as Error).message}`);
  }
}

export interface VideoResult {
  title: string;
  link: string;
  thumbnail: string;
  channel: string;
  duration?: string;
  publishedDate?: string;
  views?: string;
}

export async function searchVideos(query: string, limit: number = 10): Promise<VideoResult[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_videos',
      q: query,
      api_key: SERPAPI_API_KEY,
    });

    const videos: VideoResult[] = (response.video_results || []).slice(0, limit).map((video: any) => ({
      title: video.title || '',
      link: video.link || '',
      thumbnail: video.thumbnail || '',
      channel: video.channel || video.source || '',
      duration: video.duration || undefined,
      publishedDate: video.published_date || video.date || undefined,
      views: video.views || undefined,
    }));

    return videos;
  } catch (error) {
    console.error('SerpAPI videos search error:', error);
    throw new Error(`Failed to search videos: ${(error as Error).message}`);
  }
}

export interface GoogleTrendData {
  query: string;
  interest: Array<{
    date: string;
    value: number;
  }>;
  relatedQueries?: Array<{
    query: string;
    value: number;
  }>;
  risingQueries?: Array<{
    query: string;
    value: string;
  }>;
}

export async function searchGoogleTrends(query: string): Promise<GoogleTrendData> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_trends',
      q: query,
      api_key: SERPAPI_API_KEY,
      data_type: 'TIMESERIES',
    });

    const interestOverTime = response.interest_over_time?.timeline_data || [];
    const relatedQueries = response.related_queries?.top || [];
    const risingQueries = response.related_queries?.rising || [];

    return {
      query,
      interest: interestOverTime.slice(0, 30).map((point: any) => ({
        date: point.date || '',
        value: point.values?.[0]?.extracted_value || 0,
      })),
      relatedQueries: relatedQueries.slice(0, 10).map((q: any) => ({
        query: q.query || '',
        value: q.value || 0,
      })),
      risingQueries: risingQueries.slice(0, 10).map((q: any) => ({
        query: q.query || '',
        value: q.value || 'N/A',
      })),
    };
  } catch (error) {
    console.error('SerpAPI Google Trends search error:', error);
    throw new Error(`Failed to search Google Trends: ${(error as Error).message}`);
  }
}

export interface ScholarArticle {
  title: string;
  link: string;
  authors?: string;
  publication: string;
  year?: string;
  citedBy?: number;
  snippet: string;
  pdfLink?: string;
}

export async function searchGoogleScholar(query: string, limit: number = 10): Promise<ScholarArticle[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'google_scholar',
      q: query,
      api_key: SERPAPI_API_KEY,
      num: Math.min(limit, 20),
    });

    const articles: ScholarArticle[] = (response.organic_results || []).slice(0, limit).map((article: any) => ({
      title: article.title || '',
      link: article.link || '',
      authors: article.publication_info?.authors?.map((a: any) => a.name).join(', ') || undefined,
      publication: article.publication_info?.summary || '',
      year: article.publication_info?.summary?.match(/\d{4}/)?.[0] || undefined,
      citedBy: article.inline_links?.cited_by?.total ? parseInt(article.inline_links.cited_by.total) : undefined,
      snippet: article.snippet || '',
      pdfLink: article.resources?.find((r: any) => r.file_format === 'PDF')?.link || undefined,
    }));

    return articles;
  } catch (error) {
    console.error('SerpAPI Google Scholar search error:', error);
    throw new Error(`Failed to search Google Scholar: ${(error as Error).message}`);
  }
}

export interface AppStoreApp {
  title: string;
  link: string;
  appId: string;
  developer: string;
  rating?: number;
  ratingCount?: number;
  price: string;
  thumbnail?: string;
  description: string;
  category?: string;
}

export async function searchAppStore(query: string, limit: number = 10): Promise<AppStoreApp[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY not configured');
  }

  try {
    const response = await getJson({
      engine: 'apple_app_store',
      term: query,
      api_key: SERPAPI_API_KEY,
      num: Math.min(limit, 20),
    });

    const apps: AppStoreApp[] = (response.organic_results || []).slice(0, limit).map((app: any) => ({
      title: app.title || '',
      link: app.link || '',
      appId: app.product_id || '',
      developer: app.developer || '',
      rating: app.rating ? parseFloat(app.rating) : undefined,
      ratingCount: app.reviews ? parseInt(app.reviews) : undefined,
      price: app.price || 'Free',
      thumbnail: app.thumbnail || undefined,
      description: app.description || '',
      category: app.category || undefined,
    }));

    return apps;
  } catch (error) {
    console.error('SerpAPI App Store search error:', error);
    throw new Error(`Failed to search App Store: ${(error as Error).message}`);
  }
}
