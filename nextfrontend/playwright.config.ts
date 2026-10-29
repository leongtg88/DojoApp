import { defineConfig, devices } from '@playwright/test'

// Pruebas E2E del flujo WebAuthn. Requieren Chromium (el autenticador virtual
// se inyecta vía CDP). Si no se define E2E_BASE_URL, Playwright levanta `pnpm dev`.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // La suite comparte una sola base de datos sembrada: los archivos no pueden
  // correr en paralelo o los logins y los datos creados se pisan entre sí.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
