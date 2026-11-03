# Ciclo de Dominio Técnico · Fase 1 (katas + kihon)

- **Fecha:** plan redactado el 2026-11-03.
- **Estado:** documentado, **sin implementar**. Fase 1 pendiente.
- **Rama sugerida:** `ux/ciclo-evaluacion-fase-1`.
- **Cómo usarlo:** una tarea por sesión (regla de `AGENTS.md`). Antes de empezar, leer `AGENTS.md`, `docs/domain/invariantes.md` y este documento completo.
- **Documentos relacionados:** `docs/ux-reorganizacion.md` (glosario y reglas UX), `docs/ux-reorganizacion-log.md` (registro de resultados), `docs/domain/README.md` (invariantes).

---

## 1. Contexto

La app ya permite **registrar repeticiones** (`TechniquePracticeLog`) y **evaluar técnicas** (`TechniqueEvaluation`), pero las dos piezas están desconectadas:

- El alumno acumula repeticiones, pero nada le dice cuándo está listo para que lo evalúen.
- El sensei tiene que buscar alumno por alumno para descubrir quién ya practicó lo suficiente.
- La evaluación se guarda, pero el feedback no se convierte en la siguiente meta de práctica.
- No hay historia: `TechniqueEvaluation` es 1:1 y se hace `upsert`; cada evaluación sobrescribe la anterior.

El objetivo de esta fase es cerrar el bucle **practicar → estar listo → evaluar → feedback → nueva meta**, usando solo datos que ya existen y **sin migración de base de datos**.

### Decisiones tomadas por León (2026-11-03)

1. **Categorías iniciales:** katas + kihon.
2. **Umbral:** por categoría, configurable.
3. **Alcance:** Fase 1 primero, sin migración. La historia de evaluaciones queda para Fase 2.

### Decisiones menores abiertas

1. **Cola cross-student:** ¿incluir en Fase 1 una sección que liste a todos los alumnos del sensei con técnicas listas, o dejar solo el filtro dentro del alumno seleccionado? Recomendación: Fase 1b, después de validar el cálculo por alumno.
2. **Umbral inicial de kihon:** 100 repeticiones (≈10 clases con 10 reps) o 60 (más rápido y motivador). Recomendación: 100, configurable.

---

## 2. Lo que ya existe y NO hay que construir

Comprobado en el código durante la redacción de este plan:

- `TechniquePracticeLog` ya guarda `repetitions`, `place` (`DOJO`/`FUERA`), `date`, `studentTechniqueId` y `attendanceId` (`prisma/schema.prisma`).
- `StudentTechnique.practiceRepetitions` ya acumula el total histórico; **no se necesita un contador nuevo**.
- `TechniqueEvaluation` ya guarda `score`, `criteria` (rúbrica de kata), `feedback`, `evaluatedBy` y `evaluatedAt`.
- El panel del sensei (`app/(dashboard)/instructor/evaluaciones/page.tsx` + `InstructorTechniqueReview.tsx`) ya permite asignar, cambiar estado, puntuar y escribir feedback; las katas ya usan la rúbrica 70/30 (`lib/dashboard/kata-rubric.ts`).
- El alumno ya registra repeticiones desde `StudentPracticeLog.tsx` y desde `KataList.tsx`.
- `targetRepetitionsFor()` (`lib/dashboard/technique-reps.ts`) existe, pero **no sirve como umbral del ciclo**: para katas devuelve `movementsCount` (movimientos), no ejecuciones completas.
- `registerPracticeLogs()` ya distingue logs asignados (suman al expediente) de logs libres (no suman). Solo los asignados deben contar para el ciclo.
- `notifyAssignment()` ya notifica a alumno + tutores; los tipos `TECHNIQUE_EVALUATED` y `TECHNIQUE_APPROVED` ya existen.

---

## 3. Regla del ciclo

Para cada `StudentTechnique` de categoría `KATA` o `KIHON`:

```text
inicioCiclo = evaluation.evaluatedAt ?? studentTechnique.createdAt
repsCiclo   = suma de TechniquePracticeLog.repetitions
              donde studentTechniqueId = técnica
              y date > inicioCiclo
umbral      = EVALUATION_THRESHOLDS[categoría]
```

### Estados

| Estado | Condición | Significado |
|---|---|---|
| **En práctica** | `repsCiclo < umbral` | Sigue acumulando |
| **Lista para evaluar** | `repsCiclo >= umbral` y `días desde evaluatedAt >= 7` y no `APPROVED` | El sensei debería evaluarla |
| **Recomendada** | Lista + al menos 1 log `DOJO` en el ciclo | Hay evidencia de que el sensei la vio |
| **Por mejorar** | Evaluada con nota < 7.5 | Vuelve a práctica con meta |
| **Dominada** | Nota >= 7.5 y sensei marca `APPROVED` | Cuenta para el grado |

