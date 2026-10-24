/**
 * Automated Verification Test Suite for GeoRank Pro Agent MCP & REST API
 * Path: /scripts/test-agent-mcp-rest.mjs
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_URL = 'http://localhost:3000';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, ok: response.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 GEORANK PRO AGENT: REST & MCP VERIFICATION SUITE');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // TEST 1: Tool Catalog API (GET /api/v1/agent/tools)
  // ----------------------------------------------------
  console.log('[1/8] Verifying Agent Tool Catalog (GET /api/v1/agent/tools)...');
  const catalogRes = await fetchJson('/api/v1/agent/tools');
  assert(catalogRes.ok, `Status is 200 OK (got ${catalogRes.status})`);
  assert(Array.isArray(catalogRes.data.tools), 'tools array is present');
  assert(catalogRes.data.tools.length === 6, `Found exactly 6 tools (got ${catalogRes.data.tools.length})`);

  const toolNames = catalogRes.data.tools.map((t) => t.name);
  console.log('  Registered tools:', toolNames.join(', '));
  assert(toolNames.includes('resolve_business'), 'Has resolve_business');
  assert(toolNames.includes('run_geogrid_scan'), 'Has run_geogrid_scan');
  assert(toolNames.includes('generate_prospecting_audit'), 'Has generate_prospecting_audit');
  assert(toolNames.includes('create_shareable_report'), 'Has create_shareable_report');
  assert(toolNames.includes('build_localized_landing_pages'), 'Has build_localized_landing_pages');
  assert(toolNames.includes('push_lead_to_webhook'), 'Has push_lead_to_webhook');

  // ----------------------------------------------------
  // TEST 2: Business Resolution (POST /api/v1/agent/resolve)
  // ----------------------------------------------------
  console.log('\n[2/8] Testing Business Resolver (POST /api/v1/agent/resolve)...');
  const resolveRes = await fetchJson('/api/v1/agent/resolve', {
    method: 'POST',
    body: {
      query: 'Austin Premier Plumbing',
      targetTownOrPostcode: 'Austin, TX',
    },
  });

  assert(resolveRes.ok, `Resolve status is 200 OK (got ${resolveRes.status})`);
  const resolved = resolveRes.data.data || resolveRes.data;
  assert(Boolean(resolved.businessName), `Resolved businessName: ${resolved.businessName}`);
  assert(typeof resolved.lat === 'number' && typeof resolved.lng === 'number', `Resolved coordinates: (${resolved.lat}, ${resolved.lng})`);
  assert(Boolean(resolved.address), `Resolved address: ${resolved.address}`);
  assert(Boolean(resolved.inferredKeyword), `Resolved inferredKeyword: ${resolved.inferredKeyword}`);
  assert(Boolean(resolved.placeId), `Resolved placeId: ${resolved.placeId}`);

  // ----------------------------------------------------
  // TEST 3: Geogrid Scan (POST /api/v1/agent/scan)
  // ----------------------------------------------------
  console.log('\n[3/8] Testing Geogrid Scan Execution (POST /api/v1/agent/scan)...');
  const scanRes = await fetchJson('/api/v1/agent/scan', {
    method: 'POST',
    body: {
      businessName: resolved.businessName,
      keyword: resolved.inferredKeyword,
      lat: resolved.lat,
      lng: resolved.lng,
      gridSize: 3, // 3x3 = 9 nodes for fast test
      distanceStep: 1.0,
      unit: 'km',
      mode: 'mock',
    },
  });

  assert(scanRes.ok, `Scan status is 200 OK (got ${scanRes.status})`);
  const scanData = scanRes.data.data || scanRes.data;
  assert(Boolean(scanData.scanId), `Generated scanId: ${scanData.scanId}`);
  assert(typeof scanData.averageRank === 'number', `Calculated averageRank: ${scanData.averageRank}`);
  assert(typeof scanData.top3SharePercentage === 'number', `Calculated top3SharePercentage: ${scanData.top3SharePercentage}%`);
  assert(typeof scanData.redZonePercentage === 'number', `Calculated redZonePercentage: ${scanData.redZonePercentage}%`);
  assert(scanData.totalNodes === 9, `Total nodes is 9 (got ${scanData.totalNodes})`);
  assert(Array.isArray(scanData.dominantCompetitors), `Dominant competitors array is present (${scanData.dominantCompetitors.length} found)`);

  // ----------------------------------------------------
  // TEST 4: Prospecting Audit (POST /api/v1/agent/audit)
  // ----------------------------------------------------
  console.log('\n[4/8] Testing Prospecting Audit Generation (POST /api/v1/agent/audit)...');
  const auditRes = await fetchJson('/api/v1/agent/audit', {
    method: 'POST',
    body: {
      scanId: scanData.scanId,
      businessName: resolved.businessName,
      category: 'Emergency Plumbing',
      averageRank: scanData.averageRank,
      top3Percentage: scanData.top3SharePercentage,
      dominantCompetitors: scanData.dominantCompetitors,
    },
  });

  assert(auditRes.ok, `Audit status is 200 OK (got ${auditRes.status})`);
  const auditData = auditRes.data.data || auditRes.data;
  assert(Boolean(auditData.executiveSummary), 'Executive summary generated');
  assert(Boolean(auditData.missedRevenueEstimate), 'Missed revenue estimate generated');
  assert(Boolean(auditData.actionPlan?.gbpCategories), 'Action plan: GBP categories present');
  assert(Boolean(auditData.actionPlan?.citations), 'Action plan: citations present');
  assert(Boolean(auditData.actionPlan?.reviews), 'Action plan: reviews present');
  assert(Boolean(auditData.actionPlan?.onPageLocalizedContent), 'Action plan: localized content present');
  assert(Boolean(auditData.coldOutreachPitch?.subjectLine), `Cold outreach subject: "${auditData.coldOutreachPitch?.subjectLine}"`);
  assert(Boolean(auditData.coldOutreachPitch?.emailBody), 'Cold outreach email body present');
  assert(Boolean(auditData.coldOutreachPitch?.smsScript), 'Cold outreach SMS/voicemail script present');

  // ----------------------------------------------------
  // TEST 5: Shareable Report (POST /api/v1/agent/create-report)
  // ----------------------------------------------------
  console.log('\n[5/8] Testing Shareable Report Creation (POST /api/v1/agent/create-report)...');
  const reportRes = await fetchJson('/api/v1/agent/create-report', {
    method: 'POST',
    body: {
      businessName: resolved.businessName,
      keyword: resolved.inferredKeyword,
      center: { lat: resolved.lat, lng: resolved.lng },
      gridSize: 3,
      step: 1.0,
      unit: 'km',
      scanSummary: {
        scanId: scanData.scanId,
        averageRank: scanData.averageRank,
        top3Percentage: scanData.top3SharePercentage,
        totalNodes: 9,
        nodes: [],
      },
      audit: auditData,
    },
  });

  assert(reportRes.ok, `Report status is 200 OK (got ${reportRes.status})`);
  const reportData = reportRes.data.data || reportRes.data;
  assert(Boolean(reportData.scanId), `Report scanId: ${reportData.scanId}`);
  assert(Boolean(reportData.shareUrl), `Shareable URL generated: ${reportData.shareUrl}`);

  // Verify persistence by fetching via public endpoint
  const getScanRes = await fetchJson(`/api/scans/${reportData.scanId}`);
  assert(getScanRes.ok, `Retrieved saved scan from disk via GET /api/scans/${reportData.scanId}`);
  assert(getScanRes.data.data?.businessName === resolved.businessName, 'Saved business name matches');

  // ----------------------------------------------------
  // TEST 6: Localized Landing Pages (POST /api/v1/agent/export-pages)
  // ----------------------------------------------------
  console.log('\n[6/8] Testing Localized Landing Pages (POST /api/v1/agent/export-pages)...');
  const pagesRes = await fetchJson('/api/v1/agent/export-pages', {
    method: 'POST',
    body: {
      businessName: resolved.businessName,
      category: 'Emergency Plumber',
      primaryCity: 'Austin, TX',
      nearbyTowns: ['Round Rock', 'Cedar Park'],
      phone: '(512) 555-0199',
    },
  });

  assert(pagesRes.ok, `Pages status is 200 OK (got ${pagesRes.status})`);
  const pagesData = pagesRes.data.data || pagesRes.data;
  assert(Array.isArray(pagesData.pagesGenerated), 'pagesGenerated array is present');
  assert(pagesData.pagesGenerated.length === 3, `Generated 3 pages (got ${pagesData.pagesGenerated.length})`);

  const homePage = pagesData.pagesGenerated.find((p) => p.slug === '/');
  assert(Boolean(homePage), 'Found homepage (slug "/")');
  assert(homePage.htmlContent.includes('schema.org'), 'Homepage embeds schema.org structured data');
  assert(homePage.htmlContent.includes('PlumbingService'), 'Homepage schema includes PlumbingService');
  assert(homePage.htmlContent.includes('Frequently Asked Questions'), 'Homepage contains FAQ section');

  const roundRockPage = pagesData.pagesGenerated.find((p) => p.slug.includes('round-rock'));
  assert(Boolean(roundRockPage), 'Found localized sub-page for Round Rock');

  // ----------------------------------------------------
  // TEST 7: Push Lead to Webhook (POST /api/v1/agent/webhook-dispatch)
  // ----------------------------------------------------
  console.log('\n[7/8] Testing Webhook Lead Dispatch (POST /api/v1/agent/webhook-dispatch)...');
  
  // Set up temporary local HTTP receiver to test webhook POST
  let webhookReceived = false;
  let receivedPayload = null;
  const mockWebhookServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      webhookReceived = true;
      try {
        receivedPayload = JSON.parse(body);
      } catch {
        receivedPayload = body;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'received', leadId: 'lead_123' }));
    });
  });

  await new Promise((resolve) => mockWebhookServer.listen(3456, '127.0.0.1', resolve));

  const webhookRes = await fetchJson('/api/v1/agent/webhook-dispatch', {
    method: 'POST',
    body: {
      webhookUrl: 'http://127.0.0.1:3456/leads/new',
      businessName: resolved.businessName,
      phone: '(512) 555-0199',
      email: 'owner@austinpremierplumbing.com',
      auditUrl: reportData.shareUrl,
      missedMonthlyRevenue: '$14,500/mo',
    },
  });

  mockWebhookServer.close();

  assert(webhookRes.ok, `Webhook dispatch returned 200 OK (got ${webhookRes.status})`);
  assert(webhookRes.data.success === true, 'Webhook dispatch reported success: true');
  assert(webhookReceived === true, 'Mock webhook endpoint received the dispatched lead');
  assert(receivedPayload?.businessName === resolved.businessName, 'Payload businessName matches');
  assert(receivedPayload?.auditUrl === reportData.shareUrl, 'Payload auditUrl matches');

  // ----------------------------------------------------
  // TEST 8: MCP Server (Stdio Transport CLI Execution)
  // ----------------------------------------------------
  console.log('\n[8/8] Testing MCP Server CLI via Stdio Transport...');

  const mcpProcess = spawn(
    'node',
    ['./node_modules/tsx/dist/cli.mjs', './src/mcp/cli-launcher.ts'],
    {
      cwd: ROOT_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '3000' },
    }
  );

  let mcpStderr = '';
  mcpProcess.stderr.on('data', (data) => {
    mcpStderr += data.toString();
  });

  // Helper to send JSON-RPC message over stdio and read response
  const sendMcpRequest = (msg) => {
    return new Promise((resolve, reject) => {
      let buffer = '';
      const onData = (data) => {
        buffer += data.toString();
        // Look for newline delimited or header delimited JSON-RPC
        const lines = buffer.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.id === msg.id) {
                mcpProcess.stdout.removeListener('data', onData);
                return resolve(parsed);
              }
            } catch {
              // keep accumulating
            }
          }
        }
      };

      mcpProcess.stdout.on('data', onData);
      mcpProcess.stdin.write(JSON.stringify(msg) + '\n');

      setTimeout(() => {
        mcpProcess.stdout.removeListener('data', onData);
        reject(new Error(`MCP request timeout for id ${msg.id}. Stderr: ${mcpStderr}`));
      }, 6000);
    });
  };

  try {
    // 1. Initialize
    const initResponse = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-runner', version: '1.0.0' },
      },
    });

    assert(initResponse?.result?.serverInfo?.name === 'georank-pro-agent', `Server name matches: "${initResponse?.result?.serverInfo?.name}"`);
    assert(initResponse?.result?.serverInfo?.version === '1.0.0', `Server version matches: "${initResponse?.result?.serverInfo?.version}"`);

    // 2. Initialized notification
    mcpProcess.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }) + '\n'
    );

    // 3. List Tools
    const toolsResponse = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    const mcpTools = toolsResponse?.result?.tools || [];
    assert(mcpTools.length === 6, `MCP tools/list returned 6 tools (got ${mcpTools.length})`);
    const mcpToolNames = mcpTools.map((t) => t.name);
    assert(mcpToolNames.includes('resolve_business'), 'MCP has resolve_business');
    assert(mcpToolNames.includes('run_geogrid_scan'), 'MCP has run_geogrid_scan');
    assert(mcpToolNames.includes('generate_prospecting_audit'), 'MCP has generate_prospecting_audit');
    assert(mcpToolNames.includes('create_shareable_report'), 'MCP has create_shareable_report');
    assert(mcpToolNames.includes('build_localized_landing_pages'), 'MCP has build_localized_landing_pages');
    assert(mcpToolNames.includes('push_lead_to_webhook'), 'MCP has push_lead_to_webhook');

    // 4. Call Tool (resolve_business)
    const callResponse = await sendMcpRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'resolve_business',
        arguments: {
          query: 'Austin Premier Plumbing',
          targetTownOrPostcode: 'Austin, TX',
        },
      },
    });

    assert(!callResponse.result?.isError, 'MCP tool call executed without error');
    const contentText = callResponse.result?.content?.[0]?.text;
    assert(Boolean(contentText), 'MCP tool call returned content text');
    const toolCallParsed = JSON.parse(contentText);
    assert(toolCallParsed.businessName === 'Austin Premier Plumbing', `MCP resolved businessName: ${toolCallParsed.businessName}`);
    assert(typeof toolCallParsed.lat === 'number', `MCP resolved lat: ${toolCallParsed.lat}`);

  } finally {
    mcpProcess.kill();
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 8 TESTS PASSED SUCCESSFULLY! FULL SPEC VERIFIED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed with exception:', err);
  process.exit(1);
});
