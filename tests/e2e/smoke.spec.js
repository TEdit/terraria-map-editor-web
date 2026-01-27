import { test, expect } from '@playwright/test';
import { waitForAppReady, setupErrorTracking } from './helpers.js';

test.describe('E2E Smoke Tests', () => {
  test('page loads without console errors', async ({ page }) => {
    const errors = setupErrorTracking(page);

    // Navigate to home page
    await page.goto('/');

    // Wait for React to mount and app to be ready
    await waitForAppReady(page);

    // Wait a bit longer for any delayed errors
    await page.waitForTimeout(1000);

    // Assert no console errors or warnings occurred
    if (errors.console.length > 0) {
      console.error('Console errors detected:', errors.console);
    }
    expect(errors.console, 'No console errors should occur').toHaveLength(0);

    // Assert no unhandled exceptions occurred
    if (errors.unhandled.length > 0) {
      console.error('Unhandled errors detected:', errors.unhandled);
    }
    expect(errors.unhandled, 'No unhandled exceptions should occur').toHaveLength(0);
  });

  test('React app renders successfully', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // Check that #app container is visible
    const appContainer = page.locator('#app');
    await expect(appContainer).toBeVisible();

    // Check that React has rendered child elements
    const childCount = await page.locator('#app > *').count();
    expect(childCount, 'React should render children in #app').toBeGreaterThan(0);
  });

  test('canvas editor element is present', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);

    // Verify the canvas element exists (core feature)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeAttached();
  });

  test('no unhandled promise rejections after page load', async ({ page }) => {
    const errors = setupErrorTracking(page);

    await page.goto('/');
    await waitForAppReady(page);

    // Wait for any deferred promises to resolve/reject
    await page.waitForTimeout(2000);

    expect(errors.unhandled, 'No unhandled promise rejections').toHaveLength(0);
  });
});
