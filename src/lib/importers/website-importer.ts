/**
 * GeoRank Pro - Website URL Importer & Metadata Extractor
 * Path: /src/lib/importers/website-importer.ts
 *
 * Fetches target website HTML and extracts:
 * - Title, meta description, OpenGraph tags
 * - Telephone (tel: links & phone regex)
 * - Schema.org LocalBusiness, PostalAddress & GeoCoordinates
 * - Suggested service keywords from headings
 * - Geocoded location via address resolution
 */

import { resolveBusiness, inferKeywordFromQuery } from '../places/places-resolver.ts';

export interface WebsiteImportResult {
  name: string;
  category: string;
  phone: string;
  address: string;
  city: string;
  website: string;
  lat: number;
  lng: number;
  suggestedKeywords: string[];
  description?: string;
  schemaFound: boolean;
}

/**
 * Normalizes input URL with protocol
 */
export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Extracts text inside specified HTML tag
 */
function extractTagContents(html: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const results: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) results.push(text);
  }
  return results;
}

/**
 * Extracts meta tag attribute
 */
function extractMeta(html: string, nameOrProperty: string): string {
  const regex = new RegExp(
    `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const match = regex.exec(html);
  if (match) return match[1].trim();

  // Try flipped order: content="..." name="..."
  const flippedRegex = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProperty}["']`,
    'i'
  );
  const matchFlipped = flippedRegex.exec(html);
  return matchFlipped ? matchFlipped[1].trim() : '';
}

/**
 * Extracts JSON-LD schema objects
 */
function extractJsonLd(html: string): any[] {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const items: any[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
          items.push(...parsed['@graph']);
        } else {
          items.push(parsed);
        }
      }
    } catch {
      // Ignore JSON parse errors in malformed script tags
    }
  }
  return items;
}

/**
 * Extracts phone numbers from tel: links or regex
 */
function extractPhoneNumbers(html: string): string[] {
  const phones: Set<string> = new Set();

  // 1. Check tel: links
  const telRegex = /href=["']tel:([^"']+)["']/gi;
  let match;
  while ((match = telRegex.exec(html)) !== null) {
    const raw = match[1].trim().replace(/[^\d+()\s-]/g, '');
    if (raw.replace(/\D/g, '').length >= 7) {
      phones.add(raw);
    }
  }

  // 2. Check UK phone patterns
  const ukRegex = /(?:(?:\+44\s?\(0\)|\(0\)|0)[1-9]\d{1,4}\s?\d{3,4}\s?\d{3,4})/g;
  while ((match = ukRegex.exec(html)) !== null) {
    phones.add(match[0].trim());
  }

  // 3. Check US phone patterns
  const usRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/g;
  while ((match = usRegex.exec(html)) !== null) {
    const digits = match[0].replace(/\D/g, '');
    if (digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))) {
      phones.add(match[0].trim());
    }
  }

  return Array.from(phones);
}

/**
 * Main Scraper & Importer function
 */
