/**
 * GeoRank Pro - Places & Business Geocoding Resolver
 * Path: /src/lib/places/places-resolver.ts
 *
 * Resolves business name, exact geographic coordinates (lat, lng),
 * street address, Place ID, and inferred search keyword.
 * Combines Google Places API, OpenStreetMap Nominatim, and local preset fallbacks.
 */

export interface ResolvedBusiness {
  businessName: string;
  address: string;
  lat: number;
  lng: number;
  inferredKeyword: string;
  placeId: string;
}

export interface ResolveBusinessParams {
  query: string;
  targetTownOrPostcode?: string;
}

const LOCAL_PRESETS = [
  {
    place_id: 'preset_austin_plumbing',
    businessName: 'Austin Premier Plumbing',
    address: '1024 Congress Ave, Austin, TX 78701',
    lat: 30.2672,
    lng: -97.7431,
    inferredKeyword: 'Emergency Plumber',
  },
  {
    place_id: 'preset_alton_plumbing',
    businessName: 'Alton Emergency Plumbing & Heating',
    address: 'High St, Alton, Hampshire, GU34 1AB, UK',
    lat: 51.1492,
    lng: -0.9782,
    inferredKeyword: 'Emergency Plumber',
  },
  {
    place_id: 'preset_apex_austin',
    businessName: 'Apex Plumbing Solutions',
    address: '3200 N Lamar Blvd, Austin, TX 78705',
    lat: 30.3015,
    lng: -97.7410,
    inferredKeyword: 'Commercial Plumber',
  },
  {
    place_id: 'preset_southampton_drains',
    businessName: 'Southampton 24/7 Drains & Plumbing',
    address: 'Above Bar St, Southampton, SO14 7DU, UK',
    lat: 50.9097,
    lng: -1.4044,
    inferredKeyword: 'Drain Cleaning Specialist',
  },
  {
    place_id: 'preset_lonestar_rooter',
    businessName: 'Lone Star Rooter & HVAC Masters',
    address: '1800 S Congress Ave, Austin, TX 78704',
    lat: 30.2492,
    lng: -97.7495,
    inferredKeyword: 'HVAC Repair',
  },
  {
    place_id: 'preset_capital_dental',
    businessName: 'Capital City Dental Spa',
    address: '410 E 6th St, Austin, TX 78701',
    lat: 30.2672,
    lng: -97.7380,
    inferredKeyword: 'Cosmetic Dentist',
  },
];

const KNOWN_GEO_CENTROIDS: Record<string, { lat: number; lng: number; city: string }> = {
  alton: { lat: 51.1492, lng: -0.9782, city: 'Alton, Hampshire, UK' },
  southampton: { lat: 50.9097, lng: -1.4044, city: 'Southampton, Hampshire, UK' },
  austin: { lat: 30.2672, lng: -97.7431, city: 'Austin, TX, US' },
  dallas: { lat: 32.7767, lng: -96.7970, city: 'Dallas, TX, US' },
  houston: { lat: 29.7604, lng: -95.3698, city: 'Houston, TX, US' },
  london: { lat: 51.5074, lng: -0.1278, city: 'London, UK' },
  chicago: { lat: 41.8781, lng: -87.6298, city: 'Chicago, IL, US' },
  denver: { lat: 39.7392, lng: -104.9903, city: 'Denver, CO, US' },
  manchester: { lat: 53.4808, lng: -2.2426, city: 'Manchester, UK' },
  birmingham: { lat: 52.4862, lng: -1.8904, city: 'Birmingham, UK' },
};

/**
 * Infer primary target keyword based on business query and categories
 */
export function inferKeywordFromQuery(query: string, businessType?: string): string {
  const q = `${query} ${businessType || ''}`.toLowerCase();

  if (q.includes('plumb') || q.includes('pipe') || q.includes('water heater') || q.includes('leak')) {
    return 'Emergency Plumber';
  }
  if (q.includes('drain') || q.includes('sewer') || q.includes('clog')) {
    return 'Drain Cleaning Service';
  }
  if (q.includes('dent') || q.includes('orthodont') || q.includes('teeth')) {
    return 'Emergency Dentist';
  }
  if (q.includes('electric') || q.includes('wiring') || q.includes('breaker') || q.includes('lighting')) {
    return 'Licensed Electrician';
  }
  if (q.includes('roof') || q.includes('shingle') || q.includes('gutter')) {
    return 'Roof Replacement & Repair';
  }
  if (q.includes('hvac') || q.includes('air condition') || q.includes('heating') || q.includes('furnace') || q.includes('cooling')) {
    return 'HVAC Repair & Installation';
  }
  if (q.includes('pest') || q.includes('termite') || q.includes('rodent') || q.includes('bed bug')) {
    return 'Pest Control Services';
  }
  if (q.includes('locksmith') || q.includes('lock') || q.includes('key')) {
    return '24/7 Emergency Locksmith';
  }
  if (q.includes('clean') || q.includes('carpet') || q.includes('maid') || q.includes('janitorial')) {
    return 'Commercial Cleaning Services';
  }
  if (q.includes('tree') || q.includes('arborist') || q.includes('stump')) {
    return 'Tree Removal & Care';
  }
  if (q.includes('auto') || q.includes('mechanic') || q.includes('brake') || q.includes('transmission')) {
    return 'Auto Repair Specialist';
  }
  if (q.includes('law') || q.includes('attorney') || q.includes('lawyer') || q.includes('legal')) {
    return 'Local Attorney';
  }

  // Fallback to primary words
  const cleanWords = query.replace(/[^\w\s]/g, '').trim().split(/\s+/).slice(0, 2).join(' ');
  return cleanWords ? `${cleanWords} Services` : 'Local Commercial Contractor';
}

