/**
 * ProfitMaps AI / GeoRank Pro - Master Scans Log View
 * Path: /src/components/views/ScansListView.tsx
 *
 * Implements:
 * - Columns: Business Name, Category, Best Keyword, Keyword Count, Top 3 %, Last Scan Date, Actions
 * - 1-Click "View Map" and "Re-scan" triggers
 */

import React, { useState } from 'react';
import {
  ScanLine,
  Search,
  Plus,
  RotateCw,
  Share2,
  Calendar,
  CheckCircle2,
  MapPin,
  ExternalLink,
  FileText,
} from 'lucide-react';
import type { GridScanSummary } from '../../lib/serp/adapter.ts';

export interface ScanMasterRecord {
  id: string;
  businessName: string;
  category: string;
  bestKeyword: string;
  keywordCount: number;
  top3Percentage: number;
  lastScanDate: string;
  summary: GridScanSummary;
}

export interface ScansListViewProps {
  scans: ScanMasterRecord[];
  onSelectScan: (summary: GridScanSummary) => void;
  onOpenNewScan: () => void;
  onShareScan?: (summary: GridScanSummary) => void;
  onRescanItem?: (record: ScanMasterRecord) => void;
}

export const ScansListView: React.FC<ScansListViewProps> = ({
  scans,
  onSelectScan,
  onOpenNewScan,
  onShareScan,
  onRescanItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScans = scans.filter(
    (s) =>
      s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bestKeyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <ScanLine className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Master Geo-Grid Scans Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete historical audit log across all client coordinate grid scans
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenNewScan}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Radar Scan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by business, category, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Total Scans: <strong className="text-slate-900">{filteredScans.length}</strong>
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Best Keyword</th>
                <th className="py-3 px-4">Keywords Scanned</th>
                <th className="py-3 px-4">Top 3 %</th>
                <th className="py-3 px-4">Last Scan Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScans.length > 0 ? (
                filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                          {scan.businessName.charAt(0)}
                        </div>
                        <span>{scan.businessName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {scan.category}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-800">
                      &quot;{scan.bestKeyword}&quot;
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-bold">
                        {scan.keywordCount} kw
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          scan.top3Percentage >= 30
                            ? 'bg-emerald-50 text-emerald-700'
                            : scan.top3Percentage >= 10
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {scan.top3Percentage}% in 3-pack
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{scan.lastScanDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onSelectScan(scan.summary)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        View Map
                      </button>
                      {onRescanItem && (
                        <button
                          onClick={() => onRescanItem(scan)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                          title="Re-run Scan"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onShareScan && (
                        <button
                          onClick={() => onShareScan(scan.summary)}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                          title="Share Client Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          console.log('Client Report clicked from Scans list! Scan ID:', scan.id, 'Business:', scan.businessName);
                          window.open(`/reports/${scan.id || 'latest'}`, '_blank');
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                        title="Open Full Client Audit Report"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Report</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No scans found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
