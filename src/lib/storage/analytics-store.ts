/**
 * GeoRank Pro - Prospect Analytics & Telemetry Storage Layer
 * Path: /src/lib/storage/analytics-store.ts
 *
 * Lightweight persistent JSON storage and in-memory cache
 * for tracking external prospect engagement across shared audit decks.
 *
 * Tracks:
 * - report_opened: prospect opened the shared report deck
 * - slider_adjusted: prospect manipulated Average Ticket Value or Close Rate sliders
 * - scenario_changed: prospect switched between Conservative, Expected, or Leader scenarios
 * - cta_clicked: prospect clicked Strategy Call, Plan Activation, PDF Print, etc.
 * - report_shared: agency user or prospect copied/shared the audit link
 * - dwell_ping: reading dwell time heartbeat pings
 */

import fs from 'fs';
import path from 'path';
import { resolveStorageDir, atomicWriteJsonSync } from './scan-store.ts';

export type ProspectEventType =
  | 'report_opened'
  | 'slider_adjusted'
  | 'scenario_changed'
  | 'cta_clicked'
  | 'report_shared'
  | 'dwell_ping'
  | 'leakage_toggled'
  | 'leakage_expanded';

export interface ProspectEvent {
  id: string;
  scanId: string;
  businessName: string;
  eventType: ProspectEventType | string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
  details?: {
    sliderName?: string;
    sliderValue?: number;
    scenario?: string;
    ctaType?: string;
    dwellSeconds?: number;
    shareMethod?: string;
    [key: string]: any;
  };
}

export interface ProspectPipelineItem {
  businessName: string;
  scanId: string;
  keyword?: string;
  firstSeen: string;
  lastActive: string;
  openCount: number;
  totalDwellSeconds: number;
  sliderTouches: number;
  lastTicketValue?: number;
  lastCloseRate?: number;
  lastScenario?: string;
  ctaClicks: number;
  lastCtaType?: string;
  engagementScore: number; // 0 - 100
  heatTier: 'hot' | 'warm' | 'cold';
  status: 'New Lead' | 'In Review' | 'Proposal Hot' | 'Contacted';
  recentEvents: ProspectEvent[];
}

export interface ProspectAnalyticsSummary {
  totalReportsSent: number;
  totalOpens: number;
  uniqueProspectOpens: number;
  openRatePercent: number;
  avgDwellSeconds: number;
  avgDwellFormatted: string;
  totalSliderEngagements: number;
  totalScenarioChanges: number;
  totalCtaClicks: number;
  ctaBreakdown: {
    strategyCall: number;
    activatePlan: number;
    printPdf: number;
    serpEvidence: number;
    custom: number;
  };
  prospects: ProspectPipelineItem[];
  recentEvents: ProspectEvent[];
}

// In-memory cache for ultra-fast queries and event ingestion
const inMemoryEvents: ProspectEvent[] = [];
let isInitialized = false;

/**
 * Resolves the analytics JSON file path
 */
function getAnalyticsFilePath(): string | null {
  const dataDir = resolveStorageDir();
  if (!dataDir) return null;
  return path.join(dataDir, 'analytics-events.json');
}

/**
 * Initial seed events for demo accounts so the dashboard is immediately rich and informative
 */
