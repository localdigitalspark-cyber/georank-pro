/**
 * GeoRank Pro - Background Scheduled Rank Tracker & Execution Engine
 * Path: /src/server/scheduler/rank-tracker.ts
 *
 * Implements:
 * - Recurring background cron scheduler via node-cron (off-peak hours & periodic queue runner)
 * - Safe credit cap checks (honoring DataForSEO credentials vs deterministic mock fallback)
 * - Automated sequential scan comparison (Scan N vs Scan N-1)
 * - RankingDelta calculation & persistence
 * - Win/Loss alerts and webhook notifications
 */

import cron, { type ScheduledTask } from 'node-cron';
import {
  listBusinesses,
  getBusiness,
  updateBusiness,
  calculateNextTrackDue,
  type ManagedBusiness,
} from '../../lib/storage/business-store.ts';
import {
  saveScan,
  getScansForBusiness,
} from '../../lib/storage/scan-store.ts';
import { generateGeoGrid } from '../../lib/geo/grid-generator.ts';
import {
  scanGridNode,
  summarizeGridScan,
  isDataForSeoConfigured,
  type GridScanSummary,
  type SerpScanMode,
} from '../../lib/serp/adapter.ts';
import { generateDeterministicAudit } from '../../lib/ai/audit-generator.ts';
import { computeRankingDelta } from '../../lib/tracking/ranking-delta.ts';
import { evaluateAndDispatchAlerts } from '../../lib/tracking/alert-dispatcher.ts';
import type { RankingDelta, TrackingFrequency } from '../../lib/types.ts';

let cronTask: ScheduledTask | null = null;
let periodicInterval: NodeJS.Timeout | null = null;
let isJobRunning = false;
let lastSchedulerRun: string | null = null;

export interface SchedulerStatus {
  isRunning: boolean;
  isJobExecuting: boolean;
  totalBusinesses: number;
  totalTrackedBusinesses: number;
  dueTrackingCount: number;
  lastRunAt: string | null;
  mode: 'live' | 'mock';
  hasDataForSeoCreds: boolean;
}

/**
 * Checks which businesses currently have tracking enabled and are due for execution
 */
export function getDueBusinesses(): ManagedBusiness[] {
  const all = listBusinesses();
  const now = Date.now();

  return all.filter((b) => {
    const config = b.trackingConfig;
    if (!config || !config.enabled || config.frequency === 'off') {
      return false;
    }
    if (!config.nextTrackDue) {
      return true; // Never tracked before, due immediately
    }
    const dueTime = new Date(config.nextTrackDue).getTime();
    return dueTime <= now;
  });
}

/**
 * Executes a single scheduled rank check for a business and keyword
 */
