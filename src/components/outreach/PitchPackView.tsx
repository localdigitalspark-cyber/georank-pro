/**
 * GeoRank Pro - Internal Agency Pitch Pack & Cold Outreach Studio
 * Path: /src/components/outreach/PitchPackView.tsx
 *
 * Dedicated INTERNAL agency prospecting view:
 * - 1-Click copyable personalized cold outreach email hook
 * - 30-Second voicemail & SMS follow-up scripts
 * - Live objection handling talking points for agency sales calls
 * - One-click preview of the public client-facing audit deck
 */

import React, { useState } from 'react';
import { useBranding } from '../../lib/context/BrandingContext.tsx';
import type { LocalSeoAuditOutput } from '../../lib/ai/audit-generator.ts';
import type { GridScanSummary } from '../../lib/serp/adapter.ts';
import {
  Mail,
  Copy,
  Check,
  Phone,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  Building,
  Target,
  MessageSquare,
  FileText,
  Printer,
  Compass,
} from 'lucide-react';

export interface PitchPackViewProps {
  audit?: Partial<LocalSeoAuditOutput> | null;
  scanSummary?: Partial<GridScanSummary> | null;
  onRegenerateAudit?: () => void;
  isRegenerating?: boolean;
  onOpenClientReport?: () => void;
}

const DEFAULT_AUDIT: LocalSeoAuditOutput = {
  executiveSummary:
    'Geo-grid spatial analysis reveals significant centroid lock-in: visibility drops steeply outside your immediate centroid radius. Across the scanned service area, high-margin searchers are routed almost exclusively to nearby competitors.',
  missedRevenueEstimate:
    'Google Maps Local Pack (Top 3) commands ~70% of high-intent phone calls and direction requests. Ranking outside the 3-pack across most of your territory results in an estimated 45 to 65 missed inbound dispatch calls per month.',
  actionPlan: {
    gbpCategories:
      'Audit primary and secondary GBP categories: Ensure your primary category precisely matches your core specialization and add 3 to 5 targeted secondary service categories.',
    citations:
      'Standardize NAP across core data aggregators (Data Axle, Localeze, Foursquare) and sync hyper-local directory citations to reinforce entity authority.',
    reviews:
      'Launch an automated post-job SMS review flow encouraging verified customers to mention specific suburbs, neighborhoods, and service keywords in their feedback.',
    onPageLocalizedContent:
      'Deploy dedicated suburb landing pages with LocalBusiness GeoCoordinates schema markup linked directly to your GBP CID.',
  },
  coldOutreachPitch: {
    subjectLine: 'Quick question regarding local Google Maps reach',
    emailBody:
      'Hi team,\n\nI was running a geo-grid visibility audit for local service providers in your area and pulled up your live Google Maps rank radius.\n\nWhile you rank well right next to your office, your visibility drops outside your immediate 1-mile radius where competitors are capturing 70%+ of the incoming calls.\n\nI compiled a visual color-coded geo-map showing where calls are dropping off. Mind if I send over the screenshot?\n\nBest regards,\nLocal Growth Team',
    smsOrVoicemailScript:
      "Hey, ran a 25-pin Google Maps radar audit across our area—you're strong within 2 blocks, but beyond 1 mile competitors take 70% of phone calls. Mind if I text over the 1-page visual map breakdown?",
  },
};

