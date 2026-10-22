<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Secretos y entorno (regla del proyecto)

- **Nunca** leer, mostrar, copiar ni editar `.env.local` (ni ningún `.env*` que no sea `.env.example`). Contiene credenciales reales.
- Si se necesita una variable de entorno, referenciarla por su nombre (`process.env.X`) sin volcar su valor.
- No añadir secretos a componentes cliente ni variables `NEXT_PUBLIC_*`.
- Hay un guard que bloquea commits con secretos: `pnpm guard:env` (activo vía hook `.githooks/pre-commit`).

## Dominio e invariantes (leer antes de tocar código)

Reglas que SIEMPRE deben cumplirse, en todos los paneles (admin, instructor, alumno).
La fuente única vive en `lib/`; no la reimplementes por pantalla.

- **Fechas**: distingue **fecha de calendario** (sin hora; llega como `…T00:00:00.000Z` o `"YYYY-MM-DD"`) de **instante**.
  - Calendario → `formatCalendarDate()` (UTC). Nunca `new Intl.DateTimeFormat(...).format(new Date(iso))`.
  - Instante → `formatDate()` / `formatDateTime()` (fijan `America/Santo_Domingo`).
  - Fuente única: `lib/format/datetime.ts`.
- **Grado/programa**: resuelve el grado por `currentRankId` o por nombre **con el programa del alumno** (ADULT/YOUTH).
  Fuente única: `lib/dashboard/rank-resolution.ts`.
- **Katas del expediente**: solo vía `StudentTechnique`. Progresión con `resolveProgressionKataIds()`
  (`lib/dashboard/kata-curriculum.ts`); asignación con `lib/dashboard/technique-assign.ts`.
  No crees `studentTechnique` sueltos en rutas/componentes.
- **Alcance/roles**: usa `getAdminScope()` / `getInstructorSchoolId()` + `scopeSchoolFilter()`.
  No filtres por escuela a mano.
- **Seeds/scripts**: no borrar datos de alumnos (`StudentTechnique`, `StudentRankHistory`);
  los resets van detrás de un flag explícito (`SEED_RESET=1`).
- **Estilos**: las reglas globales de `app/globals.css` van dentro de `@layer` para no pisar utilities.

Detalle y verificación de cada regla: `docs/domain/` (invariante → módulo → test).

## Guía de reorganización UX/UI

Reglas, principios y tareas de la remodelación del portal: `docs/ux-reorganizacion.md`.

- Leer las secciones 1–6 completas antes de tocar código de UX/UI.
- Trabajar **una tarea por sesión** (`UX-…`), con diff pequeño y plan previo.
- Registrar resultados en `docs/ux-reorganizacion-log.md` (no en la guía).
- Respetar el glosario, los invariantes de dominio y las tareas con revisión humana obligatoria.

