/**
 * Render Deploy Hook Trigger Script
 * Path: scripts/trigger-render-deploy.js
 *
 * Hits the Render Web Service Deploy Hook to trigger a fresh production build.
 */

import fs from 'fs';
import path from 'path';

// Read .env if present
let hookUrl = process.env.RENDER_DEPLOY_HOOK_URL;

if (!hookUrl) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/RENDER_DEPLOY_HOOK_URL=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      hookUrl = match[1].trim();
    }
  } catch (e) {
    // .env not found
  }
}

// Fallback to configured service hook if not in env
const DEFAULT_HOOK = 'https://api.render.com/deploy/srv-dbedjdvb9u1s739bqo8g?key=PmnlNyHDcK4';
const targetUrl = hookUrl || DEFAULT_HOOK;

async function triggerDeploy() {
  console.log('🚀 Triggering Render Production Deployment...');
  console.log(`Target Hook: ${targetUrl.replace(/key=.*/, 'key=***')}`);

  try {
    const response = await fetch(targetUrl, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Render API responded with HTTP ${response.status}: ${response.statusText}`);
    }
    const rawText = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText.trim();
    }
    console.log('✅ Render Deploy Successfully Queued:');
    console.log(typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed);
  } catch (error) {
    console.error('❌ Failed to trigger Render deploy hook:', error.message);
    process.exit(1);
  }
}

triggerDeploy();
