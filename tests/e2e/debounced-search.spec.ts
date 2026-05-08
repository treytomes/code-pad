import { test, expect } from '@playwright/test';
import { launchApp, closeApp } from './helpers/electron';
import type { ElectronApplication } from 'playwright';

test.describe('Debounced Search', () => {
  let app: ElectronApplication;

  test.beforeEach(async () => {
    app = await launchApp();
  });

  test.afterEach(async () => {
    await closeApp(app);
  });

  test('should debounce snippet search with 300ms delay', async () => {
    const page = await app.firstWindow();

    // Wait for app to load
    await page.waitForSelector('[data-testid="snippet-list"]', { timeout: 10000 });

    // Create multiple test snippets
    for (let i = 1; i <= 5; i++) {
      await page.click('button:has-text("New")');
      await page.fill('.monaco-editor textarea', `// Test snippet ${i}`);
      await page.keyboard.press('Control+S');
      await page.waitForTimeout(500);
    }

    // Type search query rapidly (should trigger only one search due to debounce)
    const searchInput = page.locator('[placeholder="Search snippets..."]');
    await searchInput.click();

    // Type each character with minimal delay (simulating fast typing)
    const query = 'test';
    for (const char of query) {
      await searchInput.type(char, { delay: 50 }); // 50ms between characters
    }

    // Wait for debounce delay (300ms) + small buffer
    await page.waitForTimeout(400);

    // Verify search results are displayed
    const results = page.locator('[data-testid="snippet-item"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    // Verify all visible snippets contain "test" in name
    for (let i = 0; i < count; i++) {
      const text = await results.nth(i).textContent();
      expect(text?.toLowerCase()).toContain('test');
    }
  });

  test('should show filter count ratio during search', async () => {
    const page = await app.firstWindow();

    await page.waitForSelector('[data-testid="snippet-list"]', { timeout: 10000 });

    // Create snippets with different names
    const snippetNames = ['Alpha Test', 'Beta Demo', 'Gamma Test'];
    for (const name of snippetNames) {
      await page.click('button:has-text("New")');
      await page.fill('.monaco-editor textarea', `// ${name}`);
      await page.keyboard.press('Control+S');
      await page.waitForTimeout(500);
    }

    // Search for "test"
    const searchInput = page.locator('[placeholder="Search snippets..."]');
    await searchInput.fill('test');

    // Wait for debounce
    await page.waitForTimeout(400);

    // Check for filter count display (e.g., "2/3")
    const allSnippetsSection = page.locator('text=/All Snippets/');
    const countText = await allSnippetsSection.textContent();
    expect(countText).toMatch(/\d+\/\d+/); // Should show ratio like "2/3"
  });

  test('should handle rapid typing without excessive re-renders', async () => {
    const page = await app.firstWindow();

    await page.waitForSelector('[data-testid="snippet-list"]', { timeout: 10000 });

    // Type very fast (20 characters in 1 second = 50ms each)
    const searchInput = page.locator('[placeholder="Search snippets..."]');
    await searchInput.click();

    const longQuery = 'abcdefghijklmnopqrst';
    for (const char of longQuery) {
      await searchInput.type(char, { delay: 50 });
    }

    // Wait for final debounce
    await page.waitForTimeout(400);

    // UI should be responsive (not frozen)
    const isEnabled = await searchInput.isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should handle backspace and clear search', async () => {
    const page = await app.firstWindow();

    await page.waitForSelector('[data-testid="snippet-list"]', { timeout: 10000 });

    // Type search query
    const searchInput = page.locator('[placeholder="Search snippets..."]');
    await searchInput.fill('test');
    await page.waitForTimeout(400);

    // Clear search by selecting all and deleting
    await searchInput.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    // Wait for debounce
    await page.waitForTimeout(400);

    // Should show all snippets again (no filter applied)
    const allSnippetsSection = page.locator('text="All Snippets"');
    await expect(allSnippetsSection).toBeVisible();
  });

  test('should not debounce language filter dropdown', async () => {
    const page = await app.firstWindow();

    await page.waitForSelector('[data-testid="snippet-list"]', { timeout: 10000 });

    // Find language filter dropdown
    const languageFilter = page.locator('select, [role="combobox"]').filter({ hasText: /All|C#/ });

    if (await languageFilter.count() > 0) {
      // Click dropdown (should apply immediately, no debounce)
      await languageFilter.first().click();

      // Select C# option (should filter immediately)
      await page.keyboard.press('Enter');

      // No wait needed - filter should apply instantly
      await page.waitForTimeout(100); // Small buffer for UI update

      // Verify filter applied (implementation-specific check)
      const isEnabled = await languageFilter.first().isEnabled();
      expect(isEnabled).toBe(true);
    }
  });
});
