/**
 * GeoRank Pro - Dedicated Keywords Tracking Metrics Table & Sub-View
 * Path: /src/components/keywords/KeywordsView.tsx
 *
 * Implements a comprehensive keyword tracking table displaying:
 * - Keyword search terms
 * - Tracking frequency (Weekly, Daily, etc.)
 * - Current SERP Rank (#4.2, #5.4)
 * - 30-Day Movement delta badges (▲ +1.8, ▼ -1.6, ● 0.0)
 * - Top 3 In-Pack coverage % with visual meter
 * - Last Checked scan timestamp
 * - Actions: Immediate Re-scan & Tracking Configuration
 */

import React from 'react';
import {
  Tag,
  Clock,
  RotateCw,
  Sliders,
  Sparkles,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import type { KeywordChip } from '../map/ProfitMapsView.tsx';
import type { KeywordDelta } from '../../lib/types.ts';

export interface KeywordsViewProps {
  businessName: string;
  keywords: KeywordChip[];
  keywordDeltas?: Record<string, KeywordDelta>;
  trackingFrequency?: string;
  activeKeyword: string;
  onSelectKeyword?: (keyword: string) => void;
  onRescanKeyword?: (keyword: string) => void;
  onOpenTrackingModal?: () => void;
  onOpenAddKeyword?: () => void;
  onOpenDiscovery?: () => void;
}

export const KeywordsView: React.FC<KeywordsViewProps> = ({
  businessName,
  keywords,
  keywordDeltas = {},
  trackingFrequency = 'weekly',
  activeKeyword,
  onSelectKeyword,
  onRescanKeyword,
  onOpenTrackingModal,
  onOpenAddKeyword,
  onOpenDiscovery,
}) => {
  return (
    <div
      data-testid="keywords-metrics-table-container"
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 w-full overflow-hidden"
    >
      {/* Table Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Keyword Tracking &amp; Volatility Metrics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {keywords.length} Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time SERP deltas and automated tracking performance for <strong className="text-slate-800">{businessName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {onOpenDiscovery && (
            <button
              type="button"
              onClick={onOpenDiscovery}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discover Keywords</span>
            </button>
          )}

          {onOpenAddKeyword && (
            <button
              type="button"
              onClick={onOpenAddKeyword}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Keyword</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <table className="w-full text-left border-collapse min-w-[720px]" data-testid="keywords-table">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
              <th className="py-2.5 px-4 rounded-l-xl">Keyword</th>
              <th className="py-2.5 px-3">Frequency</th>
              <th className="py-2.5 px-3">Current Rank</th>
              <th className="py-2.5 px-3">30-Day Movement</th>
              <th className="py-2.5 px-3">Top 3 In-Pack</th>
              <th className="py-2.5 px-3">Last Checked</th>
              <th className="py-2.5 px-4 text-right rounded-r-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {keywords.map((chip) => {
              const kw = chip.keyword;
              const isSelected = activeKeyword.toLowerCase() === kw.toLowerCase();
              const delta = keywordDeltas[kw] || (chip.delta ? {
                keyword: kw,
                avgSerpDelta: chip.delta.avgSerpDelta,
                inPackDelta: 0,
                currentAvgSerp: chip.averageRank,
                badgeText: chip.delta.shortText,
                isPositive: chip.delta.isPositive,
                isNegative: chip.delta.isNegative,
                status: chip.delta.isPositive ? 'improved' : chip.delta.isNegative ? 'dropped' : 'stable',
              } : null);

              const deltaText = delta?.badgeText || (chip.delta?.shortText ?? '● 0.0');
              const isPos = delta ? delta.isPositive : (chip.delta?.isPositive ?? false);
              const isNeg = delta ? delta.isNegative : (chip.delta?.isNegative ?? false);

              const rankNum = delta?.currentAvgSerp || chip.averageRank;
              const formattedRank = typeof rankNum === 'number' ? `#${rankNum.toFixed(1)}` : '#—';
              const lastCheckedText = delta?.lastScannedAt
                ? new Date(delta.lastScannedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Today';

              return (
                <tr
                  key={chip.id}
                  data-testid={`keyword-row-${chip.id}`}
                  onClick={() => onSelectKeyword && onSelectKeyword(kw)}
                  className={`transition group cursor-pointer ${
                    isSelected ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Column 1: Keyword */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Tag className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                        {kw}
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          Active Map
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 2: Frequency */}
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{trackingFrequency || 'Weekly'}</span>
                    </span>
                  </td>

                  {/* Column 3: Current Rank */}
                  <td className="py-3 px-3">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                        rankNum <= 3
                          ? 'bg-emerald-100 text-emerald-800'
                          : rankNum <= 10
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {formattedRank}
                    </span>
                  </td>

                  {/* Column 4: 30-Day Movement Delta Badge */}
                  <td className="py-3 px-3">
                    <span
                      data-testid={`keyword-table-delta-${chip.id}`}
                      className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                        isPos
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isNeg
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {deltaText}
                    </span>
                  </td>

                  {/* Column 5: Top 3 In-Pack */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {chip.top3Percentage}%
                      </span>
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            chip.top3Percentage >= 30
                              ? 'bg-emerald-600'
                              : chip.top3Percentage >= 10
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, chip.top3Percentage)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Column 6: Last Checked */}
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    <span>{lastCheckedText}</span>
                  </td>

                  {/* Column 7: Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      {onRescanKeyword && (
                        <button
                          type="button"
                          onClick={() => onRescanKeyword(kw)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title={`Run immediate scan for "${kw}"`}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onOpenTrackingModal && (
                        <button
                          type="button"
                          onClick={onOpenTrackingModal}
                          className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Configure tracking & alerts"
                        >
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Track</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
