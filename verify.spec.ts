import { test, expect } from '@playwright/test';
test('dashboard check', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/FDR DATALINK/);
});
