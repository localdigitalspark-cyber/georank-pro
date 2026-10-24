/**
 * ProfitMaps AI / GeoRank Pro - Visibility Scorecard & Executive Priority Fixes
 * Path: /src/components/dashboard/VisibilityScorecard.tsx
 *
 * Renders prioritized executive fixes ordered by ranking impact:
 * - Fix #1 (Relevance): Build missing service pages that match search queries.
 * - Fix #2 (Trust): Launch review acceleration campaign to close the competitor review gap.
 * - Fix #3 (Consistency): Correct Name, Address, Phone (NAP) variations across local directories.
 */

import React from 'react';
import {
  ShieldAlert,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Star,
  Layers,
  ChevronRight,
  Award,
} from 'lucide-react';
import {
  type ExecutivePriorityFix,
  type RankingFixesReport,
  analyzeRankingFixes,
} from '../../server/services/ranking-fixes.ts';

export interface VisibilityScorecardProps {
  report?: RankingFixesReport;
  businessName?: string;
  category?: string;
  city?: string;
  reviews?: number;
  onNavigateToBuilder?: () => void;
  onNavigateToTodoList?: () => void;
}

export const VisibilityScorecard: React.FC<VisibilityScorecardProps> = ({
  report: propReport,
  businessName = 'Austin Premier Plumbing',
  category = 'Emergency Plumber',
  city = 'Austin, TX',
  reviews = 38,
  onNavigateToBuilder,
  onNavigateToTodoList,
}) => {
  const report =
    propReport ||
    analyzeRankingFixes({
      businessName,
      category,
      city,
      reviews,
    });

  const getPillarIcon = (pillar: 'Relevance' | 'Trust' | 'Consistency') => {
    switch (pillar) {
      case 'Relevance':
        return <FileCode className="w-5 h-5 text-emerald-600" />;
      case 'Trust':
        return <Star className="w-5 h-5 text-amber-500" />;
      case 'Consistency':
        return <Layers className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPillarBadge = (pillar: 'Relevance' | 'Trust' | 'Consistency') => {
    switch (pillar) {
      case 'Relevance':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Trust':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Consistency':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Target className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Executive Priority Fixes: What Moves the Rank Needle Most
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic diagnostic analysis comparing <strong className="text-slate-700">{report.businessName}</strong> against Top 3 local rivals in {report.city}.
            </p>
          </div>
          {onNavigateToTodoList && (
            <button
              onClick={onNavigateToTodoList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
            >
              <span>View All Action Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Executive Fixes Cards */}
      <div className="p-6 space-y-4">
        {report.executiveFixes.map((fix) => (
          <div
            key={fix.rank}
            className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50/70 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-800 text-sm shadow-2xs">
                  #{fix.rank}
                </div>
                <div className="flex items-center space-x-2">
                  {getPillarIcon(fix.pillar)}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Fix #{fix.rank} ({fix.pillar}): {fix.headline}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPillarBadge(fix.pillar)}`}>
                  {fix.pillar}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {fix.expectedRankGain}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-11">
              {fix.subhead}
            </p>

            <div className="pl-11 grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {fix.actionItems.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 flex items-start space-x-2 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">{action}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
