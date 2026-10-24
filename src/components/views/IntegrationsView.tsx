/**
 * ProfitMaps AI / GeoRank Pro - Integrations & API Connections View
 * Path: /src/components/views/IntegrationsView.tsx
 */

import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  RefreshCw,
  Key,
  Layers,
  Send,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';

export interface IntegrationsViewProps {
  hasDataForSeoCreds?: boolean;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  hasDataForSeoCreds = false,
}) => {
  // DataForSEO Credentials State
  const [dataForSeoLogin, setDataForSeoLogin] = useState('');
  const [dataForSeoPassword, setDataForSeoPassword] = useState('');
  const [isTestingDataForSeo, setIsTestingDataForSeo] = useState(false);
  const [dataForSeoStatus, setDataForSeoStatus] = useState<'idle' | 'success' | 'failed'>(
    hasDataForSeoCreds ? 'success' : 'idle'
  );

  // GBP OAuth State
  const [gbpConnected, setGbpConnected] = useState(false);
  const [isConnectingGbp, setIsConnectingGbp] = useState(false);

  // GoHighLevel Webhook State
  const [ghlWebhook, setGhlWebhook] = useState(
    'https://services.leadconnectorhq.com/hooks/georank-inbound-leads'
  );
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);

  // Stripe Billing Integration State
  const [stripeConnected, setStripeConnected] = useState(true);

  const handleTestDataForSeo = () => {
    setIsTestingDataForSeo(true);
    setTimeout(() => {
      setIsTestingDataForSeo(false);
      setDataForSeoStatus('success');
    }, 1200);
  };

  const handleConnectGbp = () => {
    setIsConnectingGbp(true);
    setTimeout(() => {
      setIsConnectingGbp(false);
      setGbpConnected(true);
    }, 1500);
  };

  const handleSaveWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookSaved(true);
      setTimeout(() => setWebhookSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Workflow className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Platform Integrations &amp; API Gateways
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect real-time SERP providers, CRM webhooks, Google Business Profiles, and payment processors.
            </p>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. DataForSEO Live SERP API */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center font-bold text-indigo-700 text-sm">
                DFS
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">DataForSEO Google Maps SERP</h3>
                <span className="text-[11px] text-slate-500">Live multi-pin local SERP scraping</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                dataForSeoStatus === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {dataForSeoStatus === 'success' ? 'Active / Connected' : 'Mock Mode Active'}
            </span>
          </div>

          <div className="space-y-2.5 pt-2 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                DataForSEO API Login (Email)
              </label>
              <input
                type="text"
                placeholder="agency@company.com"
                value={dataForSeoLogin}
                onChange={(e) => setDataForSeoLogin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                API Password / Key
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={dataForSeoPassword}
                onChange={(e) => setDataForSeoPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">Stored locally in encrypted session</span>
            <button
              onClick={handleTestDataForSeo}
              disabled={isTestingDataForSeo}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTestingDataForSeo ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating API...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Google Business Profile (OAuth) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center font-bold text-blue-600 text-sm">
                GBP
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Business Profile API</h3>
                <span className="text-[11px] text-slate-500">Sync live GBP listings, reviews &amp; posts</span>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                gbpConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {gbpConnected ? 'OAuth Connected' : 'Not Linked'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Authorize direct management access to read GBP categories, customer review sentiments, and publish geotagged updates directly from GeoRank Pro.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Permissions Requested:</div>
            <div className="text-[11px] text-slate-500">
              • business.manage • businessinformation.locations.readonly
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">Google OAuth 2.0</span>
            <button
              onClick={handleConnectGbp}
              disabled={isConnectingGbp || gbpConnected}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                gbpConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
              }`}
            >
              {isConnectingGbp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : gbpConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Linked (Austin Plumbing)</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Connect Google Account</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. GoHighLevel / Webhooks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center font-bold text-amber-700 text-sm">
                GHL
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">GoHighLevel / Zapier Webhook</h3>
                <span className="text-[11px] text-slate-500">Push leads and PDFs automatically</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Webhook Active
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Inbound Lead &amp; Report Dispatch Endpoint
            </label>
            <input
              type="text"
              value={ghlWebhook}
              onChange={(e) => setGhlWebhook(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Triggers when a prospect clicks &quot;Claim Audit&quot; or when an agency scan completes.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">Instant POST JSON webhook</span>
            <button
              onClick={handleSaveWebhook}
              disabled={isTestingWebhook}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center space-x-1.5 cursor-pointer"
            >
              {isTestingWebhook ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Hook...</span>
                </>
              ) : webhookSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Webhook Saved!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Save &amp; Test Webhook</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. Stripe Agency Billing */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center font-bold text-purple-700 text-sm">
                STR
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Stripe Payments &amp; Invoicing</h3>
                <span className="text-[11px] text-slate-500">Charge agency retainer subscriptions</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Live Connected
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Charge clients for monthly local SEO retainers directly via automated branded Stripe invoice links embedded in the client prospecting report.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">Stripe Account: acct_1K729...</div>
              <div className="text-[11px] text-slate-500">Payouts enabled to Chase Business Checking</div>
            </div>
            <span className="text-emerald-700 font-bold font-mono">USD $</span>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">Stripe Connect Custom</span>
            <button
              onClick={() => alert('Opening Stripe Connect dashboard...')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
            >
              <span>Manage Stripe</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
