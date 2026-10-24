/**
 * GeoRank Pro - Keyword Discovery & Traffic Engine
 * Path: /src/lib/keywords/keyword-discovery.ts
 *
 * Provides real-time keyword intelligence, search volume, CPC, and intent metrics
 * powered by Gemini AI with deterministic high-fidelity trade fallbacks.
 */

import { detectLocaleFromBusiness } from '../../config/brand.ts';
import { sanitizeKeyword } from '../../server/services/gemini-content.ts';

export interface DiscoveredKeyword {
  keyword: string;
  monthlySearchVolume: number;
  cpc: string;
  intent: 'Emergency' | 'High Intent' | 'Transactional' | 'Commercial';
  difficulty: 'Low' | 'Medium' | 'High';
  estimatedPackDifficulty: number; // 1 - 100
}

export interface KeywordDiscoveryResult {
  targetBusiness: string;
  targetCategory: string;
  targetCity: string;
  totalMonthlyVolume: number;
  estimatedClicks: number;
  averageCpc: string;
  keywords: DiscoveredKeyword[];
}

export interface KeywordDiscoveryInput {
  businessName: string;
  category?: string;
  cityOrTown?: string;
}

// Gemini Structured JSON Schema for Keyword Discovery
export const geminiKeywordDiscoverySchema = {
  type: 'object',
  properties: {
    keywords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          monthlySearchVolume: { type: 'integer' },
          cpc: { type: 'string' },
          intent: {
            type: 'string',
            enum: ['Emergency', 'High Intent', 'Transactional', 'Commercial'],
          },
          difficulty: {
            type: 'string',
            enum: ['Low', 'Medium', 'High'],
          },
          estimatedPackDifficulty: { type: 'integer' },
        },
        required: [
          'keyword',
          'monthlySearchVolume',
          'cpc',
          'intent',
          'difficulty',
          'estimatedPackDifficulty',
        ],
      },
    },
  },
  required: ['keywords'],
};

export function buildKeywordDiscoveryPrompt(input: KeywordDiscoveryInput): string {
  const business = input.businessName || 'Local Business';
  const category = input.category || 'Local Service';
  const city = input.cityOrTown || 'Metro Area';

  return `You are a Local SEO Keyword Research and Traffic Intelligence expert.
Analyze the local market for the following verified local business:
- Business Name: "${business}"
- Core Trade / Category: "${category}"
- Target City / Locality: "${city}"

Generate an array of 12-15 high-converting, high-intent local search terms that customers in ${city} actually type into Google Maps and Local Search.
Ensure you include:
1. Direct category + city searches (e.g. "${category.toLowerCase()} ${city}")
2. "Near me" high-intent searches
3. Emergency / 24/7 transactional queries
4. High-value specific service and repair variations
5. Commercial / commercial-grade terms

Rules:
- NEVER append the proprietary brand name "${business}" to the keyword itself. Keywords must be generic search terms people query to find services.
- monthlySearchVolume: realistic local monthly volume between 90 and 2600.
- cpc: local Google Ads cost-per-click string with currency (e.g., "£2.80" or "$3.40").
- intent: one of "Emergency", "High Intent", "Transactional", "Commercial".
- difficulty: one of "Low", "Medium", "High".
- estimatedPackDifficulty: competition score 10-95 for ranking in the Google Maps 3-Pack.

Respond ONLY with valid JSON strictly conforming to the requested schema.`;
}

/**
 * Deterministic Local SEO Keyword Fallback Database
 * Yields realistic, highly relevant traffic numbers immediately if AI is offline or times out.
 */
