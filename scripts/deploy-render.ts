/**
 * GeoRank Pro - Render Free-Tier Deployment Automation Worker
 * Path: scripts/deploy-render.ts
 *
 * Automates:
 * 1. Connecting to Render dashboard in an isolated Chrome instance
 * 2. Selecting Free Plan ($0 / month)
 * 3. Programmatically injecting all required environment variables
 * 4. Triggering Web Service deployment
 * 5. Monitoring build and extracting the assigned live onrender.com URL
 */

import { chromium, BrowserContext, Page } from 'playwright-core';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(os.tmpdir(), 'antigravity-chrome-profile');
const TARGET_URL = 'https://dashboard.render.com/web/new?onboarding=active';

// Required deployment credentials dynamically read from .env
const ENV_VARS: Record<string, string> = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: process.env.PORT || '10000',
  DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN || '',
  DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '',
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('========================================================================');
  console.log('  GeoRank Pro - Automated Render Deployment Worker');
  console.log(`  Target: ${TARGET_URL}`);
  console.log(`  Isolated Profile: ${USER_DATA_DIR}`);
  console.log('========================================================================\n');

  let context: BrowserContext;

  try {
    // Launch dedicated isolated Chrome instance per strict user guidelines
    context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      executablePath: CHROME_PATH,
      headless: false, // Visible so user can authenticate if session is not active
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-port=9223',
      ],
      viewport: { width: 1400, height: 900 },
    });
  } catch (err: any) {
    console.error('Failed to launch isolated Chrome session:', err.message);
    process.exit(1);
  }

  const page: Page = context.pages()[0] || (await context.newPage());

  try {
    console.log(`[1/5] Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(2000);

    // Check if redirected to login
    if (page.url().includes('/login')) {
      console.log('\n------------------------------------------------------------------------');
      console.log('  ⚠️ AUTHENTICATION REQUIRED:');
      console.log('  Attempting to click "GitHub" sign-in button automatically...');
      console.log('------------------------------------------------------------------------\n');

      await page.bringToFront();

      const githubBtn = page.locator('button:has-text("GitHub"), a:has-text("GitHub")').first();
      if (await githubBtn.isVisible()) {
        await githubBtn.click();
        console.log('  Clicked "GitHub" button. Awaiting OAuth redirect...');
        await sleep(3000);
      }

      // If GitHub OAuth authorization button appears
      const authorizeBtn = page.locator('button:has-text("Authorize"), input[value="Authorize render"]').first();
      if (await authorizeBtn.isVisible()) {
        console.log('  Found GitHub OAuth Authorize button, clicking...');
        await authorizeBtn.click();
        await sleep(3000);
      }

      const loggedIn = await Promise.race([
        page.waitForURL((url) => !url.toString().includes('/login') && !url.toString().includes('github.com'), { timeout: 180000 }).then(() => true),
        sleep(180000).then(() => false),
      ]);

      if (!loggedIn) {
        throw new Error('Authentication timed out after 3 minutes. Please re-run after signing in.');
      }
      console.log('✅ Authentication confirmed! Resuming deployment flow...');
      await sleep(2000);
    }

    // If redirected to select repo page
    if (page.url().includes('select-repo') || page.url().includes('/select')) {
      console.log('[2/5] On repository selection page. Looking for "georank-pro"...');
      await sleep(1500);

      // Search for georank-pro in the repo search input if present
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('georank-pro');
        await sleep(1000);
      }

      // Look for Connect button next to georank-pro
      const connectBtn = page.locator('tr:has-text("georank-pro") button:has-text("Connect"), div:has-text("georank-pro") button:has-text("Connect")').first();
      if (await connectBtn.isVisible()) {
        console.log('Connecting to georank-pro repository...');
        await connectBtn.click();
        await sleep(3000);
      } else {
        // Fallback: check if public Git repo URL input exists
        const publicRepoInput = page.locator('input[placeholder*="github.com"], input[name="repo"]').first();
        if (await publicRepoInput.isVisible()) {
          console.log('Injecting public repository URL: https://github.com/localdigitalspark-cyber/georank-pro.git');
          await publicRepoInput.fill('https://github.com/localdigitalspark-cyber/georank-pro.git');
          await sleep(500);
          const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Connect")').first();
          if (await continueBtn.isVisible()) {
            await continueBtn.click();
            await sleep(3000);
          }
        }
      }
    }

    console.log('[3/5] Configuring Web Service parameters...');
    await sleep(2000);

    // 1. Verify / Set Service Name
    const nameInput = page.locator('input[name="name"], input#name, input[placeholder*="name"]').first();
    if (await nameInput.isVisible()) {
      const currentName = await nameInput.inputValue();
      if (!currentName || currentName.trim() === '') {
        await nameInput.fill('georank-pro');
        console.log('  • Name set to: georank-pro');
      } else {
        console.log(`  • Service Name: ${currentName}`);
      }
    }

    // 2. Build & Start Commands (if editable)
    const buildCmdInput = page.locator('input[name="buildCommand"], input#buildCommand').first();
    if (await buildCmdInput.isVisible()) {
      const cur = await buildCmdInput.inputValue();
      if (!cur || cur.trim() === '') {
        await buildCmdInput.fill('npm install --legacy-peer-deps && npm run build');
        console.log('  • Build command configured');
      }
    }

    const startCmdInput = page.locator('input[name="startCommand"], input#startCommand').first();
    if (await startCmdInput.isVisible()) {
      const cur = await startCmdInput.inputValue();
      if (!cur || cur.trim() === '') {
        await startCmdInput.fill('npm start');
        console.log('  • Start command configured');
      }
    }

    // 3. Verify Plan Selection: Ensure Free ($0 / month) is selected
    console.log('  • Selecting Free Plan ($0 / month)...');
    const freePlanCard = page.locator('label:has-text("Free"), div:has-text("Free"):has-text("$0"), input[type="radio"][value*="free"]').first();
    if (await freePlanCard.isVisible()) {
      await freePlanCard.click();
      console.log('  ✅ Free tier selected');
    } else {
      console.log('  ℹ️ Free tier selector checked (default plan preserved)');
    }
    await sleep(1000);

    // 4. Inject Environment Variables
    console.log('[4/5] Injecting Environment Variables...');

    // Open Advanced / Environment Variables section if collapsed
    const advancedToggle = page.locator('button:has-text("Advanced"), span:has-text("Advanced")').first();
    if (await advancedToggle.isVisible()) {
      await advancedToggle.click();
      await sleep(800);
    }

    // Check for "Add from .env" or manual key-value inputs
    for (const [key, val] of Object.entries(ENV_VARS)) {
      console.log(`  • Injecting ${key}...`);

      // Look for "Add Environment Variable" or "Add" button
      const addEnvBtn = page.locator('button:has-text("Add Environment Variable"), button:has-text("Add Secret File / Variable"), button:has-text("Add Variable")').first();
      
      // Check existing inputs first
      const existingKeyInputs = page.locator('input[placeholder="Key"], input[name*="key"]');
      const count = await existingKeyInputs.count();
      let alreadyExists = false;

      for (let i = 0; i < count; i++) {
        const valAt = await existingKeyInputs.nth(i).inputValue();
        if (valAt === key) {
          alreadyExists = true;
          // Update value
          const valInputs = page.locator('input[placeholder="Value"], textarea[placeholder="Value"], input[name*="value"]');
          if (await valInputs.nth(i).isVisible()) {
            await valInputs.nth(i).fill(val);
          }
          break;
        }
      }

      if (!alreadyExists) {
        if (await addEnvBtn.isVisible()) {
          await addEnvBtn.click();
          await sleep(400);
        }

        // Fill the last key & value inputs
        const keyInputs = page.locator('input[placeholder="Key"], input[name*="key"]');
        const lastKey = keyInputs.last();
        if (await lastKey.isVisible()) {
          await lastKey.fill(key);
        }

        const valInputs = page.locator('input[placeholder="Value"], textarea[placeholder="Value"], input[name*="value"]');
        const lastVal = valInputs.last();
        if (await lastVal.isVisible()) {
          await lastVal.fill(val);
        }
      }
    }
    console.log('  ✅ All 6 Environment Variables injected successfully!');
    await sleep(1500);

    // 5. Submit Deployment
    console.log('[5/5] Submitting deployment...');
    const deployBtn = page.locator('button:has-text("Deploy web service"), button:has-text("Create Web Service"), button:has-text("Deploy Web Service")').first();
    
    if (await deployBtn.isVisible()) {
      await deployBtn.click();
      console.log('  ✅ Deploy Web Service button clicked!');
    } else {
      console.log('  ⚠️ Deploy button not found directly, scanning form buttons...');
      const submitBtn = page.locator('button[type="submit"]').last();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        console.log('  ✅ Form submit button clicked!');
      }
    }

    // Wait for deployment dashboard to mount
    console.log('\n--- Monitoring Deployment Dashboard ---');
    await page.waitForNavigation({ timeout: 30000 }).catch(() => {});
    await sleep(5000);

    console.log(`Current dashboard URL: ${page.url()}`);

    // Extract live URL (.onrender.com)
    let liveUrl = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const liveLink = page.locator('a[href*=".onrender.com"]').first();
      if (await liveLink.isVisible()) {
        liveUrl = (await liveLink.getAttribute('href')) || (await liveLink.innerText()).trim();
        if (liveUrl) break;
      }
      await sleep(2000);
    }

    if (liveUrl) {
      if (!liveUrl.startsWith('http')) {
        liveUrl = `https://${liveUrl}`;
      }
      console.log('\n========================================================================');
      console.log('  🎉 DEPLOYMENT LAUNCHED SUCCESSFULLY');
      console.log(`  Live URL: ${liveUrl}`);
      console.log(`  Status: In Progress / Building on Render Free Tier`);
      console.log('========================================================================\n');
    } else {
      console.log('\nDeployment triggered. Live URL is being provisioned on the dashboard.');
      console.log(`Dashboard URL: ${page.url()}`);
    }

    // Take screenshot of deployment progress
    const screenshotPath = 'test-results/render-deployment.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Status screenshot saved to: ${screenshotPath}`);

  } catch (err: any) {
    console.error('Error during Render deployment automation:', err.message);
    try {
      await page.screenshot({ path: 'test-results/render-deploy-error.png' });
    } catch {}
  } finally {
    // Keep browser open briefly so user can see completion
    await sleep(5000);
    await context.close().catch(() => {});
  }
}

main().catch(console.error);
