/**
 * ProfitMaps AI / GeoRank Pro - Billing & Invoice History View
 * Path: /src/components/views/BillingView.tsx
 */

import React, { useState } from 'react';
import {
  Receipt,
  CreditCard,
  Download,
  Zap,
  CheckCircle2,
  Calendar,
  Plus,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';

export interface BillingViewProps {
  credits?: number;
  onBuyCredits?: (amount: number) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  credits = 78,
  onBuyCredits,
}) => {
  const [currentCredits, setCurrentCredits] = useState(credits);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const invoices = [
    {
      id: 'INV-2026-1042',
      date: 'Oct 01, 2026',
      amount: '$129.00',
      plan: 'Growth Agency Plan (Monthly)',
      status: 'Paid',
    },
    {
      id: 'INV-2026-0914',
      date: 'Sep 01, 2026',
      amount: '$129.00',
      plan: 'Growth Agency Plan (Monthly)',
      status: 'Paid',
    },
    {
      id: 'INV-2026-0852',
      date: 'Aug 01, 2026',
      amount: '$129.00',
      plan: 'Growth Agency Plan (Monthly)',
      status: 'Paid',
    },
    {
      id: 'INV-2026-0799',
      date: 'Jul 15, 2026',
      amount: '$29.00',
      plan: 'Add-on: 50 Scan Credits Pack',
      status: 'Paid',
    },
  ];

  const handleBuyCredits = (amount: number) => {
    setCurrentCredits((prev) => prev + amount);
    if (onBuyCredits) onBuyCredits(amount);
    setPurchaseSuccess(true);
    setTimeout(() => setPurchaseSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Receipt className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Subscription Billing &amp; Usage Meter
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your active agency tier, reload scan credits, and view past tax invoices.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription & Credit Meter Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Active Plan Card */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Active Subscription
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono">
                $129 / month
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Growth Agency Plan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Includes 150 scans/month, custom white-label reports, and webhook sync.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Next billing renewal:</span>
            </div>
            <span className="font-bold text-slate-900">Nov 01, 2026</span>
          </div>
        </div>

        {/* Credit Meter Card */}
        <div className="md:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Scan Radar Credits
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {currentCredits} Credits Available
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Usage &amp; Reload Balance
            </h3>
            <div className="mt-2.5">
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (currentCredits / 150) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>0</span>
                <span>{150 - currentCredits} used of 150 monthly quota</span>
                <span>150</span>
              </div>
            </div>
          </div>

          {/* Quick Buy Credits */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => handleBuyCredits(50)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buy 50 Credits Pack ($29)</span>
            </button>

            {purchaseSuccess && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>+50 Credits Added!</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Payment Method Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Visa ending in 4242
            </div>
            <div className="text-[11px] text-slate-500">
              Expires 08/29 • Default payment method
            </div>
          </div>
        </div>

        <button
          onClick={() => alert('Opening Stripe billing portal...')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Update Card
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Past Billing Invoices</h3>
          <p className="text-xs text-slate-500 mt-0.5">Download receipts for agency tax records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Plan / Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {inv.id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {inv.date}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {inv.plan}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                    {inv.amount}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Downloading receipt for ${inv.id}`)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-xs"
                    >
                      <Download className="w-3 h-3 text-slate-500" />
                      <span>PDF</span>
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
