/**
 * ProfitMaps AI / GeoRank Pro - Top Agency Navigation Header
 * Path: /src/components/layout/AppHeader.tsx
 *
 * Provides dynamic breadcrumb navigation, agency switcher, credit indicator,
 * notification bell with dropdown, and integrations quick actions.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Workflow,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Building2,
  ExternalLink,
  LayoutDashboard,
  Compass,
  ScanLine,
  Presentation,
  Globe,
  Users,
  GraduationCap,
  Settings,
  Briefcase,
  CreditCard,
  Receipt,
  FileText,
  LineChart,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';
import { useBranding } from '../../lib/context/BrandingContext.tsx';
import type { SerpScanMode } from '../../lib/serp/adapter.ts';
import type { MainNavView } from './AppSidebar.tsx';
import { BusinessSearchInput, type ResolvedLocation } from '../search/BusinessSearchInput.tsx';

export interface AppHeaderProps {
  businessName?: string;
  currentView?: MainNavView;
  onOpenMobileMenu?: () => void;
  onOpenBranding?: () => void;
  onOpenNewScan?: () => void;
  credits?: number;
  scanMode: SerpScanMode;
  onToggleScanMode?: (mode: SerpScanMode) => void;
  hasDataForSeoCreds?: boolean;
  centerLat?: number;
  centerLng?: number;
  onLocationResolved?: (location: ResolvedLocation) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  businessName = 'Austin Premier Plumbing',
  currentView = 'businesses',
  onOpenMobileMenu,
  onOpenBranding,
  onOpenNewScan,
  credits = 78,
  scanMode,
  onToggleScanMode,
  hasDataForSeoCreds = false,
  centerLat = 30.2672,
  centerLng = -97.7431,
  onLocationResolved,
}) => {
  const { branding } = useBranding();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'Geo-Grid Scan Complete',
      desc: `Rank radar completed for ${businessName}.`,
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'Competitor Velocity Alert',
      desc: '3 local rivals gained Top 3 positions in North Austin.',
      time: '1h ago',
      unread: false,
    },
    {
      id: 3,
      title: 'Audit Pitch Deck Generated',
      desc: 'AI Client Prospecting report ready for download.',
      time: '3h ago',
      unread: false,
    },
  ];

  const renderBreadcrumb = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dashboard Overview</span>
            </div>
          </>
        );
      case 'prospects':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <LineChart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prospects &amp; Pipeline</span>
            </div>
          </>
        );
      case 'find-businesses':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Find Businesses</span>
            </div>
          </>
        );
      case 'scans':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
              <span>Scans Radar Log</span>
            </div>
          </>
        );
      case 'pitch-pack':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Presentation className="w-3.5 h-3.5 text-amber-500" />
              <span>Pitch Pack Studio</span>
            </div>
          </>
        );
      case 'site-builder':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Site builder</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{businessName}</span>
            </div>
          </>
        );
      case 'leads':
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inbound Leads</span>
            </div>
          </>
        );
      case 'training':
        return (
          <>
            <span className="text-slate-500 font-medium">Learn</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Training Academy</span>
            </div>
          </>
        );
      case 'integrations':
        return (
          <>
            <span className="text-slate-500 font-medium">Account</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Workflow className="w-3.5 h-3.5 text-emerald-600" />
              <span>Integrations</span>
            </div>
          </>
        );
      case 'settings':
        return (
          <>
            <span className="text-slate-500 font-medium">Account</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Settings className="w-3.5 h-3.5 text-emerald-600" />
              <span>Settings &amp; White-Label</span>
            </div>
          </>
        );
      case 'clients':
        return (
          <>
            <span className="text-slate-500 font-medium">Account</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clients Directory</span>
            </div>
          </>
        );
      case 'plans':
        return (
          <>
            <span className="text-slate-500 font-medium">Account</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Subscription Plans</span>
            </div>
          </>
        );
      case 'billing':
        return (
          <>
            <span className="text-slate-500 font-medium">Account</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Billing &amp; Invoices</span>
            </div>
          </>
        );
      case 'businesses':
      default:
        return (
          <>
            <span className="text-slate-500 font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Businesses</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 font-semibold text-slate-900 bg-slate-100/70 px-2 py-0.5 rounded-md">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[140px] sm:max-w-[220px]">
                {businessName}
              </span>
            </div>
          </>
        );
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 w-full max-w-full overflow-hidden">
      {/* If Mobile Search is Active: Full-width search bar */}
      {isMobileSearchOpen ? (
        <div className="flex sm:hidden items-center w-full space-x-2 py-1 animate-in fade-in duration-150">
          <div className="flex-1 min-w-0">
            <BusinessSearchInput
              initialBusinessName=""
              onLocationResolved={(loc) => {
                if (onLocationResolved) onLocationResolved(loc);
                setIsMobileSearchOpen(false);
              }}
              centerLat={centerLat ?? 30.2672}
              centerLng={centerLng ?? -97.7431}
              variant="header"
              placeholder="Search business or location..."
            />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl shrink-0 cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Left: Mobile Menu Toggle, Business Name Pill (Mobile), and Breadcrumbs (Desktop) */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0 max-w-[150px] sm:max-w-xs">
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                className="lg:hidden p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Mobile Business Initial / Name Pill (< 640px) */}
            <div className="flex sm:hidden items-center space-x-1.5 bg-slate-100/90 border border-slate-200/80 px-2 py-1 rounded-lg min-w-0 max-w-[110px]">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 truncate">{businessName}</span>
            </div>

            {/* Desktop Dynamic Breadcrumbs (Hidden on Mobile) */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs truncate min-w-0">
              {renderBreadcrumb()}
            </nav>
          </div>

          {/* Center: Global Business & Geocoding Autocomplete Search (Desktop only) */}
          <div className="hidden sm:block flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4">
            <BusinessSearchInput
              initialBusinessName=""
              onLocationResolved={(loc) => {
                if (onLocationResolved) onLocationResolved(loc);
              }}
              centerLat={centerLat ?? 30.2672}
              centerLng={centerLng ?? -97.7431}
              variant="header"
              placeholder="Search business or location..."
            />
          </div>

          {/* Right Controls: Search Icon (Mobile) + Credits Badge + User Profile Avatar */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Mobile Search Expand Button */}
            <button
              type="button"
              data-testid="mobile-search-toggle"
              onClick={() => setIsMobileSearchOpen(true)}
              className="sm:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              aria-label="Search business or location"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Mock / Live Scan Mode Toggle */}
            {onToggleScanMode && (
              <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => onToggleScanMode('mock')}
                  className={`px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                    scanMode === 'mock'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mock
                </button>
                <button
                  onClick={() => onToggleScanMode('live')}
                  className={`px-2 py-1 rounded-md font-medium flex items-center space-x-1 transition cursor-pointer ${
                    scanMode === 'live'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Live SERP</span>
                  {hasDataForSeoCreds && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              </div>
            )}

            {/* Credits Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-xs font-medium text-emerald-800 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-bold font-mono">{credits}</span>
              <span className="hidden sm:inline text-emerald-600 font-normal">credits</span>
            </div>

            {/* Client Report Quick Access */}
            <button
              type="button"
              onClick={() => {
                console.log('Client Report clicked from Header! Business:', businessName);
                window.open('/reports/latest', '_blank');
              }}
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Open Public Client Report Deck"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Client Report</span>
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="hidden sm:block relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition relative cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      1 Unread
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer text-xs ${
                          item.unread ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900 mb-0.5">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agency Switcher / White-label profile pill */}
            <button
              onClick={onOpenBranding}
              className="flex items-center space-x-2 pl-1.5 pr-2 sm:pr-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition shadow-xs cursor-pointer group shrink-0"
              title="Configure Agency Branding & Settings"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {branding.agencyName ? branding.agencyName.charAt(0).toUpperCase() : 'G'}
              </div>
              <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 hidden sm:inline max-w-[120px] truncate">
                {branding.agencyName || 'Agency Settings'}
              </span>
            </button>
          </div>
        </>
      )}
    </header>
  );
};