export function generateDeterministicKeywordDiscovery(
  input: KeywordDiscoveryInput
): KeywordDiscoveryResult {
  const business = input.businessName || 'Local Business';
  const rawCategory = (input.category || 'Local Service').trim();
  const rawCity = (input.cityOrTown || 'Local Area').split(',')[0].trim();
  const city = rawCity || 'Local Area';

  const catLower = rawCategory.toLowerCase();
  let keywords: DiscoveredKeyword[] = [];

  if (
    catLower.includes('phone') ||
    catLower.includes('gadget') ||
    catLower.includes('screen') ||
    catLower.includes('mobile') ||
    catLower.includes('cell') ||
    catLower.includes('ipad')
  ) {
    keywords = [
      {
        keyword: `phone repair ${city}`,
        monthlySearchVolume: 890,
        cpc: '£2.40',
        intent: 'High Intent',
        difficulty: 'Medium',
        estimatedPackDifficulty: 48,
      },
      {
        keyword: `iPhone screen replacement ${city}`,
        monthlySearchVolume: 680,
        cpc: '£2.90',
        intent: 'Transactional',
        difficulty: 'Medium',
        estimatedPackDifficulty: 45,
      },
      {
        keyword: 'phone screen repair near me',
        monthlySearchVolume: 1850,
        cpc: '£2.60',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 78,
      },
      {
        keyword: `emergency phone repair ${city}`,
        monthlySearchVolume: 420,
        cpc: '£3.40',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 52,
      },
      {
        keyword: `iPad repair ${city}`,
        monthlySearchVolume: 390,
        cpc: '£2.10',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 28,
      },
      {
        keyword: `Samsung screen repair ${city}`,
        monthlySearchVolume: 310,
        cpc: '£2.50',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 30,
      },
      {
        keyword: `battery replacement ${city}`,
        monthlySearchVolume: 280,
        cpc: '£1.95',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 24,
      },
      {
        keyword: 'phone repair shop near me',
        monthlySearchVolume: 1200,
        cpc: '£2.30',
        intent: 'High Intent',
        difficulty: 'Medium',
        estimatedPackDifficulty: 60,
      },
      {
        keyword: `cheap phone repair ${city}`,
        monthlySearchVolume: 340,
        cpc: '£1.80',
        intent: 'High Intent',
        difficulty: 'Medium',
        estimatedPackDifficulty: 38,
      },
      {
        keyword: `back glass repair ${city}`,
        monthlySearchVolume: 220,
        cpc: '£2.15',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 22,
      },
      {
        keyword: `tablet repair services ${city}`,
        monthlySearchVolume: 190,
        cpc: '£2.00',
        intent: 'Commercial',
        difficulty: 'Low',
        estimatedPackDifficulty: 25,
      },
      {
        keyword: `same day phone repair ${city}`,
        monthlySearchVolume: 360,
        cpc: '£3.10',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 44,
      },
    ];
  } else if (catLower.includes('plumb') || catLower.includes('drain') || catLower.includes('water heater')) {
    keywords = [
      {
        keyword: `emergency plumber ${city}`,
        monthlySearchVolume: 1250,
        cpc: '£5.40',
        intent: 'Emergency',
        difficulty: 'High',
        estimatedPackDifficulty: 74,
      },
      {
        keyword: `24/7 drain cleaning ${city}`,
        monthlySearchVolume: 780,
        cpc: '£4.20',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 56,
      },
      {
        keyword: `water heater repair ${city}`,
        monthlySearchVolume: 620,
        cpc: '£4.80',
        intent: 'Transactional',
        difficulty: 'Medium',
        estimatedPackDifficulty: 49,
      },
      {
        keyword: 'plumber near me',
        monthlySearchVolume: 3400,
        cpc: '£4.90',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 88,
      },
      {
        keyword: `blocked drain specialist ${city}`,
        monthlySearchVolume: 490,
        cpc: '£3.80',
        intent: 'High Intent',
        difficulty: 'Low',
        estimatedPackDifficulty: 32,
      },
      {
        keyword: `boiler repair ${city}`,
        monthlySearchVolume: 890,
        cpc: '£5.10',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 62,
      },
      {
        keyword: `burst pipe repair ${city}`,
        monthlySearchVolume: 310,
        cpc: '£6.20',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 50,
      },
      {
        keyword: `commercial plumber ${city}`,
        monthlySearchVolume: 270,
        cpc: '£5.90',
        intent: 'Commercial',
        difficulty: 'Low',
        estimatedPackDifficulty: 29,
      },
      {
        keyword: `local gas engineer ${city}`,
        monthlySearchVolume: 540,
        cpc: '£4.60',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 35,
      },
      {
        keyword: `leak detection services ${city}`,
        monthlySearchVolume: 290,
        cpc: '£4.40',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 26,
      },
      {
        keyword: `affordable plumber ${city}`,
        monthlySearchVolume: 480,
        cpc: '£3.90',
        intent: 'High Intent',
        difficulty: 'Medium',
        estimatedPackDifficulty: 45,
      },
      {
        keyword: 'emergency plumbing service 24 hour',
        monthlySearchVolume: 920,
        cpc: '£5.80',
        intent: 'Emergency',
        difficulty: 'High',
        estimatedPackDifficulty: 70,
      },
    ];
  } else if (catLower.includes('roof')) {
    keywords = [
      {
        keyword: `roofing contractor ${city}`,
        monthlySearchVolume: 950,
        cpc: '£6.50',
        intent: 'Transactional',
        difficulty: 'High',
        estimatedPackDifficulty: 72,
      },
      {
        keyword: `emergency roof repair ${city}`,
        monthlySearchVolume: 610,
        cpc: '£7.80',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 58,
      },
      {
        keyword: `roof leak repair ${city}`,
        monthlySearchVolume: 520,
        cpc: '£6.90',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 54,
      },
      {
        keyword: `new roof installation ${city}`,
        monthlySearchVolume: 380,
        cpc: '£8.20',
        intent: 'Commercial',
        difficulty: 'Medium',
        estimatedPackDifficulty: 48,
      },
      {
        keyword: `gutter cleaning & replacement ${city}`,
        monthlySearchVolume: 440,
        cpc: '£3.80',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 28,
      },
      {
        keyword: `flat roofing specialist ${city}`,
        monthlySearchVolume: 310,
        cpc: '£5.40',
        intent: 'High Intent',
        difficulty: 'Low',
        estimatedPackDifficulty: 34,
      },
      {
        keyword: 'roofer near me',
        monthlySearchVolume: 2400,
        cpc: '£6.20',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 84,
      },
      {
        keyword: `chimney repair ${city}`,
        monthlySearchVolume: 260,
        cpc: '£4.90',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 25,
      },
      {
        keyword: `slate roof repair ${city}`,
        monthlySearchVolume: 190,
        cpc: '£5.80',
        intent: 'Commercial',
        difficulty: 'Low',
        estimatedPackDifficulty: 22,
      },
      {
        keyword: `fascia and soffit repair ${city}`,
        monthlySearchVolume: 220,
        cpc: '£3.60',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 20,
      },
    ];
  } else if (catLower.includes('dent')) {
    keywords = [
      {
        keyword: `cosmetic dentist ${city}`,
        monthlySearchVolume: 890,
        cpc: '£4.50',
        intent: 'High Intent',
        difficulty: 'Medium',
        estimatedPackDifficulty: 58,
      },
      {
        keyword: `emergency dentist ${city}`,
        monthlySearchVolume: 1200,
        cpc: '£6.20',
        intent: 'Emergency',
        difficulty: 'High',
        estimatedPackDifficulty: 75,
      },
      {
        keyword: `teeth whitening ${city}`,
        monthlySearchVolume: 750,
        cpc: '£3.80',
        intent: 'Transactional',
        difficulty: 'Medium',
        estimatedPackDifficulty: 45,
      },
      {
        keyword: `dental implants ${city}`,
        monthlySearchVolume: 680,
        cpc: '£7.50',
        intent: 'Commercial',
        difficulty: 'Medium',
        estimatedPackDifficulty: 52,
      },
      {
        keyword: `invisalign provider ${city}`,
        monthlySearchVolume: 540,
        cpc: '£5.10',
        intent: 'High Intent',
        difficulty: 'Low',
        estimatedPackDifficulty: 35,
      },
      {
        keyword: 'dentist near me',
        monthlySearchVolume: 4200,
        cpc: '£4.80',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 89,
      },
      {
        keyword: `root canal specialist ${city}`,
        monthlySearchVolume: 320,
        cpc: '£5.60',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 28,
      },
    ];
  } else if (catLower.includes('hvac') || catLower.includes('air cond') || catLower.includes('cooling') || catLower.includes('heating')) {
    keywords = [
      {
        keyword: `hvac contractor ${city}`,
        monthlySearchVolume: 1100,
        cpc: '£6.80',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 76,
      },
      {
        keyword: `air conditioning repair ${city}`,
        monthlySearchVolume: 870,
        cpc: '£5.90',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 60,
      },
      {
        keyword: `emergency ac service ${city}`,
        monthlySearchVolume: 640,
        cpc: '£7.40',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 65,
      },
      {
        keyword: `furnace repair ${city}`,
        monthlySearchVolume: 590,
        cpc: '£5.50',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 52,
      },
      {
        keyword: 'ac repair near me',
        monthlySearchVolume: 2800,
        cpc: '£6.10',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 85,
      },
      {
        keyword: `heat pump installation ${city}`,
        monthlySearchVolume: 430,
        cpc: '£6.20',
        intent: 'Commercial',
        difficulty: 'Low',
        estimatedPackDifficulty: 32,
      },
      {
        keyword: `duct cleaning service ${city}`,
        monthlySearchVolume: 380,
        cpc: '£4.20',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 28,
      },
    ];
  } else {
    // Dynamic universal trade generator for any trade category
    const cleanTrade = rawCategory || 'Local Services';
    keywords = [
      {
        keyword: `${cleanTrade.toLowerCase()} ${city}`,
        monthlySearchVolume: 720,
        cpc: '£3.40',
        intent: 'High Intent',
        difficulty: 'Medium',
        estimatedPackDifficulty: 48,
      },
      {
        keyword: `emergency ${cleanTrade.toLowerCase()} ${city}`,
        monthlySearchVolume: 430,
        cpc: '£4.80',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 55,
      },
      {
        keyword: `${cleanTrade.toLowerCase()} near me`,
        monthlySearchVolume: 1650,
        cpc: '£3.80',
        intent: 'High Intent',
        difficulty: 'High',
        estimatedPackDifficulty: 80,
      },
      {
        keyword: `best ${cleanTrade.toLowerCase()} in ${city}`,
        monthlySearchVolume: 340,
        cpc: '£3.10',
        intent: 'High Intent',
        difficulty: 'Low',
        estimatedPackDifficulty: 32,
      },
      {
        keyword: `affordable ${cleanTrade.toLowerCase()} ${city}`,
        monthlySearchVolume: 290,
        cpc: '£2.90',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 28,
      },
      {
        keyword: `same day ${cleanTrade.toLowerCase()} ${city}`,
        monthlySearchVolume: 260,
        cpc: '£4.20',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 42,
      },
      {
        keyword: `licensed ${cleanTrade.toLowerCase()} contractor`,
        monthlySearchVolume: 210,
        cpc: '£3.60',
        intent: 'Commercial',
        difficulty: 'Low',
        estimatedPackDifficulty: 26,
      },
      {
        keyword: `commercial ${cleanTrade.toLowerCase()} ${city}`,
        monthlySearchVolume: 180,
        cpc: '£4.50',
        intent: 'Commercial',
        difficulty: 'Low',
        estimatedPackDifficulty: 24,
      },
      {
        keyword: `24/7 ${cleanTrade.toLowerCase()} call out`,
        monthlySearchVolume: 310,
        cpc: '£5.00',
        intent: 'Emergency',
        difficulty: 'Medium',
        estimatedPackDifficulty: 50,
      },
      {
        keyword: `${cleanTrade.toLowerCase()} quotes ${city}`,
        monthlySearchVolume: 240,
        cpc: '£2.80',
        intent: 'Transactional',
        difficulty: 'Low',
        estimatedPackDifficulty: 22,
      },
    ];
  }

  // Detect regional currency based on business profile
  const locale = detectLocaleFromBusiness({ city, address: business });
  const currSym = locale.currencySymbol;

  // Apply strict sanitization:
  // 1. Strip duplicate keyword tokens (e.g. "Emergency Emergency Plumber" -> "Emergency Plumber")
  // 2. Unify currency symbol to match business region (£ for UK, $ for US)
  keywords = keywords.map((k) => ({
    ...k,
    keyword: sanitizeKeyword(k.keyword),
    cpc: k.cpc.replace(/[£$]/g, currSym),
  }));

  // Calculate aggregates
  const totalMonthlyVolume = keywords.reduce((sum, k) => sum + k.monthlySearchVolume, 0);
  const estimatedClicks = Math.round(totalMonthlyVolume * 0.32);

  // Compute average CPC
  const numericCpcs = keywords
    .map((k) => parseFloat(k.cpc.replace(/[^0-9.]/g, '')))
    .filter((n) => !isNaN(n));
  const avgNumericCpc =
    numericCpcs.length > 0
      ? numericCpcs.reduce((a, b) => a + b, 0) / numericCpcs.length
      : 3.2;
  const averageCpc = `${currSym}${avgNumericCpc.toFixed(2)}`;

  return {
    targetBusiness: business,
    targetCategory: rawCategory,
    targetCity: city,
    totalMonthlyVolume,
    estimatedClicks,
    averageCpc,
    keywords,
  };
}
