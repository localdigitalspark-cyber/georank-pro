/**
 * GeoRank Pro / ProfitMaps AI - Business Autocomplete & Geocoding Resolver
 * Path: /src/components/search/BusinessSearchInput.tsx
 *
 * Allows users to type a business name, category, or address (US/UK/Global),
 * resolves it via Nominatim / Google Places proxy, and guarantees instant working results:
 * - Enter Key handler: immediately sets target business name, infers target keyword,
 *   extracts location (or defaults to viewport center), and fires onLocationResolved.
 * - Robust fallback handling so users are never blocked with empty dropdowns.
 * - Loading spinner & prompt: "Press Enter to search around current map location".
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Sliders,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  Navigation,
  CornerDownLeft,
} from 'lucide-react';

export interface ResolvedLocation {
  businessName: string;
  keyword: string;
  lat: number;
  lng: number;
  displayName: string;
  category?: string;
  city?: string;
  placeId?: string;
  domainOrUrl?: string;
  cid?: string;
  website?: string;
}

export interface BusinessSearchInputProps {
  initialBusinessName?: string;
  initialKeyword?: string;
  onLocationResolved?: (location: ResolvedLocation) => void;
  onSelect?: (location: { name: string; keyword: string; lat: number; lng: number }) => void;
  centerLat: number;
  centerLng: number;
  onManualCoordChange?: (lat: number, lng: number) => void;
  variant?: 'header' | 'modal' | 'default';
  placeholder?: string;
  className?: string;
}

interface SuggestionItem {
  place_id?: number | string;
  placeId?: string;
  cid?: string;
  name?: string;
  display_name: string;
  lat: string | number;
  lon?: string;
  lng?: number | string;
  category?: string;
  type?: string;
  class?: string;
  website?: string;
  domain?: string;
  domainOrUrl?: string;
  address?: string | {
    amenity?: string;
    shop?: string;
    commercial?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// Inferred local SEO service keywords based on trade words
export function inferKeywordFromTrade(queryOrCategory: string, city?: string): string {
  const q = (queryOrCategory || '').toLowerCase();

  let coreTrade = '';
  // Phone / Device / Screen / Electronics
  if (
    q.includes('phone') ||
    q.includes('gadget') ||
    q.includes('screen') ||
    q.includes('mobile') ||
    q.includes('device') ||
    q.includes('cell') ||
    q.includes('ipad') ||
    q.includes('iphone') ||
    q.includes('tablet')
  ) {
    coreTrade = 'Phone Repair';
  } else if (q.includes('plumb') || q.includes('pipe') || q.includes('leak')) {
    coreTrade = 'Emergency Plumber';
  } else if (q.includes('drain') || q.includes('sewer')) {
    coreTrade = '24/7 Drain Cleaning';
  } else if (q.includes('water heater') || q.includes('boiler')) {
    coreTrade = 'Water Heater Repair';
  } else if (q.includes('roof') || q.includes('gutter') || q.includes('shingle')) {
    coreTrade = 'Roofing Contractor';
  } else if (q.includes('dent') || q.includes('tooth') || q.includes('teeth') || q.includes('ortho')) {
    coreTrade = 'Cosmetic Dentist';
  } else if (
    q.includes('hvac') ||
    q.includes('air cond') ||
    q.includes('cooling') ||
    q.includes('heating') ||
    q.includes('furnace') ||
    q.includes('heat pump') ||
    q.includes(' ac ') ||
    q.endsWith(' ac') ||
    q.startsWith('ac ')
  ) {
    coreTrade = 'HVAC Contractor';
  } else if (q.includes('electric') || q.includes('wire')) {
    coreTrade = 'Licensed Electrician';
  } else if (q.includes('pest') || q.includes('termite') || q.includes('bedbug') || q.includes('exterminat')) {
    coreTrade = 'Pest Control Specialist';
  } else if (q.includes('clean') || q.includes('maid') || q.includes('carpet') || q.includes('janitor')) {
    coreTrade = 'Commercial Cleaning';
  } else if (
    q.includes('auto') ||
    q.includes('car repair') ||
    q.includes('mechanic') ||
    q.includes('tyre') ||
    q.includes('tire') ||
    q.includes('transmission') ||
    q.includes('brake') ||
    q.includes('garage')
  ) {
    coreTrade = 'Auto Repair Shop';
  } else if (q.includes('vet') || q.includes('animal') || q.includes('pet')) {
    coreTrade = 'Emergency Vet Clinic';
  } else if (
    q.includes('law') ||
    q.includes('attorney') ||
    q.includes('legal') ||
    q.includes('injury') ||
    q.includes('lawyer') ||
    q.includes('solicitor')
  ) {
    coreTrade = 'Personal Injury Lawyer';
  } else if (q.includes('lock') || q.includes('key')) {
    coreTrade = 'Emergency Locksmith';
  } else if (q.includes('landscap') || q.includes('lawn') || q.includes('tree') || q.includes('garden')) {
    coreTrade = 'Tree Service & Landscaping';
  } else if (q.includes('paint') || q.includes('decorat')) {
    coreTrade = 'Commercial Painter';
  } else if (q.includes('solar') || q.includes('energy')) {
    coreTrade = 'Solar Panel Installation';
  } else if (q.includes('account') || q.includes('tax') || q.includes('bookkeep')) {
    coreTrade = 'Certified Public Accountant';
  } else if (q.includes('chiro') || q.includes('physio')) {
    coreTrade = 'Chiropractic Care';
  } else if (q.includes('gym') || q.includes('fitness') || q.includes('training')) {
    coreTrade = 'Fitness & Training';
  } else if (
    q.includes('restaurant') ||
    q.includes('cafe') ||
    q.includes('dining') ||
    q.includes('food') ||
    q.includes('bistro') ||
    q.includes('pub') ||
    q.includes('bar')
  ) {
    coreTrade = 'Local Restaurant';
  } else if (q.includes('salon') || q.includes('barber') || q.includes('hair') || q.includes('spa')) {
    coreTrade = 'Hair Salon & Spa';
  } else if (q.includes('real estate') || q.includes('realtor') || q.includes('property')) {
    coreTrade = 'Real Estate Agency';
  } else if (q.includes('storage') || q.includes('moving') || q.includes('removals') || q.includes('mover')) {
    coreTrade = 'Moving & Storage';
  } else if (q.includes('security') || q.includes('alarm') || q.includes('cctv')) {
    coreTrade = 'Security Systems';
  }

  // If no specific trade detected, clean out business suffixes and brand-like noise
  if (!coreTrade) {
    const cleaned = queryOrCategory
      .replace(/\b(ltd|llc|inc|co|corp|services|service|pros|solutions|company|center|shop|store|masters|group|the)\b/gi, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (
      cleaned.length >= 3 &&
      cleaned.length <= 25 &&
      !cleaned.toLowerCase().includes('gadget') &&
      !cleaned.toLowerCase().includes('guru')
    ) {
      coreTrade = cleaned
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    } else {
      coreTrade = 'Local Service';
    }
  }

  // If city is specified, format as `${coreTrade} ${cleanCity}` without brand name
  if (city && city.trim()) {
    const cleanCity = city.split(',')[0].trim();
    if (cleanCity && !coreTrade.toLowerCase().includes(cleanCity.toLowerCase())) {
      return `${coreTrade} ${cleanCity}`;
    }
  }

  return coreTrade;
}

// Known coordinates dictionary for instant geographical detection
const KNOWN_CITIES: Record<string, { lat: number; lng: number; city: string }> = {
  alton: { lat: 51.1492, lng: -0.9782, city: 'Alton, Hampshire, UK' },
  southampton: { lat: 50.9097, lng: -1.4044, city: 'Southampton, UK' },
  austin: { lat: 30.2672, lng: -97.7431, city: 'Austin, TX' },
  dallas: { lat: 32.7767, lng: -96.7970, city: 'Dallas, TX' },
  houston: { lat: 29.7604, lng: -95.3698, city: 'Houston, TX' },
  london: { lat: 51.5074, lng: -0.1278, city: 'London, UK' },
  chicago: { lat: 41.8781, lng: -87.6298, city: 'Chicago, IL' },
  denver: { lat: 39.7392, lng: -104.9903, city: 'Denver, CO' },
  manchester: { lat: 53.4808, lng: -2.2426, city: 'Manchester, UK' },
  birmingham: { lat: 52.4862, lng: -1.8904, city: 'Birmingham, UK' },
  newyork: { lat: 40.7128, lng: -74.0060, city: 'New York, NY' },
};

export const BusinessSearchInput: React.FC<BusinessSearchInputProps> = ({
  initialBusinessName = '',
  initialKeyword = '',
  onLocationResolved,
  onSelect,
  centerLat,
  centerLng,
  onManualCoordChange,
  variant = 'default',
  placeholder = 'Search business name, category, or address (e.g. Apex Plumbing, Alton)...',
  className = '',
}) => {
  const [query, setQuery] = useState(initialBusinessName);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize initialBusinessName if updated from parent
  useEffect(() => {
    if (initialBusinessName && initialBusinessName !== query && !isOpen) {
      setQuery(initialBusinessName);
    }
  }, [initialBusinessName]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debouncing
  const handleQueryChange = (text: string) => {
    setQuery(text);
    setSelectedPlaceName(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(text.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  };

  // Helper to emit resolved location to parent handlers
  const emitResolved = (
    targetBusinessName: string,
    inferredKeyword: string,
    resolvedLat: number,
    resolvedLng: number,
    displayName: string,
    city: string,
    category: string,
    placeId?: string,
    domainOrUrl?: string,
    cid?: string,
    website?: string
  ) => {
    const loc: ResolvedLocation = {
      businessName: targetBusinessName,
      keyword: inferredKeyword,
      lat: resolvedLat,
      lng: resolvedLng,
      displayName,
      category,
      city,
      placeId: placeId || undefined,
      domainOrUrl: domainOrUrl || website || undefined,
      cid: cid || undefined,
      website: website || domainOrUrl || undefined,
    };

    if (onLocationResolved) {
      onLocationResolved(loc);
    }
    if (onSelect) {
      onSelect({
        name: targetBusinessName,
        keyword: inferredKeyword,
        lat: resolvedLat,
        lng: resolvedLng,
      });
    }
  };

  // Select an item from suggestions dropdown
  const handleSelectSuggestion = (item: SuggestionItem) => {
    const lat = typeof item.lat === 'number' ? item.lat : parseFloat(item.lat);
    const lng = typeof item.lng === 'number' ? item.lng : parseFloat(item.lng || item.lon || '');
    if (isNaN(lat) || isNaN(lng)) return;

    const parts = (item.display_name || '').split(',');
    const primaryName = item.name || parts[0]?.trim() || item.display_name;
    const cat = item.category || item.type || item.class || 'Local Business';
    let city = '';
    if (item.address && typeof item.address === 'object') {
      city = item.address.city || item.address.town || item.address.suburb || '';
    } else if (typeof item.address === 'string') {
      city = item.address.split(',')[1]?.trim() || '';
    }
    if (!city) {
      city = parts[1]?.trim() || '';
    }
    const cleanCity = city.split(',')[0]?.trim() || '';
    const inferredKeyword = inferKeywordFromTrade(`${cat} ${primaryName}`, cleanCity);

    const placeId = String(item.place_id || item.placeId || '');
    const domainOrUrl = item.website || item.domain || item.domainOrUrl || '';
    const cid = item.cid ? String(item.cid) : '';
    const website = item.website || domainOrUrl;

    setQuery(primaryName);
    setSelectedPlaceName(item.display_name || primaryName);
    setIsOpen(false);

    emitResolved(
      primaryName,
      inferredKeyword,
      lat,
      lng,
      item.display_name || `${primaryName}${cleanCity ? `, ${cleanCity}` : ''}`,
      cleanCity,
      cat,
      placeId,
      domainOrUrl,
      cid,
      website
    );
  };

  // Direct Submission on Enter key or button click
  const handleSubmitCurrentQuery = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 1. Immediately set Target Business Name to whatever string user typed
    const targetBusinessName = trimmed;

    // 2. Extract location part or check known city coordinates
    let resolvedLat = centerLat;
    let resolvedLng = centerLng;
    let resolvedCity = '';
    let resolvedDisplayName = '';

    // Check if suggestions already has an item
    if (suggestions.length > 0 && suggestions[0]) {
      const first = suggestions[0];
      const topLat = typeof first.lat === 'number' ? first.lat : parseFloat(String(first.lat || ''));
      const topLng = typeof first.lng === 'number' ? first.lng : parseFloat(String(first.lng || first.lon || ''));
      if (!isNaN(topLat) && !isNaN(topLng)) {
        resolvedLat = topLat;
        resolvedLng = topLng;
        resolvedDisplayName = first.display_name || first.name || '';
        resolvedCity = (first.display_name || '').split(',')[1]?.trim() || '';
      }
    } else {
      // Check known cities in query first
      const lower = trimmed.toLowerCase();
      let matchedCity = false;
      for (const [key, centroid] of Object.entries(KNOWN_CITIES)) {
        if (lower.includes(key)) {
          resolvedLat = centroid.lat;
          resolvedLng = centroid.lng;
          resolvedCity = centroid.city;
          matchedCity = true;
          break;
        }
      }

      // If no city matched and query is long enough, try quick fetch to /api/geo/autocomplete
      if (!matchedCity && trimmed.length >= 2) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(trimmed)}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0 && data[0]) {
              const topLat = parseFloat(data[0].lat);
              const topLng = parseFloat(data[0].lon);
              if (!isNaN(topLat) && !isNaN(topLng)) {
                resolvedLat = topLat;
                resolvedLng = topLng;
                resolvedDisplayName = data[0].display_name;
                resolvedCity = data[0].address?.city || data[0].address?.town || data[0].display_name.split(',')[1]?.trim() || '';
              }
            }
          }
        } catch {
          // Fall back to current center
        }
      }
    }

    // 3. Infer target keyword automatically from common trade words without brand name
    const cleanCity = resolvedCity.split(',')[0]?.trim() || '';
    const inferredKeyword = inferKeywordFromTrade(trimmed, cleanCity);

    // 4. Fire onLocationResolved and onSelect immediately so user is never blocked
    setSelectedPlaceName(resolvedDisplayName || trimmed);
    setIsOpen(false);

    emitResolved(
      targetBusinessName,
      inferredKeyword,
      resolvedLat,
      resolvedLng,
      resolvedDisplayName || `${targetBusinessName}${resolvedCity ? `, ${resolvedCity}` : ''}`,
      resolvedCity,
      inferredKeyword
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmitCurrentQuery();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedPlaceName(null);
    setIsOpen(false);
  };

  const isHeader = variant === 'header';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label & Toggle (only shown when not in compact header) */}
      {!isHeader && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            <span>Business &amp; Location Resolver</span>
          </label>
          {onManualCoordChange && (
            <button
              type="button"
              onClick={() => setManualMode(!manualMode)}
              className="text-[11px] font-mono text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>{manualMode ? 'Switch to Autocomplete' : 'Manual Coordinates'}</span>
            </button>
          )}
        </div>
      )}

      {!manualMode ? (
        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Search className={`w-4 h-4 ${isHeader ? 'text-slate-400' : 'text-emerald-600'}`} />
              )}
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 || query.trim().length >= 2) setIsOpen(true);
              }}
              placeholder={placeholder}
              className={`w-full pl-9.5 pr-14 rounded-xl text-xs transition placeholder:text-slate-400 focus:outline-none ${
                isHeader
                  ? 'py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800'
                  : 'py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs'
              }`}
            />

            <div className="absolute right-2.5 flex items-center space-x-1">
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {query && (
                <button
                  type="button"
                  onClick={handleSubmitCurrentQuery}
                  className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                  title="Press Enter to search"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute z-[100] top-full left-0 mt-1.5 w-full min-w-[340px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
              {/* Header Info */}
              <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>SUGGESTED LOCAL ENTITIES</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Auto-Center
                </span>
              </div>

              {/* Suggestions List */}
              {suggestions.map((item, idx) => {
                const parts = item.display_name.split(',');
                const title = parts[0]?.trim() || item.display_name;
                const subtitle = parts.slice(1, 4).join(',').trim();
                const category = item.type || item.class || 'Business';

                return (
                  <button
                    key={`${item.place_id || idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/60 transition flex items-start gap-2.5 group cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 truncate">
                          {title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 capitalize border border-slate-200">
                          {category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {subtitle || item.display_name}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Empty state prompt */}
              {suggestions.length === 0 && !isLoading && (
                <div className="p-3 text-center text-xs text-slate-500 space-y-1">
                  <p>No exact street match found for "{query}".</p>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Press Enter to search around current map location ({centerLat.toFixed(2)}, {centerLng.toFixed(2)})
                  </p>
                </div>
              )}

              {/* Actionable Row: Press Enter prompt */}
              <button
                type="button"
                onClick={handleSubmitCurrentQuery}
                className="w-full text-left px-3.5 py-2.5 bg-slate-50/80 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold flex items-center justify-between transition cursor-pointer border-t border-slate-100"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Press <strong className="text-emerald-700">Enter</strong> to search around current map location
                  </span>
                </div>
                <span className="text-[10px] bg-white border border-slate-200 shadow-2xs text-slate-600 px-1.5 py-0.5 rounded-md font-mono shrink-0 flex items-center space-x-1">
                  <span>Enter</span>
                  <CornerDownLeft className="w-2.5 h-2.5 text-emerald-600" />
                </span>
              </button>
            </div>
          )}

          {/* Resolved Coordinates Confirmation Pill */}
          {!isHeader && selectedPlaceName && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px] font-mono text-emerald-800">
              <div className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-sans font-medium">{selectedPlaceName}</span>
              </div>
              <span className="shrink-0 text-emerald-700 font-bold ml-2">
                {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Manual Lat/Long Entry Mode */
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-mono text-slate-500 mb-1">
              Latitude (Center)
            </label>
            <input
              type="number"
              step="any"
              value={centerLat}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && onManualCoordChange) {
                  onManualCoordChange(val, centerLng);
                }
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono text-slate-500 mb-1">
              Longitude (Center)
            </label>
            <input
              type="number"
              step="any"
              value={centerLng}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && onManualCoordChange) {
                  onManualCoordChange(centerLat, val);
                }
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
