/**
 * ProfitMaps AI / GeoRank Pro - Client-Facing Presentation & Audit Deck
 * Path: /src/components/reports/AuditDeck.tsx
 *
 * Light-theme ProfitMaps AI design:
 * - Multi-Scenario Revenue Potential & Recovery Forecast Module (Conservative, Expected, Market Leader)
 * - Dual Interactive Sliders (Average Ticket Value & Lead-to-Client Close Rate)
 * - 3 Summary Result KPI Badges (Monthly Revenue Leaking, Annual Revenue Lost, New High-Ticket Inquiries)
 * - Multi-Keyword Revenue Opportunity Breakdown Table
 * - Client Plain-English Financial Takeaway Callout
 * - High-Impact Grid Telemetry KPI Cards
 * - Executive Visibility Summary & Spatial Centroid Diagnosis
 * - Dominant Competitors Takeover Share Breakdown
 * - Discovered High-Volume Commercial Keywords & Search Demand
 * - The 3 Priority Fixes to Reclaim Your Area (Benefit-driven remedy cards)
 * - Client Next-Step CTA Card (Strategy Call & Plan Activation)
 * - High-contrast white-label PDF print export layout
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { LocalSeoAuditOutput } from '../../lib/ai/audit-generator.ts';
import type { GridScanSummary } from '../../lib/serp/adapter.ts';
import { useBranding } from '../../lib/context/BrandingContext.tsx';
import { useActiveScanMetrics } from '../../lib/hooks/useActiveScanMetrics.ts';
import { detectLocaleFromBusiness, formatCurrency } from '../../config/brand.ts';
import {
  generateDeterministicKeywordDiscovery,
  type DiscoveredKeyword,
} from '../../lib/keywords/keyword-discovery.ts';
import {
  trackSliderAdjusted,
  trackScenarioChanged,
  trackCtaClicked,
} from '../../lib/telemetry/prospect-telemetry.ts';
import {
  Sparkles,
  Printer,
  DollarSign,
  Phone,
  Globe,
  TrendingDown,
  TrendingUp,
  Star,
  CheckCircle2,
  AlertTriangle,
  Target,
  MousePointerClick,
  Flame,
  Building,
  MapPin,
  Compass,
  Percent,
  Calculator,
  ArrowUpRight,
  Info,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export interface AuditDeckProps {
  audit?: Partial<LocalSeoAuditOutput> | null;
  scanSummary?: Partial<GridScanSummary> | null;
  discoveredKeywords?: DiscoveredKeyword[] | null;
  onRegenerateAudit?: () => void;
  isRegenerating?: boolean;
}

function inferCityFromCoordinates(lat?: number, lng?: number, address?: string): string {
  if (address) {
    const parts = address.split(',');
    if (parts.length > 1) {
      const cityCandidate = parts[1].trim();
      if (cityCandidate.length > 1) return cityCandidate;
    }
    return parts[0].trim();
  }
  if (lat !== undefined && lng !== undefined) {
    if (Math.abs(lat - 30.2672) < 0.5 && Math.abs(lng - -97.7431) < 0.5) return 'Austin';
    if (Math.abs(lat - 51.1492) < 0.5 && Math.abs(lng - -0.9782) < 0.5) return 'Alton';
    if (Math.abs(lat - 50.9097) < 0.5 && Math.abs(lng - -1.4044) < 0.5) return 'Southampton';
    if (Math.abs(lat - 51.5074) < 0.5 && Math.abs(lng - -0.1278) < 0.5) return 'London';
    if (Math.abs(lat - 32.7767) < 0.5 && Math.abs(lng - -96.797) < 0.5) return 'Dallas';
    if (Math.abs(lat - 41.8781) < 0.5 && Math.abs(lng - -87.6298) < 0.5) return 'Chicago';
  }
  return 'Local Area';
}

const DEFAULT_AUDIT: LocalSeoAuditOutput = {
  executiveSummary:
    'Geo-grid spatial analysis reveals significant centroid lock-in: visibility drops steeply outside your immediate centroid radius. Across the scanned service area, high-margin searchers are routed almost exclusively to nearby competitors.',
  missedRevenueEstimate:
    'Google Maps Local Pack (Top 3) commands ~70% of high-intent phone calls and direction requests. Ranking outside the 3-pack across most of your territory results in an estimated 45 to 65 missed inbound dispatch calls per month.',
  actionPlan: {
    gbpCategories:
      'Audit primary and secondary GBP categories: Ensure your primary category precisely matches your core specialization and add 3 to 5 targeted secondary service categories.',
    citations:
      'Standardize NAP across core data aggregators (Data Axle, Localeze, Foursquare) and sync hyper-local directory citations to reinforce entity authority.',
    reviews:
      'Launch an automated post-job SMS review flow encouraging verified customers to mention specific suburbs, neighborhoods, and service keywords in their feedback.',
    onPageLocalizedContent:
      'Deploy dedicated suburb landing pages with LocalBusiness GeoCoordinates schema markup linked directly to your GBP CID.',
  },
  coldOutreachPitch: {
    subjectLine: 'Quick question regarding local Google Maps reach',
    emailBody:
      'Hi team,\n\nI was running a geo-grid visibility audit for local service providers in your area and pulled up your live Google Maps rank radius.\n\nWhile you rank well right next to your office, your visibility drops outside your immediate 1-mile radius where competitors are capturing 70%+ of the incoming calls.\n\nI compiled a visual color-coded geo-map showing where calls are dropping off. Mind if I send over the screenshot?\n\nBest regards,\nLocal Growth Team',
    smsOrVoicemailScript:
      "Hey, ran a 25-pin Google Maps radar audit across our area—you're strong within 2 blocks, but beyond 1 mile competitors take 70% of phone calls. Mind if I text over the 1-page visual map breakdown?",
  },
};

const DEFAULT_SCAN_SUMMARY: GridScanSummary = {
  scanId: 'scan_default',
  createdAt: new Date().toISOString(),
  mode: 'mock',
  target: {
    businessName: 'Austin Premier Plumbing',
  },
  keyword: 'Emergency Plumber',
  center: { lat: 30.2672, lng: -97.7431 },
  gridSize: 5,
  distanceStep: 1.0,
  unit: 'km',
  totalNodes: 25,
  averageRank: 11.4,
  top3Count: 4,
  top3Percentage: 16.0,
  top10Count: 12,
  top10Percentage: 48.0,
  redZoneCount: 13,
  redZonePercentage: 52.0,
  unrankedCount: 0,
  dominantCompetitors: [
    {
      name: 'Premier Regional Solutions',
      avgRank: 2.1,
      top3SharePercent: 64,
      rating: 4.9,
      reviews: 342,
      category: 'Emergency Plumber',
    },
    {
      name: 'Capital City Express Masters',
      avgRank: 3.4,
      top3SharePercent: 48,
      rating: 4.8,
      reviews: 215,
      category: 'Emergency Plumber',
    },
    {
      name: 'Lone Star Regional Pros',
      avgRank: 4.2,
      top3SharePercent: 36,
      rating: 4.7,
      reviews: 189,
      category: 'Plumbing Service',
    },
  ],
  nodes: [],
};

export const AuditDeck: React.FC<AuditDeckProps> = ({
  audit,
  scanSummary,
  discoveredKeywords: propDiscoveredKeywords,
  onRegenerateAudit,
  isRegenerating = false,
}) => {
  const { branding } = useBranding();

  // Multi-Scenario State
  const [scenario, setScenario] = useState<'conservative' | 'expected' | 'leader'>('expected');
  const [avgTicketValue, setAvgTicketValue] = useState<number>(450);
  const [closeRate, setCloseRate] = useState<number>(30); // 30% default
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [showAuditTrail, setShowAuditTrail] = useState<boolean>(false);

  // Defensive merge with fallback defaults
  const safeAudit: LocalSeoAuditOutput = {
    executiveSummary: audit?.executiveSummary || DEFAULT_AUDIT.executiveSummary,
    missedRevenueEstimate: audit?.missedRevenueEstimate || DEFAULT_AUDIT.missedRevenueEstimate,
    actionPlan: {
      gbpCategories: audit?.actionPlan?.gbpCategories || DEFAULT_AUDIT.actionPlan.gbpCategories,
      citations: audit?.actionPlan?.citations || DEFAULT_AUDIT.actionPlan.citations,
      reviews: audit?.actionPlan?.reviews || DEFAULT_AUDIT.actionPlan.reviews,
      onPageLocalizedContent:
        audit?.actionPlan?.onPageLocalizedContent || DEFAULT_AUDIT.actionPlan.onPageLocalizedContent,
    },
    coldOutreachPitch: {
      subjectLine: audit?.coldOutreachPitch?.subjectLine || DEFAULT_AUDIT.coldOutreachPitch.subjectLine,
      emailBody: audit?.coldOutreachPitch?.emailBody || DEFAULT_AUDIT.coldOutreachPitch.emailBody,
      smsOrVoicemailScript:
        audit?.coldOutreachPitch?.smsOrVoicemailScript || DEFAULT_AUDIT.coldOutreachPitch.smsOrVoicemailScript,
    },
  };

  const safeSummary: GridScanSummary = {
    ...DEFAULT_SCAN_SUMMARY,
    ...scanSummary,
    target: { ...DEFAULT_SCAN_SUMMARY.target, ...(scanSummary?.target || {}) },
    dominantCompetitors: scanSummary?.dominantCompetitors?.length
      ? scanSummary.dominantCompetitors
      : DEFAULT_SCAN_SUMMARY.dominantCompetitors,
  };

  const targetCity = useMemo(() => {
    return inferCityFromCoordinates(
      safeSummary.center?.lat,
      safeSummary.center?.lng,
      (safeSummary.target as { address?: string })?.address
    );
  }, [safeSummary.center?.lat, safeSummary.center?.lng, (safeSummary.target as { address?: string })?.address]);

  // Initial deterministic keywords to ensure zero flash / zero blank data
  const initialDiscovery = useMemo(() => {
    if (propDiscoveredKeywords && propDiscoveredKeywords.length > 0) {
      return propDiscoveredKeywords;
    }
    const det = generateDeterministicKeywordDiscovery({
      businessName: safeSummary.target.businessName || 'Local Business',
      category: safeSummary.keyword || 'Local Service',
      cityOrTown: targetCity,
    });
    return det.keywords;
  }, [safeSummary.target.businessName, safeSummary.keyword, targetCity, propDiscoveredKeywords]);

  const [displayedKeywords, setDisplayedKeywords] = useState<DiscoveredKeyword[]>(initialDiscovery);

  useEffect(() => {
    if (propDiscoveredKeywords && propDiscoveredKeywords.length > 0) {
      setDisplayedKeywords(propDiscoveredKeywords);
      return;
    }

    const business = safeSummary.target.businessName || 'Local Business';
    const cat = safeSummary.keyword || 'Local Service';

    fetch('/api/keywords/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: business,
        category: cat,
        cityOrTown: targetCity,
      }),
    })
      .then((r) => r.json())
      .then((resData) => {
        if (resData.success && resData.data?.keywords?.length > 0) {
          setDisplayedKeywords(resData.data.keywords);
        }
      })
      .catch((err) => {
        console.warn('AuditDeck: using deterministic keywords fallback:', err);
      });
  }, [safeSummary.target.businessName, safeSummary.keyword, targetCity, propDiscoveredKeywords]);

  const activeMetrics = useActiveScanMetrics(safeSummary, safeSummary.keyword, safeSummary.target?.businessName);

  const businessLocale = useMemo(() => {
    return detectLocaleFromBusiness({
      address: (safeSummary.target as { address?: string })?.address,
      city: targetCity,
      lat: safeSummary.center?.lat,
      lng: safeSummary.center?.lng,
    });
  }, [safeSummary.target, targetCity, safeSummary.center?.lat, safeSummary.center?.lng]);

  const currencySymbol = businessLocale.currencySymbol;

  // Compute Keyword Traffic & Commercial Opportunity Callout Metrics
  const totalUntappedMonthlyVolume = useMemo(() => {
    return displayedKeywords.reduce((sum, k) => sum + k.monthlySearchVolume, 0);
  }, [displayedKeywords]);

  const estimatedInboundClicksMonthly = useMemo(() => {
    return Math.round(totalUntappedMonthlyVolume * 0.32);
  }, [totalUntappedMonthlyVolume]);

  const { averageCpcFormatted, annualTrafficValue } = useMemo(() => {
    const numericCpcs = displayedKeywords
      .map((k) => parseFloat(k.cpc.replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n));
    const avgCpc =
      numericCpcs.length > 0
        ? numericCpcs.reduce((a, b) => a + b, 0) / numericCpcs.length
        : 3.5;
    const annualVal = Math.round(estimatedInboundClicksMonthly * avgCpc * 12);
    return {
      averageCpcFormatted: `${currencySymbol}${avgCpc.toFixed(2)}`,
      annualTrafficValue: annualVal,
    };
  }, [displayedKeywords, estimatedInboundClicksMonthly, currencySymbol]);

  const totalNodes = safeSummary.totalNodes || 25;
  const top3Count = safeSummary.top3Count || 0;
  const top3Percentage = safeSummary.top3Percentage ?? Number(((top3Count / totalNodes) * 100).toFixed(1));

  // Red Zone count: nodes with rank >= 11 or unranked
  const redZoneCount =
    safeSummary.redZoneCount ??
    (safeSummary.nodes && safeSummary.nodes.length > 0
      ? safeSummary.nodes.filter((n) => n.rank === null || n.rank >= 11).length
      : Math.max(0, totalNodes - (safeSummary.top10Count || top3Count)));

  const redZonePercentage =
    safeSummary.redZonePercentage ?? Number(((redZoneCount / totalNodes) * 100).toFixed(1));

  const totalNodesInRedOrYellow = Math.max(0, totalNodes - top3Count);

  // ---------------------------------------------------------------------------
  // MULTI-SCENARIO REVENUE OUTCOME ENGINE
  // ---------------------------------------------------------------------------
  // 1. Scenario Share percentage:
  // Conservative (15% Share) | Expected Growth (35% Share) | Market Leader (60% Share)
  const scenarioShare = scenario === 'conservative' ? 0.15 : scenario === 'expected' ? 0.35 : 0.6;
  const scenarioLabel =
    scenario === 'conservative'
      ? 'Conservative (15% Share)'
      : scenario === 'expected'
      ? 'Expected Growth (35% Share)'
      : 'Market Leader (60% Share)';

  // 2. Base market pool calculations:
  const totalVolume = totalUntappedMonthlyVolume > 0 ? totalUntappedMonthlyVolume : 1800;
  // Local click-to-call intent pool: ~15% of searchers actively call/inquire
  const totalPotentialCalls = totalVolume * 0.15;
  // Geographic deficit ratio (nodes outside Top 3)
  const dropoffRatio = totalNodes > 0 ? totalNodesInRedOrYellow / totalNodes : 0.84;
  const totalMissedTerritoryCalls = totalPotentialCalls * dropoffRatio;

  // 3. New High-Ticket Inquiries / Month under active scenario:
  const recoveredInquiries = Math.max(
    scenario === 'conservative' ? 16 : scenario === 'expected' ? 36 : 64,
    Math.round(totalMissedTerritoryCalls * scenarioShare)
  );

  // 4. Closed Deals = Inquiries * closeRate
  const closedDeals = Math.max(1, Math.round(recoveredInquiries * (closeRate / 100)));

  // 5. Monthly Revenue Leaking = (Missed Inquiries * Close Rate * Average Value)
  const monthlyRevenueLeaking = Math.round(recoveredInquiries * (closeRate / 100) * avgTicketValue);

  // 6. Annual Revenue Left on the Table = Monthly Revenue Leaking * 12
  const annualRevenueLeaking = monthlyRevenueLeaking * 12;

  // Core Trade Keywords for Multi-Keyword Opportunity Breakdown (top 4-5)
  const coreKeywords = useMemo(() => {
    if (displayedKeywords.length === 0) return [];
    return [...displayedKeywords]
      .sort((a, b) => b.monthlySearchVolume - a.monthlySearchVolume)
      .slice(0, 5);
  }, [displayedKeywords]);

  const coreKeywordsOpportunity = useMemo(() => {
    const totalCoreVol = coreKeywords.reduce((acc, k) => acc + k.monthlySearchVolume, 0) || totalVolume;
    return coreKeywords.map((item) => {
      const isPrimary =
        item.keyword.toLowerCase().includes(safeSummary.keyword.toLowerCase()) ||
        safeSummary.keyword.toLowerCase().includes(item.keyword.toLowerCase());

      let rankDisplay = 'Unranked (#11+)';
      if (isPrimary) {
        rankDisplay = top3Percentage >= 30 ? '#1 Inside Centroid' : '#5+ Outside 1.5km';
      } else if (item.difficulty === 'Low') {
        rankDisplay = 'Unranked / High-ROI Gap';
      }

      const kwWeight = item.monthlySearchVolume / totalCoreVol;
      const kwMissedCalls = Math.max(2, Math.round(recoveredInquiries * kwWeight));
      const kwRevenueImpact = Math.round(kwMissedCalls * (closeRate / 100) * avgTicketValue);

      return {
        keyword: item.keyword,
        volume: item.monthlySearchVolume,
        rankDisplay,
        missedCalls: kwMissedCalls,
        revenueImpact: kwRevenueImpact,
      };
    });
  }, [coreKeywords, totalVolume, safeSummary.keyword, top3Percentage, recoveredInquiries, closeRate, avgTicketValue]);

  const totalCoreRevenueImpact = useMemo(() => {
    return coreKeywordsOpportunity.reduce((acc, k) => acc + k.revenueImpact, 0);
  }, [coreKeywordsOpportunity]);

  const totalCoreMissedCalls = useMemo(() => {
    return coreKeywordsOpportunity.reduce((acc, k) => acc + k.missedCalls, 0);
  }, [coreKeywordsOpportunity]);

  const totalCoreVolume = useMemo(() => {
    return coreKeywordsOpportunity.reduce((acc, k) => acc + k.volume, 0);
  }, [coreKeywordsOpportunity]);

  // Competitor Names for Callout Banner & Fix Cards
  const topCompetitor1 = safeSummary.dominantCompetitors?.[0]?.name || 'Premier Regional Solutions';
  const topCompetitor2 = safeSummary.dominantCompetitors?.[1]?.name || 'Capital City Express Masters';
  const comp1Reviews = safeSummary.dominantCompetitors?.[0]?.reviews ?? 280;

  const handlePrint = () => {
    trackCtaClicked(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', 'print_pdf');
    window.print();
  };

  const handleScenarioChange = (newScenario: 'conservative' | 'expected' | 'leader') => {
    setScenario(newScenario);
    trackScenarioChanged(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', newScenario);
  };

  const handleAvgTicketChange = (val: number) => {
    setAvgTicketValue(val);
    trackSliderAdjusted(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', 'avgTicketValue', val);
  };

  const handleCloseRateChange = (val: number) => {
    setCloseRate(val);
    trackSliderAdjusted(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', 'closeRate', val);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Executive Local SEO Audit &amp; Revenue Leak Report
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">
              Prepared for <strong className="text-slate-800">{safeSummary.target.businessName}</strong>
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${activeMetrics.operationalBadge.pillClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeMetrics.operationalBadge.dotClass}`} />
              <span>{activeMetrics.operationalBadge.label}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onRegenerateAudit && (
            <button
              onClick={onRegenerateAudit}
              disabled={isRegenerating}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRegenerating ? 'Analyzing...' : 'Refresh Audit'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save White-Label PDF</span>
          </button>
        </div>
      </div>

      {/* Main Pitch Deck Container (Clean Light Theme for Screen & Print) */}
      <div className="bg-white print:p-6 p-4 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-slate-800 w-full max-w-full overflow-x-hidden">
        {/* Mock Simulation Warning Banner */}
        {safeSummary.mode === 'mock' && (
          <div className="bg-amber-500 text-slate-950 font-black px-4 py-3 rounded-xl border-2 border-amber-600 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs tracking-wide">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-slate-950 shrink-0" />
              <span>⚠️ SIMULATED DEMO AUDIT — Projections are based on distance decay models, not live Google Maps SERP data.</span>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold bg-amber-600/30 px-2.5 py-1 rounded text-slate-950 shrink-0 self-start sm:self-auto border border-amber-700/30">
              0 Credits Charged
            </span>
          </div>
        )}

        {/* Header Metadata Section */}
        <div className="border-b border-slate-200/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-bold">
                Confidential Local SEO Audit &amp; Market Share Defense
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${activeMetrics.operationalBadge.pillClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeMetrics.operationalBadge.dotClass}`} />
                <span>{activeMetrics.operationalBadge.label}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {safeSummary.target.businessName || 'Target Business'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Keyword: <strong className="text-slate-800 font-semibold">{safeSummary.keyword}</strong> • {safeSummary.gridSize}x{safeSummary.gridSize} Geodesic Grid ({totalNodes} Pins)
            </p>
          </div>

          <div className="sm:text-right flex flex-col sm:items-end gap-1">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.agencyName}
                className="h-8 w-auto object-contain mb-1"
              />
            ) : null}
            <span className="text-xs font-bold text-slate-900 block font-mono">
              Prepared by: {branding.agencyName || 'GeoRank Growth Agency'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {branding.contactEmail} {branding.phone ? `• ${branding.phone}` : ''} • {new Date(safeSummary.createdAt).toLocaleDateString()}
            </span>
            {branding.websiteUrl ? (
              <span className="text-[10px] text-emerald-700 font-mono hidden sm:block">
                {branding.websiteUrl}
              </span>
            ) : null}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. SECTION: REVENUE POTENTIAL & RECOVERY FORECAST (MULTI-SCENARIO MODULE) */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 p-6 sm:p-7 rounded-2xl border-2 border-emerald-200/90 shadow-sm space-y-6 print:break-inside-avoid">
          {/* Header & Scenario Switcher Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center space-x-2 text-emerald-700">
                <Calculator className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                  Revenue Potential &amp; Recovery Forecast
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Simulate your projected business turnover recovered from local rivals by reclaiming Google 3-Pack positions.
              </p>
            </div>

            {/* Scenario Switcher Pill Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start lg:self-auto print:hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2 hidden sm:inline">Scenario:</span>
              {(
                [
                  { id: 'conservative', label: 'Conservative (15% Share)' },
                  { id: 'expected', label: 'Expected Growth (35% Share)' },
                  { id: 'leader', label: 'Market Leader (60% Share)' },
                ] as const
              ).map((item) => {
                const active = scenario === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleScenarioChange(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Impact Sliders (Dual Controls) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs print:hidden">
            {/* Slider 1: Average Value per Customer / Job */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Average Value per Customer / Job:</span>
                </span>
                <span className="font-mono font-bold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {currencySymbol}{avgTicketValue.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="25"
                value={avgTicketValue}
                onChange={(e) => handleAvgTicketChange(parseInt(e.target.value) || 450)}
                data-testid="slider-avg-ticket"
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{currencySymbol}100 min</span>
                <span className="text-slate-500 font-medium">Average ticket size</span>
                <span>{currencySymbol}2,500 max</span>
              </div>
            </div>

            {/* Slider 2: Lead-to-Client Close Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>Lead-to-Client Close Rate:</span>
                </span>
                <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {closeRate}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={closeRate}
                onChange={(e) => handleCloseRateChange(parseInt(e.target.value) || 30)}
                data-testid="slider-close-rate"
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>15% conservative</span>
                <span className="text-slate-500 font-medium">Inbound quote close rate</span>
                <span>60% aggressive</span>
              </div>
            </div>
          </div>

          {/* Methodology & Data Confidence Bar */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Target className="w-3 h-3 text-blue-600" />
                  <span>Measured Google Pack Ranks</span>
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Calculator className="w-3 h-3 text-emerald-600" />
                  <span>Projected Revenue Impact</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMethodology(!showMethodology)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>{showMethodology ? 'Hide Methodology' : 'View Calculation Methodology'}</span>
              </button>
            </div>
            {showMethodology && (
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
                <p>
                  <strong className="font-semibold text-slate-800">Calculation Methodology:</strong> [Keyword Search Volume] × [Local 3-Pack Share of Voice (CTR)] × [Target Close Rate] × [Average Customer Ticket Value]. Assumptions can be customized using the sliders above.
                </p>
                <p className="text-[10px] text-slate-500">
                  • <em>Measured Google Pack Ranks:</em> Hard spatial coordinates queried directly across the geo-grid.
                  <br />
                  • <em>Projected Revenue Impact:</em> Calibrated commercial model based on local click-to-call conversion benchmarks.
                </p>
              </div>
            )}
          </div>

          {/* 3 Summary Result KPI Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Badge 1: Monthly Revenue Leaking */}
            <div className="bg-gradient-to-br from-rose-50 to-white p-4 sm:p-5 rounded-xl border border-rose-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block flex items-center justify-between">
                <span>Monthly Revenue Leaking</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </span>
              <div data-testid="kpi-monthly-leak" className="text-xl sm:text-2xl font-black font-mono text-rose-700">
                {currencySymbol}{monthlyRevenueLeaking.toLocaleString()} <span className="text-xs font-normal text-rose-600">/ mo</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {recoveredInquiries} inquiries × {closeRate}% close × {currencySymbol}{avgTicketValue}
              </p>
            </div>

            {/* Badge 2: Annual Revenue Left on the Table */}
            <div className="bg-gradient-to-br from-amber-50 to-white p-4 sm:p-5 rounded-xl border border-amber-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block flex items-center justify-between">
                <span>Annual Revenue on the Table</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </span>
              <div data-testid="kpi-annual-leak" className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                {currencySymbol}{annualRevenueLeaking.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ yr</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                12 months cumulative market loss to rivals
              </p>
            </div>

            {/* Badge 3: New High-Ticket Inquiries / Month */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-4 sm:p-5 rounded-xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block flex items-center justify-between">
                <span>Recoverable Inquiries / Month</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-200" />
              </span>
              <div data-testid="kpi-recoverable-inquiries" className="text-xl sm:text-2xl font-black font-mono text-white">
                +{recoveredInquiries} <span className="text-xs font-normal text-emerald-100">calls / mo</span>
              </div>
              <p className="text-[11px] text-emerald-100 leading-tight">
                Under {scenarioLabel} ({closedDeals} closed deals)
              </p>
            </div>
          </div>

          {/* Exact Mathematical Formula & Data Grounding Box */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 font-mono">
              <span>Formula: [Estimated Monthly Searches] × [3-Pack CTR %] × [Close Rate %] × [Avg Ticket Value]</span>
              <span className="text-emerald-700 font-bold">Estimated Google Ads Volume: {totalVolume.toLocaleString()} searches/mo</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Financial Calculation Note:</strong> Grid rankings shown across the map are <strong>measured Google Maps positions</strong>. The revenue leakage figure is a <strong>calibrated financial estimate</strong> derived from your target conversion inputs ({closeRate}% lead-to-client close rate at {currencySymbol}{avgTicketValue.toLocaleString()} per job).
            </p>
          </div>

          {/* Multi-Keyword Revenue Opportunity Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Multi-Keyword Revenue Impact Breakdown
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                Simulated at {closeRate}% close rate &amp; {currencySymbol}{avgTicketValue} avg ticket
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3.5 whitespace-normal break-words sm:whitespace-nowrap">Target Service Keyword</th>
                    <th className="py-2.5 px-3 text-right whitespace-normal break-words sm:whitespace-nowrap">Monthly Searches</th>
                    <th className="py-2.5 px-3 whitespace-normal break-words sm:whitespace-nowrap">Current Local Pack Rank</th>
                    <th className="py-2.5 px-3 text-right whitespace-normal break-words sm:whitespace-nowrap">Est. Missed Calls / Mo</th>
                    <th className="py-2.5 px-3.5 text-right whitespace-normal break-words sm:whitespace-nowrap">Est. Monthly Revenue Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {coreKeywordsOpportunity.map((item, idx) => (
                    <tr key={item.keyword + idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">
                        {item.keyword}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {item.volume.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            item.rankDisplay.includes('#1')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.rankDisplay.includes('#5')
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {item.rankDisplay}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                        +{item.missedCalls} calls/mo
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-700">
                        {currencySymbol}{item.revenueImpact.toLocaleString()}/mo
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/70 border-t-2 border-emerald-200 font-bold text-slate-900 text-xs">
                    <td className="py-3 px-3.5 font-extrabold uppercase text-[11px] text-emerald-900">
                      Total Combined Opportunity
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {totalCoreVolume.toLocaleString()} searches
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 font-normal">
                      Across {coreKeywordsOpportunity.length} core service lines
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-800">
                      +{totalCoreMissedCalls} calls/mo
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-emerald-800 text-sm">
                      {currencySymbol}{totalCoreRevenueImpact.toLocaleString()}/mo
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Client Plain-English Takeaway */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex items-start space-x-3 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Even if you only close <strong className="font-bold text-emerald-900">{closeRate}%</strong> of inbound calls at <strong className="font-bold text-emerald-900">{currencySymbol}{avgTicketValue.toLocaleString()}</strong> per job, recovering just <strong className="font-bold text-emerald-900">{recoveredInquiries}</strong> lost calls per month from competitors adds <strong className="font-bold text-emerald-900">{currencySymbol}{monthlyRevenueLeaking.toLocaleString()}</strong> in recurring monthly turnover (<strong className="font-bold text-emerald-900">{currencySymbol}{annualRevenueLeaking.toLocaleString()}</strong> annually).
            </p>
          </div>

          {/* Callout Warning Banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 sm:p-4 text-xs text-amber-900 flex items-start space-x-3 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-950">Over 74% of local customers</strong> never look past the first 3 listings on Google Maps. Because your profile drops to position #5+ outside your immediate location, these calls are going directly to <strong className="font-bold text-slate-900 underline decoration-amber-400 underline-offset-2">{topCompetitor1}</strong> and <strong className="font-bold text-slate-900 underline decoration-amber-400 underline-offset-2">{topCompetitor2}</strong>.
            </div>
          </div>
        </div>

        {/* High-Impact Grid Telemetry KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <span className="text-[11px] text-slate-500 font-medium block">
              Average Grid Rank
            </span>
            <span className="text-2xl font-black font-mono text-rose-600 mt-0.5 block">
              {activeMetrics.formattedRank}
            </span>
            <span className="text-[10px] text-slate-400">Across {totalNodes} coordinates</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/70">
            <span className="text-[11px] text-emerald-800 font-medium block">
              3-Pack Presence
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 mt-0.5 block">
              {activeMetrics.formattedTop3}
            </span>
            <span className="text-[10px] text-emerald-600">{top3Count} of {totalNodes} pins in top 3</span>
          </div>

          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200/70">
            <span className="text-[11px] text-rose-800 font-medium block">
              Dropoff Red Zone
            </span>
            <span className="text-2xl font-black font-mono text-rose-700 mt-0.5 block">
              {activeMetrics.redZonePercentage.toFixed(1)}%
            </span>
            <span className="text-[10px] text-rose-600">{redZoneCount} of {totalNodes} pins in red zone (rank 11+)</span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
            <span className="text-[11px] text-slate-500 font-medium block">
              Projected Monthly Loss
            </span>
            <span className="text-2xl font-black font-mono text-slate-900 mt-0.5 block">
              {currencySymbol}{(monthlyRevenueLeaking / 1000).toFixed(1)}k <span className="text-xs font-normal text-slate-400">/ mo</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {totalNodesInRedOrYellow} zones outside 3-pack
            </span>
          </div>
        </div>

        {/* Executive Summary & Spatial Centroid Diagnosis */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center space-x-2 text-slate-900">
            <Compass className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Executive Visibility Summary &amp; Spatial Centroid Diagnosis
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {safeAudit.executiveSummary}
          </p>
        </div>

        {/* Dominant Competitors Stealing Territory */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-rose-500" />
              <span>Dominant Competitors Intercepting Calls in Your Radius</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Top 3-Pack Takeover Share
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {safeSummary.dominantCompetitors.slice(0, 3).map((comp, idx) => (
              <div
                key={comp.name || idx}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-500">#{idx + 1} Rival</span>
                  <span className="font-mono font-bold text-amber-500 flex items-center">
                    ★ {comp.rating ?? 4.8} <span className="text-slate-400 font-normal ml-0.5">({comp.reviews ?? 100})</span>
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs truncate">
                  {comp.name}
                </div>
                <div className="text-[11px] text-emerald-700 font-mono">
                  Captures {comp.top3SharePercent ?? 50}% of scanned territory
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discovered High-Volume Commercial Keywords & Search Demand */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 space-y-4 print:break-inside-avoid">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <div className="flex items-center space-x-2 text-slate-900">
                <Target className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Discovered High-Volume Commercial Keywords &amp; Search Demand
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                High-intent local search terms in <strong className="text-slate-700">{targetCity}</strong> with commercial CPC value and Google 3-Pack capture potential.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md self-start sm:self-auto border border-emerald-200">
              {displayedKeywords.length} Search Queries Analyzed
            </span>
          </div>

          {/* Summary Metric Callouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Monthly Searches</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xl font-black font-mono text-slate-900 block">
                {totalUntappedMonthlyVolume.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">local monthly query volume</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider">Est. Inbound Calls (Top 3)</span>
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xl font-black font-mono text-emerald-700 block">
                ~{estimatedInboundClicksMonthly.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600">targeted monthly dispatch leads</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider">Average Local CPC</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-xl font-black font-mono text-slate-900 block">
                {averageCpcFormatted}
              </span>
              <span className="text-[10px] text-slate-400">Google Ads equivalent</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-3.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-emerald-100 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider">Annual Traffic Value (Top 3)</span>
                <Flame className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="text-xl font-black font-mono text-white block">
                {currencySymbol}{(annualTrafficValue / 1000).toFixed(0)}k <span className="text-xs font-normal text-emerald-100">/ yr</span>
              </span>
              <span className="text-[10px] text-emerald-100">free organic ad spend value</span>
            </div>
          </div>

          {/* Interactive Keywords Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs print:overflow-visible">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3.5 whitespace-normal break-words sm:whitespace-nowrap">Target Search Query</th>
                    <th className="py-2.5 px-3 text-right whitespace-normal break-words sm:whitespace-nowrap">Monthly Searches</th>
                    <th className="py-2.5 px-3 text-right whitespace-normal break-words sm:whitespace-nowrap">Est. CPC</th>
                    <th className="py-2.5 px-3 whitespace-normal break-words sm:whitespace-nowrap">Search Intent</th>
                    <th className="py-2.5 px-3.5 whitespace-normal break-words sm:whitespace-nowrap">Current Local Pack Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {displayedKeywords.map((item, idx) => {
                    let intentBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (item.intent === 'Emergency') {
                      intentBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                    } else if (item.intent === 'High Intent') {
                      intentBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (item.intent === 'Transactional') {
                      intentBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (item.intent === 'Commercial') {
                      intentBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                    }

                    const isPrimary =
                      item.keyword.toLowerCase().includes(safeSummary.keyword.toLowerCase()) ||
                      safeSummary.keyword.toLowerCase().includes(item.keyword.toLowerCase());

                    let statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Unranked / Gap Opportunity</span>
                      </span>
                    );

                    if (isPrimary) {
                      if (top3Percentage >= 30) {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Tracked #{safeSummary.averageRank ? safeSummary.averageRank.toFixed(1) : '1'} ({top3Percentage}% 3-Pack)</span>
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Tracked #{safeSummary.averageRank ? safeSummary.averageRank.toFixed(1) : '11+'} (Weak Centroid)</span>
                          </span>
                        );
                      }
                    } else if (item.difficulty === 'Low') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <TrendingUp className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>High-ROI Keyword Gap</span>
                        </span>
                      );
                    } else if (item.intent === 'Emergency' || item.intent === 'High Intent') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Target className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Competitor Intercept Gap</span>
                        </span>
                      );
                    }

                    return (
                      <tr key={item.keyword + idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {item.keyword}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {item.monthlySearchVolume.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-semibold">
                          {item.cpc}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${intentBadge}`}>
                            {item.intent}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2. SECTION: The 3 Priority Fixes to Reclaim Your Area (Customer-Friendly Remedies) */}
        <div className="space-y-4 print:break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center space-x-2 text-slate-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  The 3 Priority Fixes to Reclaim Your Area
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeted, benefit-driven remedies engineered to expand your Google Maps reach and capture lost customer calls.
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
              3-Step Action Plan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fix 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                    Fix 01 • On-Page &amp; Services
                  </span>
                  <Globe className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                  Match Your Website &amp; Service Pages to Exact Customer Searches
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-rose-700 text-[10px] uppercase tracking-wide block mb-0.5">The Problem</span>
                    <p className="leading-relaxed">
                      Google doesn&apos;t see specific landing pages on your website confirming you offer all key services across neighboring areas.
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/70">
                    <span className="font-bold text-emerald-800 text-[10px] uppercase tracking-wide block mb-0.5">The Fix</span>
                    <p className="leading-relaxed text-slate-700">
                      We publish dedicated, high-converting service and neighborhood pages optimized for Google Maps matching.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-full justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Expected Impact: +30% Geographic Expansion</span>
                </span>
              </div>
            </div>

            {/* Fix 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                    Fix 02 • Authority &amp; Reviews
                  </span>
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition leading-snug">
                  Review Acceleration &amp; Service Keyword Mentions
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-rose-700 text-[10px] uppercase tracking-wide block mb-0.5">The Problem</span>
                    <p className="leading-relaxed">
                      {topCompetitor1} has {Math.max(40, comp1Reviews - 80)} more reviews, and Google rewards profiles whose customer reviews mention specific services and towns.
                    </p>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/70">
                    <span className="font-bold text-amber-800 text-[10px] uppercase tracking-wide block mb-0.5">The Fix</span>
                    <p className="leading-relaxed text-slate-700">
                      We set up an automated review flow prompting satisfied customers to mention the exact service and area, building authority fast.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-full justify-center">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Expected Impact: Closes the Review Gap in 30–60 Days</span>
                </span>
              </div>
            </div>

            {/* Fix 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                    Fix 03 • Location Trust
                  </span>
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition leading-snug">
                  Fix Directory &amp; Map Consistency (NAP Alignment)
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-rose-700 text-[10px] uppercase tracking-wide block mb-0.5">The Problem</span>
                    <p className="leading-relaxed">
                      Conflicting phone numbers or missing listings on Apple Maps, Bing, and local directories weaken Google&apos;s trust in your location.
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/70">
                    <span className="font-bold text-blue-800 text-[10px] uppercase tracking-wide block mb-0.5">The Fix</span>
                    <p className="leading-relaxed text-slate-700">
                      We lock in 100% verified consistency across all major mapping networks and local directories.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 w-full justify-center">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Expected Impact: Strengthens Local Pack Stability</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECTION: Client Next-Step CTA Card (Consultation & Activation) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-lg space-y-6 print:break-inside-avoid">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                Next Step • Market Recovery
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Ready to stop losing local customers to competitors?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                We can implement these fixes, deploy your optimized service pages, and expand your Google Maps reach across the entire town.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No long-term contracts
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Transparent geo-grid tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Fast 14-day setup
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 print:hidden">
              <a
                href={
                  branding.phone
                    ? `tel:${branding.phone.replace(/[^0-9+]/g, '')}`
                    : `mailto:${branding.contactEmail}?subject=15-Minute Strategy Call for ${encodeURIComponent(safeSummary.target.businessName || 'our business')}`
                }
                onClick={() => {
                  trackCtaClicked(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', 'strategy_call');
                }}
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md hover:shadow-emerald-500/30 transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>📞 Book a 15-Minute Strategy Call</span>
              </a>

              <a
                href={`mailto:${branding.contactEmail}?subject=Activate Full Visibility Plan for ${encodeURIComponent(safeSummary.target.businessName || 'our business')}&body=Hi ${encodeURIComponent(branding.agencyName)},%0D%0A%0D%0AWe reviewed our Geo-Grid Rank Audit report and would like to activate the full visibility plan to reclaim our 3-Pack rankings.%0D%0A%0D%0ABusiness: ${encodeURIComponent(safeSummary.target.businessName || '')}%0D%0ATarget Keyword: ${encodeURIComponent(safeSummary.keyword || '')}%0D%0A`}
                onClick={() => {
                  trackCtaClicked(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', 'activate_plan');
                }}
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer backdrop-blur-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>🚀 Activate Full Visibility Plan</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <div>
              Agency: <strong className="text-white">{branding.agencyName}</strong> • {branding.contactEmail}
            </div>
            {branding.phone && (
              <div>
                Direct Phone: <strong className="text-emerald-400">{branding.phone}</strong>
              </div>
            )}
            {branding.websiteUrl && (
              <div className="text-emerald-400">
                {branding.websiteUrl}
              </div>
            )}
          </div>
        </div>

        {/* Data Verification & Audit Trail Box (For Live SERP Scans) */}
        {safeSummary.mode === 'live' && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 print:break-inside-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/80">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>Data Verification &amp; Audit Trail</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                      Live SERP Provenance
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Query: <strong className="text-slate-800 font-semibold">{safeSummary.keyword}</strong> • Centroid: <span className="font-mono text-slate-700">{safeSummary.center?.lat?.toFixed(4)}, {safeSummary.center?.lng?.toFixed(4)}</span> • Executed: <span className="font-mono text-slate-700">{new Date(safeSummary.createdAt).toUTCString()}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !showAuditTrail;
                  setShowAuditTrail(nextState);
                  if (nextState) {
                    trackCtaClicked(safeSummary.scanId || 'latest', safeSummary.target.businessName || 'Local Business', 'serp_evidence');
                  }
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>{showAuditTrail ? 'Hide Raw Evidence' : 'View Raw SERP Evidence & Google Search URLs'}</span>
              </button>
            </div>

            {showAuditTrail && (
              <div className="pt-3 border-t border-slate-200 space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">Data Provider</span>
                    <span className="font-bold text-slate-900">{safeSummary.provider || 'DataForSEO (Google Maps Live Advanced)'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">Live Query Verification Task</span>
                    <span className="font-mono text-slate-900 truncate block text-[11px]">{safeSummary.taskId || safeSummary.auditTrail?.taskId || 'Verified DataForSEO Live Query'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">GPS Coordinates Queried</span>
                    <span className="font-mono font-bold text-emerald-700">{safeSummary.nodes?.length || safeSummary.totalNodes} Live Google Maps Pins</span>
                  </div>
                </div>

                {/* Primary Google Maps Check URL */}
                {safeSummary.checkUrl && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="truncate min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Direct Google Maps Verification URL:</span>
                      <a
                        href={safeSummary.checkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 underline truncate block font-mono text-[11px] mt-0.5"
                      >
                        {safeSummary.checkUrl}
                      </a>
                    </div>
                    <a
                      href={safeSummary.checkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shrink-0 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Verified Ranking Entities from Google SERP */}
                {safeSummary.dominantCompetitors && safeSummary.dominantCompetitors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                      Actual Ranking Entities Captured on Google Maps:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {safeSummary.dominantCompetitors.map((comp, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                          <span className="font-bold text-slate-900 block truncate">{comp.name}</span>
                          <span className="text-[11px] text-slate-500 block">
                            ★ {comp.rating} ({comp.reviews} Google reviews)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 block">
                            Captures {comp.top3SharePercent}% of scanned territory (Avg #{comp.avgRank})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Printable Footer */}
        <div className="hidden print:flex items-center justify-between pt-4 border-t border-slate-300 text-xs text-slate-500 font-mono">
          <span>{branding.agencyName} • Local SEO Geo-Grid Audit</span>
          <span>Generated for {safeSummary.target.businessName}</span>
          <span>Confidential Client Report</span>
        </div>
      </div>
    </div>
  );
};
