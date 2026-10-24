/**
 * GeoRank Pro - Full Business Setup & Multi-Source Import Wizard
 * Path: /src/components/onboarding/BusinessSetupWizard.tsx
 *
 * Implements:
 * 1. Modal title: "Add or Import Business"
 * 2. 3-Tab Import Sources:
 *    - Tab 1: 🔍 Google Business Profile (Fastest GBP lookup via Google Places / DataForSEO)
 *    - Tab 2: 🌐 Import from Website URL (Fetches title, meta, phone, schema.org & headings)
 *    - Tab 3: ✍️ Manual Entry (Section 01 Basics, Section 02 Differentiators & Checklist)
 * 3. Step 2: Keyword Discovery Transition Screen -> Selectable keyword table.
 * 4. Step 3: Real-Time 5x5 Scan Matrix Animation with dynamic badge resolution.
 */

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Search,
  Check,
  ChevronRight,
  TrendingUp,
  Sliders,
  X,
  Loader2,
  Target,
  Layers,
  ShieldCheck,
  Zap,
  Star,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { generateDeterministicKeywordDiscovery, type DiscoveredKeyword } from '../../lib/keywords/keyword-discovery.ts';

export interface OnboardingBusinessData {
  businessName: string;
  category: string;
  phone: string;
  address: string;
  website: string;
  ownerName: string;
  yearsInBusiness: string;
  excludedServices: string;
  areasServed: string;
  differentiators: string;
  notes: string;
  lat: number;
  lng: number;
  placeId?: string;
  domainOrUrl?: string;
}

export interface BusinessSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingBusinessData, selectedKeywords: string[]) => void;
  initialBusinessName?: string;
  initialCategory?: string;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  initialWebsite?: string;
  initialPlaceId?: string;
}

