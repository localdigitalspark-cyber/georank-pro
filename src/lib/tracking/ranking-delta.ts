/**
 * GeoRank Pro - Ranking Delta & SERP Volatility Engine
 * Path: /src/lib/tracking/ranking-delta.ts
 *
 * Compares sequential scans (Scan N vs Scan N-1) to compute:
 * - Average SERP rank delta (positive = improvement closer to #1, negative = drop)
 * - 3-Pack percentage delta
 * - 3-Pack Entry / Exit milestone detection
 * - Node-level coordinate grid volatility
 */

import type { GridScanSummary } from '../serp/adapter.ts';
import type { RankingDelta, KeywordDelta } from '../types.ts';

export function computeRankingDelta(
  currentScan: GridScanSummary,
  previousScan?: GridScanSummary | null
): RankingDelta {
  const currentAvgSerp = typeof currentScan.averageRank === 'number'
    ? Number(currentScan.averageRank.toFixed(1))
    : 10.0;
  const currentTop3Percentage = typeof currentScan.top3Percentage === 'number'
    ? Number(currentScan.top3Percentage.toFixed(1))
    : 0;

  if (!previousScan) {
    return {
      avgSerpDelta: 0,
      inPackDelta: 0,
      enteredThreePack: false,
      droppedFromThreePack: false,
      currentAvgSerp,
      currentTop3Percentage,
      currentScanDate: currentScan.createdAt ? new Date(currentScan.createdAt).toLocaleDateString() : 'Today',
      netGridMovement: 'stable',
      nodesImproved: 0,
      nodesDropped: 0,
      nodesUnchanged: currentScan.totalNodes || currentScan.nodes?.length || 25,
    };
  }

  const previousAvgSerp = typeof previousScan.averageRank === 'number'
    ? Number(previousScan.averageRank.toFixed(1))
    : 10.0;
  const previousTop3Percentage = typeof previousScan.top3Percentage === 'number'
    ? Number(previousScan.top3Percentage.toFixed(1))
    : 0;

  // In SERP ranking, lower number is better:
  // e.g., previous 5.0 -> current 3.2 means an improvement of +1.8 positions
  const avgSerpDelta = Number((previousAvgSerp - currentAvgSerp).toFixed(1));

  // Top 3 percentage delta: e.g. 28% -> 40% = +12%
  const inPackDelta = Number((currentTop3Percentage - previousTop3Percentage).toFixed(1));

  // 3-Pack entry: improved into 3-pack or crossed dominance threshold
  const enteredThreePack =
    (previousAvgSerp > 3.0 && currentAvgSerp <= 3.0) ||
    (previousTop3Percentage < 25.0 && currentTop3Percentage >= 25.0);

  // 3-Pack exit / drop: fell out of 3-pack or dropped below threshold
  const droppedFromThreePack =
    (previousAvgSerp <= 3.0 && currentAvgSerp > 3.0) ||
    (previousTop3Percentage >= 25.0 && currentTop3Percentage < 25.0);

  // Per-node movement comparison
  let nodesImproved = 0;
  let nodesDropped = 0;
  let nodesUnchanged = 0;

  const prevNodeMap = new Map<string, number | null>();
  (previousScan.nodes || []).forEach((n) => {
    prevNodeMap.set(n.nodeId, n.rank);
  });

  (currentScan.nodes || []).forEach((curNode) => {
    const prevRank = prevNodeMap.get(curNode.nodeId);
    if (prevRank === undefined) {
      nodesUnchanged++;
      return;
    }

    const curRankNum = curNode.rank === null ? 21 : curNode.rank;
    const prevRankNum = prevRank === null ? 21 : prevRank;

    if (curRankNum < prevRankNum) {
      nodesImproved++;
    } else if (curRankNum > prevRankNum) {
      nodesDropped++;
    } else {
      nodesUnchanged++;
    }
  });

  let netGridMovement: 'improved' | 'dropped' | 'stable' = 'stable';
  if (avgSerpDelta >= 0.3 || inPackDelta >= 4.0 || nodesImproved > nodesDropped + 2) {
    netGridMovement = 'improved';
  } else if (avgSerpDelta <= -0.3 || inPackDelta <= -4.0 || nodesDropped > nodesImproved + 2) {
    netGridMovement = 'dropped';
  }

  return {
    avgSerpDelta,
    inPackDelta,
    enteredThreePack,
    droppedFromThreePack,
    previousAvgSerp,
    currentAvgSerp,
    previousTop3Percentage,
    currentTop3Percentage,
    previousScanDate: previousScan.createdAt ? new Date(previousScan.createdAt).toLocaleDateString() : undefined,
    currentScanDate: currentScan.createdAt ? new Date(currentScan.createdAt).toLocaleDateString() : 'Today',
    netGridMovement,
    nodesImproved,
    nodesDropped,
    nodesUnchanged,
  };
}

/**
 * Formats a ranking delta into a clean human badge string
 * e.g. "▲ +2.4 into 3-Pack", "▼ -1.8 drop", "● 0.0 stable"
 */
