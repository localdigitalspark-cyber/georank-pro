/**
 * GeoRank Pro - Model Context Protocol (MCP) Server
 * Path: /src/mcp/server.ts
 *
 * Implements the official Model Context Protocol (MCP) SDK server named "georank-pro-agent".
 * Exposes 6 operational tools via Zod schemas and supports both:
 * 1) Stdio transport for local desktop agents (Claude Desktop, Cursor, Gemini CLI)
 * 2) SSE / HTTP transport mounted inside Express (/sse and /messages) for remote agents.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import {
  resolveBusinessOp,
  runGeogridScanOp,
  generateProspectingAuditOp,
  createShareableReportOp,
  buildLocalizedLandingPagesOp,
  pushLeadToWebhookOp,
} from '../lib/agent/operations.ts';

/**
 * Creates and configures a new McpServer instance with all 6 GeoRank Pro tools registered.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'georank-pro-agent',
    version: '1.0.0',
  });

  // 1. resolve_business
  server.tool(
    'resolve_business',
    'Resolves query & town/postcode to business name, exact lat/lng coordinates, address, inferred keyword, and placeId.',
    {
      query: z.string().describe('Business name or query string (e.g. "Austin Premier Plumbing")'),
      targetTownOrPostcode: z
        .string()
        .optional()
        .describe('Target town, city, or postcode (e.g. "Austin, TX" or "SO14 7DU")'),
    },
    async ({ query, targetTownOrPostcode }) => {
      try {
        const result = await resolveBusinessOp({ query, targetTownOrPostcode });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error resolving business: ${err?.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  // 2. run_geogrid_scan
  server.tool(
    'run_geogrid_scan',
    'Executes equidistant geodesic coordinate generation, calls SERP adapter, runs fuzzy/PlaceID parser, and computes grid KPIs.',
    {
      businessName: z.string().describe('Target business name'),
      keyword: z.string().describe('Target search keyword (e.g. "Emergency Plumber")'),
      lat: z.number().describe('Centroid latitude'),
      lng: z.number().describe('Centroid longitude'),
      gridSize: z
        .union([z.literal(3), z.literal(5), z.literal(7), z.literal(9)])
        .optional()
        .describe('Grid dimension: 3 (3x3), 5 (5x5), 7 (7x7), or 9 (9x9). Default is 5.'),
      distanceStep: z
        .number()
        .optional()
        .describe('Distance step between grid nodes (e.g. 1.0). Default is 1.0.'),
      unit: z
        .enum(['km', 'mi'])
        .optional()
        .describe('Distance unit ("km" or "mi"). Default is "km".'),
      mode: z
        .enum(['mock', 'live'])
        .optional()
        .describe('SERP scan mode ("mock" or "live"). Default is "mock".'),
    },
    async ({ businessName, keyword, lat, lng, gridSize, distanceStep, unit, mode }) => {
      try {
        const result = await runGeogridScanOp({
          businessName,
          keyword,
          lat,
          lng,
          gridSize: gridSize ?? 5,
          distanceStep: distanceStep ?? 1.0,
          unit: unit ?? 'km',
          mode: mode ?? 'mock',
        });

        // Strip internal _summary from plain text display to keep payload clean
        const { _summary, ...kpiResult } = result;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(kpiResult, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing geogrid scan: ${err?.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  // 3. generate_prospecting_audit
  server.tool(
    'generate_prospecting_audit',
    'Dispatches structured schema prompt to Gemini (with deterministic fallback) returning executive summary, missed revenue estimate, 4-pillar action plan, and cold outreach pitch kit.',
    {
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
    },
    async ({ scanId, businessName, category, averageRank, top3Percentage, dominantCompetitors }) => {
      try {
        const result = await generateProspectingAuditOp({
          scanId,
          businessName,
          category,
          averageRank,
          top3Percentage,
          dominantCompetitors,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error generating prospecting audit: ${err?.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  // 4. create_shareable_report
  server.tool(
    'create_shareable_report',
    'Persists scan to .data/scans.json via scan-store.ts and returns scanId and public shareable URL.',
    {
      businessName: z.string().describe('Business name'),
      keyword: z.string().describe('Target keyword'),
      center: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .describe('Center coordinates'),
      gridSize: z.number().describe('Grid dimension (e.g. 3, 5, 7)'),
      step: z.number().describe('Distance step between grid pins'),
      unit: z.enum(['km', 'mi']).describe('Distance unit ("km" or "mi")'),
      scanSummary: z.any().describe('Full scan summary object with node metrics'),
      audit: z.any().describe('Prospecting audit and outreach pitch object'),
    },
    async ({ businessName, keyword, center, gridSize, step, unit, scanSummary, audit }) => {
      try {
        const result = createShareableReportOp({
          businessName,
          keyword,
          center,
          gridSize,
          step,
          unit,
          scanSummary,
          audit,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error creating shareable report: ${err?.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  // 5. build_localized_landing_pages
  server.tool(
    'build_localized_landing_pages',
    'Generates responsive semantic HTML pages with embedded schema.org/LocalBusiness JSON-LD markup and FAQ accordion for primary city and surrounding towns.',
    {
      businessName: z.string().describe('Business name'),
      category: z.string().describe('Primary service category (e.g. "Emergency Plumber")'),
      primaryCity: z.string().describe('Primary hub city (e.g. "Austin, TX")'),
      nearbyTowns: z
        .array(z.string())
        .describe('Array of surrounding towns or suburbs to generate localized landing pages for'),
      phone: z.string().optional().describe('Direct contact telephone number for page CTA'),
    },
    async ({ businessName, category, primaryCity, nearbyTowns, phone }) => {
      try {
        const result = buildLocalizedLandingPagesOp({
          businessName,
          category,
          primaryCity,
          nearbyTowns,
          phone,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error generating localized landing pages: ${err?.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  // 6. push_lead_to_webhook
  server.tool(
    'push_lead_to_webhook',
    'Dispatches a JSON POST payload directly to GoHighLevel, Zapier, or Make.com webhook endpoints.',
    {
      webhookUrl: z.string().url().describe('Target CRM, Zapier, or Make.com webhook URL'),
      businessName: z.string().describe('Prospect business name'),
      phone: z.string().optional().describe('Prospect phone number'),
      email: z.string().optional().describe('Prospect contact email'),
      auditUrl: z.string().describe('Public shareable report URL for the audit'),
      missedMonthlyRevenue: z
        .string()
        .describe('Calculated or estimated monthly missed revenue callout'),
    },
    async ({ webhookUrl, businessName, phone, email, auditUrl, missedMonthlyRevenue }) => {
      try {
        const result = await pushLeadToWebhookOp({
          webhookUrl,
          businessName,
          phone,
          email,
          auditUrl,
          missedMonthlyRevenue,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error dispatching webhook lead: ${err?.message || String(err)}`,
            },
          ],
        };
      }
    }
  );

  return server;
}

// ==========================================
// 3. SSE Transport Session Manager for Express
// ==========================================

export interface SseSession {
  server: McpServer;
  transport: SSEServerTransport;
}

export const activeMcpSessions = new Map<string, SseSession>();

/**
 * Handles incoming SSE connection on GET /sse
 */
