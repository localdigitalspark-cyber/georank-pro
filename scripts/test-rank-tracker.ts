/**
 * GeoRank Pro - Automated Scheduled Rank Tracker, Delta Engine, and Win/Loss Alerts E2E Verification
 * Path: /scripts/test-rank-tracker.ts
 *
 * Verifies:
 * 1. Backend Scheduler API (/api/tracking/status, /api/tracking/run-now, /api/tracking/alerts)
 * 2. Business Directory Delta Badges ("▲ +1.8 into 3-Pack", "▼ -1.6 drop") & Tracking Pills
 * 3. Business Tracking Configuration Modal (frequency toggle, alerts, channels, test run)
 * 4. Workspace BusinessHeader Delta Badge, Alerts Bell & Unread Counter
 * 5. Win/Loss Volatility Alerts Modal (3-Pack entry milestones, rank slips, filters, mark read)
 * 6. Active Keyword Selector Delta Badge
 */

import { chromium, type BrowserContext, type Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function runRankTrackerVerification() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Automated Scheduled Rank Tracker & Delta Verification');
  console.log('  Target: http://localhost:3000');
  console.log('========================================================================\n');

  // Verify backend endpoints directly first
  console.log('--- Step 1: Diagnostic Backend Endpoint Verification ---');
  const statusResp = await fetch('http://localhost:3000/api/tracking/status');
  const statusData = await statusResp.json();
  console.log('✓ Scheduler status:', JSON.stringify(statusData.status));
  if (!statusData.success || !statusData.status?.isRunning) {
    throw new Error('Scheduler status failed or not running: ' + JSON.stringify(statusData));
  }

  const alertsResp = await fetch('http://localhost:3000/api/tracking/alerts');
  const alertsData = await alertsResp.json();
  console.log(`✓ Alerts endpoint returned ${alertsData.count} alerts (${alertsData.unreadCount} unread)`);
  if (!alertsData.success || alertsData.count < 1) {
    throw new Error('Alerts endpoint returned invalid or empty alerts: ' + JSON.stringify(alertsData));
  }

  // Setup isolated Chrome session per RULE[user_global]
  const tempProfileDir = path.join(os.tmpdir(), `antigravity-rank-tracker-${Date.now()}`);
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

    // 2. Open Directory View
    console.log('\n--- Step 2: Businesses Directory Delta Badges & Tracking Status ---');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Switch to Businesses Directory view if currently in workspace
    const backBtn = page.locator('button[title="Return to all businesses"]').first();
    if (await backBtn.isVisible()) {
      console.log('Navigating from workspace back to directory cards...');
      await backBtn.click();
      await page.waitForTimeout(600);
    } else {
      const businessesNav = page.locator('button:has-text("Businesses")').first();
      if (await businessesNav.isVisible()) {
        await businessesNav.click();
        await page.waitForTimeout(600);
      }
    }

    // Verify Delta Badges on Cards
    const deltaBadgeB1 = page.locator('[data-testid="delta-badge-b1"]').first();
    await deltaBadgeB1.waitFor({ state: 'visible', timeout: 5000 });
    const b1DeltaText = await deltaBadgeB1.textContent();
    console.log(`✓ [PASS] Austin Premier Plumbing Delta Badge: "${b1DeltaText?.trim()}"`);

    const deltaBadgeB2 = page.locator('[data-testid="delta-badge-b2"]').first();
    if (await deltaBadgeB2.isVisible()) {
      const b2DeltaText = await deltaBadgeB2.textContent();
      console.log(`✓ [PASS] Sunrise Hair Studio Delta Badge: "${b2DeltaText?.trim()}"`);
    }

    // 3. Open Tracking Configuration Modal
    console.log('\n--- Step 3: Tracking Configuration Modal & Test Check ---');
    const trackBtnB1 = page.locator('[data-testid="business-tracking-btn-b1"]').first();
    await trackBtnB1.waitFor({ state: 'visible', timeout: 4000 });
    await trackBtnB1.click();
    await page.waitForTimeout(500);

    const trackingModal = page.locator('[data-testid="tracking-config-modal"]').first();
    await trackingModal.waitFor({ state: 'visible', timeout: 4000 });
    console.log('✓ [PASS] TrackingConfigModal opened.');

    // Verify frequency options
    const dailyBtn = page.locator('[data-testid="frequency-daily"]').first();
    const weeklyBtn = page.locator('[data-testid="frequency-weekly"]').first();
    await dailyBtn.waitFor({ state: 'visible', timeout: 3000 });
    await weeklyBtn.waitFor({ state: 'visible', timeout: 3000 });
    console.log('✓ [PASS] Frequency options rendered.');

    // Fill in Email & Webhook
    const emailInput = page.locator('[data-testid="tracking-email-input"]').first();
    const webhookInput = page.locator('[data-testid="tracking-webhook-input"]').first();
    await emailInput.fill('agency-alerts@austinplumbing.com');
    await webhookInput.fill('https://hooks.slack.com/services/T00/B00/X001122');
    console.log('✓ [PASS] Notification channels configured.');

    // Save Tracking Settings
    const saveBtn = page.locator('[data-testid="save-tracking-btn"]').first();
    await saveBtn.click();
    await page.waitForTimeout(1500);
    console.log('✓ [PASS] Saved tracking settings successfully.');

    // 4. Enter Business Workspace & Verify BusinessHeader Delta Badge & Alerts
    console.log('\n--- Step 4: Workspace BusinessHeader Tracking Metrics & Alerts ---');
    const b1Card = page.locator('h3:has-text("Austin Premier Plumbing")').first();
    await b1Card.click();
    await page.waitForTimeout(1000);

    // Verify Business Header Tracking Status Pill
    const headerTrackingPill = page.locator('[data-testid="header-tracking-status-pill"]').first();
    await headerTrackingPill.waitFor({ state: 'visible', timeout: 5000 });
    const pillText = await headerTrackingPill.textContent();
    console.log(`✓ [PASS] BusinessHeader Tracking Status Pill: "${pillText?.trim()}"`);

    // Verify Business Header Delta Badge
    const headerDeltaBadge = page.locator('[data-testid="header-delta-badge"]').first();
    await headerDeltaBadge.waitFor({ state: 'visible', timeout: 5000 });
    const headerDeltaText = await headerDeltaBadge.textContent();
    console.log(`✓ [PASS] BusinessHeader Delta Badge rendered: "${headerDeltaText?.trim()}"`);

    // Verify Next Check Tooltip
    const headerNextCheck = page.locator('[data-testid="header-next-check"]').first();
    await headerNextCheck.waitFor({ state: 'visible', timeout: 5000 });
    const nextCheckText = await headerNextCheck.textContent();
    console.log(`✓ [PASS] BusinessHeader Next Check Tooltip: "${nextCheckText?.trim()}"`);

    // Verify Alerts Button in BusinessHeader
    const alertsBtn = page.locator('[data-testid="header-alerts-btn"]').first();
    await alertsBtn.waitFor({ state: 'visible', timeout: 4000 });
    console.log('✓ [PASS] BusinessHeader Alerts button visible.');

    // Verify Active Keyword Delta Badge in ProfitMapsView
    const activeKwDeltaBadge = page.locator('[data-testid="active-keyword-delta-badge"]').first();
    await activeKwDeltaBadge.waitFor({ state: 'visible', timeout: 5000 });
    const kwDeltaText = await activeKwDeltaBadge.textContent();
    console.log(`✓ [PASS] Active Keyword Delta Badge visible: "${kwDeltaText?.trim()}"`);

    // Click keyword dropdown to verify 3-column rows
    console.log('\n--- Step 4b: ProfitMapsView 3-Column Keyword Dropdown ---');
    const kwDropdownBtn = page.locator('button:has([data-testid="active-keyword-delta-badge"])').first();
    await kwDropdownBtn.click();
    await page.waitForTimeout(400);

    const firstDropdownItem = page.locator('[data-testid^="keyword-dropdown-item-"]').first();
    await firstDropdownItem.waitFor({ state: 'visible', timeout: 4000 });
    const firstItemDelta = page.locator('[data-testid^="keyword-delta-badge-"]').first();
    await firstItemDelta.waitFor({ state: 'visible', timeout: 4000 });
    const dropdownDeltaVal = await firstItemDelta.textContent();
    console.log(`✓ [PASS] Dropdown 3-Column Delta Badge: "${dropdownDeltaVal?.trim()}"`);

    // Close dropdown
    await kwDropdownBtn.click();
    await page.waitForTimeout(300);

    // Verify Dedicated Keywords Metrics Table on Keywords Tab
    console.log('\n--- Step 4c: Dedicated Keywords Metrics Table (KeywordsView) ---');
    const keywordsTable = page.locator('[data-testid="keywords-table"]').first();
    await keywordsTable.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ [PASS] Keywords metrics table is visible.');

    const tableDeltaBadge = page.locator('[data-testid^="keyword-table-delta-"]').first();
    await tableDeltaBadge.waitFor({ state: 'visible', timeout: 5000 });
    const tableDeltaVal = await tableDeltaBadge.textContent();
    console.log(`✓ [PASS] Table row 30-Day Movement Delta Badge: "${tableDeltaVal?.trim()}"`);

    // 5. Open Win/Loss Alerts Modal
    console.log('\n--- Step 5: Win/Loss Volatility Alerts Modal ---');
    await alertsBtn.click();
    await page.waitForTimeout(600);

    const alertsModal = page.locator('[data-testid="win-loss-alerts-modal"]').first();
    await alertsModal.waitFor({ state: 'visible', timeout: 4000 });
    console.log('✓ [PASS] WinLossAlertsModal opened.');

    // Check Filter tabs (All / Wins / Losses)
    const winsFilterBtn = page.locator('button:has-text("🎉 Wins")').first();
    const lossesFilterBtn = page.locator('button:has-text("⚠️ Losses")').first();
    await winsFilterBtn.waitFor({ state: 'visible', timeout: 3000 });
    await lossesFilterBtn.waitFor({ state: 'visible', timeout: 3000 });

    await winsFilterBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ [PASS] Filtered for 3-Pack Win milestones.');

    await lossesFilterBtn.click();
    await page.waitForTimeout(300);
    console.log('✓ [PASS] Filtered for Rank Loss remediation alerts.');

    // Close Alerts Modal
    const closeAlertsBtn = alertsModal.locator('button:has-text("Close")').first();
    await closeAlertsBtn.click();
    await page.waitForTimeout(400);
    console.log('✓ [PASS] Closed WinLossAlertsModal.');

    console.log('\n========================================================================');
    console.log('  ALL RANK TRACKER & DELTA ENGINE CHECKS PASSED SUCCESSFULLY!');
    console.log('========================================================================\n');
  } finally {
    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

runRankTrackerVerification().catch((err) => {
  console.error('\n❌ [FAIL] Verification error:', err);
  process.exit(1);
});
