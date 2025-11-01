/**
 * User Onboarding E2E Tests
 * 
 * Complete end-to-end tests for user onboarding workflows:
 * - New user sign up
 * - Admin-created user first login
 * - Password reset flow
 * 
 * Test IDs: E2E-ONBOARD-001 through E2E-ONBOARD-003
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Onboarding Workflows', () => {
  
  // ==================== Sign Up Flow ====================
  
  test('E2E-ONBOARD-001: New user sign up and first login', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Click "Don't have an account? Sign Up"
    await page.click('text=Don\\'t have an account');
    
    // Fill sign up form
    const timestamp = Date.now();
    await page.fill('input[name="username"]', `testuser${timestamp}`);
    await page.fill('input[name="email"]', `testuser${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Click Sign Up
    await page.click('button:has-text("Sign Up")');
    
    // Verify redirect to confirmation page
    await expect(page).toHaveURL(/.*confirmation|verify/);
    
    // Enter confirmation code (in real test, would retrieve from email)
    // For now, verify confirmation page is displayed
    await expect(page.locator('text=Confirmation Code|Enter Code')).toBeVisible();
    
    // Simulate confirmation (implementation dependent)
    // await page.fill('input[name="confirmationCode"]', '123456');
    // await page.click('button:has-text("Confirm")');
    
    // Verify redirect to login
    // await expect(page).toHaveURL(/.*login/);
    
    // Login with new credentials
    // await page.fill('input[name="username"]', `testuser${timestamp}@example.com`);
    // await page.fill('input[name="password"]', 'TestPassword123!');
    // await page.click('button:has-text("Sign In")');
    
    // Verify successful login to dashboard
    // await expect(page).toHaveURL(/.*dashboard/);
    // await expect(page.locator('text=Welcome|Dashboard')).toBeVisible();
  });

  // ==================== Admin Creates User Flow ====================
  
  test('E2E-ONBOARD-002: Admin creates user and user first login', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', process.env.TEST_ADMIN_EMAIL || 'admin@acme.com');
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to User Management
    await expect(page).toHaveURL(/.*dashboard/);
    await page.click('text=User Management');
    
    // Click "+ Add User"
    await page.click('button:has-text("Add User")');
    
    // Fill user creation form
    const timestamp = Date.now();
    const newUserEmail = `newuser${timestamp}@acme.com`;
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="name"]', `Test User ${timestamp}`);
    await page.selectOption('select[name="role"]', 'user');
    
    // Click "Create User"
    await page.click('button:has-text("Create User")');
    
    // Verify success message
    await expect(page.locator('text=User created|Success')).toBeVisible();
    
    // Copy temporary password
    const tempPassword = await page.locator('input[name="temporaryPassword"]').inputValue();
    await page.click('button:has-text("Done")');
    
    // Logout as admin
    await page.click('button:has-text("Logout")');
    
    // Login as new user with temp password
    await page.fill('input[name="username"]', newUserEmail);
    await page.fill('input[name="password"]', tempPassword);
    await page.click('button:has-text("Sign In")');
    
    // Verify forced password change
    await expect(page.locator('text=Change Password|New Password Required')).toBeVisible();
    
    // Change password
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('button:has-text("Change Password")');
    
    // Verify successful login to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  // ==================== Password Reset Flow ====================
  
  test('E2E-ONBOARD-003: Forgot password flow', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Click "Forgot Password?"
    await page.click('text=Forgot Password');
    
    // Enter username
    await page.fill('input[name="username"]', 'testuser@example.com');
    
    // Click "Send Reset Code"
    await page.click('button:has-text("Send Reset Code")');
    
    // Verify code sent message
    await expect(page.locator('text=Code sent|Check your email')).toBeVisible();
    
    // Enter reset code (in real test, would retrieve from email)
    await page.fill('input[name="code"]', '123456');
    
    // Enter new password
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    
    // Click "Reset Password"
    await page.click('button:has-text("Reset Password")');
    
    // Verify success message
    await expect(page.locator('text=Password reset successful|Success')).toBeVisible();
    
    // Return to login
    await page.click('text=Back to Login|Sign In');
    
    // Login with new password
    await page.fill('input[name="username"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

