# Guía de la estructura de tests

> Documento conceptual. Explica **cómo** está montada la suite de pruebas de este
> proyecto y **por qué**, para poder replicarla en otro proyecto Next.js + Prisma.
> No incluye el contenido de los archivos; cada pieza se referencia para copiarla
> del origen exacto.

## 1. Visión general

Las pruebas se organizan en **cuatro capas** que responden a preguntas distintas.
Cuanto más arriba, más lenta y más fiel al sistema real; cuanto más abajo, más
rápida y más aislada.

| Capa | Directorio | Entorno | Herramienta | Comando |
|------|-----------|---------|-------------|---------|
| Unit | `tests/unit/**/*.test.ts` | Node | Vitest | `pnpm test:unit` |
| Componente | `tests/component/**/*.test.tsx` | jsdom | Vitest + RTL + jest-dom | `pnpm test:component` |
| Integración | `tests/integration/**/*.test.ts` | Node + Postgres real | Vitest + Prisma + testcontainers | `pnpm test:integration` |
| E2E | `tests/e2e/*.spec.ts` | Chromium | Playwright | `pnpm test:e2e` |

Principio rector: **cada capa vive en su propia carpeta y su propio config**, de
modo que las pruebas rápidas (unit + componente) nunca arrastran infraestructura
(Docker/BD) que no necesitan.

## 2. La pirámide y los entornos

### Unit — `tests/unit`
Prueban **funciones puras y helpers** de `lib/` (formato de fechas, resolución de
grados, validaciones, utilidades de horarios). Entorno `node`, sin DOM ni BD.
Son las más rápidas y numerosas. Ver ejemplo: `tests/unit/invariants/rank-resolution.test.ts`.

### Componente — `tests/component`
Prueban **componentes cliente** aislados del runtime de Next. Entorno `jsdom` con
React Testing Library + jest-dom. Para que los componentes que usan
`useRouter()`/`<Link>`/`server-only` rendericen, se sustituyen por **stubs**
(ver §4). Ver ejemplo: `tests/component/student-dashboard-overview.test.tsx`.

### Integración — `tests/integration`
Prueban **persistencia y alcance contra una base de datos real**. Se levanta un
Postgres efímero con **testcontainers**, se aplican las migraciones y se prueba
contra `db` real. Validan cosas que un mock no cubre: filtros por `scope`,
progresión de katas, flujos de ruta. Ver ejemplo: `tests/integration/scope.test.ts`.

### E2E — `tests/e2e`
Prueban **flujos completos** en un navegador Chromium real (Playwright), contra
una app levantada con seed determinista. Ver ejemplo: `tests/e2e/login-flow.spec.ts`.

## 3. Por qué los configs están separados

Tres archivos, una responsabilidad por archivo:

- **`vitest.config.mts`** — define dos *proyectos* (`unit` y `component`) con
  entornos distintos dentro del mismo runner, más los `resolve.alias` y la
  cobertura (`provider: 'v8'`). Corre con `pnpm test`.
- **`vitest.integration.config.mts`** — config aparte para integración. Fija
  `environment: 'node'`, inyecta `DATABASE_URL`/`DIRECT_URL` de la BD de test,
  declara `globalSetup` (levantar contenedor + migraciones) y
  `fileParallelism: false` (los tests comparten una sola BD y `resetDb` truncaría
  los datos de otro test en curso). Corre con `pnpm test:integration`.
- **`playwright.config.ts`** — E2E. `testDir: './tests/e2e'`, un solo proyecto
  Chromium, `webServer` que levanta `pnpm dev` salvo que se defina `E2E_BASE_URL`
  (para apuntar a un entorno ya levantado).

**La idea a replicar:** separar lo que exige infraestructura (Docker en
integración, dev server en e2e) de lo que no, para que `pnpm test` sea siempre
rápido y sin precondiciones.

## 4. Aislamiento de Next: los stubs

Next exige su runtime en ciertas importaciones que no existen en Node/jsdom. En
vez de cargar Next en las pruebas, se reemplazan con implementaciones mínimas vía
`resolve.alias` en los configs de Vitest:

- `server-only` → `tests/unit/stubs/server-only.ts` (export vacío; en runtime real
  `server-only` lanza al importarse fuera de un RSC).
- `next/navigation` → `tests/component/stubs/next-navigation.ts` (`useRouter`,
  `usePathname`, `useSearchParams`, `useParams`, `redirect`, `notFound`).
- `next/link` → `tests/component/stubs/next-link.tsx` (renderiza un `<a>` plano).

**La idea a replicar:** aislar el framework en la frontera, no pelear contra su
runtime en las pruebas.

## 5. `setup.ts` de componente

`tests/component/setup.ts` hace tres cosas:

1. Importa `@testing-library/jest-dom/vitest` (matchers como `toBeInTheDocument`).
2. Rellena APIs que jsdom no trae y que usan Radix/`react-day-picker`:
   `ResizeObserver` y `window.matchMedia`.
3. Ejecuta `cleanup()` tras cada test (RTL no lo hace solo en Vitest).

Se declara en `setupFiles` del proyecto `component`.

## 6. Helpers y fixtures por capa

Cada capa tiene sus propios helpers, para no acoplar una capa a los artefactos de
otra:

