import { test, expect } from '@playwright/test';

// Load environment variables
const BASE_URL = process.env.BASE_URL || 'https://security.ironknight6.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'superadmin@techstart.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin123!';

test.describe('Login and API Testing', () => {
  test('should login and make API calls without CORS errors', async ({ page }) => {
    // Track console errors and network failures
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    const apiCalls: { url: string; status: number; headers: any }[] = [];

    // Listen to console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen to all network requests
    page.on('response', async (response) => {
      const url = response.url();

      // Track API Gateway calls
      if (url.includes('execute-api.us-east-1.amazonaws.com')) {
        const headers = await response.allHeaders();
        apiCalls.push({
          url,
          status: response.status(),
          headers,
        });

        // Check for CORS errors
        if (!headers['access-control-allow-origin']) {
          networkErrors.push(`CORS header missing on ${url} (status: ${response.status()})`);
        }
      }

      // Track failed requests
      if (!response.ok()) {
        networkErrors.push(`Failed request: ${url} - Status ${response.status()}`);
      }
    });

    // Navigate to login page
    console.log('Navigating to:', BASE_URL);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });

    // Wait for login form - look for Sign In heading
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    // Fill in login credentials
    console.log('Filling login form with:', TEST_USER_EMAIL);

    // Fill username field - use label association or visible input fields
    await page.getByLabel('Username').fill(TEST_USER_EMAIL);

    // Fill password field
    await page.getByLabel('Password').fill(TEST_USER_PASSWORD);

    // Take screenshot before submit
    await page.screenshot({ path: 'screenshots/02-before-login.png', fullPage: true });

    // Submit login form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for navigation after login
    console.log('Waiting for login to complete...');
    // Wait for successful login - look for sign out button
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 30000 });

    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });

    // Navigate to user management page (will trigger API calls)
    console.log('Navigating to user management...');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');

    // Wait a bit for API calls to complete
    await page.waitForTimeout(3000);

    // Take screenshot of user management page
    await page.screenshot({ path: 'screenshots/04-user-management.png', fullPage: true });

    // Log all API calls
    console.log('\n=== API Calls Made ===');
    apiCalls.forEach((call, index) => {
      console.log(`\n${index + 1}. ${call.url}`);
      console.log(`   Status: ${call.status}`);
      console.log(`   CORS Header: ${call.headers['access-control-allow-origin'] || 'MISSING'}`);
      console.log(`   Authorization: ${call.headers['authorization'] ? 'Present' : 'Missing'}`);
    });

    // Log errors
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n=== Network Errors ===');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Assertions
    expect(consoleErrors.filter(e => e.includes('CORS')).length).toBe(0);
    expect(apiCalls.length).toBeGreaterThan(0);

    // Check that at least some API calls succeeded
    const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    console.log(`\nSuccessful API calls: ${successfulCalls.length}/${apiCalls.length}`);
  });

  test('should check authentication token in requests', async ({ page }) => {
    let authToken: string | null = null;

    // Capture the Authorization header from requests
    page.on('request', (request) => {
      const headers = request.headers();
      if (headers['authorization']) {
        authToken = headers['authorization'];
      }
    });

    // Login
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    await page.getByLabel('Username').fill(TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 30000 });

    // Navigate to trigger API call
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if auth token was sent
    console.log('\n=== Authentication Token ===');
    if (authToken) {
      console.log('Authorization header is present');
      console.log('Token preview:', authToken.substring(0, 50) + '...');
    } else {
      console.log('WARNING: No Authorization header found in requests!');
    }

    expect(authToken).not.toBeNull();
  });
});