export async function handleMcpSseConnection(req: Request, res: Response) {
  try {
    const server = createMcpServer();
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;

    activeMcpSessions.set(sessionId, { server, transport });

    transport.onclose = () => {
      activeMcpSessions.delete(sessionId);
    };

    await server.connect(transport);
  } catch (err: any) {
    console.error('Failed to establish MCP SSE stream:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish MCP SSE stream' });
    }
  }
}

/**
 * Handles incoming POST message from client on POST /messages?sessionId=...
 */
export async function handleMcpPostMessage(req: Request, res: Response) {
  try {
    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId in query parameter or header' });
      return;
    }

    const session = activeMcpSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: `MCP session '${sessionId}' not found or has expired` });
      return;
    }

    await session.transport.handlePostMessage(req, res, req.body);
  } catch (err: any) {
    console.error('Failed handling MCP POST message:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal MCP message handling error' });
    }
  }
}

/**
 * Returns JSON Schema tool catalog for GET /api/v1/agent/tools
 */
export function getAgentToolsCatalog() {
  return [
    {
      name: 'resolve_business',
      description:
        'Resolves business name, exact geographic coordinates (lat, lng), street address, Place ID, and inferred search keyword.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Business name or search query (e.g. "Austin Premier Plumbing")',
          },
          targetTownOrPostcode: {
            type: 'string',
            description: 'Target town, city, or postcode (e.g. "Austin, TX")',
          },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          businessName: { type: 'string' },
          address: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          inferredKeyword: { type: 'string' },
          placeId: { type: 'string' },
        },
      },
    },
    {
      name: 'run_geogrid_scan',
      description:
        'Executes geodesic coordinate generation, calls SERP adapter, runs fuzzy/PlaceID parser, and computes grid KPIs.',
      inputSchema: {
        type: 'object',
        properties: {
          businessName: { type: 'string', description: 'Target business name' },
          keyword: { type: 'string', description: 'Target search keyword' },
          lat: { type: 'number', description: 'Centroid latitude' },
          lng: { type: 'number', description: 'Centroid longitude' },
          gridSize: { type: 'number', enum: [3, 5, 7, 9], default: 5 },
          distanceStep: { type: 'number', default: 1.0 },
          unit: { type: 'string', enum: ['km', 'mi'], default: 'km' },
          mode: { type: 'string', enum: ['mock', 'live'], default: 'mock' },
        },
        required: ['businessName', 'keyword', 'lat', 'lng'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          scanId: { type: 'string' },
          averageRank: { type: 'number' },
          top3SharePercentage: { type: 'number' },
          redZonePercentage: { type: 'number' },
          totalNodes: { type: 'number' },
          dominantCompetitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                avgRank: { type: 'number' },
                top3SharePercent: { type: 'number' },
                rating: { type: 'number' },
                reviews: { type: 'number' },
              },
            },
          },
        },
      },
    },
    {
      name: 'generate_prospecting_audit',
      description:
        'Dispatches structured schema prompt to Gemini (with deterministic fallback) returning executive summary, missed revenue estimate, 4-pillar action plan, and cold outreach pitch kit.',
      inputSchema: {
        type: 'object',
        properties: {
          scanId: { type: 'string' },
          businessName: { type: 'string' },
          category: { type: 'string' },
          averageRank: { type: 'number' },
          top3Percentage: { type: 'number' },
          dominantCompetitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rating: { type: 'number' },
                reviews: { type: 'number' },
              },
            },
          },
        },
        required: ['businessName', 'category', 'averageRank', 'top3Percentage', 'dominantCompetitors'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          executiveSummary: { type: 'string' },
          missedRevenueEstimate: { type: 'string' },
          actionPlan: {
            type: 'object',
            properties: {
              gbpCategories: { type: 'string' },
              citations: { type: 'string' },
              reviews: { type: 'string' },
              onPageLocalizedContent: { type: 'string' },
            },
          },
          coldOutreachPitch: {
            type: 'object',
            properties: {
              subjectLine: { type: 'string' },
              emailBody: { type: 'string' },
              smsScript: { type: 'string' },
            },
          },
        },
      },
    },
    {
      name: 'create_shareable_report',
      description:
        'Persists scan to .data/scans.json via scan-store.ts and returns scanId and public shareable URL.',
      inputSchema: {
        type: 'object',
        properties: {
          businessName: { type: 'string' },
          keyword: { type: 'string' },
          center: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
            required: ['lat', 'lng'],
          },
          gridSize: { type: 'number' },
          step: { type: 'number' },
          unit: { type: 'string', enum: ['km', 'mi'] },
          scanSummary: { type: 'object' },
          audit: { type: 'object' },
        },
        required: ['businessName', 'keyword', 'center', 'gridSize', 'step', 'unit', 'scanSummary', 'audit'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          scanId: { type: 'string' },
          shareUrl: { type: 'string' },
        },
      },
    },
    {
      name: 'build_localized_landing_pages',
      description:
        'Generates responsive semantic HTML pages with embedded schema.org/LocalBusiness JSON-LD markup and FAQ accordion for primary city and surrounding towns.',
      inputSchema: {
        type: 'object',
        properties: {
          businessName: { type: 'string' },
          category: { type: 'string' },
          primaryCity: { type: 'string' },
          nearbyTowns: { type: 'array', items: { type: 'string' } },
          phone: { type: 'string' },
        },
        required: ['businessName', 'category', 'primaryCity', 'nearbyTowns'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          pagesGenerated: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slug: { type: 'string' },
                title: { type: 'string' },
                htmlContent: { type: 'string' },
              },
            },
          },
        },
      },
    },
    {
      name: 'push_lead_to_webhook',
      description:
        'Dispatches a JSON POST payload directly to GoHighLevel or Zapier webhook endpoints.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookUrl: { type: 'string', format: 'uri' },
          businessName: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          auditUrl: { type: 'string' },
          missedMonthlyRevenue: { type: 'string' },
        },
        required: ['webhookUrl', 'businessName', 'auditUrl', 'missedMonthlyRevenue'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
        },
      },
    },
  ];
}
