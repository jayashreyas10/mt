import { test, expect } from '@playwright/test';

test.describe('Mortgage Tracker Production E2E Verification', () => {
  const timestamp = Date.now();
  const testEmail = `e2e-${timestamp}@example.com`;
  const testPassword = 'Password123!';
  const testName = 'Sarah Connor';

  test('Complete Mortgage Life-Cycle & Strategy Flow', async ({ page }) => {
    // 1. Start application & Navigate to Register
    await page.goto('/register');
    await expect(page).toHaveTitle(/Mortgage Tracker/i);

    // 2. Register a new user
    await page.fill('input[placeholder="Alex Morgan"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 3. Verify redirected to Dashboard
    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator('text=Financial Dashboard')).toBeVisible();

    // 4. Open Add Mortgage Modal
    await page.click('button:has-text("Add New Mortgage")');
    await expect(page.locator('text=Add New Mortgage Loan')).toBeVisible();

    // 5. Fill out mortgage form
    await page.fill('input[placeholder="e.g. Maple Street Home"]', 'Pacific Heights Home');
    await page.fill('input[placeholder="e.g. 30-Year Fixed Primary"]', '30-Year Primary Fixed');

    // Submit form
    await page.click('button:has-text("Create Mortgage & Calculate Schedule")');

    // 6. Verify mortgage appears on dashboard
    await expect(page.locator('text=30-Year Primary Fixed')).toBeVisible();
    await expect(page.locator('text=Pacific Heights Home')).toBeVisible();

    // 7. Navigate to Mortgage Detail
    await page.click('text=Manage & Schedule');
    await expect(page.locator('text=Loan Amortization Curve')).toBeVisible();

    // 8. Open Amortization Schedule Tab
    await page.click('button:has-text("Amortization Schedule")');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Export CSV')).toBeVisible();

    // 9. Open Payoff Strategy Tab
    await page.click('button:has-text("Payoff Strategy & Extra Payments")');
    await expect(page.locator('text=WITHOUT EXTRA PAYMENTS')).toBeVisible();
    await expect(page.locator('text=WITH EXTRA PAYMENTS')).toBeVisible();
    await expect(page.locator('text=YOU SAVE')).toBeVisible();

    // Save permanent extra payment rule
    await page.click('button:has-text("Save as Permanent Rule")');
    await expect(page.locator('text=Monthly Extra Payment')).toBeVisible();

    // 10. Open Actual Payment History Tab
    await page.click('button:has-text("Actual Payment History")');
    await page.click('button:has-text("Record New Payment")');
    await expect(page.locator('text=Record Mortgage Payment')).toBeVisible();

    // Fill and submit payment
    await page.fill('textarea[placeholder*="confirmation"]', 'Bank ACH transfer confirmation #89281');
    await page.click('button:has-text("Save Payment Record")');

    // Verify transaction recorded
    await expect(page.locator('text=Bank ACH transfer confirmation #89281')).toBeVisible();

    // 11. Refresh page and verify persistence
    await page.reload();
    await page.click('button:has-text("Actual Payment History")');
    await expect(page.locator('text=Bank ACH transfer confirmation #89281')).toBeVisible();

    // 12. Check Scenarios Comparison Page
    await page.click('a:has-text("Payoff Scenarios")');
    await expect(page.locator('text=Mortgage Scenario Comparison')).toBeVisible();
    await expect(page.locator('text=Scenario A: Normal Payments').first()).toBeVisible();
    await expect(page.locator('text=Scenario B:').first()).toBeVisible();

    // 13. Test Logout
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/.*\/login/);

    // 14. Test Unauthorized Access Guard
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
