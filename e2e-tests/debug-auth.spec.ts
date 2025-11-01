import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://security.ironknight6.com';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'superadmin@techstart.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'SuperAdmin123!';

test.describe('Debug Authentication', () => {
  test('should capture console logs showing token type', async ({ page }) => {
    const consoleLogs: string[] = [];

    // Capture ALL console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, text);
    });

    // Navigate and login
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    await page.getByLabel('Username').fill(TEST_USER_EMAIL);
    await page.getByLabel('Password').fill(TEST_USER_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for login
    await page.waitForSelector('button:has-text("Sign Out")', { timeout: 30000 });

    console.log('\n=== Navigating to /admin/users to trigger API call ===');

    // Navigate to user management
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Log all console messages
    console.log('\n=== All Browser Console Logs ===');
    const tokenLogs = consoleLogs.filter(log =>
      log.includes('token') ||
      log.includes('Token') ||
      log.includes('session') ||
      log.includes('Session') ||
      log.includes('Authorization') ||
      log.includes('authorization')
    );

    console.log('\nToken-related logs:');
    tokenLogs.forEach(log => console.log(log));

    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-auth.png', fullPage: true });
  });
});
