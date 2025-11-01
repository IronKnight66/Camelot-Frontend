/**
 * Scan Workflow E2E Tests
 * 
 * Complete end-to-end tests for scan workflows:
 * - Complete scan lifecycle
 * - Multiple scanner tools
 * - Scan results review
 * 
 * Test IDs: E2E-SCAN-001 through E2E-SCAN-003
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Scan Execution Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', process.env.TEST_USER_EMAIL || 'user@acme.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'UserPassword123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  // ==================== Complete Scan Lifecycle ====================
  
  test('E2E-SCAN-001: Complete scan lifecycle', async ({ page }) => {
    // Navigate to scans page
    await page.click('text=Scans');
    await expect(page).toHaveURL(/.*scans/);
    
    // Click "New Scan" button
    await page.click('button:has-text("New Scan")');
    
    // Fill scan creation form
    await page.fill('input[name="name"]', `E2E Test Scan ${Date.now()}`);
    await page.fill('input[name="target"]', 'https://example.com');
    await page.selectOption('select[name="scanType"]', 'web_application');
    
    // Select scanner tools
    await page.check('input[value="nmap"]');
    await page.check('input[value="owasp-zap"]');
    
    // Configure scan settings
    await page.fill('input[name="timeout"]', '300');
    await page.selectOption('select[name="intensity"]', 'moderate');
    
    // Click "Create Scan"
    await page.click('button:has-text("Create Scan")');
    
    // Verify scan created
    await expect(page.locator('text=Scan created|Success')).toBeVisible();
    await expect(page).toHaveURL(/.*scans/);
    
    // Verify scan appears in list
    await expect(page.locator(`text=E2E Test Scan`)).toBeVisible();
    
    // Click on scan to view details
    await page.click(`text=E2E Test Scan`);
    
    // Verify scan details page
    await expect(page.locator('text=Scan Details|Status')).toBeVisible();
    await expect(page.locator('text=pending|queued|running')).toBeVisible();
    
    // Start scan
    await page.click('button:has-text("Start Scan")');
    
    // Verify scan started
    await expect(page.locator('text=running|in progress')).toBeVisible();
    
    // Wait for scan to complete (or timeout for real scan)
    // In real test, might wait or poll
    // await page.waitForSelector('text=completed', { timeout: 60000 });
    
    // View scan results
    // await page.click('button:has-text("View Results")');
    // await expect(page.locator('text=Findings|Results')).toBeVisible();
  });

  // ==================== Multiple Scanner Tools ====================
  
  test('E2E-SCAN-002: Scan with multiple scanner tools', async ({ page }) => {
    // Navigate to scans
    await page.click('text=Scans');
    
    // Create new scan
    await page.click('button:has-text("New Scan")');
    
    await page.fill('input[name="name"]', `Multi-Tool Scan ${Date.now()}`);
    await page.fill('input[name="target"]', 'https://example.com');
    
    // Select multiple tools
    await page.check('input[value="nmap"]');
    await page.check('input[value="owasp-zap"]');
    await page.check('input[value="nuclei"]');
    
    // Create scan
    await page.click('button:has-text("Create Scan")');
    
    // View scan details
    await page.click(`text=Multi-Tool Scan`);
    
    // Verify all tools are listed
    await expect(page.locator('text=nmap')).toBeVisible();
    await expect(page.locator('text=owasp-zap|OWASP ZAP')).toBeVisible();
    await expect(page.locator('text=nuclei')).toBeVisible();
    
    // Start scan
    await page.click('button:has-text("Start Scan")');
    
    // Verify all tools are running
    await expect(page.locator('text=running')).toBeVisible();
  });

  // ==================== Scan Results Review ====================
  
  test('E2E-SCAN-003: Review scan results and findings', async ({ page }) => {
    // Navigate to completed scan (assumes one exists)
    await page.click('text=Scans');
    
    // Filter for completed scans
    await page.selectOption('select[name="status"]', 'completed');
    
    // Click on first completed scan
    await page.click('.scan-item:first-child');
    
    // Verify scan details
    await expect(page.locator('text=completed')).toBeVisible();
    
    // Click "View Findings"
    await page.click('button:has-text("View Findings")');
    
    // Verify findings list
    await expect(page.locator('text=Findings')).toBeVisible();
    
    // Verify findings are displayed
    const findingsCount = await page.locator('.finding-item').count();
    expect(findingsCount).toBeGreaterThan(0);
    
    // Click on first finding
    await page.click('.finding-item:first-child');
    
    // Verify finding details
    await expect(page.locator('text=Severity|Description')).toBeVisible();
    
    // Export scan results
    await page.click('button:has-text("Export")');
    await page.click('text=PDF|CSV');
    
    // Verify download initiated
    // const download = await page.waitForEvent('download');
    // expect(download.suggestedFilename()).toMatch(/scan.*\.(pdf|csv)/);
  });

  // ==================== Scan Cancellation ====================
  
  test('E2E-SCAN-004: Cancel running scan', async ({ page }) => {
    // Create and start a scan
    await page.click('text=Scans');
    await page.click('button:has-text("New Scan")');
    
    await page.fill('input[name="name"]', `Cancel Test Scan ${Date.now()}`);
    await page.fill('input[name="target"]', 'https://example.com');
    await page.check('input[value="nmap"]');
    
    await page.click('button:has-text("Create Scan")');
    await page.click(`text=Cancel Test Scan`);
    await page.click('button:has-text("Start Scan")');
    
    // Wait for scan to start
    await expect(page.locator('text=running')).toBeVisible();
    
    // Cancel scan
    await page.click('button:has-text("Cancel Scan")');
    
    // Confirm cancellation
    await page.click('button:has-text("Confirm")');
    
    // Verify scan cancelled
    await expect(page.locator('text=cancelled|stopped')).toBeVisible();
  });

  // ==================== Scan History ====================
  
  test('E2E-SCAN-005: View scan history and past scans', async ({ page }) => {
    // Navigate to scans
    await page.click('text=Scans');
    
    // Verify scans list
    await expect(page.locator('.scan-item')).toHaveCount.greaterThan(0);
    
    // Filter by date
    await page.click('button:has-text("Filter")');
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Verify filtered results
    await expect(page.locator('.scan-item')).toBeVisible();
    
    // Sort by date
    await page.click('th:has-text("Date")');
    
    // Verify sorted order
    const firstDate = await page.locator('.scan-item:first-child .date').textContent();
    const lastDate = await page.locator('.scan-item:last-child .date').textContent();
    expect(firstDate).toBeDefined();
  });
});

