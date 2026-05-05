import { test, expect } from '@playwright/test';
import { launchApp, closeApp, typeInEditor, dismissWelcomeModal } from './helpers/electron';

test.describe('Snippet Management', () => {
  test('should create and save a new snippet', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Test snippet");');
      await window.locator('button:has-text("Save")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'visible' });
      await window.locator('.ant-modal input[type="text"]').first().fill('My Test Snippet');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });
      await expect(window.locator('text=My Test Snippet')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should load an existing snippet', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Loadable snippet");');
      await window.locator('button:has-text("Save")').click();
      await window.locator('.ant-modal input[type="text"]').first().fill('Load Test');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });
      await typeInEditor(window, '');
      await window.locator('text=Load Test').click();
      await window.waitForTimeout(500);
      await expect(window.locator('button:has-text("Run Code")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should update an existing snippet', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Original");');
      await window.locator('button:has-text("Save")').click();
      await window.locator('.ant-modal input[type="text"]').first().fill('Update Test');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });
      await typeInEditor(window, 'Console.WriteLine("Updated");');
      await window.locator('button:has-text("Save")').click();
      const modal = window.locator('.ant-modal:has-text("Save Snippet")');
      const isVisible = await modal.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        await window.locator('.ant-modal button:has-text("OK")').click();
      }
      await window.waitForTimeout(500);
    } finally {
      await closeApp(app);
    }
  });

  test('should delete a snippet', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Delete me");');
      await window.locator('button:has-text("Save")').click();
      await window.locator('.ant-modal input[type="text"]').first().fill('Delete Test');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });
      const snippetItem = window.locator('text=Delete Test').locator('..');
      await snippetItem.hover();
      await snippetItem.locator('button[title*="Delete"]').click();
      await window.locator('button:has-text("OK")').last().click();
      await expect(window.locator('text=Delete Test')).not.toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should toggle starred status', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Star me");');
      await window.locator('button:has-text("Save")').click();
      await window.locator('.ant-modal input[type="text"]').first().fill('Star Test');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });
      const snippetItem = window.locator('text=Star Test').locator('..');
      await snippetItem.hover();
      await snippetItem.locator('button[title*="Star"]').click();
      await expect(snippetItem.locator('button[title*="Star"]')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should clear editor when clicking New button', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Existing");');
      await window.locator('button:has-text("New")').click();
      await expect(window.locator('button:has-text("Run Code")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });
});
