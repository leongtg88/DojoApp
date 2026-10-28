import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.mjs',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/playwright.json' }],
  ],
  outputDir: 'reports/test-results',
  use: {
    locale: 'es-DO',
    timezoneId: 'America/Santo_Domingo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'prod',
      use: { baseURL: process.env.AUDIT_PROD_URL ?? 'http://127.0.0.1:3100' },
    },
    {
      name: 'new',
      use: { baseURL: process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101' },
    },
  ],
})
