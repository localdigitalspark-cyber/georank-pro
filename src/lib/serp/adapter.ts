/**
 * GeoRank Pro - Extensible SERP API Adapter & Geo-Decay Simulator
 * Path: /src/lib/serp/adapter.ts
 * 
 * Supports:
 * 1) Mock Mode: Realistic local geo-decay simulation where ranking drops as distance
 *    from the business centroid increases, with directional clustering and authentic competitor pools.
 * 2) Live Mode: Pluggable client ready for DataForSEO Google Local Maps API.
 */

import type { GridPoint } from '../geo/grid-generator.ts';
import {
  parseLocalSerpRank,
  type PinScanResult,
  type SerpLocalItem,
  type TargetBusinessIdentifier,
} from './serp-parser.ts';

export type SerpScanMode = 'mock' | 'live';

export interface SerpAdapterOptions {
  mode: SerpScanMode;
  target: TargetBusinessIdentifier;
  keyword: string;
  dataForSeoLogin?: string;
  dataForSeoPassword?: string;
}

export interface NodeScanOutput extends PinScanResult {
  nodeId: string;
  rowIndex: number;
  colIndex: number;
  lat: number;
  lng: number;
  distanceFromCenter: number;
  bearingDegrees: number;
  isCenter: boolean;
  checkUrl?: string;
  taskId?: string;
}

export interface GridScanSummary {
  scanId: string;
  createdAt: string;
  target: TargetBusinessIdentifier;
  keyword: string;
  mode: SerpScanMode;
  provider?: string;
  checkUrl?: string;
  checkUrls?: string[];
  taskId?: string;
  taskIds?: string[];
  rawCompetitors?: Array<{
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    place_id?: string;
    phone?: string;
    rank?: number;
    checkUrl?: string;
  }>;
  auditTrail?: {
    taskId?: string;
    provider: string;
    executedAt: string;
    checkUrls: string[];
    totalNodes: number;
    liveNodesCount: number;
    centerCoords: { lat: number; lng: number };
    keyword: string;
  };
  gridSize: number;
  distanceStep: number;
  unit: string;
  center: { lat: number; lng: number };
  totalNodes: number;
  averageRank: number;
  top3Count: number;
  top3Percentage: number;
  top10Count: number;
  top10Percentage: number;
  redZoneCount?: number;
  redZonePercentage?: number;
  unrankedCount: number;
  dominantCompetitors: Array<{
    name: string;
    avgRank: number;
    top3SharePercent: number;
    rating: number;
    reviews: number;
    category?: string;
  }>;
  nodes: NodeScanOutput[];
}

export interface KeywordPhysicsProfile {
  coreRank: number;
  decayMultiplier: number;
  greenRadiusKm: number;
  yellowRadiusKm: number;
}

/**
 * Calculates keyword intent weighting:
 * - Broad competitive keywords (e.g. "Plumber", "Phone Repair", "Roofing") experience faster decay (drop-off within 2–3 km).
 * - Specific/niche keywords (e.g. "Emergency Screen Replacement Brentwood", "Water Heater Repair") retain a wider green radius.
 */
export function getKeywordPhysicsProfile(
  keyword: string,
  profileOverride?: 'high-authority' | 'moderate' | 'displaced'
): KeywordPhysicsProfile {
  const kw = (keyword || '').toLowerCase().trim();
  const wordCount = kw.split(/\s+/).filter(Boolean).length;

  // Explicit profile override or broad competitive keywords (e.g. "Plumber", "Phone Repair", "24/7 Drain Cleaning")
  if (
    profileOverride === 'displaced' ||
    kw.includes('drain cleaning') ||
    /^(plumber|plumbing|phone repair|roofing|electrician|dentist|locksmith|hvac|mechanic|towing)$/i.test(kw)
  ) {
    // Faster decay (drop-off within 2–2.5 km)
    return {
      coreRank: 2,
      decayMultiplier: 1.45,
      greenRadiusKm: 0.7,
      yellowRadiusKm: 2.2,
    };
  }

  // Explicit profile override or specific / niche long-tail keywords (e.g. "Water Heater Repair", "Emergency Screen Replacement Brentwood")
  if (
    profileOverride === 'high-authority' ||
    kw.includes('water heater') ||
    kw.includes('tankless') ||
    kw.includes('screen replacement') ||
    kw.includes('brentwood') ||
    kw.includes('southampton') ||
    wordCount >= 4
  ) {
    // Specific/niche keyword retains a wider green radius
    return {
      coreRank: 1,
      decayMultiplier: 0.7,
      greenRadiusKm: 1.6,
      yellowRadiusKm: 4.0,
    };
  }

  // Standard/baseline keyword (e.g. "Emergency Plumber", "Commercial Plumbing")
  return {
    coreRank: 1,
    decayMultiplier: 1.0,
    greenRadiusKm: 1.0,
    yellowRadiusKm: 3.5,
  };
}