function getInitialSeedEvents(): ProspectEvent[] {
  const now = Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;

  return [
    {
      id: 'evt_seed_1',
      scanId: 'scan_austin_plumbing',
      businessName: 'Austin Premier Plumbing',
      eventType: 'report_opened',
      timestamp: new Date(now - 12 * minute).toISOString(),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      sessionId: 'sess_austin_1',
      details: { referrer: 'direct_email' },
    },
    {
      id: 'evt_seed_2',
      scanId: 'scan_austin_plumbing',
      businessName: 'Austin Premier Plumbing',
      eventType: 'scenario_changed',
      timestamp: new Date(now - 10 * minute).toISOString(),
      sessionId: 'sess_austin_1',
      details: { scenario: 'leader' },
    },
    {
      id: 'evt_seed_3',
      scanId: 'scan_austin_plumbing',
      businessName: 'Austin Premier Plumbing',
      eventType: 'slider_adjusted',
      timestamp: new Date(now - 8 * minute).toISOString(),
      sessionId: 'sess_austin_1',
      details: { sliderName: 'avgTicketValue', sliderValue: 650 },
    },
    {
      id: 'evt_seed_4',
      scanId: 'scan_austin_plumbing',
      businessName: 'Austin Premier Plumbing',
      eventType: 'slider_adjusted',
      timestamp: new Date(now - 7 * minute).toISOString(),
      sessionId: 'sess_austin_1',
      details: { sliderName: 'closeRate', sliderValue: 35 },
    },
    {
      id: 'evt_seed_5',
      scanId: 'scan_austin_plumbing',
      businessName: 'Austin Premier Plumbing',
      eventType: 'dwell_ping',
      timestamp: new Date(now - 6 * minute).toISOString(),
      sessionId: 'sess_austin_1',
      details: { dwellSeconds: 240 },
    },
    {
      id: 'evt_seed_6',
      scanId: 'scan_austin_plumbing',
      businessName: 'Austin Premier Plumbing',
      eventType: 'cta_clicked',
      timestamp: new Date(now - 5 * minute).toISOString(),
      sessionId: 'sess_austin_1',
      details: { ctaType: 'strategy_call' },
    },
    {
      id: 'evt_seed_7',
      scanId: 'scan_apex_plumbing',
      businessName: 'Apex Emergency Plumbing',
      eventType: 'report_opened',
      timestamp: new Date(now - 45 * minute).toISOString(),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      sessionId: 'sess_apex_1',
      details: { referrer: 'sms_link' },
    },
    {
      id: 'evt_seed_8',
      scanId: 'scan_apex_plumbing',
      businessName: 'Apex Emergency Plumbing',
      eventType: 'slider_adjusted',
      timestamp: new Date(now - 42 * minute).toISOString(),
      sessionId: 'sess_apex_1',
      details: { sliderName: 'avgTicketValue', sliderValue: 500 },
    },
    {
      id: 'evt_seed_9',
      scanId: 'scan_apex_plumbing',
      businessName: 'Apex Emergency Plumbing',
      eventType: 'dwell_ping',
      timestamp: new Date(now - 40 * minute).toISOString(),
      sessionId: 'sess_apex_1',
      details: { dwellSeconds: 195 },
    },
    {
      id: 'evt_seed_10',
      scanId: 'scan_apex_plumbing',
      businessName: 'Apex Emergency Plumbing',
      eventType: 'cta_clicked',
      timestamp: new Date(now - 38 * minute).toISOString(),
      sessionId: 'sess_apex_1',
      details: { ctaType: 'print_pdf' },
    },
    {
      id: 'evt_seed_11',
      scanId: 'scan_capital_water',
      businessName: 'Capital City Water Heaters',
      eventType: 'report_opened',
      timestamp: new Date(now - 2 * hour).toISOString(),
      sessionId: 'sess_cap_1',
      details: { referrer: 'cold_email' },
    },
    {
      id: 'evt_seed_12',
      scanId: 'scan_capital_water',
      businessName: 'Capital City Water Heaters',
      eventType: 'dwell_ping',
      timestamp: new Date(now - 115 * minute).toISOString(),
      sessionId: 'sess_cap_1',
      details: { dwellSeconds: 110 },
    },
    {
      id: 'evt_seed_13',
      scanId: 'scan_lone_star',
      businessName: 'Lone Star Rooter Pros',
      eventType: 'report_shared',
      timestamp: new Date(now - 5 * hour).toISOString(),
      sessionId: 'sess_lone_1',
      details: { shareMethod: 'clipboard_copy' },
    },
    {
      id: 'evt_seed_14',
      scanId: 'scan_lone_star',
      businessName: 'Lone Star Rooter Pros',
      eventType: 'report_opened',
      timestamp: new Date(now - 4 * hour).toISOString(),
      sessionId: 'sess_lone_1',
      details: { referrer: 'direct' },
    },
    {
      id: 'evt_seed_15',
      scanId: 'scan_lone_star',
      businessName: 'Lone Star Rooter Pros',
      eventType: 'cta_clicked',
      timestamp: new Date(now - 230 * minute).toISOString(),
      sessionId: 'sess_lone_1',
      details: { ctaType: 'activate_plan' },
    },
  ];
}

/**
 * Initializes the analytics store from disk or populates seed data
 */
function initAnalyticsStorage() {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const filePath = getAnalyticsFilePath();
    if (filePath && fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryEvents.push(...parsed);
          return;
        }
      }
    }
  } catch (err) {
    console.warn('AnalyticsStore: Failed reading from disk, using in-memory mode:', err);
  }

  // Seed default demo events
  const seeds = getInitialSeedEvents();
  inMemoryEvents.push(...seeds);
  persistAnalyticsToDisk();
}

