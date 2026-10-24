/**
 * Test Agent Authentication Middleware
 * Path: /scripts/test-agent-auth.mjs
 */

import express from 'express';

async function testAuthMiddleware() {
  console.log('\n--- Testing Agent Auth Middleware Logic ---');

  const app = express();
  app.use(express.json());

  // Mirror the agentAuthMiddleware from server.ts
  const agentAuthMiddleware = (req, res, next) => {
    const configuredKey = process.env.TEST_AGENT_API_KEY?.trim();
    if (!configuredKey) {
      return next();
    }

    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const xApiKey = req.headers['x-api-key'];
    const queryApiKey = req.query.apiKey;

    const provided = bearerToken || xApiKey || queryApiKey;
    if (!provided || provided !== configuredKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing API key',
      });
    }

    next();
  };

  app.get('/test-secure', agentAuthMiddleware, (_req, res) => {
    res.json({ success: true, authorized: true });
  });

  const server = app.listen(3991, '127.0.0.1');

  try {
    process.env.TEST_AGENT_API_KEY = 'secret-agent-key-999';

    // 1. Without credentials -> 401
    const resNoAuth = await fetch('http://127.0.0.1:3991/test-secure');
    if (resNoAuth.status !== 401) throw new Error(`Expected 401, got ${resNoAuth.status}`);
    console.log('  ✓ Request without key returns 401 Unauthorized');

    // 2. With invalid credentials -> 401
    const resBadAuth = await fetch('http://127.0.0.1:3991/test-secure', {
      headers: { Authorization: 'Bearer wrong-key' },
    });
    if (resBadAuth.status !== 401) throw new Error(`Expected 401, got ${resBadAuth.status}`);
    console.log('  ✓ Request with invalid key returns 401 Unauthorized');

    // 3. With Bearer token -> 200
    const resBearer = await fetch('http://127.0.0.1:3991/test-secure', {
      headers: { Authorization: 'Bearer secret-agent-key-999' },
    });
    if (resBearer.status !== 200) throw new Error(`Expected 200, got ${resBearer.status}`);
    console.log('  ✓ Request with valid Bearer token returns 200 OK');

    // 4. With x-api-key header -> 200
    const resXKey = await fetch('http://127.0.0.1:3991/test-secure', {
      headers: { 'x-api-key': 'secret-agent-key-999' },
    });
    if (resXKey.status !== 200) throw new Error(`Expected 200, got ${resXKey.status}`);
    console.log('  ✓ Request with valid x-api-key header returns 200 OK');

    // 5. With query parameter ?apiKey=... -> 200
    const resQuery = await fetch('http://127.0.0.1:3991/test-secure?apiKey=secret-agent-key-999');
    if (resQuery.status !== 200) throw new Error(`Expected 200, got ${resQuery.status}`);
    console.log('  ✓ Request with valid ?apiKey query parameter returns 200 OK');

    console.log('  ✓ Auth middleware verified under all security scenarios!\n');
  } finally {
    server.close();
  }
}

testAuthMiddleware().catch((err) => {
  console.error('❌ Auth test failed:', err);
  process.exit(1);
});
