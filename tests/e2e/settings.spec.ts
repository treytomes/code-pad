import { test, expect } from '@playwright/test';
import { launchApp, closeApp, dismissWelcomeModal, openSettings, closeSettings } from './helpers/electron';

test.describe('Settings Modal', () => {
  test('should open and close settings modal', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      await expect(window.locator('.ant-modal:has-text("Settings")')).toBeVisible();
      await closeSettings(window);
      await expect(window.locator('.ant-modal:has-text("Settings")')).not.toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should show Editor, Execution, and Appearance tabs', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      await expect(window.locator('.ant-tabs-tab:has-text("Editor")')).toBeVisible();
      await expect(window.locator('.ant-tabs-tab:has-text("Execution")')).toBeVisible();
      await expect(window.locator('.ant-tabs-tab:has-text("Appearance")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should save font size setting and persist after reopen', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);

      // Editor tab is default — change font size
      const fontInput = window.locator('.ant-modal .ant-input-number').first();
      await fontInput.click();
      await window.keyboard.press('Control+A');
      await window.keyboard.type('18');

      // Save is only enabled when there are changes
      await window.locator('.ant-modal button:has-text("Save")').click();
      await window.locator('.ant-modal:has-text("Settings")').waitFor({ state: 'hidden' });

      // Reopen and verify the value persisted
      await openSettings(app, window);
      const savedValue = await window.locator('.ant-modal .ant-input-number').first().inputValue();
      expect(savedValue).toBe('18');
    } finally {
      await closeApp(app);
    }
  });

  test('should navigate to Execution tab and show timeout setting', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      await window.locator('.ant-tabs-tab:has-text("Execution")').click();
      await expect(window.locator('.ant-modal:has-text("Execution Timeout")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should navigate to Appearance tab and show theme selector', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      await window.locator('.ant-tabs-tab:has-text("Appearance")').click();
      await expect(window.locator('.ant-modal:has-text("Theme")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('Reset to Defaults button should re-enable Save', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      // Save starts disabled (no changes)
      await expect(window.locator('.ant-modal button:has-text("Save")')).toBeDisabled();
      await window.locator('.ant-modal button:has-text("Reset to Defaults")').click();
      // After reset, Save becomes enabled (settings marked as changed)
      await expect(window.locator('.ant-modal button:has-text("Save")')).toBeEnabled();
    } finally {
      await closeApp(app);
    }
  });

  test('Appearance tab should have Show Welcome Screen button', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      await window.locator('.ant-tabs-tab:has-text("Appearance")').click();
      await expect(window.locator('.ant-modal button:has-text("Show Welcome Screen")')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('Show Welcome Screen button should open welcome modal', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await openSettings(app, window);
      await window.locator('.ant-tabs-tab:has-text("Appearance")').click();
      await window.locator('.ant-modal button:has-text("Show Welcome Screen")').click();
      // Settings closes and welcome modal opens
      await expect(window.locator('[data-testid="welcome-get-started"]')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });
});
