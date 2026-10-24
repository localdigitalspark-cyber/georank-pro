/**
 * Local SEO AI Audit & Prospecting Pitch Generator
 * 
 * Powered by Gemini 3.8 Flash with structured JSON schema output and Zod validation.
 * Converts Geo-Grid ranking signals and competitive deficits into an agency-grade
 * client audit and high-converting cold outreach pitch.
 */

import { Type, type Schema } from '@google/genai';
import { z } from 'zod';

export interface CompetitorProfile {
  name: string;
  rating?: number;
  reviews?: number;
  category?: string;
  address?: string;
  marketSharePercentage?: number;
}

export interface GridMetricSummary {
  /** Average rank position across all grid points (e.g. 11.4) */
  averageRank: number;
  /** Percentage of grid nodes in Google 3-Pack (e.g. 16.0%) */
  top3Percentage: number;
  /** Percentage of grid nodes in top 10 (e.g. 44.0%) */
  top10Percentage?: number;
  /** Total scanned coordinate nodes (e.g. 25 for a 5x5 grid) */
  totalNodesScanned: number;
  /** Scanned radius or grid span description (e.g. "5x5 grid across 5.0 km radius") */
  gridSpanDescription?: string;
  /** Target location or market name (e.g. "Austin, TX") */
  targetMarket?: string;
}

export interface LocalSeoAuditPitchInput {
  businessName: string;
  category: string;
  metrics: GridMetricSummary;
  topCompetitorsInWeakZones: CompetitorProfile[];
}

/**
 * Zod Schema for Local SEO Audit & Pitch Output
 */
export const LocalSeoAuditPitchSchema = z.object({
  executiveSummary: z.string().describe(
    "High-impact summary of their visibility loss across the local geo-grid and proximity-dropoff analysis"
  ),
  missedRevenueEstimate: z.string().describe(
    "Quantified economic breakdown explaining why being pushed out of the Google 3-Pack costs 70%+ of incoming phone calls and high-intent local customer volume"
  ),
  actionPlan: z.object({
    gbpCategories: z.string().describe(
      "Primary & secondary Google Business Profile (GBP) category optimization and service catalogue adjustments"
    ),
    citations: z.string().describe(
      "NAP (Name-Address-Phone) consistency cleanup, hyper-local structured data, and local directory citation velocity"
    ),
    reviews: z.string().describe(
      "Geo-targeted review acquisition velocity, customer keyword integration, and review response signals"
    ),
    onPageLocalizedContent: z.string().describe(
      "Localized landing pages, city/neighborhood service area content, and LocalBusiness schema markup"
    ),
  }),
  coldOutreachPitch: z.object({
    subjectLine: z.string().describe(
      "Punchy, non-spammy cold email subject line citing their business name and local market"
    ),
    emailBody: z.string().describe(
      "Personalized, conversational cold outreach hook that cites their exact grid rank stats and mentions the specific competitors eating their local market share"
    ),
    smsOrVoicemailScript: z.string().describe(
      "A quick 30-second follow-up voice note or SMS script for multi-touch prospecting"
    ),
  }),
});

export type LocalSeoAuditPitchOutput = z.infer<typeof LocalSeoAuditPitchSchema>;

/**
 * Native Gemini @google/genai responseSchema definition
 */
export const geminiAuditPitchResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: "High-impact summary of visibility loss across the geo-grid.",
    },
    missedRevenueEstimate: {
      type: Type.STRING,
      description: "Explanation of economic loss and missed calls from ranking outside Google's Top 3.",
    },
    actionPlan: {
      type: Type.OBJECT,
      properties: {
        gbpCategories: {
          type: Type.STRING,
          description: "Actionable fixes for Google Business Profile categories.",
        },
        citations: {
          type: Type.STRING,
          description: "Tactical fixes for NAP consistency and local citations.",
        },
        reviews: {
          type: Type.STRING,
          description: "Tactical fixes for geo-targeted reviews and velocity.",
        },
        onPageLocalizedContent: {
          type: Type.STRING,
          description: "Tactical fixes for local landing pages and on-page geo-signals.",
        },
      },
      required: ["gbpCategories", "citations", "reviews", "onPageLocalizedContent"],
    },
    coldOutreachPitch: {
      type: Type.OBJECT,
      properties: {
        subjectLine: {
          type: Type.STRING,
          description: "Engaging cold email subject line.",
        },
        emailBody: {
          type: Type.STRING,
          description: "Personalized cold outreach email with exact grid stats and competitor comparisons.",
        },
        smsOrVoicemailScript: {
          type: Type.STRING,
          description: "Short 30-second direct follow-up pitch.",
        },
      },
      required: ["subjectLine", "emailBody", "smsOrVoicemailScript"],
    },
  },
  required: [
    "executiveSummary",
    "missedRevenueEstimate",
    "actionPlan",
    "coldOutreachPitch",
  ],
};