export function formatDeltaBadge(delta?: RankingDelta | null): {
  text: string;
  shortText: string;
  isPositive: boolean;
  isNegative: boolean;
  colorClass: string;
  arrow: string;
} {
  if (!delta || (delta.avgSerpDelta === 0 && delta.inPackDelta === 0 && !delta.enteredThreePack && !delta.droppedFromThreePack)) {
    return {
      text: '● Stable (0.0)',
      shortText: '0.0',
      isPositive: false,
      isNegative: false,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
      arrow: '●',
    };
  }

  if (delta.enteredThreePack) {
    const deltaStr = delta.avgSerpDelta > 0 ? `+${delta.avgSerpDelta}` : `${delta.avgSerpDelta}`;
    return {
      text: `▲ ${deltaStr} into 3-Pack`,
      shortText: `▲ ${deltaStr}`,
      isPositive: true,
      isNegative: false,
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
      arrow: '▲',
    };
  }

  if (delta.droppedFromThreePack) {
    const deltaStr = delta.avgSerpDelta < 0 ? `${delta.avgSerpDelta}` : `-${delta.avgSerpDelta}`;
    return {
      text: `▼ ${deltaStr} out of 3-Pack`,
      shortText: `▼ ${deltaStr}`,
      isPositive: false,
      isNegative: true,
      colorClass: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
      arrow: '▼',
    };
  }

  if (delta.avgSerpDelta > 0) {
    return {
      text: `▲ +${delta.avgSerpDelta} improved`,
      shortText: `▲ +${delta.avgSerpDelta}`,
      isPositive: true,
      isNegative: false,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      arrow: '▲',
    };
  }

  if (delta.avgSerpDelta < 0) {
    return {
      text: `▼ ${delta.avgSerpDelta} drop`,
      shortText: `▼ ${delta.avgSerpDelta}`,
      isPositive: false,
      isNegative: true,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200',
      arrow: '▼',
    };
  }

  return {
    text: '● Stable (0.0)',
    shortText: '0.0',
    isPositive: false,
    isNegative: false,
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
    arrow: '●',
  };
}

/**
 * Returns formatted delta badge text e.g. "▲ +1.8", "▼ -1.2", "● 0.0"
 */
export function formatKeywordDeltaText(avgSerpDelta: number): string {
  if (avgSerpDelta > 0) return `▲ +${avgSerpDelta}`;
  if (avgSerpDelta < 0) return `▼ ${avgSerpDelta}`;
  return '● 0.0';
}

export interface GenericScanForDelta {
  createdAt: string;
  keyword?: string;
  scanSummary?: {
    keyword?: string;
    averageRank?: number;
    top3Percentage?: number;
    createdAt?: string;
  };
}

/**
 * Compares sequential scans (Scan 0 vs Scan 1) per keyword to extract keyword deltas
 */
export function computeSequentialKeywordDeltas(
  scans: GenericScanForDelta[]
): Record<string, KeywordDelta> {
  const byKeyword = new Map<string, GenericScanForDelta[]>();

  for (const scan of scans) {
    const rawKw = scan.keyword || scan.scanSummary?.keyword || '';
    const kw = rawKw.trim();
    if (!kw) continue;
    const lower = kw.toLowerCase();
    if (!byKeyword.has(lower)) {
      byKeyword.set(lower, []);
    }
    byKeyword.get(lower)!.push(scan);
  }

  const result: Record<string, KeywordDelta> = {};

  for (const [lowerKw, list] of byKeyword.entries()) {
    // Sort descending by createdAt
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const canonicalKeyword = list[0].keyword || list[0].scanSummary?.keyword || lowerKw;
    const latest = list[0];
    const latestAvg = Number((latest.scanSummary?.averageRank ?? 10.0).toFixed(1));
    const latestTop3 = Number((latest.scanSummary?.top3Percentage ?? 0).toFixed(1));

    if (list.length >= 2) {
      const prior = list[1];
      const priorAvg = Number((prior.scanSummary?.averageRank ?? 10.0).toFixed(1));
      const priorTop3 = Number((prior.scanSummary?.top3Percentage ?? 0).toFixed(1));

      // SERP rank: lower number is closer to #1 (improvement)
      const avgSerpDelta = Number((priorAvg - latestAvg).toFixed(1));
      const inPackDelta = Number((latestTop3 - priorTop3).toFixed(1));

      result[canonicalKeyword] = {
        keyword: canonicalKeyword,
        avgSerpDelta,
        inPackDelta,
        previousAvgSerp: priorAvg,
        currentAvgSerp: latestAvg,
        lastScannedAt: latest.createdAt,
        badgeText: formatKeywordDeltaText(avgSerpDelta),
        isPositive: avgSerpDelta > 0,
        isNegative: avgSerpDelta < 0,
        status: avgSerpDelta > 0 ? 'improved' : avgSerpDelta < 0 ? 'dropped' : 'stable',
      };
    } else {
      result[canonicalKeyword] = {
        keyword: canonicalKeyword,
        avgSerpDelta: 0,
        inPackDelta: 0,
        currentAvgSerp: latestAvg,
        lastScannedAt: latest.createdAt,
        badgeText: '● Baseline',
        isPositive: false,
        isNegative: false,
        status: 'baseline',
      };
    }
  }

  return result;
}
