/**
 * GeoRank Pro - Scan Storage & Persistence Layer
 * Path: /src/lib/storage/scan-store.ts
 *
 * Lightweight persistent JSON file cache and in-memory map
 * for public shareable client report links (/reports/[scanId]).
 *
 * Hardened for:
 * - process.env.STORAGE_PATH and /opt/render/project/src/.data mounts
 * - Atomic write operations (.tmp file rename) preventing JSON corruption
 * - Immediate in-memory sync across reads/writes
 * - Direct businessId referencing & cascade purges
 */

import fs from 'fs';
import path from 'path';
import type { GridScanSummary } from '../serp/adapter.ts';
import type { LocalSeoAuditOutput } from '../ai/audit-generator.ts';
import type { DiscoveredKeyword } from '../keywords/keyword-discovery.ts';

export interface StoredScanRecord {
  scanId: string;
  businessId?: string;
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

// In-memory cache for ultra-fast lookup & immediate sync across refreshes
const inMemoryScans = new Map<string, StoredScanRecord>();

/**
 * Resolves the writable storage directory with robust fallbacks:
 * 1. process.env.STORAGE_PATH (if provided in environment)
 * 2. Persistent disk on Render: /opt/render/project/src/.data (if mounted)
 * 3. Local workspace .data directory
 * 4. Gracefully falls back to pure in-memory cache if filesystem is restricted
 */
export function resolveStorageDir(): string | null {
  // 1. Explicit env var override
  if (process.env.STORAGE_PATH) {
    try {
      const customPath = path.resolve(process.env.STORAGE_PATH);
      if (!fs.existsSync(customPath)) {
        fs.mkdirSync(customPath, { recursive: true });
      }
      return customPath;
    } catch (err) {
      console.warn('Storage: custom STORAGE_PATH not accessible, trying fallbacks:', err);
    }
  }

  // 2. Render persistent disk default mount
  const renderPersistentDir = '/opt/render/project/src/.data';
  try {
    if (fs.existsSync(renderPersistentDir)) {
      return renderPersistentDir;
    }
  } catch {
    // Ignore
  }

  // 3. Local workspace .data directory
  const localDataDir = path.resolve(process.cwd(), '.data');
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

/**
 * Atomic JSON write: writes to temporary file first, then atomically renames to target file.
 * Prevents corrupted or truncated JSON reads when multiple scans write concurrently.
 */
export function atomicWriteJsonSync(filePath: string, data: any): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempFile = path.join(
    dir,
    `.${path.basename(filePath)}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`
  );
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  try {
    fs.renameSync(tempFile, filePath);
  } catch (renameErr) {
    // On Windows or across partitions, renameSync can fail; fallback to copy and delete
    try {
      fs.copyFileSync(tempFile, filePath);
      fs.unlinkSync(tempFile);
    } catch {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
    }
  }
}

// Ensure data folder and file exist and load into memory cache
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

// Persist in-memory scans to disk safely using atomic writes
function persistToDisk() {
  try {
    const dataDir = resolveStorageDir();
    if (!dataDir) return;

    const scansFile = path.join(dataDir, 'scans.json');
    const allScans = Array.from(inMemoryScans.values());
    atomicWriteJsonSync(scansFile, allScans);
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
  businessId?: string;
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
    businessId: scanData.businessId,
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

/**
 * Retrieves all scans associated with a given businessId
 */
export function getScansForBusiness(businessId: string): StoredScanRecord[] {
  if (!businessId) return [];
  const targetIdLower = businessId.toLowerCase().trim();
  return Array.from(inMemoryScans.values())
    .filter(
      (s) =>
        s.businessId?.toLowerCase() === targetIdLower ||
        s.scanId.toLowerCase().includes(targetIdLower)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Deletes a single scan by scanId
 */
export function deleteScan(scanId: string): boolean {
  if (!scanId || !inMemoryScans.has(scanId)) return false;
  inMemoryScans.delete(scanId);
  persistToDisk();
  return true;
}

/**
 * Purges/cascades all scans associated with a given business ID or name
 */
export function deleteScansForBusiness(businessId: string, businessName?: string): number {
  let deletedCount = 0;
  const targetIdLower = businessId?.toLowerCase().trim();
  const targetNameLower = businessName?.toLowerCase().trim();

  for (const [id, scan] of Array.from(inMemoryScans.entries())) {
    const matchesId =
      targetIdLower &&
      (scan.businessId?.toLowerCase() === targetIdLower ||
        id.toLowerCase().includes(targetIdLower));
    const matchesName =
      targetNameLower && scan.businessName?.toLowerCase().trim() === targetNameLower;

    if (matchesId || matchesName) {
      inMemoryScans.delete(id);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    persistToDisk();
  }
  return deletedCount;
}
