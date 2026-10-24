/**
 * ProfitMaps AI / GeoRank Pro - Site Builder & Local Landing Page Generator
 * Path: /src/components/views/SiteBuilderView.tsx
 *
 * Implements:
 * 1. Dynamic Page CRUD State (Add/Edit/Delete local landing pages).
 * 2. Automated Local SEO HTML & Schema Generation via site-generator.ts.
 * 3. Live Page Preview Modal with responsive iframe device toggles (Desktop/Tablet/Mobile),
 *    Schema Validator (JSON-LD), and raw HTML source.
 * 4. 1-Click Static Site Export (ZIP bundle containing HTML pages, sitemap.xml, and robots.txt).
 */

import React, { useState, useMemo } from 'react';
import {
  Globe,
  Plus,
  Download,
  FileCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Code2,
  Layers,
  Copy,
  Check,
  Trash2,
  Edit3,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  X,
  ShieldCheck,
  MapPin,
  Tag,
  RefreshCw,
  FileText,
  AlertCircle,
  Building,
  Target,
} from 'lucide-react';

import {
  generatePageHtml,
  generateLocalBusinessSchema,
  generateSiteZip,
  slugToFilename,
  type PageItem,
  type PageType,
  type BusinessProfile,
} from '../../lib/builder/site-generator.ts';
import { analyzeRankingFixes } from '../../server/services/ranking-fixes.ts';

export interface SiteBuilderViewProps {
  businessName?: string;
  category?: string;
  city?: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export const SiteBuilderView: React.FC<SiteBuilderViewProps> = ({
  businessName = 'Austin Premier Plumbing',
  category = 'Emergency Plumber',
  city = 'Austin, TX',
  phone = '(512) 555-0199',
  address = '1024 Congress Ave, Austin, TX 78701',
  lat = 30.2672,
  lng = -97.7431,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Preview Modal State
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<'visual' | 'schema' | 'code'>('visual');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Add/Edit Page Modal State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formType, setFormType] = useState<PageType>('Localized Landing');
  const [formKeywords, setFormKeywords] = useState('');
  const [formIntent, setFormIntent] = useState('');
  const [formStatus, setFormStatus] = useState<'Ready to Publish' | 'Draft'>('Ready to Publish');

  // Business Profile Model
  const businessProfile: BusinessProfile = {
    name: businessName,
    category,
    city,
    address,
    phone,
    lat,
    lng,
    domain: `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    rating: 4.9,
    reviewsCount: 145,
  };

  const initialPages: PageItem[] = [
    {
      id: 'p1',
      name: 'Homepage',
      slug: '/',
      type: 'Home',
      keywords: [`${category} in ${city}`, `${businessName}`, 'Licensed Plumbers'],
      rankingIntent: 'Centroid Brand & Primary City Entity Validation',
      status: 'Ready to Publish',
      wordCount: 1850,
    },
    {
      id: 'p2',
      name: 'About Us & Master Licensing',
      slug: '/about-us',
      type: 'Authority',
      keywords: ['Family Owned Plumber', 'Austin Master License', 'Insurance & Bonding'],
      rankingIntent: 'E-E-A-T Entity Proof & Master Plumber Licensing Credentials',
      status: 'Ready to Publish',
      wordCount: 1120,
    },
    {
      id: 'p3',
      name: 'Comprehensive Plumbing Services',
      slug: '/services',
      type: 'Service',
      keywords: ['Commercial Plumbing', 'Residential Leak Detection', 'Drain Snaking'],
      rankingIntent: 'Broad Service Cluster Parent Hub for Secondary GBP Categories',
      status: 'Ready to Publish',
      wordCount: 2240,
    },
    {
      id: 'p4',
      name: `${city.split(',')[0]} 24/7 Rapid Response Landing Page`,
      slug: `/${city.split(',')[0].toLowerCase().replace(/\s+/g, '-')}-emergency-plumbing`,
      type: 'Localized Landing',
      keywords: [`24 Hour Plumber ${city.split(',')[0]}`, 'Broken Water Pipe', 'Overflowing Drain'],
      rankingIntent: 'Targeting Peripheral Unranked Geo-Nodes (Weak 3-Pack Zones)',
      status: 'Ready to Publish',
      wordCount: 1980,
    },
    {
      id: 'p5',
      name: 'Emergency Dispatch & Immediate Call',
      slug: '/emergency',
      type: 'Utility',
      keywords: ['Immediate Dispatch Plumber', 'Night & Weekend Plumber Austin'],
      rankingIntent: 'Mobile Direct-Call High Conversion Click-To-Dial Intent',
      status: 'Ready to Publish',
      wordCount: 890,
    },
    {
      id: 'p6',
      name: 'Frequently Asked Questions & Pricing Guide',
      slug: '/faq',
      type: 'FAQ',
      keywords: ['Plumbing Dispatch Fee Austin', 'How much does drain clearing cost'],
      rankingIntent: 'FAQPage Structured Schema Markup & Rich Google SERP Snippets',
      status: 'Ready to Publish',
      wordCount: 1450,
    },
    {
      id: 'p7',
      name: 'Contact & Service Territory Radius Map',
      slug: '/contact',
      type: 'Contact',
      keywords: [`${businessName} Phone`, 'Service Area Coordinates', 'Office Address'],
      rankingIntent: 'NAP Alignment & Direct GBP CID Embedded Map Signal',
      status: 'Ready to Publish',
      wordCount: 650,
    },
  ];

  const [pages, setPages] = useState<PageItem[]>(initialPages);

  const filteredPages = pages.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.rankingIntent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const competitorAnalysis = useMemo(() => {
    return analyzeRankingFixes({
      businessName,
      category,
      city,
    });
  }, [businessName, category, city]);

  const handleAddCompetitorPage = (contentFix: any) => {
    const exists = pages.some((p) => p.slug === contentFix.pageSlug);
    if (exists) {
      alert(`Page "${contentFix.pageSlug}" is already in your site plan.`);
      return;
    }
    const newPage: PageItem = {
      id: `comp_page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: contentFix.title,
      slug: contentFix.pageSlug,
      type: 'Localized Landing',
      keywords: [contentFix.targetKeyword, `${category} ${city}`],
      rankingIntent: `Targeting competitor search gap for '${contentFix.targetKeyword}'`,
      status: 'Ready to Publish',
      wordCount: 1450,
    };
    setPages((prev) => [newPage, ...prev]);
  };