/**
 * Builds the structured prompt for Gemini
 */
export function buildLocalSeoAuditPrompt(input: LocalSeoAuditPitchInput): string {
  const compList = input.topCompetitorsInWeakZones
    .map(
      (c, i) =>
        `   ${i + 1}. "${c.name}" - ${c.category || 'Competitor'} (${c.reviews ?? 'N/A'} reviews, ${c.rating ?? 'N/A'}★)`
    )
    .join('\n');

  return `
You are a Principal Local SEO Specialist and Agency Prospecting Strategist analyzing an automated Geo-Grid local rank scan (similar to Local Falcon and ProfitMaps AI).

TARGET BUSINESS PROFILE:
- Business Name: "${input.businessName}"
- Industry / Category: "${input.category}"
- Target Location / Market: "${input.metrics.targetMarket || 'Metro Area'}"

GEO-GRID RANK TRACKING METRICS:
- Total Scanned Grid Pins: ${input.metrics.totalNodesScanned} coordinates
- Grid Radius / Coverage: ${input.metrics.gridSpanDescription || 'Local Service Radius'}
- Average Rank Position: ${input.metrics.averageRank.toFixed(1)} across the service area
- Google 3-Pack Presence: ${input.metrics.top3Percentage.toFixed(1)}% of nodes in Top 3
- Dropoff / Red Zone Coverage: ${(100 - input.metrics.top3Percentage).toFixed(1)}% of scanned territory is ranking at #4 or worse

DOMINANT COMPETITORS CAPTURING WEAK/RED ZONES:
${compList || '   No competitor list provided (use typical market leaders for this category)'}

INSTRUCTIONS:
1. Conduct an incisive, data-backed Local SEO Geo-Grid Audit focusing on proximity bias, centroid drift, and pack displacement.
2. Formulate a realistic, quantified missed revenue estimate: according to local consumer search studies, Google's 3-Pack monopolizes ~70% of clicks and calls. When a business drops past position 3 (into yellow and red grid zones), inbound calls decrease exponentially.
3. Provide 4 crisp, non-fluff tactical action steps addressing GBP categories, NAP citations, review velocity/geo-keywords, and localized service-area landing pages.
4. Craft an authentic, consultative cold email outreach pitch that an SEO agency or growth partner can send to the owner of "${input.businessName}". It MUST weave in the exact grid metrics (e.g. ${input.metrics.averageRank.toFixed(1)} avg rank, ${input.metrics.top3Percentage.toFixed(1)}% top 3 visibility) and cite specific competitor names (${input.topCompetitorsInWeakZones[0]?.name || 'the local market leaders'}) to make it impossible to ignore. Keep it conversational, helpful, and non-generic.

Respond strictly in valid JSON matching the requested schema.
`.trim();
}

/**
 * Deterministic Fallback & Sample Generator
 * Used when testing offline or for instant sample responses.
 */
