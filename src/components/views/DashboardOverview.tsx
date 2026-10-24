/**
 * ProfitMaps AI / GeoRank Pro - Workspace Dashboard Overview
 * Path: /src/components/views/DashboardOverview.tsx
 *
 * Implements:
 * - Top 4 Metric KPI Cards (3-Pack Share, Scans Run, Tracked Keywords, Credits)
 * - Main Section: Current target business summary with quick keyword switcher pills
 * - Side Widgets: Biggest Movers & Recent AI Content Generated
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  ScanLine,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RotateCw,
  Plus,
  ChevronRight,
  ExternalLink,
  MapPin,
  Users,
  Tag,
  CheckCircle2,
  Calendar,
  FileCode,
  FileText,
  MessageSquare,
} from 'lucide-react';
import type { GridScanSummary } from '../../lib/serp/adapter.ts';
import { BusinessSearchInput, type ResolvedLocation } from '../search/BusinessSearchInput.tsx';

export interface DashboardOverviewProps {
  businessName: string;
  scanSummary: GridScanSummary | null;
  credits: number;
  onOpenNewScan: () => void;
  onViewBusinessMap: () => void;
  onOpenPitchPack: () => void;
  onSelectBusiness?: (businessName: string) => void;
  onLocationResolved?: (location: ResolvedLocation) => void;
  centerLat?: number;
  centerLng?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  businessName,
  scanSummary,
  credits,
  onOpenNewScan,
  onViewBusinessMap,
  onOpenPitchPack,
  onLocationResolved,
  centerLat = 30.2672,
  centerLng = -97.7431,
}) => {
  const [activeKeywordPill, setActiveKeywordPill] = useState('Emergency Plumber');

  const topMetrics = [
    {
      title: '3-Pack Share',
      value: '28%',
      subtext: 'of the map in top 3',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 text-emerald-700',
      icon: TrendingUp,
    },
    {
      title: 'Scans Run',
      value: '13',
      subtext: 'Scans in the last 30 days',
      color: 'text-slate-900',
      bg: 'bg-blue-50 text-blue-700',
      icon: ScanLine,
    },
    {
      title: 'Tracked Keywords',
      value: '13',
      subtext: 'Keywords scanned',
      color: 'text-slate-900',
      bg: 'bg-amber-50 text-amber-700',
      icon: Tag,
    },
    {
      title: 'Credits',
      value: `${credits}`,
      subtext: 'Credits left',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 text-emerald-700',
      icon: Sparkles,
    },
  ];

  const biggestMovers = [
    {
      keyword: 'Emergency Plumber',
      business: 'Austin Premier Plumbing',
      change: '+4 positions',
      currentRank: '#3',
      isUp: true,
    },
    {
      keyword: 'Drain Cleaning 24/7',
      business: 'Austin Premier Plumbing',
      change: '+2 positions',
      currentRank: '#5',
      isUp: true,
    },
    {
      keyword: 'Water Heater Repair',
      business: 'Capital City Drains',
      change: '-1 position',
      currentRank: '#8',
      isUp: false,
    },
    {
      keyword: 'Commercial Pipe Relining',
      business: 'Northside Master Plumbers',
      change: '+3 positions',
      currentRank: '#4',
      isUp: true,
    },
  ];

  const recentAiContent = [
    {
      id: 1,
      title: 'GBP Weekly Offer Post: 24/7 Rapid Response',
      type: 'Google Business Profile',
      time: '12m ago',
      icon: MessageSquare,
      badge: 'Ready to Post',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 2,
      title: 'Localized Landing Page: /austin-emergency-plumbing',
      type: 'Site Builder (HTML & Schema)',
      time: '2h ago',
      icon: FileCode,
      badge: 'Published',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 3,
      title: 'White-Label Pitch Deck: Austin Premier Audit',
      type: 'Client Prospecting Studio',
      time: '4h ago',
      icon: FileText,
      badge: 'PDF Ready',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 4,
      title: 'Cold Outreach Sequence: 45 Lost Calls Angle',
      type: 'Cold Pitch Generator',
      time: 'Yesterday',
      icon: Sparkles,
      badge: 'Copied',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  const keywordsPills = [
    { label: 'Emergency Plumber', coverage: '28%', rank: '#4.2' },
    { label: '24/7 Drain Cleaning', coverage: '16%', rank: '#7.1' },
    { label: 'Water Heater Repair', coverage: '36%', rank: '#3.0' },
    { label: 'Pipe Relining Austin', coverage: '8%', rank: '#12.4' },
  ];

  return (
    <div className="space-y-5">
      {/* Live Business Search & Geocoding Resolver */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Launch Live Geo-Scan For Any Business</span>
          </label>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Type any business name, address, or trade (e.g. Apex Plumbing, Alton) and press Enter
          </span>
        </div>
        <BusinessSearchInput
          initialBusinessName=""
          onLocationResolved={(loc) => {
            if (onLocationResolved) onLocationResolved(loc);
          }}
          centerLat={centerLat}
          centerLng={centerLng}
          placeholder="Search any local business name, address, or category to launch live scan (e.g. Apex Plumbing, Alton)..."
        />
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  {m.title}
                </span>
                <span className={`text-2xl font-black font-mono mt-0.5 block ${m.color}`}>
                  {m.value}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-1">
                  {m.subtext}
                </span>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${m.bg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Section: Current Target Business + Quick Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Target Business Mini-Map & Radar Telemetry */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm flex items-center justify-center border border-emerald-200">
                {businessName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{businessName}</h3>
                <span className="text-[11px] text-slate-500">
                  Downtown Austin Metro Area • 5x5 Grid Monitored
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onViewBusinessMap}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <span>Interactive Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Keyword Switcher Pills */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Monitored Keywords:
            </span>
            <div className="flex flex-wrap gap-2">
              {keywordsPills.map((kw) => (
                <button
                  key={kw.label}
                  onClick={() => setActiveKeywordPill(kw.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                    activeKeywordPill === kw.label
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{kw.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      activeKeywordPill === kw.label
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white text-slate-600'
                    }`}
                  >
                    {kw.coverage} top 3 ({kw.rank})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini Telemetry Overview Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Selected Keyword
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {activeKeywordPill}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Local Pack Status
              </span>
              <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                {scanSummary ? `${scanSummary.top3Percentage}% in-pack` : '28.0% in-pack'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Average SERP Position
              </span>
              <span className="text-sm font-bold text-rose-600 font-mono block mt-0.5">
                {scanSummary ? `#${scanSummary.averageRank}` : '#4.2'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Biggest Movers Widget */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Biggest Rank Movers
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Past 7 Days</span>
            </div>

            <div className="divide-y divide-slate-100 pt-1">
              {biggestMovers.map((mover, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{mover.keyword}</div>
                    <div className="text-[10px] text-slate-500">{mover.business}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                        mover.isUp
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {mover.change}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      Now {mover.currentRank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenNewScan}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            + Run Comparative Scan
          </button>
        </div>
      </div>

      {/* Recent AI Content Generated Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">
              Recent AI Local SEO Content Generated
            </h3>
          </div>
          <button
            onClick={onOpenPitchPack}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
          >
            View Pitch Pack &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentAiContent.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 hover:border-slate-300 transition space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Icon className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-500 block">{item.type}</span>
                </div>

                <div className="pt-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
