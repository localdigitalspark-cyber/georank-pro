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
  trackLeakageToggled,
  trackLeakageExpanded,
  trackFullReportRequested,
} from '../../lib/telemetry/prospect-telemetry.ts';
import {
  calculateOmnichannelLeakage,
  type PillarId,
  type OmnichannelLeakageReport,
} from '../../lib/calculator/omnichannel-leakage.ts';
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
  Smartphone,
  MessageSquare,
  PhoneMissed,
  MessageCircle,
  Calendar,
  CalendarCheck,
  Clock,
  Mail,
  Gift,
  Repeat,
  Zap,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Lock,
  User,
  Send,
} from 'lucide-react';

export type ReportTier = 'full' | 'lite';

export interface AuditDeckProps {
  audit?: Partial<LocalSeoAuditOutput> | null;
  scanSummary?: Partial<GridScanSummary> | null;
  discoveredKeywords?: DiscoveredKeyword[] | null;
  onRegenerateAudit?: () => void;
  isRegenerating?: boolean;
  tier?: ReportTier;
  onTierChange?: (tier: ReportTier) => void;
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
  tier: propTier,
  onTierChange,
}) => {
  const { branding } = useBranding();

  // Tier State (Full Growth Audit vs. Lite SERP Teaser)
  const [internalTier, setInternalTier] = useState<ReportTier>(() => {
    if (propTier) return propTier;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tier') || p.get('mode');
      if (t === 'lite') return 'lite';
    }
    return 'full';
  });

  useEffect(() => {
    if (propTier && propTier !== internalTier) {
      setInternalTier(propTier);
    }
  }, [propTier]);

  const handleTierChange = (newTier: ReportTier) => {
    setInternalTier(newTier);
    if (onTierChange) onTierChange(newTier);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tier', newTier);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  // Lead Gate Modal State for Lite Teaser
  const [showGateLeadModal, setShowGateLeadModal] = useState<boolean>(false);
  const [gateLeadForm, setGateLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [gateLeadSubmitted, setGateLeadSubmitted] = useState<boolean>(false);
  const [gateLeadSubmitting, setGateLeadSubmitting] = useState<boolean>(false);

  // Multi-Scenario State
  const [scenario, setScenario] = useState<'conservative' | 'expected' | 'leader'>('expected');
  const [avgTicketValue, setAvgTicketValue] = useState<number>(280);
  const [closeRate, setCloseRate] = useState<number>(25); // 25% calibrated default
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [showAuditTrail, setShowAuditTrail] = useState<boolean>(false);

  // Omnichannel Digital Leakage Operational State
  const [monthlySiteVisitors, setMonthlySiteVisitors] = useState<number>(180);
  const [pastCustomerListSize, setPastCustomerListSize] = useState<number>(450);
  const [reviewVelocityMonthly, setReviewVelocityMonthly] = useState<number>(1.5);

  // 5 Pillar Fix Toggles for Omnichannel Digital Infrastructure Audit
  const [websiteConversionFixed, setWebsiteConversionFixed] = useState<boolean>(false);
  const [speedToLeadFixed, setSpeedToLeadFixed] = useState<boolean>(false);
  const [onlineBookingFixed, setOnlineBookingFixed] = useState<boolean>(false);
  const [reputationFixed, setReputationFixed] = useState<boolean>(false);
  const [retentionFixed, setRetentionFixed] = useState<boolean>(false);

  // Accordion Toggle
  const [isRevenueBreakdownExpanded, setIsRevenueBreakdownExpanded] = useState<boolean>(false);

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
  const totalVolume = totalUntappedMonthlyVolume > 0 ? totalUntappedMonthlyVolume : 400;
  // Local click-to-call intent pool: in local service trades, ~1.5% of searchers translate to direct pack inquiries
  const totalPotentialCalls = Math.min(60, Math.max(12, Math.round(totalVolume * 0.015)));
  // Geographic deficit ratio (nodes outside Top 3)
  const dropoffRatio = totalNodes > 0 ? totalNodesInRedOrYellow / totalNodes : 0.75;
  const totalMissedTerritoryCalls = totalPotentialCalls * dropoffRatio;

  // 3. New High-Ticket Inquiries / Month under active scenario:
  const recoveredInquiries = Math.max(
    scenario === 'conservative' ? 4 : scenario === 'expected' ? 8 : 16,
    Math.min(
      scenario === 'conservative' ? 8 : scenario === 'expected' ? 16 : 28,
      Math.round(totalMissedTerritoryCalls * scenarioShare)
    )
  );

  // 4. Closed Deals = Inquiries * closeRate
  const closedDeals = Math.max(1, Math.round(recoveredInquiries * (closeRate / 100)));

  // 5. Monthly Revenue Leaking = (Closed Deals * Average Value)
  const monthlyRevenueLeaking = Math.round(closedDeals * avgTicketValue);

  // 6. Annual Revenue Left on the Table = Monthly Revenue Leaking * 12
  const annualRevenueLeaking = monthlyRevenueLeaking * 12;

  // Omnichannel Leakage & Recovery Model (Deterministic 5-Pillar Engine)
  const omnichannelAuditReport: OmnichannelLeakageReport = useMemo(() => {
    return calculateOmnichannelLeakage(
      {
        avgTicketValue,
        monthlyVisitors: monthlySiteVisitors,
        closeRate,
        websiteConversionFixed,
        speedToLeadFixed,
        onlineBookingFixed,
        reputationFixed,
        retentionFixed,
      },
      currencySymbol
    );
  }, [
    avgTicketValue,
    monthlySiteVisitors,
    closeRate,
    websiteConversionFixed,
    speedToLeadFixed,
    onlineBookingFixed,
    reputationFixed,
    retentionFixed,
    currencySymbol,
  ]);

  const handlePillarToggle = (pillarId: PillarId, currentVal: boolean) => {
    const newVal = !currentVal;
    if (pillarId === 'websiteConversion') setWebsiteConversionFixed(newVal);
    if (pillarId === 'speedToLead') setSpeedToLeadFixed(newVal);
    if (pillarId === 'onlineBooking') setOnlineBookingFixed(newVal);
    if (pillarId === 'reputation') setReputationFixed(newVal);
    if (pillarId === 'retention') setRetentionFixed(newVal);

    const pillar = omnichannelAuditReport.pillars[pillarId];
    trackLeakageToggled(
      safeSummary.scanId || 'latest',
      safeSummary.target.businessName || 'Local Business',
      pillarId,
      newVal,
      {
        pillarTitle: pillar?.title,
        monthlyLoss: pillar?.monthlyLoss,
        lostJobsMonthly: pillar?.lostJobsMonthly,
      }
    );
  };

  // Top 2 urgent bottlenecks for executive revenue teaser
  const topUrgentBottlenecks = useMemo(() => {
    const unfixed = omnichannelAuditReport.pillarList.filter((p) => !p.isFixed);
    const candidates = unfixed.length >= 2 ? unfixed : omnichannelAuditReport.pillarList;
    return [...candidates].sort((a, b) => b.monthlyLoss - a.monthlyLoss).slice(0, 2);
  }, [omnichannelAuditReport.pillarList]);

  // Handle accordion toggle with telemetry tracking
  const handleToggleRevenueBreakdown = () => {
    const nextState = !isRevenueBreakdownExpanded;
    setIsRevenueBreakdownExpanded(nextState);
    if (nextState) {
      trackLeakageExpanded(
        safeSummary.scanId || 'latest',
        safeSummary.target.businessName || 'Local Business',
        true,
        {
          totalMonthlyLoss: omnichannelAuditReport.totals.totalEstimatedMonthlyLoss,
          totalAnnualRecoverable: omnichannelAuditReport.totals.totalAnnualRecoverableOpportunity,
          topBottlenecks: topUrgentBottlenecks.map((b) => b.title),
        }
      );
    }
  };

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
      const kwMissedCalls = Math.max(1, Math.round(recoveredInquiries * kwWeight));
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

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGateLeadSubmitting(true);
    trackFullReportRequested(
      safeSummary.scanId || 'latest',
      safeSummary.target.businessName || 'Local Business',
      {
        ...gateLeadForm,
        submitted: true,
      }
    );
    setTimeout(() => {
      setGateLeadSubmitting(false);
      setGateLeadSubmitted(true);
    }, 350);
  };

  return (
    <div className="space-y-12 sm:space-y-16 py-10 px-4 sm:px-8 max-w-6xl mx-auto w-full overflow-x-hidden">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="print:hidden bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Executive Local SEO Audit &amp; Revenue Leak Report
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-sm text-slate-500">
              Prepared for <strong className="text-slate-800">{safeSummary.target.businessName}</strong>
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${activeMetrics.operationalBadge.pillClass}`}>
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
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isRegenerating ? 'Analyzing...' : 'Refresh Audit'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save White-Label PDF</span>
          </button>
        </div>
      </div>

      {/* Report Tier Switcher & Mode Indicator */}
      <div className="print:hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-2xl border border-indigo-900/40 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
              Report Experience Tier
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono font-medium">
              {internalTier === 'full' ? 'Unrestricted Agency Audit' : 'Client Prospecting Teaser'}
            </span>
          </div>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            {internalTier === 'full'
              ? 'Displaying all 5 omnichannel conversion pillars, operational diagnostic, and recovery roadmap.'
              : 'SERP & ranking metrics visible. 5-pillar omnichannel conversion audit locked behind lead gate.'}
          </p>
        </div>

        {/* Tier Selector Toggle */}
        <div className="flex items-center p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            data-testid="tier-toggle-lite"
            onClick={() => handleTierChange('lite')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              internalTier === 'lite'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🗺️ Lite Geo-Grid Teaser</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/20 text-slate-900 font-bold">
              Gated
            </span>
          </button>

          <button
            type="button"
            data-testid="tier-toggle-full"
            onClick={() => handleTierChange('full')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
              internalTier === 'full'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡ Full Growth Audit</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/20 text-slate-900 font-bold">
              Complete
            </span>
          </button>
        </div>
      </div>

      {/* Main Pitch Deck Container (Clean Light Theme for Screen & Print) */}
      <div className="bg-white print:p-6 p-6 sm:p-12 rounded-3xl border border-slate-200/80 shadow-xs space-y-12 sm:space-y-16 text-slate-800 w-full max-w-full overflow-x-hidden">
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
        <div className="border-2 border-emerald-200/90 rounded-2xl bg-white p-6 sm:p-10 shadow-sm space-y-8 print:break-inside-avoid">
          {/* Header & Scenario Switcher Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 text-emerald-700">
                <div className="flex items-center space-x-2.5">
                  <Calculator className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Revenue Potential &amp; Recovery Forecast
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Calibrated Model</span>
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                Simulate your projected business turnover recovered from local rivals by reclaiming Google 3-Pack positions.
              </p>
            </div>

            {/* Scenario Switcher Pill Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80 self-start lg:self-auto print:hidden">
              <span className="text-xs uppercase font-bold text-slate-500 px-2 hidden sm:inline">Scenario:</span>
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
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
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

          {/* Interactive Impact Sliders (Dual Controls Top Sub-Bar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
            {/* Slider 1: Average Value per Customer / Job */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Average Value per Customer / Job:</span>
                </span>
                <span className="font-mono font-bold text-base text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  {currencySymbol}{avgTicketValue.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="25"
                value={avgTicketValue}
                onChange={(e) => handleAvgTicketChange(parseInt(e.target.value) || 280)}
                data-testid="slider-avg-ticket"
                className="w-full accent-emerald-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg my-2"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>{currencySymbol}100 min</span>
                <span className="text-slate-500 font-medium">Average ticket size</span>
                <span>{currencySymbol}2,500 max</span>
              </div>
            </div>

            {/* Slider 2: Lead-to-Client Close Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>Lead-to-Client Close Rate:</span>
                </span>
                <span className="font-mono font-bold text-base text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                  {closeRate}%
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={closeRate}
                onChange={(e) => handleCloseRateChange(parseInt(e.target.value) || 25)}
                data-testid="slider-close-rate"
                className="w-full accent-blue-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg my-2"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>15% conservative</span>
                <span className="text-slate-500 font-medium">Inbound quote close rate</span>
                <span>60% aggressive</span>
              </div>
            </div>
          </div>

          {/* Methodology & Data Confidence Bar */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-sm space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                  <span>Measured Google Pack Ranks</span>
                </span>
                <span className="text-slate-400 text-sm hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Projected Revenue Impact</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMethodology(!showMethodology)}
                className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span>{showMethodology ? 'Hide Methodology' : 'View Calculation Methodology'}</span>
              </button>
            </div>
            {showMethodology && (
              <div className="pt-2.5 border-t border-slate-200 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  <strong className="font-semibold text-slate-800">Calculation Methodology:</strong> [Keyword Search Volume] × [Local 3-Pack Share of Voice (CTR)] × [Target Close Rate] × [Average Customer Ticket Value]. Assumptions can be customized using the sliders above.
                </p>
                <p className="text-xs text-slate-500">
                  • <em>Measured Google Pack Ranks:</em> Hard spatial coordinates queried directly across the geo-grid.
                  <br />
                  • <em>Projected Revenue Impact:</em> Calibrated commercial model based on local click-to-call conversion benchmarks.
                </p>
              </div>
            )}
          </div>

          {/* 3 Summary Result KPI Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Badge 1: Monthly Revenue Leaking */}
            <div className="bg-gradient-to-br from-rose-50 to-white p-6 sm:p-8 rounded-2xl border border-rose-200/90 shadow-2xs space-y-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-700 block flex items-center justify-between">
                <span>Monthly Revenue Leaking</span>
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </span>
              <div data-testid="kpi-monthly-leak" className="text-3xl sm:text-5xl font-black font-mono text-rose-700 tracking-tight">
                {currencySymbol}{monthlyRevenueLeaking.toLocaleString()} <span className="text-sm font-normal text-rose-600">/ mo</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {recoveredInquiries} inquiries × {closeRate}% close × {currencySymbol}{avgTicketValue}
              </p>
            </div>

            {/* Badge 2: Annual Revenue Left on the Table */}
            <div className="bg-gradient-to-br from-amber-50 to-white p-6 sm:p-8 rounded-2xl border border-amber-200/90 shadow-2xs space-y-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 block flex items-center justify-between">
                <span>Annual Revenue on the Table</span>
                <Flame className="w-5 h-5 text-amber-600" />
              </span>
              <div data-testid="kpi-annual-leak" className="text-3xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight">
                {currencySymbol}{annualRevenueLeaking.toLocaleString()} <span className="text-sm font-normal text-slate-500">/ yr</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                12 months cumulative market loss to rivals
              </p>
            </div>

            {/* Badge 3: New High-Ticket Inquiries / Month */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-6 sm:p-8 rounded-2xl shadow-xs space-y-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-100 block flex items-center justify-between">
                <span>Recoverable Inquiries / Month</span>
                <ArrowUpRight className="w-5 h-5 text-emerald-200" />
              </span>
              <div data-testid="kpi-recoverable-inquiries" className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
                +{recoveredInquiries} <span className="text-sm font-normal text-emerald-100">calls / mo</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-xs sm:text-sm text-slate-500 font-medium block">
              Average Grid Rank
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-rose-600 block tracking-tight">
              {activeMetrics.formattedRank}
            </span>
            <span className="text-xs text-slate-400">Across {totalNodes} coordinates</span>
          </div>

          <div className="bg-emerald-50/70 p-5 sm:p-6 rounded-2xl border border-emerald-200/70 shadow-2xs space-y-1">
            <span className="text-xs sm:text-sm text-emerald-800 font-medium block">
              3-Pack Presence
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-700 block tracking-tight">
              {activeMetrics.formattedTop3}
            </span>
            <span className="text-xs text-emerald-600">{top3Count} of {totalNodes} pins in top 3</span>
          </div>

          <div className="bg-rose-50/70 p-5 sm:p-6 rounded-2xl border border-rose-200/70 shadow-2xs space-y-1">
            <span className="text-xs sm:text-sm text-rose-800 font-medium block">
              Dropoff Red Zone
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-rose-700 block tracking-tight">
              {activeMetrics.redZonePercentage.toFixed(1)}%
            </span>
            <span className="text-xs text-rose-600">{redZoneCount} of {totalNodes} pins in red zone (rank 11+)</span>
          </div>

          <div className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-xs sm:text-sm text-slate-500 font-medium block">
              Projected Monthly Loss
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 block tracking-tight">
              {currencySymbol}{(monthlyRevenueLeaking / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">/ mo</span>
            </span>
            <span className="text-xs text-slate-400">
              {totalNodesInRedOrYellow} zones outside 3-pack
            </span>
          </div>
        </div>

        {/* Executive Summary & Spatial Centroid Diagnosis */}
        <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-200/70 space-y-3 shadow-2xs">
          <div className="flex items-center space-x-2.5 text-slate-900">
            <Compass className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider">
              Executive Visibility Summary &amp; Spatial Centroid Diagnosis
            </h3>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-700">
            {safeAudit.executiveSummary}
          </p>
        </div>

        {/* Dominant Competitors Stealing Territory */}
        <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-200/70 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-rose-500" />
              <span>Dominant Competitors Intercepting Calls in Your Radius</span>
            </h3>
            <span className="text-xs sm:text-sm text-slate-500 font-mono">
              Top 3-Pack Takeover Share
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {safeSummary.dominantCompetitors.slice(0, 3).map((comp, idx) => (
              <div
                key={comp.name || idx}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-mono font-bold text-slate-500">#{idx + 1} Rival</span>
                  <span className="font-mono font-bold text-amber-500 flex items-center">
                    ★ {comp.rating ?? 4.8} <span className="text-slate-400 font-normal ml-0.5">({comp.reviews ?? 100})</span>
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {comp.name}
                </div>
                <div className="text-xs sm:text-sm text-emerald-700 font-mono">
                  Captures {comp.top3SharePercent ?? 50}% of scanned territory
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discovered High-Volume Commercial Keywords & Search Demand */}
        <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-200/70 space-y-6 print:break-inside-avoid shadow-2xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
            <div>
              <div className="flex items-center space-x-2.5 text-slate-900">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider">
                  Discovered High-Volume Commercial Keywords &amp; Search Demand
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                High-intent local search terms in <strong className="text-slate-700">{targetCity}</strong> with commercial CPC value and Google 3-Pack capture potential.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg self-start sm:self-auto border border-emerald-200">
              {displayedKeywords.length} Search Queries Analyzed
            </span>
          </div>

          {/* Summary Metric Callouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Total Monthly Searches</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 block tracking-tight">
                {totalUntappedMonthlyVolume.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">local monthly query volume</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Est. Inbound Calls (Top 3)</span>
                <MousePointerClick className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 block tracking-tight">
                ~{estimatedInboundClicksMonthly.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-600">targeted monthly dispatch leads</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Average Local CPC</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 block tracking-tight">
                {averageCpcFormatted}
              </span>
              <span className="text-xs text-slate-400">Google Ads equivalent</span>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-5 rounded-2xl shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-100 mb-1">
                <span className="text-xs uppercase font-bold tracking-wider">Annual Traffic Value (Top 3)</span>
                <Flame className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white block tracking-tight">
                {currencySymbol}{(annualTrafficValue / 1000).toFixed(0)}k <span className="text-sm font-normal text-emerald-100">/ yr</span>
              </span>
              <span className="text-xs text-emerald-100">free organic ad spend value</span>
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

        {/* ========================================================================= */}
        {/* ⚡ SECTION: OMNICHANNEL REVENUE LEAKAGE AUDIT / LITE REPORT GATE          */}
        {/* ========================================================================= */}
        {internalTier === 'lite' ? (
          /* ========================================================================= */
          /* ⚡ LITE REPORT GATE: Complete Conversion & Revenue Leakage Audit Locked    */
          /* ========================================================================= */
          <div
            data-testid="lite-report-gate"
            className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 sm:p-10 rounded-2xl border border-indigo-900/50 shadow-xl text-white space-y-6 print:break-inside-avoid"
          >
            {/* Subtle background glow */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Premium Operational Diagnostic Gate</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ⚡ Complete Conversion &amp; Revenue Leakage Audit Locked
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  You are currently viewing the <strong className="text-white font-semibold">Lite SERP Teaser</strong> for <strong className="text-emerald-400 font-semibold">{safeSummary.target.businessName}</strong>. Spatial rankings show where your Google Maps pins fall, but operational infrastructure determines how many leads convert into paying revenue.
                </p>
              </div>

              <button
                type="button"
                data-testid="request-full-report-btn"
                onClick={() => {
                  trackFullReportRequested(
                    safeSummary.scanId || 'latest',
                    safeSummary.target.businessName || 'Local Business',
                    { action: 'unlock_gate_clicked' }
                  );
                  setShowGateLeadModal(true);
                }}
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition transform hover:-translate-y-0.5 cursor-pointer shrink-0 self-start md:self-auto"
              >
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>Request Full Revenue &amp; Operational Audit</span>
              </button>
            </div>

            {/* Locked Pillars Preview Grid */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pillar 01</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-bold text-white">Website &amp; Mobile Conversion Rate</span>
                <span className="text-[11px] text-slate-400 leading-tight">Page speed &amp; localized call-to-action leakage</span>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pillar 02</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-bold text-white">Instant Speed-to-Lead &amp; Missed Calls</span>
                <span className="text-[11px] text-slate-400 leading-tight">Automated SMS text-back &amp; after-hours deflection</span>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pillar 03</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-bold text-white">Direct Self-Service Booking</span>
                <span className="text-[11px] text-slate-400 leading-tight">Calendar dispatch friction &amp; deposit capture</span>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pillar 04</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-bold text-white">Review Velocity &amp; Reputation</span>
                <span className="text-[11px] text-slate-400 leading-tight">Google sentiment gap &amp; competitor acceleration</span>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-xs p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Pillar 05</span>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-bold text-white">Customer Retention &amp; Reactivation</span>
                <span className="text-[11px] text-slate-400 leading-tight">Dormant client database repurchase revenue</span>
              </div>
            </div>

            <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Includes the customized 4-Phase Revenue Recovery Roadmap &amp; financial ROI model.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Need immediate unrestricted access?</span>
                <button
                  type="button"
                  onClick={() => handleTierChange('full')}
                  className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2 cursor-pointer"
                >
                  Switch to Full Growth Audit View
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-testid="omnichannel-audit-deck-section"
            id="omnichannel-leakage-section"
            className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 print:break-inside-avoid"
          >
            {/* Header Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-200">
                    <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </span>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                    ⚡ Omnichannel Revenue Leakage &amp; Digital Infrastructure Audit
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Rankings generate visibility, but conversion infrastructure captures the revenue. Below is where qualified local customers are dropping out of your sales funnel.
                </p>
              </div>

            {/* Summary Metric Bar */}
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
              {/* Monthly Leakage Pill */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 text-right shadow-2xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold block">
                  Total Monthly Leaking
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-rose-700">
                  {currencySymbol}{omnichannelAuditReport.totals.totalEstimatedMonthlyLoss.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-rose-600">/ month</span>
                </span>
              </div>

              {/* Annual Recoverable Opportunity Pill */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-right shadow-2xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  12-Mo Recoverable Potential
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                  {currencySymbol}{omnichannelAuditReport.totals.totalAnnualRecoverableOpportunity.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-emerald-600">/ year</span>
                </span>
              </div>

              {/* Infrastructure Repaired Score */}
              <div className="hidden sm:flex flex-col justify-center bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-center shadow-2xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Health Score
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {omnichannelAuditReport.totals.repairedCount}/5 Repaired
                </span>
              </div>
            </div>
          </div>

          {/* Top Sub-Bar: Traffic Baseline Slider & Benchmark Recovery Pills */}
          <div className="bg-slate-50/80 p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Monthly Traffic Baseline &amp; Recovery Benchmarks:
                </span>
              </div>

              {/* Benchmark Pills: Conservative (80) / Expected (180) / Metro Lead (350) */}
              <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200/80 self-start sm:self-auto shadow-2xs">
                <span className="text-xs uppercase font-bold text-slate-400 px-2 hidden sm:inline">Benchmark:</span>
                {[
                  { label: 'Conservative (80)', visitors: 80 },
                  { label: 'Expected (180)', visitors: 180 },
                  { label: 'Metro Lead (350)', visitors: 350 },
                ].map((item) => {
                  const isActive = monthlySiteVisitors === item.visitors;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setMonthlySiteVisitors(item.visitors)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Site Visitors Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 flex items-center space-x-2">
                  <span>Estimated Monthly Web &amp; Maps Visitors:</span>
                </span>
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  {monthlySiteVisitors.toLocaleString()} visitors / month
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="600"
                step="10"
                value={monthlySiteVisitors}
                onChange={(e) => setMonthlySiteVisitors(parseInt(e.target.value) || 180)}
                data-testid="slider-site-visitors"
                className="w-full accent-amber-500 cursor-pointer h-2.5 bg-slate-200 rounded-lg my-2"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>30 visitors min</span>
                <span className="text-slate-500 font-medium">Local organic, maps, and direct traffic</span>
                <span>600 visitors max</span>
              </div>
            </div>
          </div>

          {/* Executive Revenue Teaser (Headline Figure + Top 2 Urgent Bottlenecks) */}
          <div data-testid="executive-revenue-teaser" className="space-y-4">
            {/* Headline Opportunity Bleed Banner */}
            <div className="bg-gradient-to-r from-rose-50/80 via-amber-50/40 to-slate-50/60 p-4 sm:p-5 rounded-2xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md inline-block">
                  Executive Diagnosis • Leaky Bucket Summary
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Estimated {currencySymbol}{omnichannelAuditReport.totals.totalEstimatedMonthlyLoss.toLocaleString()} / month dropping through conversion bottlenecks
                </h3>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  While search rankings drive local demand, conversion deficits prevent an estimated <strong className="text-slate-900 font-bold font-mono">~{omnichannelAuditReport.totals.totalLostJobsMonthly} qualified customer jobs</strong> every month from turning into booked revenue.
                </p>
              </div>

              <div className="bg-white/95 p-3.5 rounded-xl border border-rose-200 shadow-2xs text-right shrink-0">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                  Headline Lost Revenue
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-700">
                  -{currencySymbol}{omnichannelAuditReport.totals.totalEstimatedMonthlyLoss.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500"> / mo</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-700 block font-bold mt-0.5">
                  +{currencySymbol}{omnichannelAuditReport.totals.totalAnnualRecoverableOpportunity.toLocaleString()} / yr recoverable
                </span>
              </div>
            </div>

            {/* Top 2 Urgent Bottlenecks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                  Top 2 Urgent Bottlenecks Requiring Immediate Remediation:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Ranked by lost customer volume
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {topUrgentBottlenecks.map((b, idx) => (
                  <div
                    key={b.id}
                    data-testid={`top-bottleneck-${idx}`}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {b.id === 'websiteConversion' && <Globe className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {b.id === 'speedToLead' && <MessageSquare className="w-4 h-4 text-rose-600 shrink-0" />}
                          {b.id === 'onlineBooking' && <Calendar className="w-4 h-4 text-blue-600 shrink-0" />}
                          {b.id === 'reputation' && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                          {b.id === 'retention' && <Repeat className="w-4 h-4 text-purple-600 shrink-0" />}
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {b.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                          {b.statusBadge}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between bg-white p-2.5 rounded-lg border border-slate-200/80">
                        <span className="text-[11px] font-medium text-slate-500">Revenue Drain:</span>
                        <span className="text-sm font-black font-mono text-rose-700">
                          -{currencySymbol}{b.monthlyLoss.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-slate-400">/ mo (~{b.lostJobsMonthly} jobs)</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{b.bullets[0]}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 italic">Recommended Agency Remedy:</span>
                      <span className="font-semibold text-emerald-700">{b.shortTitle} Upgrade</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Accordion Gate Button */}
            <div className="pt-2 flex flex-col items-center">
              <button
                type="button"
                data-testid="expand-revenue-breakdown"
                onClick={handleToggleRevenueBreakdown}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer group"
              >
                <span>
                  {isRevenueBreakdownExpanded
                    ? '[ Hide Full 5-Pillar Breakdown ▲ ]'
                    : '[ View Full 5-Pillar Breakdown & Opportunity Analysis ▼ ]'}
                </span>
                <span className="text-[10px] font-mono text-amber-700 bg-white/90 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                  {isRevenueBreakdownExpanded ? 'Collapse' : '5 Pillars & Recovery Roadmap'}
                </span>
              </button>
              <span className="text-[11px] text-slate-400 mt-1 font-mono">
                {isRevenueBreakdownExpanded
                  ? 'All 5 omnichannel pillars, interactive switches, and recovery blueprint are shown below.'
                  : 'Click above to inspect detailed formulas, interactive repair toggles, and implementation roadmap.'}
              </span>
            </div>
          </div>

          {/* Collapsible Full Breakdown: 5-Pillar Interactive Grid & Recovery Roadmap */}
          <div
            data-testid="omnichannel-full-breakdown"
            className={
              isRevenueBreakdownExpanded
                ? 'space-y-6 pt-3 animate-in fade-in duration-200'
                : 'hidden print:block print:space-y-6 print:pt-3'
            }
          >
            {/* 5-Pillar Interactive Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {omnichannelAuditReport.pillarList.map((pillar) => {
              const isFixed = pillar.isFixed;
              const statusColor = isFixed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : pillar.statusType === 'critical'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : pillar.statusType === 'friction'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : pillar.statusType === 'bottleneck'
                ? 'bg-blue-50 text-blue-900 border-blue-300'
                : pillar.statusType === 'social_proof'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-purple-50 text-purple-900 border-purple-300';

              const cardBorderClass = isFixed
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-200/90 bg-white hover:border-slate-300';

              return (
                <div
                  key={pillar.id}
                  data-testid={`pillar-card-${pillar.id}`}
                  className={`p-5 rounded-2xl border ${cardBorderClass} shadow-xs flex flex-col justify-between space-y-4 transition group`}
                >
                  <div className="space-y-3">
                    {/* Pillar Card Header: Title, Status Badge & Nested Fix Toggle */}
                    <div className="space-y-2.5 border-b border-slate-100 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {pillar.id === 'websiteConversion' && <Globe className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {pillar.id === 'speedToLead' && <MessageSquare className="w-4 h-4 text-rose-600 shrink-0" />}
                          {pillar.id === 'onlineBooking' && <Calendar className="w-4 h-4 text-blue-600 shrink-0" />}
                          {pillar.id === 'reputation' && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                          {pillar.id === 'retention' && <Repeat className="w-4 h-4 text-purple-600 shrink-0" />}
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {pillar.title}
                          </h3>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${statusColor}`}
                        >
                          {pillar.statusBadge}
                        </span>
                      </div>

                      {/* Nested Interactive Fix Toggle in Card Header */}
                      <button
                        type="button"
                        onClick={() => handlePillarToggle(pillar.id, isFixed)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition cursor-pointer select-none text-xs ${
                          isFixed
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isFixed}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-emerald-600 cursor-pointer pointer-events-none"
                          />
                          <span>{pillar.toggleLabel}</span>
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isFixed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isFixed ? 'ACTIVE' : 'PLUG LEAK'}
                        </span>
                      </button>

                      {/* Embedded Pillar-Specific Slider if applicable */}
                      {pillar.id === 'retention' && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-medium">Customer Database:</span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {pastCustomerListSize.toLocaleString()} clients
                            </span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="5000"
                            step="100"
                            value={pastCustomerListSize}
                            onChange={(e) => setPastCustomerListSize(parseInt(e.target.value) || 1200)}
                            data-testid="slider-past-customers"
                            className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                          />
                        </div>
                      )}

                      {pillar.id === 'reputation' && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-medium">Review Velocity:</span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {reviewVelocityMonthly} reviews / mo
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={reviewVelocityMonthly}
                            onChange={(e) => setReviewVelocityMonthly(parseFloat(e.target.value) || 2)}
                            data-testid="slider-review-velocity"
                            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Financial Loss / Recovery Callout */}
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        {isFixed ? 'Projected Revenue Captured:' : 'Estimated Monthly Loss:'}
                      </span>
                      <div className="text-right">
                        <span
                          className={`text-base font-black font-mono ${
                            isFixed ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isFixed
                            ? `+${currencySymbol}${pillar.monthlyLoss.toLocaleString()}`
                            : `${currencySymbol}${pillar.monthlyLoss.toLocaleString()}`}
                          <span className="text-xs font-normal text-slate-500"> / mo</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {isFixed ? 'Leak plugged' : `~${pillar.lostJobsMonthly} jobs/mo loss`}
                        </span>
                      </div>
                    </div>

                    {/* Bottlenecks Bullet Points */}
                    <ul className="space-y-2 text-xs text-slate-600">
                      {pillar.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start space-x-2 leading-relaxed">
                          {isFixed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <span className={isFixed ? 'line-through text-slate-400' : 'text-slate-700'}>
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Industry Benchmark Note */}
                    <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-slate-600 italic">
                      <span className="font-semibold text-slate-700 not-italic">Benchmark: </span>
                      {pillar.industryBenchmark}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The Local Revenue Recovery Roadmap */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                  Implementation Action Blueprint
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  The Local Revenue Recovery Roadmap
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  A structured 4-step agency roadmap engineered to plug conversion leaks and maximize returns on local search traffic.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800 self-start sm:self-auto shrink-0">
                4-Phase Execution
              </span>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {omnichannelAuditReport.roadmap.map((step) => (
                <div
                  key={step.stepNumber}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between space-y-3 transition group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                        {step.phase}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition leading-snug">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.deliverable}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
                    Target: <span className="text-emerald-400">{step.targetPillars}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recovery Roadmap CTA Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300 text-center sm:text-left">
                <span className="font-bold text-white">Projected Annual Recovery: </span>
                <span className="text-emerald-400 font-bold font-mono">
                  +{currencySymbol}{omnichannelAuditReport.totals.totalAnnualRecoverableOpportunity.toLocaleString()} / yr
                </span>
                <span className="text-slate-400 ml-2">across 5 core digital channels</span>
              </div>

              <a
                href={
                  branding.phone
                    ? `tel:${branding.phone.replace(/[^0-9+]/g, '')}`
                    : `mailto:${branding.contactEmail}?subject=Claim Revenue Recovery Plan for ${encodeURIComponent(
                        safeSummary.target.businessName || 'our business'
                      )}`
                }
                onClick={() => {
                  trackCtaClicked(
                    safeSummary.scanId || 'latest',
                    safeSummary.target.businessName || 'Local Business',
                    'recovery_plan_call'
                  );
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md hover:shadow-emerald-500/30 transition cursor-pointer shrink-0"
              >
                <Phone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Claim Your Revenue Recovery Plan &amp; Book Strategy Call</span>
              </a>
            </div>
          </div>
        </div>
      </div>
        )}

        {/* 2. SECTION: The 3 Priority Fixes to Reclaim Your Area (Customer-Friendly Remedies) */}
        <div className="space-y-6 print:break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center space-x-2.5 text-slate-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  The 3 Priority Fixes to Reclaim Your Area
                </h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                Targeted, benefit-driven remedies engineered to expand your Google Maps reach and capture lost customer calls.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
              3-Step Action Plan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fix 1 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-5 hover:border-emerald-300 transition group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                    Fix 01 • On-Page &amp; Services
                  </span>
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                  Match Your Website &amp; Service Pages to Exact Customer Searches
                </h4>
                <div className="space-y-2.5 text-sm text-slate-600">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-rose-700 text-xs uppercase tracking-wide block mb-1">The Problem</span>
                    <p className="leading-relaxed">
                      Google doesn&apos;t see specific landing pages on your website confirming you offer all key services across neighboring areas.
                    </p>
                  </div>
                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/70">
                    <span className="font-bold text-emerald-800 text-xs uppercase tracking-wide block mb-1">The Fix</span>
                    <p className="leading-relaxed text-slate-700">
                      We publish dedicated, high-converting service and neighborhood pages optimized for Google Maps matching.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-full justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Expected Impact: +30% Geographic Expansion</span>
                </span>
              </div>
            </div>

            {/* Fix 2 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-5 hover:border-amber-300 transition group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                    Fix 02 • Authority &amp; Reviews
                  </span>
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-800 transition leading-snug">
                  Review Acceleration &amp; Service Keyword Mentions
                </h4>
                <div className="space-y-2.5 text-sm text-slate-600">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-rose-700 text-xs uppercase tracking-wide block mb-1">The Problem</span>
                    <p className="leading-relaxed">
                      {topCompetitor1} has {Math.max(40, comp1Reviews - 80)} more reviews, and Google rewards profiles whose customer reviews mention specific services and towns.
                    </p>
                  </div>
                  <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70">
                    <span className="font-bold text-amber-800 text-xs uppercase tracking-wide block mb-1">The Fix</span>
                    <p className="leading-relaxed text-slate-700">
                      We set up an automated review flow prompting satisfied customers to mention the exact service and area, building authority fast.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 w-full justify-center">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Expected Impact: Closes Review Gap in 30–60 Days</span>
                </span>
              </div>
            </div>

            {/* Fix 3 */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-5 hover:border-blue-300 transition group">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
                    Fix 03 • Location Trust
                  </span>
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-800 transition leading-snug">
                  Fix Directory &amp; Map Consistency (NAP Alignment)
                </h4>
                <div className="space-y-2.5 text-sm text-slate-600">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="font-bold text-rose-700 text-xs uppercase tracking-wide block mb-1">The Problem</span>
                    <p className="leading-relaxed">
                      Conflicting phone numbers or missing listings on Apple Maps, Bing, and local directories weaken Google&apos;s trust in your location.
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/70">
                    <span className="font-bold text-blue-800 text-xs uppercase tracking-wide block mb-1">The Fix</span>
                    <p className="leading-relaxed text-slate-700">
                      We lock in 100% verified consistency across all major mapping networks and local directories.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 w-full justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
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

      {/* Lite Report Lead Gate Modal */}
      {showGateLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                    Unlock Full Revenue &amp; Operational Audit
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Comprehensive 5-Pillar Conversion Breakdown &amp; Recovery Plan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGateLeadModal(false);
                  setGateLeadSubmitted(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {gateLeadSubmitted ? (
                <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-black text-white">Full Audit Request Confirmed!</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      Thank you! Our local growth team has received your request for <strong className="text-white">{safeSummary.target.businessName}</strong>. We are compiling your customized 5-pillar omnichannel conversion analysis.
                    </p>
                  </div>
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      data-testid="preview-unlocked-audit-btn"
                      onClick={() => {
                        handleTierChange('full');
                        setShowGateLeadModal(false);
                        setGateLeadSubmitted(false);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preview Unlocked Audit Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGateLeadModal(false);
                        setGateLeadSubmitted(false);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGateSubmit} className="space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Provide your contact info below to receive the complete 5-pillar operational revenue leakage audit, missed-call SMS modeling, and 4-phase recovery roadmap for <strong className="text-emerald-400 font-semibold">{safeSummary.target.businessName}</strong>.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your Full Name:
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          data-testid="gate-lead-name"
                          placeholder="e.g. David Vance"
                          value={gateLeadForm.name}
                          onChange={(e) => setGateLeadForm({ ...gateLeadForm, name: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Work / Contact Email:
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          data-testid="gate-lead-email"
                          placeholder="name@business.com"
                          value={gateLeadForm.email}
                          onChange={(e) => setGateLeadForm({ ...gateLeadForm, email: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number (for SMS Audit Delivery):
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          type="tel"
                          data-testid="gate-lead-phone"
                          placeholder="(555) 000-0000"
                          value={gateLeadForm.phone}
                          onChange={(e) => setGateLeadForm({ ...gateLeadForm, phone: e.target.value })}
                          className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Primary Bottleneck or Notes (Optional):
                      </label>
                      <textarea
                        rows={2}
                        data-testid="gate-lead-notes"
                        placeholder="e.g. Website speed is slow, losing missed calls on weekends..."
                        value={gateLeadForm.notes}
                        onChange={(e) => setGateLeadForm({ ...gateLeadForm, notes: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowGateLeadModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={gateLeadSubmitting}
                      data-testid="gate-lead-submit-btn"
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{gateLeadSubmitting ? 'Submitting...' : 'Send Full Audit Request 🚀'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