/**
 * Persists in-memory telemetry events to disk
 */
function persistAnalyticsToDisk() {
  try {
    const filePath = getAnalyticsFilePath();
    if (!filePath) return;
    atomicWriteJsonSync(filePath, inMemoryEvents);
  } catch (err) {
    console.warn('AnalyticsStore: Ephemeral storage note - skipping disk write (in-memory mode active):', err);
  }
}

// Ensure store is ready
initAnalyticsStorage();

/**
 * Generates an event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Records a new prospect engagement event
 */
export function saveProspectEvent(
  eventData: Omit<ProspectEvent, 'id' | 'timestamp'> & Partial<ProspectEvent>
): ProspectEvent {
  initAnalyticsStorage();

  const event: ProspectEvent = {
    id: eventData.id || generateEventId(),
    scanId: eventData.scanId || 'latest',
    businessName: eventData.businessName || 'Local Business',
    eventType: eventData.eventType || 'report_opened',
    timestamp: eventData.timestamp || new Date().toISOString(),
    userAgent: eventData.userAgent,
    ip: eventData.ip,
    sessionId: eventData.sessionId,
    details: eventData.details || {},
  };

  inMemoryEvents.unshift(event); // newest first

  // Cap in-memory history to last 5,000 events to manage memory cleanly
  if (inMemoryEvents.length > 5000) {
    inMemoryEvents.splice(5000);
  }

  persistAnalyticsToDisk();
  return event;
}

/**
 * Lists filtered prospect events
 */
export function listProspectEvents(filter?: {
  scanId?: string;
  businessName?: string;
  eventType?: string;
}): ProspectEvent[] {
  initAnalyticsStorage();

  return inMemoryEvents.filter((evt) => {
    if (filter?.scanId && evt.scanId !== filter.scanId) return false;
    if (filter?.businessName && evt.businessName.toLowerCase() !== filter.businessName.toLowerCase()) {
      return false;
    }
    if (filter?.eventType && evt.eventType !== filter.eventType) return false;
    return true;
  });
}

/**
 * Helper to format seconds into clean human string (e.g. "2m 45s")
 */
