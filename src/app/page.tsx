/**
 * GeoRank Pro / ProfitMaps AI - Main Application Workspace
 * Path: /src/app/page.tsx
 *
 * Implements the complete ProfitMaps AI SaaS application design:
 * - Clean off-white background (`bg-[#f8fafc]`)
 * - Left persistent navigation sidebar (`AppSidebar`) with full state machine
 * - Top agency breadcrumbs & notification header (`AppHeader`)
 * - Dedicated functional views: Dashboard, Businesses directory, Scans log,
 *   Find businesses prospecting tool, Pitch Pack studio, Site builder,
 *   Leads CRM, Training academy, Integrations, Settings, Clients, Plans, Billing.
 * - Business workspace with sub-tabs: Keywords (GeoGrid map), Scan history,
 *   Prospecting Studio, Site plan, Page articles, GBP posts, Leads.
 * - Light-themed AuditDeck with white/emerald cards and print support.
 */

import React, { useState, useEffect } from 'react';
import { AppSidebar, type MainNavView } from '../components/layout/AppSidebar.tsx';
import { AppHeader } from '../components/layout/AppHeader.tsx';
import { BusinessHeader, type BusinessSubTab } from '../components/business/BusinessHeader.tsx';
import { ProfitMapsView, type KeywordChip } from '../components/map/ProfitMapsView.tsx';
import { AuditDeck } from '../components/reports/AuditDeck.tsx';
import { PitchPackView } from '../components/outreach/PitchPackView.tsx';
import { NewScanModal } from '../components/modals/NewScanModal.tsx';
import { ActionPlanModal } from '../components/modals/ActionPlanModal.tsx';
import { ShareReportModal } from '../components/reports/ShareReportModal.tsx';
import { BrandingModal } from '../components/branding/BrandingModal.tsx';
import { useBranding } from '../lib/context/BrandingContext.tsx';

// Dedicated Views
import { DashboardOverview } from '../components/views/DashboardOverview.tsx';
import { BusinessesListView, type BusinessCardItem } from '../components/views/BusinessesListView.tsx';
import { FindBusinessesView } from '../components/views/FindBusinessesView.tsx';
import { ScansListView, type ScanMasterRecord } from '../components/views/ScansListView.tsx';
import { SiteBuilderView } from '../components/views/SiteBuilderView.tsx';
import { LeadsView } from '../components/views/LeadsView.tsx';
import { TrainingView } from '../components/views/TrainingView.tsx';
import { IntegrationsView } from '../components/views/IntegrationsView.tsx';
import { SettingsView } from '../components/views/SettingsView.tsx';
import { ClientsView } from '../components/views/ClientsView.tsx';
import { PlansView } from '../components/views/PlansView.tsx';
import { BillingView } from '../components/views/BillingView.tsx';
import { GbpPostsView } from '../components/views/GbpPostsView.tsx';
import { PageArticlesView } from '../components/views/PageArticlesView.tsx';
import { RankFixesTodoList } from '../components/dashboard/RankFixesTodoList.tsx';
import { SitePlanView } from '../components/builder/SitePlanView.tsx';
import { BusinessSetupWizard, type OnboardingBusinessData } from '../components/onboarding/BusinessSetupWizard.tsx';
import { ClaimSiteView } from '../components/outreach/ClaimSiteView.tsx';
import { VisibilityScorecard } from '../components/dashboard/VisibilityScorecard.tsx';

import {
  generateGeoGrid,
  type DistanceUnit,
} from '../lib/geo/grid-generator.ts';
import {
  scanGridNode,
  summarizeGridScan,
  type GridScanSummary,
  type NodeScanOutput,
  type SerpScanMode,
} from '../lib/serp/adapter.ts';
import {
  generateDeterministicAudit,
  type LocalSeoAuditOutput,
  type LocalSeoAuditInput,
} from '../lib/ai/audit-generator.ts';
import {
  buildKeywordGridScan,
  buildInitialKeywordScanCache,
  type KeywordScanEntry,
} from '../lib/geo/keyword-scans.ts';
import { type ResolvedLocation } from '../components/search/BusinessSearchInput.tsx';
import {
  RotateCw,
  AlertCircle,
  X,
} from 'lucide-react';

// Pre-computed initial keyword scan cache for Austin Premier Plumbing
const INITIAL_KEYWORD_CACHE = buildInitialKeywordScanCache({
  businessName: 'Austin Premier Plumbing',
  center: { lat: 30.2672, lng: -97.7431 },
  gridSize: 5,
  distanceStep: 1.0,
  unit: 'km',
});

