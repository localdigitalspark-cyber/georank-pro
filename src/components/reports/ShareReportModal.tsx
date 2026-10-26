/**
 * GeoRank Pro - Share Report Modal
 * Path: /src/components/reports/ShareReportModal.tsx
 *
 * Displays the persistent public shareable link for client reports
 * with instant clipboard copy, feedback, and open in new tab.
 */

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import { trackReportShared } from '../../lib/telemetry/prospect-telemetry.ts';

export type ReportShareTier = 'full' | 'lite';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  scanId: string;
  businessName: string;
  initialTier?: ReportShareTier;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  scanId,
  businessName,
  initialTier = 'full',
}) => {
  const [selectedTier, setSelectedTier] = useState<ReportShareTier>(initialTier);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getTieredUrl = (base: string, tier: ReportShareTier) => {
    if (!base) return '';
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const isRelative = base.startsWith('/');
      const parsed = new URL(base, origin);
      parsed.searchParams.set('tier', tier);
      return isRelative ? `${parsed.pathname}${parsed.search}` : parsed.toString();
    } catch {
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}tier=${tier}`;
    }
  };

  const effectiveShareUrl = getTieredUrl(shareUrl, selectedTier);

  const handleCopy = () => {
    navigator.clipboard.writeText(effectiveShareUrl);
    trackReportShared(scanId, businessName, `share_modal_copy_${selectedTier}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Public Shareable Client Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Permanent read-only link for client presentations and cold outreach.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              Client Entity &amp; Report ID:
            </span>
            <div className="text-sm font-bold text-white flex items-center justify-between">
              <span>{businessName}</span>
              <span className="text-xs font-mono text-indigo-400 font-semibold">{scanId}</span>
            </div>
          </div>

          {/* Tier Selection Segmented Controls */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Select Report Experience &amp; Gating Tier:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="share-tier-full"
                onClick={() => setSelectedTier('full')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'full'
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Full Growth Audit</span>
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Complete
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Geo-Grid rankings + full 5-pillar omnichannel conversion leakage &amp; recovery roadmap.
                </p>
              </button>

              <button
                type="button"
                data-testid="share-tier-lite"
                onClick={() => setSelectedTier('lite')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedTier === 'lite'
                    ? 'bg-amber-950/50 border-amber-500 text-white shadow-sm ring-1 ring-amber-500'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lite SERP Teaser</span>
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                    Lead Gate
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Geo-Grid &amp; search volumes visible. Omnichannel leakage locked behind a lead request form.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Direct Public Access URL ({selectedTier === 'full' ? 'Full Audit' : 'Lite Teaser'}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={effectiveShareUrl}
                data-testid="share-report-url-input"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 select-all focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopy}
                data-testid="share-report-copy-btn"
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {selectedTier === 'full'
                  ? 'Full Interactive Client-Facing Experience'
                  : 'Prospecting Teaser with High-Intent Lead Gate'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {selectedTier === 'full'
                ? 'Anyone with this link can view the interactive Leaflet heatmap, executive visibility summary, dynamic revenue calculator, 5-pillar omnichannel diagnosis, and action steps. Admin controls and scan configs are hidden.'
                : 'Anyone with this link can view the interactive Leaflet heatmap and keyword volumes. The omnichannel leakage section displays a locked preview prompting them to request the full audit.'}
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>

            <a
              href={effectiveShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="share-report-open-tab"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Open Report in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
