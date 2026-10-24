/**
 * ProfitMaps AI / GeoRank Pro - SEO Content Cluster Page Articles View
 * Path: /src/components/views/PageArticlesView.tsx
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  BookOpen,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Tag,
  Copy,
  Check,
} from 'lucide-react';

export interface ArticleRecord {
  id: string;
  title: string;
  keyword: string;
  cluster: string;
  targetArea: string;
  wordCount: number;
  status: 'Ready' | 'Draft' | 'Published';
}

export interface PageArticlesViewProps {
  businessName: string;
  category: string;
}

export const PageArticlesView: React.FC<PageArticlesViewProps> = ({
  businessName = 'Austin Premier Plumbing',
  category = 'Emergency Plumber',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialArticles: ArticleRecord[] = [
    {
      id: 'art-1',
      title: 'What to Do When a Water Main Breaks in Austin: Step-by-Step Homeowner Guide',
      keyword: 'Water main break Austin',
      cluster: 'Emergency Plumbing Cluster',
      targetArea: 'Austin Metro Wide',
      wordCount: 1650,
      status: 'Ready',
    },
    {
      id: 'art-2',
      title: 'Tankless vs Traditional Water Heaters: Austin Hard Water Longevity Comparison',
      keyword: 'Tankless water heater Austin cost',
      cluster: 'Equipment & Installation',
      targetArea: 'North Austin & Round Rock',
      wordCount: 2100,
      status: 'Ready',
    },
    {
      id: 'art-3',
      title: 'Signs Your Main Sewer Line Needs Hydro-Jetting (And How to Avoid Floor Flooding)',
      keyword: 'Hydro jetting drain service',
      cluster: 'Drain Cleaning Specialists',
      targetArea: 'South Congress & Westlake',
      wordCount: 1420,
      status: 'Published',
    },
  ];

  const [articles, setArticles] = useState<ArticleRecord[]>(initialArticles);

  const copyOutline = (id: string) => {
    navigator.clipboard.writeText(
      `SEO Article Outline for "${articles.find((a) => a.id === id)?.title}"\n- Target Keyword: ${articles.find((a) => a.id === id)?.keyword}\n- Geo-Entity Target: Austin, TX\n- Internal Links: Link to /emergency and /contact with LocalBusiness schema.`
    );
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                SEO Content Cluster Page Articles
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Topical authority articles designed to reinforce geographic entity signals for {businessName}.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const newArt: ArticleRecord = {
              id: `art-${articles.length + 1}`,
              title: 'Emergency Sewer Camera Inspection: How It Works & What It Saves',
              keyword: 'Sewer camera inspection Austin',
              cluster: 'Diagnostics & Leak Detection',
              targetArea: 'Austin Wide',
              wordCount: 1800,
              status: 'Draft',
            };
            setArticles([newArt, ...articles]);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          + Draft New Article
        </button>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Article Title</th>
                <th className="py-3 px-4">Primary Keyword</th>
                <th className="py-3 px-4">Topic Cluster</th>
                <th className="py-3 px-4">Target Geo Node</th>
                <th className="py-3 px-4">Word Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((art) => (
                <tr key={art.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">
                    {art.title}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-800 font-medium">
                    &quot;{art.keyword}&quot;
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium">
                      {art.cluster}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {art.targetArea}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    {art.wordCount} words
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        art.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : art.status === 'Ready'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {art.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => copyOutline(art.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      {copiedId === art.id ? 'Copied Outline!' : 'Copy Outline'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
