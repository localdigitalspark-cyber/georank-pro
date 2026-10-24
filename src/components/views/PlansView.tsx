/**
 * ProfitMaps AI / GeoRank Pro - Subscription Plans View
 * Path: /src/components/views/PlansView.tsx
 */

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
} from 'lucide-react';

export interface PlansViewProps {
  currentPlanId?: string;
  onSelectPlan?: (planId: string) => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  currentPlanId = 'growth',
  onSelectPlan,
}) => {
  const [activePlan, setActivePlan] = useState(currentPlanId);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter Prospector',
      price: billingCycle === 'monthly' ? '$49' : '$39',
      period: '/month',
      desc: 'Ideal for solo consultants running initial client outreach audits.',
      credits: '25 Scans / month',
      features: [
        'Up to 5x5 coordinate grid matrices (25 pins)',
        'Predictive & Live SERP rank scraper',
        'Standard PDF client audit export',
        'Email customer support',
        '1 agency seat',
      ],
      cta: 'Switch to Starter',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth Agency',
      price: billingCycle === 'monthly' ? '$129' : '$99',
      period: '/month',
      desc: 'Complete prospecting & retention suite for expanding agencies.',
      credits: '150 Scans / month',
      features: [
        'Up to 7x7 deep regional matrices (49 pins)',
        'Full custom agency white-label PDF pitch decks',
        'GoHighLevel & Zapier CRM webhook dispatch',
        'Site Builder localized suburb page generator',
        'Shareable unbranded public client reports',
        '3 agency team seats',
      ],
      cta: 'Current Plan',
      popular: true,
    },
    {
      id: 'agency',
      name: 'Agency Scale Unlimited',
      price: billingCycle === 'monthly' ? '$299' : '$249',
      period: '/month',
      desc: 'For multi-location agency franchises dominating regional markets.',
      credits: 'Unlimited Scans',
      features: [
        'Unlimited 7x7 geo-grid scans & scheduled recurring radars',
        'High-frequency automated competitor velocity alerts',
        'Dedicated DataForSEO live priority proxy pool',
        'Custom domain CNAME for public report links',
        'Unlimited agency team seats',
        'Dedicated account manager & 1-on-1 strategy calls',
      ],
      cta: 'Upgrade to Scale',
      popular: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Plans Header & Cycle Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs text-center space-y-4">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Flexible Agency Scaling Tiers</span>
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Supercharge Your Local SEO Prospecting Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Choose a plan that fits your agency scan volume. Cancel or upgrade anytime with prorated billing.
        </p>

        {/* Toggle Billing Cycle */}
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Annual (Save 20%)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-md">
              2 Months Free
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrent = activePlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between relative transition border-2 ${
                plan.popular
                  ? 'border-emerald-600 shadow-md ring-4 ring-emerald-600/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                  Most Popular for Agencies
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.desc}</p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-emerald-700 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{plan.credits}</span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    What&apos;s Included:
                  </span>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => {
                    setActivePlan(plan.id);
                    if (onSelectPlan) onSelectPlan(plan.id);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : plan.popular
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
