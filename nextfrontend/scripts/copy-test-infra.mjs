#!/usr/bin/env node
/**
 * copy-test-infra.mjs
 *
 * Copia la INFRAESTRUCTURA de tests de este proyecto (configs de Vitest/Playwright,
 * stubs de Next, setup de componente y helpers genéricos) a un proyecto destino
 * Next.js + Prisma, dejando un esqueleto de carpetas listo para escribir tests.
 *
 * NO copia los tests de negocio de DojoApp (son específicos). Los fixtures que
 * dependen del dominio de Dojo se copian como `*.example.ts` a modo de referencia.
 *
 * Uso:
 *   node scripts/copy-test-infra.mjs <ruta-destino> [--force]
 *
 *   <ruta-destino>  Ruta (absoluta o relativa al cwd) del proyecto destino.
 *   --force         Sobrescribe los archivos que ya existan. Por defecto, los
 *                   archivos existentes se respetan (no se pisan).
 *   --help          Muestra esta ayuda.
 *
 * Ejemplo:
 *   node scripts/copy-test-infra.mjs ../MiOtroProyecto
 *   node scripts/copy-test-infra.mjs C:/Users/ASUS/MiOtroProyecto --force
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Raíz del proyecto fuente (este repo). El script vive en `nextfrontend/scripts/`,
// así que la raíz es el directorio superior.
const SRC_ROOT = fileURLToPath(new URL('..', import.meta.url))

// ---------------------------------------------------------------------------
// Manifesto de archivos a copiar.
// ---------------------------------------------------------------------------

// Archivos genéricos: se copian tal cual, son reutilizables en cualquier
// proyecto Next.js + Prisma (asumen el alias `@/*` y el cliente Prisma en
// `@/lib/db`).
const GENERIC_FILES = [
  // Configs
  'vitest.config.mts',
  'vitest.integration.config.mts',
  'playwright.config.ts',
  // Stubs de Next
  'tests/unit/stubs/server-only.ts',
  'tests/component/stubs/next-navigation.ts',
  'tests/component/stubs/next-link.tsx',
  // Setup de componente (polyfills jsdom + cleanup)
  'tests/component/setup.ts',
  // Helpers de integración (conexión, contenedor, resetDb, http)
  'tests/integration/config.ts',
  'tests/integration/global-setup.ts',
  'tests/integration/db.ts',
  'tests/integration/http.ts',
]

// Archivos de ejemplo: dependen del dominio de Dojo (tipos, entidades,
// selectores). Se copian con sufijo `.example.ts` para que sirvan de plantilla
// sin romper la compilación del destino.
const EXAMPLE_FILES = [
  ['tests/component/fixtures.ts', 'tests/component/fixtures.example.ts'],
  ['tests/integration/fixtures.ts', 'tests/integration/fixtures.example.ts'],
  ['tests/e2e/helpers.ts', 'tests/e2e/helpers.example.ts'],
]

// Documentación de referencia (guía de la estructura de tests).
const DOC_FILES = ['docs/testing-guide.md']

// Carpetas que siempre deben existir en el destino (para que el esqueleto quede
// completo aunque una carpeta no reciba ningún archivo genérico).
const SKELETON_DIRS = [
  'tests/unit',
  'tests/component',
  'tests/integration',
  'tests/e2e',
]

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function usage() {
  return `Copia la infraestructura de tests a un proyecto Next.js + Prisma.

Uso:
  node scripts/copy-test-infra.mjs <ruta-destino> [--force]

Opciones:
  --force   Sobrescribe los archivos existentes (por defecto se respetan).
  --help    Muestra esta ayuda.`
}

// Devuelve los archivos de un manifesto que existen en el origen, como
// [origen, destino] relativos a sus respectivas raíces.
function resolvePairs(files, { rename } = {}) {
  const pairs = []
  for (const entry of files) {
    const [srcRel, destRel] = Array.isArray(entry) ? entry : [entry, entry]
    const src = join(SRC_ROOT, srcRel)
    if (!existsSync(src)) {
      console.warn(`[aviso] origen no encontrado, se omite: ${srcRel}`)
      continue
    }
    pairs.push({ src, destRel })
  }
  return pairs
}

function copyOne({ src, destRel }, destRoot, force, counters) {
  const dest = join(destRoot, destRel)

  if (existsSync(dest) && !force) {
    counters.skipped.push(destRel)
    return
  }

  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
  counters.copied.push(destRel)
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const positional = args.filter((a) => !a.startsWith('--'))
  const destArg = positional[0]

  if (args.includes('--help') || args.includes('-h')) {
    console.log(usage())
    process.exit(0)
  }

  if (!destArg) {
    console.error('Falta la ruta de destino.\n')
    console.log(usage())
    process.exit(1)
  }

  const destRoot = resolve(process.cwd(), destArg)
  const counters = { copied: [], skipped: [] }

  console.log(`\nOrigen : ${SRC_ROOT}`)
  console.log(`Destino: ${destRoot}`)
  console.log(`Modo   : ${force ? 'sobrescribir' : 'respetar existentes'}\n`)

  // 1. Esqueleto de carpetas.
  for (const dir of SKELETON_DIRS) {
    mkdirSync(join(destRoot, dir), { recursive: true })
  }

  // 2. Archivos genéricos.
  for (const pair of resolvePairs(GENERIC_FILES)) {
    copyOne(pair, destRoot, force, counters)
  }

  // 3. Archivos de ejemplo (fixtures/helpers específicos de Dojo).
  for (const pair of resolvePairs(EXAMPLE_FILES)) {
    copyOne(pair, destRoot, force, counters)
  }

  // 4. Documentación.
  for (const pair of resolvePairs(DOC_FILES)) {
    copyOne(pair, destRoot, force, counters)
  }

  // Resumen.
  console.log('Copiados:')
  for (const f of counters.copied) console.log(`  + ${f}`)
  if (counters.skipped.length > 0) {
    console.log('\nOmitidos (ya existían; usa --force para sobrescribir):')
    for (const f of counters.skipped) console.log(`  - ${f}`)
  }
  console.log(`\nListo. ${counters.copied.length} archivo(s) copiado(s), ${counters.skipped.length} omitido(s).`)

  printNextSteps()
}

function printNextSteps() {
  console.log(`
--------------------------------------------------------------------------------
Pasos siguientes en el proyecto destino
--------------------------------------------------------------------------------
1) Instalar las dependencias de test:
   pnpm add -D vitest @vitest/coverage-v8 @vitejs/plugin-react jsdom \\
     @testing-library/react @testing-library/jest-dom @testing-library/user-event \\
     @playwright/test @testcontainers/postgresql testcontainers tsx

2) Asegurar el alias en tsconfig.json:
   "compilerOptions": { "paths": { "@/*": ["./*"] } }

3) Añadir los scripts a package.json:
   "test": "vitest run",
   "test:unit": "vitest run --project unit",
   "test:component": "vitest run --project component",
   "test:integration": "vitest run --config vitest.integration.config.mts",
   "test:coverage": "vitest run --coverage",
   "test:coverage:integration": "vitest run --config vitest.integration.config.mts --coverage",
   "test:watch": "vitest",
   "test:e2e": "playwright test",
   "check": "pnpm lint && pnpm typecheck && pnpm test"

4) Ajustar lo específico del proyecto:
   - tests/integration/config.ts : puerto (TEST_DB_PORT) y nombre de la base.
   - vitest.integration.config.mts : URL de la base de test.
   - playwright.config.ts / tests/e2e : URL y credenciales E2E_*.
   - tests/integration/db.ts : confirma que el cliente Prisma vive en @/lib/db.

5) Escribir los fixtures propios partiendo de los *.example.ts.

6) (Opcional) CI: copia .github/workflows/ci.yml y ajusta working-directory,
   nombre de base y variables E2E_*. Ver docs/testing-guide.md.
--------------------------------------------------------------------------------
`)
}

main()
