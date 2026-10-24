/**
 * GeoRank Pro - Agent Operations Library
 * Path: /src/lib/agent/operations.ts
 *
 * Core agentic operations shared by the MCP Server and REST Operations API.
 * Provides programmatic execution for resolving businesses, running geo-grid scans,
 * generating prospecting audits, persisting shareable reports, generating localized
 * landing pages, and pushing leads to webhooks.
 */

import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { resolveBusiness, ResolvedBusiness } from '../places/places-resolver.ts';
import { generateGeoGrid, DistanceUnit } from '../geo/grid-generator.ts';
import { scanGridNode, summarizeGridScan, GridScanSummary, SerpScanMode } from '../serp/adapter.ts';
import {
  LocalSeoAuditInput,
  LocalSeoAuditOutput,
  LocalSeoAuditOutputSchema,
  geminiAuditResponseSchema,
  generateDeterministicAudit,
  buildAuditPrompt,
} from '../ai/audit-generator.ts';
import { saveScan } from '../storage/scan-store.ts';
import {
  generatePageHtml,
  BusinessProfile,
  PageItem,
} from '../builder/site-generator.ts';

// ==========================================
// 1. Zod Schemas for Tool Validation
// ==========================================

export const ResolveBusinessSchema = z.object({
  query: z.string().describe('Business name or query string (e.g. "Austin Premier Plumbing")'),
  targetTownOrPostcode: z
    .string()
    .optional()
    .describe('Target town, city, or postcode (e.g. "Austin, TX" or "GU34 1AB")'),
});

export const RunGeogridScanSchema = z.object({
  businessName: z.string().describe('Target business name'),
  keyword: z.string().describe('Target search keyword (e.g. "Emergency Plumber")'),
  lat: z.number().describe('Centroid latitude'),
  lng: z.number().describe('Centroid longitude'),
  gridSize: z
    .union([z.literal(3), z.literal(5), z.literal(7)])
    .optional()
    .default(5)
    .describe('Dimension of grid: 3 (3x3), 5 (5x5), or 7 (7x7)'),
  distanceStep: z
    .number()
    .optional()
    .default(1.0)
    .describe('Step distance between nodes (e.g. 1.0)'),
  unit: z.enum(['km', 'mi']).optional().default('km').describe('Distance unit ("km" or "mi")'),
  mode: z.enum(['mock', 'live']).optional().default('mock').describe('SERP scan mode ("mock" or "live")'),
});

export const GenerateProspectingAuditSchema = z.object({
  scanId: z.string().optional().describe('Optional scan identifier to link with previous scan'),
  businessName: z.string().describe('Target business name'),
  category: z.string().describe('Business category or primary service niche'),
  averageRank: z.number().describe('Calculated average rank across grid nodes'),
  top3Percentage: z.number().describe('Share of nodes in top 3 Google pack (0-100)'),
  dominantCompetitors: z
    .array(
      z.object({
        name: z.string(),
        rating: z.number().optional(),
        reviews: z.number().optional(),
        top3SharePercent: z.number().optional(),
      })
    )
    .describe('Top ranking competitors eating local market share'),
});

export const CreateShareableReportSchema = z.object({
  businessName: z.string().describe('Business name'),
  keyword: z.string().describe('Target keyword'),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }).describe('Center coordinates'),
  gridSize: z.number().describe('Grid dimension (e.g. 3, 5, 7)'),
  step: z.number().describe('Distance step between grid pins'),
  unit: z.enum(['km', 'mi']).describe('Distance unit ("km" or "mi")'),
  scanSummary: z.any().describe('Full scan summary object with node metrics'),
  audit: z.any().describe('Prospecting audit and outreach pitch object'),
});

export const BuildLocalizedLandingPagesSchema = z.object({
  businessName: z.string().describe('Business name'),
  category: z.string().describe('Primary service category (e.g. "Emergency Plumber")'),
  primaryCity: z.string().describe('Primary hub city (e.g. "Austin, TX" or "Southampton")'),
  nearbyTowns: z
    .array(z.string())
    .describe('Array of surrounding towns or suburbs to generate localized landing pages for'),
  phone: z.string().optional().describe('Direct contact telephone number for page CTA'),
});

export const PushLeadToWebhookSchema = z.object({
  webhookUrl: z.string().url().describe('Target CRM, Zapier, or Make.com webhook URL'),
  businessName: z.string().describe('Prospect business name'),
  phone: z.string().optional().describe('Prospect phone number'),
  email: z.string().optional().describe('Prospect contact email'),
  auditUrl: z.string().describe('Public shareable report URL for the audit'),
  missedMonthlyRevenue: z
    .string()
    .describe('Calculated or estimated monthly missed revenue callout'),
});

