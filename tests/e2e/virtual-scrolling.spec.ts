import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronTestHelper } from './helpers/electron';

test.describe('Virtual Scrolling', () => {
  let helper: ElectronTestHelper;

  test.beforeEach(async () => {
    helper = new ElectronTestHelper();
    await helper.launch();
  });

  test.afterEach(async () => {
    await helper.cleanup();
  });

  test('should handle large output with virtual scrolling', async () => {
    const { page } = helper;

    // Generate large output (200 lines to trigger virtualization)
    const code = `
for (int i = 1; i <= 200; i++)
{
    Console.WriteLine($"Line {i}: This is a test line with some content to make it realistic");
}
`;

    // Enter code
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.type(code);

    // Run code
    await page.click('button:has-text("Run Code")');

    // Wait for execution to complete
    await page.waitForSelector('text=/Line 200:/', { timeout: 10000 });

    // Verify output is rendered
    const outputPanel = page.locator('.ant-layout-content > div:nth-child(2) > div');
    await expect(outputPanel).toBeVisible();

    // Verify we can scroll through output
    const outputText = await outputPanel.textContent();
    expect(outputText).toContain('Line 1:');
    expect(outputText).toContain('Line 200:');

    // Test scrolling performance
    const startTime = Date.now();
    await outputPanel.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const scrollTime = Date.now() - startTime;

    // Scrolling should be fast (<100ms)
    expect(scrollTime).toBeLessThan(100);
  });

  test('should handle 10,000 line output', async () => {
    const { page } = helper;

    // Generate very large output
    const code = `
for (int i = 1; i <= 10000; i++)
{
    Console.WriteLine($"Line {i}");
}
`;

    // Enter code
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.type(code);

    // Run code
    await page.click('button:has-text("Run Code")');

    // Wait for execution to complete (with longer timeout)
    await page.waitForSelector('text=/Line 10000/', { timeout: 30000 });

    // Verify output is rendered
    const outputPanel = page.locator('.ant-layout-content > div:nth-child(2) > div');
    await expect(outputPanel).toBeVisible();

    // Scroll to bottom
    await outputPanel.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for virtual list to render bottom items
    await page.waitForTimeout(500);

    // Verify last line is visible
    await expect(page.locator('text=/Line 10000/')).toBeVisible();

    // Scroll to top
    await outputPanel.evaluate((el) => {
      el.scrollTop = 0;
    });

    // Wait for virtual list to render top items
    await page.waitForTimeout(500);

    // Verify first line is visible
    await expect(page.locator('text=/Line 1/')).toBeVisible();
  });

  test('should not use virtual scrolling for small output', async () => {
    const { page } = helper;

    // Generate small output (50 lines, below threshold of 100)
    const code = `
for (int i = 1; i <= 50; i++)
{
    Console.WriteLine($"Line {i}");
}
`;

    // Enter code
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.type(code);

    // Run code
    await page.click('button:has-text("Run Code")');

    // Wait for execution to complete
    await page.waitForSelector('text=/Line 50/', { timeout: 10000 });

    // Verify output is rendered (all lines should be in DOM, no virtualization)
    const outputPanel = page.locator('.ant-layout-content > div:nth-child(2) > div');
    const outputText = await outputPanel.textContent();

    // All lines should be present in the DOM
    for (let i = 1; i <= 50; i++) {
      expect(outputText).toContain(`Line ${i}`);
    }
  });

  test('should handle mixed content types with virtual scrolling', async () => {
    const { page } = helper;

    // Generate mixed output with JSON and plain text (150 items to trigger virtualization)
    const code = `
for (int i = 1; i <= 150; i++)
{
    Console.WriteLine($"Item {i}");
    new { Index = i, Name = $"Item{i}" }.Dump($"Object {i}");
}
`;

    // Enter code
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.type(code);

    // Run code
    await page.click('button:has-text("Run Code")');

    // Wait for execution to complete
    await page.waitForSelector('text=/Object 150/', { timeout: 20000 });

    // Verify mixed content renders correctly
    const outputPanel = page.locator('.ant-layout-content > div:nth-child(2) > div');
    await expect(outputPanel).toBeVisible();

    // Scroll through output to trigger lazy rendering
    await outputPanel.evaluate((el) => {
      el.scrollTop = el.scrollHeight / 2;
    });
    await page.waitForTimeout(200);

    await outputPanel.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(200);

    // Verify content is still accessible
    const outputText = await outputPanel.textContent();
    expect(outputText).toContain('Item 150');
    expect(outputText).toContain('Object 150');
  });
});
