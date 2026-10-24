/**
 * GeoRank Pro - Active Scan Metrics Synchronization Hook
 * Path: /src/lib/hooks/useActiveScanMetrics.ts
 *
 * Single source of truth for dashboard and report metrics.
 * Subscribes to the active scan payload to prevent mismatched readings
 * across BusinessHeader, OverviewView, ProfitMapsView, and AuditDeck.
 */

import { useMemo } from 'react';
import type { GridScanSummary } from '../serp/adapter.ts';

export interface ActiveScanMetrics {
  averageRank: number;
  top3Percentage: number;
  top10Percentage: number;
  redZonePercentage: number;
  totalNodes: number;
  keyword: string;
  businessName: string;
  scanId: string;
  formattedRank: string;
  formattedTop3: string;
  mode: 'live' | 'mock' | 'demo';
  isLive: boolean;
  isDemo: boolean;
  isPredictive: boolean;
  operationalBadge: {
    label: string;
    pillClass: string;
    dotClass: string;
  };
}

export function useActiveScanMetrics(
  scanSummary: GridScanSummary | null,
  fallbackKeyword = 'Emergency Plumber',
  fallbackBusinessName = 'Austin Premier Plumbing'
): ActiveScanMetrics {
  return useMemo(() => {
    if (!scanSummary) {
      return {
        averageRank: 4.2,
        top3Percentage: 28.0,
        top10Percentage: 64.0,
        redZonePercentage: 36.0,
        totalNodes: 25,
        keyword: fallbackKeyword,
        businessName: fallbackBusinessName,
        scanId: 'default',
        formattedRank: '#4.2',
        formattedTop3: '28.0%',
        mode: 'demo',
        isLive: false,
        isDemo: true,
        isPredictive: false,
        operationalBadge: {
          label: 'Sample Demo Audit',
          pillClass: 'bg-slate-100 text-slate-700 border-slate-300',
          dotClass: 'bg-slate-400',
        },
      };
    }

    const isDemo =
      scanSummary.target?.placeId?.startsWith('preset_') ||
      scanSummary.scanId === 'scan_default' ||
      scanSummary.scanId === 'default_scan';

    const isLive = scanSummary.mode === 'live' && !isDemo;
    const mode: 'live' | 'mock' | 'demo' = isDemo ? 'demo' : isLive ? 'live' : 'mock';

    const avgRank = Number(scanSummary.averageRank) || 0;
    const top3 = Number(scanSummary.top3Percentage) || 0;
    const top10 = Number(scanSummary.top10Percentage) || 0;
    const redZone = Number(scanSummary.redZonePercentage) || Math.max(0, 100 - top10);
    const totalNodes = scanSummary.totalNodes || scanSummary.nodes?.length || 25;

    let operationalBadge = {
      label: 'Predictive Simulation / Projection',
      pillClass: 'bg-amber-100 text-amber-800 border-amber-300',
      dotClass: 'bg-amber-500',
    };

    if (isLive) {
      operationalBadge = {
        label: 'Live Google Maps SERP',
        pillClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs',
        dotClass: 'bg-emerald-500 animate-pulse',
      };
    } else if (isDemo) {
      operationalBadge = {
        label: 'Sample Demo Audit',
        pillClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotClass: 'bg-slate-400',
      };
    }

    return {
      averageRank: avgRank,
      top3Percentage: top3,
      top10Percentage: top10,
      redZonePercentage: redZone,
      totalNodes,
      keyword: scanSummary.keyword || fallbackKeyword,
      businessName: scanSummary.target?.businessName || fallbackBusinessName,
      scanId: scanSummary.scanId || '',
      formattedRank: `#${avgRank.toFixed(1)}`,
      formattedTop3: `${top3.toFixed(1)}%`,
      mode,
      isLive,
      isDemo,
      isPredictive: mode === 'mock',
      operationalBadge,
    };
  }, [scanSummary, fallbackKeyword, fallbackBusinessName]);
}
