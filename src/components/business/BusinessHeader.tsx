/**
 * ProfitMaps AI / GeoRank Pro - Business Profile Header & Sub-Navigation
 * Path: /src/components/business/BusinessHeader.tsx
 *
 * Displays business avatar, address, category, "+ New scan" green CTA,
 * "Client reports" action, and the ProfitMaps sub-navigation tab bar.
 */

import React, { useState } from 'react';
import type { GridScanSummary } from '../../lib/serp/adapter.ts';
import { useActiveScanMetrics } from '../../lib/hooks/useActiveScanMetrics.ts';
import {
  Building2,
  MapPin,
  Plus,
  FileText,
  Share2,
  Sparkles,
  Search,
  History,
  LayoutTemplate,
  Newspaper,
  MessageSquare,
  Users,
  ExternalLink,
  Tag,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

export type BusinessSubTab =
  | 'keywords'
  | 'todo'
  | 'site-plan'
  | 'scan-history'
  | 'prospecting'
  | 'page-articles'
  | 'gbp-posts'
  | 'leads';

export interface BusinessHeaderProps {
  businessName: string;
  address?: string;
  category?: string;
  activeSubTab: BusinessSubTab;
  onSelectSubTab: (tab: BusinessSubTab) => void;
  onOpenNewScan: () => void;
  onOpenReports: () => void;
  onBackToBusinesses?: () => void;
  onDeleteBusiness?: () => void;
  totalKeywords?: number;
  isScanning?: boolean;
  scanSummary?: GridScanSummary | null;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  address = 'Downtown Austin Metro Area, TX',
  category = 'Emergency Plumber',
  activeSubTab,
  onSelectSubTab,
  onOpenNewScan,
  onOpenReports,
  onBackToBusinesses,
  onDeleteBusiness,
  totalKeywords = 1,
  isScanning = false,
  scanSummary,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const metrics = useActiveScanMetrics(scanSummary || null, category, businessName);
  const tabs: { id: BusinessSubTab; label: string; count?: number; isAi?: boolean }[] = [
    { id: 'keywords', label: 'Keywords', count: totalKeywords },
    { id: 'todo', label: 'To-do', count: 4 },
    { id: 'site-plan', label: 'Site plan' },
    { id: 'scan-history', label: 'Scan history' },
    { id: 'prospecting', label: 'Prospecting Studio', isAi: true },
    { id: 'page-articles', label: 'Page articles' },
    { id: 'gbp-posts', label: 'GBP posts' },
    { id: 'leads', label: 'Leads' },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 pt-5 pb-1 w-full max-w-full overflow-hidden">
      {/* Business Meta Profile & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div className="flex items-start sm:items-center space-x-3.5">
          {/* Back button if navigating from directory */}
          {onBackToBusinesses && (
            <button
              onClick={onBackToBusinesses}
              className="p-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl transition cursor-pointer shrink-0"
              title="Return to all businesses"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Business Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 font-bold text-lg shadow-xs shrink-0">
            {businessName ? businessName.charAt(0).toUpperCase() : 'B'}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {businessName}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <Tag className="w-3 h-3 mr-1 text-slate-600" />
                {category}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${metrics.operationalBadge.pillClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${metrics.operationalBadge.dotClass}`} />
                <span>{metrics.operationalBadge.label}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-xs">{address}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                Avg Rank: <strong className="text-rose-600">{metrics.formattedRank}</strong>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                Top 3: <strong className="text-emerald-600">{metrics.formattedTop3}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              console.log('Client Report clicked! Current active business:', businessName);
              if (onOpenReports) {
                onOpenReports();
              } else {
                window.open('/reports/latest', '_blank');
              }
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Client reports</span>
          </button>

          {onDeleteBusiness && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/90 hover:border-rose-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Delete this business and its scans"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}

          <button
            onClick={onOpenNewScan}
            disabled={isScanning}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isScanning ? 'Scanning...' : 'New scan'}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Delete &quot;{businessName}&quot;?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this business? All associated geo-grid rankings, keyword telemetry, and saved client reports will be permanently purged.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  if (onDeleteBusiness) onDeleteBusiness();
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-rose-600/20 transition cursor-pointer"
              >
                Yes, Delete Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sub-Navigation Select Dropdown */}
      <div className="mobile-subtab-select-container sm:hidden pb-3 pt-1 border-t border-slate-100">
        <label htmlFor="mobile-subtab-select" className="sr-only">
          Select View
        </label>
        <div className="relative">
          <select
            id="mobile-subtab-select"
            data-testid="mobile-subtab-select"
            value={activeSubTab}
            onChange={(e) => onSelectSubTab(e.target.value as BusinessSubTab)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs appearance-none cursor-pointer pr-10"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''} {tab.isAi ? '✦ AI' : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Desktop Sub-Navigation Tabs */}
      <div className="desktop-subtab-container hidden sm:flex items-center space-x-1 overflow-x-auto no-scrollbar border-t border-slate-100 pt-1 -mb-px">
        {tabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSubTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.isAi && (
                <span className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-500" />
                  AI Studio
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
