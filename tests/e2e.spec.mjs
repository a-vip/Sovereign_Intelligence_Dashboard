import { test, expect } from '@playwright/test';

test.describe('Sovereign Observatory E2E & Responsive Visual Integrity', () => {
  test('Desktop (1440x900) clean header, Observatory menu & Editorial Light theme switch', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box.height).toBeLessThanOrEqual(58);

    await expect(page.getByText(/ONLINE/i)).toHaveCount(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(overflow).toBeTruthy();

    await page.getByRole('button', { name: /Theme & Settings/i }).click();
    await page.getByRole('button', { name: /Editorial Light/i }).click();
    await expect(page.locator('html')).toHaveAttribute('data-ui-theme', 'light');
  });

  test('Mobile (390x844) single-row header with zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    const box = await header.boundingBox();
    expect(box.height).toBeLessThanOrEqual(54);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(overflow).toBeTruthy();
  });

  test('Whitepaper #1 & Methodology benchmark sections render cleanly', async ({ page }) => {
    await page.goto('/whitepaper');
    await expect(page.locator('h1')).toContainText(/Compute/i);
    await expect(page.getByText(/200-Item Benchmark/i)).toBeVisible();
  });
});
