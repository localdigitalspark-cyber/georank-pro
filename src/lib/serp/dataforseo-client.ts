/**
 * GeoRank Pro - DataForSEO Google Local Maps Live Client
 * Path: /src/lib/serp/dataforseo-client.ts
 *
 * Provides real-time Google Maps Local Pack SERP data retrieval using
 * DataForSEO v3 Live Advanced API endpoints.
 */

import type { SerpLocalItem } from './serp-parser.ts';
import { normalizeDomain } from './serp-parser.ts';

export interface DataForSeoCredentials {
  login?: string;
  password?: string;
  countryCode?: string;
  languageCode?: string;
  address?: string;
  zoom?: number;
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
      addr.includes('southampton')
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
    if (lat >= 49.8 && lat <= 60.9 && lng >= -8.6 && lng <= 1.8) {
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
 * Dispatches a coordinate query to DataForSEO Google Maps Live Advanced API
 */
export async function fetchDataForSeoLivePin(
  lat: number,
  lng: number,
  keyword: string,
  credentials?: DataForSeoCredentials
): Promise<SerpLocalItem[]> {
  const login = (credentials?.login || process.env.DATAFORSEO_LOGIN || '').replace(/^["']|["']$/g, '').trim();
  const password = (credentials?.password || process.env.DATAFORSEO_PASSWORD || '').replace(/^["']|["']$/g, '').trim();

  if (!login || !password) {
    throw new Error('DataForSEO credentials missing: DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for Live SERP mode.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${login.trim()}:${password.trim()}`).toString('base64');
  const countryCode = credentials?.countryCode || inferCountryCode(credentials?.address, lat, lng);
  const languageCode = credentials?.languageCode || 'en';
  const zoomLevel = credentials?.zoom || 13;

  // Payload: exact latitude, longitude, zoom: 13, and country code
  const payload = [
    {
      keyword: keyword.trim(),
      location_coordinate: `${lat},${lng},${zoomLevel}`,
      zoom: zoomLevel,
      country_code: countryCode,
      language_code: languageCode,
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
    throw new Error(`DataForSEO API error (${response.status}): ${errorText.substring(0, 200)}`);
  }

  const json = await response.json();
  const task = json.tasks?.[0];

  if (task?.status_code && task.status_code >= 40000) {
    throw new Error(`DataForSEO task failed (${task.status_code}): ${task.status_message}`);
  }

  const itemsRaw = task?.result?.[0]?.items || [];

  return itemsRaw.map((raw: any, index: number): SerpLocalItem => {
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
      4.5;

    // Safely extract domain without throwing URL parse errors
    let itemDomain = raw.domain;
    if (!itemDomain && raw.url) {
      itemDomain = normalizeDomain(raw.url);
    }

    return {
      rank_position: Number(raw.rank_group ?? raw.rank_absolute ?? (index + 1)),
      name: raw.title || raw.name || 'Unknown Business',
      place_id: raw.place_id || raw.cid?.toString(),
      cid: raw.cid?.toString(),
      address: raw.address || raw.snippet,
      rating: typeof ratingValue === 'number' ? ratingValue : parseFloat(ratingValue) || 4.5,
      reviews: typeof reviewCount === 'number' ? reviewCount : parseInt(reviewCount, 10) || 0,
      domain: itemDomain,
      url: raw.url,
      category: raw.category || raw.snippet_category || 'Local Service',
      phone: raw.phone,
      latitude: raw.latitude ?? lat,
      longitude: raw.longitude ?? lng,
    };
  });
}