"Lista" y "Recomendada" son **derivados**, no se almacenan. "Por mejorar" y "Dominada" se apoyan en los estados actuales `IN_PROGRESS` / `APPROVED`.

### Umbrales iniciales

En `lib/dashboard/evaluation-cycle.ts`:

```ts
export const EVALUATION_THRESHOLDS = {
  KATA: 20,   // ejecuciones completas del kata
  KIHON: 100, // repeticiones acumuladas del fundamento
} as const

export const MIN_DAYS_BETWEEN_EVALUATIONS = 7
```

- **Kata:** una repetición = una ejecución completa del kata, no un movimiento.
- **Kihon:** una repetición = una ejecución del fundamento.
- Solo cuentan logs con `studentTechniqueId` (asignados). Los logs libres no alteran el expediente.
- Si el sensei borra un log o corrige una asistencia, el estado se recalcula solo; no hay contador duplicado.

### Motivos de bloqueo

Cuando no está lista, devolver un motivo para que la UI diga exactamente qué falta:

- `REPS`: "Te faltan N ejecuciones".
- `CADENCE`: "Debe pasar una semana desde la última evaluación".
- `APPROVED`: "Ya está dominada".

---

## 4. Alcance de Fase 1

| Entra | No entra (fases posteriores) |
|---|---|
| Estado derivado "Lista para evaluar" por técnica | Historial de evaluaciones (Fase 2) |
| Umbral por categoría en código | Configuración por escuela en BD (Fase 2) |
| Filtro/cola del sensei dentro del alumno | Cola cross-student (Fase 1b, decisión abierta) |
| Barra de ciclo y badge en la UI del alumno | Notificación automática (Fase 1.5; requiere enum) |
| Sugerencia de foco tras la rúbrica | Plan de práctica automático (Fase 3) |
| Tests unitarios + integración | Simulacro y acta de examen (Fase 4) |

### Fuera de alcance explícito

- **No** modificar el esquema Prisma.
- **No** cambiar `TechniqueEvaluation` de 1:1 a 1:N.
- **No** añadir valores al enum `NotificationType`.
- **No** usar `targetRepetitionsFor()` como umbral.
- **No** bloquear la evaluación si falta evidencia en dojo: es una recomendación, no una regla dura.
- **No** tocar la elegibilidad de examen ni la lógica de `student-queries.ts` de horas/asistencia.

---

## 5. Tareas

### T1 · Módulo de dominio + tests unitarios

**Crear:** `lib/dashboard/evaluation-cycle.ts`

Funciones puras, sin Prisma:

```ts
export type EvaluationCategory = 'KATA' | 'KIHON'

export type EvaluationCycleState =
  | { ready: true; recommended: boolean; cycleReps: number; threshold: number; remainingReps: 0; reason: null }
  | { ready: false; recommended: false; cycleReps: number; threshold: number; remainingReps: number; reason: 'REPS' | 'CADENCE' | 'APPROVED' }

export function resolveCycleThreshold(category: EvaluationCategory): number
export function cycleRepetitions(
  logs: { repetitions: number; place: string; date: Date }[],
  since: Date,
): number
export function evaluateCycleState(input: {
  category: EvaluationCategory
  approved: boolean
  assignedAt: Date
  lastEvaluatedAt: Date | null
  logs: { repetitions: number; place: string; date: Date }[]
  now?: Date
}): EvaluationCycleState
export function suggestNextFocus(score: number, criteria: Record<string, number> | null): string | null
```

**Reglas de `suggestNextFocus`:**
- Kata con `criteria`: devolver el criterio con menor nota (usar las etiquetas de `KATA_RUBRIC`).
- Kata sin `criteria` o kihon: por banda de nota (`<6`, `6–7.4`, `>=7.5`).

**Tests:** `tests/unit/evaluation-cycle.test.ts`
- Umbral de kata y kihon.
- `cycleRepetitions` ignora logs anteriores a `since`.
- Lista con reps suficientes.
- No lista por reps insuficientes (`remainingReps` correcto).
- No lista por cadencia.
- No lista si `approved`.
- `recommended` exige al menos un log `DOJO`.
- `suggestNextFocus` devuelve el criterio más bajo y la banda correcta.

**Aceptación:** `pnpm test:unit` pasa y no hay imports de `@/lib/db` en el módulo.

---

### T2 · Tipos y queries

**Modificar:** `types/dashboard.ts`

Añadir a `StudentTechnique` y `KataProgressItem`:

```ts
cycleReps: number
cycleThreshold: number
readyForEvaluation: boolean
evaluationRecommended: boolean
cycleBlockedReason: 'REPS' | 'CADENCE' | 'APPROVED' | null
remainingReps: number
```