/**
 * Unified Geodesic Rank Model:
 * - Centroid origin: node closest to verified business (distance 0) represents core authority rank (1-3).
 * - Distance <= 1.0 km: High probability of top-tier rank (Rank 1–3, Green).
 * - Distance 1.0 km - 3.5 km: Mid-range decay (Rank 4–8/10, Yellow).
 * - Distance > 3.5 km: Strong centroid drop-off due to competitor proximity (Rank 9–20+, Red or Unranked).
 */
export function calculateProximityRank(
  point: {
    isCenter: boolean;
    distanceFromCenter: number;
    bearingFromCenterDegrees?: number;
    unit?: string;
  },
  keyword: string,
  baseCoreRank?: number,
  profileOverride?: 'high-authority' | 'moderate' | 'displaced'
): {
  rank: number | null;
  statusColor: 'green' | 'yellow' | 'red';
  rankDisplay: string;
  targetFound: boolean;
} {
  const physics = getKeywordPhysicsProfile(keyword, profileOverride);
  const coreRank = Math.max(1, Math.min(3, baseCoreRank || physics.coreRank));

  // Convert distance to km if unit is mi/miles
  const distKm =
    point.unit === 'mi' || point.unit === 'miles'
      ? point.distanceFromCenter * 1.60934
      : point.distanceFromCenter;

  // Center Node: verified business centroid authority
  if (point.isCenter || distKm < 0.05) {
    return {
      rank: coreRank,
      statusColor: 'green',
      rankDisplay: String(coreRank),
      targetFound: true,
    };
  }

  // Realistic directional skew based on geodesic bearing
  const bearing = point.bearingFromCenterDegrees ?? 0;
  const directionalSkew = Math.sin((bearing * Math.PI) / 180) * 0.25;
  const effectiveDist = Math.max(0.1, distKm * physics.decayMultiplier + directionalSkew);

  let rank: number;
  if (effectiveDist <= physics.greenRadiusKm) {
    // Distance <= 1.0 km (or keyword green radius): Rank 1-3 (Green)
    const ratio = effectiveDist / physics.greenRadiusKm;
    rank = Math.min(3, Math.max(coreRank, Math.round(coreRank + ratio * (3 - coreRank))));
  } else if (effectiveDist <= physics.yellowRadiusKm) {
    // Distance 1.0 km - 3.5 km (or keyword yellow radius): Rank 4-8/10 (Yellow)
    const yellowSpan = physics.yellowRadiusKm - physics.greenRadiusKm;
    const ratio = (effectiveDist - physics.greenRadiusKm) / (yellowSpan || 1);
    rank = Math.min(10, Math.max(4, Math.round(4 + ratio * 4.5)));
  } else {
    // Distance > 3.5 km: Rank 9-20+ (Red or Unranked)
    const excess = effectiveDist - physics.yellowRadiusKm;
    rank = Math.round(9 + excess * 3.5);
  }

  if (rank <= 20) {
    const statusColor = rank <= 3 ? 'green' : rank <= 10 ? 'yellow' : 'red';
    return {
      rank,
      statusColor,
      rankDisplay: String(rank),
      targetFound: true,
    };
  } else {
    return {
      rank: null,
      statusColor: 'red',
      rankDisplay: '>20',
      targetFound: false,
    };
  }
}

/** Realistic pool of local competitors for mock generation */
const COMPETITOR_NAME_POOL = [
  { name: 'Apex Premier Solutions', category: 'Local Service', baseRating: 4.9, baseReviews: 380 },
  { name: 'Capital City Express Masters', category: 'Service Contractor', baseRating: 4.8, baseReviews: 245 },
  { name: 'Lone Star Regional Pros', category: 'Commercial & Home Care', baseRating: 4.7, baseReviews: 210 },
  { name: 'Reliable Metro Direct', category: 'Specialist Services', baseRating: 4.6, baseReviews: 140 },
  { name: 'Blue Wave Local Group', category: 'Certified Technicians', baseRating: 4.5, baseReviews: 125 },
  { name: 'Precision Care Partners', category: 'Emergency Service', baseRating: 4.5, baseReviews: 95 },
  { name: 'Barton Springs Quality Co', category: 'Local Experts', baseRating: 4.4, baseReviews: 88 },
  { name: 'County Line Maintenance LLC', category: 'Repair Specialists', baseRating: 4.3, baseReviews: 64 },
  { name: 'Highland Park Direct', category: 'Fast Response Team', baseRating: 4.2, baseReviews: 50 },
  { name: 'Valley Creek Services', category: 'Home Solutions', baseRating: 4.1, baseReviews: 35 },
  { name: 'Oak Hill Fast Response', category: 'Technicians', baseRating: 4.0, baseReviews: 28 },
  { name: 'Riverside 24/7 Contractors', category: 'Emergency Services', baseRating: 3.9, baseReviews: 22 },
];

