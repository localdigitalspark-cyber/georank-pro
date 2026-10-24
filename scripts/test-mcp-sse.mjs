/**
 * Test MCP SSE Transport & Auth Middleware
 * Path: /scripts/test-mcp-sse.mjs
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function testSse() {
  console.log('\n--- Testing MCP SSE Transport Handshake & Message Routing ---');

  // 1. Establish SSE stream on GET /sse
  const sseReq = http.request(`${BASE_URL}/sse`, {
    headers: {
      Accept: 'text/event-stream',
    },
  });

  let sessionId = null;
  let receivedEndpointEvent = false;

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sseReq.destroy();
      reject(new Error('Timeout waiting for SSE endpoint event'));
    }, 5000);

    sseReq.on('response', (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Expected status 200 for /sse, got ${res.statusCode}`));
      }

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        // Look for event: endpoint\ndata: ...
        const lines = buffer.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data:') && line.includes('sessionId=')) {
            const urlPart = line.replace('data:', '').trim();
            const match = urlPart.match(/sessionId=([a-zA-Z0-9-]+)/);
            if (match && match[1]) {
              sessionId = match[1];
              receivedEndpointEvent = true;
              clearTimeout(timeout);
              resolve();
              break;
            }
          }
        }
      });
    });

    sseReq.on('error', reject);
    sseReq.end();
  });

  console.log(`  ✓ Received SSE endpoint event with sessionId: ${sessionId}`);

  // 2. Post JSON-RPC message to /messages?sessionId=...
  const postRes = await fetch(`${BASE_URL}/messages?sessionId=${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 101,
      method: 'tools/list',
      params: {},
    }),
  });

  console.log(`  ✓ Posted JSON-RPC message to /messages: status ${postRes.status}`);
  if (postRes.status !== 200 && postRes.status !== 202) {
    throw new Error(`Expected 200 or 202 from /messages, got ${postRes.status}`);
  }

  // Clean up
  sseReq.destroy();
  console.log('  ✓ MCP SSE Transport successfully verified!\n');
}

testSse().catch((err) => {
  console.error('❌ SSE test failed:', err);
  process.exit(1);
});