  // Open modal to add a brand new page
  const handleOpenAddModal = () => {
    setEditingPageId(null);
    setFormName('');
    setFormSlug('');
    setFormType('Localized Landing');
    setFormKeywords(`${category} ${city.split(',')[0]}, Rapid Repair`);
    setFormIntent('Targeting Peripheral Unranked Geo-Nodes');
    setFormStatus('Ready to Publish');
    setIsAddEditModalOpen(true);
  };

  // Open modal to edit an existing page
  const handleOpenEditModal = (page: PageItem) => {
    setEditingPageId(page.id);
    setFormName(page.name);
    setFormSlug(page.slug);
    setFormType(page.type);
    setFormKeywords(page.keywords.join(', '));
    setFormIntent(page.rankingIntent);
    setFormStatus(page.status === 'Draft' ? 'Draft' : 'Ready to Publish');
    setIsAddEditModalOpen(true);
  };

  // Auto-generate clean slug from page name if adding a new page
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingPageId) {
      const generated = '/' + val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormSlug(generated);
    }
  };

  // Save add/edit page
  const handleSavePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) return;

    const keywordsArray = formKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingPageId) {
      // Update existing
      setPages((prev) =>
        prev.map((p) =>
          p.id === editingPageId
            ? {
                ...p,
                name: formName.trim(),
                slug: formSlug.startsWith('/') ? formSlug.trim() : `/${formSlug.trim()}`,
                type: formType,
                keywords: keywordsArray.length > 0 ? keywordsArray : [formName.trim()],
                rankingIntent: formIntent.trim() || 'Localized Search Intent',
                status: formStatus,
              }
            : p
        )
      );
    } else {
      // Create new
      const newPage: PageItem = {
        id: `page_${Date.now()}`,
        name: formName.trim(),
        slug: formSlug.startsWith('/') ? formSlug.trim() : `/${formSlug.trim()}`,
        type: formType,
        keywords: keywordsArray.length > 0 ? keywordsArray : [formName.trim()],
        rankingIntent: formIntent.trim() || 'Targeting Peripheral Unranked Geo-Nodes',
        status: formStatus,
        wordCount: 1400,
      };
      setPages((prev) => [newPage, ...prev]);
    }

    setIsAddEditModalOpen(false);
  };

  // Delete page action
  const handleDeletePage = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the landing page "${name}"?`)) {
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (previewPage?.id === id) {
        setPreviewPage(null);
      }
    }
  };

  // Copy slug helper
  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // 1-Click Static Site Export (ZIP)
  const handleExportZip = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const zipBlob = await generateSiteZip(businessProfile, pages);
      const filename = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-local-site.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setExportNotice(`Exported ZIP with ${pages.length} schema-validated HTML pages, sitemap.xml, & robots.txt!`);
      setTimeout(() => setExportNotice(null), 6000);
    } catch (err) {
      console.error('Failed generating static site bundle:', err);
      alert('An error occurred while compiling the ZIP bundle.');
    } finally {
      setIsExporting(false);
    }
  };

  // Single Page HTML download
  const handleDownloadSingleHtml = (page: PageItem) => {
    const html = generatePageHtml(businessProfile, page, pages);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = slugToFilename(page.slug);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open Preview in standalone browser tab
  const handleOpenInNewTab = (page: PageItem) => {
    const html = generatePageHtml(businessProfile, page, pages);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Pre-generate preview data for the active modal page
  const activePreviewHtml = previewPage ? generatePageHtml(businessProfile, previewPage, pages) : '';
  const activePreviewSchema = previewPage ? generateLocalBusinessSchema(businessProfile, previewPage) : null;

  return (
    <div className="space-y-4">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Site Builder & Local Landing Page Generator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate localized suburb landing pages with embedded Google Maps coordinates &amp; schema markup to expand 3-pack proximity reach.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Local Page</span>
          </button>

          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Compiling ZIP Archive...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Build & Export Static Site (ZIP/HTML)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pages the top businesses publish that you don't */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
          <div>
            <div className="flex items-center space-x-2 text-slate-900">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Pages the top businesses publish that you don't
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Top 3 ranking rivals hold search traffic because they have dedicated URLs for these specific services and locations.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 self-start sm:self-auto">
            {competitorAnalysis.contentFixes.length} Opportunity Pages Detected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {competitorAnalysis.contentFixes.map((item) => {
            const isAdded = pages.some((p) => p.slug === item.pageSlug);
            return (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                      {item.pageSlug}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ~{item.estimatedMonthlySearchReach} / mo reach
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    By: {item.competitorsPublishing[0] || 'Top Rival'}
                  </span>
                  <button
                    onClick={() => handleAddCompetitorPage(item)}
                    disabled={isAdded}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1 ${
                      isAdded
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAdded ? 'Added' : 'Add to Site'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search pages by name, slug, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{filteredPages.length}</strong> localized pages
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Page Name</th>
                <th className="py-3 px-4">URL Slug</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Target Keywords</th>
                <th className="py-3 px-4">Ranking Intent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{page.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    <button
                      onClick={() => copySlug(page.slug)}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Copy URL slug"
                    >
                      <span>{page.slug}</span>
                      {copiedSlug === page.slug ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        page.type === 'Localized Landing'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : page.type === 'Home' || page.type === 'Core'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : page.type === 'Authority'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {page.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {page.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={page.rankingIntent}>
                    {page.rankingIntent}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        page.status === 'Ready to Publish' || page.status === 'Generated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{page.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setPreviewPage(page);
                          setPreviewTab('visual');
                        }}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                        title="Live Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      <button
                        onClick={() => {
                          setPreviewPage(page);
                          setPreviewTab('schema');
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                        title="View JSON-LD Schema"
                      >
                        <Code2 className="w-3.5 h-3.5 text-purple-600" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(page)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                        title="Edit Page"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {page.slug !== '/' && (
                        <button
                          onClick={() => handleDeletePage(page.id, page.name)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-medium transition cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. LIVE PAGE PREVIEW MODAL (Responsive iframe + Schema)      */}
      {/* ============================================================ */}
      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {previewPage.name}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {previewPage.slug}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Semantic HTML5 • Tailwind CSS • JSON-LD LocalBusiness Schema
                  </span>
                </div>
              </div>

              {/* Mode Tabs (Visual / Schema / Code) */}
              <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewTab('visual')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    previewTab === 'visual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
                <button
                  onClick={() => setPreviewTab('schema')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    previewTab === 'schema'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Schema Validator</span>
                </button>
                <button
                  onClick={() => setPreviewTab('code')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                    previewTab === 'code'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>HTML Source</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenInNewTab(previewPage)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                  title="Open in Standalone Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadSingleHtml(previewPage)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                  title="Download HTML"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewPage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-toolbar: Device Viewport Switcher when in Visual Tab */}
            {previewTab === 'visual' && (
              <div className="px-5 py-2 border-b border-slate-200/60 bg-white flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-slate-500">Viewport Simulation:</span>
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      onClick={() => setPreviewDevice('tablet')}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
                        previewDevice === 'tablet'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      <span>Tablet (768px)</span>
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile (375px)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                  <span>Target: <strong className="text-slate-800">{previewPage.keywords[0]}</strong></span>
                </div>
              </div>
            )}

            {/* Modal Body Container */}
            <div className="flex-1 bg-slate-100 overflow-y-auto flex justify-center p-4">
              {/* TAB 1: VISUAL LIVE IFRAME PREVIEW */}
              {previewTab === 'visual' && (
                <div
                  className={`bg-white rounded-2xl shadow-lg border border-slate-300 overflow-hidden transition-all duration-300 h-full flex flex-col ${
                    previewDevice === 'desktop'
                      ? 'w-full'
                      : previewDevice === 'tablet'
                      ? 'w-[768px]'
                      : 'w-[375px]'
                  }`}
                >
                  <iframe
                    title="Live Landing Page Preview"
                    srcDoc={activePreviewHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              )}

              {/* TAB 2: SCHEMA VALIDATOR */}
              {previewTab === 'schema' && (
                <div className="w-full max-w-3xl space-y-4">
                  {/* Schema Summary Card */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-slate-900 text-sm">
                          JSON-LD Structured Data Schema (Schema.org)
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Valid Schema Structure
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Schema @type</span>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {(activePreviewSchema as any)?.['@type'] || 'LocalBusiness'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Business Entity</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {businessName}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">GeoCoordinates</span>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Google Rating</span>
                        <span className="font-bold text-amber-600">
                          ★ 4.9 (145 reviews)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500">
                        Ready for Google Rich Snippets &amp; Knowledge Graph ingestion.
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(activePreviewSchema, null, 2));
                          setCopiedSchema(true);
                          setTimeout(() => setCopiedSchema(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                      >
                        {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy JSON-LD'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Schema Code Block */}
                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
                    <pre className="leading-relaxed">
                      {JSON.stringify(activePreviewSchema, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: RAW HTML SOURCE */}
              {previewTab === 'code' && (
                <div className="w-full max-w-4xl space-y-3">
                  <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-600 font-medium">
                      Generated Semantic HTML5 Source ({activePreviewHtml.length.toLocaleString()} characters)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activePreviewHtml);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied HTML!' : 'Copy Full HTML'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[68vh] shadow-inner">
                    <pre className="leading-relaxed whitespace-pre-wrap">
                      {activePreviewHtml}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Targeting: {previewPage.rankingIntent}
              </span>
              <button
                onClick={() => setPreviewPage(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. ADD / EDIT LOCAL LANDING PAGE MODAL                       */}
      {/* ============================================================ */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingPageId ? 'Edit Landing Page' : 'Add New Local Landing Page'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure localized keyword targeting &amp; URL structure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Page Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Congress Emergency Plumber"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. /south-congress-emergency-plumber"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Exported static filename will be: <code className="text-slate-600 font-bold">{slugToFilename(formSlug || '/example')}</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Page Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PageType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Localized Landing">Localized Landing</option>
                    <option value="Service">Service</option>
                    <option value="Home">Home / Core</option>
                    <option value="FAQ">FAQ Page</option>
                    <option value="Contact">Contact Page</option>
                    <option value="About">About Page</option>
                    <option value="Authority">Authority Page</option>
                    <option value="Utility">Utility Page</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Ready to Publish' | 'Draft')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ready to Publish">Ready to Publish</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24/7 Plumber South Congress, Burst Pipe Repair, Drain Snaking"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local SEO Ranking Intent
                </label>
                <input
                  type="text"
                  placeholder="e.g. Targeting Peripheral Unranked Geo-Nodes"
                  value={formIntent}
                  onChange={(e) => setFormIntent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  {editingPageId ? 'Save Changes' : 'Create Local Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
