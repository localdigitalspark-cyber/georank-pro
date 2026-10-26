/**
 * GeoRank Pro - Win/Loss Alert & Webhook Dispatcher
 * Path: /src/lib/tracking/alert-dispatcher.ts
 */

import { saveAlert } from '../storage/alert-store.ts';
import { saveProspectEvent } from '../storage/analytics-store.ts';
import type { ManagedBusiness } from '../storage/business-store.ts';
import type { RankingDelta, WinLossAlert, WinLossAlertType } from '../types.ts';
import type { GridScanSummary } from '../serp/adapter.ts';

export interface DispatchAlertResult {
  triggered: boolean;
  alert?: WinLossAlert;
  webhookSent?: boolean;
}

export async function evaluateAndDispatchAlerts(
  business: ManagedBusiness,
  keyword: string,
  delta: RankingDelta,
  _currentScan: GridScanSummary
): Promise<DispatchAlertResult[]> {
  const results: DispatchAlertResult[] = [];
  const tracking = business.trackingConfig;
  const kwTracking = business.keywordsTracking?.[keyword];

  const alertOnEnter = kwTracking?.alertOnThreePackEnter ?? tracking?.alertOnThreePackEnter ?? true;
  const alertOnDrop = kwTracking?.alertOnRankDrop ?? tracking?.alertOnRankDrop ?? true;
  const dropThreshold = kwTracking?.rankDropThreshold ?? tracking?.rankDropThreshold ?? 2.0;

  const webhookUrl = kwTracking?.webhookUrl || tracking?.webhookUrl || business.webhookUrl;
  const alertEmail = kwTracking?.alertEmail || tracking?.alertEmail || business.alertEmail;

  // 1. Check Win Condition: Entered 3-Pack or significant positive leap
  if (alertOnEnter && (delta.enteredThreePack || delta.avgSerpDelta >= 2.5)) {
    const alertType: WinLossAlertType = 'win_3pack_enter';
    const title = delta.enteredThreePack
      ? `🎉 WIN ALERT: "${keyword}" Entered Google 3-Pack!`
      : `🚀 MAJOR RANK GAIN: "${keyword}" Improved +${delta.avgSerpDelta}!`;

    const message = `"${business.name}" has achieved position #${delta.currentAvgSerp} for "${keyword}" (gain of +${delta.avgSerpDelta} positions). Top 3 visibility jumped by +${delta.inPackDelta}%.`;

    const saved = saveAlert({
      businessId: business.id,
      businessName: business.name,
      keyword,
      alertType,
      title,
      message,
      previousRank: delta.previousAvgSerp ?? 10.0,
      newRank: delta.currentAvgSerp,
      delta: delta.avgSerpDelta,
      previousTop3Percent: delta.previousTop3Percentage,
      newTop3Percent: delta.currentTop3Percentage,
      deliveryMethod: webhookUrl ? 'webhook' : alertEmail ? 'email' : 'in_app',
      details: {
        alertEmail,
        webhookUrl,
        nodesImproved: delta.nodesImproved,
      },
    });

    // Record telemetry event in analytics
    try {
      saveProspectEvent({
        scanId: `scan_${Date.now()}`,
        businessName: business.name,
        eventType: 'milestone_unlocked',
        details: {
          title,
          message,
          keyword,
          delta: delta.avgSerpDelta,
          alertType,
        },
      });
    } catch {}

    // Dispatch webhook if configured
    let webhookSent = false;
    if (webhookUrl) {
      webhookSent = await dispatchWebhook(webhookUrl, {
        event: 'georank.alert.win',
        alert: saved,
        business: {
          id: business.id,
          name: business.name,
          category: business.category,
        },
        delta,
      });
    }

    results.push({ triggered: true, alert: saved, webhookSent });
  }

  // 2. Check Loss / Remediation Condition: Dropped from 3-Pack or rank drop >= threshold
  if (alertOnDrop && (delta.droppedFromThreePack || delta.avgSerpDelta <= -dropThreshold)) {
    const alertType: WinLossAlertType = delta.droppedFromThreePack ? 'loss_3pack_exit' : 'loss_rank_drop';
    const title = delta.droppedFromThreePack
      ? `⚠️ LOSS ALERT: "${keyword}" Dropped Out of 3-Pack`
      : `⚠️ RANK DROP ALERT: "${keyword}" Slipped ${delta.avgSerpDelta} Positions`;

    const message = `"${business.name}" rank slipped from #${delta.previousAvgSerp} to #${delta.currentAvgSerp} for "${keyword}". Competitor interception detected in your coverage centroid.`;

    const saved = saveAlert({
      businessId: business.id,
      businessName: business.name,
      keyword,
      alertType,
      title,
      message,
      previousRank: delta.previousAvgSerp ?? 10.0,
      newRank: delta.currentAvgSerp,
      delta: delta.avgSerpDelta,
      previousTop3Percent: delta.previousTop3Percentage,
      newTop3Percent: delta.currentTop3Percentage,
      deliveryMethod: webhookUrl ? 'webhook' : alertEmail ? 'email' : 'in_app',
      details: {
        alertEmail,
        webhookUrl,
        nodesDropped: delta.nodesDropped,
      },
    });

    // Record telemetry event in analytics
    try {
      saveProspectEvent({
        scanId: `scan_${Date.now()}`,
        businessName: business.name,
        eventType: 'rank_drop_detected',
        details: {
          title,
          message,
          keyword,
          delta: delta.avgSerpDelta,
          alertType,
        },
      });
    } catch {}

    // Dispatch webhook if configured
    let webhookSent = false;
    if (webhookUrl) {
      webhookSent = await dispatchWebhook(webhookUrl, {
        event: 'georank.alert.loss',
        alert: saved,
        business: {
          id: business.id,
          name: business.name,
          category: business.category,
        },
        delta,
      });
    }

    results.push({ triggered: true, alert: saved, webhookSent });
  }

  return results;
}

async function dispatchWebhook(url: string, payload: any): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GeoRank-Alert-Dispatcher/1.0',
      },
      body: JSON.stringify({
        ...payload,
        dispatchedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return resp.ok;
  } catch (err) {
    console.warn(`AlertDispatcher: Webhook delivery to ${url} failed:`, err);
    return false;
  }
}