- **Unit:** no necesita fixtures; construye datos locales en el propio test.
- **Componente:** `tests/component/fixtures.ts` — *factories* de los tipos del
  dominio (`summary()`, `kataProgress()`, `grado()`, …) con patrón
  `overrides: Partial<T> = {}` para sobreescribir solo lo que el test necesita.
- **Integración:**
  - `tests/integration/config.ts` — constantes de conexión (puerto configurable
    con `TEST_DB_PORT`).
  - `tests/integration/global-setup.ts` — levanta el contenedor y corre
    `prisma migrate deploy` una vez por corrida.
  - `tests/integration/db.ts` — reexporta `db` y expone `resetDb()`, que hace
    `TRUNCATE ... RESTART IDENTITY CASCADE` de todas las tablas públicas.
  - `tests/integration/fixtures.ts` — factories que crean filas reales
    (`createSchool`, `createStudent`, `createUser`, …).
  - `tests/integration/http.ts` — `jsonRequest()`, `routeParams()`, `readJson()`
    para invocar handlers de ruta con la firma de Next 16
    (`{ params: Promise<T> }`).
- **E2E:** `tests/e2e/helpers.ts` — `login()` y `credentials()` (credenciales por
  variable de entorno `E2E_<ROL>_EMAIL`/`E2E_<ROL>_PASSWORD`).

**Patrón recurrente en integración:** importar los helpers con `await import(...)`
porque dependen del entorno/`DATABASE_URL`, y hacer `beforeEach(resetDb)` para
aislar cada test.

## 7. Convenciones de escritura

- **Trazabilidad documento ↔ código:** el `describe` lleva un ID que referencia a
  `docs/domain/`. Ej.: `INV-02 · el grado se resuelve por programa` o
  `F4-01 · resumen del alumno`. Si no hay ID, es una prueba puntual, no un
  invariante.
- **Imports:** desde el alias `@/` (definido en `tsconfig.json` y en los configs).
- **Nombres:** `*.test.ts` (unit/integración), `*.test.tsx` (componente),
  `*.spec.ts` (e2e). Los invariantes de unidad viven en `tests/unit/invariants/`.
- **Un test = una afirmación de comportamiento**, con descripciones que expresan
  la regla ("para un niño con 'Amarillo' toma el de YOUTH, no el de ADULT").
- **Cobertura** se limita a `lib/**` y `app/api/**` (la lógica que queremos
  medir), excluyendo `tests/`, `lib/generated/**` y `.next/**`.

## 8. Scripts y CI

Scripts clave en `package.json`:

| Script | Qué corre |
|--------|-----------|
| `test` | unit + componente |
| `test:unit` / `test:component` | una capa sola |
| `test:integration` | integración con el config aparte |
| `test:coverage` / `test:coverage:integration` | cobertura por capa |
| `test:watch` | Vitest en modo watch |
| `test:e2e` | Playwright |
| `check` | lint + typecheck + unit + componente |

CI en `.github/workflows/ci.yml`, dos jobs:

- **`quality`** — `pnpm lint`, `pnpm typecheck`, `pnpm test`,
  `pnpm test:integration` (usa el Docker del runner para testcontainers).
- **`e2e`** — Postgres como *service*, `migrate deploy` + seed, instala Chromium
  y corre `pnpm test:e2e`. Define `AUTH_SECRET` y las variables `E2E_*` con
  credenciales de seed.

Además, `.githooks/pre-commit` corre `guard-env` para bloquear commits con
secretos (activable con `git config core.hooksPath .githooks`).

## 9. Guía de portado a otro proyecto Next.js + Prisma

Checklist para replicar la estructura en un proyecto nuevo:

1. **Dependencias** — instalar el grupo de test:
   `vitest`, `@vitest/coverage-v8`, `@vitejs/plugin-react`, `jsdom`,
   `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`,
   `@playwright/test`, `@testcontainers/postgresql`, `testcontainers`, `tsx`.
2. **Alias** — asegurar `"paths": { "@/*": ["./*"] }` en `tsconfig.json`.
3. **Configs** — copiar y adaptar:
   - `vitest.config.mts` (proyectos `unit`/`component`, aliases, cobertura).
   - `vitest.integration.config.mts` (BD de test, `globalSetup`,
     `fileParallelism: false`).
   - `playwright.config.ts` (`testDir`, `webServer`, `E2E_BASE_URL`).
4. **Carpetas** — crear `tests/{unit,component,integration,e2e}`.
5. **Stubs** — copiar `tests/unit/stubs/server-only.ts`,
   `tests/component/stubs/next-navigation.ts` y `next-link.tsx`, y apuntar los
   `resolve.alias` a ellos.
6. **Setup** — copiar `tests/component/setup.ts` y declararlo en `setupFiles`.
7. **Fixtures/helpers** — reescribir las factories según el dominio del nuevo
   proyecto (mantener el patrón `overrides`); copiar `http.ts` y adaptar `db.ts`
   (`resetDb`) y `config.ts`.
8. **Scripts** — replicar `test`, `test:*`, `check`, `test:e2e` en `package.json`.
9. **CI** — copiar `ci.yml` ajustando: nombre de BD, `working-directory`, seed y
   variables `E2E_*`.

**Qué ajustar siempre:** el puerto de testcontainers (`TEST_DB_PORT`, por si cae
en rango reservado en Windows), el nombre de la base (`dojo_test`), las
credenciales del contenedor, el seed (`prisma/seed.ts`) y las credenciales `E2E_*`.
