/**
 * Test Live DataForSEO Integration, Fail Loudly behavior, Enter key prevention, and Report Audit Trail
 */
import { chromium } from 'playwright-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

async function testLiveSerpAndAuditTrail() {
  console.log('--- Testing Live DataForSEO & Audit Trail ---');

  // 1. Direct Backend Test of /api/scan with mode: 'live'
  console.log('1. Testing /api/scan endpoint directly with mode: live (Alton UK)...');
  const liveScanRes = await fetch('http://localhost:3000/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Ace Plumbing',
      keyword: 'emergency plumber',
      lat: 51.1492,
      lng: -0.9782,
      gridSize: 3, // 3x3 for quick live test
      distanceStep: 1.0,
      unit: 'km',
      mode: 'live',
    }),
  });

  const liveScanJson = await liveScanRes.json();
  console.log('Live Scan Response HTTP Status:', liveScanRes.status);
  console.log('Live Scan Success:', liveScanJson.success);
  if (!liveScanJson.success) {
    throw new Error(`Live scan failed: ${JSON.stringify(liveScanJson)}`);
  }

  const summary = liveScanJson.data;
  console.log('Scan ID:', summary.scanId);
  console.log('Mode:', summary.mode);
  console.log('Provider:', summary.provider);
  console.log('Primary Check URL:', summary.checkUrl);
  console.log('Task ID:', summary.taskId);
  console.log('Total Dominant Competitors captured:', summary.dominantCompetitors?.length);
  console.log('Competitor 1:', summary.dominantCompetitors?.[0]);

  if (summary.mode !== 'live') {
    throw new Error(`Expected mode to be 'live', got ${summary.mode}`);
  }
  if (!summary.checkUrl || !summary.checkUrl.includes('google')) {
    throw new Error(`Expected Google checkUrl in summary, got: ${summary.checkUrl}`);
  }
  if (!summary.dominantCompetitors || summary.dominantCompetitors.length === 0) {
    throw new Error('Expected real competitors captured from Google Maps response');
  }

  console.log('✅ Backend Live SERP endpoint query succeeded with real Google Maps data!');

  // 2. Persist this live scan to /api/scans/save so we can verify the client report view
  console.log('\n2. Persisting live scan to /api/scans/save...');
  const saveRes = await fetch('http://localhost:3000/api/scans/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanId: summary.scanId,
      scanSummary: summary,
      businessName: 'Ace Plumbing',
      keyword: 'emergency plumber',
      audit: {
        executiveSummary: 'Live test audit summary',
        missedRevenueEstimate: 'Live test revenue estimate',
        actionPlan: {
          gbpCategories: 'Primary category check',
          citations: 'Local citation sync',
          reviews: 'Customer review generation',
          onPageLocalizedContent: 'Service area pages',
        },
      },
    }),
  });
  const saveJson = await saveRes.json();
  console.log('Save response:', saveJson);

  // 2b. Persist a mock demo scan to test simulated mode banner
  console.log('\n2b. Persisting mock demo scan to test simulated warning badge...');
  await fetch('http://localhost:3000/api/scans/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scanId: 'mock_audit_test',
      scanSummary: {
        ...summary,
        scanId: 'mock_audit_test',
        mode: 'mock',
        checkUrl: undefined,
        taskId: undefined,
      },
      businessName: 'Ace Plumbing (Mock Demo)',
      keyword: 'emergency plumber',
      mode: 'mock',
      audit: {
        executiveSummary: 'Mock test audit summary',
        missedRevenueEstimate: 'Mock test revenue estimate',
        actionPlan: {
          gbpCategories: 'Primary category check',
          citations: 'Local citation sync',
          reviews: 'Customer review generation',
          onPageLocalizedContent: 'Service area pages',
        },
      },
    }),
  });

  // 3. Browser E2E Check on UI: NewScanModal enter key prevention, two-step confirmation, and report views
  console.log('\n3. Testing browser UI for Enter key prevention and Two-Step Confirmation...');
  const tempProfileDir = path.join(os.tmpdir(), `antigravity-live-test-${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const context = await chromium.launchPersistentContext(tempProfileDir, {
    executablePath: chromePath,
    headless: true,
    viewport: { width: 1440, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });

  try {
    const page = context.pages()[0] || (await context.newPage());

    // 3a. Open Dashboard and trigger New Scan modal
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const newScanBtn = page.locator('button:has-text("New scan")').first();
    await newScanBtn.click();
    await page.waitForTimeout(500);

    // Verify modal is open
    const modalHeader = page.locator('text=Launch New Keyword Scan');
    if (!(await modalHeader.isVisible())) {
      throw new Error('New Scan Modal did not open');
    }

    // Select "Live Google Maps"
    const liveModeBtn = page.locator('button:has-text("Live Google Maps")').first();
    await liveModeBtn.click();
    await page.waitForTimeout(300);

    // Type in keyword field and press Enter -> Verify it does NOT submit
    const keywordInput = page.locator('input[placeholder*="Emergency Plumber"]').first();
    await keywordInput.fill('Emergency Drain Specialist');
    await keywordInput.press('Enter');
    await page.waitForTimeout(500);

    // Modal should still be open (Enter was prevented!)
    if (!(await modalHeader.isVisible())) {
      throw new Error('Pressing Enter in input prematurely submitted the modal!');
    }
    console.log('  [PASS] Pressing Enter in input field was prevented and did not submit!');

    // Click "Run Geo-Grid Scan" -> Verify Two-Step Confirmation opens!
    const runScanBtn = page.locator('button:has-text("Run Geo-Grid Scan")').first();
    await runScanBtn.click();
    await page.waitForTimeout(500);

    const confirmTitle = page.locator('text=Confirm Live Google Maps SERP Scan');
    if (!(await confirmTitle.isVisible())) {
      throw new Error('Two-Step confirmation dialog did not appear for Live scan!');
    }
    console.log('  [PASS] Two-Step Confirmation dialog appeared for Live scan with credit deduction warning!');

    // Dismiss confirmation
    const cancelConfirmBtn = page.locator('[data-testid="cancel-live-confirmation"]').first();
    await cancelConfirmBtn.click();
    await page.waitForTimeout(300);

    // Close modal
    const closeModalBtn = page.locator('[data-testid="close-scan-modal"]').first();
    await closeModalBtn.click();
    await page.waitForTimeout(300);

    // 3b. Verify Report with Mock Mode shows "SIMULATED DEMO AUDIT" banner
    console.log('\n4. Verifying Report for mock scan shows SIMULATED DEMO AUDIT banner...');
    await page.goto('http://localhost:3000/reports/mock_audit_test', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const hasSimulatedBanner = await page.locator('text=SIMULATED DEMO AUDIT').first().isVisible();
    if (!hasSimulatedBanner) {
      throw new Error('Expected SIMULATED DEMO AUDIT banner on mock scan report');
    }
    console.log('  [PASS] Mock scan report displays bold SIMULATED DEMO AUDIT banner!');

    // 3c. Verify Report with Live Mode shows "Data Verification & Audit Trail"
    console.log('\n5. Verifying Report for live scan shows Data Verification & Audit Trail...');
    await page.goto(`http://localhost:3000/reports/${summary.scanId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const hasAuditTrailBox = await page.locator('text=Data Verification & Audit Trail').first().isVisible();
    if (!hasAuditTrailBox) {
      throw new Error('Expected Data Verification & Audit Trail box on live scan report');
    }

    // Click "View Raw SERP Evidence & Google Search URLs"
    const evidenceBtn = page.locator('button:has-text("View Raw SERP Evidence & Google Search URLs")').first();
    await evidenceBtn.click();
    await page.waitForTimeout(500);

    const hasSerpLink = await page.locator('text=Direct Google Maps Verification URL:').first().isVisible();
    if (!hasSerpLink) {
      throw new Error('Expected Google Maps verification link in expanded audit trail');
    }
    console.log('  [PASS] Live scan report displays Data Verification & Audit Trail with direct Google Maps verification URL!');

  } finally {
    await context.close();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }

  console.log('\n========================================================================');
  console.log('✅ ALL LIVE SERP, AUDIT TRAIL, AND ENTER PREVENTION TESTS PASSED!');
  console.log('========================================================================');
}

testLiveSerpAndAuditTrail().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
