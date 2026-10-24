/**
 * ProfitMaps AI / GeoRank Pro - Managed Agency Clients View
 * Path: /src/components/views/ClientsView.tsx
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  ExternalLink,
  Building2,
  Calendar,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export interface ClientRecord {
  id: string;
  name: string;
  domain: string;
  businessProfile: string;
  category: string;
  packageTier: string;
  monthlyRetainer: string;
  renewalDate: string;
  status: 'Active' | 'Pending Setup' | 'At Risk';
  averageRank: number;
}

export interface ClientsViewProps {
  onSelectClientBusiness?: (businessName: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onSelectClientBusiness,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const initialClients: ClientRecord[] = [
    {
      id: 'c1',
      name: 'Austin Premier Plumbing',
      domain: 'austinpremierplumbing.com',
      businessProfile: 'Austin Premier Plumbing - Downtown',
      category: 'Emergency Plumber',
      packageTier: '3-Pack Domination Retainer',
      monthlyRetainer: '$1,497/mo',
      renewalDate: 'Nov 14, 2026',
      status: 'Active',
      averageRank: 11.4,
    },
    {
      id: 'c2',
      name: 'Biscayne Dental Clinic',
      domain: 'biscaynedentalcare.com',
      businessProfile: 'Biscayne Dental Specialists',
      category: 'Cosmetic Dentist',
      packageTier: 'Local Growth Radar Plan',
      monthlyRetainer: '$997/mo',
      renewalDate: 'Nov 02, 2026',
      status: 'Active',
      averageRank: 6.8,
    },
    {
      id: 'c3',
      name: 'Santa Monica Injury Law',
      domain: 'santamonicainjurylaw.com',
      businessProfile: 'Santa Monica Injury Law Center',
      category: 'Personal Injury Lawyer',
      packageTier: 'Enterprise Metro Takeover',
      monthlyRetainer: '$2,497/mo',
      renewalDate: 'Nov 28, 2026',
      status: 'Active',
      averageRank: 4.2,
    },
    {
      id: 'c4',
      name: 'Windy City Air & Heat',
      domain: 'windycityair.com',
      businessProfile: 'Windy City HVAC Master Dispatch',
      category: 'HVAC Contractor',
      packageTier: 'Standard 25-Pin Audit Retainer',
      monthlyRetainer: '$997/mo',
      renewalDate: 'Oct 31, 2026',
      status: 'Pending Setup',
      averageRank: 14.9,
    },
  ];

  const [clients, setClients] = useState<ClientRecord[]>(initialClients);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Managed Agency Client Accounts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active local businesses tracked under monthly SEO retainer contracts
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const newClient: ClientRecord = {
              id: `c${clients.length + 1}`,
              name: 'Dallas Pro Roofing',
              domain: 'dallasproroofing.com',
              businessProfile: 'Dallas Commercial Roofing LLC',
              category: 'Roofing Contractor',
              packageTier: 'Local 3-Pack Growth',
              monthlyRetainer: '$1,297/mo',
              renewalDate: 'Dec 01, 2026',
              status: 'Active',
              averageRank: 8.4,
            };
            setClients([newClient, ...clients]);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search clients by name, domain, or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Active Monthly Retainers:{' '}
          <strong className="text-emerald-700 font-mono">
            ${clients.reduce((acc, c) => acc + parseInt(c.monthlyRetainer.replace(/\D/g, '')), 0).toLocaleString()}/mo
          </strong>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Client & Domain</th>
                <th className="py-3 px-4">Category Niche</th>
                <th className="py-3 px-4">Active Package</th>
                <th className="py-3 px-4">Monthly Value</th>
                <th className="py-3 px-4">Renewal Date</th>
                <th className="py-3 px-4">Avg SERP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div>{client.name}</div>
                        <a
                          href={`https://${client.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-500 font-normal hover:text-emerald-700 flex items-center space-x-1"
                        >
                          <span>{client.domain}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {client.category}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {client.packageTier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono">
                    {client.monthlyRetainer}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{client.renewalDate}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] ${
                        client.averageRank <= 5
                          ? 'bg-emerald-50 text-emerald-700'
                          : client.averageRank <= 10
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      #{client.averageRank}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        client.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        if (onSelectClientBusiness) {
                          onSelectClientBusiness(client.name);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Manage
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
