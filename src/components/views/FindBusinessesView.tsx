/**
 * ProfitMaps AI / GeoRank Pro - Lead Prospecting Finder View
 * Path: /src/components/views/FindBusinessesView.tsx
 *
 * Implements:
 * - City / Postcode input + Niche selector (e.g. "Roofers in Austin")
 * - Discovered business leads with audit deficit flags:
 *   - Low review count / negative reviews
 *   - Missing website URL
 *   - Unclaimed or poorly optimized Google Business Profile
 * - "1-Click Scan & Pitch" button that initiates a grid scan
 */

import React, { useState } from 'react';
import {
  Compass,
  Search,
  MapPin,
  Star,
  Play,
  Building,
  TrendingDown,
  Sparkles,
  ExternalLink,
  Globe,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react';

export interface ProspectLeadRecord {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  rating: number;
  reviews: number;
  hasWebsite: boolean;
  isGbpClaimed: boolean;
  auditIssueFlag: string;
  lat: number;
  lng: number;
}

export interface FindBusinessesViewProps {
  onScanProspect: (business: {
    name: string;
    keyword: string;
    lat: number;
    lng: number;
  }) => void;
  onDismissProspect?: (id: string, name: string) => void;
}

export const FindBusinessesView: React.FC<FindBusinessesViewProps> = ({
  onScanProspect,
  onDismissProspect,
}) => {
  const [cityQuery, setCityQuery] = useState('Austin, TX');
  const [nicheQuery, setNicheQuery] = useState('Roofers');
  const [isSearching, setIsSearching] = useState(false);

  const initialProspects: ProspectLeadRecord[] = [
    {
      id: 'pr-1',
      name: 'Lone Star Heritage Roofing',
      category: 'Roofing Contractor',
      city: 'Austin, TX',
      address: '4200 S Congress Ave, Austin, TX 78745',
      rating: 4.1,
      reviews: 14,
      hasWebsite: false,
      isGbpClaimed: true,
      auditIssueFlag: 'Missing Website • Low Review Count (14 reviews)',
      lat: 30.2215,
      lng: -97.7712,
    },
    {
      id: 'pr-2',
      name: 'Austin Hill Country Roof Masters',
      category: 'Commercial Roofing',
      city: 'Austin, TX',
      address: '8120 Research Blvd, Austin, TX 78758',
      rating: 3.9,
      reviews: 8,
      hasWebsite: true,
      isGbpClaimed: false,
      auditIssueFlag: 'Unclaimed GBP Profile • Under 4.0 Rating',
      lat: 30.3601,
      lng: -97.7241,
    },
    {
      id: 'pr-3',
      name: 'Barton Springs Emergency Plumber',
      category: 'Emergency Plumber',
      city: 'Austin, TX',
      address: '1500 Barton Springs Rd, Austin, TX 78704',
      rating: 4.3,
      reviews: 19,
      hasWebsite: false,
      isGbpClaimed: true,
      auditIssueFlag: 'No Mobile Responsive Site • 0% Westlake Coverage',
      lat: 30.2610,
      lng: -97.7650,
    },
    {
      id: 'pr-4',
      name: 'Travis County AC & Heat Masters',
      category: 'HVAC Repair',
      city: 'Austin, TX',
      address: '2900 E 7th St, Austin, TX 78702',
      rating: 4.2,
      reviews: 23,
      hasWebsite: true,
      isGbpClaimed: false,
      auditIssueFlag: 'Unclaimed Listing • Losing 70% of Calls to Rivals',
      lat: 30.2615,
      lng: -97.7110,
    },
  ];

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize prospects from default minus any dismissed in localStorage
  const [prospects, setProspects] = useState<ProspectLeadRecord[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('georank_dismissed_prospects') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          return initialProspects.filter((p) => !stored.includes(p.id));
        }
      }
    } catch {}
    return initialProspects;
  });

  const handleDismissProspect = (id: string, name: string) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
    try {
      if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('georank_dismissed_prospects') || '[]');
        if (!stored.includes(id)) {
          stored.push(id);
          localStorage.setItem('georank_dismissed_prospects', JSON.stringify(stored));
        }
      }
    } catch {}

    setToastMessage(`Dismissed "${name}" from discovery targets.`);
    setTimeout(() => setToastMessage(null), 5000);
    if (onDismissProspect) {
      onDismissProspect(id, name);
    }
  };

  const handleResetDismissed = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('georank_dismissed_prospects');
      }
    } catch {}
    setProspects(initialProspects);
    setToastMessage('Restored all dismissed discovery leads.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          data-testid="prospect-dismiss-toast"
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Compass className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Lead Prospecting Radar: Discover Unclaimed &amp; Vulnerable Businesses
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify local business targets with low reviews, missing websites, or unclaimed GBPs for high-converting cold pitches.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-5 relative">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Service Niche / Category
            </label>
            <input
              type="text"
              required
              value={nicheQuery}
              onChange={(e) => setNicheQuery(e.target.value)}
              placeholder="e.g. Roofers, Cosmetic Dentist, Plumbers"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-5 relative">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              City / Postcode Area
            </label>
            <input
              type="text"
              required
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="e.g. Austin, TX or 78701"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Searching...' : 'Find Targets'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Discovered Leads List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Discovered Targets in {cityQuery} ({nicheQuery})
            </h3>
            <p className="text-xs text-slate-500">
              Businesses with critical local SEO deficits ready for outreach
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {prospects.length} High-Intent Leads
          </span>
        </div>

        {prospects.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs text-slate-500 font-medium">
              All discovered prospect leads have been dismissed from view.
            </p>
            <button
              type="button"
              onClick={handleResetDismissed}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Dismissed Leads</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prospects.map((lead) => (
              <div
                key={lead.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {lead.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      {lead.address}
                    </span>
                    <span>•</span>
                    <span className="flex items-center text-amber-500 font-semibold">
                      <Star className="w-3 h-3 fill-current mr-1" />
                      {lead.rating} ({lead.reviews} reviews)
                    </span>
                  </div>

                  {/* Audit Deficit Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{lead.auditIssueFlag}</span>
                    </span>

                    {!lead.hasWebsite && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        No Website Detected
                      </span>
                    )}

                    {!lead.isGbpClaimed && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Unclaimed GBP
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    data-testid={`dismiss-prospect-${lead.id}`}
                    onClick={() => handleDismissProspect(lead.id, lead.name)}
                    title={`Dismiss ${lead.name}`}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl transition cursor-pointer"
                    aria-label={`Dismiss ${lead.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onScanProspect({
                        name: lead.name,
                        keyword: nicheQuery,
                        lat: lead.lat,
                        lng: lead.lng,
                      })
                    }
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>1-Click Scan &amp; Pitch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
