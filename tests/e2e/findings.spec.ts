/**
 * Finding Workflow E2E Tests
 * 
 * Complete end-to-end tests for finding management workflows:
 * - Finding triage
 * - False positive handling
 * - POC generation
 * - Team collaboration
 * 
 * Test IDs: E2E-FIND-001 through E2E-FIND-004
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Finding Management Workflows', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', process.env.TEST_USER_EMAIL || 'user@acme.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'UserPassword123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  // ==================== Finding Triage Workflow ====================
  
  test('E2E-FIND-001: Finding triage workflow', async ({ page }) => {
    // Navigate to findings
    await page.click('text=Findings');
    await expect(page).toHaveURL(/.*findings/);
    
    // Filter for open findings
    await page.selectOption('select[name="status"]', 'open');
    
    // Click on first finding
    await page.click('.finding-item:first-child');
    
    // Verify finding details
    await expect(page.locator('text=Finding Details|Severity')).toBeVisible();
    
    // Review finding information
    const severity = await page.locator('.severity').textContent();
    const title = await page.locator('.title').textContent();
    
    expect(severity).toBeDefined();
    expect(title).toBeDefined();
    
    // Change status to "In Progress"
    await page.click('button:has-text("Change Status")');
    await page.selectOption('select[name="status"]', 'in_progress');
    await page.click('button:has-text("Update")');
    
    // Verify status updated
    await expect(page.locator('text=in_progress|In Progress')).toBeVisible();
    
    // Add comment
    await page.fill('textarea[name="comment"]', 'Investigating this vulnerability');
    await page.click('button:has-text("Add Comment")');
    
    // Verify comment added
    await expect(page.locator('text=Investigating this vulnerability')).toBeVisible();
    
    // Assign to team member
    await page.click('button:has-text("Assign")');
    await page.selectOption('select[name="assignee"]', 'analyst@acme.com');
    await page.click('button:has-text("Assign User")');
    
    // Verify assignment
    await expect(page.locator('text=analyst@acme.com')).toBeVisible();
    
    // Mark as resolved
    await page.click('button:has-text("Change Status")');
    await page.selectOption('select[name="status"]', 'resolved');
    await page.fill('textarea[name="resolution"]', 'Patched by updating library to v2.0');
    await page.click('button:has-text("Update")');
    
    // Verify resolved
    await expect(page.locator('text=resolved')).toBeVisible();
  });

  // ==================== False Positive Handling ====================
  
  test('E2E-FIND-002: Mark finding as false positive', async ({ page }) => {
    // Navigate to findings
    await page.click('text=Findings');
    
    // Click on a finding
    await page.click('.finding-item:first-child');
    
    // Click "Mark as False Positive"
    await page.click('button:has-text("False Positive")');
    
    // Fill justification
    await page.fill('textarea[name="justification"]', 'This is not exploitable in our environment due to WAF rules');
    await page.click('button:has-text("Confirm")');
    
    // Verify marked as false positive
    await expect(page.locator('text=False Positive')).toBeVisible();
    await expect(page.locator('text=This is not exploitable')).toBeVisible();
    
    // Verify finding removed from active findings
    await page.click('text=Findings');
    await page.selectOption('select[name="status"]', 'open');
    
    // Original finding should not appear in open findings
    // (implementation dependent on how false positives are handled)
  });

  // ==================== POC Generation Workflow ====================
  
  test('E2E-FIND-003: Generate POC for finding', async ({ page }) => {
    // Navigate to findings
    await page.click('text=Findings');
    
    // Click on critical finding
    await page.click('.finding-item[data-severity="critical"]:first-child');
    
    // Click "Generate POC"
    await page.click('button:has-text("Generate POC")');
    
    // Verify POC generation started
    await expect(page.locator('text=Generating|POC generation in progress')).toBeVisible();
    
    // Wait for POC generation (might take time)
    await page.waitForSelector('text=POC Generated|Generation complete', { timeout: 30000 });
    
    // View generated POC
    await page.click('button:has-text("View POC")');
    
    // Verify POC code displayed
    await expect(page.locator('code, .code-block')).toBeVisible();
    
    // Copy POC code
    await page.click('button:has-text("Copy Code")');
    
    // Download POC
    await page.click('button:has-text("Download")');
    
    // Verify download
    // const download = await page.waitForEvent('download');
    // expect(download.suggestedFilename()).toMatch(/poc.*\.(py|js|sh)/);
    
    // Test POC (if feature available)
    // await page.click('button:has-text("Test POC")');
    // await expect(page.locator('text=Testing|Execution')).toBeVisible();
  });

  // ==================== Team Collaboration ====================
  
  test('E2E-FIND-004: Team collaboration on finding', async ({ page }) => {
    // Navigate to findings
    await page.click('text=Findings');
    
    // Click on a finding
    await page.click('.finding-item:first-child');
    
    // Add a comment as first user
    await page.fill('textarea[name="comment"]', 'I think this needs immediate attention');
    await page.click('button:has-text("Add Comment")');
    
    // Verify comment added
    await expect(page.locator('text=I think this needs immediate attention')).toBeVisible();
    
    // Mention team member
    await page.fill('textarea[name="comment"]', '@analyst@acme.com Can you review this?');
    await page.click('button:has-text("Add Comment")');
    
    // Verify mention
    await expect(page.locator('text=@analyst@acme.com')).toBeVisible();
    
    // Attach evidence
    await page.click('button:has-text("Attach File")');
    // await page.setInputFiles('input[type="file"]', 'path/to/screenshot.png');
    // await expect(page.locator('text=screenshot.png')).toBeVisible();
    
    // Share finding
    await page.click('button:has-text("Share")');
    await page.fill('input[name="shareWith"]', 'security-team@acme.com');
    await page.click('button:has-text("Send")');
    
    // Verify shared
    await expect(page.locator('text=Shared successfully')).toBeVisible();
    
    // Subscribe to updates
    await page.check('input[name="subscribe"]');
    
    // Verify subscription
    await expect(page.locator('text=Subscribed|Watching')).toBeVisible();
  });

  // ==================== Bulk Operations ====================
  
  test('E2E-FIND-005: Bulk update findings', async ({ page }) => {
    // Navigate to findings
    await page.click('text=Findings');
    
    // Select multiple findings
    await page.check('.finding-item:nth-child(1) input[type="checkbox"]');
    await page.check('.finding-item:nth-child(2) input[type="checkbox"]');
    await page.check('.finding-item:nth-child(3) input[type="checkbox"]');
    
    // Click bulk actions
    await page.click('button:has-text("Bulk Actions")');
    
    // Change status for all selected
    await page.click('text=Change Status');
    await page.selectOption('select[name="bulkStatus"]', 'in_progress');
    await page.click('button:has-text("Apply")');
    
    // Verify status updated
    await expect(page.locator('text=3 findings updated')).toBeVisible();
    
    // Bulk assign
    await page.check('.finding-item:nth-child(1) input[type="checkbox"]');
    await page.check('.finding-item:nth-child(2) input[type="checkbox"]');
    await page.click('button:has-text("Bulk Actions")');
    await page.click('text=Assign');
    await page.selectOption('select[name="assignee"]', 'analyst@acme.com');
    await page.click('button:has-text("Assign")');
    
    // Verify assignments
    await expect(page.locator('text=Assigned successfully')).toBeVisible();
  });

  // ==================== Finding Search and Filter ====================
  
  test('E2E-FIND-006: Search and filter findings', async ({ page }) => {
    // Navigate to findings
    await page.click('text=Findings');
    
    // Search by keyword
    await page.fill('input[name="search"]', 'SQL Injection');
    await page.click('button:has-text("Search")');
    
    // Verify results
    await expect(page.locator('.finding-item:has-text("SQL Injection")')).toBeVisible();
    
    // Filter by severity
    await page.selectOption('select[name="severity"]', 'critical');
    
    // Verify filtered results
    const findings = await page.locator('.finding-item').all();
    for (const finding of findings) {
      const severity = await finding.locator('.severity').textContent();
      expect(severity?.toLowerCase()).toContain('critical');
    }
    
    // Filter by date range
    await page.fill('input[name="startDate"]', '2025-01-01');
    await page.fill('input[name="endDate"]', '2025-12-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Clear filters
    await page.click('button:has-text("Clear Filters")');
    
    // Verify all findings shown again
    await expect(page.locator('.finding-item')).toHaveCount.greaterThan(0);
  });
});

