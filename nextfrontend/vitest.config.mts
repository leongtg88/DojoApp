import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// `server-only` lanza un error al importarse fuera del runtime de React Server
// Components. En las pruebas de Node lo sustituimos por un módulo vacío.
const serverOnlyStub = fileURLToPath(new URL('./tests/unit/stubs/server-only.ts', import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'server-only': serverOnlyStub,
    },
  },
})
