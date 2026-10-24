/**
 * GeoRank Pro - SERP Parser
 * Path: /src/lib/serp/serp-parser.ts
 * 
 * Accurately parses a Google Maps / Local 20-Pack SERP response against target business identifiers:
 * 1) Google Place ID exact match
 * 2) Normalized root domain match
 * 3) Fuzzy business name match with legal suffix stripping (LLC, Inc, Ltd, etc.)
 */

export interface SerpLocalItem {
  rank_position: number;
  name: string;
  place_id?: string;
  cid?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  reviews_count?: number;
  url?: string;
  domain?: string;
  phone?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}

export interface TargetBusinessIdentifier {
  placeId?: string;
  cid?: string;
  businessName?: string;
  domainOrUrl?: string;
  website?: string;
}

export type RankStatusColor = 'green' | 'yellow' | 'red';

export interface PinScanResult {
  targetFound: boolean;
  rank: number | null; // 1-20 or null if >20
  rankDisplay: string; // "1", "2", ... "20", or ">20"
  statusColor: RankStatusColor; // 'green' (1-3), 'yellow' (4-10), 'red' (11+ / unranked)
  matchedBy: 'place_id' | 'domain' | 'business_name' | 'none';
  matchedBusiness: SerpLocalItem | null;
  topCompetitors: SerpLocalItem[]; // Top 3 dominant competitors excluding target
  totalResultsScanned: number;
  scannedAt: string;
}

export function normalizeDomain(rawUrlOrDomain?: string): string {
  if (!rawUrlOrDomain) return '';
  let str = rawUrlOrDomain.trim().toLowerCase();
  str = str.replace(/^(https?:\/\/)/i, '').replace(/^www\./i, '');
  const slashIdx = str.indexOf('/');
  if (slashIdx !== -1) str = str.substring(0, slashIdx);
  const queryIdx = str.indexOf('?');
  if (queryIdx !== -1) str = str.substring(0, queryIdx);
  return str.trim();
}

export function normalizeBusinessName(name?: string): string {
  if (!name) return '';
  let str = name.toLowerCase().trim();
  str = str.replace(/[&+,-]/g, ' ');
  str = str.replace(/[^a-z0-9\s]/g, '');
  str = str.replace(/\b(llc|inc|incorporated|corp|corporation|co|company|ltd|limited|services|group)\b/g, '');
  return str.replace(/\s+/g, ' ').trim();
}

export function isNameMatch(targetName: string, candidateName: string): boolean {
  const normTarget = normalizeBusinessName(targetName);
  const normCandidate = normalizeBusinessName(candidateName);

  if (!normTarget || !normCandidate) return false;
  if (normTarget === normCandidate) return true;

  if (normTarget.length >= 4 && (normCandidate.includes(normTarget) || normTarget.includes(normCandidate))) {
    return true;
  }

  const targetTokens = normTarget.split(' ').filter((t) => t.length > 2);
  const candidateTokens = new Set(normCandidate.split(' ').filter((t) => t.length > 2));
  if (targetTokens.length === 0) return false;

  const matchCount = targetTokens.filter((token) => candidateTokens.has(token)).length;
  return matchCount / targetTokens.length >= 0.75;
}

export function parseLocalSerpRank(
  target: TargetBusinessIdentifier,
  serpItems: SerpLocalItem[]
): PinScanResult {
  const items = [...serpItems].sort((a, b) => a.rank_position - b.rank_position);

  let matchedIndex = -1;
  let matchMethod: 'place_id' | 'domain' | 'business_name' | 'none' = 'none';

  const cleanTargetPlaceId = target.placeId?.trim()?.toLowerCase();
  const cleanTargetCid = target.cid?.trim()?.toLowerCase();
  const cleanTargetDomain = normalizeDomain(target.domainOrUrl || target.website);
  const cleanTargetName = target.businessName?.trim();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPlaceId = item.place_id?.trim()?.toLowerCase();
    const itemCid = item.cid?.trim()?.toLowerCase();

    // Priority 1: Exact Place ID or CID (case-insensitive)
    if (
      (cleanTargetPlaceId && (itemPlaceId === cleanTargetPlaceId || itemCid === cleanTargetPlaceId)) ||
      (cleanTargetCid && (itemCid === cleanTargetCid || itemPlaceId === cleanTargetCid))
    ) {
      matchedIndex = i;
      matchMethod = 'place_id';
      break;
    }

    // Priority 2: Domain / URL match
    if (cleanTargetDomain) {
      const itemDomain = normalizeDomain(item.domain || item.url);
      if (
        itemDomain &&
        (itemDomain === cleanTargetDomain ||
          itemDomain.endsWith(`.${cleanTargetDomain}`) ||
          cleanTargetDomain.endsWith(`.${itemDomain}`))
      ) {
        matchedIndex = i;
        matchMethod = 'domain';
        break;
      }
    }

    // Priority 3: Fuzzy business name
    if (cleanTargetName && isNameMatch(cleanTargetName, item.name)) {
      matchedIndex = i;
      matchMethod = 'business_name';
      break;
    }
  }

  const targetFound = matchedIndex !== -1;
  const matchedItem = targetFound ? items[matchedIndex] : null;
  const rank = matchedItem ? matchedItem.rank_position : null;

  let statusColor: RankStatusColor = 'red';
  let rankDisplay = '>20';

  if (rank !== null) {
    rankDisplay = String(rank);
    if (rank >= 1 && rank <= 3) statusColor = 'green';
    else if (rank >= 4 && rank <= 10) statusColor = 'yellow';
    else statusColor = 'red';
  }

  // Top 3 competing businesses (excluding target business)
  const competitors = items
    .filter((_, idx) => idx !== matchedIndex)
    .slice(0, 3);

  return {
    targetFound,
    rank,
    rankDisplay,
    statusColor,
    matchedBy: matchMethod,
    matchedBusiness: matchedItem,
    topCompetitors: competitors,
    totalResultsScanned: items.length,
    scannedAt: new Date().toISOString(),
  };
}

export const matchTargetBusiness = parseLocalSerpRank;