**Modificar:** `lib/dashboard/instructor-queries.ts` (`getInstructorTechniqueReview`)

- Incluir en `student.techniques` los `practiceLogs` necesarios: `repetitions`, `place`, `date`.
- Calcular `evaluateCycleState` por técnica con `evaluation?.evaluatedAt ?? createdAt`.
- Mantener el resto de campos existentes (`targetRepetitions`, `evaluation`, etc.).

**Modificar:** `lib/dashboard/student-queries.ts` (`getStudentKataProgress`)

- Incluir `practiceLogs` en `student.techniques`.
- Calcular el estado del ciclo para cada kata.
- Mantener `practiceRepetitions` y `targetRepetitions` para compatibilidad; añadir los campos nuevos.

**Nota de rendimiento:** para un solo alumno el volumen de logs es acotado. Si crece, en Fase 2 se acota con `cycleStartedAt`. No hacer `N+1` por técnica: una sola consulta con los logs del alumno y agrupar en JS.

**Aceptación:** los tipos compilan y las queries devuelven `cycleReps` coherente con los logs.

---

### T3 · UI del sensei

**Modificar:** `components/dashboard/instructor/InstructorTechniqueReview.tsx`

- Añadir filtro **"Listas (n)"** junto a Todas / Por practicar / En práctica / Revisadas.
- En cada fila, mostrar `cycleReps / cycleThreshold` y un badge:
  - Verde: **"Lista"**.
  - Ámbar: **"Lista · sin evidencia en dojo"**.
  - Neutro: **"Faltan N"**.
- Si `cycleBlockedReason === 'CADENCE'`, mostrar "Cadencia: faltan N días" (o texto equivalente).
- No cambiar el flujo de guardado ni la rúbrica.

**Aceptación:** con un alumno de prueba con 20 reps de kata, la fila aparece en "Listas" y el badge es correcto.

---

### T4 · UI del alumno

**Modificar:** `components/dashboard/dojo/KataList.tsx`

- Barra `cycleReps / cycleThreshold` en la tarjeta de cada kata.
- Badge **"Lista para evaluación"** cuando `readyForEvaluation`.
- Copy: "Tu sensei la revisará en la próxima clase. No necesitas más volumen."
- Si no está lista: "Te faltan N ejecuciones" o el motivo de cadencia.

**Modificar:** `components/dashboard/student/StudentPracticeLog.tsx` (opcional, recomendado)

- Mostrar `X / umbral` junto a cada kata/kihon del ciclo.
- No cambiar el formulario ni el endpoint.

**Aceptación:** el alumno ve su progreso de ciclo y entiende qué falta sin preguntar.

---

### T5 · Sugerencia de foco tras la rúbrica

**Modificar:** `components/dashboard/instructor/InstructorTechniqueReview.tsx` (modal de rúbrica)

- Al puntuar los 10 criterios, resaltar el criterio con menor nota.
- Mostrar una sugerencia de "Próxima meta" basada en `suggestNextFocus`.
- El sensei puede editar el feedback libre; la sugerencia es solo una ayuda.
- No añadir campos nuevos a la BD: el feedback sigue guardándose en `TechniqueEvaluation.feedback`.

**Aceptación:** al completar la rúbrica, la UI sugiere el criterio más bajo y el sensei puede guardar sin pasos extra.

---

### T6 · Tests de integración y cierre

**Crear:** `tests/integration/evaluation-cycle.test.ts`

Casos:
1. Registrar 20 reps de una kata asignada → `readyForEvaluation` verdadero.
2. Registrar 19 → falso, `remainingReps === 1`.
3. Registrar 20 reps pero última evaluación hace 3 días → falso por `CADENCE`.
4. Registrar logs libres → no cuentan.
5. Guardar evaluación → el ciclo vuelve a 0 y deja de estar listo.
6. Kihon con 100 reps → listo.

**Verificación final:**
- `pnpm check` (lint + typecheck + unit + componente).
- `pnpm test:integration` (requiere Docker).
- Revisar que no haya cambios en `prisma/schema.prisma` ni migraciones nuevas.
- Añadir entrada en `docs/ux-reorganizacion-log.md` si se considera tarea UX.

---

## 6. Criterios de aceptación de la fase

1. Una kata con 20 ejecuciones desde la última evaluación, al menos 1 log en `DOJO` y 7 días de cadencia muestra **"Lista para evaluación"** al alumno y al sensei.
2. Un kihon con 100 repeticiones hace lo mismo.
3. Con 19 ejecuciones muestra **"Te falta 1"**; con 0 muestra el estado inicial.
4. Si la última evaluación fue hace 3 días, aunque tenga 30 reps, muestra **"Cadencia: faltan 4 días"**.
5. Al guardar una evaluación, el ciclo vuelve a 0 y desaparece de "Listas".
6. Los logs libres no cuentan; los asignados sí.
7. `pnpm check` pasa y los tests nuevos cubren los casos de T1 y T6.
8. No hay migración ni cambio de esquema.

