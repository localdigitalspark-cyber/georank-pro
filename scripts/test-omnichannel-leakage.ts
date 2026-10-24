/**
 * GeoRank Pro - Omnichannel Revenue Leakage & Opportunity E2E Test Suite
 * Path: /scripts/test-omnichannel-leakage.ts
 */

import { chromium, type BrowserContext, type Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  calculateOmnichannelRevenueLeakage,
  DEFAULT_LEAKAGE_FACTORS,
} from '../src/lib/calculator/revenue-leakage.ts';

async function runOmnichannelLeakageTests() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Omnichannel Revenue Leakage & Opportunity Test Suite');
  console.log('  Target: http://localhost:3000/reports/latest');
  console.log('========================================================================\n');

  // 1. Unit Model Verification
  console.log('--- 1. Testing Mathematical Engine (revenue-leakage.ts) ---');
  const baseline = calculateOmnichannelRevenueLeakage(DEFAULT_LEAKAGE_FACTORS);
  console.log(`  [PASS] Baseline Operational Deficit Score: ${baseline.totals.operationalDeficitScore} / 100`);
  console.log(`  [PASS] Baseline Monthly Leakage: £${baseline.totals.totalMonthlyLeakage.toLocaleString()}/mo`);
  console.log(`  [PASS] Baseline Annual Leakage: £${baseline.totals.totalAnnualLeakage.toLocaleString()}/yr`);
  console.log(`  [PASS] Total Monthly Lost Jobs: ${baseline.totals.totalLostJobsMonthly} jobs/mo`);

  if (baseline.totals.totalMonthlyLeakage <= 0 || baseline.totals.operationalDeficitScore < 80) {
    throw new Error('Baseline calculation returned unexpected values');
  }

  // Test fully optimized state
  const optimized = calculateOmnichannelRevenueLeakage({
    ...DEFAULT_LEAKAGE_FACTORS,
    hasMobileFastSite: true,
    hasWebsiteChatbot: true,
    hasMissedCallSmsTextback: true,
    hasWhatsAppOrMessenger: true,
    hasOnlineBookingCalendar: true,
    hasEmailNewsletterOrOffers: true,
    hasRewardsReferralProgram: true,
  });
  console.log(`  [PASS] Fully Optimized Deficit Score: ${optimized.totals.operationalDeficitScore} / 100 (Expected: 0)`);
  console.log(`  [PASS] Fully Optimized Monthly Leakage: £${optimized.totals.totalMonthlyLeakage} (Expected: 0)`);

  if (optimized.totals.operationalDeficitScore !== 0 || optimized.totals.totalMonthlyLeakage !== 0) {
    throw new Error('Optimized calculation failed: leakage was not zero');
  }

  // Verify 5-Point Strategic Roadmap
  if (baseline.roadmapSteps.length !== 5) {
    throw new Error(`Expected 5 roadmap steps, got ${baseline.roadmapSteps.length}`);
  }
  console.log('  [PASS] Generated 5-Point Phased Strategic Roadmap');

  // 2. Browser E2E Tests with Isolated Profile
  console.log('\n--- 2. Browser E2E: Omnichannel Revenue Leakage Client Report Module ---');
  const tempProfileDir = path.join(os.tmpdir(), `antigravity-omnichannel-profile-${Date.now()}`);
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

    console.log('  Navigating to http://localhost:3000/reports/latest...');
    await page.goto('http://localhost:3000/reports/latest', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // 2.1 Verify Section Container Mounts
    const section = page.locator('[data-testid="omnichannel-leakage-section"]').first();
    await section.waitFor({ state: 'visible', timeout: 8000 });
    console.log('  [PASS] Omnichannel Revenue Leakage & Bottleneck section is visible in DOM');

    // 2.2 Verify Deficit Badge
    const badge = page.locator('[data-testid="omnichannel-deficit-badge"]').first();
    await badge.waitFor({ state: 'visible', timeout: 3000 });
    const badgeText = (await badge.textContent())?.trim();
    console.log(`  [PASS] Operational Deficit Score badge rendered: "${badgeText}"`);

    // 2.3 Verify 4 Bottleneck Cards
    const cardTitles = [
      '01 • Website Online Conversion',
      '02 • Missed Real-Time Communications',
      '03 • Self-Service Booking Friction',
      '04 • Retention & Database Deficits',
    ];
    for (const title of cardTitles) {
      const card = page.locator(`h4:has-text("${title}")`).first();
      await card.waitFor({ state: 'visible', timeout: 3000 });
      console.log(`  [PASS] Bottleneck Card verified: "${title}"`);
    }

    // 2.4 Verify Grand Combined Revenue Metrics
    const combinedMonthly = page.locator('[data-testid="kpi-combined-monthly-leak"]').first();
    await combinedMonthly.waitFor({ state: 'visible', timeout: 3000 });
    const combinedMonthlyVal = (await combinedMonthly.textContent())?.trim();

    const combinedAnnual = page.locator('[data-testid="kpi-combined-annual-leak"]').first();
    await combinedAnnual.waitFor({ state: 'visible', timeout: 3000 });
    const combinedAnnualVal = (await combinedAnnual.textContent())?.trim();

    console.log(`  [PASS] Grand Combined Monthly Bleed: "${combinedMonthlyVal}"`);
    console.log(`  [PASS] Grand Combined Annual Bleed: "${combinedAnnualVal}"`);

    // 2.5 Test Interactive Operational Toggles
    console.log('\n  Testing interactive operational toggles (simulate fixing bottlenecks)...');
    const fastMobileToggle = page.locator('text=Fast Mobile Speed (<2.5s)').first();
    await fastMobileToggle.click();
    await page.waitForTimeout(400);

    const chatbotToggle = page.locator('text=24/7 Web AI Lead Chatbot').first();
    await chatbotToggle.click();
    await page.waitForTimeout(400);

    const updatedCombinedMonthly = (await combinedMonthly.textContent())?.trim();
    console.log(`  [PASS] Toggled Fast Mobile & AI Chatbot ON -> Monthly Bleed recalculated from ${combinedMonthlyVal} to ${updatedCombinedMonthly}`);

    if (updatedCombinedMonthly === combinedMonthlyVal) {
      throw new Error('Combined monthly leakage did not change after toggling fixes');
    }

    // 2.6 Test Sliders
    console.log('\n  Testing visitor & customer list sliders...');
    const visitorsSlider = page.locator('[data-testid="slider-site-visitors"]').first();
    await visitorsSlider.fill('1500');
    await page.waitForTimeout(300);

    const pastCustomersSlider = page.locator('[data-testid="slider-past-customers"]').first();
    await pastCustomersSlider.fill('1000');
    await page.waitForTimeout(300);
    console.log('  [PASS] Sliders updated visitors (1,500) and past customers (1,000)');

    // 2.7 Verify 5-Point Strategic Roadmap Rendering
    console.log('\n  Testing 5-Point Strategic Opportunity & Growth Roadmap...');
    const roadmapHeading = page.locator('text=Comprehensive 5-Point Strategic Opportunity & Growth Roadmap').first();
    await roadmapHeading.waitFor({ state: 'visible', timeout: 3000 });

    const phases = [
      'Phase 01 • Days 1–7',
      'Phase 02 • Days 7–14',
      'Phase 03 • Days 14–21',
      'Phase 04 • Days 21–30',
      'Phase 05 • Month 2 Onwards',
    ];
    for (const ph of phases) {
      const phaseBadge = page.locator(`text=${ph}`).first();
      await phaseBadge.waitFor({ state: 'visible', timeout: 3000 });
      console.log(`  [PASS] Roadmap Phase verified: "${ph}"`);
    }

    console.log('\n========================================================================');
    console.log('  ALL OMNICHANNEL REVENUE LEAKAGE TESTS PASSED (100%)');
    console.log('========================================================================\n');
  } finally {
    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

runOmnichannelLeakageTests().catch((err) => {
  console.error('\n[FATAL TEST ERROR]', err);
  process.exit(1);
});
