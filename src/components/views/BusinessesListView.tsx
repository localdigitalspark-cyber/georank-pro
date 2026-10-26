/**
 * ProfitMaps AI / GeoRank Pro - Businesses Directory Cards Grid View
 * Path: /src/components/views/BusinessesListView.tsx
 *
 * Implements:
 * - Multi-business interactive card directory
 * - Top 3 presence badges, review counters, last scan timestamps
 * - Search filter & "+ Add business" button
 * - 1-Click selection that launches the business map workspace
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Star,
  MapPin,
  TrendingUp,
  Calendar,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  FileText,
  Trash2,
  AlertTriangle,
  X,
  Clock,
  Bell,
} from 'lucide-react';
import { inferKeywordFromTrade, type ResolvedLocation } from '../search/BusinessSearchInput.tsx';
import type { RankingDelta, TrackingFrequency } from '../../lib/types.ts';
import { formatDeltaBadge } from '../../lib/tracking/ranking-delta.ts';

export interface BusinessCardItem {
  id: string;
  name: string;
  address: string;
  category: string;
  top3Percentage: number;
  averageRank: number;
  rating: number;
  reviews: number;
  lastScanDate: string;
  lat: number;
  lng: number;
  keyword: string;
  trackingConfig?: {
    enabled: boolean;
    frequency: TrackingFrequency;
    alertEmail?: string;
    webhookUrl?: string;
    alertOnThreePackEnter?: boolean;
    alertOnRankDrop?: boolean;
    rankDropThreshold?: number;
    nextTrackDue?: string;
  };
  latestDelta?: RankingDelta;
}

export interface BusinessesListViewProps {
  onSelectBusiness: (business: BusinessCardItem) => void;
  onOpenAddBusinessModal: () => void;
  currentBusinessName?: string;
  onLocationResolved?: (location: ResolvedLocation) => void;
  onBusinessDeleted?: (id: string, name: string) => void;
  onOpenTrackingModal?: (business: BusinessCardItem) => void;
}

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

export const BusinessesListView: React.FC<BusinessesListViewProps> = ({
  onSelectBusiness,
  onOpenAddBusinessModal,
  currentBusinessName,
  onLocationResolved,
  onBusinessDeleted,
  onOpenTrackingModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleResolveAndLaunch = async (rawQuery: string) => {
    if (!rawQuery.trim() || !onLocationResolved) return;
    setIsResolving(true);
    const trimmed = rawQuery.trim();
    const inferredKw = inferKeywordFromTrade(trimmed);

    try {
      const resp = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(trimmed)}`);
      const data = await resp.json();
      const list = Array.isArray(data) ? data : data?.results || [];
      if (list.length > 0) {
        const best = list[0];
        const lat = typeof best.lat === 'number' ? best.lat : parseFloat(best.lat);
        const lng = typeof best.lng === 'number' ? best.lng : parseFloat(best.lng || best.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          const rawCity = (best.address || best.display_name || '').split(',')[1]?.trim() || '';
          const cleanCity = rawCity.split(',')[0]?.trim() || '';
          const resolvedKw = inferKeywordFromTrade(best.category ? `${best.category} ${trimmed}` : trimmed, cleanCity);

          onLocationResolved({
            businessName: best.name || trimmed,
            keyword: resolvedKw,
            lat,
            lng,
            displayName: best.address || best.display_name || trimmed,
            category: best.category || resolvedKw,
            city: cleanCity,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('API autocomplete fetch failed, using city dictionary fallback:', err);
    } finally {
      setIsResolving(false);
    }

    // Fallback: check KNOWN_CITIES
    const qLower = trimmed.toLowerCase();
    for (const [key, val] of Object.entries(KNOWN_CITIES)) {
      if (qLower.includes(key)) {
        onLocationResolved({
          businessName: trimmed,
          keyword: inferredKw,
          lat: val.lat,
          lng: val.lng,
          displayName: `${trimmed}, ${val.city}`,
          category: inferredKw,
        });
        return;
      }
    }

    // Default fallback (Austin center)
    onLocationResolved({
      businessName: trimmed,
      keyword: inferredKw,
      lat: 30.2672,
      lng: -97.7431,
      displayName: `${trimmed}, Austin, TX`,
      category: inferredKw,
    });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filtered.length > 0) {
        onSelectBusiness(filtered[0]);
      } else if (searchQuery.trim().length > 0) {
        await handleResolveAndLaunch(searchQuery.trim());
      }
    }
  };

  const initialBusinesses: BusinessCardItem[] = [
    {
      id: 'b1',
      name: 'Austin Premier Plumbing',
      address: '1024 Congress Ave, Austin, TX 78701',
      category: 'Emergency Plumber',
      top3Percentage: 28.0,
      averageRank: 4.2,
      rating: 4.9,
      reviews: 342,
      lastScanDate: 'Today, 2:15 PM',
      lat: 30.2672,
      lng: -97.7431,
      keyword: 'Emergency Plumber',
      trackingConfig: {
        enabled: true,
        frequency: 'weekly',
        alertOnThreePackEnter: true,
        alertOnRankDrop: true,
        rankDropThreshold: 2.0,
      },
      latestDelta: {
        avgSerpDelta: 1.8,
        inPackDelta: 12.0,
        enteredThreePack: true,
        droppedFromThreePack: false,
        previousAvgSerp: 6.0,
        currentAvgSerp: 4.2,
        previousTop3Percentage: 16.0,
        currentTop3Percentage: 28.0,
        currentScanDate: 'Today, 2:15 PM',
        netGridMovement: 'improved',
        nodesImproved: 7,
        nodesDropped: 1,
        nodesUnchanged: 17,
      },
    },
    {
      id: 'b2',
      name: 'Sunrise Hair Studio',
      address: '2200 S Lamar Blvd, Austin, TX 78704',
      category: 'Hair Colour Salon',
      top3Percentage: 4.0,
      averageRank: 14.8,
      rating: 4.7,
      reviews: 128,
      lastScanDate: 'Yesterday',
      lat: 30.2505,
      lng: -97.7710,
      keyword: 'Hair Colour Salon',
      trackingConfig: {
        enabled: true,
        frequency: 'bi-weekly',
        alertOnThreePackEnter: true,
        alertOnRankDrop: true,
        rankDropThreshold: 2.0,
      },
      latestDelta: {
        avgSerpDelta: -1.6,
        inPackDelta: -8.0,
        enteredThreePack: false,
        droppedFromThreePack: true,
        previousAvgSerp: 13.2,
        currentAvgSerp: 14.8,
        previousTop3Percentage: 12.0,
        currentTop3Percentage: 4.0,
        currentScanDate: 'Yesterday',
        netGridMovement: 'dropped',
        nodesImproved: 2,
        nodesDropped: 8,
        nodesUnchanged: 15,
      },
    },
    {
      id: 'b3',
      name: 'Northside Wellness & Spine',
      address: '11800 Domain Blvd, Austin, TX 78758',
      category: 'Chiropractor & Therapy',
      top3Percentage: 48.0,
      averageRank: 3.8,
      rating: 4.8,
      reviews: 215,
      lastScanDate: '2 days ago',
      lat: 30.4021,
      lng: -97.7258,
      keyword: 'Chiropractor Austin',
    },
    {
      id: 'b4',
      name: 'Capital City Drains & Rooter',
      address: '410 E 6th St, Austin, TX 78701',
      category: 'Commercial Plumbing',
      top3Percentage: 36.0,
      averageRank: 6.4,
      rating: 4.6,
      reviews: 94,
      lastScanDate: '3 days ago',
      lat: 30.2690,
      lng: -97.7390,
      keyword: 'Drain Cleaning',
    },
  ];

  const [businesses, setBusinesses] = useState<BusinessCardItem[]>(initialBusinesses);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch managed businesses from server on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/businesses')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.businesses) && data.businesses.length > 0) {
          setBusinesses(data.businesses);
        }
      })
      .catch((err) => {
        console.warn('BusinessesListView: Using initial businesses cache:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const executeDelete = async (id: string, name: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/businesses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBusinesses((prev) => prev.filter((b) => b.id !== id));
        setConfirmDeleteId(null);
        setToastMessage(`"${name}" and all associated scans were deleted.`);
        setTimeout(() => setToastMessage(null), 5000);
        if (onBusinessDeleted) {
          onBusinessDeleted(id, name);
        }
      } else {
        alert(data.error || 'Failed to delete business');
      }
    } catch (err: any) {
      alert(`Error deleting business: ${err.message || 'Network error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Managed Client Businesses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any business to inspect its live Google Maps geo-grid rankings and competitor telemetry.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddBusinessModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Business</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search businesses by name, address, or category (Press Enter to scan)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
          {isResolving && (
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-3 top-2.5" />
          )}
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Active Accounts: <strong className="text-slate-900">{filtered.length}</strong>
        </div>
      </div>

      {/* Business Cards Grid or Instant Geocode Callout */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">
              {searchQuery.trim()
                ? `No saved client matching "${searchQuery}"`
                : 'No managed businesses found'}
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery.trim() ? (
                <>
                  Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-700">Enter</kbd> or click below to geocode &quot;{searchQuery}&quot; and launch a live Google Maps geo-grid scan immediately.
                </>
              ) : (
                'Add your first business or search any trade in the top search bar.'
              )}
            </p>
          </div>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => handleResolveAndLaunch(searchQuery)}
              disabled={isResolving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition inline-flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isResolving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resolving Coordinates...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Geocode &amp; Scan &quot;{searchQuery}&quot; Now</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isSelected = item.name === currentBusinessName;
            return (
              <div
                key={item.id}
                onClick={() => onSelectBusiness(item)}
                className={`bg-white rounded-2xl p-5 shadow-xs border-2 transition cursor-pointer flex flex-col justify-between space-y-4 group hover:border-emerald-500 ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/10'
                    : 'border-slate-200/80 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                            {item.name}
                          </h3>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Top Right Badges: Delta Movement, 3-Pack Presence, and Tracking Pill */}
                    {(() => {
                      const deltaBadge = formatDeltaBadge(item.latestDelta);
                      const isTracked = item.trackingConfig?.enabled && item.trackingConfig.frequency !== 'off';
                      const trackFreq = item.trackingConfig?.frequency;

                      return (
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {/* Delta Movement Badge */}
                            <span
                              data-testid={`delta-badge-${item.id}`}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${deltaBadge.colorClass}`}
                              title={`Ranking movement: ${deltaBadge.text}`}
                            >
                              {deltaBadge.text}
                            </span>

                            {/* Top 3 Presence Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                item.top3Percentage >= 30
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.top3Percentage >= 10
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {item.top3Percentage}% in top 3
                            </span>
                          </div>

                          {/* Tracking status badge */}
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight uppercase border flex items-center gap-1 ${
                                isTracked
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>{isTracked ? `${trackFreq} tracking` : 'Tracking off'}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Address & Reviews */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                      <span className="flex items-center text-amber-500 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current mr-1" />
                        {item.rating} ({item.reviews} reviews)
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">Avg Rank: #{item.averageRank}</span>
                    </div>
                  </div>
                </div>

                {/* Inline Delete Confirmation Prompt */}
                {confirmDeleteId === item.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in"
                  >
                    <div className="flex items-center space-x-2 text-rose-800 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Delete this business and its scans?</span>
                    </div>
                    <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => executeDelete(item.id, item.name)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium text-[11px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Scanned: {item.lastScanDate}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {onOpenTrackingModal && (
                      <button
                        type="button"
                        data-testid={`business-tracking-btn-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrackingModal(item);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title="Configure recurring rank tracking & alerts"
                      >
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Tracking</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Client Report clicked from business card! Business:', item.name, 'ID:', item.id);
                        window.open(`/reports/business-${item.id}`, '_blank');
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-slate-500" />
                      <span>Client report</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(confirmDeleteId === item.id ? null : item.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete business and scans"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition flex items-center space-x-1 text-xs">
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
