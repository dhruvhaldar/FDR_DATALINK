import { test, expect } from '@playwright/test';

test.describe('Flight Data Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root URL
    await page.goto('/');
  });

  test('should load the main title properly', async ({ page }) => {
    await expect(page).toHaveTitle(/FDR DATALINK/);

    const heading = page.locator('h1:has-text("FDR DATALINK")');
    await expect(heading).toBeVisible();

    const subHeading = page.locator('text=Flight Recorder Analysis Interface');
    await expect(subHeading).toBeVisible();
  });

  test('should display all KPI elements', async ({ page }) => {
    // KPI parameters configured in the UI
    const kpis = [
      'Pressure Altitude LSP',
      'Computed Airspeed LSP',
      'Pitch Angle LSP',
      'Roll Angle LSP',
      'Vertical Acceleration'
    ];

    for (const kpi of kpis) {
      const element = page.locator(`h3:has-text("${kpi}")`);
      await expect(element).toBeVisible();
    }
  });

  test('should populate dataset selector and allow selection', async ({ page }) => {
    const datasetSelect = page.locator('#dataset-select');

    // We already navigated in beforeEach, so wait for options
    // After response, options should be present. Instead of `waitForResponse` here which might timeout due to being triggered in beforeEach, wait for the state directly.
    await expect(datasetSelect.locator('option').nth(1)).toBeAttached({ timeout: 10000 });

    const options = datasetSelect.locator('option');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    // Attempt to change the dataset
    if (optionCount > 1) {
        const optionValue = await options.nth(1).getAttribute('value');
        if (optionValue) {

            // Set up a promise to wait for the API response *before* triggering the event
            const responsePromise = page.waitForResponse(response => response.url().includes(`/api/data/${optionValue}`) && response.status() === 200);

            await datasetSelect.selectOption(optionValue);

            // Wait for data to load
            await responsePromise;

            // Assert that the title updates
            await expect(page).toHaveTitle(new RegExp(optionValue));
        }
    }
  });

  test('should verify external source link', async ({ page }) => {
    const sourceLink = page.locator('a:has-text("Source: NASA Dashlink")');
    await expect(sourceLink).toBeVisible();

    const href = await sourceLink.getAttribute('href');
    expect(href).toBe('https://c3.ndc.nasa.gov/dashlink/projects/85/');
  });
});