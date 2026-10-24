/**
 * ProfitMaps AI / GeoRank Pro - Action Plan Modal
 * Path: /src/components/modals/ActionPlanModal.tsx
 *
 * Displays tactical local SEO recommendations derived from
 * the AI/deterministic geo-grid visibility audit.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Building,
  Layers,
  Star,
  Globe,
  Share2,
  Printer,
  ChevronRight,
  TrendingUp,
  Image,
  MessageCircle,
} from 'lucide-react';
import type { LocalSeoAuditOutput } from '../../lib/ai/audit-generator.ts';
import type { GridScanSummary } from '../../lib/serp/adapter.ts';
import { analyzeRankingFixes } from '../../server/services/ranking-fixes.ts';

export interface ActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: LocalSeoAuditOutput;
  scanSummary: GridScanSummary | null;
  onOpenProspectingStudio?: () => void;
  businessName?: string;
  category?: string;
}

export const ActionPlanModal: React.FC<ActionPlanModalProps> = ({
  isOpen,
  onClose,
  audit,
  scanSummary,
  onOpenProspectingStudio,
  businessName,
  category,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const bName = businessName || scanSummary?.target?.businessName || 'Local Business';
  const cat = category || scanSummary?.keyword || 'Local Service';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const rankingFixes = useMemo(() => {
    return analyzeRankingFixes({
      businessName: bName,
      category: cat,
      competitors: scanSummary?.dominantCompetitors?.map((c) => ({
        name: c.name,
        reviews: c.reviews,
        rating: c.rating,
      })),
    });
  }, [bName, cat, scanSummary?.dominantCompetitors]);

  const actionItems = [
    {
      key: 'review-deficit',
      title: 'Review Deficit vs. Top 3 Median',
      icon: Star,
      badge: `-${rankingFixes.reviewDeficit} Reviews Gap`,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: `Add ${rankingFixes.reviewDeficit} verified reviews to match the Top 3 competitor median (${rankingFixes.competitorMedianReviews} reviews).`,
    },
    {
      key: 'review-velocity',
      title: 'Review Velocity Acceleration',
      icon: TrendingUp,
      badge: '6+ / mo Target',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Competitors average 6-8 new reviews monthly. Deploy post-service QR checkouts to maintain review freshness.',
    },
    {
      key: 'review-keywords',
      title: 'Service & Location Keywords in Reviews',
      icon: MessageCircle,
      badge: 'Keyword Anchor',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: `Encourage customers to explicitly mention "${cat}" and their neighborhood in their Google review text.`,
    },
    {
      key: 'photos-citations',
      title: 'Photos (50+ Target) & 100% NAP Citations',
      icon: Image,
      badge: 'Trust Signal',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Profiles with 50+ photos receive 42% more direction requests. Sync NAP across 40+ Tier-1 directories.',
    },
    {
      key: 'reply-rate',
      title: 'Owner Response Rate (100% Target)',
      icon: Building,
      badge: 'Engagement Signal',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Maintain an 80%+ owner reply rate within 48 hours to signal high customer care to Google algorithms.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Local SEO 3-Pack Action Plan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tactical steps to expand centroid visibility and capture top rank
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Executive Summary Callout */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Spatial Diagnosis</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {audit.executiveSummary}
            </p>
          </div>

          {/* Missed Revenue / Call Opportunity */}
          {audit.missedRevenueEstimate && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Call Deficit Opportunity
              </span>
              <p className="text-emerald-900 leading-relaxed font-medium">
                {audit.missedRevenueEstimate}
              </p>
            </div>
          )}

          {/* Tactical Action Plan Steps */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              High-Priority Execution Steps
            </div>

            <div className="grid grid-cols-1 gap-3">
              {actionItems.map((item) => {
                const Icon = item.icon;
                const isCopied = copiedKey === item.key;
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                        <button
                          onClick={() => handleCopy(item.description, item.key)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                          title="Copy recommendation"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-9">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Based on {scanSummary?.totalNodes ?? 25} scanned coordinate pins
          </span>
          <div className="flex items-center space-x-2">
            {onOpenProspectingStudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenProspectingStudio();
                }}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Full Pitch Deck</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
