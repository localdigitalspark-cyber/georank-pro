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
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
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
  const [showLiveConfirmation, setShowLiveConfirmation] = useState<boolean>(false);

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
      setShowLiveConfirmation(false);
    }
  }, [isOpen, initialBusinessName, initialKeyword, initialLat, initialLng]);

  if (!isOpen) return null;

  const creditCost = gridSize * gridSize;
  const totalPins = creditCost;
  const isLive = scanMode === 'live';
  const effectiveCost = isLive ? creditCost : 0;
  const balanceAfter = credits - effectiveCost;
  const hasEnoughCredits = credits >= effectiveCost;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLive) {
      setShowLiveConfirmation(true);
      return;
    }
    executeConfirmedScan();
  };

  const executeConfirmedScan = () => {
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
    setShowLiveConfirmation(false);
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
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Two-Step Live Confirmation Dialog Overlay */}
        {showLiveConfirmation && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm p-6 flex flex-col justify-between animate-in fade-in zoom-in-95">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Confirm Live Google Maps SERP Scan
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Running a <strong className="text-slate-900 font-bold">{gridSize}×{gridSize}</strong> scan (<strong className="text-slate-900 font-bold">{creditCost}</strong> nodes at <strong className="text-slate-900 font-bold">{distanceStep}{unit}</strong> spacing) will consume <strong className="text-rose-600 font-bold">{creditCost} Live SERP credits</strong>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Target:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{businessName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Keyword:</span>
                  <span className="font-bold text-slate-900">{keyword}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Grid Resolution:</span>
                  <span className="font-bold text-slate-900">{gridSize} × {gridSize} ({creditCost} Nodes)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Radius Step:</span>
                  <span className="font-bold text-slate-900">{distanceStep} {unit}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-700">
                  <span>Credit Cost:</span>
                  <span className="font-bold text-rose-600">-{creditCost} Credits</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Remaining Balance:</span>
                  <span className="font-bold text-emerald-700">{balanceAfter} Credits</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                data-testid="cancel-live-confirmation"
                onClick={() => setShowLiveConfirmation(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-live-scan"
                onClick={executeConfirmedScan}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Confirm &amp; Run ({creditCost} Credits)</span>
              </button>
            </div>
          </div>
        )}

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
            aria-label="Close scan modal"
            data-testid="close-scan-modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleFormSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          className="p-6 space-y-4 overflow-y-auto"
        >
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="gridSize" className="text-xs font-semibold text-slate-700 block">
                  Grid Dimension
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {gridSize} × {gridSize} ({creditCost} Nodes)
                </span>
              </div>
              <select
                id="gridSize"
                data-testid="grid-size-selector"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value={3}>3 × 3 (9 Nodes) — Quick local check (9 credits)</option>
                <option value={5}>5 × 5 (25 Nodes) — Standard density (25 credits) [Default]</option>
                <option value={7}>7 × 7 (49 Nodes) — Deep metro scan (49 credits)</option>
                <option value={9}>9 × 9 (81 Nodes) — Regional territory dominance (81 credits)</option>
              </select>

              {/* Segmented Grid Size Control */}
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {[
                  { size: 3, label: '3 × 3', credits: '9 cr' },
                  { size: 5, label: '5 × 5', credits: '25 cr' },
                  { size: 7, label: '7 × 7', credits: '49 cr' },
                  { size: 9, label: '9 × 9', credits: '81 cr' },
                ].map((opt) => (
                  <button
                    key={opt.size}
                    type="button"
                    onClick={() => setGridSize(opt.size)}
                    className={`py-1 px-1 rounded-lg text-center border transition cursor-pointer text-[11px] ${
                      gridSize === opt.size
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{opt.credits}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="distanceStep" className="text-xs font-semibold text-slate-700 block">
                  Radius / Step Distance
                </label>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setUnit('km')}
                    className={`px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                      unit === 'km'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    km
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('mi')}
                    className={`px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                      unit === 'mi'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    mi
                  </button>
                </div>
              </div>

              <select
                id="distanceStep"
                data-testid="distance-step-selector"
                value={distanceStep}
                onChange={(e) => setDistanceStep(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value={0.5}>0.5 {unit} (Hyper-local high street / neighborhood)</option>
                <option value={1.0}>1.0 {unit} (Town center &amp; immediate suburbs)</option>
                <option value={2.5}>2.5 {unit} (Wide metro area)</option>
                <option value={5.0}>5.0 {unit} (Regional / multi-town radius)</option>
                {![0.5, 1.0, 2.5, 5.0].includes(distanceStep) && (
                  <option value={distanceStep}>{distanceStep} {unit} (Custom)</option>
                )}
              </select>

              {/* Segmented Distance Presets */}
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {[0.5, 1.0, 2.5, 5.0].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setDistanceStep(step)}
                    className={`py-1 px-1 rounded-lg text-center border transition cursor-pointer text-[11px] ${
                      distanceStep === step
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {step} {unit}
                  </button>
                ))}
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
                    {creditCost} Credits
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
                  Grid: {gridSize} × {gridSize} ({creditCost} Nodes) | Cost: {effectiveCost} SERP Credits | Balance After: {balanceAfter} Credits
                </span>
                <span className="text-[11px] text-emerald-700">
                  {isLive
                    ? `Consumes ${creditCost} live DataForSEO query units (${creditCost} real coordinate lookups).`
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
