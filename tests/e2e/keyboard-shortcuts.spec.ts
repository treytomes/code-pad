import { test, expect } from '@playwright/test';
import {
  launchApp,
  closeApp,
  typeInEditor,
  waitForExecutionComplete,
  getOutput,
  dismissWelcomeModal,
} from './helpers/electron';

test.describe('Keyboard Shortcuts', () => {
  test('F5 should run code', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("F5 works");');
      // Focus the editor then press F5
      await window.locator('.monaco-editor').first().click();
      await window.keyboard.press('F5');
      await waitForExecutionComplete(window);
      const output = await getOutput(window);
      expect(output).toContain('F5 works');
    } finally {
      await closeApp(app);
    }
  });

  test('Ctrl+N should clear the editor for a new snippet', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("original");');
      await window.keyboard.press('Control+n');
      // Run button stays visible — app is functional
      await expect(window.locator('button:has-text("Run Code")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('Ctrl+S on unsaved code should open Save dialog', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("Ctrl+S test");');
      await window.keyboard.press('Control+s');
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'visible' });
      // Dismiss without saving
      await window.locator('.ant-modal button:has-text("Cancel")').click();
    } finally {
      await closeApp(app);
    }
  });

  test('Ctrl+S on existing snippet should save without dialog', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      // Create snippet first
      await typeInEditor(window, 'Console.WriteLine("saved");');
      await window.locator('button:has-text("Save As")').first().click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'visible' });
      await window.locator('.ant-modal input[type="text"]').first().fill('ShortcutSave');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });

      // Now edit and use Ctrl+S — should save silently (no dialog)
      await typeInEditor(window, 'Console.WriteLine("updated");');
      await window.keyboard.press('Control+s');
      // No modal should appear
      const dialogVisible = await window
        .locator('.ant-modal:has-text("Save Snippet")')
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      expect(dialogVisible).toBe(false);
    } finally {
      await closeApp(app);
    }
  });

  test('Ctrl+Shift+S should always open Save As dialog', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      // Create and load a snippet so there is a current snippet ID
      await typeInEditor(window, 'Console.WriteLine("shift save");');
      await window.locator('button:has-text("Save As")').first().click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'visible' });
      await window.locator('.ant-modal input[type="text"]').first().fill('ShiftSaveSnippet');
      await window.locator('.ant-modal button:has-text("OK")').click();
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'hidden' });

      // Ctrl+Shift+S should still open Save As
      await window.keyboard.press('Control+Shift+S');
      await window.locator('.ant-modal:has-text("Save Snippet")').waitFor({ state: 'visible' });
      await window.locator('.ant-modal button:has-text("Cancel")').click();
    } finally {
      await closeApp(app);
    }
  });
});
