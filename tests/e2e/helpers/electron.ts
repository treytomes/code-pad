import { _electron as electron, ElectronApplication, Page } from 'playwright';
import * as path from 'path';

/**
 * Launch the Electron application for testing
 */
export async function launchApp(): Promise<{ app: ElectronApplication; window: Page }> {
  // Path to the main process entry point
  const mainPath = path.join(process.cwd(), 'dist/main/index.js');

  // Launch Electron
  const app = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  // Wait for the first window to open
  const window = await app.firstWindow();

  // Wait for app to be ready
  await window.waitForLoadState('domcontentloaded');

  return { app, window };
}

/**
 * Close the Electron application
 */
export async function closeApp(app: ElectronApplication): Promise<void> {
  await app.close();
}

/**
 * Get the Monaco editor instance and type code
 */
export async function typeInEditor(window: Page, code: string): Promise<void> {
  // Click in the editor to focus it
  const editor = window.locator('.monaco-editor');
  await editor.click();

  // Clear existing content (Ctrl+A, Delete)
  await window.keyboard.press('Control+A');
  await window.keyboard.press('Delete');

  // Type the code
  await window.keyboard.type(code, { delay: 10 });
}

/**
 * Click the Run button
 */
export async function clickRun(window: Page): Promise<void> {
  await window.locator('button:has-text("Run Code")').click();
}

/**
 * Click the Stop button
 */
export async function clickStop(window: Page): Promise<void> {
  await window.locator('button:has-text("Stop")').click();
}

/**
 * Wait for execution to complete
 */
export async function waitForExecutionComplete(window: Page, timeout = 10000): Promise<void> {
  // Wait for Stop button to disappear (means execution finished)
  await window.locator('button:has-text("Stop")').waitFor({ state: 'hidden', timeout });
}

/**
 * Get the output text
 */
export async function getOutput(window: Page): Promise<string> {
  const outputElement = window.locator('[class*="OutputDisplay"]').first();
  return await outputElement.textContent() || '';
}

/**
 * Clear the output
 */
export async function clearOutput(window: Page): Promise<void> {
  await window.locator('button[title*="Clear"]').click();
}

/**
 * Open settings modal
 */
export async function openSettings(window: Page): Promise<void> {
  // Click the settings button (gear icon)
  await window.locator('button[title*="Settings"]').click();

  // Wait for modal to appear
  await window.locator('.ant-modal:has-text("Settings")').waitFor({ state: 'visible' });
}

/**
 * Close settings modal
 */
export async function closeSettings(window: Page): Promise<void> {
  await window.locator('.ant-modal button:has-text("Cancel")').click();

  // Wait for modal to disappear
  await window.locator('.ant-modal:has-text("Settings")').waitFor({ state: 'hidden' });
}
