/**
 * ProfitMaps AI / GeoRank Pro - New Keyword Scan Modal
 * Path: /src/components/modals/NewScanModal.tsx
 *
 * Configures and launches a new geo-grid rank radar scan with
 * credit calculation, coordinate resolution, and grid dimensions.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Zap,
  Info,
  Layers,
} from 'lucide-react';
import { BusinessSearchInput, type ResolvedLocation } from '../search/BusinessSearchInput.tsx';
import type { DistanceUnit } from '../../lib/geo/grid-generator.ts';
import type { SerpScanMode } from '../../lib/serp/adapter.ts';

export interface NewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScan: (params: {
    businessName: string;
    keyword: string;
    lat: number;
    lng: number;
    gridSize: number;
    distanceStep: number;
    unit: DistanceUnit;
    scanMode: SerpScanMode;
  }) => void;
  initialBusinessName: string;
  initialKeyword: string;
  initialLat: number;
  initialLng: number;
  initialGridSize?: number;
  initialDistanceStep?: number;
  initialUnit?: DistanceUnit;
  initialScanMode?: SerpScanMode;
  credits?: number;
  isScanning?: boolean;
  hasDataForSeoCreds?: boolean;
}

export const NewScanModal: React.FC<NewScanModalProps> = ({
  isOpen,
  onClose,
  onRunScan,
  initialBusinessName,
  initialKeyword,
  initialLat,
  initialLng,
  initialGridSize = 5,
  initialDistanceStep = 1.0,
  initialUnit = 'km',
  initialScanMode = 'mock',
  credits = 78,
  isScanning = false,
  hasDataForSeoCreds = false,
}) => {
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [centerLat, setCenterLat] = useState(initialLat);
  const [centerLng, setCenterLng] = useState(initialLng);
  const [gridSize, setGridSize] = useState<number>(initialGridSize);
  const [distanceStep, setDistanceStep] = useState<number>(initialDistanceStep);
  const [unit, setUnit] = useState<DistanceUnit>(initialUnit);
  const [scanMode, setScanMode] = useState<SerpScanMode>(initialScanMode);

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setBusinessName(initialBusinessName);
      setKeyword(initialKeyword);
      setCenterLat(initialLat);
      setCenterLng(initialLng);
      setGridSize(initialGridSize);
      setDistanceStep(initialDistanceStep);
      setUnit(initialUnit);
      setScanMode(initialScanMode);
    }
  }, [isOpen, initialBusinessName, initialKeyword, initialLat, initialLng]);

  if (!isOpen) return null;

  const totalPins = gridSize * gridSize;
  const isLive = scanMode === 'live';
  const effectiveCost = isLive ? totalPins : 0;
  const balanceAfter = credits - effectiveCost;
  const hasEnoughCredits = credits >= effectiveCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunScan({
      businessName,
      keyword,
      lat: centerLat,
      lng: centerLng,
      gridSize,
      distanceStep,
      unit,
      scanMode,
    });
    onClose();
  };

  const handleLocationResolved = (loc: ResolvedLocation) => {
    setBusinessName(loc.businessName);
    if (loc.keyword) setKeyword(loc.keyword);
    setCenterLat(loc.lat);
    setCenterLng(loc.lng);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Launch New Keyword Scan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan Google Local Maps rank across a multi-pin coordinate grid
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Autocomplete & Geo-Resolver */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Search Business or Address
            </label>
            <BusinessSearchInput
              initialBusinessName={businessName}
              initialKeyword={keyword}
              centerLat={centerLat}
              centerLng={centerLng}
              onLocationResolved={handleLocationResolved}
              onManualCoordChange={(lat, lng) => {
                setCenterLat(lat);
                setCenterLng(lng);
              }}
              variant="modal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Austin Premier Plumbing"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Search Keyword
              </label>
              <input
                type="text"
                required
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Emergency Plumber"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Grid Dimension & Distance Unit */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Grid Dimension
              </label>
              <select
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer font-medium"
              >
                <option value={3}>3x3 (9 pins)</option>
                <option value={5}>5x5 (25 pins)</option>
                <option value={7}>7x7 (49 pins)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Distance Unit
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setUnit('km')}
                  className={`py-1 rounded-lg font-semibold transition cursor-pointer ${
                    unit === 'km'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Kilometers
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('mi')}
                  className={`py-1 rounded-lg font-semibold transition cursor-pointer ${
                    unit === 'mi'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Miles
                </button>
              </div>
            </div>
          </div>

          {/* Radius Step Slider */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-medium">
              <span className="text-slate-700">
                Radius Step:{' '}
                <strong className="text-emerald-700 font-bold">
                  {distanceStep} {unit}
                </strong>
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Total Span: {(distanceStep * (gridSize - 1)).toFixed(1)} {unit}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={distanceStep}
              onChange={(e) => setDistanceStep(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5"
            />
          </div>

          {/* Scan Engine Mode Selector */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5 text-xs">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                SERP Data &amp; Execution Mode
              </span>
              <span className="text-[11px] text-slate-500">
                Select between instant predictive spatial modeling or live Google Maps coordinate scraping
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScanMode('mock')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  scanMode === 'mock'
                    ? 'bg-white border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                    : 'bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">Predictive Distance Model</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    0 Credits
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  High-fidelity centroid falloff projection based on geodesic radius decay.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('live')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  scanMode === 'live'
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                    <span>Live Google Maps</span>
                    {hasDataForSeoCreds && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono">
                    {totalPins} Credits
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Real-time DataForSEO coordinate API query with live Google 3-Pack extraction.
                </p>
              </button>
            </div>
          </div>

          {/* Explicit Pre-Run Credit Cost Summary */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center space-x-2.5 text-emerald-900">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600 mt-0.5 sm:mt-0 shrink-0" />
              <div>
                <span className="font-bold block text-slate-900">
                  Grid: {gridSize} × {gridSize} ({totalPins} Nodes) | Cost: {effectiveCost} SERP Credits | Balance After: {balanceAfter} Credits
                </span>
                <span className="text-[11px] text-emerald-700">
                  {isLive
                    ? `Consumes ${totalPins} live DataForSEO query units (${totalPins} real coordinate lookups).`
                    : 'Simulation run does not consume any of your monthly API credits.'}
                </span>
              </div>
            </div>
            {!hasEnoughCredits && (
              <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-300 self-start sm:self-auto shrink-0">
                Insufficient Credits
              </span>
            )}
          </div>

          {/* CTA Footer */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScanning || !hasEnoughCredits || !businessName.trim() || !keyword.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScanning ? 'Orchestrating Scan...' : 'Run Geo-Grid Scan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
