import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Wait for login form - check for username/email input or Sign In button
    await page.waitForSelector('input[type="text"], input[type="email"], input[name="username"], button:has-text("Sign In")', { timeout: 15000 });
    
    // Login with superadmin credentials
    // Try different possible input selectors
    const usernameInput = page.locator('input[type="text"], input[type="email"], input[name="username"], label:has-text("Username") + input').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
    
    await usernameInput.fill('superadmin@techstart.com');
    await passwordInput.fill('SuperAdmin123!');
    await submitButton.click();
    
    // Wait for navigation to dashboard or for Sign Out button
    await Promise.race([
      page.waitForURL('**/', { timeout: 15000 }),
      page.waitForSelector('button:has-text("Sign Out")', { timeout: 15000 })
    ]);
  });

  test('should navigate to reports page and display chat logs', async ({ page }) => {
    // Navigate to reports page
    await page.goto(`${BASE_URL}/reports`);
    
    // Wait for reports page to load
    await page.waitForSelector('h1:has-text("Reports & Analytics")', { timeout: 10000 });
    
    // Verify page title
    await expect(page.locator('h1')).toContainText('Reports & Analytics');
    
    // Verify tabs are present
    await expect(page.locator('button:has-text("Chat Logs")')).toBeVisible();
    await expect(page.locator('button:has-text("Summary")')).toBeVisible();
    await expect(page.locator('button:has-text("Cost Analysis")')).toBeVisible();
    
    // Verify Chat Logs tab is active by default
    const chatLogsTab = page.locator('button:has-text("Chat Logs")');
    await expect(chatLogsTab).toHaveClass(/active/);
    
    // Wait for filters section
    await page.waitForSelector('h3:has-text("Filters")', { timeout: 5000 });
    
    // Verify filters are present
    await expect(page.locator('label:has-text("Provider")')).toBeVisible();
    await expect(page.locator('label:has-text("Status")')).toBeVisible();
    
    // Check if logs table is present (may be empty)
    const logsTable = page.locator('table.logs-table');
    await expect(logsTable).toBeVisible({ timeout: 5000 });
  });

  test('should display summary tab correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    
    // Click on Summary tab
    await page.click('button:has-text("Summary")');
    
    // Wait for summary content
    await page.waitForSelector('.summary-grid', { timeout: 10000 });
    
    // Verify summary cards are present
    const summaryCards = page.locator('.summary-card');
    await expect(summaryCards.first()).toBeVisible();
    
    // Verify at least one summary value is displayed
    const summaryValue = page.locator('.summary-value').first();
    await expect(summaryValue).toBeVisible();
  });

  test('should display cost analysis tab correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    
    // Click on Cost Analysis tab
    await page.click('button:has-text("Cost Analysis")');
    
    // Wait for cost summary content
    await page.waitForSelector('.cost-summary', { timeout: 10000 });
    
    // Verify cost overview cards are present
    const costCards = page.locator('.cost-card');
    await expect(costCards.first()).toBeVisible();
    
    // Verify cost breakdown sections are present
    await expect(page.locator('h3:has-text("By Provider")')).toBeVisible();
    await expect(page.locator('h3:has-text("By Model")')).toBeVisible();
  });

  test('should filter chat logs by provider', async ({ page }) => {
    await page.goto(`${BASE_URL}/reports`);
    
    // Wait for filters
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Select OpenAI provider
    const providerSelect = page.locator('label:has-text("Provider")').locator('..').locator('select').first();
    await providerSelect.selectOption('openai');
    
    // Wait a moment for the filter to apply
    await page.waitForTimeout(1000);
    
    // Verify the select has the correct value
    await expect(providerSelect).toHaveValue(/openai/);
  });

  test('should navigate from chatbot to reports', async ({ page }) => {
    // First, go to chat and send a message to generate a log
    await page.goto(`${BASE_URL}/chat`);
    
    // Wait for chat interface
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    
    // Send a test message
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('Hello, this is a test message');
    
    // Find and click send button
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    
    // Wait for response (with timeout in case it takes a while)
    await page.waitForTimeout(3000);
    
    // Navigate to reports
    await page.goto(`${BASE_URL}/reports`);
    
    // Verify reports page loaded
    await expect(page.locator('h1')).toContainText('Reports & Analytics');
    
    // Check if the log appears in the table (may take a moment)
    await page.waitForSelector('table.logs-table', { timeout: 10000 });
    
    // The log should appear (or at least the table should be visible)
    const logsTable = page.locator('table.logs-table');
    await expect(logsTable).toBeVisible();
  });
});

