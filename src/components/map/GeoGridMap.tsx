/**
 * GeoRank Pro - Interactive Leaflet Heatmap Map Component
 * Path: /src/components/map/GeoGridMap.tsx
 * 
 * Replaces conceptual CSS grids with a live OpenStreetMap / Leaflet canvas.
 * Renders circular SVG rank badges (Green 1-3, Yellow 4-10, Red 11+)
 * with dynamic centroid re-centering and inspection popovers.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NodeScanOutput } from '../../lib/serp/adapter.ts';
import {
  MapPin,
  X,
  Star,
  Compass,
  Building,
  Navigation,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export interface GeoGridMapProps {
  center: { lat: number; lng: number };
  nodes: NodeScanOutput[];
  selectedNode: NodeScanOutput | null;
  onSelectNode: (node: NodeScanOutput) => void;
  radiusKm?: number;
  businessName?: string;
}

// Controller to dynamically pan/zoom map when center or nodes update
function MapViewController({ center, nodes }: { center: { lat: number; lng: number }; nodes: NodeScanOutput[] }) {
  const map = useMap();

  useEffect(() => {
    if (nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map((n) => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([center.lat, center.lng], 13);
    }
  }, [center.lat, center.lng, nodes, map]);

  return null;
}

// Generates an interactive SVG circular rank badge divIcon
function createRankIcon(node: NodeScanOutput, isSelected: boolean) {
  const isCenter = node.isCenter;
  const rank = node.rank;

  let bgColor = 'bg-rose-600';
  let borderColor = 'border-rose-400';
  let shadowColor = 'rgba(225, 29, 72, 0.4)';
  let textColor = 'text-white';
  let displayText = node.rankDisplay || '>20';

  if (node.statusColor === 'green') {
    bgColor = 'bg-emerald-500';
    borderColor = 'border-emerald-300';
    shadowColor = 'rgba(16, 185, 129, 0.45)';
    textColor = 'text-slate-950 font-black';
  } else if (node.statusColor === 'yellow') {
    bgColor = 'bg-amber-500';
    borderColor = 'border-amber-300';
    shadowColor = 'rgba(245, 158, 11, 0.45)';
    textColor = 'text-slate-950 font-bold';
  }

  const ringStyle = isSelected
    ? 'ring-4 ring-indigo-400 scale-125 z-50'
    : isCenter
    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
    : 'hover:scale-115 hover:z-40';

  const html = `
    <div class="relative group cursor-pointer transition-transform duration-200 flex items-center justify-center">
      <div class="w-9 h-9 rounded-full ${bgColor} ${borderColor} border-2 shadow-lg flex items-center justify-center ${textColor} text-xs font-mono font-bold ${ringStyle}" style="box-shadow: 0 4px 14px ${shadowColor};">
        ${displayText}
      </div>
      ${
        isCenter
          ? `<span class="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-slate-900" title="Business Centroid"></span>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-geo-rank-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export const GeoGridMap: React.FC<GeoGridMapProps> = ({
  center,
  nodes,
  selectedNode,
  onSelectNode,
  radiusKm = 2.5,
  businessName = 'Target Business',
}) => {
  const [activeInspector, setActiveInspector] = useState<NodeScanOutput | null>(selectedNode);

  useEffect(() => {
    setActiveInspector(selectedNode);
  }, [selectedNode]);

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Real Interactive Leaflet OpenStreetMap */}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#090d16' }}
      >
        {/* Official Unrestricted OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewController center={center} nodes={nodes} />

        {/* Centroid Proximity Circle */}
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#6366f1',
            fillColor: '#6366f1',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 8',
          }}
        />

        {/* Dynamic Nodes Markers */}
        {nodes.map((node) => (
          <Marker
            key={node.nodeId}
            position={[node.lat, node.lng]}
            icon={createRankIcon(node, activeInspector?.nodeId === node.nodeId)}
            eventHandlers={{
              click: () => {
                setActiveInspector(node);
                onSelectNode(node);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800/80 shadow-xl space-y-1.5 text-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          SERP Visibility Legend
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-emerald-400 font-semibold font-mono">1-3</span>
            <span className="text-slate-400 text-[11px]">(3-Pack)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-amber-400 font-semibold font-mono">4-10</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 shadow-sm shadow-rose-600/50"></span>
            <span className="text-rose-400 font-semibold font-mono">11+</span>
          </div>
        </div>
      </div>

      {/* Sliding Inspector Drawer / Popover for Selected Node */}
      {activeInspector && (
        <div className="absolute top-4 right-4 z-30 w-80 max-h-[500px] overflow-y-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-4 text-xs font-sans transition-all duration-200">
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                  activeInspector.statusColor === 'green'
                    ? 'bg-emerald-500 text-slate-950'
                    : activeInspector.statusColor === 'yellow'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-rose-600 text-white'
                }`}
              >
                #{activeInspector.rankDisplay}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {activeInspector.isCenter ? 'Center Dispatch Node' : `Node ${activeInspector.nodeId}`}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {activeInspector.distanceFromCenter} km from business center
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveInspector(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 space-y-2 border-b border-slate-800 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Coordinates:</span>
              <span className="text-slate-200 font-medium">
                {activeInspector.lat}, {activeInspector.lng}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cardinal Bearing:</span>
              <span className="text-indigo-400 font-medium">
                {activeInspector.bearingDegrees}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Match:</span>
              <span className="text-slate-200">
                {activeInspector.targetFound ? (
                  <span className="text-emerald-400 font-semibold">
                    Position #{activeInspector.rank} ({activeInspector.matchedBy})
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold">Unranked (&gt;20)</span>
                )}
              </span>
            </div>
          </div>

          {/* Dominant Competitors dominating this pin */}
          <div className="pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Top Competitors Dominating Here
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">Local Pack</span>
            </div>

            <div className="space-y-2">
              {activeInspector.topCompetitors.map((comp) => (
                <div
                  key={comp.rank_position}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-start space-x-2.5"
                >
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    #{comp.rank_position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate text-xs">{comp.name}</div>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-amber-400 flex items-center">
                        ★ {comp.rating}
                      </span>
                      <span>({comp.reviews} reviews)</span>
                      <span>•</span>
                      <span className="text-indigo-400 truncate">{comp.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
