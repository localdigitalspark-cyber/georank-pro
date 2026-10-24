/**
 * GeoRank Pro - DataForSEO Google Local Maps Live Client
 * Path: /src/server/services/dataforseo.ts
 *
 * Provides real-time Google Maps Local Pack SERP data retrieval using
 * DataForSEO v3 Live Advanced API endpoints:
 * https://api.dataforseo.com/v3/serp/google/maps/live/advanced
 */

import type { SerpLocalItem } from '../../lib/serp/serp-parser.ts';
import { normalizeDomain } from '../../lib/serp/serp-parser.ts';

export interface DataForSeoCredentials {
  login?: string;
  password?: string;
  countryCode?: string;
  languageCode?: string;
  address?: string;
  zoom?: number;
}

export interface DataForSeoLivePinResult {
  items: SerpLocalItem[];
  checkUrl?: string;
  taskId?: string;
  rawItemsCount: number;
  rawCompetitors: Array<{
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    place_id?: string;
    phone?: string;
    rank?: number;
  }>;
}

/**
 * Automatically infers country code (e.g. "GB" or "US") based on address or coordinates
 */
export function inferCountryCode(address?: string, lat?: number, lng?: number): string {
  if (address) {
    const addr = address.toLowerCase();
    if (
      addr.includes('uk') ||
      addr.includes('united kingdom') ||
      addr.includes('london') ||
      addr.includes('england') ||
      addr.includes('scotland') ||
      addr.includes('wales') ||
      addr.includes('brentwood') ||
      addr.includes('southampton') ||
      addr.includes('alton') ||
      addr.includes('essex') ||
      addr.includes('hampshire')
    ) {
      return 'GB';
    }
    if (
      addr.includes('usa') ||
      addr.includes('united states') ||
      addr.match(/\b(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b/i)
    ) {
      return 'US';
    }
  }

  // Geographic bounding box approximation for Great Britain
  if (lat !== undefined && lng !== undefined) {
    if (lat >= 49.5 && lat <= 61.0 && lng >= -9.0 && lng <= 2.0) {
      return 'GB';
    }
  }

  return 'US';
}

/**
 * Checks whether valid DataForSEO credentials exist in environment variables
 */
export function isDataForSeoConfigured(credentials?: DataForSeoCredentials): boolean {
  const login = (credentials?.login || process.env.DATAFORSEO_LOGIN || '').replace(/^["']|["']$/g, '').trim();
  const password = (credentials?.password || process.env.DATAFORSEO_PASSWORD || '').replace(/^["']|["']$/g, '').trim();
  return Boolean(login.length > 0 && password.length > 0);
}

/**
 * Dispatches a coordinate query to DataForSEO Google Maps Live Advanced API.
 * Fails loudly: Throws explicit error if credentials are missing or API rejects.
 */
export async function fetchDataForSeoLivePin(
  lat: number,
  lng: number,
  keyword: string,
  credentials?: DataForSeoCredentials
): Promise<DataForSeoLivePinResult> {
  const login = (credentials?.login || process.env.DATAFORSEO_LOGIN || '').replace(/^["']|["']$/g, '').trim();
  const password = (credentials?.password || process.env.DATAFORSEO_PASSWORD || '').replace(/^["']|["']$/g, '').trim();

  if (!login || !password) {
    throw new Error('DataForSEO credentials missing: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for Live SERP mode.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${login.trim()}:${password.trim()}`).toString('base64');
  const countryCode = credentials?.countryCode || inferCountryCode(credentials?.address, lat, lng);
  const languageCode = credentials?.languageCode || 'en';

  // DataForSEO Google Maps Live Advanced endpoint expects location_coordinate in "lat,lng,15z" format
  const formattedCoord = `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)},15z`;

  const payload = [
    {
      keyword: keyword.trim(),
      location_coordinate: formattedCoord,
      language_code: languageCode,
      country_code: countryCode,
      depth: 20,
    },
  ];

  const response = await fetch('https://api.dataforseo.com/v3/serp/google/maps/live/advanced', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      'User-Agent': 'GeoRankPro-LiveClient/1.0',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DataForSEO API HTTP Error (${response.status}): ${errorText.substring(0, 250)}`);
  }

  const json = await response.json();

  if (json.status_code && json.status_code !== 20000) {
    throw new Error(`DataForSEO API error (${json.status_code}): ${json.status_message || 'Request rejected'}`);
  }

  const task = json.tasks?.[0];

  if (!task) {
    throw new Error('DataForSEO API returned empty task array');
  }

  if (task.status_code && task.status_code !== 20000) {
    throw new Error(`DataForSEO task failed (${task.status_code}): ${task.status_message || 'Task processing error'}`);
  }

  const resultObj = task.result?.[0];
  const itemsRaw = resultObj?.items || [];
  const checkUrl = resultObj?.check_url || task.check_url;
  const taskId = task.id;

  const rawCompetitors: Array<{
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    place_id?: string;
    phone?: string;
    rank?: number;
  }> = [];

  const parsedItems = itemsRaw.map((raw: any, index: number): SerpLocalItem => {
    // Extract review count from rating object or direct field
    const reviewCount =
      raw.rating?.votes_count ??
      raw.rating?.reviews_count ??
      raw.reviews_count ??
      raw.rating?.count ??
      0;

    // Extract rating score
    const ratingValue =
      raw.rating?.value ??
      raw.rating?.rating_value ??
      raw.rating ??
      null;

    // Safely extract domain without throwing URL parse errors
    let itemDomain = raw.domain;
    if (!itemDomain && raw.url) {
      itemDomain = normalizeDomain(raw.url);
    }

    const rankPos = Number(raw.rank_group ?? raw.rank_absolute ?? (index + 1));
    const title = raw.title || raw.name || 'Unknown Business';
    const ratingNum = typeof ratingValue === 'number' ? ratingValue : ratingValue ? parseFloat(ratingValue) : 4.5;
    const reviewsNum = typeof reviewCount === 'number' ? reviewCount : parseInt(reviewCount, 10) || 0;

    rawCompetitors.push({
      name: title,
      rating: ratingNum,
      reviews: reviewsNum,
      address: raw.address || raw.snippet,
      place_id: raw.place_id || raw.cid?.toString(),
      phone: raw.phone,
      rank: rankPos,
    });

    return {
      rank_position: rankPos,
      name: title,
      place_id: raw.place_id || raw.cid?.toString(),
      cid: raw.cid?.toString(),
      address: raw.address || raw.snippet,
      rating: ratingNum,
      reviews: reviewsNum,
      domain: itemDomain,
      url: raw.url,
      category: raw.category || raw.snippet_category || 'Local Service',
      phone: raw.phone,
      latitude: raw.latitude ?? lat,
      longitude: raw.longitude ?? lng,
    };
  });

  return {
    items: parsedItems,
    checkUrl,
    taskId,
    rawItemsCount: itemsRaw.length,
    rawCompetitors,
  };
}

/**
 * Convenience wrapper returning SerpLocalItem[] for compatibility
 */
export async function fetchDataForSeoMapsSerp(
  lat: number,
  lng: number,
  keyword: string,
  login?: string,
  password?: string
): Promise<SerpLocalItem[]> {
  const res = await fetchDataForSeoLivePin(lat, lng, keyword, { login, password });
  return res.items;
}
