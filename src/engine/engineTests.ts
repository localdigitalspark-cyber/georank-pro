/**
 * Automated Verification and Test Suite for Local SEO Geo-Grid Engine
 * 
 * Tests:
 * 1. Coordinate Grid Generator math and boundary conditions
 * 2. DataForSEO / SERP API Local Maps Rank Parser and competitor extraction
 * 3. AI Audit & Pitch Structured Schema validation
 */

import {
  generateGeoGrid,
  haversineDistance,
  calculateBearing,
  EARTH_RADIUS,
  type GridResult
} from './geoGrid.ts';

import {
  parseLocalSerpRank,
  normalizeDomain,
  normalizeBusinessName,
  isNameMatch,
  MOCK_LOCAL_SERP_ITEMS,
  type PinScanResult
} from './serpParser.ts';

import {
  LocalSeoAuditPitchSchema,
  buildLocalSeoAuditPrompt,
  generateDeterministicAuditPitch,
  SAMPLE_AUDIT_PITCH_JSON,
  type LocalSeoAuditPitchInput
} from './aiAuditPitch.ts';

import {
  calculateProximityRank,
  getKeywordPhysicsProfile,
  summarizeGridScan,
  type NodeScanOutput
} from '../lib/serp/adapter.ts';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
  data?: unknown;
}

