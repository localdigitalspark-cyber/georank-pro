/**
 * GeoRank Pro / ProfitMaps AI - Multi-Keyword Geo-Grid Generator & Cache
 * Path: /src/lib/geo/keyword-scans.ts
 *
 * Generates and caches distinct, realistic rank grids for multiple keywords.
 * - "Emergency Plumber": Centroid lock-in, moderate dropoff (#7.1 Avg, 16% 3-pack).
 * - "24/7 Drain Cleaning": Heavy displacement by competitors (#11.2 Avg, 8% 3-pack).
 * - "Water Heater Repair": Strong local authority (#3.4 Avg, 36% 3-pack, cluster of green pins).
 */

import { generateGeoGrid, type DistanceUnit, type GridPoint } from './grid-generator.ts';
import {
  calculateProximityRank,
  type GridScanSummary,
  type NodeScanOutput,
  type SerpScanMode,
} from '../serp/adapter.ts';
import { generateDeterministicAudit, type LocalSeoAuditOutput } from '../ai/audit-generator.ts';

export interface KeywordScanEntry {
  keyword: string;
  summary: GridScanSummary;
  audit: LocalSeoAuditOutput;
  lastScannedAt?: string;
}

export interface KeywordProfileConfig {
  keyword: string;
  targetRankProfile: 'high-authority' | 'moderate' | 'displaced';
  competitors: Array<{
    name: string;
    avgRank: number;
    top3SharePercent: number;
    rating: number;
    reviews: number;
    category: string;
  }>;
}

const DEFAULT_KEYWORD_PROFILES: Record<string, KeywordProfileConfig> = {
  'Emergency Plumber': {
    keyword: 'Emergency Plumber',
    targetRankProfile: 'moderate',
    competitors: [
      { name: 'Apex Premier Solutions', avgRank: 2.1, top3SharePercent: 64.0, rating: 4.9, reviews: 342, category: 'Emergency Plumber' },
      { name: 'Capital City Express Masters', avgRank: 3.4, top3SharePercent: 48.0, rating: 4.8, reviews: 215, category: 'Emergency Plumber' },
      { name: 'Lone Star Regional Pros', avgRank: 4.2, top3SharePercent: 36.0, rating: 4.7, reviews: 189, category: 'Plumbing Service' },
      { name: 'Reliable Metro Direct', avgRank: 5.5, top3SharePercent: 24.0, rating: 4.6, reviews: 140, category: 'Plumber' },
    ],
  },
  '24/7 Drain Cleaning': {
    keyword: '24/7 Drain Cleaning',
    targetRankProfile: 'displaced',
    competitors: [
      { name: 'Rooter Hero Drain Masters', avgRank: 1.8, top3SharePercent: 76.0, rating: 4.9, reviews: 420, category: 'Drain Cleaning' },
      { name: 'Austin Hydro-Jetting Pros', avgRank: 2.9, top3SharePercent: 60.0, rating: 4.8, reviews: 310, category: 'Sewer & Drain' },
      { name: 'Clog Free Texas Solutions', avgRank: 3.6, top3SharePercent: 44.0, rating: 4.7, reviews: 195, category: 'Drain Cleaning' },
      { name: 'ClearFlow Pipe Relining', avgRank: 5.1, top3SharePercent: 28.0, rating: 4.6, reviews: 115, category: 'Plumbing Service' },
    ],
  },
  'Water Heater Repair': {
    keyword: 'Water Heater Repair',
    targetRankProfile: 'high-authority',
    competitors: [
      { name: 'Hot Water Tank Specialists', avgRank: 3.1, top3SharePercent: 40.0, rating: 4.8, reviews: 280, category: 'Water Heaters' },
      { name: 'Tankless Austin Masters', avgRank: 4.5, top3SharePercent: 32.0, rating: 4.7, reviews: 190, category: 'Water Heaters' },
      { name: 'Hill Country Heating & Plumbing', avgRank: 5.8, top3SharePercent: 20.0, rating: 4.6, reviews: 145, category: 'Plumber' },
    ],
  },
};

/**
 * Builds a realistic GridScanSummary for a specific keyword profile.
 */
