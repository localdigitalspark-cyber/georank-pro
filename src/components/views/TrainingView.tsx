/**
 * ProfitMaps AI / GeoRank Pro - Training & Prospecting Academy View
 * Path: /src/components/views/TrainingView.tsx
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { MasterclassModal } from '../training/MasterclassModal.tsx';

export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  checklist: string[];
  takeaways: string[];
  completed: boolean;
}

export const TrainingView: React.FC = () => {
  const initialModules: TrainingModule[] = [
    {
      id: 'm1',
      title: 'How to Close $1,500/mo Retainers with 25-Pin Geo-Grid Scans',
      category: 'Client Acquisition & Closing',
      duration: '18 min',
      level: 'Beginner',
      checklist: [
        'Finding service providers with high ticket values ($1,000+ HVAC, Roofers, Plumbers)',
        'Sending the 1-Sentence "Cold Geo-Map Screenshot" Email',
        'Framing the unranked red pins as lost phone calls rather than vanity metrics',
        'Presenting the $1,500/mo 3-Pack reclamation retainer on Zoom',
      ],
      takeaways: [
        'Never sell SEO technical jargon; sell the 45 missed inbound phone calls.',
        'Use the dynamic ticket value slider in the Pitch Deck to show instant ROI.',
        'Offer a 30-day "First Pin Green" milestone guarantee.',
      ],
      completed: true,
    },
    {
      id: 'm2',
      title: 'The Centroid Decay Technique: Why Proximity Kills Rankings',
      category: 'Local Search Algorithms',
      duration: '24 min',
      level: 'Advanced',
      checklist: [
        'Deconstructing Google’s Hawk & Vicinity update proximity dampening',
        'How to calculate exact geodesic coordinate decay rates',
        'Why having an address on the edge of town bankrupts local businesses',
        'Overcoming physical distance bias with hyper-localized landing page clusters',
      ],
      takeaways: [
        'Google dampens ranking weight by ~14% per kilometer outside centroid.',
        'Localized suburb pages require schema.org/LocalBusiness with exact coordinate tags.',
        'GBP CID links in backlinks pass geographic co-citation authority.',
      ],
      completed: false,
    },
    {
      id: 'm3',
      title: 'Combining Direct Mail & CTV Ads with Local Maps Prospecting',
      category: 'Omnichannel Agency Strategy',
      duration: '15 min',
      level: 'Intermediate',
      checklist: [
        'Printing the GeoRank color-coded grid directly on 6x9 postcards',
        'Targeting business owners on Connected TV (Hulu/Roku) in the exact zip code',
        'Driving postcard scans to the unbranded public report link',
        'Automating the GoHighLevel webhook inbound phone trigger',
      ],
      takeaways: [
        'Direct mail with a physical printed heat map gets a 9.2% scan rate.',
        'Pre-recorded loom video links inside QR codes convert at 34%.',
      ],
      completed: false,
    },
    {
      id: 'm4',
      title: 'GBP Category Hacking & Velocity Review Systems',
      category: 'On-Profile Optimization',
      duration: '21 min',
      level: 'Intermediate',
      checklist: [
        'Analyzing competitors’ primary vs secondary categories via SERP Inspector',
        'Selecting non-dilutive secondary categories (the Rule of 3)',
        'Deploying post-dispatch SMS review workflows with geotag prompt instructions',
        'Embedding suburb names naturally inside customer reviews',
      ],
      takeaways: [
        'The primary category accounts for over 60% of foundational entity classification.',
        'Customer reviews mentioning specific town/neighborhood names expand the green radius.',
      ],
      completed: false,
    },
  ];

  const [modules, setModules] = useState<TrainingModule[]>(initialModules);
  const [activeLesson, setActiveLesson] = useState<TrainingModule | null>(null);

  const completedCount = modules.filter((m) => m.completed).length;
  const progressPercent = Math.round((completedCount / modules.length) * 100);

  const toggleModuleCompletion = (id: string) => {
    setModules(
      modules.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Academy Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Local SEO Agency Training &amp; Prospecting Academy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Master the geo-grid sales methodology and high-ticket retainer client acquisition
              </p>
            </div>
          </div>
        </div>

        {/* Completion Progress Meter */}
        <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Academy Progress
            </span>
            <span className="text-sm font-bold text-slate-900">
              {completedCount} of {modules.length} Completed
            </span>
          </div>
          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod, index) => (
          <div
            key={mod.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition group space-y-4"
          >
            <div className="space-y-3">
              {/* Category & Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                  Module 0{index + 1} • {mod.category}
                </span>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mod.duration}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                {mod.title}
              </h3>

              {/* Checklist items */}
              <div className="space-y-1.5 pt-1">
                {mod.checklist.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => toggleModuleCompletion(mod.id)}
                className={`text-xs font-semibold flex items-center space-x-1.5 cursor-pointer ${
                  mod.completed ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    mod.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {mod.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{mod.completed ? 'Completed' : 'Mark Complete'}</span>
              </button>

              <button
                onClick={() => setActiveLesson(mod)}
                className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Start Lesson</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Masterclass Details & SOP Modal */}
      <MasterclassModal
        module={activeLesson}
        onClose={() => setActiveLesson(null)}
        onToggleComplete={toggleModuleCompletion}
      />
    </div>
  );
};
