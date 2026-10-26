/**
 * GeoRank Pro - Win / Loss SERP Volatility Alerts Modal
 * Path: /src/components/tracking/WinLossAlertsModal.tsx
 *
 * Displays notifications triggered when target keywords:
 * - Enter Google 3-Pack (Win 🎉)
 * - Slip out of 3-Pack or drop significantly (Loss / Remediation ⚠️)
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  AlertTriangle,
  CheckCheck,
  Check,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type { WinLossAlert } from '../../lib/types.ts';

export interface WinLossAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
  businessName?: string;
  onAlertsCountChange?: (count: number) => void;
}

export const WinLossAlertsModal: React.FC<WinLossAlertsModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  onAlertsCountChange,
}) => {
  const [alerts, setAlerts] = useState<WinLossAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const url = businessId
        ? `/api/tracking/alerts?businessId=${encodeURIComponent(businessId)}`
        : '/api/tracking/alerts';
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
        if (onAlertsCountChange) {
          onAlertsCountChange(data.unreadCount ?? 0);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch tracking alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleMarkRead = async (alertId: string) => {
    try {
      const resp = await fetch(`/api/tracking/alerts/${encodeURIComponent(alertId)}/read`, {
        method: 'POST',
      });
      const data = await resp.json();
      if (data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
        );
        const newUnread = alerts.filter((a) => a.id !== alertId && !a.read).length;
        if (onAlertsCountChange) {
          onAlertsCountChange(newUnread);
        }
      }
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const resp = await fetch('/api/tracking/alerts/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      const data = await resp.json();
      if (data.success) {
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
        if (onAlertsCountChange) {
          onAlertsCountChange(0);
        }
      }
    } catch (err) {
      console.error('Failed marking all alerts read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'wins') {
      return a.alertType === 'win_3pack_enter' || a.delta > 0;
    }
    if (filter === 'losses') {
      return a.alertType === 'loss_3pack_exit' || a.alertType === 'loss_rank_drop' || a.delta < 0;
    }
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div
      data-testid="win-loss-alerts-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 space-y-5 relative my-8 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Win / Loss Volatility Alerts
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Real-time alerts triggered by recurring Google 3-Pack rank scans
                {businessName ? ` for ${businessName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Close alerts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Strip & Mark All Read */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('wins')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                filter === 'wins'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span>🎉 Wins</span>
            </button>
            <button
              onClick={() => setFilter('losses')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                filter === 'losses'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span>⚠️ Losses</span>
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              {isMarkingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p className="text-xs">Loading ranking alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-700">No Ranking Volatility Alerts</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Rankings are currently within normal variance thresholds. You will be notified when target keywords enter the 3-Pack or drop significantly.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isWin = alert.alertType === 'win_3pack_enter' || alert.delta > 0;
              const dateStr = alert.timestamp
                ? new Date(alert.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition relative space-y-2.5 ${
                    !alert.read
                      ? isWin
                        ? 'bg-emerald-50/50 border-emerald-300/80 shadow-xs'
                        : 'bg-rose-50/40 border-rose-300/80 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Top line: Icon, Title, and Unread Dot */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isWin
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isWin ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {alert.title}
                          </h4>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">{alert.businessName}</span>
                          <span>•</span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            &quot;{alert.keyword}&quot;
                          </span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delta Pill */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
                        isWin
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {alert.delta > 0 ? `▲ +${alert.delta}` : `▼ ${alert.delta}`}
                    </span>
                  </div>

                  {/* Body text */}
                  <p className="text-xs text-slate-600 leading-relaxed pl-10.5">
                    {alert.message}
                  </p>

                  {/* Footer details & Mark Read button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 pl-10.5">
                    <div className="flex items-center space-x-3 font-mono text-[10px]">
                      {alert.previousRank !== undefined && alert.newRank !== undefined && (
                        <span>
                          Rank: #{alert.previousRank} ➔ <strong className={isWin ? 'text-emerald-700' : 'text-rose-700'}>#{alert.newRank}</strong>
                        </span>
                      )}
                      {alert.previousTop3Percent !== undefined && alert.newTop3Percent !== undefined && (
                        <span>
                          3-Pack: {alert.previousTop3Percent}% ➔ <strong className={isWin ? 'text-emerald-700' : 'text-rose-700'}>{alert.newTop3Percent}%</strong>
                        </span>
                      )}
                    </div>

                    {!alert.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(alert.id)}
                        className="inline-flex items-center space-x-1 text-slate-400 hover:text-emerald-700 font-semibold cursor-pointer transition text-[10px]"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