/**
 * Generates simulated 20-pack Google Local SERP results with realistic proximity decay.
 * Nearby coordinates maintain top ranks, while distant nodes experience rank degradation.
 */
export function generateMockSerpItemsForNode(
  target: TargetBusinessIdentifier,
  point: GridPoint,
  keyword: string
): SerpLocalItem[] {
  const items: SerpLocalItem[] = [];
  const targetName = target.businessName || 'Target Business';
  const targetDomain = target.domainOrUrl || 'targetbusiness.com';
  const targetPlaceId = target.placeId || 'ChIJ_target_place_id';

  // Apply calibrated geodesic rank decay
  const prox = calculateProximityRank(point, keyword, 1);
  const targetRankPosition = prox.targetFound && prox.rank !== null ? prox.rank : 22;

  // Populate competitor pool
  let compIdx = 0;
  for (let rank = 1; rank <= 20; rank++) {
    if (rank === targetRankPosition) {
      items.push({
        rank_position: rank,
        name: targetName,
        place_id: targetPlaceId,
        domain: targetDomain,
        url: `https://${targetDomain}`,
        address: `Centroid Pin (${point.lat}, ${point.lng})`,
        rating: 4.8,
        reviews: 145,
        category: keyword || 'Local Business',
        latitude: point.lat,
        longitude: point.lng,
      });
    } else {
      const compTemplate = COMPETITOR_NAME_POOL[compIdx % COMPETITOR_NAME_POOL.length];
      compIdx++;
      items.push({
        rank_position: rank,
        name: `${compTemplate.name} ${keyword ? keyword : ''}`.trim(),
        place_id: `ChIJ_comp_${point.rowIndex}_${point.colIndex}_${rank}`,
        domain: `${compTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        url: `https://${compTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        address: `${100 + rank * 12} Local Parkway, Suite ${rank * 4}`,
        rating: Number((compTemplate.baseRating - (rank * 0.03)).toFixed(1)),
        reviews: Math.max(5, compTemplate.baseReviews - rank * 8),
        category: keyword || compTemplate.category,
        latitude: point.lat,
        longitude: point.lng,
      });
    }
  }

  return items;
}

import {
  fetchDataForSeoLivePin,
  isDataForSeoConfigured,
} from './dataforseo-client.ts';

export { isDataForSeoConfigured };

/**
 * Live DataForSEO Google Local Maps SERP API caller.
 * Pluggable for production credentials.
 */
export async function fetchDataForSeoMapsSerp(
  lat: number,
  lng: number,
  keyword: string,
  login?: string,
  password?: string
): Promise<SerpLocalItem[]> {
  const res = await fetchDataForSeoLivePin(lat, lng, keyword, { login, password });
  return res.items;
}

/**
 * Scans a single coordinate node and extracts ranking data.
 */
export async function scanGridNode(
  options: SerpAdapterOptions,
  point: GridPoint
): Promise<NodeScanOutput> {
  let serpItems: SerpLocalItem[];
  let nodeCheckUrl: string | undefined;
  let nodeTaskId: string | undefined;

  if (options.mode === 'live') {
    // FAIL LOUDLY: Never silently fallback to mock data when user requested Live SERP!
    const liveResult = await fetchDataForSeoLivePin(
      point.lat,
      point.lng,
      options.keyword,
      {
        login: options.dataForSeoLogin,
        password: options.dataForSeoPassword,
      }
    );
    serpItems = liveResult.items;
    nodeCheckUrl = liveResult.checkUrl;
    nodeTaskId = liveResult.taskId;
  } else {
    serpItems = generateMockSerpItemsForNode(options.target, point, options.keyword);
  }

  const parsed = parseLocalSerpRank(options.target, serpItems);

  return {
    ...parsed,
    nodeId: point.id,
    rowIndex: point.rowIndex,
    colIndex: point.colIndex,
    lat: point.lat,
    lng: point.lng,
    distanceFromCenter: point.distanceFromCenter,
    bearingDegrees: point.bearingFromCenterDegrees,
    isCenter: point.isCenter,
    checkUrl: nodeCheckUrl,
    taskId: nodeTaskId,
  };
}

