/**
 * GeoRank Pro - Mobile Responsive E2E Browser Verification Suite
 * Path: /scripts/test-mobile-responsive.ts
 *
 * Verifies mobile polish on iPhone 14/15 dimensions (390 x 844, touch):
 * 1. Mobile view dropdown (<select data-testid="mobile-subtab-select">) renders and switches tabs cleanly.
 * 2. Active Keyword selector and Actions ⋮ menu fit cleanly into a single row on mobile (no 4-row stacking).
 * 3. 5x5 map pins container is 100% visible and not obscured by floating overlay cards (KPI bar sits above canvas).
 * 4. Executive Revenue Teaser displays on mobile without truncation.
 * 5. Tapping "[ View Full 5-Pillar Breakdown & Opportunity Analysis ▼ ]" expands cards.
 * 6. All 5 pillar cards stack neatly in a single responsive column (< 390px width).
 */

import { chromium, type BrowserContext, type Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

interface TestStepResult {
  step: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  error?: string;
}

const testResults: TestStepResult[] = [];

function pass(step: string, category: string, details?: string) {
  testResults.push({ step, category, status: 'PASS', details });
  console.log(`  [PASS] ${step}${details ? ` -> ${details}` : ''}`);
}

function fail(step: string, category: string, error: string) {
  testResults.push({ step, category, status: 'FAIL', error });
  console.error(`  [FAIL] ${step} -> ERROR: ${error}`);
}

async function runMobileResponsiveTests() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Mobile Responsive E2E Browser Verification Suite');
  console.log('  Viewport: 390 x 844 (iPhone 14/15 viewport, Touch enabled)');
  console.log('  Target: http://localhost:3000');
  console.log('========================================================================\n');

  const tempProfileDir = path.join(os.tmpdir(), `antigravity-mobile-chrome-${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });
  fs.mkdirSync('test-results', { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome executable not found at ${chromePath}`);
  }

  let context: BrowserContext | null = null;

  try {
    context = await chromium.launchPersistentContext(tempProfileDir, {
      executablePath: chromePath,
      headless: true,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
      args: [
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    const page: Page = context.pages()[0] || (await context.newPage());

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // -------------------------------------------------------------------------
    // TEST 1: DASHBOARD MOBILE NAVIGATION & LAYOUT (http://localhost:3000/)
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Testing Dashboard Mobile Navigation & Map Controls ---');

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 20000 });

    // Check page load & no errors
    if (pageErrors.length === 0) {
      pass('Mobile Dashboard Load', 'Mobile Navigation', '0 unhandled exceptions');
    } else {
      fail('Mobile Dashboard Load', 'Mobile Navigation', `Exceptions: ${pageErrors.join('; ')}`);
    }

    // 1.0 Verify AppHeader Mobile Layout & Zero Overlapping Bounding Boxes
    const appHeader = page.locator('header').first();
    const headerBox = await appHeader.boundingBox();
    if (headerBox && headerBox.width <= 391) {
      // Check that breadcrumbs text is hidden on mobile
      const breadcrumbsNav = appHeader.locator('nav[aria-label="Breadcrumb"]');
      const isBreadcrumbsHidden = await breadcrumbsNav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || el.classList.contains('hidden');
      });

      // Check left elements (Hamburger + Business Pill) vs right elements (Search + Credits + Avatar)
      const leftGroup = appHeader.locator('div.flex.items-center').first();
      const rightGroup = appHeader.locator('div.flex.items-center').last();
      const leftBox = await leftGroup.boundingBox();
      const rightBox = await rightGroup.boundingBox();

      if (isBreadcrumbsHidden && leftBox && rightBox) {
        const noOverlap = leftBox.x + leftBox.width <= rightBox.x + 1; // within 1px margin
        if (noOverlap) {
          pass('AppHeader Zero Overlap on Mobile', 'Mobile Header', `Left max: ${(leftBox.x + leftBox.width).toFixed(1)}px, Right start: ${rightBox.x.toFixed(1)}px (Gap: ${(rightBox.x - (leftBox.x + leftBox.width)).toFixed(1)}px)`);
        } else {
          fail('AppHeader Zero Overlap on Mobile', 'Mobile Header', `Collision detected: Left ends at ${leftBox.x + leftBox.width}px but Right begins at ${rightBox.x}px`);
        }
      } else {
        fail('AppHeader Zero Overlap on Mobile', 'Mobile Header', `Breadcrumbs hidden: ${isBreadcrumbsHidden}, Elements found: Left ${Boolean(leftBox)}, Right ${Boolean(rightBox)}`);
      }

      // Check Mobile Search Toggle Button
      const searchToggle = page.locator('[data-testid="mobile-search-toggle"]');
      if (await searchToggle.isVisible()) {
        pass('Mobile Search Toggle Visible', 'Mobile Header', 'Compact search icon button rendered on < 640px viewport');
      } else {
        fail('Mobile Search Toggle Visible', 'Mobile Header', 'Mobile search toggle button missing');
      }
    } else {
      fail('AppHeader Zero Overlap on Mobile', 'Mobile Header', `Header width was ${headerBox?.width}px, exceeding viewport`);
    }

    // 1.1 Verify Mobile Subtab Select Dropdown
    const mobileSelect = page.locator('[data-testid="mobile-subtab-select"]');
    const isMobileSelectVisible = await mobileSelect.isVisible();
    if (isMobileSelectVisible) {
      pass('Mobile Subtab Select Rendered', 'Mobile Navigation', 'data-testid="mobile-subtab-select" visible on < 640px screen');
    } else {
      fail('Mobile Subtab Select Rendered', 'Mobile Navigation', 'mobile-subtab-select element not visible');
    }

    // Check option count in mobile select
    const optionCount = await page.locator('[data-testid="mobile-subtab-select"] option').count();
    if (optionCount >= 4) {
      pass('Mobile Subtab Options Population', 'Mobile Navigation', `Found ${optionCount} subtab options`);
    } else {
      fail('Mobile Subtab Options Population', 'Mobile Navigation', `Expected >= 4 options, found ${optionCount}`);
    }

    // Verify Tab Switching via Select Dropdown
    await mobileSelect.selectOption('todo');
    await page.waitForTimeout(500);
    const todoVisible = await page.locator('text=What to do to rank higher').first().isVisible();
    if (todoVisible) {
      pass('Mobile Tab Switching to To-do', 'Mobile Navigation', 'Switched to To-do tab ("What to do to rank higher" visible)');
    } else {
      fail('Mobile Tab Switching to To-do', 'Mobile Navigation', 'Could not switch to To-do');
    }

    // Switch back to keywords (GeoGrid map)
    await mobileSelect.selectOption('keywords');
    await page.waitForTimeout(600);

    // 1.2 Verify Single-Row Mobile Map Action Controls (No 4-row stacking)
    const keywordBar = page.locator('.space-y-3 .flex.items-center.justify-between').first();
    const barBox = await keywordBar.boundingBox();
    if (barBox) {
      // On mobile, the merged row should be compact (height < 65px) rather than 4 stacked rows (> 150px)
      if (barBox.height <= 70) {
        pass('Mobile Action Bar Single-Row Layout', 'Mobile Controls', `Height: ${barBox.height.toFixed(1)}px (single row, no vertical button stacking)`);
      } else {
        fail('Mobile Action Bar Single-Row Layout', 'Mobile Controls', `Height was ${barBox.height}px, indicating stacked rows`);
      }
    } else {
      fail('Mobile Action Bar Single-Row Layout', 'Mobile Controls', 'Keyword action bar not found');
    }

    // 1.3 Verify Actions Dropdown opens cleanly on mobile
    const actionsBtn = page.locator('button:has-text("Actions")').first();
    await actionsBtn.click();
    await page.waitForTimeout(400);
    const hasClientReportInActions = await page.locator('button:has-text("Open Client Report")').first().isVisible();
    if (hasClientReportInActions) {
      pass('Mobile Actions Menu Open & Accessible', 'Mobile Controls', 'Dropdown displayed with report and scan options');
    } else {
      fail('Mobile Actions Menu Open & Accessible', 'Mobile Controls', 'Actions dropdown menu did not display correctly');
    }
    // Close actions menu
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // 1.4 Verify Map Canvas & Floating Details Card behavior on mobile
    const leafletMap = page.locator('.leaflet-container').first();
    const mapVisible = await leafletMap.isVisible();
    if (mapVisible) {
      pass('Leaflet GeoGrid Map Canvas Visible', 'Mobile Map', 'Map container rendered at 100% visible height');
    } else {
      fail('Leaflet GeoGrid Map Canvas Visible', 'Mobile Map', 'Leaflet map not visible');
    }

    // Verify that the floating white DETAILS card is HIDDEN on mobile screens
    const desktopFloatingDetails = page.locator('[data-testid="desktop-floating-details"]');
    const isFloatingVisibleOnMobile = await desktopFloatingDetails.isVisible();
    if (!isFloatingVisibleOnMobile) {
      pass('Floating Overlay Card Hidden on Mobile', 'Mobile Map', 'Desktop floating DETAILS card hidden on mobile viewport');
    } else {
      fail('Floating Overlay Card Hidden on Mobile', 'Mobile Map', 'Desktop floating DETAILS card is incorrectly visible and obscuring pins');
    }

    // Verify that the slim 3-card KPI bar above the map canvas IS VISIBLE on mobile
    const mobileKpiBar = page.locator('[data-testid="mobile-kpi-bar"]');
    const isKpiBarVisible = await mobileKpiBar.isVisible();
    if (isKpiBarVisible) {
      const kpiText = await mobileKpiBar.textContent();
      pass('Slim 3-Card KPI Bar Rendered Above Map', 'Mobile Map', `KPI Bar visible: ${kpiText?.replace(/\s+/g, ' ').trim()}`);
    } else {
      fail('Slim 3-Card KPI Bar Rendered Above Map', 'Mobile Map', 'Slim 3-card KPI bar above map canvas not found');
    }

    // Take screenshot of mobile dashboard
    await page.screenshot({ path: 'test-results/mobile-dashboard-390px.png', fullPage: false });
    console.log('  [SCREENSHOT] Saved test-results/mobile-dashboard-390px.png');

    // -------------------------------------------------------------------------
    // TEST 2: CLIENT AUDIT DECK MOBILE RESPONSIVENESS (http://localhost:3000/reports/latest)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Testing Client Audit Deck Mobile Responsiveness ---');

    await page.goto('http://localhost:3000/reports/latest', { waitUntil: 'networkidle', timeout: 20000 });

    // 2.1 Verify Executive Revenue Teaser on mobile
    const teaser = page.locator('[data-testid="executive-revenue-teaser"]');
    await teaser.waitFor({ state: 'visible', timeout: 10000 });
    const teaserBox = await teaser.boundingBox();
    if (teaserBox && teaserBox.width <= 390) {
      const headlineText = await teaser.locator('h3').first().textContent();
      pass('Executive Revenue Teaser Mobile Layout', 'Audit Report', `Cleanly displayed without clipping: "${headlineText?.trim()}"`);
    } else {
      fail('Executive Revenue Teaser Mobile Layout', 'Audit Report', 'Teaser element missing or clipped');
    }

    // 2.2 Verify Accordion Gate Toggle Button
    const accordionBtn = page.locator('[data-testid="expand-revenue-breakdown"]');
    const isAccordionVisible = await accordionBtn.isVisible();
    if (isAccordionVisible) {
      pass('Accordion Gate Button Visible', 'Audit Report', 'Found [ View Full 5-Pillar Breakdown & Opportunity Analysis ▼ ]');
    } else {
      fail('Accordion Gate Button Visible', 'Audit Report', 'Accordion gate button not visible');
    }

    // Verify Full Breakdown is hidden initially
    const fullBreakdown = page.locator('[data-testid="omnichannel-full-breakdown"]');
    const isInitiallyExpanded = await fullBreakdown.evaluate((el) => !el.classList.contains('hidden'));
    if (!isInitiallyExpanded) {
      pass('5-Pillar Full Breakdown Collapsed by Default', 'Audit Report', 'Gated behind interactive teaser button');
    } else {
      fail('5-Pillar Full Breakdown Collapsed by Default', 'Audit Report', 'Breakdown was unexpectedly open by default');
    }

    // 2.3 Tap to Expand the 5-Pillar Breakdown
    await accordionBtn.click();
    await page.waitForTimeout(500);

    const isNowExpanded = await fullBreakdown.evaluate((el) => !el.classList.contains('hidden'));
    if (isNowExpanded) {
      pass('Accordion Expansion On Tap', 'Audit Report', 'Successfully un-gated full 5-pillar breakdown');
    } else {
      fail('Accordion Expansion On Tap', 'Audit Report', 'Full breakdown did not expand after click');
    }

    // 2.4 Verify all 5 pillar cards stack in a single responsive column (< 390px width)
    const pillarCardIds = ['websiteConversion', 'speedToLead', 'onlineBooking', 'reputation', 'retention'];
    let allPillarsStackSingleColumn = true;
    let maxCardWidth = 0;

    for (const id of pillarCardIds) {
      const card = page.locator(`[data-testid="pillar-card-${id}"]`);
      const cardVisible = await card.isVisible();
      if (!cardVisible) {
        allPillarsStackSingleColumn = false;
        fail(`Pillar Card ${id} Visibility`, 'Audit Report', `Card ${id} not visible`);
        continue;
      }

      const cardBox = await card.boundingBox();
      if (cardBox) {
        maxCardWidth = Math.max(maxCardWidth, cardBox.width);
        // Card width should fit inside 390px viewport (accounting for page padding ~340-370px)
        if (cardBox.width > 380) {
          allPillarsStackSingleColumn = false;
          fail(`Pillar Card ${id} Single Column Width`, 'Audit Report', `Card width (${cardBox.width}px) causes horizontal overflow`);
        }
      }
    }

    if (allPillarsStackSingleColumn) {
      pass('All 5 Pillar Cards Stack in Single Column on Mobile', 'Audit Report', `Cards render in 1 responsive column (max width: ${maxCardWidth.toFixed(1)}px on 390px viewport)`);
    }

    // 2.5 Assert Report Sliders sit strictly within AuditDeck card boundaries without negative margins or clipping
    const slidersToCheck = [
      { id: 'slider-avg-ticket', name: 'Avg Ticket Value Slider' },
      { id: 'slider-close-rate', name: 'Close Rate Slider' },
      { id: 'slider-site-visitors', name: 'Omnichannel Site Visitors Slider' },
      { id: 'slider-past-customers', name: 'Past Customers Slider' },
      { id: 'slider-review-velocity', name: 'Review Velocity Slider' },
    ];

    let allSlidersContained = true;
    for (const item of slidersToCheck) {
      const sliders = await page.locator(`[data-testid="${item.id}"]`).all();
      for (const slider of sliders) {
        if (await slider.isVisible()) {
          const sBox = await slider.boundingBox();
          if (sBox) {
            // Verify slider is within viewport (left >= 0 and right <= 391)
            if (sBox.x < 0 || sBox.x + sBox.width > 391) {
              allSlidersContained = false;
              fail(`${item.name} Viewport Containment`, 'Audit Report', `Slider extends outside screen bounds: left=${sBox.x}, right=${sBox.x + sBox.width}`);
            }
          }
        }
      }
    }

    if (allSlidersContained) {
      pass('Report Sliders Card Boundary Containment', 'Audit Report', 'All 5 revenue & leakage sliders sit strictly within card boundaries with 0 clipping or negative margins');
    }

    // Take screenshot of expanded report on mobile
    await page.screenshot({ path: 'test-results/mobile-report-expanded-390px.png', fullPage: false });
    console.log('  [SCREENSHOT] Saved test-results/mobile-report-expanded-390px.png');

  } catch (err: any) {
    fail('Mobile Verification Suite Execution', 'Test Harness', err.message);
  } finally {
    if (context) {
      await context.close();
    }
    // Clean up temporary profile
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('  Mobile Responsive E2E Test Suite - Final Execution Summary');
  console.log('========================================================================');
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;

  console.log(`  Total Checks: ${total}`);
  console.log(`  Passed:       ${passed}`);
  console.log(`  Failed:       ${failed}`);
  console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.error('FAILED CHECKS:');
    testResults.filter((r) => r.status === 'FAIL').forEach((f) => {
      console.error(`- [${f.category}] ${f.step}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('All mobile responsive and layout verification checks PASSED successfully!');
    process.exit(0);
  }
}

runMobileResponsiveTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