export default function DashboardPage() {
  const { branding } = useBranding();

  // Unified Navigation State Machine
  const [activeNav, setActiveNav] = useState<MainNavView>('businesses');
  const [businessWorkspaceOpen, setBusinessWorkspaceOpen] = useState<boolean>(true);
  const [businessTab, setBusinessTab] = useState<BusinessSubTab>('keywords');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Multi-Keyword State & Cache
  const [selectedKeyword, setSelectedKeyword] = useState<string>('Emergency Plumber');
  const [keywordCache, setKeywordCache] = useState<Record<string, KeywordScanEntry>>(INITIAL_KEYWORD_CACHE);

  // Active Business Profile & Scan Config State
  const [activeBusinessId, setActiveBusinessId] = useState<string>('b1');
  const [businessName, setBusinessName] = useState<string>('Austin Premier Plumbing');
  const [businessAddress, setBusinessAddress] = useState<string>('1024 Congress Ave, Austin, TX 78701');
  const [targetPlaceId, setTargetPlaceId] = useState<string | undefined>('preset_austin_plumbing');
  const [targetDomain, setTargetDomain] = useState<string | undefined>('austinpremierplumbing.com');
  const [targetCid, setTargetCid] = useState<string | undefined>(undefined);
  const [targetWebsite, setTargetWebsite] = useState<string | undefined>('https://austinpremierplumbing.com');
  const [category, setCategory] = useState<string>('Emergency Plumber');
  const [keyword, setKeyword] = useState<string>('Emergency Plumber');
  const [centerLat, setCenterLat] = useState<number>(30.2672);
  const [centerLng, setCenterLng] = useState<number>(-97.7431);
  const [gridSize, setGridSize] = useState<number>(5); // 3x3, 5x5, 7x7
  const [distanceStep, setDistanceStep] = useState<number>(1.0);
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [scanMode, setScanMode] = useState<SerpScanMode>('mock');
  const [credits, setCredits] = useState<number>(53);

  // Live DataForSEO credentials detection
  const [hasDataForSeoCreds, setHasDataForSeoCreds] = useState<boolean>(false);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  // Scan Execution State - seeded from initial keyword cache entry
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [scanStepText, setScanStepText] = useState<string>('Ready');
  const [scanSummary, setScanSummary] = useState<GridScanSummary | null>(() => {
    return INITIAL_KEYWORD_CACHE['Emergency Plumber']?.summary || null;
  });
  const [selectedNode, setSelectedNode] = useState<NodeScanOutput | null>(() => {
    const entry = INITIAL_KEYWORD_CACHE['Emergency Plumber'];
    if (!entry) return null;
    return entry.summary.nodes.find((n) => n.isCenter) || entry.summary.nodes[0] || null;
  });
  const [scanHistory, setScanHistory] = useState<ScanMasterRecord[]>(() => {
    const entry = INITIAL_KEYWORD_CACHE['Emergency Plumber'];
    if (!entry) return [];
    return [
      {
        id: entry.summary.scanId,
        businessName: 'Austin Premier Plumbing',
        category: 'Emergency Plumber',
        bestKeyword: 'Emergency Plumber',
        keywordCount: 3,
        top3Percentage: entry.summary.top3Percentage,
        lastScanDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary: entry.summary,
      },
    ];
  });

  // Modals state
  const [isNewScanOpen, setIsNewScanOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareScanId, setShareScanId] = useState<string>('');
  const [brandingModalOpen, setBrandingModalOpen] = useState<boolean>(false);

  // AI Audit State - initialized from keyword cache entry
  const [auditOutput, setAuditOutput] = useState<LocalSeoAuditOutput>(() => {
    return (
      INITIAL_KEYWORD_CACHE['Emergency Plumber']?.audit ||
      generateDeterministicAudit({
        businessName: 'Austin Premier Plumbing',
        category: 'Emergency Plumber',
        metrics: {
          averageRank: 7.1,
          top3Percentage: 16.0,
          totalNodesScanned: 25,
          gridSpanDescription: '5x5 grid across 5.0 km radius',
          targetMarket: 'Austin, TX',
        },
        topCompetitorsInWeakZones: [
          { name: 'Apex Premier Solutions', rating: 4.9, reviews: 342, top3SharePercent: 64 },
          { name: 'Capital City Express Masters', rating: 4.8, reviews: 215, top3SharePercent: 48 },
        ],
      })
    );
  });
  const [isGeneratingAudit, setIsGeneratingAudit] = useState<boolean>(false);

  // Derived keywords list for the pills bar
  const keywordsList: KeywordChip[] = Object.values(keywordCache).map((entry, idx) => ({
    id: `kw-${idx}-${entry.keyword.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    keyword: entry.keyword,
    top3Percentage: entry.summary.top3Percentage,
    averageRank: entry.summary.averageRank,
  }));

  // Switch active keyword on the GeoGrid map & prospecting studio
  const handleSelectKeyword = (kw: string) => {
    setSelectedKeyword(kw);
    setKeyword(kw);
    setCategory(kw);

    let entry = keywordCache[kw];
    if (!entry) {
      entry = buildKeywordGridScan({
        businessName,
        keyword: kw,
        center: { lat: centerLat, lng: centerLng },
        gridSize,
        distanceStep,
        unit,
        mode: scanMode,
      });
      setKeywordCache((prev) => ({ ...prev, [kw]: entry }));
    }

    setScanSummary(entry.summary);
    setSelectedNode(
      entry.summary.nodes.find((n) => n.isCenter) || entry.summary.nodes[0] || null
    );
    setAuditOutput(entry.audit);
  };

  // Add new keyword dynamically to the pills bar & run grid scan
  const handleAddKeyword = (newKeyword: string) => {
    if (!newKeyword.trim()) return;
    const trimmed = newKeyword.trim();

    // Deduct credits for scan
    const scanCost = gridSize * gridSize;
    setCredits((prev) => Math.max(0, prev - scanCost));

    const newEntry = buildKeywordGridScan({
      businessName,
      keyword: trimmed,
      center: { lat: centerLat, lng: centerLng },
      gridSize,
      distanceStep,
      unit,
      mode: scanMode,
    });

    setKeywordCache((prev) => ({
      ...prev,
      [trimmed]: newEntry,
    }));
    setSelectedKeyword(trimmed);
    setKeyword(trimmed);
    setCategory(trimmed);
    setScanSummary(newEntry.summary);
    setSelectedNode(
      newEntry.summary.nodes.find((n) => n.isCenter) || newEntry.summary.nodes[0] || null
    );
    setAuditOutput(newEntry.audit);

    // Append to scan history
    const historyRecord: ScanMasterRecord = {
      id: newEntry.summary.scanId,
      businessName,
      category: trimmed,
      bestKeyword: trimmed,
      keywordCount: Object.keys(keywordCache).length + 1,
      top3Percentage: newEntry.summary.top3Percentage,
      lastScanDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      summary: newEntry.summary,
    };
    setScanHistory((prev) => [historyRecord, ...prev.slice(0, 9)]);
  };

  // Delete keyword dynamically from cache & update active keyword if needed
  const handleDeleteKeyword = (targetKeyword: string) => {
    const keys = Object.keys(keywordCache);
    if (keys.length <= 1) {
      alert('At least one keyword is required to maintain rank tracking.');
      return;
    }

    const targetKey = keys.find((k) => k.toLowerCase() === targetKeyword.toLowerCase()) || targetKeyword;
    const newCache = { ...keywordCache };
    delete newCache[targetKey];
    setKeywordCache(newCache);

    // If the deleted keyword was currently selected, automatically set the active keyword
    // to the first remaining keyword in the list and reload its cached grid/metrics
    if (selectedKeyword.toLowerCase() === targetKeyword.toLowerCase()) {
      const remainingKeys = Object.keys(newCache);
      const nextKw = remainingKeys[0];
      const nextEntry = newCache[nextKw];

      setSelectedKeyword(nextKw);
      setKeyword(nextKw);
      setCategory(nextKw);
      setScanSummary(nextEntry.summary);
      setSelectedNode(
        nextEntry.summary.nodes.find((n) => n.isCenter) || nextEntry.summary.nodes[0] || null
      );
      setAuditOutput(nextEntry.audit);
    }
  };

  // Check DataForSEO status on mount
  useEffect(() => {
    fetch('/api/serp/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.hasCredentials) {
          setHasDataForSeoCreds(true);
        }
      })
      .catch(() => {});
  }, []);

  // Restore active business & scans from persistence across page refreshes
  useEffect(() => {
    let isMounted = true;
    const savedBizId =
      typeof window !== 'undefined' ? localStorage.getItem('georank_active_biz_id') : null;

    fetch('/api/businesses')
      .then((r) => r.json())
      .then((data) => {
        if (
          !isMounted ||
          !data.success ||
          !Array.isArray(data.businesses) ||
          data.businesses.length === 0
        )
          return;

        const targetBiz = savedBizId
          ? data.businesses.find((b: any) => b.id === savedBizId) || data.businesses[0]
          : data.businesses[0];

        if (targetBiz) {
          setActiveBusinessId(targetBiz.id);
          setBusinessName(targetBiz.name);
          setBusinessAddress(targetBiz.address);
          setCategory(targetBiz.category);
          setKeyword(targetBiz.keyword || targetBiz.category);
          setSelectedKeyword(targetBiz.keyword || targetBiz.category);
          setCenterLat(targetBiz.lat);
          setCenterLng(targetBiz.lng);
          if (targetBiz.placeId) setTargetPlaceId(targetBiz.placeId);
          if (targetBiz.website) {
            setTargetDomain(targetBiz.website);
            setTargetWebsite(targetBiz.website);
          }

          // Check if there is an existing persisted scan for this business
          fetch(`/api/scans?businessId=${encodeURIComponent(targetBiz.id)}`)
            .then((r) => r.json())
            .then((scanData) => {
              if (isMounted && scanData.success && scanData.scan?.scanSummary) {
                const s = scanData.scan;
                setScanSummary(s.scanSummary);
                setSelectedNode(
                  s.scanSummary.nodes.find((n: any) => n.isCenter) || s.scanSummary.nodes[0] || null
                );
                if (s.audit) {
                  setAuditOutput(s.audit);
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Could not restore persisted business:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleScanMode = (newMode: SerpScanMode) => {
    setScanMode(newMode);
    if (newMode === 'live' && !hasDataForSeoCreds) {
      setLiveNotice(
        'DataForSEO credentials missing in .env — defaulting to High-Fidelity Mock Mode'
      );
      setTimeout(() => setLiveNotice(null), 7000);
    } else {
      setLiveNotice(null);
    }
  };

  // Handle global business & geocode search resolution (from AppHeader or search inputs)
  const handleLocationResolved = (loc: ResolvedLocation) => {
    setBusinessName(loc.businessName);
    setKeyword(loc.keyword);
    setSelectedKeyword(loc.keyword);
    setCategory(loc.keyword);
    setCenterLat(loc.lat);
    setCenterLng(loc.lng);
    setBusinessAddress(loc.displayName || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
    setTargetPlaceId(loc.placeId);
    setTargetDomain(loc.domainOrUrl || loc.website);
    setTargetCid(loc.cid);
    setTargetWebsite(loc.website || loc.domainOrUrl);

    // Switch to business workspace keywords tab
    setActiveNav('businesses');
    setBusinessWorkspaceOpen(true);
    setBusinessTab('keywords');

    // Automatically rebuild keyword cache for the resolved business and coordinates
    const freshCache = buildInitialKeywordScanCache({
      businessName: loc.businessName,
      center: { lat: loc.lat, lng: loc.lng },
      gridSize: 5,
      distanceStep: 1.0,
      unit: 'km',
      mode: scanMode,
    });

    if (!freshCache[loc.keyword]) {
      freshCache[loc.keyword] = buildKeywordGridScan({
        businessName: loc.businessName,
        keyword: loc.keyword,
        center: { lat: loc.lat, lng: loc.lng },
        gridSize: 5,
        distanceStep: 1.0,
        unit: 'km',
        mode: scanMode,
      });
    }

    const activeEntry = freshCache[loc.keyword];
    setKeywordCache(freshCache);
    setScanSummary(activeEntry.summary);
    setSelectedNode(
      activeEntry.summary.nodes.find((n) => n.isCenter) || activeEntry.summary.nodes[0] || null
    );
    setAuditOutput(activeEntry.audit);

    // Automatically execute 5x5 grid scan centered on the resolved coordinates
    executeScan({
      businessName: loc.businessName,
      keyword: loc.keyword,
      lat: loc.lat,
      lng: loc.lng,
      gridSize: 5,
      distanceStep: 1.0,
      unit: 'km',
      scanMode,
      placeId: loc.placeId,
      domainOrUrl: loc.domainOrUrl || loc.website,
      cid: loc.cid,
      website: loc.website || loc.domainOrUrl,
    });
  };

  const handleOpenClientReport = async (businessId?: string, overrideScanId?: string) => {
    const activeScanId = overrideScanId || scanSummary?.scanId;
    console.log('Client Report clicked! Current active business:', businessName, 'Active scan ID:', activeScanId);

    // Persist current scan to server so client report receives fresh data immediately
    if (scanSummary && auditOutput) {
      try {
        await fetch('/api/scans/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanId: scanSummary.scanId,
            businessId: businessId || activeBusinessId,
            scanSummary,
            audit: auditOutput,
            businessName,
            keyword,
            center: { lat: centerLat, lng: centerLng },
            gridSize,
            distanceStep,
            unit,
          }),
        });
      } catch (err) {
        console.warn('Silent report save error:', err);
      }
    }

    const targetId =
      activeScanId ||
      (businessId
        ? `business-${businessId}`
        : activeBusinessId
        ? `business-${activeBusinessId}`
        : businessName
        ? `business-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        : 'latest');

    window.open(`/reports/${targetId}`, '_blank');
  };

  const handleOpenShareReport = async () => {
    if (!scanSummary) {
      handleOpenClientReport();
      return;
    }
    try {
      const resp = await fetch('/api/scans/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: scanSummary.scanId,
          businessId: activeBusinessId,
          scanSummary,
          audit: auditOutput,
          businessName,
          keyword,
          center: { lat: centerLat, lng: centerLng },
          gridSize,
          distanceStep,
          unit,
        }),
      });

      const json = await resp.json();
      if (json.success) {
        setShareScanId(json.scanId);
        setShareUrl(json.shareUrl);
        setShareModalOpen(true);
      }
    } catch (err) {
      console.error('Failed saving scan for share link:', err);
      setShareScanId(scanSummary.scanId);
      setShareUrl(`${window.location.origin}/reports/${scanSummary.scanId}`);
      setShareModalOpen(true);
    }
  };

  const executeScan = async (overrideParams?: {
    businessName: string;
    keyword: string;
    lat: number;
    lng: number;
    gridSize: number;
    distanceStep: number;
    unit: DistanceUnit;
    scanMode: SerpScanMode;
    placeId?: string;
    domainOrUrl?: string;
    cid?: string;
    website?: string;
  }) => {
    const curBusinessName = overrideParams?.businessName ?? businessName;
    const curKeyword = overrideParams?.keyword ?? keyword;
    const curLat = overrideParams?.lat ?? centerLat;
    const curLng = overrideParams?.lng ?? centerLng;
    const curGridSize = overrideParams?.gridSize ?? gridSize;
    const curDistanceStep = overrideParams?.distanceStep ?? distanceStep;
    const curUnit = overrideParams?.unit ?? unit;
    const curScanMode = overrideParams?.scanMode ?? scanMode;
    const curPlaceId = overrideParams?.placeId ?? targetPlaceId;
    const curDomain = overrideParams?.domainOrUrl ?? targetDomain ?? targetWebsite;
    const curCid = overrideParams?.cid ?? targetCid;
    const curWebsite = overrideParams?.website ?? targetWebsite ?? curDomain;

    if (overrideParams) {
      setBusinessName(curBusinessName);
      setKeyword(curKeyword);
      setCategory(curKeyword);
      setCenterLat(curLat);
      setCenterLng(curLng);
      setGridSize(curGridSize);
      setDistanceStep(curDistanceStep);
      setUnit(curUnit);
      setScanMode(curScanMode);
      if (curPlaceId) setTargetPlaceId(curPlaceId);
      if (curDomain) setTargetDomain(curDomain);
      if (curCid) setTargetCid(curCid);
      if (curWebsite) setTargetWebsite(curWebsite);
    }

    setIsScanning(true);
    setScanProgress(15);

    // LIVE SERP MODE: Delegate directly to backend API with DataForSEO credentials
    if (curScanMode === 'live') {
      try {
        setScanStepText('Dispatching live DataForSEO Google Maps query to server API...');
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: activeBusinessId,
            businessName: curBusinessName,
            placeId: curPlaceId,
            domainOrUrl: curDomain,
            cid: curCid,
            website: curWebsite,
            keyword: curKeyword,
            lat: curLat,
            lng: curLng,
            gridSize: curGridSize || 5,
            spacingKm: curDistanceStep || 1.0,
            distanceStep: curDistanceStep || 1.0,
            unit: curUnit || 'km',
            mode: 'live',
          }),
        });

        if (!response.ok) {
          throw new Error(`Live scan API returned HTTP ${response.status}`);
        }

        const resJson = await response.json();
        if (!resJson.success || !resJson.data) {
          throw new Error(resJson.error || 'Live scan failed');
        }

        setScanProgress(80);
        setScanStepText('Processing live SERP rankings and competitor metrics...');

        const summary: GridScanSummary = resJson.data;
        setScanSummary(summary);
        setSelectedNode(summary.nodes.find((n) => n.isCenter) || summary.nodes[0] || null);

        // Deduct credits
        const totalPoints = (curGridSize || 5) * (curGridSize || 5);
        setCredits((prev) => Math.max(0, prev - totalPoints));

        // Append to history
        const historyRecord: ScanMasterRecord = {
          id: summary.scanId,
          businessName: curBusinessName,
          category: curKeyword,
          bestKeyword: curKeyword,
          keywordCount: 1,
          top3Percentage: summary.top3Percentage,
          lastScanDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          summary,
        };
        setScanHistory((prev) => [historyRecord, ...prev.slice(0, 9)]);

        // Store in keyword cache and select as active keyword
        const updatedEntry: KeywordScanEntry = {
          keyword: curKeyword,
          summary,
          audit: auditOutput,
          lastScannedAt: new Date().toISOString(),
        };
        setKeywordCache((prev) => ({
          ...prev,
          [curKeyword]: updatedEntry,
        }));
        setSelectedKeyword(curKeyword);

        // Run AI audit
        runAudit(summary);

        // Persist live scan to server
        fetch('/api/scans/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanId: summary.scanId,
            businessId: activeBusinessId,
            scanSummary: summary,
            audit: auditOutput,
            businessName: curBusinessName,
            keyword: curKeyword,
            center: { lat: curLat, lng: curLng },
            gridSize: curGridSize || 5,
            distanceStep: curDistanceStep || 1.0,
            unit: curUnit || 'km',
          }),
        }).catch(() => {});

        setScanProgress(100);
        setScanStepText('Scan complete');
        setIsScanning(false);
        return;
      } catch (err: any) {
        console.error('Live DataForSEO scan failed:', err);
        setIsScanning(false);
        setScanProgress(0);
        setScanStepText('');
        const errorMsg = err?.message || 'Live SERP query failed';
        setLiveNotice(`Live SERP API Failed: ${errorMsg}. Credits were not charged.`);
        alert(`Live SERP API Failed:\n${errorMsg}\n\nCredits were not charged.`);
        return; // FAIL LOUDLY: Never silently fallback to mock simulation!
      }
    }

    setScanStepText('Calculating WGS-84 geodesic coordinate matrix...');

    const center = { lat: curLat, lng: curLng };
    const target = {
      businessName: curBusinessName,
      placeId: curPlaceId,
      domainOrUrl: curDomain,
      cid: curCid,
      website: curWebsite,
    };

    try {
      // 1. Generate grid
      const grid = generateGeoGrid({
        center,
        gridSize: curGridSize,
        distanceStep: curDistanceStep,
        unit: curUnit,
      });

      setScanProgress(30);
      setScanStepText(`Scanning ${grid.points.length} nodes via Geo-Decay Engine...`);

      // 2. Scan nodes (concurrent batch)
      const scannedNodes: NodeScanOutput[] = [];
      const totalPoints = grid.points.length;
      const batchSize = 10;

      for (let i = 0; i < totalPoints; i += batchSize) {
        const slice = grid.points.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          slice.map((point) =>
            scanGridNode(
              {
                mode: curScanMode,
                target,
                keyword: curKeyword,
              },
              point
            )
          )
        );
        scannedNodes.push(...batchResults);
        const progress = Math.min(
          90,
          Math.round(30 + (scannedNodes.length / totalPoints) * 60)
        );
        setScanProgress(progress);
        setScanStepText(`Scanned node ${scannedNodes.length} of ${totalPoints}...`);
      }

      // 3. Summarize scan
      const scanId = `scan_${Date.now()}`;
      const summary = summarizeGridScan(
        scanId,
        target,
        curKeyword,
        curScanMode,
        curGridSize,
        curDistanceStep,
        curUnit,
        center,
        scannedNodes
      );

      setScanSummary(summary);
      setSelectedNode(scannedNodes.find((n) => n.isCenter) || scannedNodes[0]);

      // Append to history (Predictive simulation model costs 0 credits)

      // Append to history
      const historyRecord: ScanMasterRecord = {
        id: scanId,
        businessName: curBusinessName,
        category: curKeyword,
        bestKeyword: curKeyword,
        keywordCount: 1,
        top3Percentage: summary.top3Percentage,
        lastScanDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        summary,
      };
      setScanHistory((prev) => [historyRecord, ...prev.slice(0, 9)]);

      // 4. Generate audit
      const initialAuditInput: LocalSeoAuditInput = {
        businessName: summary.target.businessName || curBusinessName,
        category: summary.keyword || curKeyword,
        metrics: {
          averageRank: summary.averageRank,
          top3Percentage: summary.top3Percentage,
          totalNodesScanned: summary.totalNodes,
          gridSpanDescription: `${summary.gridSize}x${summary.gridSize} grid across ${
            summary.distanceStep * summary.gridSize
          } ${summary.unit} radius`,
          targetMarket: 'Metro Area',
        },
        topCompetitorsInWeakZones: summary.dominantCompetitors,
      };

      const immediateAudit = generateDeterministicAudit(initialAuditInput);
      setAuditOutput(immediateAudit);

      // Store in keyword cache and select as active keyword
      const updatedEntry: KeywordScanEntry = {
        keyword: curKeyword,
        summary,
        audit: immediateAudit,
      };
      setKeywordCache((prev) => ({
        ...prev,
        [curKeyword]: updatedEntry,
      }));
      setSelectedKeyword(curKeyword);

      // Persist scan to server
      fetch('/api/scans/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: summary.scanId,
          businessId: activeBusinessId,
          scanSummary: summary,
          audit: immediateAudit,
          businessName: curBusinessName,
          keyword: curKeyword,
          center,
          gridSize: curGridSize,
          distanceStep: curDistanceStep,
          unit: curUnit,
        }),
      }).catch(() => {});

      setScanProgress(100);
      setScanStepText('Scan complete!');
      setIsScanning(false);

      // Background AI refinement
      runAudit(summary);
    } catch (err) {
      console.error('Scan execution failed:', err);
      setIsScanning(false);
      setScanProgress(100);
      setScanStepText('Scan finished with fallback values');
    }
  };

  const runAudit = async (summary: GridScanSummary) => {
    setIsGeneratingAudit(true);
    const auditInput: LocalSeoAuditInput = {
      businessName: summary.target.businessName || businessName,
      category: summary.keyword || keyword,
      metrics: {
        averageRank: summary.averageRank,
        top3Percentage: summary.top3Percentage,
        totalNodesScanned: summary.totalNodes,
        gridSpanDescription: `${summary.gridSize}x${summary.gridSize} grid across ${
          summary.distanceStep * summary.gridSize
        } ${summary.unit} radius`,
        targetMarket: 'Metro Area',
      },
      topCompetitorsInWeakZones: summary.dominantCompetitors,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch('/api/generate-audit-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditInput),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await resp.json();
      if (data && data.success && data.data) {
        setAuditOutput(data.data);
        setKeywordCache((prev) => {
          const existing = prev[summary.keyword];
          if (!existing) return prev;
          return {
            ...prev,
            [summary.keyword]: {
              ...existing,
              audit: data.data,
            },
          };
        });
      }
    } catch {
      // Deterministic fallback already active
    } finally {
      setIsGeneratingAudit(false);
    }
  };

  // Switch to selected business card from Directory
  const handleSelectBusinessCard = (item: BusinessCardItem) => {
    setActiveBusinessId(item.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('georank_active_biz_id', item.id);
    }
    setBusinessName(item.name);
    setBusinessAddress(item.address);
    setCategory(item.category);
    setKeyword(item.keyword);
    setSelectedKeyword(item.keyword);
    setCenterLat(item.lat);
    setCenterLng(item.lng);
    setBusinessWorkspaceOpen(true);
    setActiveNav('businesses');
    setBusinessTab('keywords');

    const freshCache = buildInitialKeywordScanCache({
      businessName: item.name,
      center: { lat: item.lat, lng: item.lng },
      gridSize,
      distanceStep,
      unit,
      mode: scanMode,
    });
    setKeywordCache(freshCache);

    // Try loading existing saved scan for this business
    fetch(`/api/scans?businessId=${encodeURIComponent(item.id)}`)
      .then((r) => r.json())
      .then((scanData) => {
        if (scanData.success && scanData.scan?.scanSummary) {
          const s = scanData.scan;
          setScanSummary(s.scanSummary);
          setSelectedNode(
            s.scanSummary.nodes.find((n: any) => n.isCenter) || s.scanSummary.nodes[0] || null
          );
          if (s.audit) {
            setAuditOutput(s.audit);
          }
        } else {
          const activeEntry = freshCache[item.keyword] || Object.values(freshCache)[0];
          if (activeEntry) {
            setScanSummary(activeEntry.summary);
            setSelectedNode(
              activeEntry.summary.nodes.find((n) => n.isCenter) || activeEntry.summary.nodes[0] || null
            );
            setAuditOutput(activeEntry.audit);
          }
        }
      })
      .catch(() => {
        const activeEntry = freshCache[item.keyword] || Object.values(freshCache)[0];
        if (activeEntry) {
          setScanSummary(activeEntry.summary);
          setSelectedNode(
            activeEntry.summary.nodes.find((n) => n.isCenter) || activeEntry.summary.nodes[0] || null
          );
          setAuditOutput(activeEntry.audit);
        }
      });
  };

  // Handle active business deletion from BusinessHeader
  const handleDeleteActiveBusiness = async () => {
    if (!activeBusinessId) return;
    try {
      const res = await fetch(`/api/businesses/${activeBusinessId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('georank_active_biz_id');
        }
        setBusinessWorkspaceOpen(false);
        setActiveBusinessId('');
      }
    } catch (err) {
      console.error('Failed to delete active business:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* 1. Left Vertical Navigation Sidebar */}
      <AppSidebar
        activeNav={activeNav}
        onSelectNav={(view) => {
          setActiveNav(view);
          if (view === 'businesses') {
            setBusinessWorkspaceOpen(false);
          } else if (view === 'pitch-pack') {
            setBusinessWorkspaceOpen(true);
            setBusinessTab('prospecting');
          } else if (view === 'scans') {
            // Master scans log
          }
        }}
        credits={credits}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenBranding={() => setBrandingModalOpen(true)}
        onOpenNewScan={() => setIsNewScanOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header */}
        <AppHeader
          businessName={businessName}
          currentView={activeNav}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenBranding={() => setBrandingModalOpen(true)}
          onOpenNewScan={() => setIsNewScanOpen(true)}
          credits={credits}
          scanMode={scanMode}
          onToggleScanMode={handleToggleScanMode}
          hasDataForSeoCreds={hasDataForSeoCreds}
          centerLat={centerLat}
          centerLng={centerLng}
          onLocationResolved={handleLocationResolved}
        />

        {/* Business View Header & Sub-Navigation: Rendered when in businesses workspace */}
        {activeNav === 'businesses' && businessWorkspaceOpen && (
          <BusinessHeader
            businessName={businessName}
            address={businessAddress}
            category={category}
            activeSubTab={businessTab}
            onSelectSubTab={(tab) => {
              setBusinessTab(tab);
            }}
            onOpenNewScan={() => setIsNewScanOpen(true)}
            onOpenReports={() => handleOpenClientReport()}
            onBackToBusinesses={() => setBusinessWorkspaceOpen(false)}
            onDeleteBusiness={handleDeleteActiveBusiness}
            totalKeywords={Object.keys(keywordCache).length}
            isScanning={isScanning}
            scanSummary={scanSummary}
          />
        )}

        {/* Active Scan Progress Notification Banner */}
        {isScanning && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
              <span className="flex items-center space-x-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>{scanStepText}</span>
              </span>
              <span className="font-bold font-mono">{scanProgress}%</span>
            </div>
            <div className="w-full bg-emerald-100/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Live DataForSEO Notice Banner */}
        {liveNotice && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{liveNotice}</span>
            </div>
            <button
              onClick={() => setLiveNotice(null)}
              className="text-amber-700 font-semibold hover:text-amber-900 cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-amber-100/70 transition"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>
          </div>
        )}

        {/* Main Body Workspace Container: View Switcher */}
        <main className="flex-1 p-4 sm:p-6 space-y-4">
          {/* VIEW: Businesses (Workspace OR Directory Cards) */}
          {activeNav === 'businesses' && (
            businessWorkspaceOpen ? (
              // Inside Business Workspace: Render by businessTab
              <>
                {businessTab === 'keywords' && (
                  <ProfitMapsView
                    scanSummary={scanSummary}
                    selectedNode={selectedNode}
                    onSelectNode={(node) => setSelectedNode(node)}
                    onReScan={() => executeScan()}
                    onOpenNewScan={() => setIsNewScanOpen(true)}
                    onOpenShareReport={handleOpenShareReport}
                    onOpenActionPlan={() => setIsActionPlanOpen(true)}
                    businessName={businessName}
                    category={category}
                    city={businessAddress}
                    isScanning={isScanning}
                    activeKeyword={selectedKeyword}
                    keywordsList={keywordsList}
                    onSelectKeyword={handleSelectKeyword}
                    onAddKeyword={handleAddKeyword}
                    onDeleteKeyword={handleDeleteKeyword}
                  />
                )}
                {businessTab === 'todo' && (
                  <RankFixesTodoList
                    businessName={businessName}
                    category={category}
                    city={businessAddress}
                    trackedKeywords={keywordsList.map((k) => k.keyword)}
                    onOpenSiteBuilder={() => setBusinessTab('site-plan')}
                    onOpenGbpPosts={() => setBusinessTab('gbp-posts')}
                    onShareWithOwner={handleOpenShareReport}
                  />
                )}
                {businessTab === 'prospecting' && (
                  <div className="space-y-6">
                    <VisibilityScorecard
                      businessName={businessName}
                      category={category}
                      city={businessAddress}
                      reviews={145}
                      onNavigateToBuilder={() => setBusinessTab('site-plan')}
                      onNavigateToTodoList={() => setBusinessTab('todo')}
                    />
                    <ClaimSiteView
                      businessName={businessName}
                      category={category}
                      city={businessAddress}
                      phone="(512) 555-0199"
                      address={businessAddress}
                      top3Percentage={scanSummary?.top3Percentage ?? 16}
                      averageRank={scanSummary?.averageRank ?? 11.4}
                      onNavigateToPreview={(slug) => {
                        window.history.pushState({}, '', `/preview/${slug}`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                    />
                    <AuditDeck
                      audit={auditOutput}
                      scanSummary={scanSummary}
                      onRegenerateAudit={() => scanSummary && runAudit(scanSummary)}
                      isRegenerating={isGeneratingAudit}
                    />
                  </div>
                )}
                {businessTab === 'scan-history' && (
                  <ScansListView
                    scans={scanHistory}
                    onSelectScan={(summary) => {
                      setScanSummary(summary);
                      setBusinessTab('keywords');
                    }}
                    onOpenNewScan={() => setIsNewScanOpen(true)}
                    onShareScan={handleOpenShareReport}
                    onRescanItem={(rec) => executeScan({
                      businessName: rec.businessName,
                      keyword: rec.bestKeyword,
                      lat: rec.summary.center.lat,
                      lng: rec.summary.center.lng,
                      gridSize,
                      distanceStep,
                      unit,
                      scanMode,
                    })}
                  />
                )}
                {businessTab === 'site-plan' && (
                  <SitePlanView
                    businessName={businessName}
                    category={category}
                    city={businessAddress}
                    trackedKeywords={keywordsList.map((k) => k.keyword)}
                    onLaunchSiteBuilder={() => setActiveNav('site-builder')}
                  />
                )}
                {businessTab === 'page-articles' && (
                  <PageArticlesView
                    businessName={businessName}
                    category={category}
                  />
                )}
                {businessTab === 'gbp-posts' && (
                  <GbpPostsView
                    businessName={businessName}
                    category={category}
                  />
                )}
                {businessTab === 'leads' && (
                  <LeadsView businessName={businessName} />
                )}
              </>
            ) : (
              // Multi-business Cards Grid Directory
              <BusinessesListView
                onSelectBusiness={handleSelectBusinessCard}
                onOpenAddBusinessModal={() => setIsWizardOpen(true)}
                currentBusinessName={businessName}
                onLocationResolved={handleLocationResolved}
                onBusinessDeleted={(deletedId) => {
                  if (activeBusinessId === deletedId) {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('georank_active_biz_id');
                    }
                    setActiveBusinessId('');
                  }
                }}
              />
            )
          )}

          {/* VIEW: Dashboard Overview */}
          {activeNav === 'dashboard' && (
            <DashboardOverview
              businessName={businessName}
              scanSummary={scanSummary}
              credits={credits}
              onOpenNewScan={() => setIsNewScanOpen(true)}
              onViewBusinessMap={() => {
                setActiveNav('businesses');
                setBusinessWorkspaceOpen(true);
                setBusinessTab('keywords');
              }}
              onOpenPitchPack={() => {
                setActiveNav('businesses');
                setBusinessWorkspaceOpen(true);
                setBusinessTab('prospecting');
              }}
              onSelectBusiness={(name) => {
                setBusinessName(name);
                setActiveNav('businesses');
                setBusinessWorkspaceOpen(true);
              }}
              onLocationResolved={handleLocationResolved}
              centerLat={centerLat}
              centerLng={centerLng}
            />
          )}

          {/* VIEW: Find Businesses (Lead Prospecting Finder) */}
          {activeNav === 'find-businesses' && (
            <FindBusinessesView
              onScanProspect={(target) => {
                setBusinessName(target.name);
                setKeyword(target.keyword);
                setSelectedKeyword(target.keyword);
                setCategory(target.keyword);
                setCenterLat(target.lat);
                setCenterLng(target.lng);
                setActiveNav('businesses');
                setBusinessWorkspaceOpen(true);
                setBusinessTab('keywords');

                const freshCache = buildInitialKeywordScanCache({
                  businessName: target.name,
                  center: { lat: target.lat, lng: target.lng },
                  gridSize,
                  distanceStep,
                  unit,
                  mode: scanMode,
                });
                setKeywordCache(freshCache);

                const activeEntry = freshCache[target.keyword] || Object.values(freshCache)[0];
                if (activeEntry) {
                  setScanSummary(activeEntry.summary);
                  setSelectedNode(
                    activeEntry.summary.nodes.find((n) => n.isCenter) || activeEntry.summary.nodes[0] || null
                  );
                  setAuditOutput(activeEntry.audit);
                } else {
                  executeScan({
                    businessName: target.name,
                    keyword: target.keyword,
                    lat: target.lat,
                    lng: target.lng,
                    gridSize,
                    distanceStep,
                    unit,
                    scanMode,
                  });
                }
              }}
            />
          )}

          {/* VIEW: Master Scans Log */}
          {activeNav === 'scans' && (
            <ScansListView
              scans={scanHistory}
              onSelectScan={(summary) => {
                setScanSummary(summary);
                setBusinessName(summary.target.businessName || businessName);
                setActiveNav('businesses');
                setBusinessWorkspaceOpen(true);
                setBusinessTab('keywords');
              }}
              onOpenNewScan={() => setIsNewScanOpen(true)}
              onShareScan={handleOpenShareReport}
              onRescanItem={(rec) => executeScan({
                businessName: rec.businessName,
                keyword: rec.bestKeyword,
                lat: rec.summary.center.lat,
                lng: rec.summary.center.lng,
                gridSize,
                distanceStep,
                unit,
                scanMode,
              })}
            />
          )}

          {/* VIEW: Pitch Pack Studio (AI Client Audit & Pitch Deck) */}
          {activeNav === 'pitch-pack' && (
            <PitchPackView
              audit={auditOutput}
              scanSummary={scanSummary}
              onRegenerateAudit={() => scanSummary && runAudit(scanSummary)}
              isRegenerating={isGeneratingAudit}
              onOpenClientReport={() => handleOpenClientReport()}
            />
          )}

          {/* VIEW: Site Builder */}
          {activeNav === 'site-builder' && (
            <SiteBuilderView
              businessName={businessName}
              category={category}
              city={businessAddress}
              phone="(512) 555-0199"
              address={businessAddress}
              lat={centerLat}
              lng={centerLng}
            />
          )}

          {/* VIEW: Leads */}
          {activeNav === 'leads' && (
            <LeadsView businessName={businessName} />
          )}

          {/* VIEW: Training Academy */}
          {activeNav === 'training' && (
            <TrainingView />
          )}

          {/* VIEW: Integrations */}
          {activeNav === 'integrations' && (
            <IntegrationsView hasDataForSeoCreds={hasDataForSeoCreds} />
          )}

          {/* VIEW: Settings & White-Label */}
          {activeNav === 'settings' && (
            <SettingsView />
          )}

          {/* VIEW: Clients */}
          {activeNav === 'clients' && (
            <ClientsView
              onSelectClientBusiness={(name) => {
                setBusinessName(name);
                setActiveNav('businesses');
                setBusinessWorkspaceOpen(true);
                setBusinessTab('keywords');
              }}
            />
          )}

          {/* VIEW: Plans */}
          {activeNav === 'plans' && (
            <PlansView
              currentPlanId="growth"
              onSelectPlan={(planId) => alert(`Selected ${planId} plan tier`)}
            />
          )}

          {/* VIEW: Billing */}
          {activeNav === 'billing' && (
            <BillingView
              credits={credits}
              onBuyCredits={(added) => setCredits((prev) => prev + added)}
            />
          )}
        </main>

        {/* Global Modals */}
        <BusinessSetupWizard
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          initialBusinessName={businessName}
          initialCategory={category}
          initialAddress={businessAddress}
          initialLat={centerLat}
          initialLng={centerLng}
          initialWebsite={targetWebsite || targetDomain}
          initialPlaceId={targetPlaceId}
          onComplete={async (data, selectedKeywords) => {
            try {
              const res = await fetch('/api/businesses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: data.businessName,
                  category: data.category,
                  address: data.address,
                  phone: data.phone,
                  website: data.website || data.domainOrUrl,
                  lat: data.lat,
                  lng: data.lng,
                  placeId: data.placeId,
                  keyword: selectedKeywords[0] || data.category,
                }),
              });
              const saved = await res.json();
              const newBizId = saved?.business?.id || saved?.id;
              if (newBizId) {
                setActiveBusinessId(newBizId);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('georank_active_biz_id', newBizId);
                }
              }
            } catch (e) {
              console.warn('Could not persist new business via API:', e);
            }

            setBusinessName(data.businessName);
            setCategory(data.category);
            setBusinessAddress(data.address);
            setCenterLat(data.lat);
            setCenterLng(data.lng);
            setTargetPlaceId(data.placeId);
            setTargetDomain(data.website);
            setTargetWebsite(data.website);
            setIsWizardOpen(false);

            const primaryKw = selectedKeywords[0] || data.category;
            executeScan({
              businessName: data.businessName,
              keyword: primaryKw,
              lat: data.lat,
              lng: data.lng,
              gridSize: 5,
              distanceStep: 1.0,
              unit: 'km',
              scanMode,
              placeId: data.placeId,
              domainOrUrl: data.website,
            });
            setActiveNav('businesses');
            setBusinessWorkspaceOpen(true);
            setBusinessTab('keywords');
          }}
        />

        <NewScanModal
          isOpen={isNewScanOpen}
          onClose={() => setIsNewScanOpen(false)}
          onRunScan={(params) => {
            executeScan(params);
            setActiveNav('businesses');
            setBusinessWorkspaceOpen(true);
            setBusinessTab('keywords');
          }}
          initialBusinessName={businessName}
          initialKeyword={keyword}
          initialLat={centerLat}
          initialLng={centerLng}
          initialGridSize={gridSize}
          initialDistanceStep={distanceStep}
          initialUnit={unit}
          initialScanMode={scanMode}
          credits={credits}
          isScanning={isScanning}
          hasDataForSeoCreds={hasDataForSeoCreds}
        />

        <ActionPlanModal
          isOpen={isActionPlanOpen}
          onClose={() => setIsActionPlanOpen(false)}
          audit={auditOutput}
          scanSummary={scanSummary}
          onOpenProspectingStudio={() => {
            setActiveNav('businesses');
            setBusinessWorkspaceOpen(true);
            setBusinessTab('prospecting');
          }}
        />

        <ShareReportModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareUrl={shareUrl}
          scanId={shareScanId}
          businessName={businessName}
        />

        <BrandingModal
          isOpen={brandingModalOpen}
          onClose={() => setBrandingModalOpen(false)}
        />

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-3.5 px-6 text-center text-xs text-slate-500">
          GeoRank Pro • Powered by {branding.agencyName || 'GeoRank Pro'} • Google Local Maps Radar Tracker
        </footer>
      </div>
    </div>
  );
}
