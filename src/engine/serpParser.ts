/**
 * DataForSEO / SERP API Google Local Maps Rank Parser
 * 
 * Accurately parses a Google Maps / Local SERP response (such as from DataForSEO
 * Google Maps SERP API, SerpApi, or BrightData) against target business identifiers:
 * - Google Place ID
 * - Business Name (with fuzzy legal suffix and character normalization)
 * - Domain or Website URL
 * 
 * Returns rank position (1-20 or >20), top 3 competing businesses, and color status.
 */

export interface SerpLocalItem {
  rank_position: number;
  name: string;
  place_id?: string;
  cid?: string;
  address?: string;
  rating?: number;
  reviews?: number; // review count
  reviews_count?: number; // alias for DataForSEO compatibility
  url?: string;
  domain?: string;
  phone?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}

export interface TargetBusinessIdentifier {
  /** Google Place ID (e.g. ChIJN1t_tDeuEmsRUsoyG83frY4) */
  placeId?: string;
  /** Business Name (e.g. "Austin Premier Plumbing LLC") */
  businessName?: string;
  /** Website URL or domain (e.g. "https://austinpremierplumbing.com") */
  domainOrUrl?: string;
}

export type RankStatusColor = 'green' | 'yellow' | 'red';

export interface PinScanResult {
  /** True if business was discovered within the scanned SERP results (typically 1-20) */
  targetFound: boolean;
  /** Numerical rank position (1-20) or null if unranked/outside top 20 */
  rank: number | null;
  /** User-friendly rank string: "1"..."20", or ">20" */
  rankDisplay: string;
  /** Local SEO Geo-Grid status indicator: green (1-3), yellow (4-10), red (11+ / not found) */
  statusColor: RankStatusColor;
  /** How the target was identified */
  matchedBy: 'place_id' | 'domain' | 'business_name' | 'none';
  /** The full matched SERP item for the target business */
  matchedBusiness: SerpLocalItem | null;
  /** Top 3 competing businesses in this search locale (excluding target) */
  topCompetitors: SerpLocalItem[];
  /** Total SERP items scanned (normally 20) */
  totalResultsScanned: number;
  /** Scanned timestamp */
  scannedAt: string;
}

/**
 * Normalizes domain strings:
 * - Strips protocol (http://, https://)
 * - Strips leading 'www.'
 * - Strips trailing slashes and paths to isolate root hostname
 */
export function normalizeDomain(rawUrlOrDomain?: string): string {
  if (!rawUrlOrDomain) return '';
  let str = rawUrlOrDomain.trim().toLowerCase();
  // Strip protocol
  str = str.replace(/^(https?:\/\/)/i, '');
  // Strip www.
  str = str.replace(/^www\./i, '');
  // Extract hostname before any slash, query, or hash
  const slashIdx = str.indexOf('/');
  if (slashIdx !== -1) {
    str = str.substring(0, slashIdx);
  }
  const queryIdx = str.indexOf('?');
  if (queryIdx !== -1) {
    str = str.substring(0, queryIdx);
  }
  return str.trim();
}

/**
 * Normalizes business name for resilient matching:
 * - Removes punctuation, non-alphanumeric characters (except spaces)
 * - Strips common corporate suffixes (LLC, Inc, Corp, Co, Ltd, Company)
 * - Collapses multiple spaces to single space
 */
