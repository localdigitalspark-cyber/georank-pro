/**
 * ProfitMaps AI / GeoRank Pro - ProfitMaps Interactive Grid View
 * Path: /src/components/map/ProfitMapsView.tsx
 *
 * Implements the signature ProfitMaps AI experience:
 * - Dynamic Keyword pills bar with 3-pack coverage chips & reactive switching
 * - Full-bleed Leaflet OpenStreetMap canvas with dynamic marker updates
 * - Top-left floating metadata card (DETAILS / EXPORT)
 * - Right slide-out competitor overlay with search filter
 * - Bottom-left clean status legend
 * - Lightweight "+ Add keyword" modal
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus,
  MoreVertical,
  RotateCw,
  Search,
  Download,
  Share2,
  Trash2,
  X,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  ExternalLink,
  Layers,
  MapPin,
  CheckCircle2,
  Info,
  Tag,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import type { GridScanSummary, NodeScanOutput } from '../../lib/serp/adapter.ts';
import { KeywordDiscoveryModal } from '../keywords/KeywordDiscoveryModal.tsx';

export interface KeywordChip {
  id: string;
  keyword: string;
  top3Percentage: number;
  averageRank: number;
}

export interface ProfitMapsViewProps {
  scanSummary: GridScanSummary | null;
  selectedNode: NodeScanOutput | null;
  onSelectNode: (node: NodeScanOutput) => void;
  onReScan?: () => void;
  onOpenNewScan?: () => void;
  onOpenShareReport?: () => void;
  onOpenActionPlan?: () => void;
  onDeleteBusiness?: () => void;
  businessName: string;
  category?: string;
  city?: string;
  isScanning?: boolean;
  // Reactive Multi-Keyword Props
  activeKeyword?: string;
  keywordsList?: KeywordChip[];
  onSelectKeyword?: (keyword: string) => void;
  onAddKeyword?: (newKeyword: string) => void;
  onDeleteKeyword?: (keyword: string) => void;
}

// Controller to smoothly pan & fit map bounds
function MapViewController({
  center,
  nodes,
}: {
  center: { lat: number; lng: number };
  nodes: NodeScanOutput[];
}) {
  const map = useMap();

  useEffect(() => {
    if (nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map((n) => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([center.lat, center.lng], 13);
    }
  }, [center.lat, center.lng, nodes, map]);

  return null;
}

// Generates the ProfitMaps circular rank badge icon
function createProfitRankIcon(node: NodeScanOutput, isSelected: boolean) {
  const isCenter = node.isCenter;
  let bgClass = 'bg-rose-500 text-white border-rose-600';
  let shadow = 'rgba(239, 68, 68, 0.4)';

  if (node.statusColor === 'green') {
    bgClass = 'bg-[#16a34a] text-white border-[#15803d]';
    shadow = 'rgba(22, 163, 74, 0.45)';
  } else if (node.statusColor === 'yellow') {
    bgClass = 'bg-amber-400 text-slate-900 border-amber-500 font-black';
    shadow = 'rgba(245, 158, 11, 0.4)';
  }

  const ring = isSelected
    ? 'ring-4 ring-emerald-500 scale-125 z-50'
    : isCenter
    ? 'ring-3 ring-emerald-700/80'
    : 'hover:scale-115';

  const html = `
    <div class="relative group cursor-pointer transition-transform duration-150 flex items-center justify-center">
      <div class="w-8 h-8 rounded-full ${bgClass} border-2 shadow-md flex items-center justify-center text-xs font-mono font-bold ${ring}" style="box-shadow: 0 3px 10px ${shadow};">
        ${node.rankDisplay || '>20'}
      </div>
      ${
        isCenter
          ? `<span class="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-emerald-600" title="Centroid"></span>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'profitmaps-rank-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export const ProfitMapsView: React.FC<ProfitMapsViewProps> = ({
  scanSummary,
  selectedNode,
  onSelectNode,
  onReScan,
  onOpenNewScan,
  onOpenShareReport,
  onOpenActionPlan,
  onDeleteBusiness,
  businessName,
  category = 'Local Services',
  city = 'Local Area',
  isScanning = false,
  activeKeyword: propActiveKeyword,
  keywordsList: propKeywordsList,
  onSelectKeyword,
  onAddKeyword,
  onDeleteKeyword,
}) => {
  // Top Keyword Selector Bar State
  const activeKeyword = propActiveKeyword || scanSummary?.keyword || 'Emergency Plumber';
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Floating Details Card State
  const [floatingTab, setFloatingTab] = useState<'details' | 'export'>('details');

  // Competitor Slide-Out Drawer State
  const [showCompetitors, setShowCompetitors] = useState(true);
  const [competitorSearch, setCompetitorSearch] = useState('');

  // Node Inspector Popover
  const [activeInspector, setActiveInspector] = useState<NodeScanOutput | null>(
    selectedNode
  );

  // Add Keyword Modal State
  const [isAddKeywordModalOpen, setIsAddKeywordModalOpen] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // Keyword Discovery Modal State
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);

  useEffect(() => {
    setActiveInspector(selectedNode);
  }, [selectedNode]);

  // Fallback keyword list if not provided via props
  const defaultKeywordsList: KeywordChip[] = [
    {
      id: 'k1',
      keyword: 'Emergency Plumber',
      top3Percentage: 16.0,
      averageRank: 7.1,
    },
    {
      id: 'k2',
      keyword: '24/7 Drain Cleaning',
      top3Percentage: 8.0,
      averageRank: 11.2,
    },
    {
      id: 'k3',
      keyword: 'Water Heater Repair',
      top3Percentage: 36.0,
      averageRank: 3.4,
    },
  ];

  const keywordsList = propKeywordsList && propKeywordsList.length > 0 ? propKeywordsList : defaultKeywordsList;

  // Active Keyword Dropdown State
  const [isKeywordDropdownOpen, setIsKeywordDropdownOpen] = useState(false);
  const [inlineKeywordInput, setInlineKeywordInput] = useState('');
  const keywordDropdownRef = useRef<HTMLDivElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        keywordDropdownRef.current &&
        !keywordDropdownRef.current.contains(event.target as Node)
      ) {
        setIsKeywordDropdownOpen(false);
      }
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Currently selected keyword object
  const currentKeywordObj = keywordsList.find(
    (k) => k.keyword.toLowerCase() === activeKeyword.toLowerCase()
  ) || {
    id: 'active',
    keyword: activeKeyword,
    top3Percentage: scanSummary?.top3Percentage ?? 16.0,
    averageRank: scanSummary?.averageRank ?? 7.1,
  };

  const handleDeleteKeyword = (keywordName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (keywordsList.length <= 1) {
      alert('At least one keyword is required to maintain rank monitoring.');
      return;
    }
    if (onDeleteKeyword) {
      onDeleteKeyword(keywordName);
    }
  };

  // Filter dominant competitors for active keyword
  const competitors = scanSummary?.dominantCompetitors || [];
  const filteredCompetitors = competitors.filter((c) =>
    c.name.toLowerCase().includes(competitorSearch.toLowerCase())
  );

  // Formatted scan timestamp
  const scanDateFormatted = scanSummary?.createdAt
    ? new Date(scanSummary.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const exportCsv = () => {
    if (!scanSummary) return;
    const headers = ['NodeID', 'Rank', 'DistanceKm', 'Bearing', 'Lat', 'Lng', 'TopCompetitor'];
    const rows = scanSummary.nodes.map((n) => [
      n.nodeId,
      n.rankDisplay,
      n.distanceFromCenter,
      n.bearingDegrees,
      n.lat,
      n.lng,
      `"${n.topCompetitors[0]?.name || 'N/A'}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeoRank_${businessName}_${scanSummary.keyword}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordInput.trim()) return;
    if (onAddKeyword) {
      onAddKeyword(newKeywordInput.trim());
    }
    setNewKeywordInput('');
    setIsAddKeywordModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* 1. Keyword Selector & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs mt-3 mb-2 overflow-visible relative z-30">
        {/* Left: Active Keyword Dropdown + Discover Keywords Button */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Active Keyword Dropdown Menu */}
          <div className="relative" ref={keywordDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowActionsDropdown(false);
                setIsKeywordDropdownOpen(!isKeywordDropdownOpen);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer select-none"
              aria-expanded={isKeywordDropdownOpen}
              aria-haspopup="true"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[170px] sm:max-w-[220px]">{currentKeywordObj.keyword}</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 shrink-0">
                {currentKeywordObj.top3Percentage}%
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isKeywordDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Floating Dropdown Popover */}
            {isKeywordDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tracked Keywords
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-600">
                    {keywordsList.length} {keywordsList.length === 1 ? 'keyword' : 'keywords'}
                  </span>
                </div>

                {/* List of Keywords */}
                <div className="max-h-56 overflow-y-auto space-y-1 py-1 no-scrollbar">
                  {keywordsList.map((k) => {
                    const isSelected = activeKeyword.toLowerCase() === k.keyword.toLowerCase();
                    return (
                      <div
                        key={k.id}
                        onClick={() => {
                          if (onSelectKeyword) {
                            onSelectKeyword(k.keyword);
                          }
                          setIsKeywordDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer group ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{k.keyword}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-emerald-200/60 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {k.top3Percentage}%
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteKeyword(k.keyword, e)}
                            className="opacity-0 group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-700 text-slate-400 p-1 rounded-md transition-all cursor-pointer"
                            title={`Delete keyword "${k.keyword}"`}
                            aria-label={`Delete keyword ${k.keyword}`}
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="my-1.5 border-t border-slate-100" />

                {/* Inline Add Keyword Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inlineKeywordInput.trim()) return;
                    if (onAddKeyword) {
                      onAddKeyword(inlineKeywordInput.trim());
                    }
                    setInlineKeywordInput('');
                    setIsKeywordDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 pt-0.5"
                >
                  <input
                    type="text"
                    placeholder="+ Add new keyword..."
                    value={inlineKeywordInput}
                    onChange={(e) => setInlineKeywordInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inlineKeywordInput.trim()}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-semibold transition cursor-pointer shrink-0 shadow-xs"
                    title="Add keyword"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Discover Keywords (Traffic) Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsKeywordDropdownOpen(false);
              setShowActionsDropdown(false);
              setIsDiscoveryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer select-none shrink-0"
            title="Discover high-volume local keywords with real search traffic and CPC"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Discover Keywords (Traffic)</span>
          </button>
        </div>

        {/* Right: Action Plan & Actions Menu */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onOpenActionPlan && (
            <button
              type="button"
              onClick={onOpenActionPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Action Plan</span>
            </button>
          )}

          <div className="relative" ref={actionsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsKeywordDropdownOpen(false);
                setShowActionsDropdown(!showActionsDropdown);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <span>Actions</span>
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showActionsDropdown && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
                {onReScan && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onReScan();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Re-run current scan</span>
                  </button>
                )}
                {onOpenNewScan && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onOpenNewScan();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <span>New Geo-Grid Scan</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsDropdown(false);
                    exportCsv();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsDropdown(false);
                    const targetId = scanSummary?.scanId || 'latest';
                    console.log('Client Report clicked from ProfitMapsView! Target ID:', targetId);
                    window.open(`/reports/${targetId}`, '_blank');
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 text-left font-medium transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open Client Report</span>
                </button>

                {onOpenShareReport && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionsDropdown(false);
                      onOpenShareReport();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share client report link</span>
                  </button>
                )}

                {onDeleteBusiness && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      data-testid="actions-delete-business-btn"
                      onClick={() => {
                        setShowActionsDropdown(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left transition font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Business</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Map Container with Floating Elements */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-xs">
        {scanSummary ? (
          <MapContainer
            center={[scanSummary.center.lat, scanSummary.center.lng]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            {/* Standard Light OpenStreetMap Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapViewController center={scanSummary.center} nodes={scanSummary.nodes} />

            {/* Centroid Scan Radius Boundary */}
            <Circle
              center={[scanSummary.center.lat, scanSummary.center.lng]}
              radius={scanSummary.distanceStep * (scanSummary.gridSize / 2) * 1000}
              pathOptions={{
                color: '#16a34a',
                fillColor: '#16a34a',
                fillOpacity: 0.05,
                weight: 1.5,
                dashArray: '5, 8',
              }}
            />

            {/* Rank Pin Markers (Keyed by keyword + nodeId + rank for reactive rerendering) */}
            {scanSummary.nodes.map((node) => (
              <Marker
                key={`${scanSummary.keyword}_${node.nodeId}_${node.rankDisplay}`}
                position={[node.lat, node.lng]}
                icon={createProfitRankIcon(
                  node,
                  activeInspector?.nodeId === node.nodeId
                )}
                eventHandlers={{
                  click: () => {
                    setActiveInspector(node);
                    onSelectNode(node);
                  },
                }}
              />
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <RotateCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-mono">Generating Geo-Grid Matrix for &quot;{activeKeyword}&quot;...</span>
          </div>
        )}

        {/* 3. Floating Details Card (Top-Left over Map) */}
        {scanSummary && (
          <div className="absolute top-4 left-4 z-20 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden text-xs transition-all">
            {/* Card Sub-Tabs */}
            <div className="flex border-b border-slate-200/80 bg-slate-50/70">
              <button
                onClick={() => setFloatingTab('details')}
                className={`flex-1 py-2 text-center font-bold tracking-wider text-[11px] uppercase transition cursor-pointer ${
                  floatingTab === 'details'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setFloatingTab('export')}
                className={`flex-1 py-2 text-center font-bold tracking-wider text-[11px] uppercase transition cursor-pointer ${
                  floatingTab === 'export'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Export
              </button>
            </div>

            {/* TAB: Details */}
            {floatingTab === 'details' ? (
              <div className="p-4 space-y-3.5">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Grid Setup ({scanSummary.keyword})
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {scanSummary.gridSize}x{scanSummary.gridSize} • {scanSummary.distanceStep}{' '}
                    {scanSummary.unit} step
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {scanDateFormatted}
                  </div>
                </div>

                {/* Average SERP & Coverage Telemetry Pills */}
                <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
                      Avg SERP
                    </span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      #{Number(scanSummary.averageRank).toFixed(1)}
                    </span>
                  </div>
                  <div className="border-x border-emerald-200/80 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
                      In-Pack
                    </span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      {Number(scanSummary.top3Percentage).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block truncate">
                      Red Zone
                    </span>
                    <span className="text-lg font-black text-rose-600 font-mono">
                      {Number(
                        scanSummary.redZonePercentage ??
                          ((scanSummary.nodes.filter((n) => n.rank === null || n.rank >= 11).length /
                            (scanSummary.totalNodes || 1)) *
                            100)
                      ).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Quick Actions in Card */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {onReScan && (
                    <button
                      onClick={onReScan}
                      disabled={isScanning}
                      className="text-emerald-700 font-semibold hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                      <span>Re-run scan</span>
                    </button>
                  )}
                  {onOpenActionPlan && (
                    <button
                      onClick={onOpenActionPlan}
                      className="text-amber-700 font-semibold hover:text-amber-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Action plan</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* TAB: Export */
              <div className="p-4 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Report Deliverables
                </div>

                <button
                  onClick={exportCsv}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-800 text-xs">
                        Export SERP CSV
                      </div>
                      <div className="text-[10px] text-slate-500">
                        All {scanSummary.nodes.length} coordinate pins
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    const targetId = scanSummary?.scanId || 'latest';
                    console.log('Client Report clicked from quick panel! Target ID:', targetId);
                    window.open(`/reports/${targetId}`, '_blank');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-800 text-xs">
                        Open Client Report
                      </div>
                      <div className="text-[10px] text-slate-500">
                        View comprehensive audit deck
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </button>

                {onOpenShareReport && (
                  <button
                    onClick={onOpenShareReport}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">
                          Share Client Link
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Public unbranded URL
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Competitor Overlay / Slide-Out (Right side) */}
        {scanSummary && (
          <div
            className={`absolute top-4 right-4 z-20 transition-all duration-200 ${
              showCompetitors ? 'w-80' : 'w-auto'
            }`}
          >
            {showCompetitors ? (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden max-h-[580px] flex flex-col text-xs">
                {/* Header with Close */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Top Competitors for &quot;{scanSummary.keyword}&quot;
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCompetitors(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                    title="Collapse competitors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search input */}
                <div className="p-2.5 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search competitor..."
                      value={competitorSearch}
                      onChange={(e) => setCompetitorSearch(e.target.value)}
                      className="w-full bg-slate-100 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Competitors List */}
                <div className="overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
                  {filteredCompetitors.length > 0 ? (
                    filteredCompetitors.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-900 truncate">
                            {comp.name}
                          </div>
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono">
                            {comp.top3SharePercent}% in-pack
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                            {comp.rating}
                          </span>
                          <span>({comp.reviews} reviews)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No matching competitors found
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Collapsed button */
              <button
                onClick={() => setShowCompetitors(true)}
                className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-md text-xs font-semibold text-slate-800 flex items-center space-x-1.5 hover:bg-slate-50 transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Show Competitors ({competitors.length})</span>
              </button>
            )}
          </div>
        )}

        {/* 5. Selected Node Inspector Popover */}
        {activeInspector && (
          <div className="absolute bottom-16 right-4 z-30 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                    activeInspector.statusColor === 'green'
                      ? 'bg-emerald-600 text-white'
                      : activeInspector.statusColor === 'yellow'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  #{activeInspector.rankDisplay}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {activeInspector.isCenter ? 'Centroid Dispatch Node' : `Pin ${activeInspector.nodeId}`}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    {activeInspector.distanceFromCenter} km from center • {activeInspector.bearingDegrees}°
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveInspector(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-2.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Top SERP Competitors Here
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {activeInspector.topCompetitors.slice(0, 3).map((c, i) => (
                  <div
                    key={i}
                    className="p-2 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate text-[11px]">
                        #{c.rank_position} {c.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ★ {c.rating} ({c.reviews} reviews)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Clean Floating Legend (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-md flex items-center space-x-3 text-xs font-medium text-slate-700">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a]"></span>
            <span>1-3</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>4-6</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span>7-10</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>11+</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Unranked</span>
          </div>
        </div>
      </div>

      {/* 3. Lightweight Add Keyword Dialog */}
      {isAddKeywordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Track New Local Keyword
                </h3>
              </div>
              <button
                onClick={() => setIsAddKeywordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddKeywordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Target Search Term
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Tankless Water Heater, Hydro Jetting, Pipe Relining"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  We will immediately run a multi-pin scan across your {businessName} coordinate grid.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddKeywordModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newKeywordInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  Run &amp; Add Keyword
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Keyword Discovery & Traffic Modal */}
      <KeywordDiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        businessName={businessName}
        category={category}
        city={city}
        existingKeywords={keywordsList.map((k) => k.keyword)}
        onAddAndScanKeyword={(kw) => {
          if (onAddKeyword) {
            onAddKeyword(kw);
          }
        }}
      />

      {/* Delete Business Confirmation Modal */}
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
                data-testid="confirm-delete-business-btn"
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
    </div>
  );
};
