/**
 * ProfitMaps AI / GeoRank Pro - Agency Settings & Preferences View
 * Path: /src/components/views/SettingsView.tsx
 */

import React, { useState } from 'react';
import {
  Settings,
  Building,
  Mail,
  Phone,
  Globe,
  SlidersHorizontal,
  Palette,
  Save,
  Check,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useBranding } from '../../lib/context/BrandingContext.tsx';

export const SettingsView: React.FC = () => {
  const { branding, updateBranding } = useBranding();

  const [agencyName, setAgencyName] = useState(branding.agencyName || 'Acme Local SEO Agency');
  const [contactEmail, setContactEmail] = useState(branding.contactEmail || 'team@acmelocalseo.com');
  const [phone, setPhone] = useState(branding.phone || '(512) 555-0100');
  const [websiteUrl, setWebsiteUrl] = useState(branding.websiteUrl || 'https://acmelocalseo.com');
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || '#16a34a');
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || '');

  // Default Scan Preferences
  const [defaultGridSize, setDefaultGridSize] = useState<number>(5);
  const [defaultStep, setDefaultStep] = useState<number>(1.0);
  const [defaultUnit, setDefaultUnit] = useState<'km' | 'mi'>('km');
  const [defaultCountry, setDefaultCountry] = useState('United States');

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      agencyName,
      contactEmail,
      phone,
      websiteUrl,
      primaryColor,
      logoUrl,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const presetColors = ['#16a34a', '#2563eb', '#7c3aed', '#ea580c', '#0f172a'];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Agency White-Label &amp; Scanner Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize white-label branding across PDF pitch decks, public links, and scanner defaults.
            </p>
          </div>
        </div>

        {isSaved && (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: White-Label Agency Profile */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Agency White-Label Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Agency Name</label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Direct Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Agency Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Agency Logo URL</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="https://youragency.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLogoUrl(
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'
                    )
                  }
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Use Sample
                </button>
              </div>
            </div>

            {/* Brand Color Picker */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Primary Brand Color Accent
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPrimaryColor(color)}
                      className={`w-7 h-7 rounded-xl transition cursor-pointer border-2 ${
                        primaryColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-mono text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Default Scan Preferences */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Default Scan Parameters</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Default Grid Dimension
                </label>
                <select
                  value={defaultGridSize}
                  onChange={(e) => setDefaultGridSize(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer font-medium"
                >
                  <option value={3}>3x3 (9 pins - Fast preview)</option>
                  <option value={5}>5x5 (25 pins - Standard Audit)</option>
                  <option value={7}>7x7 (49 pins - Deep Regional Scan)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Default Distance Unit
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setDefaultUnit('km')}
                    className={`py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      defaultUnit === 'km'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Kilometers (km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultUnit('mi')}
                    className={`py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      defaultUnit === 'mi'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Miles (mi)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Default Search Country
                </label>
                <select
                  value={defaultCountry}
                  onChange={(e) => setDefaultCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="United States">United States (en-US)</option>
                  <option value="United Kingdom">United Kingdom (en-GB)</option>
                  <option value="Canada">Canada (en-CA)</option>
                  <option value="Australia">Australia (en-AU)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-xs hover:shadow-emerald-600/25 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Agency Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
