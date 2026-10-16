# Dominio e invariantes

Reglas transversales que la app debe cumplir en **todos** los paneles (admin, instructor, alumno).
La causa de las inconsistencias que hemos corregido es que la lógica vivía "por pantalla" en vez de
"por dominio". Este directorio es el contrato: cada invariante tiene **fuente única**, **anti-patrón**
y **verificación**. Si no hay test/regla, no es un invariante, es una intención.

Detalle de cada regla: [`invariantes.md`](./invariantes.md).

| ID | Invariante | Fuente única | Anti-patrón | Verificación |
|----|-----------|--------------|-------------|--------------|
| INV-01 | La fecha de calendario se guarda y formatea en UTC (no resta un día) | `lib/format/datetime` | `Intl…format(new Date(iso))` | unit + lint |
| INV-02 | El grado se resuelve por programa (ADULT/YOUTH) | `lib/dashboard/rank-resolution` | `ranks.find(name === …)` | unit |
| INV-03 | Las katas del expediente se crean/leen vía `StudentTechnique` | `technique-assign` + `kata-curriculum` | crear `studentTechnique` suelto | integración |
| INV-04 | Los seeds/scripts no borran datos de alumnos | `prisma/seed.ts` (`SEED_RESET=1`) | `deleteMany` de datos de alumnos sin flag | script |
| INV-05 | Las reglas globales de CSS van en `@layer` | `app/globals.css` | reglas sin `@layer` que pisan utilities | review |
| INV-06 | El alcance se filtra por `scope`, no a mano | `lib/dashboard/scope` | `where: { schoolId }` manual | unit |
| INV-07 | El "próximo grado"/progresión tiene una sola fuente | `resolveProgressionKataIds` | recomputarlo por pantalla | unit |

## Cómo se hace cumplir
1. **Módulo de dominio por invariante** (fuente única): el resto de la app lo importa; nadie reimplementa.
2. **Tests con el ID del invariante** en el nombre → trazabilidad documento ↔ código.
3. **Reglas ESLint** que prohíben el anti-patrón (p. ej. `Intl.DateTimeFormat` fuera de `lib/format/datetime`).
4. **`pnpm check`** (lint + typecheck + unit + componentes + integración) y **CI en cada PR**.

## Capas de prueba
- **Unit** (`tests/unit`, entorno Node): helpers puros. → `pnpm test:unit`
- **Componente** (`tests/component`, jsdom + React Testing Library): componentes cliente, con stubs de `next/navigation` y `next/link`. → `pnpm test:component`
- **Integración** (pendiente): queries/rutas contra una DB de prueba (persistencia, cascadas, unicidad).
- **E2E** (`tests/e2e`, Playwright): flujos reales. → `pnpm test:e2e`

Correr todo: `pnpm test`. Lint + tipos + tests: `pnpm check`.