/**
 * Aggregates all node scan outputs into an overall GridScanSummary with competitor analytics.
 */
export function summarizeGridScan(
  scanId: string,
  target: TargetBusinessIdentifier,
  keyword: string,
  mode: SerpScanMode,
  gridSize: number,
  distanceStep: number,
  unit: string,
  center: { lat: number; lng: number },
  nodes: NodeScanOutput[]
): GridScanSummary {
  let rankSum = 0;
  let top3Count = 0;
  let top10Count = 0;
  let redZoneCount = 0;
  let unrankedCount = 0;

  const competitorWins: Record<string, { countTop3: number; ranks: number[]; rating: number; reviews: number; category?: string }> = {};

  nodes.forEach((n) => {
    // Treat unranked, null, or >20 as 21 for arithmetic mean calculation
    const r = (n.targetFound && n.rank !== null && n.rank <= 20) ? n.rank : 21;
    rankSum += r;
    if (r <= 3) top3Count++;
    if (r <= 10) top10Count++;
    if (r >= 11) redZoneCount++;
    if (r > 20 || !n.targetFound) unrankedCount++;

    // Track competitor presence
    n.topCompetitors.forEach((c) => {
      if (!competitorWins[c.name]) {
        competitorWins[c.name] = { countTop3: 0, ranks: [], rating: c.rating || 4.5, reviews: c.reviews || 50, category: c.category };
      }
      if (c.rank_position <= 3) {
        competitorWins[c.name].countTop3++;
      }
      competitorWins[c.name].ranks.push(c.rank_position);
    });
  });

  const total = nodes.length;
  const averageRank = Number((rankSum / (total || 1)).toFixed(1));
  const top3Percentage = Number(((top3Count / (total || 1)) * 100).toFixed(1));
  const top10Percentage = Number(((top10Count / (total || 1)) * 100).toFixed(1));
  const redZonePercentage = Number(((redZoneCount / (total || 1)) * 100).toFixed(1));

  // Sort dominant competitors by top 3 share
  const dominantCompetitors = Object.entries(competitorWins)
    .map(([name, data]) => ({
      name,
      avgRank: Number((data.ranks.reduce((a, b) => a + b, 0) / (data.ranks.length || 1)).toFixed(1)),
      top3SharePercent: Number(((data.countTop3 / (total || 1)) * 100).toFixed(1)),
      rating: data.rating,
      reviews: data.reviews,
      category: data.category,
    }))
    .sort((a, b) => b.top3SharePercent - a.top3SharePercent)
    .slice(0, 4);

  const checkUrls = nodes.map((n) => n.checkUrl).filter(Boolean) as string[];
  const taskIds = nodes.map((n) => n.taskId).filter(Boolean) as string[];
  const centerNode = nodes.find((n) => n.isCenter) || nodes[0];
  const primaryCheckUrl = centerNode?.checkUrl || checkUrls[0];
  const primaryTaskId = centerNode?.taskId || taskIds[0];

  const rawCompetitorList: Array<{
    name: string;
    rating?: number;
    reviews?: number;
    address?: string;
    place_id?: string;
    phone?: string;
    rank?: number;
    checkUrl?: string;
  }> = [];

  nodes.forEach((n) => {
    n.topCompetitors.forEach((c) => {
      rawCompetitorList.push({
        name: c.name,
        rating: c.rating,
        reviews: c.reviews,
        address: c.address,
        place_id: c.place_id,
        phone: c.phone,
        rank: c.rank_position,
        checkUrl: n.checkUrl,
      });
    });
  });

  return {
    scanId,
    createdAt: new Date().toISOString(),
    target,
    keyword,
    mode,
    provider: mode === 'live' ? 'DataForSEO (Google Maps Live Advanced)' : 'Geo-Decay Spatial Simulation',
    checkUrl: primaryCheckUrl,
    checkUrls,
    taskId: primaryTaskId,
    taskIds,
    rawCompetitors: rawCompetitorList,
    auditTrail: {
      taskId: primaryTaskId,
      provider: mode === 'live' ? 'DataForSEO (Google Maps Live Advanced)' : 'Geo-Decay Spatial Simulation',
      executedAt: new Date().toISOString(),
      checkUrls,
      totalNodes: total,
      liveNodesCount: checkUrls.length,
      centerCoords: center,
      keyword,
    },
    gridSize,
    distanceStep,
    unit,
    center,
    totalNodes: total,
    averageRank,
    top3Count,
    top3Percentage,
    top10Count,
    top10Percentage,
    redZoneCount,
    redZonePercentage,
    unrankedCount,
    dominantCompetitors,
    nodes,
  };
}
