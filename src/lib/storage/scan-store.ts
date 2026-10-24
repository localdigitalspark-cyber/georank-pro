/**
 * GeoRank Pro - Scan Storage & Persistence Layer
 * Path: /src/lib/storage/scan-store.ts
 *
 * Lightweight persistent JSON file cache and in-memory map
 * for public shareable client report links (/reports/[scanId]).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GridScanSummary } from '../serp/adapter.ts';
import type { LocalSeoAuditOutput } from '../ai/audit-generator.ts';
import type { DiscoveredKeyword } from '../keywords/keyword-discovery.ts';

export interface StoredScanRecord {
  scanId: string;
  createdAt: string;
  businessName: string;
  keyword: string;
  center: { lat: number; lng: number };
  gridSize: number;
  distanceStep: number;
  unit: string;
  scanSummary: GridScanSummary;
  audit: LocalSeoAuditOutput;
  discoveredKeywords?: DiscoveredKeyword[];
}

// In-memory cache for ultra-fast lookup & ephemeral fallback
const inMemoryScans = new Map<string, StoredScanRecord>();

/**
 * Resolves the writable storage directory with robust fallbacks:
 * 1. Persistent disk on Render: /opt/render/project/src/.data (if mounted)
 * 2. Local workspace ./.data directory
 * 3. Returns null if disk is read-only or unavailable (gracefully running in in-memory mode)
 */
function resolveStorageDir(): string | null {
  const renderPersistentDir = '/opt/render/project/src/.data';
  const localDataDir = path.resolve(process.cwd(), '.data');

  try {
    if (fs.existsSync(renderPersistentDir)) {
      return renderPersistentDir;
    }
  } catch {
    // Persistent mount check ignored
  }

  try {
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    return localDataDir;
  } catch (err) {
    console.warn('ScanStore: Could not access or create local .data directory. Operating purely in in-memory cache mode:', err);
    return null;
  }
}

// Ensure data folder and file exist
function initStorage() {
  try {
    const dataDir = resolveStorageDir();
    if (!dataDir) return;

    const scansFile = path.join(dataDir, 'scans.json');
    if (fs.existsSync(scansFile)) {
      const raw = fs.readFileSync(scansFile, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((scan: StoredScanRecord) => {
            if (scan?.scanId) {
              inMemoryScans.set(scan.scanId, scan);
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('ScanStore: Could not load scans from disk, using in-memory mode:', err);
  }
}

// Persist in-memory scans to disk safely without throwing ENOENT
function persistToDisk() {
  try {
    const dataDir = resolveStorageDir();
    if (!dataDir) return;

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const scansFile = path.join(dataDir, 'scans.json');
    const allScans = Array.from(inMemoryScans.values());
    fs.writeFileSync(scansFile, JSON.stringify(allScans, null, 2), 'utf-8');
  } catch (err) {
    console.warn('ScanStore: Ephemeral storage note - persisting scans to disk skipped (in-memory mode retained):', err);
  }
}

// Initialize on module load
initStorage();

/**
 * Generates an 8-character url-safe identifier
 */
function generateScanId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `geo_${result}`;
}

/**
 * Saves a scan to storage and returns the generated scanId
 */
export function saveScan(scanData: {
  scanId?: string;
  businessName: string;
  keyword: string;
  center: { lat: number; lng: number };
  gridSize: number;
  distanceStep: number;
  unit: string;
  scanSummary: GridScanSummary;
  audit: LocalSeoAuditOutput;
  discoveredKeywords?: DiscoveredKeyword[];
}): string {
  const scanId = scanData.scanId || generateScanId();

  const record: StoredScanRecord = {
    scanId,
    createdAt: new Date().toISOString(),
    businessName: scanData.businessName,
    keyword: scanData.keyword,
    center: scanData.center,
    gridSize: scanData.gridSize,
    distanceStep: scanData.distanceStep,
    unit: scanData.unit,
    scanSummary: {
      ...scanData.scanSummary,
      scanId,
    },
    audit: scanData.audit,
    discoveredKeywords: scanData.discoveredKeywords,
  };

  inMemoryScans.set(scanId, record);
  persistToDisk();

  return scanId;
}

/**
 * Retrieves a stored scan by scanId
 */
export function getScan(scanId: string): StoredScanRecord | null {
  if (!scanId) return null;
  const found = inMemoryScans.get(scanId);
  if (found) return found;

  // Fallback re-read if another process or thread wrote to disk
  try {
    const dataDir = resolveStorageDir();
    if (dataDir) {
      const scansFile = path.join(dataDir, 'scans.json');
      if (fs.existsSync(scansFile)) {
        const raw = fs.readFileSync(scansFile, 'utf-8');
        if (raw.trim()) {
          const parsed: StoredScanRecord[] = JSON.parse(raw);
          const match = parsed.find((s) => s.scanId === scanId);
          if (match) {
            inMemoryScans.set(scanId, match);
            return match;
          }
        }
      }
    }
  } catch {
    // Ignore error
  }

  return null;
}

/**
 * Lists the most recent saved scans
 */
export function listScans(limit = 20): StoredScanRecord[] {
  return Array.from(inMemoryScans.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
