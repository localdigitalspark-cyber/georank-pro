/**
 * GeoRank Pro - Test Suite: Business Deletion & Lead Dismissal
 * Path: /scripts/test-delete-business.ts
 */

import { chromium, type BrowserContext, type Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function runDeleteBusinessTests() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Business Deletion & Lead Dismissal Test Suite');
  console.log('  Target: http://localhost:3000');
  console.log('========================================================================\n');

  // 1. API Verification: Cascade Deletion
  console.log('--- 1. Testing Backend DELETE /api/businesses/:id & Scan Cascade ---');

  // 1.1 Create disposable business
  const createRes = await fetch('http://localhost:3000/api/businesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Disposable Apex Plumbing ${Date.now()}`,
      category: 'Plumber',
      address: '500 E 4th St, Austin, TX 78701',
      lat: 30.2660,
      lng: -97.7400,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`POST /api/businesses failed: ${createRes.status}`);
  }
  const createJson = await createRes.json();
  const testBizId = createJson.business.id;
  console.log(`  [PASS] Created test business: ${createJson.business.name} (id: ${testBizId})`);

  // 1.2 Save an associated scan
  const scanSaveRes = await fetch('http://localhost:3000/api/scans/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanId: `scan_test_${Date.now()}`,
      businessId: testBizId,
      businessName: createJson.business.name,
      keyword: 'Plumber',
      center: { lat: 30.2660, lng: -97.7400 },
      gridSize: 3,
      distanceStep: 1,
      unit: 'km',
      audit: {
        businessName: createJson.business.name,
        category: 'Plumber',
        metrics: {
          averageRank: 4.5,
          top3Percentage: 33.3,
          totalNodesScanned: 9,
          gridSpanDescription: '3x3 grid across 3km',
          targetMarket: 'Metro Area',
        },
        topCompetitorsInWeakZones: [],
      },
      scanSummary: {
        scanId: `scan_test_${Date.now()}`,
        businessName: createJson.business.name,
        keyword: 'Plumber',
        center: { lat: 30.2660, lng: -97.7400 },
        gridSize: 3,
        distanceStep: 1,
        unit: 'km',
        totalNodes: 9,
        top3Percentage: 33.3,
        averageRank: 4.5,
        nodes: [],
      },
    }),
  });
  if (!scanSaveRes.ok) {
    throw new Error(`POST /api/scans/save failed: ${scanSaveRes.status}`);
  }
  console.log('  [PASS] Attached test scan to business');

  // Verify business & scan exist
  const getBizRes = await fetch(`http://localhost:3000/api/businesses/${testBizId}`);
  if (!getBizRes.ok) throw new Error('Test business not found before delete');
  const getScanRes = await fetch(`http://localhost:3000/api/scans?businessId=${encodeURIComponent(testBizId)}`);
  if (!getScanRes.ok) throw new Error('Test scan not found before delete');
  console.log('  [PASS] Verified business and cascaded scan exist in storage');

  // 1.3 DELETE business
  const deleteRes = await fetch(`http://localhost:3000/api/businesses/${testBizId}`, {
    method: 'DELETE',
  });
  if (!deleteRes.ok) throw new Error(`DELETE failed: ${deleteRes.status}`);
  const deleteJson = await deleteRes.json();
  if (!deleteJson.success || deleteJson.deletedId !== testBizId || deleteJson.deletedScansCount < 1) {
    throw new Error(`Unexpected delete response: ${JSON.stringify(deleteJson)}`);
  }
  console.log(`  [PASS] DELETE /api/businesses/${testBizId} returned success (purged ${deleteJson.deletedScansCount} scan)`);

  // Verify subsequent lookups return 404
  const postDeleteBiz = await fetch(`http://localhost:3000/api/businesses/${testBizId}`);
  if (postDeleteBiz.status !== 404) throw new Error(`Expected 404 for deleted business, got ${postDeleteBiz.status}`);
  const postDeleteScan = await fetch(`http://localhost:3000/api/scans?businessId=${encodeURIComponent(testBizId)}`);
  if (postDeleteScan.status !== 404) throw new Error(`Expected 404 for purged scan, got ${postDeleteScan.status}`);
  console.log('  [PASS] Verified business and cascaded scan return 404 after deletion');

  // 2. Browser E2E Tests with Isolated Profile
  console.log('\n--- 2. Browser E2E: Actions Dropdown Deletion & Find Businesses Dismissal ---');
  const tempProfileDir = path.join(os.tmpdir(), `antigravity-delete-profile-${Date.now()}`);
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

    // 2.1 Load Dashboard
    console.log('  Loading Dashboard on http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 2.2 Test "Actions" Dropdown Delete Business
    console.log('  Testing "Actions ⋮" dropdown delete flow...');
    const actionsBtn = page.locator('button:has-text("Actions")').first();
    await actionsBtn.waitFor({ state: 'visible', timeout: 5000 });
    await actionsBtn.click();
    await page.waitForTimeout(400);

    // Verify "Delete Business" option exists
    const deleteOption = page.locator('[data-testid="actions-delete-business-btn"]');
    await deleteOption.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  [PASS] "Delete Business" red option is rendered in Actions dropdown');

    // Click "Delete Business" to open confirmation modal
    await deleteOption.click();
    await page.waitForTimeout(400);

    // Verify confirmation modal is visible
    const modalHeading = page.locator('h3:has-text("Delete")');
    await modalHeading.waitFor({ state: 'visible', timeout: 3000 });
    console.log('  [PASS] Confirmation modal rendered with heading: ' + (await modalHeading.textContent()));

    // Test "Cancel" button
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await cancelBtn.click();
    await page.waitForTimeout(400);
    const modalVisible = await modalHeading.isVisible();
    if (modalVisible) throw new Error('Modal did not close on Cancel');
    console.log('  [PASS] Cancel button closed the confirmation modal cleanly');

    // Open Actions dropdown again and confirm deletion
    await actionsBtn.click();
    await page.waitForTimeout(300);
    await deleteOption.click();
    await page.waitForTimeout(300);

    const confirmDeleteBtn = page.locator('[data-testid="confirm-delete-business-btn"]');
    await confirmDeleteBtn.waitFor({ state: 'visible', timeout: 3000 });
    await confirmDeleteBtn.click();
    await page.waitForTimeout(1000);

    // Verify success toast appears
    const toast = page.locator('[data-testid="global-toast-notification"]');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    const toastText = await toast.textContent();
    console.log(`  [PASS] Success toast notification appeared: "${toastText?.trim()}"`);

    // 2.3 Test Lead Dismissal in "Find businesses" discovery view
    console.log('\n  Testing Lead Dismissal in "Find businesses" discovery view...');
    const findBizNav = page.locator('nav button:has-text("Find businesses")');
    await findBizNav.click();
    await page.waitForTimeout(1000);

    // Verify discovered leads are rendered
    const dismissFirstLeadBtn = page.locator('[data-testid="dismiss-prospect-pr-1"]');
    await dismissFirstLeadBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('  [PASS] Discovered lead cards render with trash/dismiss buttons');

    // Click dismiss button on first prospect (Lone Star Heritage Roofing)
    await dismissFirstLeadBtn.click();
    await page.waitForTimeout(500);

    // Verify card is removed from DOM
    const leadAfterDismiss = await page.locator('[data-testid="dismiss-prospect-pr-1"]').count();
    if (leadAfterDismiss !== 0) throw new Error('Prospect card was not removed from DOM after dismissal');
    console.log('  [PASS] Prospect card was removed from discovery list');

    // Verify dismissal toast notification
    const prospectToast = page.locator('[data-testid="prospect-dismiss-toast"]');
    await prospectToast.waitFor({ state: 'visible', timeout: 3000 });
    const prospectToastText = await prospectToast.textContent();
    console.log(`  [PASS] Prospect dismissal toast appeared: "${prospectToastText?.trim()}"`);

    // Verify localStorage persistence
    const dismissedInStorage = await page.evaluate(() => {
      return localStorage.getItem('georank_dismissed_prospects');
    });
    console.log(`  [PASS] localStorage georank_dismissed_prospects: ${dismissedInStorage}`);
    if (!dismissedInStorage?.includes('pr-1')) {
      throw new Error('Dismissed lead id pr-1 was not persisted in localStorage');
    }

    console.log('\n========================================================================');
    console.log('  ALL BUSINESS DELETION & DISMISSAL TESTS PASSED (100%)');
    console.log('========================================================================\n');
  } finally {
    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

runDeleteBusinessTests().catch((err) => {
  console.error('\n[FATAL TEST ERROR]', err);
  process.exit(1);
});
