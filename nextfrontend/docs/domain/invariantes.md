# Invariantes (detalle)

Plantilla: **fuente única · correcto · anti-patrón · guardarraíl · verificación**.

---

## INV-01 · La fecha de calendario se guarda y formatea en UTC (no resta un día)

Las fechas "sin hora" (fecha de nacimiento, inicio de plan, fecha de sesión) se guardan a
**medianoche UTC** (`new Date(\`${key}T00:00:00.000Z\`)`). Formatearlas en zona RD resta un día.

- **Fuente única:** `lib/format/datetime.ts` → `formatCalendarDate()` (UTC); `formatDate()` / `formatDateTime()` (fijan `America/Santo_Domingo`, para instantes).
- **Correcto:** `formatCalendarDate(student.dateOfBirth)`
- **Anti-patrón:** `new Intl.DateTimeFormat('es-DO', { dateStyle }).format(new Date(iso))`
- **Guardarraíl:** regla ESLint que prohíbe `Intl.DateTimeFormat` / `Intl.DateTimeFormat().format` fuera de `lib/format/datetime`.
- **Verificación:** `tests/unit/invariants/fechas.test.ts` y `tests/component/invariants/date-picker.test.tsx`.

---

## INV-02 · El grado se resuelve por programa (ADULT/YOUTH)

Hay nombres repetidos entre programas (p. ej. "Amarillo"). El grado debe resolverse por
`currentRankId` o, si no, por nombre **con el mismo programa** del alumno y prefiriendo el grado
propio de la escuela sobre el global.

- **Fuente única:** `lib/dashboard/rank-resolution.ts` → `pickStudentRank()`
- **Correcto:** `pickStudentRank(ranks, { currentRank, currentRankId, studentProgram, schoolId })`
- **Anti-patrón:** `ranks.find((r) => r.name === student.currentRank)`
- **Verificación:** `tests/unit/invariants/rank-resolution.test.ts`

---

## INV-03 · Las katas del expediente tienen una sola puerta

El expediente técnico es `StudentTechnique`. Solo se crea/lee por los módulos de dominio, nunca
`createMany` ad-hoc en una ruta o componente. La progresión de un grado (grado actual + siguiente)
se calcula con una única función.

- **Fuente única:** `lib/dashboard/kata-curriculum.ts` (`resolveProgressionKataIds`) y `lib/dashboard/technique-assign.ts` (`assignTechniquesToTargets`, `assignTechniquesToStudentsByIds`, `assignTechniquesToStudentGroup`).
- **Correcto:** asignar vía `assignTechniquesToTargets(...)`; progresión vía `resolveProgressionKataIds(...)`.
- **Anti-patrón:** `db.studentTechnique.createMany(...)` / `DELETE`/`PUT` que reemplaza el set fuera de los módulos de dominio.
- **Verificación:** `tests/integration/technique-assign.test.ts` (persistencia + idempotencia).

---

## INV-04 · Los seeds/scripts no borran datos de alumnos

Un re-seed **no** debe borrar progreso real. El borrado destructivo (catálogo legado) solo corre
con un flag explícito.

- **Fuente única:** `prisma/seed.ts`
- **Correcto:** limpieza destructiva detrás de `process.env.SEED_RESET === '1'`; el `upsert` del dueño no fuerza el grado en `update`.
- **Anti-patrón:** `db.studentTechnique.deleteMany()` / `db.studentRankHistory.deleteMany()` sin flag.
- **Verificación:** test del script + review. Nunca correr el seed contra una base con datos reales.

---

## INV-05 · Las reglas globales de CSS van en `@layer`

En Tailwind v4 los utilities viven en `@layer utilities`. Una regla **fuera de capas** gana sin
importar la especificidad y pisa los utilities (causó el `font-size:16px` en móvil).

- **Fuente única:** `app/globals.css`
- **Correcto:** reglas globales dentro de `@layer base` (o acotadas con el modificador `!` del utility cuando aplique).
- **Anti-patrón:** `input, select, textarea { font-size: … }` sin `@layer`.
- **Verificación:** review (+ stylelint opcional).

---

## INV-06 · El alcance se filtra por `scope`, no a mano

Todo acceso a datos respeta la escuela/sucursal del usuario mediante los helpers de alcance.

- **Fuente única:** `lib/dashboard/scope.ts` (`getAdminScope`, `scopeSchoolFilter`) y `getInstructorSchoolId`.
- **Correcto:** `where: { ...scopeSchoolFilter(scope), … }`
- **Anti-patrón:** `where: { schoolId: session.user.schoolId }` armado a mano por ruta.
- **Verificación:** `tests/integration/technique-assign.test.ts` (aislamiento por escuela).

---

## INV-07 · El "próximo grado"/progresión tiene una sola fuente

El "siguiente grado" y las katas que le corresponden se derivan con el mismo criterio (grado +
siguiente, mismo programa) en admin, instructor y alumno.

- **Fuente única:** `resolveProgressionKataIds({ schoolId, program, order })`
- **Correcto:** reutilizarla en creación, conversión, promoción y asignación.
- **Anti-patrón:** recomputar el "siguiente grado" por pantalla con lógica propia.
- **Verificación:** `tests/integration/kata-progression.test.ts`.

---

## INV-08 · El derecho a examen por inasistencias tiene una sola política

Las faltas mensuales, la reposición y la política al cierre se calculan en un solo lugar. El
historial de política es por escuela y no es retroactivo: cada cuatrimestre cerrado usa la
última política vigente antes de su fecha de cierre.

- **Fuente única:** `lib/dashboard/absence-policy.ts` (`summarizeMonthlyAbsences`, `evaluateExamRight`, `resolveAbsencePolicyAt`) y `lib/dashboard/absence-policy-settings.ts` (historial por escuela).
- **Correcto:** pasar `closedAt` y `policy` al resumir un cuatrimestre cerrado; guardar cada cambio como una fila nueva con `effectiveFrom`.
- **Anti-patrón:** recalcular pendientes o comparar fechas de reposición a mano en componentes; actualizar la política existente en vez de agregar historial.
- **Verificación:** `tests/unit/absence-policy.test.ts`, `tests/component/student-exam-right.test.tsx` y `tests/component/admin-absence-policy.test.tsx`.

---

## INV-09 · La reposición online tiene una sola puerta

Una reposición online de 35 min se agenda, completa y cobra solo por `lib/dashboard/online-recovery.ts`. Al completarla se crea una asistencia `online_recovery` de 0.58 h y se enlaza la falta original con `recoveredById` dentro de la misma transacción. Una falta no puede tener dos reposiciones online.

- **Fuente única:** `lib/dashboard/online-recovery.ts` (`createOnlineRecovery`, `completeOnlineRecovery`, `informOnlineRecoveryCost`).
- **Correcto:** completar con la transacción del módulo; scope por escuela/instructor y permisos centralizados.
- **Anti-patrón:** crear la `Attendance` o setear `recoveredById` a mano en rutas/componentes; agendar dos reposiciones para la misma falta.
- **Verificación:** `tests/integration/online-recovery.test.ts`.