export function generateDeterministicAuditPitch(
  input: LocalSeoAuditPitchInput
): LocalSeoAuditPitchOutput {
  const topComp = input.topCompetitorsInWeakZones[0]?.name || "Apex Emergency Plumbing";
  const secondComp = input.topCompetitorsInWeakZones[1]?.name || "Capital City Drains";
  const weakPercent = (100 - input.metrics.top3Percentage).toFixed(0);

  return {
    executiveSummary: `Our ${input.metrics.totalNodesScanned}-point geo-grid rank audit for ${input.businessName} indicates severe geographic signal decay outside your immediate 0.5-mile centroid. While your business maintains visibility directly on your street, ${weakPercent}% of the scanned service area places you at position #${Math.round(input.metrics.averageRank)} or worse. High-margin searchers just 1.5 miles away are routed almost exclusively to ${topComp} and ${secondComp}.`,
    
    missedRevenueEstimate: `In local search, positions 1 through 3 in the Google Local Pack capture between 68% and 74% of all high-intent phone calls and direction requests. With only ${input.metrics.top3Percentage.toFixed(1)}% of your service grid ranking in the 3-Pack, you are forfeiting approximately 45 to 60 inbound quote opportunities per month in your category (${input.category}), representing an estimated $18,000 - $32,000 in monthly gross billings diverted straight to nearby competitors.`,
    
    actionPlan: {
      gbpCategories: `Audit primary and secondary GBP categories: Ensure your primary category precisely matches "${input.category}" and add 3 to 5 targeted sub-categories (e.g., Emergency Services, Repair Specialists) rather than generic business labels.`,
      citations: `Fix name, address, and phone (NAP) discrepancies across top tier aggregators (Data Axle, Localeze, Foursquare) and sync high-relevance niche and hyper-local Austin business registries to strengthen geographic entity validation.`,
      reviews: `Establish an automated SMS review generation flow asking recent customers to mention specific suburbs, neighborhoods, and service keywords (e.g., 'fast water heater replacement in South Congress') to inject natural geo-relevance into your profile.`,
      onPageLocalizedContent: `Deploy dedicated suburb landing pages on your website featuring embedded Google Maps, local geo-coordinates, client case studies, and schema.org/LocalBusiness structured markup linked back to your GBP CID.`
    },
    
    coldOutreachPitch: {
      subjectLine: `Quick question regarding ${input.businessName}'s Google Maps reach in ${input.metrics.targetMarket || 'your area'}`,
      emailBody: `Hi team at ${input.businessName},\n\nI was running a geo-grid visibility audit for ${input.category.toLowerCase()} providers in ${input.metrics.targetMarket || 'the metro area'} and pulled up your live Google Maps rank radius.\n\nRight outside your immediate office, your ranking drops from the top 3 down to an average of #${input.metrics.averageRank.toFixed(1)} across ${weakPercent}% of your nearby service territory. \n\nEssentially, homeowners searching for ${input.category.toLowerCase()} just 1.5 miles out are being routed to ${topComp} and ${secondComp} simply because your proximity signals are constrained to your primary address.\n\nI compiled a visual 25-pin geo-map showing exactly where you are losing calls and the 4 fixes to reclaim the 3-pack across the full radius.\n\nWould it be okay if I forwarded the screenshot over? No obligation either way.\n\nBest regards,\nLocal Growth Engineering Team`,
      smsOrVoicemailScript: `Hey ${input.businessName}, this is Alex. I just ran a 25-pin geo-grid scan on Google Maps for ${input.category} in our area. You're crushing it within 2 blocks, but beyond 1 mile ${topComp} is taking 70% of the phone calls. I have a 1-page visual map showing the breakdown—mind if I text or email it over?`
    }
  };
}

/**
 * Sample JSON output matching schema for documentation and testing
 */
export const SAMPLE_AUDIT_PITCH_JSON: LocalSeoAuditPitchOutput = {
  executiveSummary: "Geo-grid spatial analysis reveals significant centroid lock-in for Austin Premier Plumbing: rank drops from position #2 within 0.8 km to position #14 beyond 2.0 km. Across 25 scanned grid nodes, 84% fall into the red/yellow zone, allowing Apex Emergency Plumbing and Capital City Water Heaters to capture the majority of high-intent emergency plumbing searches.",
  missedRevenueEstimate: "Google Maps Local Pack (Top 3) commands 72% of mobile call clicks for emergency plumbing queries. With an overall average rank of 11.4 and only 16.0% 3-Pack presence, the business loses an estimated 55 to 70 direct calls monthly, translating to an estimated $22,000 - $35,000 in monthly missed dispatch revenue.",
  actionPlan: {
    gbpCategories: "Refine Google Business Profile categories by setting 'Plumber' as primary and adding 'Drainage Service', 'Water Heater Repair Service', and 'Emergency Plumbing Service' as secondary classifications.",
    citations: "Standardize NAP across core data aggregators and build 15 hyper-local Austin business citations (Austin Chamber, local neighborhood directories) to reinforce centroid expansion.",
    reviews: "Launch an automated post-job review request system encouraging verified customers to mention specific Austin zip codes and emergency services in review text.",
    onPageLocalizedContent: "Publish dedicated neighborhood landing pages (e.g. South Congress, Barton Hills, Mueller) with LocalBusiness GeoCoordinates JSON-LD schemas connected directly to the GBP CID."
  },
  coldOutreachPitch: {
    subjectLine: "Austin Premier Plumbing: Google Maps 25-pin grid audit",
    emailBody: "Hi team,\n\nI generated a 25-pin local geo-grid scan for emergency plumbing searches in Austin, and noticed something interesting about Austin Premier Plumbing's Google Maps reach.\n\nWhile you rank in the top 3 right next to your dispatch shop, your visibility drops to an average of #11.4 just two miles away—meaning Apex Emergency Plumbing and Capital City Water Heaters are getting 84% of the incoming calls in your surrounding service territory.\n\nI have the complete color-coded geo-grid map ready. Can I send the PDF over so you can see where your calls are dropping off?\n\nBest,\nMarcus Vance",
    smsOrVoicemailScript: "Hey team at Austin Premier Plumbing, Marcus here. Ran a quick 25-pin Google Maps radar audit across Austin—you guys drop off after 1.5 miles while Apex Plumbing dominates the rest. Want me to send over the map screenshot?"
  }
};
