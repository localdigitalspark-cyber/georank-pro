/**
 * ProfitMaps AI / GeoRank Pro - "To-Do: What to do to rank higher" Tab
 * Path: /src/components/dashboard/RankFixesTodoList.tsx
 *
 * Provides actionable ranking gap tasks that close competitor weaknesses:
 * - Progress tracker: "0 of [X] done • [X] to go, about [Y] min"
 * - Filters: "To do [N]" | "Done [0]" | "Not for us [0]"
 * - Dynamic task cards with 3 clear steps, "Write the page" AI action, and "Mark done" circle toggle.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Share2,
  Sparkles,
  PenTool,
  Clock,
  Layers,
  Star,
  FileCode,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building,
  Check,
  Ban,
} from 'lucide-react';
import {
  type ContentPageFixItem,
  type GbpFixItem,
  analyzeRankingFixes,
} from '../../server/services/ranking-fixes.ts';

export interface TodoTask {
  id: string;
  title: string;
  tag: string;
  estimatedMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  steps: string[];
  actionType: 'write_page' | 'gbp_update' | 'review_campaign' | 'citation_sync';
  targetKeyword?: string;
  status: 'todo' | 'done' | 'dismissed';
}

export interface RankFixesTodoListProps {
  businessName?: string;
  category?: string;
  city?: string;
  trackedKeywords?: string[];
  onOpenSiteBuilder?: (pageSlug?: string) => void;
  onOpenGbpPosts?: () => void;
  onShareWithOwner?: () => void;
}

export const RankFixesTodoList: React.FC<RankFixesTodoListProps> = ({
  businessName = 'Austin Premier Plumbing',
  category = 'Emergency Plumber',
  city = 'Austin, TX',
  trackedKeywords = ['Emergency Plumber', 'Water Heater Repair', 'Drain Cleaning'],
  onOpenSiteBuilder,
  onOpenGbpPosts,
  onShareWithOwner,
}) => {
  const [filter, setFilter] = useState<'todo' | 'done' | 'dismissed'>('todo');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>('task-0');
  const [copiedShare, setCopiedShare] = useState(false);

  // Generate initial actionable tasks
  const [tasks, setTasks] = useState<TodoTask[]>(() => {
    const report = analyzeRankingFixes({
      businessName,
      category,
      city,
      trackedKeywords,
    });

    const generated: TodoTask[] = [];

    // Task 1: Primary Keyword Landing Page
    const kw1 = trackedKeywords[0] || category;
    generated.push({
      id: 'task-0',
      title: `Publish a page for '${kw1}'`,
      tag: 'High • 20 min',
      estimatedMinutes: 20,
      priority: 'High',
      description: `No dedicated page on the website is specifically about '${kw1}'. Google needs a relevant page URL to match customer searches to.`,
      steps: [
        `Write a page about this service covering competitor gaps using only verified facts.`,
        `Put it on your website (the site we build publishes it for you automatically).`,
        `Link to it from your Google Business Profile primary appointments URL.`,
      ],
      actionType: 'write_page',
      targetKeyword: kw1,
      status: 'todo',
    });

    // Task 2: Second Keyword Landing Page
    const kw2 = trackedKeywords[1] || 'Water Heater Repair';
    generated.push({
      id: 'task-1',
      title: `Publish a page for '${kw2}'`,
      tag: 'High • 20 min',
      estimatedMinutes: 20,
      priority: 'High',
      description: `Competitors in your outer 5x5 grid capture dispatch calls for '${kw2}' because they have a specific landing URL with LocalBusiness schema.`,
      steps: [
        `Generate comprehensive service details, common problems, and transparent pricing ranges.`,
        `Include high-resolution photos of licensed technicians performing repairs in ${city}.`,
        `Add neighborhood dispatch landmarks to anchor local relevance.`,
      ],
      actionType: 'write_page',
      targetKeyword: kw2,
      status: 'todo',
    });

    // Task 3: Review Deficit Closing
    const deficit = report.reviewDeficit || 24;
    generated.push({
      id: 'task-2',
      title: `Close the ${deficit}-review gap on Top 3 rivals`,
      tag: 'High • 15 min',
      estimatedMinutes: 15,
      priority: 'High',
      description: `Top 3 ranking competitors hold a median of ${report.competitorMedianReviews} reviews vs. your ${report.targetReviews}.`,
      steps: [
        `Send an automated SMS request to the last 20 clients with a 1-click Google review link.`,
        `Ask customers to mention '${category}' and their town name in their review text.`,
        `Post owner responses to all pending Google reviews within 48 hours.`,
      ],
      actionType: 'review_campaign',
      status: 'todo',
    });

    // Task 4: Weekly Google Business Profile Post
    generated.push({
      id: 'task-3',
      title: `Publish a Google Business Profile update with service photo`,
      tag: 'Medium • 10 min',
      estimatedMinutes: 10,
      priority: 'Medium',
      description: `Active profiles with weekly photo updates earn 38% more views in Google Maps local pack results.`,
      steps: [
        `Upload a real job photo taken in ${city}.`,
        `Write a 3-sentence update highlighting same-day dispatch and emergency response.`,
        `Add a 'Call Now' direct click-to-call action button.`,
      ],
      actionType: 'gbp_update',
      status: 'todo',
    });

    return generated;
  });

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const dismissedTasks = tasks.filter((t) => t.status === 'dismissed');

  const totalMinutesRemaining = todoTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  const toggleTaskDone = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
      )
    );
  };

  const setTaskStatus = (id: string, status: 'todo' | 'done' | 'dismissed') => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const handleShare = () => {
    if (onShareWithOwner) {
      onShareWithOwner();
      return;
    }
    const shareText = `Ranking Fixes To-Do Plan for ${businessName}:\n${todoTasks
      .map((t, idx) => `${idx + 1}. ${t.title} (${t.tag})`)
      .join('\n')}`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-slate-900">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">What to do to rank higher</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Each task closes a gap on the businesses ranking above <strong className="text-slate-700">{businessName}</strong>. Click a task to see how; tick the circle when it's done.
          </p>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedShare ? 'Copied to Clipboard!' : 'Share with owner'}</span>
        </button>
      </div>

      {/* Progress & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>
            <strong className="text-slate-900">{doneTasks.length} of {tasks.length} done</strong> • {todoTasks.length} to go, about {totalMinutesRemaining} min
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('todo')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              filter === 'todo'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            To do ({todoTasks.length})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              filter === 'done'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Done ({doneTasks.length})
          </button>
          <button
            onClick={() => setFilter('dismissed')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              filter === 'dismissed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Not for us ({dismissedTasks.length})
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {(filter === 'todo' ? todoTasks : filter === 'done' ? doneTasks : dismissedTasks).length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">
              {filter === 'todo' ? 'All caught up!' : filter === 'done' ? 'No completed tasks yet.' : 'No dismissed tasks.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filter === 'todo'
                ? 'You have completed all prioritized ranking tasks. Check your updated 5x5 geo-grid scores.'
                : 'Tick the circle on any task when you finish it to track rank acceleration progress.'}
            </p>
          </div>
        ) : (
          (filter === 'todo' ? todoTasks : filter === 'done' ? doneTasks : dismissedTasks).map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const isDone = task.status === 'done';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isDone
                    ? 'border-slate-200 bg-slate-50/50 opacity-75'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskDone(task.id);
                      }}
                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-xs font-bold text-slate-900 ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                      {task.tag}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40 space-y-4">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {task.description}
                    </p>

                    {/* 3 Step Action Checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        How to complete this:
                      </span>
                      <div className="space-y-2">
                        {task.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 flex items-start space-x-2.5 shadow-2xs"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-snug">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center space-x-2">
                        {task.actionType === 'write_page' && onOpenSiteBuilder && (
                          <button
                            type="button"
                            onClick={() => onOpenSiteBuilder(task.targetKeyword)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>✍ Write the page</span>
                          </button>
                        )}

                        {task.actionType === 'gbp_update' && onOpenGbpPosts && (
                          <button
                            type="button"
                            onClick={onOpenGbpPosts}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span>Create GBP Post</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleTaskDone(task.id)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isDone ? 'Mark as to-do' : 'Mark done'}</span>
                        </button>
                      </div>

                      {task.status !== 'dismissed' && (
                        <button
                          type="button"
                          onClick={() => setTaskStatus(task.id, 'dismissed')}
                          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Not for us
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
