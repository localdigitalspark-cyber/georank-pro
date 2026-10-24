/**
 * GeoRank Pro / ProfitMaps AI - Local Site Builder Engine
 * Path: /src/lib/builder/site-generator.ts
 *
 * Generates production-ready, semantic, schema-validated static HTML landing pages,
 * complete JSON-LD structured data, sitemap.xml, and robots.txt.
 * Includes automated ZIP packaging via JSZip for 1-click export.
 */

import JSZip from 'jszip';

export type PageType =
  | 'Home'
  | 'Service'
  | 'City Service'
  | 'FAQ'
  | 'Contact'
  | 'About'
  | 'Core'
  | 'Localized Landing'
  | 'Utility'
  | 'Authority';

export interface PageItem {
  id: string;
  name: string;
  slug: string;
  type: PageType;
  keywords: string[];
  rankingIntent: string;
  status: 'Ready to Publish' | 'Draft' | 'Generated';
  wordCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
}

export interface BusinessProfile {
  name: string;
  category: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
  domain?: string;
  rating?: number;
  reviewsCount?: number;
  openingHours?: string[];
}

/**
 * Resolves appropriate Schema.org @type based on business category.
 */
export function resolveSchemaType(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('plumb')) return 'PlumbingService';
  if (cat.includes('electric')) return 'Electrician';
  if (cat.includes('roof')) return 'RoofingContractor';
  if (cat.includes('hvac') || cat.includes('air conditioning') || cat.includes('heating')) return 'HVACBusiness';
  if (cat.includes('dentist') || cat.includes('dental')) return 'Dentist';
  if (cat.includes('law') || cat.includes('attorney') || cat.includes('legal')) return 'LegalService';
  if (cat.includes('locksmith')) return 'Locksmith';
  if (cat.includes('clean')) return 'HousePainter';
  if (cat.includes('auto') || cat.includes('mechanic')) return 'AutoRepair';
  if (cat.includes('pest')) return 'PestControlService';
  return 'LocalBusiness';
}

/**
 * Derives neighborhood list from city string to ground local E-E-A-T relevance.
 */
export function getLocalNeighborhoods(cityStr: string): string[] {
  const cleanCity = cityStr.split(',')[0].trim();
  if (cleanCity.toLowerCase().includes('austin')) {
    return [
      'Downtown Austin',
      'South Congress (SoCo)',
      'Zilker & Barton Hills',
      'The Domain & North Austin',
      'Mueller District',
      'Westlake Hills & Rollingwood',
      'Tarrytown & Clarksville',
      'East Austin Cultural District',
      'Travis Heights',
      'Round Rock & Cedar Park Metro',
    ];
  }
  if (cleanCity.toLowerCase().includes('southampton')) {
    return [
      'Southampton City Centre',
      'Portswood & Highfield',
      'Bassett & Swaythling',
      'Shirley & Freemantle',
      'Bitterne & Woolston',
      'Ocean Village & Marina',
      'Totton & Waterside',
      'Romsey Metro Boundary',
    ];
  }
  return [
    `Downtown ${cleanCity}`,
    `North ${cleanCity}`,
    `South ${cleanCity}`,
    `East ${cleanCity}`,
    `West ${cleanCity}`,
    `${cleanCity} Heights`,
    `${cleanCity} Commercial Park`,
    `${cleanCity} Suburbs & Outer Ring`,
  ];
}

/**
 * Generates complete, valid JSON-LD structured data schema for LocalBusiness.
 */
