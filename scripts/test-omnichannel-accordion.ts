/**
 * E2E Verification Test for Omnichannel Revenue Leakage Accordion Gate
 * and Telemetry Tracking (leakage_expanded).
 */

import { chromium, type BrowserContext, type Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function testAccordionAndTelemetry() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Omnichannel Accordion Gate & Telemetry Test Suite');
  console.log('  Target: http://localhost:3000/reports/latest');
  console.log('========================================================================\n');

  const tempProfileDir = path.join(os.tmpdir(), `antigravity-accordion-profile-${Date.now()}`);
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

    console.log('1. Navigating to http://localhost:3000/reports/latest...');
    await page.goto('http://localhost:3000/reports/latest', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // 2. Verify Executive Revenue Teaser mounts
    const teaser = page.locator('[data-testid="executive-revenue-teaser"]').first();
    await teaser.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ [PASS] Executive Revenue Teaser is visible by default.');

    // 3. Verify Top 2 Bottlenecks
    const b0 = page.locator('[data-testid="top-bottleneck-0"]').first();
    const b1 = page.locator('[data-testid="top-bottleneck-1"]').first();
    await b0.waitFor({ state: 'visible', timeout: 3000 });
    await b1.waitFor({ state: 'visible', timeout: 3000 });
    const b0Text = await b0.locator('h4').textContent();
    const b1Text = await b1.locator('h4').textContent();
    console.log(`✓ [PASS] Top 2 Urgent Bottlenecks rendered:\n   - ${b0Text}\n   - ${b1Text}`);

    // 4. Verify Accordion Button is present with default collapsed label
    const expandBtn = page.locator('[data-testid="expand-revenue-breakdown"]').first();
    await expandBtn.waitFor({ state: 'visible', timeout: 3000 });
    const btnTextBefore = await expandBtn.textContent();
    console.log(`✓ [PASS] Accordion button rendered with text:\n   "${btnTextBefore?.trim()}"`);
    if (!btnTextBefore?.includes('View Full 5-Pillar Breakdown & Opportunity Analysis')) {
      throw new Error(`Unexpected button text: ${btnTextBefore}`);
    }

    // 5. Verify Full Breakdown is hidden initially on screen
    const fullBreakdown = page.locator('[data-testid="omnichannel-full-breakdown"]').first();
    const isHiddenBefore = await fullBreakdown.evaluate((el) => el.classList.contains('hidden'));
    if (!isHiddenBefore) {
      throw new Error('Full breakdown should be hidden before click');
    }
    console.log('✓ [PASS] Full 5-pillar breakdown is initially collapsed/hidden.');

    // 6. Click Accordion Button to Expand
    console.log('\n2. Clicking "[ View Full 5-Pillar Breakdown & Opportunity Analysis ▼ ]"...');
    await expandBtn.click();
    await page.waitForTimeout(1000);

    // 7. Verify Expanded State
    const btnTextAfter = await expandBtn.textContent();
    console.log(`✓ [PASS] Accordion button updated text after click:\n   "${btnTextAfter?.trim()}"`);
    if (!btnTextAfter?.includes('Hide Full 5-Pillar Breakdown')) {
      throw new Error(`Expected button text to update to Hide Full Breakdown, got: ${btnTextAfter}`);
    }

    const isVisibleAfter = await fullBreakdown.isVisible();
    if (!isVisibleAfter) {
      throw new Error('Full breakdown should be visible after click');
    }
    console.log('✓ [PASS] Full breakdown container is now visible in the DOM.');

    // 8. Verify Pillar Cards are visible inside expanded container
    const pillars = ['websiteConversion', 'speedToLead', 'onlineBooking', 'reputation', 'retention'];
    for (const p of pillars) {
      const card = page.locator(`[data-testid="pillar-card-${p}"]`).first();
      await card.waitFor({ state: 'visible', timeout: 3000 });
      console.log(`✓ [PASS] Verified expanded card for pillar: ${p}`);
    }

    // 9. Verify Telemetry Event Dispatch to Backend
    console.log('\n3. Verifying leakage_expanded telemetry event in backend...');
    const analyticsRes = await fetch('http://localhost:3000/api/analytics/events');
    const analyticsJson = await analyticsRes.json();
    const leakageEvents = (analyticsJson.data || []).filter((e: any) => e.eventType === 'leakage_expanded');

    if (leakageEvents.length === 0) {
      throw new Error('No leakage_expanded event found in backend analytics database!');
    }
    console.log(`✓ [PASS] Verified ${leakageEvents.length} leakage_expanded event(s) in backend telemetry store.`);
    console.log(`   Sample event:`, JSON.stringify(leakageEvents[0], null, 2));

    console.log('\n========================================================================');
    console.log('✅ ALL ACCORDION GATE & TELEMETRY TESTS PASSED (100%)');
    console.log('========================================================================');
  } catch (err) {
    console.error('Test FAILED:', err);
    process.exit(1);
  } finally {
    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

testAccordionAndTelemetry();
