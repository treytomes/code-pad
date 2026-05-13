import { test, expect } from '@playwright/test';
import {
  launchApp,
  closeApp,
  clickRun,
  waitForExecutionComplete,
  getOutput,
  dismissWelcomeModal,
  openSamplesTab,
  openMySnippetsTab,
} from './helpers/electron';

test.describe('Samples Tab', () => {
  test('should display Samples tab with categories', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSamplesTab(window);
      await expect(window.locator('text=Getting Started')).toBeVisible();
      await expect(window.locator('text=.Dump()')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should display Hello World sample', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSamplesTab(window);
      await expect(window.locator('[data-testid="sample-item-sample-hello-world"]')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should load Hello World sample into editor and execute it', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSamplesTab(window);
      await window.locator('[data-testid="sample-item-sample-hello-world"]').click();
      await openMySnippetsTab(window);
      await clickRun(window);
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('Hello');
    } finally {
      await closeApp(app);
    }
  });

  test('should have multiple sample items', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSamplesTab(window);
      const items = window.locator('[data-testid^="sample-item-"]');
      await expect(items.first()).toBeVisible();
      const count = await items.count();
      expect(count).toBeGreaterThan(3);
    } finally {
      await closeApp(app);
    }
  });

  test('My Snippets tab should be navigable from Samples tab', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSamplesTab(window);
      await openMySnippetsTab(window);
      await expect(window.locator('button:has-text("Run Code")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });
});
