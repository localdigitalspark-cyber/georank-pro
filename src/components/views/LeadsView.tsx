/**
 * ProfitMaps AI / GeoRank Pro - Inbound Local Leads & Inquiries View
 * Path: /src/components/views/LeadsView.tsx
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  Send,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';

export interface LeadItem {
  id: string;
  leadName: string;
  businessName: string;
  phone: string;
  email: string;
  city: string;
  inferredCallDeficit: string;
  estimatedPipeline: string;
  status: 'Uncontacted' | 'In Outreach' | 'Converted';
  sourceReport: string;
  date: string;
}

export interface LeadsViewProps {
  businessName?: string;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  businessName = 'Austin Premier Plumbing',
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Uncontacted' | 'In Outreach' | 'Converted'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPushingWebhook, setIsPushingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);

  const initialLeads: LeadItem[] = [
    {
      id: 'lead-1',
      leadName: 'David Miller (Owner)',
      businessName: 'Apex Emergency Plumbing',
      phone: '(512) 555-0199',
      email: 'david@apexplumbingaustin.com',
      city: 'Austin, TX 78701',
      inferredCallDeficit: '54 calls/mo lost',
      estimatedPipeline: '$24,500/mo',
      status: 'Uncontacted',
      sourceReport: 'Austin 5x5 Geo-Grid Scan',
      date: 'Today, 2:15 PM',
    },
    {
      id: 'lead-2',
      leadName: 'Sarah Jenkins (General Manager)',
      businessName: 'Capital City Water Heaters',
      phone: '(512) 555-0142',
      email: 'sjenkins@capitalcityplumbing.com',
      city: 'Austin, TX 78704',
      inferredCallDeficit: '68 calls/mo lost',
      estimatedPipeline: '$31,000/mo',
      status: 'In Outreach',
      sourceReport: 'South Austin Radar Scan',
      date: 'Yesterday',
    },
    {
      id: 'lead-3',
      leadName: 'Marcus Vance',
      businessName: 'Lone Star Rooter Pros',
      phone: '(512) 555-0188',
      email: 'marcus@lonestarrooter.com',
      city: 'Round Rock, TX 78681',
      inferredCallDeficit: '42 calls/mo lost',
      estimatedPipeline: '$19,000/mo',
      status: 'Converted',
      sourceReport: 'Round Rock 7x7 Audit',
      date: 'Oct 18, 2026',
    },
    {
      id: 'lead-4',
      leadName: 'Tom Bradley',
      businessName: 'Windy City Air & Heat',
      phone: '(312) 555-0982',
      email: 'tom@windycityair.com',
      city: 'Chicago, IL 60601',
      inferredCallDeficit: '85 calls/mo lost',
      estimatedPipeline: '$45,000/mo',
      status: 'Uncontacted',
      sourceReport: 'Chicago Downtown HVAC Grid',
      date: 'Oct 17, 2026',
    },
  ];

  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);

  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = activeFilter === 'All' || lead.status === activeFilter;
    const matchesSearch =
      lead.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExportCsv = () => {
    const headers = ['LeadName', 'BusinessName', 'Phone', 'Email', 'City', 'CallDeficit', 'Pipeline', 'Status', 'Date'];
    const rows = leads.map((l) => [
      `"${l.leadName}"`,
      `"${l.businessName}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.city}"`,
      `"${l.inferredCallDeficit}"`,
      `"${l.estimatedPipeline}"`,
      `"${l.status}"`,
      `"${l.date}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeoRank_Leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePushToCrm = () => {
    setIsPushingWebhook(true);
    setTimeout(() => {
      setIsPushingWebhook(false);
      setWebhookSuccess(true);
      setTimeout(() => setWebhookSuccess(false), 3500);
    }, 1200);
  };

  const updateLeadStatus = (id: string, status: LeadItem['status']) => {
    setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Captured Leads
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
              {leads.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Lost Call Deficit
            </span>
            <span className="text-2xl font-black text-amber-600 font-mono mt-0.5 block">
              249 calls/mo
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Phone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Identified Agency Pipeline
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
              $119,500/mo
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Inbound Local Leads & Inquiries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prospects identified from geo-grid scan deficit reports and client capture forms
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePushToCrm}
            disabled={isPushingWebhook}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPushingWebhook ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Syncing CRM...</span>
              </>
            ) : webhookSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pushed to GHL!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Push to CRM / Webhook</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {(['All', 'Uncontacted', 'In Outreach', 'Converted'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeFilter === tab
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search lead or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Lead & Business</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Target Location</th>
                <th className="py-3 px-4">Inferred Call Deficit</th>
                <th className="py-3 px-4">Estimated Pipeline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div>{lead.leadName}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{lead.businessName}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5 text-[11px] text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{lead.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{lead.city}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{lead.sourceReport}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                    {lead.inferredCallDeficit}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {lead.estimatedPipeline}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.status === 'Converted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.status === 'In Outreach'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadItem['status'])}
                      className="bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 cursor-pointer"
                    >
                      <option value="Uncontacted">Uncontacted</option>
                      <option value="In Outreach">In Outreach</option>
                      <option value="Converted">Converted</option>
                    </select>
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
