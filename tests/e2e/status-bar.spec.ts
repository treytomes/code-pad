import { test, expect } from '@playwright/test';
import {
  launchApp,
  closeApp,
  typeInEditor,
  clickRun,
  waitForExecutionComplete,
  dismissWelcomeModal,
} from './helpers/electron';

test.describe('Status Bar', () => {
  test('should display language indicator', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      // Status bar shows "C#" for the csharp language
      await expect(window.locator('text=C#')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should show Ready state when idle', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await expect(window.locator('text=Ready')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should show Executing state while running', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("status bar test");');
      await clickRun(window);
      // Executing… appears in the status bar while running
      await expect(window.locator('text=Executing…')).toBeVisible();
      await waitForExecutionComplete(window);
    } finally {
      await closeApp(app);
    }
  });

  test('should display cursor position', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      // Cursor position "Ln X, Col Y" is always shown in the status bar
      await expect(window.locator('text=/Ln \\d+, Col \\d+/')).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });

  test('should display execution time after run completes', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);
      await typeInEditor(window, 'Console.WriteLine("timing");');
      await clickRun(window);
      await waitForExecutionComplete(window);
      // Time shown in both the output header and the status bar (NNNms)
      await expect(window.locator('text=/\\d+ms/').first()).toBeVisible();
    } finally {
      await closeApp(app);
    }
  });
});
