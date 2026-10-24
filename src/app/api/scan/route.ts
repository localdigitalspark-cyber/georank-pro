/**
 * GeoRank Pro - Scan Orchestrator API Route
 * Path: /src/app/api/scan/route.ts
 * 
 * Multi-node geo-grid scan executor.
 * Supports:
 * - 3x3 (9 pins), 5x5 (25 pins), 7x7 (49 pins)
 * - Customizable distance steps (0.5km - 5km)
 * - Mock mode (realistic proximity decay) or Live mode (DataForSEO)
 */

import { generateGeoGrid } from '../../../lib/geo/grid-generator.ts';
import {
  scanGridNode,
  summarizeGridScan,
  SerpScanMode,
  NodeScanOutput,
} from '../../../lib/serp/adapter.ts';
import { TargetBusinessIdentifier } from '../../../lib/serp/serp-parser.ts';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const center =
      body.center ||
      (body.lat !== undefined && body.lng !== undefined
        ? { lat: Number(body.lat), lng: Number(body.lng) }
        : { lat: 30.2672, lng: -97.7431 });
    const gridSize = Number(body.gridSize) || 5;
    const distanceStep = Number(body.distanceStep || body.spacingKm) || 1.0;
    const unit = body.unit || 'km';
    const keyword = body.keyword || 'Emergency Plumber';
    const mode: SerpScanMode = body.mode === 'live' ? 'live' : 'mock';

    const target: TargetBusinessIdentifier = {
      placeId: body.target?.placeId || body.placeId,
      cid: body.target?.cid || body.cid,
      businessName: body.target?.businessName || body.businessName || 'Austin Premier Plumbing',
      domainOrUrl: body.target?.domainOrUrl || body.domainOrUrl || body.website,
      website: body.target?.website || body.website || body.domainOrUrl,
    };

    // 1. Generate N x N geodesic coordinate grid
    const grid = generateGeoGrid({
      center,
      gridSize,
      distanceStep,
      unit,
    });

    // 2. Scan nodes (concurrent batch processing in chunks of 5)
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nodeResults: NodeScanOutput[] = [];
    const batchSize = 5;

    for (let i = 0; i < grid.points.length; i += batchSize) {
      const chunk = grid.points.slice(i, i + batchSize);
      const chunkResults = await Promise.all(
        chunk.map((point) =>
          scanGridNode(
            {
              mode,
              target,
              keyword,
              dataForSeoLogin: process.env.DATAFORSEO_LOGIN,
              dataForSeoPassword: process.env.DATAFORSEO_PASSWORD,
            },
            point
          )
        )
      );
      nodeResults.push(...chunkResults);
    }

    // 3. Summarize scan with competitor share metrics
    const summary = summarizeGridScan(
      scanId,
      target,
      keyword,
      mode,
      gridSize,
      distanceStep,
      unit,
      center,
      nodeResults
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: summary,
        nodes: summary.nodes,
        competitors: summary.dominantCompetitors,
        summary,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Scan execution error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Scan execution failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