export async function executeScheduledScanForBusiness(
  businessId: string,
  targetKeyword?: string
): Promise<{
  success: boolean;
  businessName: string;
  keyword: string;
  delta: RankingDelta;
  alertsCount: number;
  error?: string;
}> {
  const business = getBusiness(businessId);
  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  const keyword = (targetKeyword || business.keyword || business.category || 'General Service').trim();
  const centerLat = business.lat || 30.2672;
  const centerLng = business.lng || -97.7431;
  const center = { lat: centerLat, lng: centerLng };
  const gridSize = 5;
  const distanceStep = 1.0;
  const unit = 'km';
  const hasLiveCreds = isDataForSeoConfigured();
  const mode: SerpScanMode = hasLiveCreds ? 'live' : 'mock';

  const target = {
    businessName: business.name,
    address: business.address,
    placeId: business.placeId,
    website: business.website,
  };

  // 1. Generate standard coordinate grid nodes
  const grid = generateGeoGrid({
    center,
    gridSize,
    distanceStep,
    unit,
  });

  // 2. Scan nodes (batching to respect rate limits)
  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nodeResults: any[] = [];
  const batchSize = mode === 'live' ? 5 : 25;

  for (let i = 0; i < grid.points.length; i += batchSize) {
    const chunk = grid.points.slice(i, i + batchSize);
    const chunkResults = await Promise.all(
      chunk.map((point) =>
        scanGridNode(
          {
            mode,
            target,
            keyword,
            dataForSeoLogin: process.env.DATAFORSEO_LOGIN,
            dataForSeoPassword: process.env.DATAFORSEO_PASSWORD,
          },
          point
        )
      )
    );
    nodeResults.push(...chunkResults);
  }

  // 3. Summarize grid scan
  const newSummary: GridScanSummary = summarizeGridScan(
    scanId,
    target,
    keyword,
    mode,
    gridSize,
    distanceStep,
    unit,
    center,
    nodeResults
  );

  // 4. Retrieve previous scan for this business + keyword
  const previousScans = getScansForBusiness(business.id);
  const matchingPrevious = previousScans.find(
    (s) => s.keyword.toLowerCase() === keyword.toLowerCase()
  );
  const previousSummary = matchingPrevious?.scanSummary || null;

  // 5. Compute deterministic Ranking Delta
  const delta = computeRankingDelta(newSummary, previousSummary);

  // 6. Generate audit output
  const audit = generateDeterministicAudit({
    businessName: business.name,
    category: business.category,
    metrics: {
      averageRank: newSummary.averageRank,
      top3Percentage: newSummary.top3Percentage,
      totalNodesScanned: newSummary.totalNodes,
    },
    topCompetitorsInWeakZones: newSummary.dominantCompetitors.map((c) => ({
      name: c.name,
      reviewsCount: c.reviews,
      averageRating: c.rating,
      estimatedSharePercent: c.top3SharePercent,
    })),
  });

  // 7. Save new scan record in persistent storage
  saveScan({
    scanId: newSummary.scanId,
    businessId: business.id,
    businessName: business.name,
    keyword,
    center,
    gridSize,
    distanceStep,
    unit,
    scanSummary: newSummary,
    audit,
  });

  // 8. Evaluate and dispatch Win/Loss alerts
  const alertResults = await evaluateAndDispatchAlerts(business, keyword, delta, newSummary);

  // 9. Update business with new metrics and nextTrackDue
  const freq: TrackingFrequency = business.trackingConfig?.frequency || 'weekly';
  const nextTrackDue = calculateNextTrackDue(freq);

  updateBusiness(business.id, {
    averageRank: Number(newSummary.averageRank.toFixed(1)),
    top3Percentage: Number(newSummary.top3Percentage.toFixed(1)),
    lastScanDate: `Auto: ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    latestDelta: delta,
    rankingDeltas: {
      ...(business.rankingDeltas || {}),
      [keyword]: delta,
    },
    trackingConfig: {
      ...(business.trackingConfig || { enabled: true, frequency: freq }),
      lastTrackedAt: new Date().toISOString(),
      nextTrackDue,
    },
  });

  return {
    success: true,
    businessName: business.name,
    keyword,
    delta,
    alertsCount: alertResults.length,
  };
}

/**
 * Executes all due tracking jobs across all configured businesses
 */
export async function runPendingTrackingJobs(forceAll = false): Promise<{
  executedCount: number;
  results: Array<{ businessName: string; keyword: string; delta: RankingDelta; alertsCount: number }>;
  errors: string[];
}> {
  if (isJobRunning) {
    console.log('[RankTracker] A scheduled tracking batch is already running. Skipping concurrent run.');
    return { executedCount: 0, results: [], errors: ['Job already running'] };
  }

  isJobRunning = true;
  lastSchedulerRun = new Date().toISOString();
  const results: Array<{ businessName: string; keyword: string; delta: RankingDelta; alertsCount: number }> = [];
  const errors: string[] = [];

  try {
    const targets = forceAll
      ? listBusinesses().filter((b) => b.trackingConfig?.enabled && b.trackingConfig.frequency !== 'off')
      : getDueBusinesses();

    console.log(`[RankTracker] Executing ${targets.length} scheduled tracking check(s)...`);

    for (const b of targets) {
      try {
        const res = await executeScheduledScanForBusiness(b.id);
        results.push({
          businessName: res.businessName,
          keyword: res.keyword,
          delta: res.delta,
          alertsCount: res.alertsCount,
        });
        console.log(`[RankTracker] Completed check for "${b.name}" (${b.keyword || b.category}): Delta=${res.delta.avgSerpDelta >= 0 ? '+' : ''}${res.delta.avgSerpDelta}`);
      } catch (err: any) {
        const msg = `Error tracking ${b.name}: ${err?.message || err}`;
        console.error(`[RankTracker] ${msg}`);
        errors.push(msg);
      }
    }
  } finally {
    isJobRunning = false;
  }

  return { executedCount: results.length, results, errors };
}

/**
 * Returns diagnostic status of the rank tracker scheduler
 */
export function getSchedulerStatus(): SchedulerStatus {
  const all = listBusinesses();
  const tracked = all.filter((b) => b.trackingConfig?.enabled && b.trackingConfig.frequency !== 'off');
  const due = getDueBusinesses();
  const hasCreds = isDataForSeoConfigured();

  return {
    isRunning: Boolean(cronTask || periodicInterval),
    isJobExecuting: isJobRunning,
    totalBusinesses: all.length,
    totalTrackedBusinesses: tracked.length,
    dueTrackingCount: due.length,
    lastRunAt: lastSchedulerRun,
    mode: hasCreds ? 'live' : 'mock',
    hasDataForSeoCreds: hasCreds,
  };
}

/**
 * Initializes and starts the background job scheduler
 */
export function startRankTrackerScheduler(): void {
  if (cronTask || periodicInterval) {
    return; // Already initialized
  }

  console.log('[RankTracker] Initializing automated rank tracking scheduler...');

  // 1. Off-peak night run at 02:00 AM daily
  cronTask = cron.schedule('0 2 * * *', async () => {
    console.log('[RankTracker] Executing off-peak 02:00 AM scheduled rank checks...');
    await runPendingTrackingJobs(false);
  });

  // 2. Periodic runner every 15 minutes to process due items
  periodicInterval = setInterval(async () => {
    const due = getDueBusinesses();
    if (due.length > 0) {
      console.log(`[RankTracker] Found ${due.length} due tracking job(s). Executing batch...`);
      await runPendingTrackingJobs(false);
    }
  }, 15 * 60 * 1000);

  console.log('[RankTracker] Scheduler started: Off-peak daily (02:00 AM) + 15-minute queue processor active.');
}

export function stopRankTrackerScheduler(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
  if (periodicInterval) {
    clearInterval(periodicInterval);
    periodicInterval = null;
  }
  console.log('[RankTracker] Scheduler stopped.');
}