function formatDwellTime(seconds: number): string {
  if (seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

/**
 * Computes aggregated prospect analytics summary and pipeline telemetry
 */
export function getProspectAnalyticsSummary(): ProspectAnalyticsSummary {
  initAnalyticsStorage();

  const events = [...inMemoryEvents];

  // Group events by businessName
  const byBusiness = new Map<string, ProspectEvent[]>();
  for (const evt of events) {
    const key = evt.businessName || 'Unknown Business';
    if (!byBusiness.has(key)) {
      byBusiness.set(key, []);
    }
    byBusiness.get(key)!.push(evt);
  }

  let totalOpens = 0;
  let totalSliderEngagements = 0;
  let totalScenarioChanges = 0;
  let totalCtaClicks = 0;
  let totalDwellAcrossProspects = 0;
  let dwellSamplesCount = 0;

  const ctaBreakdown = {
    strategyCall: 0,
    activatePlan: 0,
    printPdf: 0,
    serpEvidence: 0,
    custom: 0,
  };

  const prospects: ProspectPipelineItem[] = [];

  for (const [bizName, bizEvents] of byBusiness.entries()) {
    // Sort events chronological
    const sorted = [...bizEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstSeen = sorted[0]?.timestamp || new Date().toISOString();
    const lastActive = sorted[sorted.length - 1]?.timestamp || new Date().toISOString();
    const scanId = sorted.find((e) => e.scanId && e.scanId !== 'latest')?.scanId || sorted[0]?.scanId || 'latest';

    let openCount = 0;
    let sliderTouches = 0;
    let ctaCount = 0;
    let maxDwellSeconds = 0;
    let lastTicketValue: number | undefined;
    let lastCloseRate: number | undefined;
    let lastScenario: string | undefined;
    let lastCtaType: string | undefined;
    let leakageExpandedCount = 0;

    for (const evt of bizEvents) {
      if (evt.eventType === 'report_opened') {
        openCount++;
        totalOpens++;
      } else if (evt.eventType === 'slider_adjusted') {
        sliderTouches++;
        totalSliderEngagements++;
        if (evt.details?.sliderName === 'avgTicketValue' && typeof evt.details.sliderValue === 'number') {
          lastTicketValue = evt.details.sliderValue;
        }
        if (evt.details?.sliderName === 'closeRate' && typeof evt.details.sliderValue === 'number') {
          lastCloseRate = evt.details.sliderValue;
        }
      } else if (evt.eventType === 'scenario_changed') {
        totalScenarioChanges++;
        if (evt.details?.scenario) {
          lastScenario = evt.details.scenario;
        }
      } else if (evt.eventType === 'cta_clicked') {
        ctaCount++;
        totalCtaClicks++;
        const ctaType = evt.details?.ctaType || 'custom';
        lastCtaType = ctaType;

        if (ctaType === 'strategy_call') ctaBreakdown.strategyCall++;
        else if (ctaType === 'activate_plan') ctaBreakdown.activatePlan++;
        else if (ctaType === 'print_pdf') ctaBreakdown.printPdf++;
        else if (ctaType === 'serp_evidence') ctaBreakdown.serpEvidence++;
        else ctaBreakdown.custom++;
      } else if (evt.eventType === 'leakage_expanded') {
        leakageExpandedCount++;
      } else if (evt.eventType === 'dwell_ping') {
        const d = Number(evt.details?.dwellSeconds) || 0;
        if (d > maxDwellSeconds) {
          maxDwellSeconds = d;
        }
      }
    }

    if (maxDwellSeconds > 0) {
      totalDwellAcrossProspects += maxDwellSeconds;
      dwellSamplesCount++;
    }

    // Calculate Engagement Score (0 - 100)
    // Opens: up to 25 pts (10 pts per open)
    // Dwell: up to 30 pts (>60s = 15pts, >120s = 30pts)
    // Sliders: up to 25 pts (10 pts per slider adjustment)
    // CTA: 20 pts per CTA click (up to 40 pts)
    // Leakage Expanded: 25 pts (high intent breakdown exploration)
    const openScore = Math.min(25, openCount * 12);
    const dwellScore = Math.min(30, Math.round((maxDwellSeconds / 180) * 30));
    const sliderScore = Math.min(25, sliderTouches * 12);
    const ctaScore = Math.min(40, ctaCount * 20);
    const leakageScore = Math.min(25, leakageExpandedCount * 25);
    const engagementScore = Math.min(100, openScore + dwellScore + sliderScore + ctaScore + leakageScore);

    // Heat tier & Status
    let heatTier: 'hot' | 'warm' | 'cold' = 'cold';
    let status: 'New Lead' | 'In Review' | 'Proposal Hot' | 'Contacted' = 'New Lead';

    if (ctaCount > 0 || leakageExpandedCount > 0 || engagementScore >= 70) {
      heatTier = 'hot';
      status = 'Proposal Hot';
    } else if (openCount > 1 || maxDwellSeconds > 60 || sliderTouches > 0 || engagementScore >= 40) {
      heatTier = 'warm';
      status = 'In Review';
    }

    prospects.push({
      businessName: bizName,
      scanId,
      firstSeen,
      lastActive,
      openCount: Math.max(1, openCount),
      totalDwellSeconds: maxDwellSeconds,
      sliderTouches,
      lastTicketValue,
      lastCloseRate,
      lastScenario,
      ctaClicks: ctaCount,
      lastCtaType,
      engagementScore,
      heatTier,
      status,
      recentEvents: bizEvents.slice(0, 8),
    });
  }

  // Sort prospects by engagement score descending (hottest first)
  prospects.sort((a, b) => b.engagementScore - a.engagementScore);

  const totalReportsSent = Math.max(prospects.length, 4);
  const uniqueProspectOpens = prospects.filter((p) => p.openCount > 0).length;
  const openRatePercent = Number(((uniqueProspectOpens / Math.max(1, totalReportsSent)) * 100).toFixed(1));
  const avgDwellSeconds = dwellSamplesCount > 0 ? Math.round(totalDwellAcrossProspects / dwellSamplesCount) : 135;

  return {
    totalReportsSent,
    totalOpens,
    uniqueProspectOpens,
    openRatePercent,
    avgDwellSeconds,
    avgDwellFormatted: formatDwellTime(avgDwellSeconds),
    totalSliderEngagements,
    totalScenarioChanges,
    totalCtaClicks,
    ctaBreakdown,
    prospects,
    recentEvents: events.slice(0, 30),
  };
}

/**
 * Clears telemetry events and resets to fresh state
 */
export function clearProspectEvents(): void {
  inMemoryEvents.length = 0;
  persistAnalyticsToDisk();
}
