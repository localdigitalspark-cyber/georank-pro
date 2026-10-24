/**
 * ProfitMaps AI / GeoRank Pro - Business Profile Header & Sub-Navigation
 * Path: /src/components/business/BusinessHeader.tsx
 *
 * Displays business avatar, address, category, "+ New scan" green CTA,
 * "Client reports" action, and the ProfitMaps sub-navigation tab bar.
 */

import React from 'react';
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
  totalKeywords?: number;
  isScanning?: boolean;
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
  totalKeywords = 1,
  isScanning = false,
}) => {
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
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 pt-5 pb-1">
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
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {businessName}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <Tag className="w-3 h-3 mr-1 text-slate-600" />
                {category}
              </span>
            </div>

            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-600">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {address}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-medium">Verified Centroid</span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-2.5 shrink-0">
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

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-t border-slate-100 pt-1 -mb-px">
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