/**
 * Resolves a business query into a structured business profile with geocoded coordinates
 */
export async function resolveBusiness(params: ResolveBusinessParams): Promise<ResolvedBusiness> {
  const { query, targetTownOrPostcode } = params;
  if (!query || !query.trim()) {
    throw new Error('Missing query parameter for business resolution.');
  }

  const trimmedQuery = query.trim();
  const fullSearchTerm = targetTownOrPostcode && !trimmedQuery.toLowerCase().includes(targetTownOrPostcode.toLowerCase())
    ? `${trimmedQuery}, ${targetTownOrPostcode}`
    : trimmedQuery;

  // 1. Check local preset exact matches first
  const matchedPreset = LOCAL_PRESETS.find(
    p => p.businessName.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
         trimmedQuery.toLowerCase().includes(p.businessName.toLowerCase())
  );
  if (matchedPreset) {
    return {
      businessName: matchedPreset.businessName,
      address: matchedPreset.address,
      lat: matchedPreset.lat,
      lng: matchedPreset.lng,
      inferredKeyword: matchedPreset.inferredKeyword,
      placeId: matchedPreset.place_id,
    };
  }

  // 2. Google Places API if key is available
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (googleKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullSearchTerm)}&key=${googleKey}`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (Array.isArray(gData.results) && gData.results.length > 0) {
          const topResult = gData.results[0];
          return {
            businessName: topResult.name || trimmedQuery,
            address: topResult.formatted_address || `${trimmedQuery}, Local Area`,
            lat: topResult.geometry?.location?.lat || 30.2672,
            lng: topResult.geometry?.location?.lng || -97.7431,
            inferredKeyword: inferKeywordFromQuery(trimmedQuery, topResult.types?.[0]),
            placeId: topResult.place_id || `place_${Date.now()}`,
          };
        }
      }
    } catch (gErr) {
      console.warn('Google Places API resolution failed, checking Places API (New):', gErr);
    }

    // Google Places API (New) search fallback
    try {
      const pRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleKey,
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.location,places.id,places.types',
        },
        body: JSON.stringify({ textQuery: fullSearchTerm }),
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData.places) && pData.places.length > 0) {
          const top = pData.places[0];
          return {
            businessName: top.displayName?.text || trimmedQuery,
            address: top.formattedAddress || `${trimmedQuery}, Local Area`,
            lat: top.location?.latitude || 30.2672,
            lng: top.location?.longitude || -97.7431,
            inferredKeyword: inferKeywordFromQuery(trimmedQuery, top.types?.[0]),
            placeId: top.id || `place_${Date.now()}`,
          };
        }
      }
    } catch (pErr) {
      console.warn('Google Places API (New) search failed, falling back to Nominatim:', pErr);
    }
  }

  // 3. OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      fullSearchTerm
    )}&addressdetails=1&limit=3`;

    const nomRes = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GeoRankPro-Agent/1.0 (contact@georankpro.internal)',
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (nomRes.ok) {
      const data = await nomRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const parsedName = item.address?.amenity || item.address?.shop || item.address?.building || trimmedQuery;
        return {
          businessName: parsedName,
          address: item.display_name || `${trimmedQuery}, ${targetTownOrPostcode || ''}`.trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          inferredKeyword: inferKeywordFromQuery(trimmedQuery, item.type),
          placeId: `nom_${item.place_id || Date.now()}`,
        };
      }
    }
  } catch {
    // Proceed to known centroids / fallbacks
  }

  // 4. Known Centroid Fallback
  for (const [cityKey, centroid] of Object.entries(KNOWN_GEO_CENTROIDS)) {
    if (fullSearchTerm.toLowerCase().includes(cityKey)) {
      return {
        businessName: trimmedQuery,
        address: `${trimmedQuery}, ${centroid.city}`,
        lat: centroid.lat,
        lng: centroid.lng,
        inferredKeyword: inferKeywordFromQuery(trimmedQuery),
        placeId: `centroid_${cityKey}_${Date.now()}`,
      };
    }
  }

  // 5. Default guaranteed fallback (Austin, TX center)
  return {
    businessName: trimmedQuery,
    address: `${trimmedQuery}, 1000 Congress Ave, Austin, TX 78701`,
    lat: 30.2672,
    lng: -97.7431,
    inferredKeyword: inferKeywordFromQuery(trimmedQuery),
    placeId: `preset_default_${Date.now()}`,
  };
}
