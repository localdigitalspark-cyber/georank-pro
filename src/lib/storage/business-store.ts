/**
 * GeoRank Pro - Business Directory Storage & Persistence Layer
 * Path: /src/lib/storage/business-store.ts
 *
 * Implements persistent business record management with disk/in-memory fallback,
 * atomic JSON file persistence (.tmp rename), pre-seeded defaults,
 * and clean cascade integration with scan-store.
 */

import fs from 'fs';
import path from 'path';
import { resolveStorageDir, atomicWriteJsonSync, deleteScansForBusiness } from './scan-store.ts';

export interface ManagedBusiness {
  id: string;
  name: string;
  address: string;
  city?: string;
  postcode?: string;
  category: string;
  secondaryCategories?: string[];
  phone?: string;
  website?: string;
  lat: number;
  lng: number;
  placeId?: string;
  cid?: string;
  top3Percentage: number;
  averageRank: number;
  rating: number;
  reviews: number;
  reviewCount: number;
  lastScanDate: string;
  keyword: string;
  ownerName?: string;
  yearsInBusiness?: string;
  excludedServices?: string;
  areasServed?: string;
  differentiators?: string;
  notes?: string;
  source?: 'gbp' | 'website' | 'manual';
  suggestedKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

const inMemoryBusinesses = new Map<string, ManagedBusiness>();

const DEFAULT_SEEDED_BUSINESSES: ManagedBusiness[] = [
  {
    id: 'b1',
    name: 'Austin Premier Plumbing',
    address: '1024 Congress Ave, Austin, TX 78701',
    city: 'Austin, TX',
    category: 'Emergency Plumber',
    secondaryCategories: ['Plumber', 'Drainage Service', 'Water Heater Repair'],
    phone: '(512) 555-0199',
    website: 'https://austinpremierplumbing.com',
    lat: 30.2672,
    lng: -97.7431,
    placeId: 'preset_austin_plumbing',
    top3Percentage: 28.0,
    averageRank: 4.2,
    rating: 4.9,
    reviews: 342,
    reviewCount: 342,
    lastScanDate: 'Today, 2:15 PM',
    keyword: 'Emergency Plumber',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    name: 'Sunrise Hair Studio',
    address: '2200 S Lamar Blvd, Austin, TX 78704',
    city: 'Austin, TX',
    category: 'Hair Colour Salon',
    phone: '(512) 555-0244',
    website: 'https://sunrisehairstudio.com',
    lat: 30.2505,
    lng: -97.7710,
    top3Percentage: 4.0,
    averageRank: 14.8,
    rating: 4.7,
    reviews: 128,
    reviewCount: 128,
    lastScanDate: 'Yesterday',
    keyword: 'Hair Colour Salon',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b3',
    name: 'Northside Wellness & Spine',
    address: '11800 Domain Blvd, Austin, TX 78758',
    city: 'Austin, TX',
    category: 'Chiropractor & Therapy',
    phone: '(512) 555-0377',
    website: 'https://northsidewellnessaustin.com',
    lat: 30.4021,
    lng: -97.7258,
    top3Percentage: 48.0,
    averageRank: 3.8,
    rating: 4.8,
    reviews: 215,
    reviewCount: 215,
    lastScanDate: '2 days ago',
    keyword: 'Chiropractor Austin',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b4',
    name: 'Capital City Drains & Rooter',
    address: '410 E 6th St, Austin, TX 78701',
    city: 'Austin, TX',
    category: 'Commercial Plumbing',
    phone: '(512) 555-0488',
    website: 'https://capitalcitydrains.com',
    lat: 30.2690,
    lng: -97.7390,
    top3Percentage: 36.0,
    averageRank: 6.4,
    rating: 4.6,
    reviews: 94,
    reviewCount: 94,
    lastScanDate: '3 days ago',
    keyword: 'Drain Cleaning',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function initBusinessStorage() {
  try {
    const dataDir = resolveStorageDir();
    if (!dataDir) {
      seedDefaults();
      return;
    }

    const file = path.join(dataDir, 'businesses.json');
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      if (raw.trim()) {
        const parsed: ManagedBusiness[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((b) => {
            if (b?.id && b?.name) {
              inMemoryBusinesses.set(b.id, {
                ...b,
                reviewCount: typeof b.reviewCount === 'number' ? b.reviewCount : (b.reviews || 0),
              });
            }
          });
          return;
        }
      }
    }

    // Seed defaults if file doesn't exist or is empty
    seedDefaults();
    persistBusinessesToDisk();
  } catch (err) {
    console.warn('BusinessStore: Initial load fallback to defaults in memory:', err);
    seedDefaults();
  }
}

function seedDefaults() {
  DEFAULT_SEEDED_BUSINESSES.forEach((b) => {
    inMemoryBusinesses.set(b.id, b);
  });
}

function persistBusinessesToDisk() {
  try {
    const dataDir = resolveStorageDir();
    if (!dataDir) return;

    const file = path.join(dataDir, 'businesses.json');
    const all = Array.from(inMemoryBusinesses.values());
    atomicWriteJsonSync(file, all);
  } catch (err) {
    console.warn('BusinessStore: Failed writing businesses to disk (continuing in-memory):', err);
  }
}

// Initialize on module load
initBusinessStorage();

export function generateBusinessId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `biz_${Date.now().toString(36)}_${rand}`;
}

export function listBusinesses(): ManagedBusiness[] {
  return Array.from(inMemoryBusinesses.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
}

export function getBusiness(id: string): ManagedBusiness | null {
  if (!id) return null;
  return inMemoryBusinesses.get(id) || null;
}

export function saveBusiness(data: {
  id?: string;
  name: string;
  address: string;
  city?: string;
  postcode?: string;
  category: string;
  secondaryCategories?: string[];
  phone?: string;
  website?: string;
  lat: number;
  lng: number;
  placeId?: string;
  cid?: string;
  top3Percentage?: number;
  averageRank?: number;
  rating?: number;
  reviews?: number;
  reviewCount?: number;
  lastScanDate?: string;
  keyword?: string;
  ownerName?: string;
  yearsInBusiness?: string;
  excludedServices?: string;
  areasServed?: string;
  differentiators?: string;
  notes?: string;
  source?: 'gbp' | 'website' | 'manual';
  suggestedKeywords?: string[];
}): ManagedBusiness {
  const id = data.id || generateBusinessId();
  const now = new Date().toISOString();

  const existing = inMemoryBusinesses.get(id);

  const reviewsVal =
    typeof data.reviews === 'number'
      ? data.reviews
      : typeof data.reviewCount === 'number'
      ? data.reviewCount
      : existing?.reviews ?? 0;

  const record: ManagedBusiness = {
    id,
    name: data.name.trim(),
    address: data.address.trim(),
    city: data.city,
    postcode: data.postcode,
    category: data.category.trim(),
    secondaryCategories: data.secondaryCategories || existing?.secondaryCategories || [],
    phone: data.phone || existing?.phone || '',
    website: data.website || existing?.website || '',
    lat: typeof data.lat === 'number' ? data.lat : 30.2672,
    lng: typeof data.lng === 'number' ? data.lng : -97.7431,
    placeId: data.placeId || existing?.placeId,
    cid: data.cid || existing?.cid,
    top3Percentage: typeof data.top3Percentage === 'number' ? data.top3Percentage : existing?.top3Percentage ?? 0,
    averageRank: typeof data.averageRank === 'number' ? data.averageRank : existing?.averageRank ?? 15,
    rating: typeof data.rating === 'number' ? data.rating : existing?.rating ?? 4.8,
    reviews: reviewsVal,
    reviewCount: reviewsVal,
    lastScanDate: data.lastScanDate || existing?.lastScanDate || 'Just now',
    keyword: data.keyword || existing?.keyword || data.category,
    ownerName: data.ownerName || existing?.ownerName,
    yearsInBusiness: data.yearsInBusiness || existing?.yearsInBusiness,
    excludedServices: data.excludedServices || existing?.excludedServices,
    areasServed: data.areasServed || existing?.areasServed,
    differentiators: data.differentiators || existing?.differentiators,
    notes: data.notes || existing?.notes,
    source: data.source || existing?.source || 'manual',
    suggestedKeywords: data.suggestedKeywords || existing?.suggestedKeywords || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  inMemoryBusinesses.set(id, record);
  persistBusinessesToDisk();
  return record;
}

export function updateBusiness(id: string, updates: Partial<ManagedBusiness>): ManagedBusiness | null {
  const existing = inMemoryBusinesses.get(id);
  if (!existing) return null;

  const reviewsVal =
    typeof updates.reviews === 'number'
      ? updates.reviews
      : typeof updates.reviewCount === 'number'
      ? updates.reviewCount
      : existing.reviews;

  const updated: ManagedBusiness = {
    ...existing,
    ...updates,
    reviews: reviewsVal,
    reviewCount: reviewsVal,
    id,
    updatedAt: new Date().toISOString(),
  };

  inMemoryBusinesses.set(id, updated);
  persistBusinessesToDisk();
  return updated;
}

export function deleteBusiness(id: string): {
  success: boolean;
  deletedId: string;
  deletedBusiness?: ManagedBusiness;
  deletedScansCount: number;
} {
  const business = inMemoryBusinesses.get(id);
  if (!business) {
    return { success: false, deletedId: id, deletedScansCount: 0 };
  }

  // Purge/cascade associated scans
  const deletedScansCount = deleteScansForBusiness(id, business.name);

  inMemoryBusinesses.delete(id);
  persistBusinessesToDisk();

  return { success: true, deletedId: id, deletedBusiness: business, deletedScansCount };
}
