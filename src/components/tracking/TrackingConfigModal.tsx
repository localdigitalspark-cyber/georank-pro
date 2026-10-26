/**
 * GeoRank Pro - Business Rank Tracking Configuration Modal
 * Path: /src/components/tracking/TrackingConfigModal.tsx
 *
 * Allows agencies and business owners to:
 * - Toggle automated recurring tracking (Daily, Weekly, Bi-weekly, Monthly)
 * - Configure Win/Loss alert triggers (3-Pack Entry, Rank Drops)
 * - Set Notification Email & Webhook integration (Slack / CRM / Zapier)
 * - Trigger an immediate test scan on demand with live delta feedback
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bell,
  Mail,
  Webhook,
  Play,
  Check,
  AlertTriangle,
  Sparkles,
  X,
  Loader2,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import type { TrackingFrequency } from '../../lib/types.ts';
import { formatDeltaBadge } from '../../lib/tracking/ranking-delta.ts';

export interface TrackingConfigData {
  enabled: boolean;
  frequency: TrackingFrequency;
  alertEmail?: string;
  webhookUrl?: string;
  alertOnThreePackEnter: boolean;
  alertOnRankDrop: boolean;
  rankDropThreshold: number;
}

export interface TrackingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  initialConfig?: TrackingConfigData | null;
  onConfigSaved?: (savedConfig: TrackingConfigData) => void;
  onTrackingRunComplete?: () => void;
}

const FREQUENCY_OPTIONS: {
  id: TrackingFrequency;
  label: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: 'daily',
    label: 'Daily Checks',
    description: 'Scans off-peak at 02:00 AM daily. Best for hyper-competitive metros.',
  },
  {
    id: 'weekly',
    label: 'Weekly (Recommended)',
    description: 'Standard agency frequency. Balances SERP volatility with DataForSEO credits.',
    badge: 'Popular',
  },
  {
    id: 'bi-weekly',
    label: 'Bi-Weekly',
    description: 'Runs every 14 days. Ideal for established businesses in moderate competition.',
  },
  {
    id: 'monthly',
    label: 'Monthly Audit',
    description: 'Runs once every 30 days. Perfect for low-maintenance maintenance retainers.',
  },
];

export const TrackingConfigModal: React.FC<TrackingConfigModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  initialConfig,
  onConfigSaved,
  onTrackingRunComplete,
}) => {
  const [enabled, setEnabled] = useState<boolean>(initialConfig?.enabled ?? true);
  const [frequency, setFrequency] = useState<TrackingFrequency>(initialConfig?.frequency || 'weekly');
  const [alertEmail, setAlertEmail] = useState<string>(initialConfig?.alertEmail || '');
  const [webhookUrl, setWebhookUrl] = useState<string>(initialConfig?.webhookUrl || '');
  const [alertOnThreePackEnter, setAlertOnThreePackEnter] = useState<boolean>(
    initialConfig?.alertOnThreePackEnter ?? true
  );
  const [alertOnRankDrop, setAlertOnRankDrop] = useState<boolean>(
    initialConfig?.alertOnRankDrop ?? true
  );
  const [rankDropThreshold, setRankDropThreshold] = useState<number>(
    initialConfig?.rankDropThreshold ?? 2.0
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRunningNow, setIsRunningNow] = useState<boolean>(false);
  const [runNowResult, setRunNowResult] = useState<{
    success: boolean;
    message: string;
    badge?: ReturnType<typeof formatDeltaBadge>;
  } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync state if initialConfig updates or modal reopens
  useEffect(() => {
    if (initialConfig) {
      setEnabled(initialConfig.enabled ?? true);
      setFrequency(initialConfig.frequency || 'weekly');
      setAlertEmail(initialConfig.alertEmail || '');
      setWebhookUrl(initialConfig.webhookUrl || '');
      setAlertOnThreePackEnter(initialConfig.alertOnThreePackEnter ?? true);
      setAlertOnRankDrop(initialConfig.alertOnRankDrop ?? true);
      setRankDropThreshold(initialConfig.rankDropThreshold ?? 2.0);
    }
    setRunNowResult(null);
    setSaveSuccessMsg(null);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const resp = await fetch(`/api/businesses/${encodeURIComponent(businessId)}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          frequency,
          alertEmail: alertEmail.trim() || undefined,
          webhookUrl: webhookUrl.trim() || undefined,
          alertOnThreePackEnter,
          alertOnRankDrop,
          rankDropThreshold: Number(rankDropThreshold) || 2.0,
        }),
      });

      const data = await resp.json();
      if (data.success) {
        setSaveSuccessMsg('Tracking settings updated successfully!');
        if (onConfigSaved) {
          onConfigSaved({
            enabled,
            frequency,
            alertEmail,
            webhookUrl,
            alertOnThreePackEnter,
            alertOnRankDrop,
            rankDropThreshold,
          });
        }
        setTimeout(() => {
          setSaveSuccessMsg(null);
          onClose();
        }, 1200);
      } else {
        alert(data.error || 'Failed to save tracking settings');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunningNow(true);
    setRunNowResult(null);

    try {
      const resp = await fetch('/api/tracking/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });

      const data = await resp.json();
      if (data.success && data.result) {
        const delta = data.result.delta;
        const badge = formatDeltaBadge(delta);
        setRunNowResult({
          success: true,
          message: `Rank check completed! Previous #${delta.previousAvgSerp ?? '—'} ➔ Current #${delta.currentAvgSerp}`,
          badge,
        });
        if (onTrackingRunComplete) {
          onTrackingRunComplete();
        }
      } else {
        setRunNowResult({
          success: false,
          message: data.error || 'Scan execution completed without new delta',
        });
      }
    } catch (err: any) {
      setRunNowResult({
        success: false,
        message: `Execution failed: ${err.message || err}`,
      });
    } finally {
      setIsRunningNow(false);
    }
  };

  return (
    <div
      data-testid="tracking-config-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 relative my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Automated Rank Tracking</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Off-Peak Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Schedule recurring SERP scans &amp; volatility alerts for <strong className="text-slate-800">{businessName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Section 1: Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                Enable Automated Background Scans
              </span>
              <span className="text-[11px] text-slate-500 block">
                Executes scans automatically during off-peak hours (02:00 AM) to preserve credits.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
                data-testid="tracking-toggle"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Section 2: Frequency Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Scan Frequency
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FREQUENCY_OPTIONS.map((opt) => {
                const isSelected = enabled && frequency === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setFrequency(opt.id)}
                    data-testid={`frequency-${opt.id}`}
                    className={`p-3 rounded-2xl border text-left transition relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Win / Loss Alert Triggers */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Volatility &amp; Win/Loss Triggers</span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">triggers instant alerts</span>
            </label>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              {/* Trigger 1: Win into 3-Pack */}
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnThreePackEnter}
                  onChange={(e) => setAlertOnThreePackEnter(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  data-testid="alert-win-toggle"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
                    <span>🎉 Win: Alert on Google 3-Pack Entry</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                      Client Milestone
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Notifies immediately when average rank breaches #3 or top 3 coverage exceeds 25%.
                  </span>
                </div>
              </label>

              <div className="border-t border-slate-200/60 my-2" />

              {/* Trigger 2: Loss / Drop below threshold */}
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnRankDrop}
                  onChange={(e) => setAlertOnRankDrop(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  data-testid="alert-drop-toggle"
                />
                <div className="text-xs flex-1">
                  <span className="font-semibold text-slate-900 block flex items-center gap-1.5">
                    <span>⚠️ Loss: Alert on Significant Rank Slip</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                      Remediation Trigger
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Notifies when rank drops by more than {rankDropThreshold} positions or falls out of the 3-Pack.
                  </span>
                </div>
              </label>

              {alertOnRankDrop && (
                <div className="pl-6 pt-1 flex items-center space-x-2 text-xs">
                  <span className="text-slate-600 text-[11px] font-medium">Drop threshold:</span>
                  <select
                    value={rankDropThreshold}
                    onChange={(e) => setRankDropThreshold(parseFloat(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                    data-testid="drop-threshold-select"
                  >
                    <option value={1.0}>1.0 position drop</option>
                    <option value={1.5}>1.5 positions drop</option>
                    <option value={2.0}>2.0 positions drop (Recommended)</option>
                    <option value={3.0}>3.0 positions drop</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Notification Channels (Email & Webhook) */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Notification Channels
            </label>

            <div className="space-y-2.5">
              {/* Email */}
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="Notification Email (e.g. client@example.com or agency@agency.com)"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  data-testid="tracking-email-input"
                />
              </div>

              {/* Webhook */}
              <div className="relative">
                <Webhook className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="url"
                  placeholder="Webhook URL (Slack / Discord / Zapier / Make webhook)"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                  data-testid="tracking-webhook-input"
                />
              </div>
            </div>
          </div>

          {/* Run Now Result Alert */}
          {runNowResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                runNowResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  {runNowResult.success ? (
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{runNowResult.message}</span>
                </div>
                {runNowResult.badge && (
                  <div className="pt-1 flex items-center space-x-2">
                    <span className="text-[11px] text-slate-600 font-medium">Computed Delta:</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${runNowResult.badge.colorClass}`}
                    >
                      {runNowResult.badge.text}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRunNowResult(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Actions Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Run Test Check Now Button */}
            <button
              type="button"
              onClick={handleRunNow}
              disabled={isRunningNow || isSaving}
              data-testid="run-test-check-btn"
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              title="Executes an immediate rank tracking scan and computes delta"
            >
              {isRunningNow ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span>Scanning 5x5 Grid...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                  <span>⚡ Run Test Check Now</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                data-testid="save-tracking-btn"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
