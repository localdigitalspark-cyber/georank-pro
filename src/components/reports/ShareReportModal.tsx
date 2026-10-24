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
} from 'lucide-react';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  scanId: string;
  businessName: string;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  scanId,
  businessName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Direct Public Access URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 select-all focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <button
                type="button"
                onClick={handleCopy}
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
              <span>Full Interactive Client-Facing Experience</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Anyone with this link can view the interactive Leaflet heatmap, executive visibility summary, dynamic revenue calculator, and action steps. Admin controls and scan configs are hidden.
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
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
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
