import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://security.ironknight6.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'superadmin@techstart.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin123!';

test.describe('Complete Application Flow', () => {
  test('should demonstrate working authentication and CORS', async ({ page }) => {
    const consoleLogs: string[] = [];
    const apiCalls: string[] = [];

    // Capture ALL console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);

      // Log token-related messages
      if (text.includes('token') || text.includes('Token') || text.includes('Added')) {
        console.log(`[CONSOLE] ${text}`);
      }
    });

    // Capture network requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('execute-api') || url.includes('/api/v1/')) {
        const logEntry = `${request.method()} ${url}`;
        apiCalls.push(logEntry);
        console.log(`[REQUEST] ${logEntry}`);
      }
    });

    console.log('\n========================================');
    console.log('TEST: Complete Application Flow');
    console.log('========================================\n');

    // Step 1: Login
    console.log('STEP 1: Logging in...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    await page.getByLabel('Username').fill(TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(TEST_USER_PASSWORD);

    await page.screenshot({ path: 'screenshots/step1-login-form.png' });

    await page.getByRole('button', { name: 'Sign In' }).click();

    // Step 2: Verify successful login
    console.log('STEP 2: Verifying login success...');
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 30000 });

    await page.screenshot({ path: 'screenshots/step2-logged-in.png' });
    console.log('✓ Login successful - Sign Out button visible');

    // Step 3: Wait for initial dashboard API calls
    console.log('STEP 3: Waiting for dashboard to load...');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/step3-dashboard.png' });

    // Step 4: Navigate to Scanners page
    console.log('STEP 4: Navigating to Scanners page...');
    await page.getByRole('link', { name: 'Scanners' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/step4-scanners.png' });

    // Step 5: Navigate to Settings page
    console.log('STEP 5: Navigating to Settings page...');
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/step5-settings.png' });

    // Step 6: Navigate back to Dashboard
    console.log('STEP 6: Navigating back to Dashboard...');
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/step6-dashboard-again.png' });

    // Final wait for any remaining API calls
    await page.waitForTimeout(2000);

    // Analysis
    console.log('\n========================================');
    console.log('TEST RESULTS');
    console.log('========================================\n');

    const tokenLogs = consoleLogs.filter(log =>
      log.includes('Added ID token') || log.includes('Added Access token')
    );

    const corsErrors = consoleLogs.filter(log =>
      log.toLowerCase().includes('cors') && log.includes('[error]')
    );

    const authErrors = consoleLogs.filter(log =>
      (log.includes('401') || log.includes('403') || log.includes('Unauthorized')) &&
      log.includes('[error]')
    );

    console.log(`Token Type Logs: ${tokenLogs.length}`);
    tokenLogs.forEach(log => console.log(`  ${log}`));

    console.log(`\nAPI Requests Made: ${apiCalls.length}`);
    apiCalls.forEach((call, index) => console.log(`  ${index + 1}. ${call}`));

    console.log(`\nCORS Errors: ${corsErrors.length}`);
    if (corsErrors.length > 0) {
      corsErrors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('  ✓ No CORS errors!');
    }

    console.log(`\nAuthentication Errors: ${authErrors.length}`);
    if (authErrors.length > 0) {
      authErrors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('  ✓ No authentication errors!');
    }

    // Assertions
    console.log('\n========================================');
    console.log('ASSERTIONS');
    console.log('========================================\n');

    // Check for ID tokens (the fix we made)
    const hasIdTokens = tokenLogs.some(log => log.includes('ID token'));
    const hasAccessTokens = tokenLogs.some(log => log.includes('Access token') && !log.includes('ID token'));

    console.log(`Uses ID tokens: ${hasIdTokens ? '✓ YES' : '✗ NO'}`);
    console.log(`Uses Access tokens: ${hasAccessTokens ? '✗ YES (BAD)' : '✓ NO (GOOD)'}`);
    console.log(`CORS errors: ${corsErrors.length === 0 ? '✓ NONE' : `✗ ${corsErrors.length}`}`);
    console.log(`Auth errors: ${authErrors.length === 0 ? '✓ NONE' : `✗ ${authErrors.length}`}`);

    // Main assertions
    expect(hasIdTokens, 'Application should use ID tokens').toBe(true);
    expect(corsErrors.length, 'Should have no CORS errors').toBe(0);

    console.log('\n✓ All tests passed!');
    console.log('========================================\n');
  });
});
