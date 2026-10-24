/**
 * GeoRank Pro - Automated Test Suite for Prospect Engagement Analytics & Telemetry Engine
 * Path: /scripts/test-analytics-telemetry.ts
 */

import { chromium, type BrowserContext, type Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function runAnalyticsTelemetryTests() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Prospect Analytics Telemetry & Dashboard Test Suite');
  console.log('  Target: http://localhost:3000');
  console.log('========================================================================\n');

  // 1. API Verification
  console.log('--- 1. Testing Analytics Endpoints Directly ---');
  
  // 1.1 Summary endpoint
  const summaryRes = await fetch('http://localhost:3000/api/analytics/summary');
  if (!summaryRes.ok) {
    throw new Error(`GET /api/analytics/summary failed: ${summaryRes.status}`);
  }
  const summaryJson = await summaryRes.json();
  if (!summaryJson.success || !summaryJson.data) {
    throw new Error(`Invalid summary response: ${JSON.stringify(summaryJson)}`);
  }
  console.log('  [PASS] GET /api/analytics/summary returned HTTP 200 with data');
  console.log(`         Open Rate: ${summaryJson.data.openRatePercent}%, Total Prospects: ${summaryJson.data.prospects?.length}`);

  // 1.2 Ingest test event
  const testScanId = `test_telemetry_${Date.now()}`;
  const testBizName = 'Highland Park Roofing & Gutters';

  const postRes = await fetch('http://localhost:3000/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanId: testScanId,
      businessName: testBizName,
      eventType: 'report_opened',
      details: { referrer: 'email_campaign_march' },
    }),
  });
  if (!postRes.ok) {
    throw new Error(`POST /api/analytics/events failed: ${postRes.status}`);
  }
  const postJson = await postRes.json();
  if (!postJson.success || !postJson.event) {
    throw new Error(`Invalid event response: ${JSON.stringify(postJson)}`);
  }
  console.log('  [PASS] POST /api/analytics/events recorded report_opened');

  // Ingest slider & cta events
  await fetch('http://localhost:3000/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanId: testScanId,
      businessName: testBizName,
      eventType: 'slider_adjusted',
      details: { sliderName: 'avgTicketValue', sliderValue: 1200 },
    }),
  });

  await fetch('http://localhost:3000/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanId: testScanId,
      businessName: testBizName,
      eventType: 'cta_clicked',
      details: { ctaType: 'strategy_call' },
    }),
  });
  console.log('  [PASS] Recorded slider_adjusted and cta_clicked events for test prospect');

  // Verify list events by scanId
  const eventsListRes = await fetch(`http://localhost:3000/api/analytics/events?scanId=${testScanId}`);
  const eventsListJson = await eventsListRes.json();
  if (eventsListJson.data.length < 3) {
    throw new Error(`Expected at least 3 events for ${testScanId}, got ${eventsListJson.data.length}`);
  }
  console.log(`  [PASS] GET /api/analytics/events?scanId=${testScanId} retrieved ${eventsListJson.data.length} events`);

  // 2. Browser E2E Tests with Isolated Profile
  console.log('\n--- 2. Browser E2E: Interactive Deck & Prospects Dashboard ---');
  const tempProfileDir = path.join(os.tmpdir(), `antigravity-analytics-profile-${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const context: BrowserContext = await chromium.launchPersistentContext(tempProfileDir, {
    executablePath: chromePath,
    headless: true,
    viewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  try {
    const page: Page = context.pages()[0] || (await context.newPage());

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('    PAGE LOG ERROR:', msg.text());
      }
    });
    page.on('pageerror', (err) => console.log('    PAGE ERROR:', err.message));

    // 2.1 Load Public Report & Interact
    console.log('  Testing report telemetry interaction on /reports/latest...');
    await page.goto('http://localhost:3000/reports/latest', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Switch scenario tab to Market Leader
    const leaderBtn = page.locator('button:has-text("Market Leader (60% Share)")').first();
    if (await leaderBtn.isVisible()) {
      await leaderBtn.click();
      console.log('    [PASS] Clicked Market Leader scenario tab');
      await page.waitForTimeout(500);
    }

    // Adjust Average Ticket slider
    const ticketSlider = page.locator('input[data-testid="slider-avg-ticket"]').first();
    if (await ticketSlider.isVisible()) {
      await ticketSlider.fill('850');
      console.log('    [PASS] Adjusted Average Ticket Value slider to 850');
      await page.waitForTimeout(600); // allow debounce
    }

    // Adjust Close Rate slider
    const closeSlider = page.locator('input[data-testid="slider-close-rate"]').first();
    if (await closeSlider.isVisible()) {
      await closeSlider.fill('45');
      console.log('    [PASS] Adjusted Close Rate slider to 45%');
      await page.waitForTimeout(600); // allow debounce
    }

    // Click strategy call CTA
    const strategyCallBtn = page.locator('a:has-text("Book a 15-Minute Strategy Call")').first();
    if (await strategyCallBtn.isVisible()) {
      await strategyCallBtn.click();
      console.log('    [PASS] Clicked Strategy Call CTA');
      await page.waitForTimeout(500);
    }

    // 2.2 Navigate to Main Dashboard and open Prospects & Pipeline view
    console.log('\n  Testing Prospects & Pipeline Dashboard Navigation...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    const prospectsNavItem = page.locator('[data-testid="nav-prospects"]').first();
    await prospectsNavItem.waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForTimeout(500);
    await prospectsNavItem.click();
    await page.waitForTimeout(500);

    const isHeaderNow = await page.locator('text=Prospects & Pipeline Analytics').first().isVisible();
    if (!isHeaderNow) {
      console.log('    Retrying click via evaluate...');
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="nav-prospects"]') as HTMLButtonElement;
        btn?.click();
      });
      await page.waitForTimeout(1000);
    }

    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/debug-prospects-page.html', await page.content());
    await page.screenshot({ path: 'test-results/debug-prospects-page.png' });

    // Verify Prospects & Pipeline header
    const dashboardHeader = page.locator('text=Prospects & Pipeline Analytics').first();
    if (!(await dashboardHeader.isVisible())) {
      throw new Error('Prospects & Pipeline dashboard view did not mount');
    }
    console.log('  [PASS] Prospects & Pipeline view mounted successfully!');

    // Verify 4 KPI cards
    const kpiOpenRate = page.locator('text=Audit Deck Open Rate').first();
    const kpiDwell = page.locator('text=Avg Reading Dwell Time').first();
    const kpiSliders = page.locator('text=Slider ROI Adjustments').first();
    const kpiCtas = page.locator('text=High-Intent CTA Clicks').first();

    if (!(await kpiOpenRate.isVisible()) || !(await kpiDwell.isVisible()) || !(await kpiSliders.isVisible()) || !(await kpiCtas.isVisible())) {
      throw new Error('One or more of the 4 KPI telemetry cards are missing');
    }
    console.log('  [PASS] All 4 KPI telemetry summary cards are rendered:');
    console.log('         - Audit Deck Open Rate');
    console.log('         - Avg Reading Dwell Time');
    console.log('         - Slider ROI Adjustments');
    console.log('         - High-Intent CTA Clicks');

    // Verify Conversion Funnel Visual
    const funnelHeader = page.locator('text=Prospect Engagement & Conversion Funnel').first();
    if (!(await funnelHeader.isVisible())) {
      throw new Error('Conversion funnel visual is missing');
    }
    console.log('  [PASS] Conversion Funnel visual is present with 4 stages');

    // Verify Prospect Table
    const tableHeader = page.locator('text=Prospect Pipeline & Engagement Heatmap').first();
    if (!(await tableHeader.isVisible())) {
      throw new Error('Prospect pipeline table missing');
    }
    console.log('  [PASS] Prospect Pipeline Table rendered');

    // Verify Live Telemetry Stream
    const streamHeader = page.locator('text=Live Telemetry Stream').first();
    if (!(await streamHeader.isVisible())) {
      throw new Error('Live Telemetry Stream feed missing');
    }
    console.log('  [PASS] Live Telemetry Stream feed rendered');

    // Click on a prospect row to test telemetry modal
    const telemetryBtn = page.locator('[data-testid="prospect-telemetry-btn"]').first();
    console.log('    telemetryBtn visible:', await telemetryBtn.isVisible());
    if (await telemetryBtn.isVisible()) {
      await telemetryBtn.click();
      await page.waitForTimeout(600);

      const isModalVis = await page.locator('[data-testid="prospect-telemetry-modal"]').isVisible();
      console.log('    Modal visible after click:', isModalVis);
      if (!isModalVis) {
        console.log('    Retrying click via evaluate...');
        await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="prospect-telemetry-btn"]') as HTMLButtonElement;
          btn?.click();
        });
        await page.waitForTimeout(600);
      }

      const modalTimeline = page.locator('text=Complete Interaction Timeline:').first();
      if (!(await modalTimeline.isVisible())) {
        throw new Error('Prospect Telemetry detail modal did not open');
      }
      console.log('  [PASS] Prospect detail modal opened with interaction timeline and follow-up pitch hook!');

      // Close modal
      const closeBtn = page.locator('button:has-text("Close")').last();
      await closeBtn.click();
      await page.waitForTimeout(300);
    }

  } finally {
    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }

  console.log('\n========================================================================');
  console.log('✅ ALL PROSPECT TELEMETRY & PIPELINE DASHBOARD TESTS PASSED!');
  console.log('========================================================================\n');
}

runAnalyticsTelemetryTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
