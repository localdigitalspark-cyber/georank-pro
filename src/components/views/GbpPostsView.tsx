/**
 * ProfitMaps AI / GeoRank Pro - Google Business Profile Weekly Posts Generator
 * Path: /src/components/views/GbpPostsView.tsx
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  Calendar,
  Sparkles,
  Tag,
  Clock,
  ExternalLink,
} from 'lucide-react';

export interface GbpPostRecord {
  id: string;
  topic: string;
  type: 'Offer' | 'Update' | 'Event' | 'Review Spotlight';
  text: string;
  ctaText: string;
  suggestedDate: string;
  isPublished: boolean;
}

export interface GbpPostsViewProps {
  businessName: string;
  category: string;
}

export const GbpPostsView: React.FC<GbpPostsViewProps> = ({
  businessName = 'Austin Premier Plumbing',
  category = 'Emergency Plumber',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialPosts: GbpPostRecord[] = [
    {
      id: 'gp-1',
      topic: '24/7 Dispatch Rapid Response Guarantee',
      type: 'Update',
      text: `Burst pipe or emergency water leak in the Austin Metro? Our licensed master plumbers are dispatched 24 hours a day with zero night or weekend dispatch surcharges. Call ${businessName} now for rapid 45-minute on-site arrival!`,
      ctaText: 'Call Now',
      suggestedDate: 'Today (Priority)',
      isPublished: true,
    },
    {
      id: 'gp-2',
      topic: '$50 Off Water Heater Replacement',
      type: 'Offer',
      text: `Is your hot water heater leaking or making strange noises? Claim $50 OFF any complete tankless or traditional water heater replacement this week. Valid across Austin, Round Rock, and Westlake service areas.`,
      ctaText: 'Claim Offer',
      suggestedDate: 'In 3 days',
      isPublished: false,
    },
    {
      id: 'gp-3',
      topic: 'Customer Spotlight: Westlake Drain Clearing',
      type: 'Review Spotlight',
      text: `"Arrived within 30 minutes on a Sunday night when our main sewer line backed up. Saved our hardwood floors!" – Verified 5-star customer feedback in Westlake. Thank you Austin for trusting us with your home!`,
      ctaText: 'Learn More',
      suggestedDate: 'Next Monday',
      isPublished: false,
    },
  ];

  const [posts, setPosts] = useState<GbpPostRecord[]>(initialPosts);

  const copyPost = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const publishPost = (id: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, isPublished: true } : p)));
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Google Business Profile Weekly Posts Planner
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-crafted localized updates with embedded keywords to expand 3-pack signals for {businessName}.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const newPost: GbpPostRecord = {
              id: `gp-${posts.length + 1}`,
              topic: 'Seasonal Pipe Maintenance Guide',
              type: 'Update',
              text: `Prevent frozen pipes and sudden water damage before winter hits Austin. Our licensed technicians conduct full multi-point valve inspections.`,
              ctaText: 'Book Inspection',
              suggestedDate: 'Next Week',
              isPublished: false,
            };
            setPosts([newPost, ...posts]);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          + Generate New GBP Post
        </button>
      </div>

      {/* Posts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    post.type === 'Offer'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : post.type === 'Review Spotlight'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {post.type}
                </span>

                <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{post.suggestedDate}</span>
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{post.topic}</h4>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                {post.text}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => copyPost(post.id, post.text)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                {copiedId === post.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Post</span>
                  </>
                )}
              </button>

              <button
                onClick={() => publishPost(post.id)}
                disabled={post.isPublished}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                  post.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                }`}
              >
                {post.isPublished ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>Published</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Publish to GBP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