export const PitchPackView: React.FC<PitchPackViewProps> = ({
  audit: propAudit,
  scanSummary,
  onRegenerateAudit,
  isRegenerating = false,
  onOpenClientReport,
}) => {
  const { branding } = useBranding();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const safeAudit = {
    ...DEFAULT_AUDIT,
    ...(propAudit || {}),
    coldOutreachPitch: {
      ...DEFAULT_AUDIT.coldOutreachPitch,
      ...(propAudit?.coldOutreachPitch || {}),
    },
  };

  const businessName = scanSummary?.target?.businessName || 'Target Business';
  const keyword = scanSummary?.keyword || 'Emergency Service';
  const totalNodes = scanSummary?.totalNodes || 25;
  const avgRank = scanSummary?.averageRank ? scanSummary.averageRank.toFixed(1) : '11.4';
  const top3Percentage = scanSummary?.top3Percentage ?? 16.0;

  const comp1 = scanSummary?.dominantCompetitors?.[0]?.name || 'Apex Premier Solutions';
  const comp2 = scanSummary?.dominantCompetitors?.[1]?.name || 'Capital City Express Masters';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Studio Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Agency Cold Outreach Studio &amp; Pitch Generator
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal prospecting kit for <strong className="text-slate-800">{businessName}</strong> • Designed for outbound email, cold calls, and SMS outreach.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenClientReport && (
            <button
              onClick={onOpenClientReport}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer border border-slate-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View Client Report</span>
            </button>
          )}

          {onRegenerateAudit && (
            <button
              onClick={onRegenerateAudit}
              disabled={isRegenerating}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 border border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isRegenerating ? 'Generating...' : 'Refresh AI Scripts'}</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pitch Pack</span>
          </button>
        </div>
      </div>

      {/* Prospect Overview Pill */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Prospect Business</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">
            {businessName}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Target Keyword</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">
            {keyword}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Average Grid Rank</span>
          <span className="font-mono font-bold text-rose-600 text-xs sm:text-sm block mt-0.5">
            #{avgRank} ({top3Percentage}% 3-Pack)
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-mono uppercase block">Key Competitor Stealing Calls</span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block mt-0.5">
            {comp1}
          </span>
        </div>
      </div>

      {/* 1. Personalized Cold Outreach Hook Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Personalized Cold Outreach Hook (Ready to Send)
              </h2>
              <p className="text-xs text-slate-500">
                Crafted to achieve high open rates and instant interest without sounding like spam.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              copyToClipboard(
                `Subject: ${safeAudit.coldOutreachPitch.subjectLine}\n\n${safeAudit.coldOutreachPitch.emailBody}`,
                'emailFull'
              )
            }
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            {copiedKey === 'emailFull' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Full Email</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Cold Email</span>
              </>
            )}
          </button>
        </div>

        {/* Subject Line Row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Subject Line</span>
            <button
              onClick={() => copyToClipboard(safeAudit.coldOutreachPitch.subjectLine, 'subject')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              {copiedKey === 'subject' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'subject' ? 'Copied' : 'Copy Subject'}</span>
            </button>
          </div>
          <div className="text-xs font-semibold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {safeAudit.coldOutreachPitch.subjectLine}
          </div>
        </div>

        {/* Email Body */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">Email Body</span>
            <button
              onClick={() => copyToClipboard(safeAudit.coldOutreachPitch.emailBody, 'body')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              {copiedKey === 'body' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'body' ? 'Copied' : 'Copy Body'}</span>
            </button>
          </div>
          <div className="text-xs text-slate-800 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed font-mono">
            {safeAudit.coldOutreachPitch.emailBody}
          </div>
        </div>

        {/* SMS & Voicemail Follow-up Script */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
              30-Second Follow-up Voicemail / SMS Script
            </span>
            <button
              onClick={() => copyToClipboard(safeAudit.coldOutreachPitch.smsOrVoicemailScript, 'sms')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              {copiedKey === 'sms' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'sms' ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-700 italic bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80">
            &quot;{safeAudit.coldOutreachPitch.smsOrVoicemailScript}&quot;
          </p>
        </div>
      </div>

      {/* 2. Phone Call Talking Points & Objection Crushing */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
          <Phone className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Cold Call Strategy &amp; Live Phone Script
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wide block">
              1. The Pattern Interrupt (Opening)
            </span>
            <p className="text-slate-700 leading-relaxed">
              &quot;Hey [Owner Name], this is {branding.agencyName}. I know you weren&apos;t expecting my call—I pulled up your Google Maps geo-grid for {keyword} in town and noticed something surprising about your 1-mile drop-off.&quot;
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wide block">
              2. The Competitor Intercept (Hook)
            </span>
            <p className="text-slate-700 leading-relaxed">
              &quot;Right around your shop you rank #1, but starting just 1 mile east, {comp1} and {comp2} take 80% of the customer calls because your profile has zero sub-service landing pages.&quot;
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wide block">
              3. The Low-Friction Close (Offer)
            </span>
            <p className="text-slate-700 leading-relaxed">
              &quot;I have the visual 25-pin heatmap map ready. Can I text or email you the direct link right now so you can see where you&apos;re leaking calls?&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
