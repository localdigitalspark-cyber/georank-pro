/**
 * ProfitMaps AI / GeoRank Pro - "Claim-Your-Site" Prospecting Flow
 * Path: /src/components/outreach/ClaimSiteView.tsx
 *
 * Implements high-converting local agency prospecting flow:
 * 1. 1-Page Preview Landing Page at /preview/[businessSlug].
 * 2. Outreach Card: "Email the owner a picture" with pre-populated email/SMS templates and geo-grid preview.
 * 3. Top Sticky Banner: "Preview site built for [Business Name] by Local Digital Spark" with [ Claim Your Site ] CTA.
 * 4. Modal/Route: /order Order Checkout Form ($29/mo Hosting + $99/mo Local Maps Keywords).
 */

import React, { useState } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  X,
  Lock,
  Globe,
  Sliders,
} from 'lucide-react';

export interface ClaimSiteViewProps {
  businessName?: string;
  category?: string;
  city?: string;
  phone?: string;
  address?: string;
  top3Percentage?: number;
  averageRank?: number;
  onNavigateToPreview?: (slug: string) => void;
}

export const ClaimSiteView: React.FC<ClaimSiteViewProps> = ({
  businessName = 'Austin Premier Plumbing',
  category = 'Emergency Plumber',
  city = 'Austin, TX',
  phone = '(512) 555-0199',
  address = '1024 Congress Ave, Austin, TX 78701',
  top3Percentage = 16,
  averageRank = 11.4,
  onNavigateToPreview,
}) => {
  const [copiedType, setCopiedType] = useState<'email' | 'sms' | 'link' | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'bundle' | 'hosting'>('bundle');
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const businessSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const previewUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://profitmaps.ai'}/preview/${businessSlug}`;

  const emailSubject = `Quick question about ${businessName}'s Google Maps rankings in ${city}`;
  const emailBody = `Hi ${businessName} Team,

I ran a 25-point Google Maps local visibility audit for "${category}" across ${city} and noticed your profile currently ranks in the Top 3 for only ${top3Percentage}% of local neighborhood searches (average rank: #${averageRank.toFixed(1)}).

To show you exactly how to fix this, we built a complimentary high-performance preview website and 3-pack expansion plan for you:
${previewUrl}

Would you be open to a 3-minute screen share to see which competitors are intercepting your dispatch calls?

Best regards,
Local Digital Spark Team`;

  const smsBody = `Hi from Local Digital Spark! We mapped ${businessName}'s Google 3-Pack rank across ${city} and put together a free modern website preview + ranking plan: ${previewUrl} - Let us know what you think!`;

  const copyToClipboard = (text: string, type: 'email' | 'sms' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleLaunchEmailClient = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const handleLaunchSms = () => {
    window.location.href = `sms:?body=${encodeURIComponent(smsBody)}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Sticky Preview Banner Simulation */}
      <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-300">
            Preview site built for <strong className="text-white">{businessName}</strong> by Local Digital Spark
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => copyToClipboard(previewUrl, 'link')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedType === 'link' ? 'Copied Link' : 'Copy Preview Link'}</span>
          </button>

          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Claim Your Site</span>
          </button>
        </div>
      </div>

      {/* 2. Outreach Card: "Email the owner a picture" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Send className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold">Email the owner a picture of their rank grid</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              High-converting cold outreach sequence with their red/green 5x5 geo-grid screenshot + personalized preview website link.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLaunchEmailClient}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open in Email App</span>
            </button>
            <button
              onClick={handleLaunchSms}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send SMS</span>
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Script */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Pre-Populated Email Script</span>
              </span>
              <button
                onClick={() => copyToClipboard(emailBody, 'email')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                {copiedType === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'email' ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
              <strong className="text-slate-900 block pb-2 border-b border-slate-200 mb-2">
                Subject: {emailSubject}
              </strong>
              {emailBody}
            </div>
          </div>

          {/* SMS Script & Geo-Grid Thumbnail */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>SMS / WhatsApp Text Template</span>
                </span>
                <button
                  onClick={() => copyToClipboard(smsBody, 'sms')}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  {copiedType === 'sms' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'sms' ? 'Copied' : 'Copy SMS'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-inner">
                {smsBody}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Preview Landing Target</span>
                <span className="font-mono text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  /preview/{businessSlug}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                When the owner opens this link, they see their full branded site with your agency contact info and the prominent <strong>[ Claim Your Site ]</strong> checkout button.
              </p>
              <button
                onClick={() => onNavigateToPreview && onNavigateToPreview(businessSlug)}
                className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>View Full Page Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modal: /order Form ($29/mo Hosting + $99/mo Local Maps Keywords) */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Claim &amp; Activate {businessName}
                </h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSubmitted ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Site Claimed Successfully!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Subscription activated for <strong>{businessName}</strong>. Welcome onboard! Your 5x5 geo-grid keywords and live site deployment are now live.
                </p>
                <button
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    setOrderSubmitted(false);
                  }}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Plan Selection */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Select Your Plan
                  </label>

                  {/* Option 1: Bundle */}
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
                            Full Growth Bundle: Hosting + Local Maps Rank Engine
                          </span>
                          <span className="text-[11px] text-slate-500">
                            High-speed site hosting + automated weekly 5x5 geo-grid tracking
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-slate-900">
                          $128
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ month</span>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Hosting Only */}
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
                            Standard Hosting Only
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Cloudflare CDN, SSL security, and daily automated backups
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-slate-900">
                          $29
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkout Inputs */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Business Representative Email
                    </label>
                    <input
                      type="email"
                      placeholder="owner@austinpremierplumbing.com"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Method
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 font-mono">
                      <span>•••• •••• •••• 4242</span>
                      <CreditCard className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOrderSubmitted(true)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    Confirm &amp; Claim Site — {selectedPlan === 'bundle' ? '$128/mo' : '$29/mo'}
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
