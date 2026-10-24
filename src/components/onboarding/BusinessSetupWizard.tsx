/**
 * ProfitMaps AI / GeoRank Pro - Full Business Setup & Onboarding Wizard
 * Path: /src/components/onboarding/BusinessSetupWizard.tsx
 *
 * Implements:
 * 1. Step 1: Section 01 (Basics) & Section 02 ("Details that make it stand out") + Right-hand Checklist Card.
 * 2. Step 2: Keyword Discovery Transition Screen (4-item progress checklist) -> Selectable keyword table.
 * 3. Step 3: Real-Time 5x5 Scan Matrix Animation with dynamic badge resolution -> Onboarding completion.
 */

import React, { useState, useEffect } from 'react';
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
  // Wizard Step: 1 (Details) | 2 (Keywords) | 3 (Live Scan Animation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

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

  // Handler to progress from Step 1 to Step 2
  const handleProceedToStep2 = () => {
    setStep(2);
    setIsTransitioningStep2(true);
    setKeywordChecklistStep(0);

    // Run simulated discovery checklist
    setTimeout(() => setKeywordChecklistStep(1), 400);
    setTimeout(() => setKeywordChecklistStep(2), 900);
    setTimeout(() => setKeywordChecklistStep(3), 1400);
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
    }, 1900);
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
      // Generate simulated rank
      let rank = 1;
      let status: 'green' | 'yellow' | 'red' = 'green';
      if (spot === 13) {
        rank = 1; // Centroid
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
              lat: initialLat,
              lng: initialLng,
              placeId: initialPlaceId,
              domainOrUrl: website,
            },
            selectedKeywordNames
          );
        }, 1200);
      }
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-auto overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Step {step} of 3
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">
                  {step === 1 && 'Profile Setup & Differentiators'}
                  {step === 2 && 'Keyword Discovery & Traffic'}
                  {step === 3 && 'Real-Time Geo-Grid Matrix'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {step === 1 && `Setup Profile for ${businessName}`}
                {step === 2 && `Pick Keywords for ${businessName}`}
                {step === 3 && `Scanning Local Rankings Matrix`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Details that make it stand out */}
        {step === 1 && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
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
                      Areas served [Auto-filled - check]
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

        {/* STEP 2: Keyword Loading Transition Screen & Table */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            {isTransitioningStep2 ? (
              /* Centered Discovery Card */
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
              /* Selectable Keyword Table */
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
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                  >
                    Back to Details
                  </button>

                  <button
                    onClick={handleStartScanMatrix}
                    disabled={selectedKeywordNames.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-2"
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
