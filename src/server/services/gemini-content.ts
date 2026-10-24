/**
 * GeoRank Pro - Content Generation Guardrails & Locality Normalizer
 * Path: /src/server/services/gemini-content.ts
 *
 * Implements strict content guardrails:
 * 1. Duplicate Keyword Token Sanitization (e.g., "Emergency Emergency Plumber" -> "Emergency Plumber")
 * 2. Strict Locality Normalization (strips street addresses like "12 High St, Brentwood" to "Brentwood")
 * 3. Structured Landing Page Content Generation with E-E-A-T relevance
 */

/**
 * Sanitizes keyword phrases by removing duplicate consecutive words,
 * repeated service prefixes (e.g., "Emergency Emergency", "24/7 24/7"),
 * and redundant "near me" tokens.
 */
export function sanitizeKeyword(raw: string): string {
  if (!raw) return '';

  return (
    raw
      // Remove duplicate consecutive words case-insensitively (e.g. "Emergency emergency" -> "Emergency")
      .replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1')
      // Remove duplicate phrases like "near me near me"
      .replace(/\b(near me)(?:\s+\1\b)+/gi, '$1')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Separates street address from pure locality / postal town.
 * Prevents raw street strings (e.g. "12 High St, Brentwood") from leaking into
 * city service landing page titles or target area tags.
 */
export function extractLocality(input?: string): string {
  if (!input) return 'Local Area';

  const trimmed = input.trim();
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length > 1) {
    // If first part starts with numbers (e.g. "12 High St" or "1024 Congress Ave")
    if (/^\d+/.test(parts[0])) {
      // The locality is the second part
      const rawTown = parts[1];
      return cleanTownName(rawTown);
    }
    // If first part does not start with a number, it is already a city/suburb
    return cleanTownName(parts[0]);
  }

  // Single string without commas: strip leading address numbers and trailing postal codes
  return cleanTownName(
    trimmed
      .replace(/^\d+\s+[^,]+,\s*/, '')
      .replace(/\b\d{5}(-\d{4})?\b/, '')
  );
}

function cleanTownName(name: string): string {
  return name
    // Strip UK postcodes (e.g., "Brentwood CM14 4AB" -> "Brentwood")
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, '')
    // Strip US 5-digit zip codes
    .replace(/\b\d{5}(-\d{4})?\b/g, '')
    // Strip trailing state codes like " TX" or " CA" if attached
    .replace(/\s+[A-Z]{2}$/, '')
    .trim() || 'Local Area';
}

/**
 * Normalizes full address strings into distinct components for Schema.org and landing pages.
 */
export function normalizeLocation(rawAddress?: string, rawCity?: string): {
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  cleanDisplayName: string;
} {
  const full = `${rawAddress || ''}${rawCity && !rawAddress?.includes(rawCity) ? `, ${rawCity}` : ''}`.trim();
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);

  let streetAddress = '';
  let locality = 'Local Area';
  let region = '';
  let postalCode = '';

  if (parts.length >= 3) {
    streetAddress = parts[0];
    locality = cleanTownName(parts[1]);
    region = parts[2];
    if (parts.length >= 4) {
      postalCode = parts[3];
    }
  } else if (parts.length === 2) {
    if (/^\d+/.test(parts[0])) {
      streetAddress = parts[0];
      locality = cleanTownName(parts[1]);
    } else {
      locality = cleanTownName(parts[0]);
      region = parts[1];
    }
  } else if (parts.length === 1) {
    locality = cleanTownName(parts[0]);
  }

  // Extract postal code with regex if not isolated yet
  const ukMatch = full.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  const usMatch = full.match(/\b(\d{5}(?:-\d{4})?)\b/);

  if (ukMatch) {
    postalCode = ukMatch[1].toUpperCase();
  } else if (usMatch) {
    postalCode = usMatch[1];
  }

  return {
    streetAddress,
    locality,
    region,
    postalCode,
    cleanDisplayName: `${locality}${region ? `, ${region}` : ''}`,
  };
}
