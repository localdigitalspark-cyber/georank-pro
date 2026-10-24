/**
 * GeoRank Pro - Agency White-Label Branding Context
 * Path: /src/lib/context/BrandingContext.tsx
 *
 * Persists agency branding profile in localStorage:
 * - Agency Name
 * - Contact Email
 * - Phone
 * - Website URL
 * - Primary Brand Color (HEX)
 * - Logo URL
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AgencyBranding {
  agencyName: string;
  contactEmail: string;
  phone: string;
  websiteUrl: string;
  primaryColor: string;
  logoUrl?: string;
  tagline?: string;
}

export const DEFAULT_BRANDING: AgencyBranding = {
  agencyName: 'Apex Local Growth Agency',
  contactEmail: 'growth@apexlocalagency.com',
  phone: '+1 (555) 329-8472',
  websiteUrl: 'https://apexlocalgrowth.com',
  primaryColor: '#4f46e5', // Indigo-600
  tagline: 'High-Impact Local SEO & Client Acquisition Systems',
};

interface BrandingContextType {
  branding: AgencyBranding;
  updateBranding: (updates: Partial<AgencyBranding>) => void;
  resetBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  updateBranding: () => {},
  resetBranding: () => {},
});

const STORAGE_KEY = 'georank_agency_branding_v1';

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<AgencyBranding>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(stored) };
      }
    } catch {
      // LocalStorage unavailable
    }
    return DEFAULT_BRANDING;
  });

  const updateBranding = (updates: Partial<AgencyBranding>) => {
    setBranding((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed saving branding to localStorage:', err);
      }
      return next;
    });
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
