import { _electron as electron, ElectronApplication, Page } from 'playwright';
import * as path from 'path';

export async function launchApp(): Promise<{ app: ElectronApplication; window: Page }> {
  const mainPath = path.join(process.cwd(), 'dist/main/index.js');

  const app = await electron.launch({
    args: [mainPath],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  return { app, window };
}

export async function closeApp(app: ElectronApplication): Promise<void> {
  await app.close();
}

/**
 * Dismiss the Welcome modal if it is showing.
 * Must be called at the start of every test — the modal blocks clicks on
 * elements underneath it.
 */
export async function dismissWelcomeModal(window: Page): Promise<void> {
  const btn = window.locator('[data-testid="welcome-get-started"]');
  try {
    await btn.waitFor({ state: 'visible', timeout: 3000 });
    await btn.click();
    await btn.waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Modal not shown — already dismissed or first-run key already set
  }
}

export async function typeInEditor(window: Page, code: string): Promise<void> {
  const editor = window.locator('.monaco-editor').first();
  await editor.click();
  await window.keyboard.press('Control+A');
  await window.keyboard.press('Delete');
  if (code) {
    await window.keyboard.type(code, { delay: 10 });
  }
}

export async function clickRun(window: Page): Promise<void> {
  await window.locator('button:has-text("Run Code")').click();
}

export async function clickStop(window: Page): Promise<void> {
  await window.locator('button:has-text("Stop")').click();
}

export async function waitForExecutionComplete(window: Page, timeout = 60000): Promise<void> {
  await window.locator('button:has-text("Stop")').waitFor({ state: 'hidden', timeout });
}

/**
 * Return the text content of the output panel.
 * Uses the stable data-testid="output-panel" attribute added to the container div.
 */
export async function getOutput(window: Page): Promise<string> {
  const panel = window.locator('[data-testid="output-panel"]');
  return (await panel.textContent()) ?? '';
}

export async function clearOutput(window: Page): Promise<void> {
  await window.locator('button[title*="Clear"]').click();
}

export async function openSettings(
  app: ElectronApplication,
  window: Page
): Promise<void> {
  // Settings is menu-driven — send the IPC event the menu would send
  await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send('menu-settings');
  });
  await window.locator('.ant-modal:has-text("Settings")').waitFor({ state: 'visible' });
}

export async function closeSettings(window: Page): Promise<void> {
  await window.locator('.ant-modal button:has-text("Cancel")').click();
  await window.locator('.ant-modal:has-text("Settings")').waitFor({ state: 'hidden' });
}

/** Switch to the Samples tab in the sidebar. */
export async function openSamplesTab(window: Page): Promise<void> {
  await window.locator('[data-testid="tab-samples"]').click();
}

/** Switch to the My Snippets tab in the sidebar. */
export async function openMySnippetsTab(window: Page): Promise<void> {
  await window.locator('[data-testid="tab-my-snippets"]').click();
}
