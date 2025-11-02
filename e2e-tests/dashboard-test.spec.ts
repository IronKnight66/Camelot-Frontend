import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://security.ironknight6.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'superadmin@techstart.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin123!';

test.describe('Dashboard Authentication Test', () => {
  test('should login and load dashboard with API calls', async ({ page }) => {
    const apiCalls: { url: string; status: number; method: string }[] = [];
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture API responses
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('execute-api') || url.includes('/api/')) {
        apiCalls.push({
          url,
          status: response.status(),
          method: response.request().method(),
        });
        console.log(`API Call: ${response.request().method()} ${url} - ${response.status()}`);
      }
    });

    // Navigate to login page
    console.log('\n=== Logging in ===');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    // Login
    await page.getByLabel('Username').fill(TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for successful login
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 30000 });
    console.log('✓ Login successful');

    // Wait for dashboard to load and make API calls
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/dashboard-test.png', fullPage: true });

    // Log results
    console.log(`\n=== API Calls (${apiCalls.length} total) ===`);
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url} - ${call.status}`);
    });

    console.log(`\n=== Console Errors (${consoleErrors.length} total) ===`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('None!');
    }

    // Assertions
    const corsErrors = consoleErrors.filter(e => e.toLowerCase().includes('cors'));
    console.log(`\n=== Test Results ===`);
    console.log(`CORS Errors: ${corsErrors.length}`);
    console.log(`API Calls Made: ${apiCalls.length}`);
    console.log(`Successful API Calls: ${apiCalls.filter(c => c.status >= 200 && c.status < 300).length}`);

    // Test assertions
    expect(corsErrors.length).toBe(0);
    expect(apiCalls.length).toBeGreaterThan(0);

    const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    expect(successfulCalls.length).toBeGreaterThan(0);
  });
});
