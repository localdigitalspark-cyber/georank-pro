/**
 * GeoRank Pro - Core System Types & Tracking Data Models
 * Path: /src/lib/types.ts
 */

export type TrackingFrequency = 'off' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

export interface KeywordTrackingConfig {
  enabled: boolean;
  frequency: TrackingFrequency;
  lastTrackedAt?: string;
  nextTrackDue?: string;
  alertEmail?: string;
  webhookUrl?: string;
  alertOnThreePackEnter?: boolean;
  alertOnRankDrop?: boolean;
  rankDropThreshold?: number; // e.g. drop by 2.0 or more
}

export interface RankingDelta {
  avgSerpDelta: number; // e.g., +1.4 (improved towards #1) or -2.1 (dropped towards worse rank)
  inPackDelta: number;   // e.g., +12% change in 3-pack percentage
  enteredThreePack: boolean;
  droppedFromThreePack: boolean;
  previousAvgSerp?: number;
  currentAvgSerp: number;
  previousTop3Percentage?: number;
  currentTop3Percentage: number;
  previousScanDate?: string;
  currentScanDate: string;
  netGridMovement: 'improved' | 'dropped' | 'stable';
  nodesImproved?: number;
  nodesDropped?: number;
  nodesUnchanged?: number;
}

export type WinLossAlertType = 'win_3pack_enter' | 'loss_rank_drop' | 'loss_3pack_exit';

export interface WinLossAlert {
  id: string;
  businessId: string;
  businessName: string;
  keyword: string;
  alertType: WinLossAlertType;
  title: string;
  message: string;
  previousRank: number;
  newRank: number;
  delta: number;
  previousTop3Percent?: number;
  newTop3Percent?: number;
  timestamp: string;
  read: boolean;
  delivered: boolean;
  deliveryMethod?: 'email' | 'webhook' | 'in_app';
  details?: Record<string, any>;
}
