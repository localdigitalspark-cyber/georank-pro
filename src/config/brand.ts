/**
 * GeoRank Pro - Brand Configuration & Localization Engine
 * Path: /src/config/brand.ts
 *
 * Provides:
 * - Brand constants and product identification
 * - Geographic locality & currency detection (UK vs US)
 * - Number and currency formatting utilities
 */

export const BRAND = {
  name: 'GeoRank Pro',
  tagline: 'Local SEO Grid & Audit Engine',
  version: '2.4.0',
  defaultAgency: 'GeoRank Growth Agency',
  defaultDomain: 'georankpro.com',
} as const;

export type SupportedCountry = 'UK' | 'US';
export type SupportedCurrency = '£' | '$';

export interface BusinessLocaleInfo {
  country: SupportedCountry;
  currencySymbol: SupportedCurrency;
  currencyCode: 'GBP' | 'USD';
  distanceUnit: 'mi' | 'km';
  postalCodeLabel: 'Postcode' | 'ZIP Code';
  isUk: boolean;
}

/**
 * Detects whether a business is located in the UK or US based on address, city, postcode, and coordinates.
 * Strictly prevents cross-mixing UK addresses with USD billings or vice versa.
 */
export function detectLocaleFromBusiness(params: {
  address?: string;
  city?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
}): BusinessLocaleInfo {
  const text = `${params.address || ''} ${params.city || ''} ${params.postcode || ''}`.toLowerCase();

  // UK coordinate bounds: latitude roughly 49.8 to 60.9, longitude roughly -8.6 to 1.8
  const isUkCoords =
    params.lat !== undefined &&
    params.lng !== undefined &&
    params.lat >= 49.5 &&
    params.lat <= 61.0 &&
    params.lng >= -9.0 &&
    params.lng <= 2.0;

  // UK city and region heuristics
  const ukKeywords = [
    'uk',
    'united kingdom',
    'england',
    'scotland',
    'wales',
    'london',
    'alton',
    'southampton',
    'brentwood',
    'essex',
    'hampshire',
    'manchester',
    'birmingham',
    'bristol',
    'leeds',
    'sheffield',
    'newcastle',
    'glasgow',
    'edinburgh',
    'surrey',
    'kent',
    'sussex',
    'yorkshire',
  ];

  const hasUkKeyword = ukKeywords.some((kw) => text.includes(kw));
  const hasUkPostcode = /\b[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}\b/i.test(text);

  const isUk = isUkCoords || hasUkKeyword || hasUkPostcode;

  if (isUk) {
    return {
      country: 'UK',
      currencySymbol: '£',
      currencyCode: 'GBP',
      distanceUnit: 'mi',
      postalCodeLabel: 'Postcode',
      isUk: true,
    };
  }

  return {
    country: 'US',
    currencySymbol: '$',
    currencyCode: 'USD',
    distanceUnit: 'mi',
    postalCodeLabel: 'ZIP Code',
    isUk: false,
  };
}

/**
 * Formats a monetary number with correct regional currency symbol and comma separators.
 */
export function formatCurrency(amount: number, symbol: SupportedCurrency = '£'): string {
  const rounded = Math.round(amount);
  return `${symbol}${rounded.toLocaleString()}`;
}
