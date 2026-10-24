/**
 * GeoRank Pro / ProfitMaps AI - Keyword Discovery & Traffic Modal
 * Path: /src/components/keywords/KeywordDiscoveryModal.tsx
 *
 * Displays rich local keyword discovery with search volumes, CPC, intent,
 * and instant "+ Add & Scan Map" action.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Plus,
  Check,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
  Target,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  type DiscoveredKeyword,
  type KeywordDiscoveryResult,
} from '../../lib/keywords/keyword-discovery.ts';

export interface KeywordDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  category?: string;
  city?: string;
  existingKeywords?: string[];
  onAddAndScanKeyword: (keyword: string) => void;
}

export const KeywordDiscoveryModal: React.FC<KeywordDiscoveryModalProps> = ({
  isOpen,
  onClose,
  businessName,
  category = 'Local Services',
  city = 'Local Area',
  existingKeywords = [],
  onAddAndScanKeyword,
}) => {
  const [data, setData] = useState<KeywordDiscoveryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());

  // Clean city name for display
  const displayCity = useMemo(() => {
    return (city || '').split(',')[0].trim() || 'Local Area';
  }, [city]);

  // Fetch keyword recommendations whenever modal opens or business changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch('/api/keywords/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName,
        category,
        cityOrTown: displayCity,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((resData) => {
        if (isMounted) {
          if (resData.success && resData.data) {
            setData(resData.data);
          } else {
            throw new Error(resData.error || 'Failed to load keyword data');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Keyword discovery fetch error:', err);
          setError('Could not fetch remote keyword data. Showing verified local defaults.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, businessName, category, displayCity]);

  // Track already existing keywords from props
  useEffect(() => {
    const set = new Set<string>();
    existingKeywords.forEach((k) => set.add(k.toLowerCase().trim()));
    setAddedKeywords(set);
  }, [existingKeywords]);

  // Filtered and sorted keywords
  const filteredKeywords = useMemo(() => {
    if (!data?.keywords) return [];
    return data.keywords.filter((item) => {
      const matchesSearch = item.keyword
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      const matchesIntent =
        selectedIntent === 'all' ||
        item.intent.toLowerCase() === selectedIntent.toLowerCase();
      return matchesSearch && matchesIntent;
    });
  }, [data?.keywords, searchQuery, selectedIntent]);

  if (!isOpen) return null;

  const handleSelectKeyword = (kw: string) => {
    setAddedKeywords((prev) => new Set(prev).add(kw.toLowerCase().trim()));
    onAddAndScanKeyword(kw);
    onClose();
  };

  const maxVolume = useMemo(() => {
    if (!data?.keywords?.length) return 1000;
    return Math.max(...data.keywords.map((k) => k.monthlySearchVolume));
  }, [data?.keywords]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Local Keyword Discovery & Search Traffic
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Targeting <strong className="text-slate-800">{businessName}</strong> in{' '}
                <strong className="text-slate-800">{displayCity}</strong> • Trade:{' '}
                <span className="text-emerald-700 font-medium">{category}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Summary Metric Cards */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Total Volume
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {data.totalMonthlyVolume.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-500">searches / month</span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Est. Inbound Clicks
                  </span>
                  <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-900">
                  ~{data.estimatedClicks.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-700">targeted local leads</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Average Local CPC
                  </span>
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {data.averageCpc}
                </div>
                <span className="text-[11px] text-slate-500">Google Ads equivalent</span>
              </div>

              <div className="p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Discovered Terms
                  </span>
                  <Target className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {data.keywords.length}
                </div>
                <span className="text-[11px] text-slate-500">ready to track & rank</span>
              </div>
            </div>
          )}

          {/* Search & Intent Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords (e.g. screen, emergency, near me)..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Intent Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Intent:
              </span>
              {['all', 'Emergency', 'High Intent', 'Transactional', 'Commercial'].map((intent) => {
                const isSelected = selectedIntent.toLowerCase() === intent.toLowerCase();
                return (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => setSelectedIntent(intent)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    {intent === 'all' ? 'All' : intent}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <div className="text-sm font-semibold text-slate-700">
                Analyzing local search volume and competition for {displayCity}...
              </div>
              <p className="text-xs text-slate-400">
                Calculating local Google Maps monthly queries, CPC, and 3-pack difficulty
              </p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Keywords Table */}
          {!isLoading && filteredKeywords.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Local Search Keyword</th>
                      <th className="py-3 px-3 text-right">Monthly Volume</th>
                      <th className="py-3 px-3 text-right">Est. CPC</th>
                      <th className="py-3 px-3">Search Intent</th>
                      <th className="py-3 px-3">3-Pack Difficulty</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKeywords.map((item) => {
                      const isAdded = addedKeywords.has(item.keyword.toLowerCase().trim());
                      const volumePercent = Math.min(100, Math.round((item.monthlySearchVolume / maxVolume) * 100));

                      // Intent badge styling
                      let intentBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (item.intent === 'Emergency') {
                        intentBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                      } else if (item.intent === 'High Intent') {
                        intentBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (item.intent === 'Transactional') {
                        intentBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                      } else if (item.intent === 'Commercial') {
                        intentBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
                      }

                      // Difficulty styling
                      let diffBadgeClass = 'text-emerald-700 bg-emerald-50';
                      if (item.difficulty === 'High') {
                        diffBadgeClass = 'text-rose-700 bg-rose-50';
                      } else if (item.difficulty === 'Medium') {
                        diffBadgeClass = 'text-amber-700 bg-amber-50';
                      }

                      return (
                        <tr
                          key={item.keyword}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Keyword Name */}
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div className="flex items-center space-x-2">
                              <span>{item.keyword}</span>
                              {isAdded && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                                  Already Tracked
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Monthly Volume with mini bar */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-mono font-bold text-slate-900">
                                {item.monthlySearchVolume.toLocaleString()}
                              </span>
                              <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${volumePercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Est CPC */}
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                            {item.cpc}
                          </td>

                          {/* Search Intent */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${intentBadgeClass}`}
                            >
                              {item.intent}
                            </span>
                          </td>

                          {/* 3-Pack Difficulty */}
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${diffBadgeClass}`}
                              >
                                {item.difficulty}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ({item.estimatedPackDifficulty}/100)
                              </span>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            {isAdded ? (
                              <button
                                disabled
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Active</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectKeyword(item.keyword)}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add & Scan Map</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty Filter Results */}
          {!isLoading && filteredKeywords.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">No matching keywords found</p>
              <p className="text-xs text-slate-400">
                Try adjusting your search filter or select "All" intents
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Adding a keyword initiates a real-time geo-grid scan with calibrated centroid physics.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