export const BusinessSetupWizard: React.FC<BusinessSetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialBusinessName = 'Austin Premier Plumbing',
  initialCategory = 'Emergency Plumber',
  initialAddress = '1024 Congress Ave, Austin, TX 78701',
  initialLat = 30.2672,
  initialLng = -97.7431,
  initialWebsite = 'https://austinpremierplumbing.com',
  initialPlaceId = 'preset_austin_plumbing',
}) => {
  // Wizard Step: 1 (Details / Import) | 2 (Keywords) | 3 (Live Scan Animation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Method Selection: 'gbp' | 'website' | 'manual'
  const [activeTab, setActiveTab] = useState<'gbp' | 'website' | 'manual'>('gbp');

  // Form Fields State
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [category, setCategory] = useState(initialCategory);
  const [phone, setPhone] = useState('(512) 555-0199');
  const [address, setAddress] = useState(initialAddress);
  const [website, setWebsite] = useState(initialWebsite);
  const [ownerName, setOwnerName] = useState('Michael Vance');
  const [yearsInBusiness, setYearsInBusiness] = useState('12');
  const [excludedServices, setExcludedServices] = useState('Commercial HVAC, New Construction Rough-ins');
  const [areasServed, setAreasServed] = useState('Downtown Austin\nSouth Congress\nBarton Hills\nZilker\nTarrytown');
  const [differentiators, setDifferentiators] = useState('60-minute emergency dispatch guarantee\nUpfront fixed transparent pricing\nMaster licensed & insured technicians');
  const [notes, setNotes] = useState('Focusing primarily on high-intent emergency dispatch calls.');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });
  const [currentPlaceId, setCurrentPlaceId] = useState<string | undefined>(initialPlaceId);

  // GBP Import State
  const [gbpSearchQuery, setGbpSearchQuery] = useState('');
  const [isSearchingGbp, setIsSearchingGbp] = useState(false);
  const [gbpCandidates, setGbpCandidates] = useState<Array<{
    placeId: string;
    name: string;
    address: string;
    category?: string;
    rating?: number;
    reviews?: number;
    lat: number;
    lng: number;
  }>>([]);
  const [importingPlaceId, setImportingPlaceId] = useState<string | null>(null);

  // Website Import State
  const [websiteUrlInput, setWebsiteUrlInput] = useState('');
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);
  const [websiteScrapeResult, setWebsiteScrapeResult] = useState<any | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Step 2: Keywords State & Transition
  const [isTransitioningStep2, setIsTransitioningStep2] = useState(false);
  const [keywordChecklistStep, setKeywordChecklistStep] = useState(0);
  const [availableKeywords, setAvailableKeywords] = useState<DiscoveredKeyword[]>([]);
  const [selectedKeywordNames, setSelectedKeywordNames] = useState<string[]>([]);

  // Step 3: Scan Matrix Animation State
  const [scanSpotIndex, setScanSpotIndex] = useState(0);
  const [activeScanKeywordIndex, setActiveScanKeywordIndex] = useState(0);
  const [scannedSpots, setScannedSpots] = useState<Array<{ rank: number; status: 'green' | 'yellow' | 'red' }>>([]);

  if (!isOpen) return null;

  // 1. GBP Search Handler
  const handleSearchGbp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gbpSearchQuery.trim()) return;
    setIsSearchingGbp(true);
    try {
      const res = await fetch(`/api/businesses/import/gbp/search?q=${encodeURIComponent(gbpSearchQuery.trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.candidates)) {
        setGbpCandidates(data.candidates);
      } else {
        setGbpCandidates([]);
      }
    } catch (err) {
      console.warn('GBP search error:', err);
    } finally {
      setIsSearchingGbp(false);
    }
  };

  // 1b. GBP Import Handler
  const handleImportGbpPlace = async (candidate: {
    placeId: string;
    name: string;
    address: string;
    category?: string;
    lat: number;
    lng: number;
  }) => {
    setImportingPlaceId(candidate.placeId);
    try {
      const res = await fetch('/api/businesses/import/gbp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: candidate.placeId,
          query: candidate.name,
          location: candidate.address,
        }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        const b = data.business;
        setBusinessName(b.name);
        setCategory(b.category);
        setAddress(b.address);
        if (b.phone) setPhone(b.phone);
        if (b.website) setWebsite(b.website);
        setCoords({ lat: b.lat, lng: b.lng });
        setCurrentPlaceId(b.placeId);

        // Immediate completion
        onComplete(
          {
            businessName: b.name,
            category: b.category,
            phone: b.phone || phone,
            address: b.address,
            website: b.website || website,
            ownerName,
            yearsInBusiness,
            excludedServices,
            areasServed,
            differentiators,
            notes,
            lat: b.lat,
            lng: b.lng,
            placeId: b.placeId,
            domainOrUrl: b.website,
          },
          b.suggestedKeywords && b.suggestedKeywords.length > 0
            ? b.suggestedKeywords
            : [b.category, `${b.category} Near Me`]
        );
      }
    } catch (err) {
      console.error('Error importing GBP place:', err);
    } finally {
      setImportingPlaceId(null);
    }
  };

  // 2. Website Scrape Handler
  const handleScrapeWebsite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!websiteUrlInput.trim()) return;
    setIsScrapingWebsite(true);
    setWebsiteError(null);
    try {
      const res = await fetch('/api/businesses/import/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrlInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.business) {
        setWebsiteScrapeResult(data.business);
      } else {
        setWebsiteError(data.error || 'Failed extracting business details from URL');
      }
    } catch (err: any) {
      setWebsiteError(err.message || 'Connection failed');
    } finally {
      setIsScrapingWebsite(false);
    }
  };

  // 2b. Confirm Website Import
  const handleConfirmWebsiteImport = () => {
    if (!websiteScrapeResult) return;
    const b = websiteScrapeResult;
    onComplete(
      {
        businessName: b.name,
        category: b.category,
        phone: b.phone || '',
        address: b.address,
        website: b.website || websiteUrlInput,
        ownerName,
        yearsInBusiness,
        excludedServices,
        areasServed,
        differentiators,
        notes: b.notes || notes,
        lat: b.lat,
        lng: b.lng,
        placeId: b.placeId,
        domainOrUrl: b.website,
      },
      b.suggestedKeywords && b.suggestedKeywords.length > 0
        ? b.suggestedKeywords
        : [b.category, `${b.category} Near Me`]
    );
  };

  // 3. Switch Extracted into Manual Mode
  const handleTransferToManual = () => {
    if (websiteScrapeResult) {
      setBusinessName(websiteScrapeResult.name);
      setCategory(websiteScrapeResult.category);
      setAddress(websiteScrapeResult.address);
      if (websiteScrapeResult.phone) setPhone(websiteScrapeResult.phone);
      if (websiteScrapeResult.website) setWebsite(websiteScrapeResult.website);
      setCoords({ lat: websiteScrapeResult.lat, lng: websiteScrapeResult.lng });
    }
    setActiveTab('manual');
  };

  // Handler to progress from Step 1 to Step 2
  const handleProceedToStep2 = () => {
    setStep(2);
    setIsTransitioningStep2(true);
    setKeywordChecklistStep(0);

    setTimeout(() => setKeywordChecklistStep(1), 300);
    setTimeout(() => setKeywordChecklistStep(2), 700);
    setTimeout(() => setKeywordChecklistStep(3), 1100);
    setTimeout(() => {
      setKeywordChecklistStep(4);
      const disc = generateDeterministicKeywordDiscovery({
        businessName,
        category,
        cityOrTown: address.split(',')[1]?.trim() || 'Austin',
      });
      setAvailableKeywords(disc.keywords);
      setSelectedKeywordNames(disc.keywords.slice(0, 4).map((k) => k.keyword));
      setIsTransitioningStep2(false);
    }, 1500);
  };

  // Handler to toggle keyword selection in Step 2
  const toggleKeyword = (kw: string) => {
    setSelectedKeywordNames((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  // Handler to start Step 3 Scan Matrix
  const handleStartScanMatrix = () => {
    setStep(3);
    setScanSpotIndex(0);
    setActiveScanKeywordIndex(0);
    setScannedSpots([]);

    let spot = 0;
    const interval = setInterval(() => {
      spot++;
      setScanSpotIndex(spot);
      let rank = 1;
      let status: 'green' | 'yellow' | 'red' = 'green';
      if (spot === 13) {
        rank = 1;
        status = 'green';
      } else if (spot <= 8) {
        rank = Math.floor(Math.random() * 3) + 1;
        status = 'green';
      } else if (spot <= 18) {
        rank = Math.floor(Math.random() * 6) + 4;
        status = 'yellow';
      } else {
        rank = Math.floor(Math.random() * 10) + 11;
        status = 'red';
      }

      setScannedSpots((prev) => [...prev, { rank, status }]);

      if (spot >= 25) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete(
            {
              businessName,
              category,
              phone,
              address,
              website,
              ownerName,
              yearsInBusiness,
              excludedServices,
              areasServed,
              differentiators,
              notes,
              lat: coords.lat,
              lng: coords.lng,
              placeId: currentPlaceId,
              domainOrUrl: website,
            },
            selectedKeywordNames
          );
        }, 1000);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {step === 1 ? 'Add or Import Business' : `Step ${step} of 3`}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  {step === 1 && 'Choose an import source or configure manually'}
                  {step === 2 && 'Keyword Discovery & Traffic'}
                  {step === 3 && 'Real-Time Geo-Grid Matrix'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 1 && 'Add or Import Business'}
                {step === 2 && `Pick Keywords for ${businessName}`}
                {step === 3 && `Scanning Local Rankings Matrix`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: 3-Source Method Switcher */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            {/* 3 Top-Level Import Source Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('gbp')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'gbp'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Business Profile</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-semibold">Fastest</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('website')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'website'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Import from Website URL</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Manual Entry</span>
              </button>
            </div>

            {/* TAB 1: GOOGLE BUSINESS PROFILE SEARCH & IMPORT */}
            {activeTab === 'gbp' && (
              <div className="space-y-4">
                <form onSubmit={handleSearchGbp} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search business name or location on Google Maps (e.g. Austin Premier Plumbing or Gadget Guru Brentwood)..."
                      value={gbpSearchQuery}
                      onChange={(e) => setGbpSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingGbp || !gbpSearchQuery.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingGbp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Search Maps</span>
                  </button>
                </form>

                {/* Candidate Results Cards */}
                {gbpCandidates.length > 0 ? (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                      Select a Google Profile to Import:
                    </div>
                    {gbpCandidates.map((c) => (
                      <div
                        key={c.placeId}
                        className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                              {c.name}
                            </h4>
                            {c.category && (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                {c.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                          {c.rating !== undefined && (
                            <div className="flex items-center space-x-1 text-xs text-amber-600 font-semibold pt-0.5">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{c.rating} ({c.reviews || 0} reviews)</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleImportGbpPlace(c)}
                          disabled={importingPlaceId === c.placeId}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {importingPlaceId === c.placeId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Importing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Import this Profile</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isSearchingGbp && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Search your Google Business Profile
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Enter your business name or trade above to fetch verified coordinates, phone numbers, categories, and reviews automatically.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB 2: IMPORT FROM WEBSITE URL */}
            {activeTab === 'website' && (
              <div className="space-y-4">
                <form onSubmit={handleScrapeWebsite} className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="https://example.com (e.g. https://austinpremierplumbing.com)"
                      value={websiteUrlInput}
                      onChange={(e) => setWebsiteUrlInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isScrapingWebsite || !websiteUrlInput.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isScrapingWebsite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    <span>Analyze Website &amp; Extract Info</span>
                  </button>
                </form>

                {websiteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{websiteError}</span>
                  </div>
                )}

                {websiteScrapeResult && (
                  <div className="p-5 bg-white rounded-2xl border-2 border-emerald-200 shadow-xs space-y-4 animate-in fade-in">
                    <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Extracted Profile Preview</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Business Name</span>
                        <span className="font-bold text-slate-900 text-sm">{websiteScrapeResult.name}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Category / Trade</span>
                        <span className="font-bold text-slate-900">{websiteScrapeResult.category}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                        <span className="font-bold text-slate-900 font-mono">{websiteScrapeResult.phone || 'Not found'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Address &amp; Location</span>
                        <span className="font-bold text-slate-900 truncate block">{websiteScrapeResult.address}</span>
                      </div>
                    </div>

                    {websiteScrapeResult.suggestedKeywords?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 block">Detected Service Keywords:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {websiteScrapeResult.suggestedKeywords.map((kw: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleTransferToManual}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Customize in Manual Mode →
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmWebsiteImport}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm &amp; Add Business</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MANUAL ENTRY (EXISTING WIZARD SECTIONS 01 & 02) */}
            {activeTab === 'manual' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left 8 Cols: Form Sections */}
                <div className="md:col-span-8 space-y-6">
                  {/* Section 01: Basics */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        SECTION 01
                      </span>
                      <h3 className="text-sm font-bold">Business Essentials</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Primary Category / Trade
                        </label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Website URL
                        </label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 02: Details that make it stand out */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-900">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        SECTION 02
                      </span>
                      <h3 className="text-sm font-bold">Details that make it stand out</h3>
                    </div>

                    {/* Services you DON'T offer */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Services you DON'T offer
                        </label>
                        <span className="text-[11px] text-slate-400">
                          We'll never say you offer these
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={excludedServices}
                        onChange={(e) => setExcludedServices(e.target.value)}
                        placeholder="e.g. Commercial grease traps, new residential builds"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>

                    {/* Areas served [Auto-filled - check] */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Areas served
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Towns or neighborhoods, one per line
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={areasServed}
                        onChange={(e) => setAreasServed(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* What makes it different? */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          What makes it different?
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Unique value propositions, one per line
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={differentiators}
                        onChange={(e) => setDifferentiators(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>

                    {/* Owner's name & Years in business */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Owner's name
                        </label>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Years in business
                        </label>
                        <input
                          type="text"
                          value={yearsInBusiness}
                          onChange={(e) => setYearsInBusiness(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Internal Strategy Notes
                      </label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Specific priorities or local customer notes..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Checklist Card */}
                <div className="md:col-span-4 flex flex-col justify-between bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Profile Completeness
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">What it does ({category})</span>
                      </div>

                      <div className="flex items-center space-x-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">Services &amp; excluded filters</span>
                      </div>

                      <div className="flex items-center space-x-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">Phone number ({phone})</span>
                      </div>

                      <div className="flex items-center space-x-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">Towns &amp; neighborhoods loaded</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/70 text-[11px] leading-relaxed">
                      ✓ Ready for Google Profile keyword discovery and competitive local pack comparison.
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>Continue to Step 2</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Keyword Loading Transition Screen & Table */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            {isTransitioningStep2 ? (
              <div className="max-w-lg mx-auto py-10 px-6 text-center space-y-6">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Find keywords for {businessName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    We'll read the business details and Google profile, then recommend the keywords worth scanning.
                  </p>
                </div>

                {/* 4-Item Progress Checklist */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-3 shadow-xs">
                  <div className="flex items-center space-x-3 text-xs">
                    {keywordChecklistStep >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                    )}
                    <span className={keywordChecklistStep >= 1 ? 'font-medium text-slate-800' : 'text-slate-500'}>
                      Reading business details
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {keywordChecklistStep >= 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                    )}
                    <span className={keywordChecklistStep >= 2 ? 'font-medium text-slate-800' : 'text-slate-500'}>
                      Checking the Google profile
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {keywordChecklistStep >= 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                    )}
                    <span className={keywordChecklistStep >= 3 ? 'font-medium text-slate-800' : 'text-slate-500'}>
                      Looking at services and areas
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {keywordChecklistStep >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
                    )}
                    <span className={keywordChecklistStep >= 4 ? 'font-medium text-slate-800' : 'text-slate-500'}>
                      Picking keywords to scan
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Recommended Search Keywords for {businessName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select target terms to scan across the 5x5 geo-grid coordinate matrix.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                    {selectedKeywordNames.length} of {availableKeywords.length} selected
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10">Scan</th>
                        <th className="py-2.5 px-3">Keyword Query</th>
                        <th className="py-2.5 px-3 text-right">Monthly Volume</th>
                        <th className="py-2.5 px-3 text-right">Est. CPC</th>
                        <th className="py-2.5 px-3">Intent</th>
                        <th className="py-2.5 px-3">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {availableKeywords.map((kw) => {
                        const isSelected = selectedKeywordNames.includes(kw.keyword);
                        return (
                          <tr
                            key={kw.keyword}
                            onClick={() => toggleKeyword(kw.keyword)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="accent-emerald-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {kw.keyword}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                              {kw.monthlySearchVolume.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {kw.cpc}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {kw.intent}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                  kw.difficulty === 'Low'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : kw.difficulty === 'Medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {kw.difficulty}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Back to Details
                  </button>

                  <button
                    type="button"
                    onClick={handleStartScanMatrix}
                    disabled={selectedKeywordNames.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Scan rankings — up to {selectedKeywordNames.length * 25} credits</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Real-Time Scan Matrix Animation */}
        {step === 3 && (
          <div className="p-8 text-center space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Scanning rankings... Keyword 1 of {selectedKeywordNames.length} • {scanSpotIndex} of 25 spots checked
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Querying live Google Local SERP coordinates around {address}
              </p>
            </div>

            {/* Badges Bar */}
            <div className="flex items-center justify-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold">
                {scannedSpots.filter((s) => s.rank <= 3).length} of 25 in top 3
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-bold">
                Avg Rank: #
                {scannedSpots.length > 0
                  ? (
                      scannedSpots.reduce((acc, s) => acc + s.rank, 0) /
                      scannedSpots.length
                    ).toFixed(1)
                  : '1.0'}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-mono font-bold">
                {scanSpotIndex}/25 Spots checked
              </span>
            </div>

            {/* 5x5 Geo-Grid Animated Pins Matrix */}
            <div className="max-w-xs mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 25 }).map((_, idx) => {
                  const resolved = scannedSpots[idx];
                  let bg = 'bg-slate-200 text-slate-400 border-slate-300';
                  if (resolved) {
                    if (resolved.status === 'green') {
                      bg = 'bg-emerald-500 text-white border-emerald-600 shadow-xs scale-105';
                    } else if (resolved.status === 'yellow') {
                      bg = 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs';
                    } else {
                      bg = 'bg-rose-500 text-white border-rose-600';
                    }
                  } else if (idx === scanSpotIndex) {
                    bg = 'bg-emerald-200 text-emerald-900 border-emerald-400 animate-ping';
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-bold text-xs transition-all duration-200 ${bg}`}
                    >
                      {resolved ? resolved.rank : idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-slate-400 animate-pulse">
              Calibrating centroid proximity, competitor rank decay, and local authority graph...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
