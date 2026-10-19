import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Stubs para pruebas:
// - `server-only` lanza al importarse fuera de un React Server Component.
// - `next/navigation` y `next/link` necesitan el runtime de Next; en jsdom los
//   sustituimos por implementaciones mínimas.
const stub = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'server-only': stub('./tests/unit/stubs/server-only.ts'),
      'next/navigation': stub('./tests/component/stubs/next-navigation.ts'),
      'next/link': stub('./tests/component/stubs/next-link.tsx'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      reportsDirectory: 'coverage/unit',
      include: ['lib/**', 'app/api/**'],
      exclude: ['node_modules/**', 'tests/**', '**/*.d.ts', 'lib/generated/**', '.next/**'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.tsx'],
          setupFiles: ['./tests/component/setup.ts'],
        },
      },
    ],
  },
})
