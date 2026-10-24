/**
 * ProfitMaps AI / GeoRank Pro - 1-Page Preview Landing Page Route
 * Path: /src/app/preview/[businessSlug]/page.tsx
 *
 * Implements:
 * 1. Top sticky banner: "Preview site built for [Business Name] by Local Digital Spark" + [ Claim Your Site ] CTA.
 * 2. High-performance local agency preview site demonstrating 3-pack proof.
 * 3. Checkout Order Form ($29/mo Hosting + $99/mo Local Maps Keywords).
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Phone,
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  Lock,
  X,
  CreditCard,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Award,
} from 'lucide-react';

export interface PreviewPageProps {
  businessSlug?: string;
  onBackToDashboard?: () => void;
}

export const PreviewPage: React.FC<PreviewPageProps> = ({
  businessSlug: propSlug,
  onBackToDashboard,
}) => {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'bundle' | 'hosting'>('bundle');
  const [orderComplete, setOrderComplete] = useState(false);

  // Extract clean business name from slug
  const slug =
    propSlug ||
    (typeof window !== 'undefined'
      ? window.location.pathname.replace(/^\/preview\/?/, '').replace(/\/$/, '')
      : 'austin-premier-plumbing');

  const businessName = slug
    ? slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Austin Premier Plumbing';

  const category = businessName.toLowerCase().includes('phone')
    ? 'Phone & Device Repair'
    : businessName.toLowerCase().includes('drain')
    ? '24/7 Drain Cleaning'
    : 'Emergency Plumber';

  const city = businessName.toLowerCase().includes('brentwood') ? 'Brentwood' : 'Austin, TX';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP STICKY AGENCY PROSPECTING BANNER */}
      <div className="sticky top-0 z-50 bg-slate-950 text-white px-4 sm:px-6 py-2.5 shadow-md border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs text-slate-300">
            Preview site built for <strong className="text-white font-bold">{businessName}</strong> by{' '}
            <span className="text-emerald-400 font-semibold">Local Digital Spark</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Dashboard
            </button>
          )}

          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Claim Your Site</span>
          </button>
        </div>
      </div>

      {/* 2. PREVIEW SITE HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-11 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {businessName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-base text-slate-900">{businessName}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>Verified Local Service • {city}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="tel:(512)555-0199"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">24/7 Dispatch:</span>
              <span>(512) 555-0199</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Top-Rated Google 3-Pack Certified Service in {city}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Fast, Trusted {category} in {city}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Immediate dispatch, transparent flat-rate pricing, and master-certified technicians. We arrive on time, fix the problem right the first time, and back all work with a 100% satisfaction guarantee.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href="tel:(512)555-0199"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call For Same-Day Dispatch</span>
            </a>

            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-sm font-semibold shadow-2xs transition-all flex items-center justify-center space-x-2"
            >
              <span>Schedule Service Online</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Licensed &amp; Fully Insured</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>60-Min Emergency Response</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span>4.9 Star Verified Rating</span>
            </span>
          </div>
        </div>
      </section>

      {/* 4. KEY SERVICES GRID */}
      <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Our Core Local Services
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Comprehensive solutions tailored for homeowners and commercial businesses in {city}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">Emergency 24/7 Repairs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rapid response teams equipped with state-of-the-art diagnostic cameras and genuine replacement parts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">Complete System Overhauls</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full diagnostics, preventative maintenance, and code-compliant installations with upfront price guarantees.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">Commercial &amp; Residential</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Serving single-family homes, multi-tenant properties, and commercial facilities throughout the greater {city} area.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
        <p className="text-[11px] text-slate-400">
          Website powered &amp; optimized by Local Digital Spark Local SEO Agency.
        </p>
      </footer>

      {/* 6. MODAL: /order CHECKOUT */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Claim {businessName} Today</h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderComplete ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Site Claimed Successfully!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Your custom site and Google Maps Rank Accelerator plan are now active. Our team is finalizing your domain DNS routing.
                </p>
                <button
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    setOrderComplete(false);
                  }}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Select Your Plan
                  </label>

                  <div
                    onClick={() => setSelectedPlan('bundle')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPlan === 'bundle'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="radio"
                          checked={selectedPlan === 'bundle'}
                          onChange={() => {}}
                          className="accent-emerald-600"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Growth Bundle: Fast Hosting + 3-Pack Rank Engine
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Includes 25-point geo-grid tracking + monthly keyword expansion
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-slate-900">$128</span>
                        <span className="text-[10px] text-slate-500 block">/ mo</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('hosting')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPlan === 'hosting'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="radio"
                          checked={selectedPlan === 'hosting'}
                          onChange={() => {}}
                          className="accent-emerald-600"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Standard Website Hosting Only
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Cloudflare CDN, SSL security, fast mobile delivery
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-slate-900">$29</span>
                        <span className="text-[10px] text-slate-500 block">/ mo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="owner@yourdomain.com"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Details
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 font-mono">
                      <span>•••• •••• •••• 4242</span>
                      <CreditCard className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOrderComplete(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    Activate Site Now — {selectedPlan === 'bundle' ? '$128/mo' : '$29/mo'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
