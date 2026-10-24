/**
 * GeoRank Pro - Agency White-Label Branding Studio Modal
 * Path: /src/components/branding/BrandingModal.tsx
 */

import React, { useState } from 'react';
import { useBranding, DEFAULT_BRANDING } from '../../lib/context/BrandingContext.tsx';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Palette,
  Image,
  X,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  { name: 'Royal Indigo', hex: '#4f46e5' },
  { name: 'Emerald Growth', hex: '#059669' },
  { name: 'Sky Tech', hex: '#0284c7' },
  { name: 'Amber Pro', hex: '#d97706' },
  { name: 'Crimson Power', hex: '#e11d48' },
  { name: 'Midnight Slate', hex: '#475569' },
];

export const BrandingModal: React.FC<BrandingModalProps> = ({ isOpen, onClose }) => {
  const { branding, updateBranding, resetBranding } = useBranding();

  const [form, setForm] = useState(branding);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding(form);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    resetBranding();
    setForm(DEFAULT_BRANDING);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Agency White-Label Branding Studio
              </h3>
              <p className="text-[11px] text-slate-400">
                Personalize all client reports, pitch decks, and PDF exports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {/* Agency Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agency / Consultant Name *</span>
            </label>
            <input
              type="text"
              required
              value={form.agencyName}
              onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
              placeholder="e.g. Apex Local Growth Agency"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Contact Email *</span>
              </label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="growth@agency.com"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Direct Phone</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 019-2834"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agency Website</span>
            </label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://apexlocalagency.com"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agency Logo URL (Optional)</span>
            </label>
            <input
              type="text"
              value={form.logoUrl || ''}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://your-domain.com/logo.png"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Primary Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Brand Accent Color</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setForm({ ...form, primaryColor: swatch.hex })}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition cursor-pointer ${
                    form.primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                      ? 'border-white bg-slate-800 text-white shadow-xs'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span>{swatch.name}</span>
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  {form.primaryColor}
                </span>
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> REPORT FOOTER PREVIEW
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
              <span className="font-bold text-white">{form.agencyName || 'Your Agency'}</span>
              <span className="text-slate-400 text-[11px] font-mono">{form.contactEmail}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Brand Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
