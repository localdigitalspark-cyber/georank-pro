/**
 * ProfitMaps AI / GeoRank Pro - Left Navigation Sidebar
 * Path: /src/components/layout/AppSidebar.tsx
 *
 * Clean off-white/light theme sidebar with persistent workspace,
 * learn, and account navigation matching ProfitMaps AI design.
 */

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Compass,
  ScanLine,
  Presentation,
  Globe,
  Users,
  GraduationCap,
  Workflow,
  Settings,
  Briefcase,
  CreditCard,
  Receipt,
  Sparkles,
  Zap,
  ChevronRight,
  X,
} from 'lucide-react';
import { useBranding } from '../../lib/context/BrandingContext.tsx';

export type MainNavView =
  | 'dashboard'
  | 'businesses'
  | 'find-businesses'
  | 'scans'
  | 'pitch-pack'
  | 'site-builder'
  | 'leads'
  | 'training'
  | 'integrations'
  | 'settings'
  | 'clients'
  | 'plans'
  | 'billing';

export interface AppSidebarProps {
  activeNav: MainNavView;
  onSelectNav: (nav: MainNavView) => void;
  credits?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenBranding?: () => void;
  onOpenNewScan?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeNav = 'businesses',
  onSelectNav,
  credits = 78,
  isOpenMobile = false,
  onCloseMobile,
  onOpenBranding,
  onOpenNewScan,
}) => {
  const { branding } = useBranding();

  const workspaceItems: { id: MainNavView; label: string; icon: any; badge?: string; hasAi?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'businesses', label: 'Businesses', icon: Building2, badge: 'Active' },
    { id: 'find-businesses', label: 'Find businesses', icon: Compass },
    { id: 'scans', label: 'Scans', icon: ScanLine },
    { id: 'pitch-pack', label: 'Pitch Pack', icon: Presentation, hasAi: true },
    { id: 'site-builder', label: 'Site builder', icon: Globe },
    { id: 'leads', label: 'Leads', icon: Users },
  ];

  const learnItems: { id: MainNavView; label: string; icon: any; badge?: string; hasAi?: boolean }[] = [
    { id: 'training', label: 'Training', icon: GraduationCap },
  ];

  const accountItems: { id: MainNavView; label: string; icon: any; badge?: string; hasAi?: boolean }[] = [
    { id: 'integrations', label: 'Integrations', icon: Workflow },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'clients', label: 'Clients', icon: Briefcase },
    { id: 'plans', label: 'Plans', icon: CreditCard },
    { id: 'billing', label: 'Billing', icon: Receipt },
  ];

  const renderNavGroup = (title: string, items: typeof workspaceItems) => (
    <div className="py-2.5">
      <div className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <nav className="space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectNav(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border-r-2 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
              {item.hasAi && (
                <span className="flex items-center text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-500" />
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Logo & Brand Header */}
        <div className="h-16 px-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight">
                  ProfitMaps
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-medium">
                Geo-Grid Rank Tracker
              </p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-2 divide-y divide-slate-100">
          {renderNavGroup('Workspace', workspaceItems)}
          {renderNavGroup('Learn', learnItems)}
          {renderNavGroup('Account', accountItems)}
        </div>

        {/* Sidebar Footer: Credit Balance & Agency Switcher */}
        <div className="p-3 border-t border-slate-200/80 space-y-2.5 bg-slate-50/50">
          {/* Credit Balance Pill */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                <span>Credits Balance</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">
                {(credits * 25).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (credits / 100) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-600 leading-snug">
              <div>
                <span className="font-semibold text-slate-700">Credits: {(credits * 25).toLocaleString()} remaining</span>
                <span className="block text-[10px] text-slate-400 font-mono">Approx. {credits} scans at 25 credits/scan</span>
              </div>
              <button
                onClick={onOpenNewScan}
                className="text-emerald-700 font-semibold hover:text-emerald-800 transition cursor-pointer shrink-0 ml-1.5"
              >
                + Scan
              </button>
            </div>
          </div>

          {/* Agency User Card / White-label settings button */}
          <button
            onClick={onOpenBranding}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-left transition shadow-xs cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                {branding.agencyName ? branding.agencyName.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {branding.agencyName || 'GeoRank Agency'}
                </div>
                <div className="text-[10px] text-slate-600 truncate">
                  White-label setup
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
