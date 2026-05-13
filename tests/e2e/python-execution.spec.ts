import { test, expect } from '@playwright/test';
import {
  launchApp,
  closeApp,
  typeInEditor,
  clickRun,
  clickStop,
  waitForExecutionComplete,
  getOutput,
  dismissWelcomeModal,
} from './helpers/electron';

test.describe('Python Code Execution', () => {
  test('should switch language to Python and execute simple print', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type Python code
      await typeInEditor(window, 'print("Hello from Python!")');

      // Run and wait for output
      await clickRun(window);
      await waitForExecutionComplete(window);

      // Verify output
      const output = await getOutput(window);
      expect(output).toContain('Hello from Python!');
    } finally {
      await closeApp(app);
    }
  });

  test('should show Python in status bar when Python selected', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Check status bar
      const statusBar = window.locator('[style*="background: #007acc"]');
      await expect(statusBar).toContainText('Python');
    } finally {
      await closeApp(app);
    }
  });

  test('should execute Python code with variables and print', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type Python code with variables
      const code = `name = "CodePad"
version = 0.1
print(f"Welcome to {name} v{version}")
numbers = [1, 2, 3, 4, 5]
print(f"Sum: {sum(numbers)}")`;
      await typeInEditor(window, code);

      // Run and wait for output
      await clickRun(window);
      await waitForExecutionComplete(window);

      // Verify output
      const output = await getOutput(window);
      expect(output).toContain('Welcome to CodePad v0.1');
      expect(output).toContain('Sum: 15');
    } finally {
      await closeApp(app);
    }
  });

  test('should display Python errors with line numbers', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type invalid Python code
      await typeInEditor(window, 'print(undefined_variable)');

      // Run and wait for output
      await clickRun(window);
      await waitForExecutionComplete(window);

      // Verify error message
      const output = await getOutput(window);
      expect(output).toContain('NameError');
      expect(output).toContain('undefined_variable');
    } finally {
      await closeApp(app);
    }
  });

  test('should be able to stop long-running Python script', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type long-running Python code
      const code = `import time
for i in range(100):
    print(f"Iteration {i}")
    time.sleep(0.1)`;
      await typeInEditor(window, code);

      // Run, wait a bit, then stop
      await clickRun(window);
      await window.waitForTimeout(500);
      await clickStop(window);
      await waitForExecutionComplete(window, 5000);

      // Verify it stopped early
      const output = await getOutput(window);
      const count = (output.match(/Iteration/g) || []).length;
      expect(count).toBeLessThan(100);
      expect(count).toBeGreaterThan(0);
    } finally {
      await closeApp(app);
    }
  });

  test('should handle Python UTF-8 and emoji output', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type Python code with emojis
      await typeInEditor(window, 'print("Hello 🐍 Python! 你好 🚀")');

      // Run and wait for output
      await clickRun(window);
      await waitForExecutionComplete(window);

      // Verify output
      const output = await getOutput(window);
      expect(output).toContain('🐍');
      expect(output).toContain('你好');
      expect(output).toContain('🚀');
    } finally {
      await closeApp(app);
    }
  });

  test('should execute Python standard library imports', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type Python code with standard library
      const code = `import sys
import datetime
print(f"Python {sys.version.split()[0]}")
now = datetime.datetime.now()
print(f"Year: {now.year}")`;
      await typeInEditor(window, code);

      // Run and wait for output
      await clickRun(window);
      await waitForExecutionComplete(window);

      // Verify output
      const output = await getOutput(window);
      expect(output).toContain('Python');
      expect(output).toContain('Year:');
    } finally {
      await closeApp(app);
    }
  });

  test('should persist language when switching snippets', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      let languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Type Python code
      await typeInEditor(window, 'print("Python snippet")');

      // Save snippet
      await window.keyboard.press('Control+S');
      await window.waitForSelector('.ant-modal');
      await window.locator('input[placeholder*="snippet name"]').fill('Test Python');
      await window.locator('button:has-text("OK")').click();
      await window.waitForTimeout(500);

      // Create new snippet (switches to default C#)
      await window.locator('button:has-text("New")').first().click();
      await window.waitForTimeout(300);

      // Verify switched to C#
      languageSelector = window.locator('div.ant-select').first();
      await expect(languageSelector).toContainText('C#');

      // Switch back to Python snippet
      await window.locator('text=Test Python').click();
      await window.waitForTimeout(300);

      // Verify language is Python
      languageSelector = window.locator('div.ant-select').first();
      await expect(languageSelector).toContainText('Python');
    } finally {
      await closeApp(app);
    }
  });

  test('should disable Query Type selector for Python', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Python
      const languageSelector = window.locator('div.ant-select').first();
      await languageSelector.click();
      await window.locator('div.ant-select-item-option-content:has-text("Python")').click();

      // Check that Query Type selector is disabled
      const queryTypeSelector = window.locator('div.ant-select').nth(1);
      await expect(queryTypeSelector).toHaveClass(/ant-select-disabled/);
    } finally {
      await closeApp(app);
    }
  });

  test('should load Python sample from Samples tab', async () => {
    const { app, window } = await launchApp();
    try {
      await dismissWelcomeModal(window);

      // Switch to Samples tab
      await window.locator('div[role="tab"]:has-text("Samples")').click();
      await window.waitForTimeout(300);

      // Find and click Python category
      await window.locator('text=Python').click();
      await window.waitForTimeout(300);

      // Click a Python sample
      await window.locator('text=Python Hello World').click();
      await window.waitForTimeout(500);

      // Verify language selector shows Python
      const languageSelector = window.locator('div.ant-select').first();
      await expect(languageSelector).toContainText('Python');

      // Verify editor contains Python code
      const editor = window.locator('.monaco-editor');
      await expect(editor).toContainText('print(');
    } finally {
      await closeApp(app);
    }
  });
});
