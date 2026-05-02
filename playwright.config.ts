import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for E2E tests with Electron
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: false, // Electron apps can't run multiple instances easily

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker for Electron tests */
  workers: 1,

  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',

  /* Shared settings for all the projects below */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Timeout for each test */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000,
  },
});