// Infer types
export type ResolveBusinessInput = z.infer<typeof ResolveBusinessSchema>;
export type RunGeogridScanInput = z.infer<typeof RunGeogridScanSchema>;
export type GenerateProspectingAuditInput = z.infer<typeof GenerateProspectingAuditSchema>;
export type CreateShareableReportInput = z.infer<typeof CreateShareableReportSchema>;
export type BuildLocalizedLandingPagesInput = z.infer<typeof BuildLocalizedLandingPagesSchema>;
export type PushLeadToWebhookInput = z.infer<typeof PushLeadToWebhookSchema>;

// Gemini Client initialization helper
function getGenAIClient(): GoogleGenAI | null {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return null;
  return new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory cache for recent scans so tools can chain easily
export const agentScansCache = new Map<string, GridScanSummary>();

// ==========================================
// 2. Core Operational Implementations
// ==========================================

/**
 * 1. resolve_business
 */
export async function resolveBusinessOp(
  input: ResolveBusinessInput
): Promise<ResolvedBusiness> {
  const validated = ResolveBusinessSchema.parse(input);
  return await resolveBusiness({
    query: validated.query,
    targetTownOrPostcode: validated.targetTownOrPostcode,
  });
}

/**
 * 2. run_geogrid_scan
 */
export async function runGeogridScanOp(input: RunGeogridScanInput) {
  const validated = RunGeogridScanSchema.parse(input);
  const { businessName, keyword, lat, lng, gridSize, distanceStep, unit, mode } = validated;

  const center = { lat, lng };

  // 1. Generate equidistant geodesic grid
  const grid = generateGeoGrid({
    center,
    gridSize,
    distanceStep,
    unit: unit as DistanceUnit,
  });

  const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const target = {
    businessName,
  };

  // 2. Scan each node
  const nodePromises = grid.points.map((point) =>
    scanGridNode(
      {
        mode: mode as SerpScanMode,
        target,
        keyword,
        dataForSeoLogin: process.env.DATAFORSEO_LOGIN,
        dataForSeoPassword: process.env.DATAFORSEO_PASSWORD,
      },
      point
    )
  );

  const nodeResults = await Promise.all(nodePromises);

  // 3. Summarize scan
  const summary = summarizeGridScan(
    scanId,
    target,
    keyword,
    mode as SerpScanMode,
    gridSize,
    distanceStep,
    unit,
    center,
    nodeResults
  );

  // Cache summary for subsequent audit or report calls
  agentScansCache.set(scanId, summary);

  // Calculate Red Zone percentage: rank > 10 or unranked (rank is null/undefined)
  const redZoneCount = nodeResults.filter((n) => !n.rank || n.rank > 10).length;
  const redZonePercentage = Number(((redZoneCount / (nodeResults.length || 1)) * 100).toFixed(1));

  return {
    scanId,
    averageRank: summary.averageRank,
    top3SharePercentage: summary.top3Percentage,
    redZonePercentage,
    totalNodes: summary.totalNodes,
    dominantCompetitors: summary.dominantCompetitors,
    // Include full summary reference for chained consumers
    _summary: summary,
  };
}

/**
 * 3. generate_prospecting_audit
 */
export async function generateProspectingAuditOp(input: GenerateProspectingAuditInput) {
  const validated = GenerateProspectingAuditSchema.parse(input);

  const metrics = {
    averageRank: validated.averageRank,
    top3Percentage: validated.top3Percentage,
    totalNodesScanned: 25,
    gridSpanDescription: `Grid audit for ${validated.businessName}`,
    targetMarket: 'Local Metro Area',
  };

  const sanitizedInput: LocalSeoAuditInput = {
    businessName: validated.businessName,
    category: validated.category,
    metrics,
    topCompetitorsInWeakZones: validated.dominantCompetitors || [],
  };

  let auditOutput: LocalSeoAuditOutput | null = null;
  const aiClient = getGenAIClient();

  if (aiClient) {
    try {
      const prompt = buildAuditPrompt(sanitizedInput);
      const geminiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a high-level Local SEO Auditor and Prospecting Strategist. Analyze local geo-grid rank metrics and output precise, data-grounded audit reports and cold outreach pitches strictly conforming to the requested JSON schema.',
          responseMimeType: 'application/json',
          responseSchema: geminiAuditResponseSchema,
        },
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout (3500ms limit)')), 3500)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);
      const textOutput = response?.text?.trim();

      if (textOutput) {
        const parsed = JSON.parse(textOutput);
        const parsedResult = LocalSeoAuditOutputSchema.safeParse(parsed);
        if (parsedResult.success) {
          auditOutput = parsedResult.data;
        }
      }
    } catch (err: any) {
      console.warn('Agent operations: Gemini audit call fallback triggered:', err?.message || err);
    }
  }

  // Fallback if Gemini unavailable or timed out
  if (!auditOutput) {
    auditOutput = generateDeterministicAudit(sanitizedInput);
  }

  return {
    executiveSummary: auditOutput.executiveSummary,
    missedRevenueEstimate: auditOutput.missedRevenueEstimate,
    actionPlan: auditOutput.actionPlan,
    coldOutreachPitch: {
      subjectLine: auditOutput.coldOutreachPitch.subjectLine,
      emailBody: auditOutput.coldOutreachPitch.emailBody,
      smsScript:
        (auditOutput.coldOutreachPitch as any).smsScript ||
        (auditOutput.coldOutreachPitch as any).smsOrVoicemailScript ||
        `Hi ${validated.businessName}, this is our local SEO team. We generated a 25-point geo-grid showing where you lose customers to ${validated.dominantCompetitors?.[0]?.name || 'competitors'}. Can I share the interactive map with you?`,
    },
  };
}

