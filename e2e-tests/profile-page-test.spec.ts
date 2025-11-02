import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://security.ironknight6.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'superadmin@techstart.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin123!';

test.describe('Profile Page Test', () => {
  test('should check profile page functionality', async ({ page }) => {
    const apiCalls: { url: string; method: string; status: number; duration: number }[] = [];
    const requestTimings: Map<string, number> = new Map();
    const consoleErrors: string[] = [];

    // Track request start times
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('execute-api') || url.includes('/api/') || url.includes('/auth/')) {
        requestTimings.set(url, Date.now());
        console.log(`[REQUEST] ${request.method()} ${url}`);
      }
    });

    // Track response times
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('execute-api') || url.includes('/api/') || url.includes('/auth/')) {
        const startTime = requestTimings.get(url);
        const duration = startTime ? Date.now() - startTime : 0;

        const call = {
          url,
          method: response.request().method(),
          status: response.status(),
          duration
        };

        apiCalls.push(call);

        console.log(`[RESPONSE] ${call.method} ${url}`);
        console.log(`  Status: ${call.status}`);
        console.log(`  Duration: ${duration}ms`);

        if (duration > 1000) {
          console.log(`  ⚠️  SLOW REQUEST - took ${duration}ms`);
        }
      }
    });

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log(`[BROWSER ERROR] ${text}`);
      }
    });

    console.log('\n========================================');
    console.log('TEST: Profile Page Check');
    console.log('========================================\n');

    // Login
    console.log('Step 1: Logging in...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    await page.getByLabel('Username').fill(TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 30000 });
    console.log('✓ Login successful\n');

    // Navigate to Profile page
    console.log('Step 2: Navigating to Profile page...');
    await page.waitForTimeout(2000);

    // Try to find and click profile link
    try {
      // Look for profile link - might be in a dropdown or menu
      const profileLink = page.locator('text=Profile').or(page.locator('a[href*="profile"]')).first();
      const isVisible = await profileLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await profileLink.click();
        console.log('✓ Clicked Profile link');
      } else {
        // Try clicking on user menu/avatar
        const userMenu = page.locator('[data-testid="user-menu"]').or(page.getByRole('button', { name: /user|account|profile/i })).first();
        const menuVisible = await userMenu.isVisible({ timeout: 5000 }).catch(() => false);

        if (menuVisible) {
          await userMenu.click();
          await page.waitForTimeout(500);
          await page.locator('text=Profile').click();
          console.log('✓ Opened user menu and clicked Profile');
        } else {
          // Try direct navigation
          await page.goto(`${BASE_URL}/profile`);
          console.log('✓ Navigated directly to /profile');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not find profile link, trying direct navigation');
      await page.goto(`${BASE_URL}/profile`);
    }

    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/profile-page.png', fullPage: true });

    // Check page content
    console.log('\nStep 3: Checking page content...');
    const pageContent = await page.content();

    // Look for profile-related elements
    const hasProfileForm = pageContent.toLowerCase().includes('profile') ||
                          pageContent.toLowerCase().includes('account') ||
                          pageContent.toLowerCase().includes('settings');

    console.log(`Profile-related content found: ${hasProfileForm ? '✓ YES' : '✗ NO'}`);

    // Analysis
    console.log('\n========================================');
    console.log('ANALYSIS');
    console.log('========================================\n');

    console.log(`Total API Calls: ${apiCalls.length}`);

    if (apiCalls.length > 0) {
      const sortedCalls = [...apiCalls].sort((a, b) => b.duration - a.duration);

      console.log('\nAPI Calls (sorted by duration):');
      sortedCalls.forEach((call, index) => {
        const statusIcon = call.status >= 200 && call.status < 300 ? '✓' : '✗';
        const durationIcon = call.duration > 1000 ? '🐌' : call.duration > 500 ? '⚠️' : '⚡';
        const urlPath = new URL(call.url).pathname;
        console.log(`${index + 1}. ${statusIcon} ${durationIcon} ${call.method} ${urlPath}`);
        console.log(`   Status: ${call.status} | Duration: ${call.duration}ms`);
      });

      const slowCalls = apiCalls.filter(c => c.duration > 1000);
      const failedCalls = apiCalls.filter(c => c.status >= 400);

      console.log(`\nSlow calls (>1s): ${slowCalls.length}`);
      console.log(`Failed calls (4xx/5xx): ${failedCalls.length}`);

      const avgDuration = apiCalls.reduce((sum, c) => sum + c.duration, 0) / apiCalls.length;
      console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
    }

    console.log(`\nConsole Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n========================================\n');

    // Assertions
    expect(consoleErrors.filter(e => e.includes('CORS')).length).toBe(0);
  });
});
