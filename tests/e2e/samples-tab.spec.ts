import { test, expect } from '@playwright/test';
import { launchApp, closeApp, clickRun, waitForExecutionComplete, getOutput } from './helpers/electron';

test.describe('Samples Tab', () => {
  test('should display Samples tab', async () => {
    const { app, window } = await launchApp();

    try {
      // Click on Samples tab
      await window.locator('text=Samples').click();

      // Verify samples are visible
      await expect(window.locator('text=Getting Started')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should load and execute a sample', async () => {
    const { app, window } = await launchApp();

    try {
      // Click on Samples tab
      await window.locator('text=Samples').click();

      // Wait for samples to load
      await window.waitForTimeout(500);

      // Find a sample (e.g., "Hello World")
      const helloSample = window.locator('text=Hello World').first();
      await expect(helloSample).toBeVisible();

      // Click to load the sample
      await helloSample.click();

      // Switch back to My Snippets tab to see the loaded code
      await window.locator('text=My Snippets').click();

      // Run the sample code
      await clickRun(window);
      await waitForExecutionComplete(window);

      // Verify output
      const output = await getOutput(window);
      expect(output.length).toBeGreaterThan(0);
    } finally {
      await closeApp(app);
    }
  });

  test('should have multiple sample categories', async () => {
    const { app, window } = await launchApp();

    try {
      // Click on Samples tab
      await window.locator('text=Samples').click();

      // Verify multiple categories exist
      await expect(window.locator('text=Getting Started')).toBeVisible();
      await expect(window.locator('text=.Dump()')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should display sample descriptions', async () => {
    const { app, window } = await launchApp();

    try {
      // Click on Samples tab
      await window.locator('text=Samples').click();

      // Find any sample item
      const sampleItem = window.locator('[class*="sample-item"]').first();

      // Check if description is visible (samples should have descriptions)
      const hasDescription = await sampleItem.locator('div').count() > 1;
      expect(hasDescription).toBeTruthy();
    } finally {
      await closeApp(app);
    }
  });
});