---

## 7. Limitaciones conocidas de Fase 1

- **Sin historial:** `TechniqueEvaluation` sigue siendo 1:1. No se puede ver la evolución 7.4 → 8.1 ni comparar ciclos. Fase 2.
- **Editar una evaluación reinicia el ciclo:** cualquier `upsert` actualiza `evaluatedAt`. Aceptable en Fase 1; se corrige con `cycleStartedAt` en Fase 2.
- **Configuración en código:** "por categoría configurable" significa un objeto central en `evaluation-cycle.ts`. Para que el admin lo edite desde la app hace falta un campo en `School` o una tabla de política; eso es Fase 2.
- **Sin notificación automática:** la cola y el badge ya disparan la evaluación. Añadir `TECHNIQUE_READY_FOR_EVALUATION` requiere una migración de enum; Fase 1.5.
- **Sin cola cross-student:** en Fase 1 el sensei ve las técnicas listas dentro del alumno seleccionado. La cola global es Fase 1b (decisión abierta).

---

## 8. Fases posteriores (contexto, no implementar ahora)

### Fase 1.5 · Aviso al cruzar el umbral
- Añadir `TECHNIQUE_READY_FOR_EVALUATION` a `NotificationType` (migración aditiva).
- Notificar al sensei de las clases activas del alumno y al alumno.
- Deduplicar por alumno/técnica/ciclo.

### Fase 2 · Historia de evaluaciones
- `TechniqueEvaluation` 1:N: quitar `@unique`, añadir `cycle`, `repsAtEvaluation`, `outcome`, `context` (`CLASS`, `PRACTICE`, `MOCK_EXAM`, `GRADE_EXAM`), `strengths`, `nextObjective`, `evidenceUrl`.
- `StudentTechnique.cycleStartedAt`.
- Tendencia de nota por kata y comparación entre ciclos.
- Backfill: la evaluación actual queda como ciclo 1.
- Política por escuela en BD.

### Fase 3 · Bucle de feedback y plan
- Feedback estructurado (fortaleza / corrección / meta) + tags rápidos.
- "Plan de hoy" con 3 recomendaciones.
- Racha semanal y modo lote del sensei.

### Fase 4 · Examen
- Simulacro con `context = MOCK_EXAM`.
- Panel de readiness por grado.
- Acta exportable con historial de ciclos.

---

## 9. Checklist para la próxima sesión

1. Leer `AGENTS.md`, `docs/domain/invariantes.md` y este documento.
2. Confirmar las dos decisiones abiertas (cola cross-student y umbral de kihon).
3. Crear la rama `ux/ciclo-evaluacion-fase-1`.
4. Implementar **T1** (`evaluation-cycle.ts` + tests unitarios) y correr `pnpm test:unit`.
5. Implementar **T2** (tipos + queries) y verificar que compila.
6. Implementar **T3** y **T4** (UI sensei y alumno).
7. Implementar **T5** (sugerencia de foco).
8. Implementar **T6** (integración + `pnpm check`).
9. Registrar resultados en `docs/ux-reorganizacion-log.md`.
10. No hacer push, no abrir PR, no tocar `main`: dejar la rama lista y esperar decisión de León.

---

## 10. Referencias de código

| Pieza | Archivo |
|---|---|
| Modelo de repeticiones | `prisma/schema.prisma` → `TechniquePracticeLog`, `StudentTechnique` |
| Modelo de evaluación | `prisma/schema.prisma` → `TechniqueEvaluation` |
| Registro de reps | `lib/dashboard/technique-reps.ts` |
| Rúbrica de kata | `lib/dashboard/kata-rubric.ts` |
| Query del sensei | `lib/dashboard/instructor-queries.ts` → `getInstructorTechniqueReview` |
| Query del alumno | `lib/dashboard/student-queries.ts` → `getStudentKataProgress` |
| UI del sensei | `components/dashboard/instructor/InstructorTechniqueReview.tsx` |
| UI de katas del alumno | `components/dashboard/dojo/KataList.tsx` |
| Registro de reps del alumno | `components/dashboard/student/StudentPracticeLog.tsx` |
| Endpoint de evaluación | `app/api/dashboard/instructor/techniques/route.ts` |
| Notificaciones | `lib/notifications/create.ts`, `lib/notifications/types.ts` |
| Invariantes | `docs/domain/README.md`, `docs/domain/invariantes.md` |