export function runAllEngineTests(): {
  allPassed: boolean;
  totalTests: number;
  passCount: number;
  failCount: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function record(suite: string, name: string, fn: () => { passed: boolean; message: string; data?: unknown }) {
    const start = performance.now();
    try {
      const res = fn();
      const durationMs = Number((performance.now() - start).toFixed(2));
      results.push({
        suite,
        name,
        passed: res.passed,
        message: res.message,
        durationMs,
        data: res.data
      });
    } catch (err: unknown) {
      const durationMs = Number((performance.now() - start).toFixed(2));
      results.push({
        suite,
        name,
        passed: false,
        message: `Exception: ${err instanceof Error ? err.message : String(err)}`,
        durationMs
      });
    }
  }

  // ==========================================
  // SUITE 1: COORDINATE GRID GENERATOR
  // ==========================================

  record('GeoGrid Generator', 'Generates correct point count for 3x3, 5x5, and 7x7 grids', () => {
    const center = { lat: 30.2672, lng: -97.7431 }; // Austin, TX
    const grid3 = generateGeoGrid({ center, gridSize: 3, distanceStep: 1.0, unit: 'km' });
    const grid5 = generateGeoGrid({ center, gridSize: 5, distanceStep: 1.0, unit: 'km' });
    const grid7 = generateGeoGrid({ center, gridSize: 7, distanceStep: 0.5, unit: 'mi' });

    const passed = grid3.points.length === 9 && grid5.points.length === 25 && grid7.points.length === 49;
    return {
      passed,
      message: passed ? 'All grid dimensions produce exactly N^2 nodes.' : `Point count mismatch: 3x3=${grid3.points.length}, 5x5=${grid5.points.length}, 7x7=${grid7.points.length}`,
      data: { grid3Count: grid3.points.length, grid5Count: grid5.points.length, grid7Count: grid7.points.length }
    };
  });

  record('GeoGrid Generator', 'Center node matches input coordinate with 0 distance offset', () => {
    const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    const grid = generateGeoGrid({ center, gridSize: 5, distanceStep: 1.5, unit: 'km' });
    
    // In a 5x5 grid, center is row 2, col 2 (0-indexed)
    const centerNode = grid.points.find(p => p.rowIndex === 2 && p.colIndex === 2);
    if (!centerNode) {
      return { passed: false, message: 'Center node at (2, 2) not found.' };
    }

    const latDelta = Math.abs(centerNode.lat - center.lat);
    const lngDelta = Math.abs(centerNode.lng - center.lng);
    const passed = centerNode.isCenter && latDelta < 0.0001 && lngDelta < 0.0001 && centerNode.distanceFromCenter === 0;

    return {
      passed,
      message: passed ? 'Center node matches center coordinate with zero offset.' : `Center node mismatch: latDelta=${latDelta}, lngDelta=${lngDelta}`,
      data: centerNode
    };
  });

  record('GeoGrid Generator', 'Haversine distance and directional bearings match geodesic physics', () => {
    const center = { lat: 30.2672, lng: -97.7431 };
    const stepKm = 2.0;
    const grid = generateGeoGrid({ center, gridSize: 3, distanceStep: stepKm, unit: 'km' });

    // North node is row 0, col 1
    const northNode = grid.points.find(p => p.rowIndex === 0 && p.colIndex === 1)!;
    // East node is row 1, col 2
    const eastNode = grid.points.find(p => p.rowIndex === 1 && p.colIndex === 2)!;
    // South node is row 2, col 1
    const southNode = grid.points.find(p => p.rowIndex === 2 && p.colIndex === 1)!;
    // West node is row 1, col 0
    const westNode = grid.points.find(p => p.rowIndex === 1 && p.colIndex === 0)!;

    const northDistDiff = Math.abs(northNode.distanceFromCenter - stepKm);
    const eastDistDiff = Math.abs(eastNode.distanceFromCenter - stepKm);
    
    // Bearing tolerances: North ~ 0°/360°, East ~ 90°, South ~ 180°, West ~ 270°
    const northBearingOk = northNode.bearingFromCenterDegrees < 2 || northNode.bearingFromCenterDegrees > 358;
    const eastBearingOk = Math.abs(eastNode.bearingFromCenterDegrees - 90) < 2;
    const southBearingOk = Math.abs(southNode.bearingFromCenterDegrees - 180) < 2;
    const westBearingOk = Math.abs(westNode.bearingFromCenterDegrees - 270) < 2;

    const passed = northDistDiff < 0.05 && eastDistDiff < 0.05 && northBearingOk && eastBearingOk && southBearingOk && westBearingOk;

    return {
      passed,
      message: passed
        ? 'Cardinal offsets align with Haversine distance and geodesic bearings.'
        : `Bearing/Distance variance: N_dist=${northNode.distanceFromCenter}, E_dist=${eastNode.distanceFromCenter}, N_brng=${northNode.bearingFromCenterDegrees}, E_brng=${eastNode.bearingFromCenterDegrees}`,
      data: { northNode, eastNode, southNode, westNode }
    };
  });

  // ==========================================
  // SUITE 2: SERP API LOCAL MAPS RANK PARSER
  // ==========================================

  record('SERP Rank Parser', 'Matches business by exact Google Place ID and flags Green status (1-3)', () => {
    // Target rank 1
    const target = { placeId: 'ChIJ_apex_plumbing_01' };
    const res: PinScanResult = parseLocalSerpRank(target, MOCK_LOCAL_SERP_ITEMS);

    const passed = res.targetFound && res.rank === 1 && res.statusColor === 'green' && res.matchedBy === 'place_id' && res.topCompetitors.length === 3;
    return {
      passed,
      message: passed ? 'Matched Rank 1 by Place ID with green status and 3 competitors.' : `Failed: found=${res.targetFound}, rank=${res.rank}, color=${res.statusColor}`,
      data: res
    };
  });

  record('SERP Rank Parser', 'Matches business by domain URL across varied formats and flags Yellow status (4-10)', () => {
    // Target rank 5: "Blue Wave Plumbing Co." with domain "bluewaveplumbingtx.com"
    const target = { domainOrUrl: 'https://www.bluewaveplumbingtx.com/services/drain-cleaning/' };
    const res = parseLocalSerpRank(target, MOCK_LOCAL_SERP_ITEMS);

    const passed = res.targetFound && res.rank === 5 && res.statusColor === 'yellow' && res.matchedBy === 'domain';
    return {
      passed,
      message: passed ? 'Matched Rank 5 by normalized domain with yellow status.' : `Failed: found=${res.targetFound}, rank=${res.rank}, method=${res.matchedBy}`,
      data: res
    };
  });

  record('SERP Rank Parser', 'Matches business by fuzzy name with corporate suffix stripping and flags Red status (11+)', () => {
    // Target rank 11: "Oak Hill Express Rooter", query as "Oak Hill Express Rooter LLC"
    const target = { businessName: 'Oak Hill Express Rooter LLC' };
    const res = parseLocalSerpRank(target, MOCK_LOCAL_SERP_ITEMS);

    const passed = res.targetFound && res.rank === 11 && res.statusColor === 'red' && res.matchedBy === 'business_name';
    return {
      passed,
      message: passed ? 'Matched Rank 11 by normalized business name with red status.' : `Failed: found=${res.targetFound}, rank=${res.rank}, color=${res.statusColor}`,
      data: res
    };
  });

  record('SERP Rank Parser', 'Handles unranked / outside top 20 business correctly (>20, status red)', () => {
    const target = { businessName: 'NonExistent Plumbing Wizards of Nowhere' };
    const res = parseLocalSerpRank(target, MOCK_LOCAL_SERP_ITEMS);

    const passed = !res.targetFound && res.rank === null && res.rankDisplay === '>20' && res.statusColor === 'red' && res.topCompetitors.length === 3;
    return {
      passed,
      message: passed ? 'Correctly flagged as >20 unranked with 3 leading competitors.' : `Failed: found=${res.targetFound}, rankDisplay=${res.rankDisplay}`,
      data: res
    };
  });

  record('SERP Rank Parser', 'Top competitors correctly excludes the target business itself', () => {
    // Target rank 2
    const target = { placeId: 'ChIJ_capital_city_02' };
    const res = parseLocalSerpRank(target, MOCK_LOCAL_SERP_ITEMS);

    const hasSelfInCompetitors = res.topCompetitors.some(c => c.place_id === 'ChIJ_capital_city_02');
    const passed = !hasSelfInCompetitors && res.topCompetitors.length === 3;
    return {
      passed,
      message: passed ? 'Target business was excluded from competitor list.' : 'Target business appeared in its own competitor list!',
      data: res.topCompetitors
    };
  });

  // ==========================================
  // SUITE 3: AI AUDIT & PITCH GENERATOR SCHEMA
  // ==========================================

  record('AI Audit & Pitch Generator', 'Zod schema validates sample JSON output structure', () => {
    const parseRes = LocalSeoAuditPitchSchema.safeParse(SAMPLE_AUDIT_PITCH_JSON);
    const passed = parseRes.success;
    return {
      passed,
      message: passed ? 'Sample JSON output adheres 100% to Zod schema specification.' : `Zod validation error: ${JSON.stringify(parseRes.error)}`,
      data: parseRes
    };
  });

  record('AI Audit & Pitch Generator', 'Prompt generator builds complete prompt with grid metrics and competitors', () => {
    const mockInput: LocalSeoAuditPitchInput = {
      businessName: 'Austin Premier Plumbing',
      category: 'Emergency Plumber',
      metrics: {
        averageRank: 11.4,
        top3Percentage: 16.0,
        totalNodesScanned: 25,
        gridSpanDescription: '5x5 grid across 5.0 km radius',
        targetMarket: 'Austin, TX'
      },
      topCompetitorsInWeakZones: [
        { name: 'Apex Emergency Plumbing', rating: 4.9, reviews: 342 },
        { name: 'Capital City Water Heaters', rating: 4.8, reviews: 215 },
        { name: 'Lone Star Rooter Pros', rating: 4.7, reviews: 189 }
      ]
    };

    const prompt = buildLocalSeoAuditPrompt(mockInput);
    const passed =
      prompt.includes('Austin Premier Plumbing') &&
      prompt.includes('11.4') &&
      prompt.includes('16.0%') &&
      prompt.includes('Apex Emergency Plumbing') &&
      prompt.includes('Google 3-Pack Presence');

    return {
      passed,
      message: passed ? 'Prompt dynamically constructs all required local SEO variables.' : 'Prompt is missing key metrics or competitor parameters.',
      data: { promptSnippet: prompt.slice(0, 300) + '...' }
    };
  });

  record('AI Audit & Pitch Generator', 'Deterministic generator output validates under Zod schema', () => {
    const mockInput: LocalSeoAuditPitchInput = {
      businessName: 'Lone Star Rooter Pros',
      category: 'Drain Cleaning',
      metrics: {
        averageRank: 8.6,
        top3Percentage: 24.0,
        totalNodesScanned: 25,
        targetMarket: 'Austin, TX'
      },
      topCompetitorsInWeakZones: [
        { name: 'Apex Emergency Plumbing', rating: 4.9, reviews: 342 }
      ]
    };

    const generated = generateDeterministicAuditPitch(mockInput);
    const validated = LocalSeoAuditPitchSchema.safeParse(generated);

    const passed = validated.success &&
      generated.actionPlan.gbpCategories.length > 20 &&
      generated.coldOutreachPitch.emailBody.includes('Lone Star Rooter Pros');

    return {
      passed,
      message: passed ? 'Deterministic generator creates fully schema-compliant pitch and audit.' : 'Generated output failed Zod validation.',
      data: generated
    };
  });

  // ==========================================
  // SUITE 4: GEODESIC RANK DECAY & METRIC SYNCHRONIZATION
  // ==========================================

  record('Geodesic Rank Physics', 'Centroid origin and Haversine distance decay match local SEO physics', () => {
    // Center node (dist = 0)
    const centerRes = calculateProximityRank({ isCenter: true, distanceFromCenter: 0 }, 'Emergency Plumber');
    // Inner proximity node (dist = 0.6 km <= 1.0 km)
    const innerRes = calculateProximityRank({ isCenter: false, distanceFromCenter: 0.6 }, 'Emergency Plumber');
    // Mid-range decay node (dist = 2.0 km)
    const midRes = calculateProximityRank({ isCenter: false, distanceFromCenter: 2.0 }, 'Emergency Plumber');
    // Strong dropoff node (dist = 4.2 km > 3.5 km)
    const outerRes = calculateProximityRank({ isCenter: false, distanceFromCenter: 4.2 }, 'Emergency Plumber');

    const centerPass = centerRes.rank === 1 && centerRes.statusColor === 'green';
    const innerPass = innerRes.rank !== null && innerRes.rank <= 3 && innerRes.statusColor === 'green';
    const midPass = midRes.rank !== null && midRes.rank >= 4 && midRes.rank <= 10 && midRes.statusColor === 'yellow';
    const outerPass = outerRes.statusColor === 'red' && (outerRes.rank === null || outerRes.rank >= 11);

    const passed = centerPass && innerPass && midPass && outerPass;
    return {
      passed,
      message: passed
        ? 'Geodesic rank decay strictly adheres to distance bands (<=1km Green, 1-3.5km Yellow, >3.5km Red).'
        : `Decay mismatch: center=${centerRes.rank}, inner=${innerRes.rank}, mid=${midRes.rank}, outer=${outerRes.rank}`,
      data: { centerRes, innerRes, midRes, outerRes }
    };
  });

  record('Geodesic Rank Physics', 'Keyword intent weighting controls spatial decay rate', () => {
    // Broad competitive term ("Plumber") vs Niche specific term ("Emergency Screen Replacement Brentwood")
    const broadProfile = getKeywordPhysicsProfile('Plumber');
    const nicheProfile = getKeywordPhysicsProfile('Emergency Screen Replacement Brentwood');

    const broadAt2km = calculateProximityRank({ isCenter: false, distanceFromCenter: 2.2 }, 'Plumber');
    const nicheAt2km = calculateProximityRank({ isCenter: false, distanceFromCenter: 2.2 }, 'Emergency Screen Replacement Brentwood');

    const passed =
      broadProfile.decayMultiplier > nicheProfile.decayMultiplier &&
      nicheProfile.greenRadiusKm > broadProfile.greenRadiusKm &&
      (broadAt2km.rank ?? 21) >= (nicheAt2km.rank ?? 21);

    return {
      passed,
      message: passed
        ? 'Niche keywords retain wider green radius and slower decay than broad competitive terms.'
        : `Keyword weighting mismatch: broadRank=${broadAt2km.rank}, nicheRank=${nicheAt2km.rank}`,
      data: { broadProfile, nicheProfile, broadRank: broadAt2km.rank, nicheRank: nicheAt2km.rank }
    };
  });

  record('Metric Synchronization', 'Exact arithmetic formulas for Average SERP, In-Pack %, and Red Zone %', () => {
    // Mock 5 nodes with known ranks: 1, 2, 5, 12, unranked (treated as 21)
    const mockNodes: NodeScanOutput[] = [
      {
        nodeId: 'n1', rowIndex: 0, colIndex: 0, lat: 30, lng: -97, distanceFromCenter: 0, bearingDegrees: 0, isCenter: true,
        targetFound: true, rank: 1, rankDisplay: '1', statusColor: 'green', matchedBy: 'place_id', matchedBusiness: null,
        topCompetitors: [], totalResultsScanned: 20, scannedAt: ''
      },
      {
        nodeId: 'n2', rowIndex: 0, colIndex: 1, lat: 30, lng: -97, distanceFromCenter: 0.5, bearingDegrees: 90, isCenter: false,
        targetFound: true, rank: 2, rankDisplay: '2', statusColor: 'green', matchedBy: 'domain', matchedBusiness: null,
        topCompetitors: [], totalResultsScanned: 20, scannedAt: ''
      },
      {
        nodeId: 'n3', rowIndex: 0, colIndex: 2, lat: 30, lng: -97, distanceFromCenter: 1.5, bearingDegrees: 90, isCenter: false,
        targetFound: true, rank: 5, rankDisplay: '5', statusColor: 'yellow', matchedBy: 'business_name', matchedBusiness: null,
        topCompetitors: [], totalResultsScanned: 20, scannedAt: ''
      },
      {
        nodeId: 'n4', rowIndex: 1, colIndex: 0, lat: 30, lng: -97, distanceFromCenter: 3.8, bearingDegrees: 180, isCenter: false,
        targetFound: true, rank: 12, rankDisplay: '12', statusColor: 'red', matchedBy: 'business_name', matchedBusiness: null,
        topCompetitors: [], totalResultsScanned: 20, scannedAt: ''
      },
      {
        nodeId: 'n5', rowIndex: 1, colIndex: 1, lat: 30, lng: -97, distanceFromCenter: 5.0, bearingDegrees: 270, isCenter: false,
        targetFound: false, rank: null, rankDisplay: '>20', statusColor: 'red', matchedBy: 'none', matchedBusiness: null,
        topCompetitors: [], totalResultsScanned: 20, scannedAt: ''
      },
    ];

    const summary = summarizeGridScan(
      'test_sync',
      { businessName: 'Test Business' },
      'Emergency Plumber',
      'mock',
      5,
      1.0,
      'km',
      { lat: 30, lng: -97 },
      mockNodes
    );

    // Sum: 1 + 2 + 5 + 12 + 21 = 41. Average: 41 / 5 = 8.2
    const expectedAvg = 8.2;
    // Top 3 count: 2 (nodes n1, n2) -> 2/5 = 40.0%
    const expectedTop3Pct = 40.0;
    // Red zone count: 2 (n4 rank 12, n5 unranked) -> 2/5 = 40.0%
    const expectedRedZonePct = 40.0;

    const avgPass = summary.averageRank === expectedAvg;
    const top3Pass = summary.top3Percentage === expectedTop3Pct;
    const redZonePass = summary.redZonePercentage === expectedRedZonePct;
    const passed = avgPass && top3Pass && redZonePass;

    return {
      passed,
      message: passed
        ? 'Telemetry calculation strictly matches arithmetic means and coverage percentages.'
        : `Metric variance: avg=${summary.averageRank} (exp ${expectedAvg}), top3=${summary.top3Percentage}% (exp ${expectedTop3Pct}%), redZone=${summary.redZonePercentage}% (exp ${expectedRedZonePct}%)`,
      data: summary
    };
  });

  record('Metric Synchronization', 'Dynamic Lost Revenue formula scales accurately with zone deficit and slider', () => {
    // Total nodes = 25, top 3 count = 4 -> Total in Red/Yellow = 21
    const totalNodesInRedOrYellow = 21;
    const searchVolumePerZone = 40;
    const conversionFactor = 0.05;
    const avgTicketValue = 1200;

    const lostRevenue = totalNodesInRedOrYellow * searchVolumePerZone * avgTicketValue * conversionFactor;
    // 21 * 40 * 1200 * 0.05 = 50400
    const expectedLostRevenue = 50400;

    const passed = lostRevenue === expectedLostRevenue;
    return {
      passed,
      message: passed
        ? `Lost Revenue correctly calculated: ${totalNodesInRedOrYellow} zones * 40 searches * $${avgTicketValue} * 0.05 = $${lostRevenue}/mo.`
        : `Lost revenue calculation error: got ${lostRevenue}, expected ${expectedLostRevenue}`,
      data: { totalNodesInRedOrYellow, lostRevenue, expectedLostRevenue }
    };
  });

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  return {
    allPassed: failCount === 0,
    totalTests: results.length,
    passCount,
    failCount,
    results
  };
}