export function normalizeBusinessName(name?: string): string {
  if (!name) return '';
  let str = name.toLowerCase().trim();
  // Replace symbols like &, +, - with space
  str = str.replace(/[&+,-]/g, ' ');
  // Remove non-alphanumeric except spaces
  str = str.replace(/[^a-z0-9\s]/g, '');
  // Strip legal suffixes at word boundary
  str = str.replace(/\b(llc|inc|incorporated|corp|corporation|co|company|ltd|limited|services|group)\b/g, '');
  // Collapse whitespace
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Checks if target name matches SERP item name using normalized tokens.
 */
export function isNameMatch(targetName: string, candidateName: string): boolean {
  const normTarget = normalizeBusinessName(targetName);
  const normCandidate = normalizeBusinessName(candidateName);

  if (!normTarget || !normCandidate) return false;
  if (normTarget === normCandidate) return true;

  // Substring containment if sufficiently long
  if (normTarget.length >= 4 && (normCandidate.includes(normTarget) || normTarget.includes(normCandidate))) {
    return true;
  }

  // Token overlap check
  const targetTokens = normTarget.split(' ').filter(t => t.length > 2);
  const candidateTokens = new Set(normCandidate.split(' ').filter(t => t.length > 2));

  if (targetTokens.length === 0) return false;
  const matchCount = targetTokens.filter(token => candidateTokens.has(token)).length;

  // If 75% or more of significant words match
  return matchCount / targetTokens.length >= 0.75;
}

/**
 * Parses a Google Maps / Local SERP response to identify rank and competitors.
 * 
 * Status color thresholds:
 * - Green: Rank 1 - 3 (In Google 3-Pack; captures 70%+ of call volume)
 * - Yellow: Rank 4 - 10 (First page/view, but outside 3-pack)
 * - Red: Rank 11+ or not in top 20 (Severe visibility loss)
 */
export function parseLocalSerpRank(
  target: TargetBusinessIdentifier,
  serpItems: SerpLocalItem[]
): PinScanResult {
  const items = [...serpItems].sort((a, b) => a.rank_position - b.rank_position);

  let matchedIndex = -1;
  let matchMethod: 'place_id' | 'domain' | 'business_name' | 'none' = 'none';

  const cleanTargetPlaceId = target.placeId?.trim();
  const cleanTargetDomain = normalizeDomain(target.domainOrUrl);
  const cleanTargetName = target.businessName?.trim();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Priority 1: Google Place ID or CID (exact deterministic match, case-insensitive)
    if (
      cleanTargetPlaceId &&
      ((item.place_id && item.place_id.trim().toLowerCase() === cleanTargetPlaceId.toLowerCase()) ||
       (item.cid && item.cid.trim().toLowerCase() === cleanTargetPlaceId.toLowerCase()))
    ) {
      matchedIndex = i;
      matchMethod = 'place_id';
      break;
    }

    // Priority 2: Domain / Website match
    if (cleanTargetDomain) {
      const itemDomain = normalizeDomain(item.domain || item.url);
      if (itemDomain && (itemDomain === cleanTargetDomain || itemDomain.endsWith(`.${cleanTargetDomain}`) || cleanTargetDomain.endsWith(`.${itemDomain}`))) {
        matchedIndex = i;
        matchMethod = 'domain';
        break;
      }
    }

    // Priority 3: Normalized business name match
    if (cleanTargetName && isNameMatch(cleanTargetName, item.name)) {
      matchedIndex = i;
      matchMethod = 'business_name';
      break;
    }
  }

  const targetFound = matchedIndex !== -1;
  const matchedItem = targetFound ? items[matchedIndex] : null;
  const rank = matchedItem ? matchedItem.rank_position : null;

  // Status color calculation
  let statusColor: RankStatusColor = 'red';
  let rankDisplay = '>20';

  if (rank !== null) {
    rankDisplay = String(rank);
    if (rank >= 1 && rank <= 3) {
      statusColor = 'green';
    } else if (rank >= 4 && rank <= 10) {
      statusColor = 'yellow';
    } else {
      statusColor = 'red';
    }
  }

  // Identify top 3 competing businesses (excluding the target business if matched)
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

/**
 * Realistic Mock Google Local Maps 20-Pack SERP Data for testing
 */
export const MOCK_LOCAL_SERP_ITEMS: SerpLocalItem[] = [
  {
    rank_position: 1,
    name: "Apex Emergency Plumbing Austin",
    place_id: "ChIJ_apex_plumbing_01",
    address: "1024 Congress Ave, Austin, TX 78701",
    rating: 4.9,
    reviews: 342,
    domain: "apexplumbingaustin.com",
    url: "https://apexplumbingaustin.com",
    phone: "(512) 555-0199",
    category: "Plumber",
  },
  {
    rank_position: 2,
    name: "Capital City Water Heaters & Drains",
    place_id: "ChIJ_capital_city_02",
    address: "410 E 6th St, Austin, TX 78701",
    rating: 4.8,
    reviews: 215,
    domain: "capitalcityplumbing.com",
    url: "https://capitalcityplumbing.com",
    phone: "(512) 555-0142",
    category: "Plumber",
  },
  {
    rank_position: 3,
    name: "Lone Star Rooter Pros",
    place_id: "ChIJ_lonestar_pros_03",
    address: "2200 S Lamar Blvd, Austin, TX 78704",
    rating: 4.7,
    reviews: 189,
    domain: "lonestarrooter.com",
    url: "https://lonestarrooter.com",
    phone: "(512) 555-0188",
    category: "Plumbing Service",
  },
  {
    rank_position: 4,
    name: "Reliable Austin Drain Masters",
    place_id: "ChIJ_reliable_austin_04",
    address: "1500 E 11th St, Austin, TX 78702",
    rating: 4.6,
    reviews: 98,
    domain: "austindrainmasters.com",
    url: "https://austindrainmasters.com",
    phone: "(512) 555-0177",
    category: "Plumber",
  },
  {
    rank_position: 5,
    name: "Blue Wave Plumbing Co.",
    place_id: "ChIJ_bluewave_co_05",
    address: "3300 N Interstate 35, Austin, TX 78705",
    rating: 4.5,
    reviews: 124,
    domain: "bluewaveplumbingtx.com",
    url: "https://bluewaveplumbingtx.com",
    phone: "(512) 555-0166",
    category: "Plumber",
  },
  {
    rank_position: 6,
    name: "South Congress Plumbing & Gas",
    place_id: "ChIJ_soco_plumbing_06",
    address: "1805 S Congress Ave, Austin, TX 78704",
    rating: 4.6,
    reviews: 87,
    domain: "socoplumbing.com",
    url: "https://socoplumbing.com",
    phone: "(512) 555-0155",
    category: "Plumber",
  },
  {
    rank_position: 7,
    name: "Barton Springs Emergency Drain Co",
    place_id: "ChIJ_barton_springs_07",
    address: "900 Barton Springs Rd, Austin, TX 78704",
    rating: 4.4,
    reviews: 63,
    domain: "bartonspringsplumbing.com",
    url: "https://bartonspringsplumbing.com",
    phone: "(512) 555-0133",
    category: "Drainage Service",
  },
  {
    rank_position: 8,
    name: "Austin Precision Pipe Repair",
    place_id: "ChIJ_austin_precision_08",
    address: "2400 E Cesar Chavez St, Austin, TX 78702",
    rating: 4.3,
    reviews: 52,
    domain: "austinprecisionpiperepair.com",
    url: "https://austinprecisionpiperepair.com",
    phone: "(512) 555-0122",
    category: "Plumber",
  },
  {
    rank_position: 9,
    name: "Highland Park Plumbers LLC",
    place_id: "ChIJ_highland_park_09",
    address: "5600 Airport Blvd, Austin, TX 78751",
    rating: 4.5,
    reviews: 44,
    domain: "highlandparkplumberstx.com",
    url: "https://highlandparkplumberstx.com",
    phone: "(512) 555-0111",
    category: "Plumber",
  },
  {
    rank_position: 10,
    name: "Zilker Commercial & Home Plumbing",
    place_id: "ChIJ_zilker_plumbing_10",
    address: "2100 Barton Hills Dr, Austin, TX 78704",
    rating: 4.2,
    reviews: 39,
    domain: "zilkerplumbing.com",
    url: "https://zilkerplumbing.com",
    phone: "(512) 555-0100",
    category: "Plumber",
  },
  {
    rank_position: 11,
    name: "Oak Hill Express Rooter",
    place_id: "ChIJ_oak_hill_11",
    address: "6800 US-290, Austin, TX 78735",
    rating: 4.1,
    reviews: 31,
    domain: "oakhillrooter.com",
    url: "https://oakhillrooter.com",
    phone: "(512) 555-0101",
    category: "Plumber",
  },
  {
    rank_position: 12,
    name: "Travis County Leak Detection",
    place_id: "ChIJ_travis_leak_12",
    address: "1200 Lavaca St, Austin, TX 78701",
    rating: 4.0,
    reviews: 28,
    domain: "traviscountyleak.com",
    url: "https://traviscountyleak.com",
    phone: "(512) 555-0102",
    category: "Plumbing Inspector",
  },
  {
    rank_position: 13,
    name: "Red River Plumbing Solutions",
    place_id: "ChIJ_red_river_13",
    address: "700 Red River St, Austin, TX 78701",
    rating: 3.9,
    reviews: 22,
    domain: "redriverplumbing.com",
    url: "https://redriverplumbing.com",
    phone: "(512) 555-0103",
    category: "Plumber",
  },
  {
    rank_position: 14,
    name: "Riverside 24/7 Plumber",
    place_id: "ChIJ_riverside_plumber_14",
    address: "1900 E Riverside Dr, Austin, TX 78741",
    rating: 3.8,
    reviews: 19,
    domain: "riverside247plumbing.com",
    url: "https://riverside247plumbing.com",
    phone: "(512) 555-0104",
    category: "Plumber",
  },
  {
    rank_position: 15,
    name: "Mueller Green Plumbing",
    place_id: "ChIJ_mueller_green_15",
    address: "4500 Mueller Blvd, Austin, TX 78723",
    rating: 4.7,
    reviews: 15,
    domain: "muellergreenplumbing.com",
    url: "https://muellergreenplumbing.com",
    phone: "(512) 555-0105",
    category: "Plumber",
  },
  {
    rank_position: 16,
    name: "FastFlow Sewer & Septic",
    place_id: "ChIJ_fastflow_sewer_16",
    address: "3100 Montopolis Dr, Austin, TX 78741",
    rating: 3.7,
    reviews: 14,
    domain: "fastflowsewer.com",
    url: "https://fastflowsewer.com",
    phone: "(512) 555-0106",
    category: "Septic System Service",
  },
  {
    rank_position: 17,
    name: "Rainey Street Pipe Crafters",
    place_id: "ChIJ_rainey_pipes_17",
    address: "80 Rainey St, Austin, TX 78701",
    rating: 4.0,
    reviews: 11,
    domain: "raineypipeaustin.com",
    url: "https://raineypipeaustin.com",
    phone: "(512) 555-0107",
    category: "Plumber",
  },
  {
    rank_position: 18,
    name: "Enfield Residential Plumbing",
    place_id: "ChIJ_enfield_plumbing_18",
    address: "1400 Enfield Rd, Austin, TX 78703",
    rating: 4.2,
    reviews: 8,
    domain: "enfieldplumbing.com",
    url: "https://enfieldplumbing.com",
    phone: "(512) 555-0108",
    category: "Plumber",
  },
  {
    rank_position: 19,
    name: "Hyde Park Drain & Faucet",
    place_id: "ChIJ_hydepark_drain_19",
    address: "4000 Guadalupe St, Austin, TX 78751",
    rating: 3.6,
    reviews: 7,
    domain: "hydeparkdrain.com",
    url: "https://hydeparkdrain.com",
    phone: "(512) 555-0109",
    category: "Plumber",
  },
  {
    rank_position: 20,
    name: "South Lamar Affordable Plumbers",
    place_id: "ChIJ_solamar_afford_20",
    address: "3000 S Lamar Blvd, Austin, TX 78704",
    rating: 3.5,
    reviews: 6,
    domain: "solamaraffordableplumbing.com",
    url: "https://solamaraffordableplumbing.com",
    phone: "(512) 555-0110",
    category: "Plumber",
  },
];
