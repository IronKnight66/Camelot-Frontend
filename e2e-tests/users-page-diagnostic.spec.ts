import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://security.ironknight6.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'superadmin@techstart.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin123!';

test.describe('Users Page Diagnostic', () => {
  test('should diagnose /admin/users page performance', async ({ page }) => {
    const apiCalls: { url: string; method: string; status: number; duration: number; timestamp: number }[] = [];
    const requestTimings: Map<string, number> = new Map();

    // Track request start times
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('execute-api') || url.includes('/api/')) {
        requestTimings.set(url, Date.now());
        console.log(`[REQUEST START] ${request.method()} ${url}`);
      }
    });

    // Track response times
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('execute-api') || url.includes('/api/')) {
        const startTime = requestTimings.get(url);
        const duration = startTime ? Date.now() - startTime : 0;

        const call = {
          url,
          method: response.request().method(),
          status: response.status(),
          duration,
          timestamp: Date.now()
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
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log(`[BROWSER ERROR] ${text}`);
      }
    });

    console.log('\n========================================');
    console.log('DIAGNOSTIC: /admin/users Page Performance');
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

    // Navigate to Settings/Users page
    console.log('Step 2: Navigating to Settings/Users page...');
    const navigationStart = Date.now();

    await page.goto(`${BASE_URL}/admin/users`);

    console.log('Waiting for network to be idle...');
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      const navigationDuration = Date.now() - navigationStart;
      console.log(`✓ Page loaded in ${navigationDuration}ms\n`);
    } catch (error) {
      const navigationDuration = Date.now() - navigationStart;
      console.log(`⚠️  Network did not go idle after ${navigationDuration}ms\n`);
    }

    // Wait a bit more to capture any delayed requests
    console.log('Waiting 5 more seconds to capture any slow requests...');
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/users-page-diagnostic.png', fullPage: true });

    // Analysis
    console.log('\n========================================');
    console.log('ANALYSIS');
    console.log('========================================\n');

    console.log(`Total API Calls: ${apiCalls.length}`);

    if (apiCalls.length === 0) {
      console.log('⚠️  NO API CALLS DETECTED!');
      console.log('This could mean:');
      console.log('  - Page is not making any API requests');
      console.log('  - Requests are being blocked');
      console.log('  - Requests are timing out before completing');
    } else {
      // Sort by duration
      const sortedCalls = [...apiCalls].sort((a, b) => b.duration - a.duration);

      console.log('\nAPI Calls (sorted by duration):');
      sortedCalls.forEach((call, index) => {
        const statusIcon = call.status >= 200 && call.status < 300 ? '✓' : '✗';
        const durationIcon = call.duration > 1000 ? '🐌' : call.duration > 500 ? '⚠️' : '⚡';
        console.log(`${index + 1}. ${statusIcon} ${durationIcon} ${call.method} ${call.url.split('/').pop()}`);
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

    // Check for timeout errors specifically
    const timeoutErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('timeout') ||
      e.toLowerCase().includes('econnaborted')
    );

    if (timeoutErrors.length > 0) {
      console.log('\n⚠️  TIMEOUT ERRORS DETECTED:');
      timeoutErrors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n========================================\n');

    // Assertions
    expect(consoleErrors.filter(e => e.includes('CORS')).length).toBe(0);
  });
});
