import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Debe coincidir con `tests/integration/config.ts` (TEST_DATABASE_URL). Se inlina
// para evitar el warning del config loader de Vite al importar un .ts.
const TEST_DATABASE_URL = 'postgresql://test:test@localhost:55432/dojo_test'

// Suite de integración: Postgres real (testcontainers) + migraciones. Se corre aparte
// para no exigir Docker en el `pnpm test` normal (unit + componentes).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/unit/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    name: 'integration',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: 'coverage/integration',
      include: ['lib/**', 'app/api/**'],
      exclude: ['node_modules/**', 'tests/**', '**/*.d.ts', 'lib/generated/**', '.next/**'],
    },
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['./tests/integration/global-setup.ts'],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Comparten una sola base: correr los archivos en serie evita que un resetDb
    // borre los datos de otro test en curso.
    fileParallelism: false,
  },
})