export function buildKeywordGridScan(params: {
  businessName: string;
  keyword: string;
  center: { lat: number; lng: number };
  gridSize?: number;
  distanceStep?: number;
  unit?: DistanceUnit;
  mode?: SerpScanMode;
}): KeywordScanEntry {
  const {
    businessName,
    keyword,
    center,
    gridSize = 5,
    distanceStep = 1.0,
    unit = 'km',
    mode = 'mock',
  } = params;

  const profileConfig = DEFAULT_KEYWORD_PROFILES[keyword] || {
    keyword,
    targetRankProfile: 'moderate' as const,
    competitors: [
      { name: `${keyword} Pro Masters`, avgRank: 2.4, top3SharePercent: 52.0, rating: 4.8, reviews: 260, category: keyword },
      { name: `Capital City ${keyword}`, avgRank: 3.6, top3SharePercent: 44.0, rating: 4.7, reviews: 180, category: keyword },
      { name: `Lone Star ${keyword} Co`, avgRank: 4.8, top3SharePercent: 30.0, rating: 4.6, reviews: 130, category: keyword },
    ],
  };

  const grid = generateGeoGrid({ center, gridSize, distanceStep, unit });

  // Compute node ranks based on unified proximity physics and keyword weighting
  const nodes: NodeScanOutput[] = grid.points.map((pt) => {
    const coreRank =
      profileConfig.targetRankProfile === 'high-authority' ? 1 :
      profileConfig.targetRankProfile === 'moderate' ? 1 : 2;

    const prox = calculateProximityRank(
      {
        isCenter: pt.isCenter,
        distanceFromCenter: pt.distanceFromCenter,
        bearingFromCenterDegrees: pt.bearingFromCenterDegrees,
        unit,
      },
      keyword,
      coreRank,
      profileConfig.targetRankProfile
    );

    const rank = prox.rank;
    const targetFound = prox.targetFound;
    const rankDisplay = prox.rankDisplay;
    const statusColor = prox.statusColor;

    // Mock competitors for this node
    const topCompetitors = profileConfig.competitors.slice(0, 3).map((comp, idx) => ({
      rank_position: rank !== null && rank <= 3 && idx === 0 ? 2 : idx + 1,
      name: comp.name,
      place_id: `ChIJ_comp_${pt.rowIndex}_${pt.colIndex}_${idx}`,
      address: `${100 + (idx + 1) * 20} Local St, Metro Area`,
      rating: comp.rating,
      reviews: comp.reviews,
      domain: `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      url: `https://${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: '(512) 555-0199',
      category: comp.category,
      latitude: pt.lat,
      longitude: pt.lng,
    }));

    return {
      nodeId: pt.id,
      rowIndex: pt.rowIndex,
      colIndex: pt.colIndex,
      lat: pt.lat,
      lng: pt.lng,
      isCenter: pt.isCenter,
      distanceFromCenter: pt.distanceFromCenter,
      bearingDegrees: pt.bearingFromCenterDegrees,
      targetFound,
      rank: targetFound && rank !== null && rank <= 20 ? rank : null,
      rankDisplay,
      statusColor,
      matchedBy: targetFound ? ('business_name' as const) : ('none' as const),
      matchedBusiness: targetFound && rank !== null
        ? {
            rank_position: rank,
            name: businessName,
            place_id: 'ChIJ_target_centroid',
            address: `Centroid Pin (${pt.lat}, ${pt.lng})`,
            rating: 4.9,
            reviews: 145,
            domain: 'targetplumbing.com',
            url: 'https://targetplumbing.com',
            phone: '(512) 555-0100',
            category: keyword,
            latitude: pt.lat,
            longitude: pt.lng,
          }
        : null,
      topCompetitors,
      totalResultsScanned: 20,
      scannedAt: new Date().toISOString(),
    };
  });

  // Calculate telemetry metrics using unified mathematical formulas
  const totalNodes = nodes.length;
  let rankSum = 0;
  let top3Count = 0;
  let top10Count = 0;
  let redZoneCount = 0;
  let unrankedCount = 0;

  nodes.forEach((n) => {
    // Treat unranked or null as 21 for arithmetic mean calculation
    const r = (n.targetFound && n.rank !== null && n.rank <= 20) ? n.rank : 21;
    rankSum += r;
    if (r <= 3) top3Count++;
    if (r <= 10) top10Count++;
    if (r >= 11) redZoneCount++;
    if (r > 20 || !n.targetFound) unrankedCount++;
  });

  const averageRank = Number((rankSum / totalNodes).toFixed(1));
  const top3Percentage = Number(((top3Count / totalNodes) * 100).toFixed(1));
  const top10Percentage = Number(((top10Count / totalNodes) * 100).toFixed(1));
  const redZonePercentage = Number(((redZoneCount / totalNodes) * 100).toFixed(1));

  const scanId = `scan_${keyword.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

  const summary: GridScanSummary = {
    scanId,
    createdAt: new Date().toISOString(),
    target: { businessName },
    keyword,
    mode,
    gridSize,
    distanceStep,
    unit,
    center,
    totalNodes,
    averageRank,
    top3Count,
    top3Percentage,
    top10Count,
    top10Percentage,
    redZoneCount,
    redZonePercentage,
    unrankedCount,
    dominantCompetitors: profileConfig.competitors,
    nodes,
  };

  const audit = generateDeterministicAudit({
    businessName,
    category: keyword,
    metrics: {
      averageRank,
      top3Percentage,
      totalNodesScanned: totalNodes,
      gridSpanDescription: `${gridSize}x${gridSize} grid across ${(distanceStep * gridSize).toFixed(1)} ${unit} radius`,
      targetMarket: 'Metro Area',
    },
    topCompetitorsInWeakZones: profileConfig.competitors,
  });

  return { keyword, summary, audit };
}

/**
 * Generates the full initial dictionary of cached keyword scans for a business.
 */
export function buildInitialKeywordScanCache(params: {
  businessName: string;
  center: { lat: number; lng: number };
  gridSize?: number;
  distanceStep?: number;
  unit?: DistanceUnit;
  mode?: SerpScanMode;
}): Record<string, KeywordScanEntry> {
  const initialKeywords = ['Emergency Plumber', '24/7 Drain Cleaning', 'Water Heater Repair'];
  const cache: Record<string, KeywordScanEntry> = {};

  for (const kw of initialKeywords) {
    cache[kw] = buildKeywordGridScan({
      ...params,
      keyword: kw,
    });
  }

  return cache;
}
