/**
 * GeoRank Pro - Win/Loss Alert Storage & Persistence Layer
 * Path: /src/lib/storage/alert-store.ts
 */

import fs from 'fs';
import path from 'path';
import { resolveStorageDir, atomicWriteJsonSync } from './scan-store.ts';
import type { WinLossAlert } from '../types.ts';

const inMemoryAlerts = new Map<string, WinLossAlert>();

const DEFAULT_SEEDED_ALERTS: WinLossAlert[] = [
  {
    id: 'alert_win_b1_001',
    businessId: 'b1',
    businessName: 'Austin Premier Plumbing',
    keyword: 'Emergency Plumber',
    alertType: 'win_3pack_enter',
    title: '🎉 Google 3-Pack Breakthrough!',
    message: 'Rank improved from #6.0 to #4.2 (top 3 coverage jumped from 16% to 28%). Your business is now intercepting primary local phone leads.',
    previousRank: 6.0,
    newRank: 4.2,
    delta: 1.8,
    previousTop3Percent: 16.0,
    newTop3Percent: 28.0,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    delivered: true,
    deliveryMethod: 'in_app',
  },
  {
    id: 'alert_loss_b2_002',
    businessId: 'b2',
    businessName: 'Sunrise Hair Studio',
    keyword: 'Hair Colour Salon',
    alertType: 'loss_3pack_exit',
    title: '⚠️ 3-Pack Exit Remediation Alert',
    message: 'Rank dropped from #13.2 to #14.8 (3-pack presence dropped by 8%). Local competitor added 14 new reviews and intercepted 3 centroid pins.',
    previousRank: 13.2,
    newRank: 14.8,
    delta: -1.6,
    previousTop3Percent: 12.0,
    newTop3Percent: 4.0,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: false,
    delivered: true,
    deliveryMethod: 'in_app',
  },
];

function getAlertsFilePath(): string | null {
  const dir = resolveStorageDir();
  return dir ? path.join(dir, 'alerts.json') : null;
}

function persistAlertsToDisk(): void {
  const filePath = getAlertsFilePath();
  if (!filePath) return;
  try {
    const alertsArray = Array.from(inMemoryAlerts.values());
    atomicWriteJsonSync(filePath, alertsArray);
  } catch (err) {
    console.warn('AlertStore: Failed persisting alerts to disk:', err);
  }
}

function loadAlertsFromDisk(): void {
  const filePath = getAlertsFilePath();
  if (!filePath) {
    DEFAULT_SEEDED_ALERTS.forEach((a) => inMemoryAlerts.set(a.id, a));
    return;
  }
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryAlerts.clear();
        parsed.forEach((a: WinLossAlert) => {
          if (a && a.id) inMemoryAlerts.set(a.id, a);
        });
        return;
      }
    }
  } catch (err) {
    console.warn('AlertStore: Error reading alerts from disk, using seed:', err);
  }

  DEFAULT_SEEDED_ALERTS.forEach((a) => inMemoryAlerts.set(a.id, a));
  persistAlertsToDisk();
}

// Initialize on module load
loadAlertsFromDisk();

export function listAlerts(businessId?: string): WinLossAlert[] {
  const all = Array.from(inMemoryAlerts.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  if (businessId) {
    return all.filter((a) => a.businessId === businessId);
  }
  return all;
}

export function saveAlert(data: {
  businessId: string;
  businessName: string;
  keyword: string;
  alertType: WinLossAlert['alertType'];
  title: string;
  message: string;
  previousRank: number;
  newRank: number;
  delta: number;
  previousTop3Percent?: number;
  newTop3Percent?: number;
  deliveryMethod?: WinLossAlert['deliveryMethod'];
  details?: Record<string, any>;
}): WinLossAlert {
  const id = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record: WinLossAlert = {
    ...data,
    id,
    timestamp: new Date().toISOString(),
    read: false,
    delivered: true,
    deliveryMethod: data.deliveryMethod || 'in_app',
  };

  inMemoryAlerts.set(id, record);
  persistAlertsToDisk();
  return record;
}

export function markAlertRead(id: string): boolean {
  const existing = inMemoryAlerts.get(id);
  if (!existing) return false;
  existing.read = true;
  inMemoryAlerts.set(id, existing);
  persistAlertsToDisk();
  return true;
}

export function markAllAlertsRead(businessId?: string): number {
  let count = 0;
  for (const [id, a] of inMemoryAlerts.entries()) {
    if (!businessId || a.businessId === businessId) {
      if (!a.read) {
        a.read = true;
        inMemoryAlerts.set(id, a);
        count++;
      }
    }
  }
  if (count > 0) persistAlertsToDisk();
  return count;
}

export function clearAlerts(): void {
  inMemoryAlerts.clear();
  persistAlertsToDisk();
}