export async function scrapeWebsiteForBusiness(rawUrl: string): Promise<WebsiteImportResult> {
  const targetUrl = normalizeUrl(rawUrl);
  if (!targetUrl) {
    throw new Error('Please provide a valid website URL.');
  }

  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 GeoRankPro/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} returned when fetching website`);
    }
    html = await res.text();
  } catch (err: any) {
    throw new Error(`Failed to fetch website (${targetUrl}): ${err.message || 'Connection failed'}`);
  }

  // 1. Extract Meta & Headings
  const title = (extractTagContents(html, 'title')[0] || extractMeta(html, 'og:title') || '').trim();
  const description = extractMeta(html, 'description') || extractMeta(html, 'og:description');
  const ogSiteName = extractMeta(html, 'og:site_name');

  // 2. Extract Business Name
  let businessName = ogSiteName || '';
  if (!businessName && title) {
    // Strip common separators e.g. "Austin Premier Plumbing | Emergency Repairs" -> "Austin Premier Plumbing"
    const parts = title.split(/[|\-–—:]/);
    businessName = parts[0]?.trim() || title;
  }
  if (!businessName) {
    try {
      businessName = new URL(targetUrl).hostname.replace(/^www\./, '').split('.')[0];
      businessName = businessName.charAt(0).toUpperCase() + businessName.slice(1);
    } catch {
      businessName = 'Local Business';
    }
  }

  // 3. Extract JSON-LD Schemas
  const schemas = extractJsonLd(html);
  let schemaFound = false;
  let schemaAddress = '';
  let schemaCity = '';
  let schemaPhone = '';
  let schemaLat: number | undefined;
  let schemaLng: number | undefined;
  let schemaCategory = '';

  for (const item of schemas) {
    const type = item['@type'];
    const isLocal =
      type === 'LocalBusiness' ||
      type === 'Organization' ||
      (typeof type === 'string' && (type.includes('Business') || type.includes('Store') || type.includes('Service')));

    if (isLocal) {
      schemaFound = true;
      if (item.name && typeof item.name === 'string') {
        businessName = item.name.trim();
      }
      if (item.telephone) {
        schemaPhone = String(item.telephone).trim();
      }
      if (item.address) {
        if (typeof item.address === 'string') {
          schemaAddress = item.address;
        } else if (typeof item.address === 'object') {
          const parts = [
            item.address.streetAddress,
            item.address.addressLocality,
            item.address.addressRegion,
            item.address.postalCode,
          ].filter(Boolean);
          schemaAddress = parts.join(', ');
          schemaCity = item.address.addressLocality || '';
        }
      }
      if (item.geo && typeof item.geo === 'object') {
        const lat = parseFloat(item.geo.latitude);
        const lng = parseFloat(item.geo.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          schemaLat = lat;
          schemaLng = lng;
        }
      }
      if (typeof type === 'string' && type !== 'LocalBusiness' && type !== 'Organization') {
        schemaCategory = type.replace(/([A-Z])/g, ' $1').trim();
      }
      break;
    }
  }

  // 4. Extract Phone (Schema fallback to regex/links)
  const parsedPhones = extractPhoneNumbers(html);
  const phone = schemaPhone || parsedPhones[0] || '';

  // 5. Headings & Suggested Keywords
  const h1s = extractTagContents(html, 'h1');
  const h2s = extractTagContents(html, 'h2');
  const h3s = extractTagContents(html, 'h3');
  const allHeadings = [...h1s, ...h2s, ...h3s];

  const genericStopWords = new Set([
    'home',
    'about us',
    'contact us',
    'welcome',
    'privacy policy',
    'terms of service',
    'testimonials',
    'reviews',
    'our services',
    'get in touch',
    'why choose us',
    'read more',
    'call now',
    'learn more',
  ]);

  const candidateKeywords: string[] = [];
  allHeadings.forEach((h) => {
    const clean = h.trim();
    if (clean.length >= 4 && clean.length <= 50 && !genericStopWords.has(clean.toLowerCase())) {
      candidateKeywords.push(clean);
    }
  });

  // Pick 3-5 unique keywords
  const uniqueKeywords = Array.from(new Set(candidateKeywords)).slice(0, 5);
  if (uniqueKeywords.length === 0) {
    const inferred = inferKeywordFromQuery(title || businessName);
    uniqueKeywords.push(inferred, `${inferred} Near Me`);
  }

  // 6. Infer Category
  const category = schemaCategory || inferKeywordFromQuery(businessName, title);

  // 7. Resolve Address & Geocoordinates
  let finalAddress = schemaAddress;
  let finalCity = schemaCity;
  let finalLat = schemaLat ?? 30.2672;
  let finalLng = schemaLng ?? -97.7431;

  if (!finalAddress) {
    // Attempt address match from page text
    const ukPostcodeRegex = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;
    const usZipRegex = /\b\d{5}(?:-\d{4})?\b/;
    const ukMatch = ukPostcodeRegex.exec(html);
    const usMatch = usZipRegex.exec(html);

    if (ukMatch) {
      finalAddress = `${businessName}, ${ukMatch[0]}`;
    } else if (usMatch) {
      finalAddress = `${businessName}, ${usMatch[0]}`;
    } else {
      finalAddress = `${businessName}, Service Area`;
    }
  }

  // If coordinates not found in schema, resolve via places-resolver
  if (schemaLat === undefined || schemaLng === undefined) {
    try {
      const resolved = await resolveBusiness({
        query: businessName,
        targetTownOrPostcode: finalAddress !== `${businessName}, Service Area` ? finalAddress : undefined,
      });
      finalLat = resolved.lat;
      finalLng = resolved.lng;
      if (!schemaAddress && resolved.address) {
        finalAddress = resolved.address;
      }
    } catch {
      // Fallback coordinates retained
    }
  }

  return {
    name: businessName,
    category,
    phone,
    address: finalAddress,
    city: finalCity,
    website: targetUrl,
    lat: finalLat,
    lng: finalLng,
    suggestedKeywords: uniqueKeywords,
    description: description || undefined,
    schemaFound,
  };
}