/**
 * 4. create_shareable_report
 */
export function createShareableReportOp(input: CreateShareableReportInput) {
  const validated = CreateShareableReportSchema.parse(input);

  const port = process.env.PORT || '3000';
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

  const scanId = saveScan({
    businessName: validated.businessName,
    keyword: validated.keyword,
    center: validated.center,
    gridSize: validated.gridSize,
    distanceStep: validated.step,
    unit: validated.unit,
    scanSummary: validated.scanSummary,
    audit: validated.audit,
  });

  return {
    scanId,
    shareUrl: `${baseUrl}/reports/${scanId}`,
  };
}

/**
 * 5. build_localized_landing_pages
 */
export function buildLocalizedLandingPagesOp(input: BuildLocalizedLandingPagesInput) {
  const validated = BuildLocalizedLandingPagesSchema.parse(input);
  const { businessName, category, primaryCity, nearbyTowns, phone } = validated;

  const business: BusinessProfile = {
    name: businessName,
    category,
    city: primaryCity,
    phone: phone || '(512) 555-0199',
  };

  // Build list of PageItems for primary city and each nearby town
  const allTowns = [primaryCity, ...nearbyTowns.filter((t) => t.toLowerCase() !== primaryCity.toLowerCase())];

  const pageItems: PageItem[] = allTowns.map((town, idx) => {
    const isHome = idx === 0;
    const cleanTown = town.split(',')[0].trim();
    const townSlug = cleanTown.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const slug = isHome ? '/' : `/${townSlug}-${catSlug}`;
    const name = isHome ? `${cleanTown} ${category} Hub` : `${category} in ${cleanTown}`;

    return {
      id: `page_${townSlug}_${idx}`,
      name,
      slug,
      type: isHome ? 'Home' : 'Localized Landing',
      keywords: [
        `${category} in ${cleanTown}`,
        `Best ${category} ${cleanTown}`,
        `Emergency ${category} ${cleanTown}`,
        `Licensed ${category} near ${cleanTown}`,
      ],
      rankingIntent: 'Local High-Intent Commercial',
      status: 'Ready to Publish',
      heroHeadline: `${cleanTown}'s Top-Rated ${category}`,
      heroSubheadline: `24/7 licensed emergency dispatch and upfront transparent pricing across ${cleanTown} and surrounding areas.`,
    };
  });

  // Generate responsive HTML with schema.org JSON-LD and FAQ accordion for each
  const pagesGenerated = pageItems.map((page) => ({
    slug: page.slug,
    title: page.name,
    htmlContent: generatePageHtml(business, page, pageItems),
  }));

  return {
    pagesGenerated,
  };
}

/**
 * 6. push_lead_to_webhook
 */
export async function pushLeadToWebhookOp(input: PushLeadToWebhookInput) {
  const validated = PushLeadToWebhookSchema.parse(input);

  const payload = {
    source: 'georank-pro-agent',
    businessName: validated.businessName,
    phone: validated.phone || null,
    email: validated.email || null,
    auditUrl: validated.auditUrl,
    missedMonthlyRevenue: validated.missedMonthlyRevenue,
    timestamp: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(validated.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GeoRankPro-LeadDispatcher/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      error: err instanceof Error ? err.message : 'Failed to dispatch webhook',
    };
  }
}