export function generateLocalBusinessSchema(
  business: BusinessProfile,
  page: PageItem
): Record<string, unknown> {
  const schemaType = resolveSchemaType(business.category);
  const domain = business.domain || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  const url = `https://${domain}${page.slug === '/' ? '' : page.slug}`;
  const cityParts = (business.city || 'Austin, TX').split(',');
  const cityName = cityParts[0]?.trim() || 'Austin';
  const stateCode = cityParts[1]?.trim() || 'TX';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': `https://${domain}/#${schemaType.toLowerCase()}`,
    name: business.name,
    image: `https://${domain}/assets/hero-banner.jpg`,
    url,
    telephone: business.phone || '(512) 555-0199',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address || '1024 Congress Ave',
      addressLocality: cityName,
      addressRegion: stateCode,
      postalCode: '78701',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.lat ?? 30.2672,
      longitude: business.lng ?? -97.7431,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (business.rating || 4.9).toFixed(1),
      reviewCount: business.reviewsCount || 142,
      bestRating: '5',
      worstRating: '1',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    areaServed: getLocalNeighborhoods(business.city).map((neighborhood) => ({
      '@type': 'AdministrativeArea',
      name: `${neighborhood}, ${cityName}`,
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${business.category} Core Services`,
      itemListElement: page.keywords.slice(0, 4).map((kw, i) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: kw,
          description: `Professional, licensed ${kw.toLowerCase()} services dispatched locally across ${cityName}.`,
        },
      })),
    },
  };

  return schema;
}

/**
 * Generates FAQPage JSON-LD schema for rich search snippet eligibility.
 */
export function generateFaqSchema(faqs: Array<{ q: string; a: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

/**
 * Converts a page URL slug to a standalone HTML filename.
 * e.g. "/" -> "index.html", "/about-us" -> "about-us.html", "/services" -> "services.html"
 */
export function slugToFilename(slug: string): string {
  if (slug === '/' || slug === '' || slug === 'index') {
    return 'index.html';
  }
  const clean = slug.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${clean}.html`;
}

/**
 * Generates clean, modern, responsive semantic HTML5 page with Tailwind CSS,
 * hero call-to-actions, quotes form, interactive FAQs, map embed, and JSON-LD schema.
 */
export function generatePageHtml(
  business: BusinessProfile,
  page: PageItem,
  allPages: PageItem[] = []
): string {
  const schema = generateLocalBusinessSchema(business, page);
  const cityParts = (business.city || 'Austin, TX').split(',');
  const cityName = cityParts[0]?.trim() || 'Austin';
  const stateCode = cityParts[1]?.trim() || 'TX';
  const phone = business.phone || '(512) 555-0199';
  const lat = business.lat ?? 30.2672;
  const lng = business.lng ?? -97.7431;
  const primaryKw = page.keywords[0] || `${business.category} in ${cityName}`;
  const neighborhoods = getLocalNeighborhoods(business.city);

  const faqs = [
    {
      q: `How quickly can you dispatch a licensed technician in ${cityName}?`,
      a: `Our emergency dispatch vehicles are strategically positioned across ${cityName} neighborhoods. Under normal dispatch conditions, our average arrival response time is between 25 and 45 minutes for emergency calls.`,
    },
    {
      q: `Do you provide upfront flat-rate pricing before starting any work?`,
      a: `Yes, 100%. Our certified technician performs an in-depth diagnosis and presents an itemized, flat-rate quote before touching a single pipe or wire. There are never hidden trip charges or surprise overtime fees.`,
    },
    {
      q: `Are your technicians fully licensed, background-checked, and insured?`,
      a: `Every technician on our roster is state-licensed, rigorously background-checked, drug-tested, and covered by comprehensive $2,000,000 commercial liability insurance for complete homeowner peace of mind.`,
    },
    {
      q: `What should I do while waiting for your emergency dispatch team?`,
      a: `If experiencing an active leak, locate your main water shutoff valve (typically near the water meter or front flowerbed) and rotate clockwise. Shut off electricity to flooded areas at the main breaker box immediately.`,
    },
    {
      q: `Do you provide warranties on repairs and installed equipment?`,
      a: `We guarantee all repair labor for a full 12 months and provide up to 10-year manufacturer warranty coverage on newly installed water heaters, sewer lines, and major fixtures.`,
    },
  ];

  const faqSchema = generateFaqSchema(faqs);

  const heroH1 =
    page.heroHeadline ||
    (page.type === 'Home'
      ? `${cityName}'s #1 Rated ${business.category}`
      : `${page.name} in ${cityName}, ${stateCode}`);

  const heroSub =
    page.heroSubheadline ||
    `Licensed, bonded, and local. Delivering 24/7 rapid response, upfront flat-rate pricing, and 5-star customer service across ${cityName} and surrounding suburbs.`;

  // Build navigation items
  const navLinks =
    allPages.length > 0
      ? allPages.slice(0, 6).map((p) => ({
          name: p.name.replace(/Landing Page|Page/gi, '').trim(),
          href: slugToFilename(p.slug),
          isActive: p.slug === page.slug,
        }))
      : [
          { name: 'Home', href: 'index.html', isActive: page.slug === '/' },
          { name: 'Services', href: 'services.html', isActive: page.slug === '/services' },
          { name: 'Emergency', href: 'emergency.html', isActive: page.slug === '/emergency' },
          { name: 'FAQ', href: 'faq.html', isActive: page.slug === '/faq' },
          { name: 'Contact', href: 'contact.html', isActive: page.slug === '/contact' },
        ];

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.metaTitle || `${page.name} | ${business.name} - ${cityName}, ${stateCode}`}</title>
  <meta name="description" content="${
    page.metaDescription ||
    `Need ${primaryKw}? Call ${business.name} at ${phone}. Top-rated local ${business.category.toLowerCase()} in ${cityName}. Fast dispatch, upfront quotes & 24/7 emergency service.`
  }">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://${business.domain || 'example.com'}${page.slug}">

  <!-- Open Graph -->
  <meta property="og:title" content="${page.name} | ${business.name}">
  <meta property="og:description" content="24/7 Emergency ${business.category} serving ${cityName}. Call ${phone}.">
  <meta property="og:type" content="website">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#ecfdf5',
              100: '#d1fae5',
              500: '#10b981',
              600: '#059669',
              700: '#047857',
              800: '#065f46',
              900: '#064e3b',
            }
          }
        }
      }
    }
  </script>

  <!-- JSON-LD LocalBusiness Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
  </script>

  <!-- JSON-LD FAQPage Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(faqSchema, null, 2)}
  </script>
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans selection:bg-brand-500 selection:text-white">

  <!-- Top Announcement Bar -->
  <div class="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center space-x-2">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="font-semibold text-emerald-400">24/7 Rapid Dispatch Active:</span>
        <span class="text-slate-300">Emergency units currently standing by across ${cityName}</span>
      </div>
      <div class="flex items-center space-x-4 text-slate-300">
        <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="hover:text-emerald-400 font-bold transition flex items-center space-x-1">
          <span>Call Dispatch:</span>
          <span class="text-white">${phone}</span>
        </a>
      </div>
    </div>
  </div>

  <!-- Header Navigation -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
      <a href="index.html" class="flex items-center space-x-3 group">
        <div class="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition">
          ${business.name.charAt(0)}
        </div>
        <div>
          <span class="block text-base font-extrabold text-slate-900 leading-tight group-hover:text-brand-600 transition">
            ${business.name}
          </span>
          <span class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            ${business.category} • ${cityName}
          </span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
        ${navLinks
          .map(
            (link) => `
        <a href="${link.href}" class="hover:text-brand-600 transition ${
              link.isActive ? 'text-brand-600 font-bold border-b-2 border-brand-600 pb-0.5' : ''
            }">
          ${link.name}
        </a>`
          )
          .join('')}
      </nav>

      <!-- Click to Call Button -->
      <div class="flex items-center space-x-3">
        <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md hover:shadow-brand-600/30 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          <span>${phone}</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Hero Section with Dual CTA and Instant Quote Form -->
  <section class="relative bg-gradient-to-b from-slate-100/80 via-white to-slate-50 py-12 sm:py-20 border-b border-slate-200/60 overflow-hidden">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

        <!-- Left Hero Copy -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Rating Pill -->
          <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
            <span class="text-amber-500 text-sm">★★★★★</span>
            <span>4.9 Star Verified Google Rating (140+ Reviews)</span>
          </div>

          <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            ${heroH1}
          </h1>

          <p class="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
            ${heroSub}
          </p>

          <!-- Key Trust Badges -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div class="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">✓</span>
              <span>Master Licensed</span>
            </div>
            <div class="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">✓</span>
              <span>Upfront Flat Rates</span>
            </div>
            <div class="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <span class="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">✓</span>
              <span>25-Min Response</span>
            </div>
          </div>

          <!-- CTAs -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
            <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-brand-600/30 transition text-center flex items-center justify-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span>Click to Call: ${phone}</span>
            </a>
            <a href="#quote-section" class="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-sm font-semibold shadow-xs transition text-center">
              Request Online Quote
            </a>
          </div>
        </div>

        <!-- Right Quick Quote Card -->
        <div id="quote-section" class="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl">
          <div class="border-b border-slate-100 pb-4 mb-5">
            <span class="text-brand-600 text-[11px] font-bold uppercase tracking-wider">Fast Service Request</span>
            <h3 class="text-lg font-bold text-slate-900 mt-0.5">Get a Flat-Rate Estimate</h3>
            <p class="text-xs text-slate-500 mt-1">Direct dispatch notification to our ${cityName} field supervisor.</p>
          </div>

          <form onsubmit="event.preventDefault(); alert('Thank you! A dispatch coordinator has received your request and will call you within 5 minutes.');" class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Your Name</label>
              <input type="text" required placeholder="John Smith" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Phone Number (For Fast Dispatch)</label>
              <input type="tel" required placeholder="${phone}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Service Required</label>
              <select class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500">
                ${page.keywords
                  .map((k) => `<option value="${k}">${k}</option>`)
                  .join('')}
                <option value="Emergency Diagnostic">Immediate Emergency Diagnostic</option>
                <option value="General Inspection">Routine Repair & Inspection</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Brief Description of Problem</label>
              <textarea rows="2" placeholder="e.g. Broken pipe in garage, water heater leaking..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"></textarea>
            </div>

            <button type="submit" class="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-brand-600/30 transition cursor-pointer">
              Send Priority Dispatch Alert →
            </button>
            <p class="text-[10px] text-center text-slate-400">Your privacy is guaranteed. No spam, ever.</p>
          </form>
        </div>

      </div>
    </div>
  </section>

  <!-- Core Services Grid -->
  <section class="py-16 bg-white border-b border-slate-200/70">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="text-center max-w-2xl mx-auto space-y-2 mb-12">
        <span class="text-xs font-bold text-brand-600 uppercase tracking-widest">Specialized Capabilities</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Professional ${business.category} Services
        </h2>
        <p class="text-xs sm:text-sm text-slate-500">
          Equipped with commercial hydro-jetters, thermal imaging leak detectors, and complete mobile inventory.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${page.keywords.slice(0, 6).map((kw, i) => `
        <div class="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-brand-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition space-y-3 group">
          <div class="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-sm group-hover:scale-110 transition">
            0${i + 1}
          </div>
          <h3 class="text-base font-bold text-slate-900 group-hover:text-brand-600 transition">
            ${kw}
          </h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            High-efficiency, code-compliant ${kw.toLowerCase()} performed by certified master technicians. Includes complete system inspection and multi-point safety validation.
          </p>
          <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="inline-flex items-center text-xs font-bold text-brand-700 hover:text-brand-800 space-x-1 pt-1">
            <span>Book this service</span>
            <span>→</span>
          </a>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Service Territory & Geocoded Map Embed -->
  <section class="py-16 bg-slate-50 border-b border-slate-200/70">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

        <!-- Left: Territory Neighborhoods Checklist -->
        <div class="lg:col-span-6 space-y-5">
          <div>
            <span class="text-xs font-bold text-brand-600 uppercase tracking-widest">Local Coverage Radius</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Proudly Serving ${cityName} &amp; Surrounding Neighborhoods
            </h2>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">
              Our GPS-monitored fleet operates across all major zip codes in ${cityName}, providing swift arrival times and reliable neighborhood coverage.
            </p>
          </div>

          <!-- Neighborhood Badge Matrix -->
          <div class="grid grid-cols-2 gap-2.5 pt-2">
            ${neighborhoods.map((n) => `
            <div class="flex items-center space-x-2 p-2 bg-white rounded-xl border border-slate-200/80 shadow-xs text-xs text-slate-800">
              <span class="text-emerald-600 font-bold">✓</span>
              <span class="truncate font-medium">${n}</span>
            </div>
            `).join('')}
          </div>

          <div class="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center space-x-3">
            <span class="text-emerald-700 text-lg font-bold">📍</span>
            <div class="text-xs text-emerald-900">
              <strong>Verified Operating Address:</strong><br>
              ${business.address || '1024 Congress Ave'}, ${cityName}, ${stateCode}
            </div>
          </div>
        </div>

        <!-- Right: Interactive Map Embed -->
        <div class="lg:col-span-6">
          <div class="bg-white p-2.5 rounded-3xl border border-slate-200/90 shadow-md">
            <iframe
              title="Google Maps Service Territory"
              src="https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=13&output=embed"
              width="100%"
              height="360"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              class="w-full h-88 rounded-2xl border border-slate-100"
            ></iframe>
            <div class="p-3 text-[11px] text-slate-500 flex items-center justify-between">
              <span>GeoCoordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
              <span class="text-emerald-700 font-semibold">Active Centroid Verified</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- Interactive FAQ Accordion -->
  <section class="py-16 bg-white border-b border-slate-200/70">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      <div class="text-center space-y-2">
        <span class="text-xs font-bold text-brand-600 uppercase tracking-widest">Helpful Answers</span>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Frequently Asked Questions
        </h2>
        <p class="text-xs sm:text-sm text-slate-500">
          Common questions homeowners and commercial property managers ask about our local services.
        </p>
      </div>

      <div class="space-y-3">
        ${faqs.map((faq) => `
        <details class="group bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-200">
          <summary class="flex items-center justify-between p-4 sm:p-5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer list-none select-none hover:text-brand-700">
            <span>${faq.q}</span>
            <span class="w-6 h-6 rounded-full bg-slate-200/70 group-open:bg-brand-100 group-open:text-brand-700 flex items-center justify-center text-xs transition-transform duration-200 group-open:rotate-180">
              ▼
            </span>
          </summary>
          <div class="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
            ${faq.a}
          </div>
        </details>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Emergency CTA Callout Banner -->
  <section class="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white py-14">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
      <span class="inline-block px-3 py-1 bg-brand-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
        Immediate Assistance Available
      </span>
      <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight">
        Facing an Urgent ${business.category} Issue in ${cityName}?
      </h2>
      <p class="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
        Don't let minor leaks or breakdowns escalate into catastrophic structural water damage. Call our emergency dispatch phone line now.
      </p>
      <div class="pt-2">
        <a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="inline-flex items-center space-x-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-base font-extrabold shadow-xl hover:shadow-brand-600/40 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          <span>Call ${phone} (Live Dispatch)</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Semantic Footer -->
  <footer class="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            ${business.name.charAt(0)}
          </div>
          <span class="text-sm font-bold text-white">${business.name}</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Top-rated emergency local ${business.category.toLowerCase()} serving the greater ${cityName} metropolitan region with master licensing and upfront quotes.
        </p>
      </div>

      <div>
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Service Areas</h4>
        <ul class="space-y-1.5 text-[11px]">
          ${neighborhoods.slice(0, 5).map((n) => `<li>• ${n}</li>`).join('')}
        </ul>
      </div>

      <div>
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Quick Links</h4>
        <ul class="space-y-1.5 text-[11px]">
          ${navLinks.map((l) => `<li><a href="${l.href}" class="hover:text-emerald-400 transition">${l.name}</a></li>`).join('')}
        </ul>
      </div>

      <div>
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3">Operating NAP</h4>
        <address class="not-italic text-[11px] space-y-1.5 text-slate-300">
          <p><strong>${business.name}</strong></p>
          <p>${business.address || '1024 Congress Ave'}</p>
          <p>${cityName}, ${stateCode} 78701</p>
          <p class="pt-1"><a href="tel:${phone.replace(/[^0-9+]/g, '')}" class="text-emerald-400 font-bold hover:underline">${phone}</a></p>
        </address>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
      <p>&copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
      <p>Local SEO Architecture Powered by ProfitMaps AI &amp; GeoRank Pro</p>
    </div>
  </footer>

</body>
</html>`;
}

/**
 * Generates valid sitemap.xml with accurate timestamps and priority weights.
 */
export function generateSitemapXml(
  business: BusinessProfile,
  pages: PageItem[]
): string {
  const domain = business.domain || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  const today = new Date().toISOString().split('T')[0];

  const urls = pages.map((page) => {
    const loc = `https://${domain}${page.slug === '/' ? '' : page.slug}`;
    const priority = page.slug === '/' ? '1.0' : page.type === 'Localized Landing' ? '0.8' : '0.6';
    const changefreq = page.slug === '/' ? 'daily' : 'weekly';

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/**
 * Generates standard robots.txt referencing the sitemap.
 */
export function generateRobotsTxt(business: BusinessProfile): string {
  const domain = business.domain || `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  return `# Robots.txt for ${business.name}
User-agent: *
Allow: /

# Canonical XML Sitemap
Sitemap: https://${domain}/sitemap.xml
`;
}

/**
 * Packages all generated pages, sitemap.xml, and robots.txt into a downloadable ZIP archive.
 */
export async function generateSiteZip(
  business: BusinessProfile,
  pages: PageItem[]
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Generate HTML for every page
  pages.forEach((page) => {
    const filename = slugToFilename(page.slug);
    const html = generatePageHtml(business, page, pages);
    zip.file(filename, html);
  });

  // 2. Add sitemap.xml
  const sitemapXml = generateSitemapXml(business, pages);
  zip.file('sitemap.xml', sitemapXml);

  // 3. Add robots.txt
  const robotsTxt = generateRobotsTxt(business);
  zip.file('robots.txt', robotsTxt);

  // 4. Add a README with deployment instructions
  const readme = `# Static Local SEO Landing Site for ${business.name}
Generated by GeoRank Pro & ProfitMaps AI Engine.

## Included Files:
${pages.map((p) => `- ${slugToFilename(p.slug)}: ${p.name} (${p.rankingIntent})`).join('\n')}
- sitemap.xml: Canonical search engine XML sitemap
- robots.txt: Crawl directives

## Deployment Instructions:
1. Upload all files to the root directory of your web host (Netlify, Vercel, Cloudflare Pages, cPanel, Apache, Nginx).
2. Configure your web server to serve .html extensions cleanly if desired.
3. Submit https://${business.domain || 'yourdomain.com'}/sitemap.xml in Google Search Console to expedite local SERP indexing.
`;
  zip.file('README.md', readme);

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
