# Mejoras de asistencia, alumnos y foco de katas · 7 tareas

- **Fecha:** plan redactado el 2026-11-02 a partir de una revisión de uso real de León.
- **Estado:** T1 implementada en la rama `ux/t1-expediente-movil` (2026-11-02). El resto sigue pendiente.
- **Cómo usarlo:** una tarea por sesión (regla de `AGENTS.md`), en el orden de la sección 3. Antes de empezar cualquiera, leer `AGENTS.md`, `docs/ux-reorganizacion.md` (secciones 1–6) y `docs/domain/invariantes.md`.
- **Documentos hermanos:** `docs/revision-dashboards.md` (backlog M-1…M-13 y decisiones abiertas), `docs/ux-reorganizacion.md` (guía UX), `docs/ux-reorganizacion-log.md` (registro de resultados).

---

## 1. Contexto

León revisó los paneles de admin e instructor en uso real y reportó siete fricciones. Tres son de usabilidad pura (detalle del alumno inalcanzable en móvil, una tarjeta de política que no se entiende, una lista de faltas que repite nombres), una es un módulo que no existe (reporte de asistencia de todos los alumnos), una es de *correctness* de contenido (el foco de técnicas muestra cosas que no tocan) y dos cierran el bucle del pase de lista: saber qué días quedaron sin pasar y avisar al alumno de lo que se registró.

El objetivo es que el dojo pueda operar sin memoria: que el sistema diga qué falta por hacer en lugar de que el instructor lo recuerde, y que el alumno se entere de lo que se registró sobre él.

### Decisiones ya tomadas por León (2026-11-02)

1. El **detalle del alumno es solo del admin**. El instructor no accede al expediente; su único problema es que en móvil su listado esconde información.
2. El reporte de asistencias es una **cuadrícula alumno × día** (tipo planilla), solo en el panel de admin. Se descartó el resumen por alumno en un rango y la versión para el instructor.
3. El aviso al alumno se envía **tanto al registrar presente como al registrar falta**.
4. "Técnicas en enfoque" debe mostrar **solo las katas que necesita para su siguiente grado**.

### Decisiones cerradas el 2026-11-02

1. **T5:** "Técnicas en enfoque" muestra solo las katas del grado **actual** (`requiredForGrade`), que son las que el alumno debe dominar para ascender y las mismas que exige el examen. No se usa el rango `order + 1`.
2. **T7:** los avisos del pase de lista son **solo in-app**. No se envía WhatsApp masivo por cada clase.

### Decisiones que siguen abiertas

Ninguna.

### Reglas del repo que condicionan el plan

De `AGENTS.md` y `docs/ux-reorganizacion.md`: una tarea por sesión con diff ≤ ~400 líneas y entrada en `docs/ux-reorganizacion-log.md`; migraciones solo aditivas; rutas nuevas con auth + Zod + `isSameOrigin` + `scopeSchoolFilter` + matriz de autorización; fechas de calendario con `formatCalendarDate` (INV-01); glosario ("Pase de lista", "Reposición", "Falta por reponer", "Expediente"); objetivos táctiles ≥ 44 px; `ConfirmModal` en vez de `window.confirm`; `EmptyState` con acción; sin librerías nuevas; nadie mueve `main` salvo León.

---

## 2. Lo que ya existe y NO hay que construir

Comprobado en el código durante la redacción de este plan. Evita trabajo duplicado:

- El **expediente completo del alumno** (`/dashboard/admin/alumnos/[studentId]` → `AdminStudentDetail.tsx`, con modo `embedded`) ya existe y es enlazable por URL. En móvil solo falta el enlace.
- `InstructorAttendanceRoster` **ya cierra la lista al guardar** (`setIsEditing(false)`, resumen + botón "Corregir"). El que no lo hace es el panel del admin.
- `ClassSession.takenAt` / `takenById` ya registran qué pases de lista se cerraron: basta para detectar los días pendientes **sin migración**.
- El Inicio del alumno ya consulta `getStudentKataProgress`, cuyos ítems traen `requiredForGrade`: el foco de katas se arregla **sin consultas nuevas**.
- `lib/dashboard/holidays.ts` ya expande feriados recurrentes y aplica el traslado al lunes de la Ley 139-97 (`buildHolidaySet`).
- `notifyAssignment` ya reparte a alumno + tutor primario + todos sus `GuardianStudent`, y ya tiene deduplicación para los tipos de asistencia.

---

## 3. Orden propuesto

Ganancias rápidas primero (T1 → T3 → T2 → T5), luego el bucle de asistencia (T6 → T7) y al final el módulo nuevo (T4). Un commit por tarea.

---

## T1 · Enlace al expediente desde el acordeón móvil del admin

**Problema.** En `AdminStudents.tsx` el acordeón móvil (`:803-886`) muestra datos del alumno pero no ofrece ir al expediente. La única entrada es la acción "Promover" de `StudentRowActions` (`:93-122`), cuyo nombre no sugiere que lleva a `/dashboard/admin/alumnos/[studentId]`, y que en escritorio se duplica con el nombre enlazado de la tabla.

**Cambios** — `components/dashboard/admin/AdminStudents.tsx`:

- Dentro del panel expandido del acordeón móvil, añadir como **acción primaria** un `<Link>` a `/dashboard/admin/alumnos/${student.id}` con texto **"Ver expediente completo"**, `min-h-11`, ancho completo, encima de `StudentRowActions`.
- Renombrar la acción "Promover" a **"Expediente"** en `StudentRowActions` (mismo destino), para que deje de prometer una promoción que esa ruta no ejecuta por sí sola. Verificar el literal real con `grep -n "Promover" components/dashboard/admin/AdminStudents.tsx` antes de tocarlo.
- No se toca la ruta ni `AdminStudentDetail`.

**Instructor (ajuste menor, sin detalle).** En `components/dashboard/instructor/InstructorStudents.tsx` las dos barras de métricas (katas revisadas y asistencia) están en `hidden sm:block`, así que en móvil el instructor solo ve nombre y grado. Convertir cada `<li>` en un acordeón (`<button aria-expanded>` + panel, mismo patrón que `AdminStudents`) que despliegue esas dos métricas y las clases. **Sin enlace al expediente**, conforme a la decisión 1.

**Pruebas.** Component test: el acordeón móvil del admin expone un enlace accesible por `getByRole('link', { name: /expediente/i })` con el `href` correcto; el del instructor **no** expone ningún enlace a `/admin/`.

---

## T2 · Hacer entendible "Política al cierre del cuatrimestre"

**Qué hace hoy realmente** (verificado). `AdminAbsencePolicyCard.tsx` es un `<select>` con dos valores. "Guardar política" hace `POST /api/dashboard/admin/attendance/policy`, que **inserta una fila nueva** en `SchoolAbsencePolicy` con `effectiveFrom = now` (append-only, `lib/dashboard/absence-policy-settings.ts:50`). No modifica ninguna `Attendance` ni recalcula nada. Si el valor elegido es igual al vigente, la API responde `{ unchanged: true }` y no escribe — pero la UI muestra "Política actualizada" igual.

El efecto real está en `lib/dashboard/absence-policy.ts:73-77` (`countsAsRecovered`): con `LOCK_AT_CLOSE`, una reposición hecha **después** del cierre del cuatrimestre no devuelve el derecho a examen de ese cuatrimestre; con `RESTORE_ON_RECOVERY`, sí. Nada es retroactivo: cada cuatrimestre cerrado usa la política vigente en su fecha de cierre (INV-08).

**Cambios** — `components/dashboard/admin/AdminAbsencePolicyCard.tsx`:

- Sustituir el `<select>` por dos **tarjetas de radio** (`role="radiogroup"`, ≥44 px), cada una con título, una frase de qué significa y **un ejemplo concreto**, p. ej.: *"Bloquear al cierre — Ana faltó 3 veces en marzo y repuso en mayo, después del cierre de enero–abril. No recupera el derecho a examen de ese cuatrimestre."*
- Añadir arriba la frase que falta para entender el contexto: *"Cada alumno tiene 2 faltas libres al mes. Desde la 3.ª hay que reponer."* (constante `FREE_ABSENCES_PER_MONTH`).
- Mostrar **"Vigente desde {fecha}"** y un `<details>` con las últimas 5 filas del historial (la tabla es append-only y hoy ese historial es invisible).
- **Deshabilitar "Guardar política" cuando la selección es la vigente**; renombrar el botón a "Guardar cambio de política".
- `ConfirmModal` antes de guardar, con la consecuencia explícita: *"Se aplica a los cuatrimestres que cierren a partir de hoy. Los ya cerrados no cambian."*
- Manejar `unchanged: true` sin mostrar el mensaje de éxito.

**Backend (aditivo, sin migración).** `getAbsencePolicyAdminData` (`lib/dashboard/absence-policy-settings.ts`) devuelve además `effectiveFrom` y `history: { policy, effectiveFrom }[]` — reutilizar `listAbsencePolicyPoints`, que ya existe. El `GET` de la ruta devuelve los mismos campos para el cambio de escuela del superadmin.

**Pruebas.** `tests/component/admin-absence-policy.test.tsx` (ya existe): el botón está deshabilitado sin cambios, el `ConfirmModal` aparece al cambiar, y el historial se lista.

---

## T3 · "Faltas por agendar" agrupadas por alumno

**Problema.** `components/dashboard/shared/OnlineRecoveryPanel.tsx:446-491` pinta un `<li>` por **falta**, así que un alumno con 4 faltas aparece 4 veces con el nombre repetido, dentro de un contenedor con `max-h-72` y scroll.

**Cambios** — mismo archivo, solo cliente (los datos ya vienen en `candidates`):

- Agrupar `filteredCandidates` por `studentId` con un `useMemo` → `{ studentId, studentName, dates: Candidate[] }[]`, ordenado por número de faltas descendente y luego por nombre.
- Cada grupo es un **acordeón**: `<button aria-expanded aria-controls>` con el nombre, un badge *"3 faltas por reponer"* y chevron; al abrir, `<ul>` interna con una fila por fecha (`formatCalendarDate(candidate.date)` + nombre de la clase) y su botón **"Agendar"** (≥44 px).
- Todos cerrados por defecto; si la búsqueda deja **un solo** alumno, abrirlo automáticamente.
- Subir el `max-h-72` o quitarlo: con los grupos cerrados la lista ya no es larga.
- `listOnlineRecoveryCandidates` tiene `take: 100` (`lib/dashboard/online-recovery.ts:128`). Con el agrupamiento ese tope deja de ser evidente, así que mostrar un aviso *"Mostrando las 100 faltas más recientes"* cuando `candidates.length === 100`. Sin cambio de API.

**Pruebas.** `tests/component/online-recovery.test.tsx`: un alumno con 3 faltas produce **un** encabezado y 3 filas internas al expandir; "Agendar" sigue abriendo el formulario con el `absenceId` correcto.

---

## T4 · Cuadrícula de asistencia alumno × día (módulo nuevo)

**Qué existe hoy.** Solo la pestaña *Auditoría* de `/dashboard/admin/asistencia` (`AdminAttendanceView` + `GET /api/dashboard/admin/attendance`): registros sueltos de **un día**, máximo 300, con filtro por estado/sucursal/texto. No hay ninguna vista de varios alumnos a lo largo del tiempo; para ver el historial de un alumno hay que entrar a su expediente uno por uno.

**Qué se construye.** Una planilla: filas = alumnos inscritos en una clase, columnas = fechas de sesión de esa clase en un mes, celdas = estado. Admin únicamente.

**Archivos nuevos:**

- `lib/dashboard/attendance-grid.ts` — función **pura** `buildAttendanceGrid({ classDayOfWeek, month, holidays, enrollments, attendances, sessions, today })` → `{ columns: { date, isHoliday, passTaken }[], rows: { studentId, name, cells, totals }[], totals }`.
  - `Cell`: `'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'RECOVERED' | 'NONE'`, derivado de `Attendance.present` / `status` / `recoveredById`.
  - Columnas = días del mes cuyo día de la semana coincide con `class.dayOfWeek`, **excluyendo feriados** (`buildHolidaySet`), y sin pasar de hoy.
  - `passTaken` por columna = existe `ClassSession` con `takenAt != null` (enlaza con T6).
  - Fechas de calendario en UTC (INV-01) y "hoy" con `santoDomingoDayKey`.
- `lib/dashboard/admin-queries.ts` — `getAdminAttendanceGrid(userId, classId, month)`: trae matrícula activa, `Attendance` del rango, `ClassSession` del rango y `Holiday` de la escuela, todo acotado con `getAdminScope()` + `scopeSchoolFilter()` (INV-06), y delega en la función pura.
- `components/dashboard/admin/AdminAttendanceGrid.tsx` — tabla con primera columna *sticky* (nombre del alumno), scroll horizontal (permitido por la regla 3.1 para tablas en móvil), leyenda de símbolos, columna final de totales por alumno (presentes / faltas / %) y fila final de totales por fecha. Encabezado de columna marcado cuando esa sesión **no tiene pase de lista**. Clases `print:` para imprimirla (mismo patrón que `/admin/alumnos/detalle/imprimir`). `EmptyState` con acción cuando la clase no tiene alumnos.

**Archivos modificados:**

- `app/(dashboard)/admin/asistencia/page.tsx` — nueva pestaña **"Cuadrícula"** en el `<Tabs>` existente, con un selector de mes (`?mes=YYYY-MM`) junto al selector de clase que ya hay.
- `lib/ui/search-params.ts` — añadir `'cuadricula'` a `parseAttendanceTab` y un `parseMonth`.

**Sin API nueva.** Se resuelve como *server component*, igual que el roster actual, usando los `searchParams` que la página ya maneja. Evita una ruta más que asegurar y probar en la matriz.

**Pruebas.** Unit de `buildAttendanceGrid` (mes con feriado en día de clase; sesión sin pase; alumno dado de alta a mitad de mes; falta repuesta; `TZ=UTC` sin correr un día). Component test del render y la leyenda.

---

## T5 · "Técnicas en enfoque" = solo las katas de su siguiente grado

**Problema.** `FocusTechniquesList.tsx:15` filtra `techniques.filter(status !== 'APPROVED')` sobre `summary.techniques`, que son **todas** las técnicas asignadas: kihon, kumite, bunkai y katas, incluidas las del grado siguiente que `resolveProgressionKataIds` asigna por adelantado (`[order, order + 1]`).

**Cómo se resuelve sin consultas nuevas.** `app/(dashboard)/estudiante/page.tsx:44` **ya** llama a `getStudentKataProgress`, y cada ítem de `kataSummary.katas` trae `requiredForGrade` (`lib/dashboard/student-queries.ts:740`), que marca las katas del grado actual — es decir, las que el alumno debe dominar para pasar al siguiente. Basta usar esa lista en vez de `summary.techniques`.

> **Decisión tomada (2026-11-02).** Se usa `requiredForGrade`, calculado con `currentRank.katas` (`student-queries.ts:635`), el mismo conjunto que alimenta `approvedKatas / totalRequiredKatas` de la elegibilidad a examen (`:727-728`). Son las katas que el alumno debe dominar para ascender; no se usa el rango `order + 1`.

**Cambios:**

- `components/dashboard/student/FocusTechniquesList.tsx` — recibe `katas: KataProgressItem[]` en vez de `techniques: StudentTechnique[]` (es su único consumidor). Filtra `requiredForGrade && status !== 'APPROVED'`. Título **"Katas para tu próximo grado"** con el nombre del grado (`kataSummary.grado.nextRankName`). `EmptyState` diferenciado: *"Ya tienes revisadas todas las katas de tu grado"* vs *"Tu instructor te asignará las katas cuando corresponda"*. Mantener el enlace a `/dashboard/estudiante/entrenar`.
- `components/dashboard/student/StudentDashboardOverview.tsx:41` — pasar `kataSummary?.katas ?? []`. Además, `focusTechniqueName` (`:27`, que alimenta `PrimaryActionCard`) debe salir de **la misma lista**, no de `techniques`, para que la acción principal y el foco no se contradigan.

**Pruebas.** Component test: con un kihon no aprobado + una kata del grado siguiente + una kata requerida, solo aparece la requerida. Actualizar `tests/component/student-dashboard-overview.test.tsx`.

---

## T6 · "Días pendientes de pasar asistencia"

**Dato que ya existe.** `ClassSession` tiene `@@unique([classId, date])` y `takenAt` / `takenById`, que `saveClassAttendance` (`lib/dashboard/attendance-roster.ts`) sella en cada guardado. Con eso basta: un día de clase pasado sin `ClassSession.takenAt` es un pase pendiente. **Sin migración.**

**Archivos nuevos:**

- `lib/dashboard/attendance-gaps.ts` — función **pura** `listPendingPasses({ classes, takenKeys, holidays, now, lookbackDays })` → `{ classId, className, branchName, date, weekday, startTime }[]`, de más antiguo a más reciente. Reglas:
  - Por cada clase activa, cada fecha de los últimos `lookbackDays` (constante exportada, **14**) cuyo día de la semana coincida con `class.dayOfWeek`.
  - Excluir feriados (`buildHolidaySet`).
  - Excluir la sesión de hoy si **aún no ha terminado** (comparar con `endTime` en hora RD; `schedule-utils.ts` ya fija el offset `-04:00`).
  - Excluir las que tengan `ClassSession.takenAt != null`.
- `components/dashboard/shared/PendingPassList.tsx` — una fila por pase pendiente (*"Martes 28 de octubre · Adultos 19:00"*) y botón **"Pasar lista"** (≥44 px) que enlaza a `…/asistencia?classId={id}&date={fecha}` del panel correspondiente. `EmptyState` con mensaje positivo cuando no hay ninguno: *"Todos los pases de lista al día"*.

**Archivos modificados:**

- `lib/dashboard/instructor-queries.ts` — `getInstructorPendingPasses(userId)`, acotado a sus clases propias (mismo criterio que `getInstructorScheduleOptions` usa para `isOwnClass`).
- `lib/dashboard/admin-queries.ts` — `getAdminPendingPasses(userId)` con `getAdminScope()` + `scopeSchoolFilter()`.
- `app/(dashboard)/instructor/asistencia/page.tsx` — cuarto chip en la sección "Pendientes" (`:77-90`) con el contador, y `<PendingPassList>` debajo del roster.
- `app/(dashboard)/admin/asistencia/page.tsx` — `<PendingPassList>` en la pestaña "Pase de lista".
- `components/dashboard/admin/AdminDashboardOverview.tsx` — fila en la bandeja "Hoy" con el contador y enlace directo, junto a las que ya existen.

**Cerrar la lista al guardar.** `InstructorAttendanceRoster` ya lo hace (`setIsEditing(false)` en `:104`, resumen + botón "Corregir" en `:139-176`): **nada que cambiar ahí**. El que no lo hace es el panel del admin: `AdminPassListPanel.tsx:23` decide `isOpen` solo en el montaje y tras guardar el editor sigue abierto. Arreglo: colapsarlo tras un guardado correcto (callback `onSaved` desde `AdminPassListEditor`, que ya tiene el estado `saved`).

**Pruebas.** Unit de `listPendingPasses`: feriado en día de clase, clase de hoy aún no terminada, pase ya tomado, ventana de 14 días, y estabilidad con `TZ=UTC`. Component test de `PendingPassList` (estado vacío y `href` generado).

---

## T7 · Avisar al alumno de su asistencia y de su falta

**Problema.** `saveClassAttendance` no crea ninguna notificación. Hoy solo notifican `confirm-all` y el `PATCH` individual (`ATTENDANCE_CONFIRMED`), que cubren punch-ins sueltos, no el pase de lista. El alumno no se entera de nada de lo que se registra sobre él.

**Migración (aditiva).** Añadir `ATTENDANCE_ABSENCE_RECORDED` al enum `NotificationType` (`ALTER TYPE "NotificationType" ADD VALUE …`). Para presente se reutiliza `ATTENDANCE_CONFIRMED`. Se escribe en la rama y **la aplica León**, antes de desplegar el código que la usa (lección del post-mortem del 2026-10-29 en `docs/ux-reorganizacion-log.md`).

**Cambios:**

- `lib/notifications/types.ts` — builder del tipo nuevo: título *"Se registró tu inasistencia"*, cuerpo con fecha (`formatCalendarDate`) y nombre de la clase, `link` a `/dashboard/estudiante/clases`, prioridad `ACTION`.
- `lib/notifications/create.ts` — añadir el tipo a `DEDUPE_NOTIFICATION_TYPES` (`:7-12`), que ya evita acumular avisos de asistencia sin leer.
- `lib/dashboard/attendance-roster.ts` — dentro de la transacción, capturar el **estado previo** de cada `Attendance` afectada; al terminar, notificar **solo a los alumnos cuyo `present` / `status` cambió** (o que no tenían registro). Las notificaciones salen **fuera** de la transacción, con `Promise.allSettled` en lotes; `notifyAssignment` ya es *best-effort* (no lanza). Esto evita que una corrección que no cambia nada vuelva a avisar a los 30 alumnos — el mismo defecto que `docs/revision-dashboards.md` apunta en M-12/M-13 para `confirm-all`.
- `notifyAssignment` ya reparte a alumno + tutor primario + todos sus `GuardianStudent`: no hay que tocar ese reparto.

> **Decisión tomada (2026-11-02) · Sin WhatsApp.** `ATTENDANCE_CONFIRMED` tiene plantilla de WhatsApp activa (`asistencia_confirmada`, `lib/integrations/whatsapp.ts:457-485`). Reutilizarla tal cual enviaría **un WhatsApp a cada alumno presente en cada pase de lista** (~30 mensajes por clase, con coste de plantilla en Meta). Estas dos notificaciones serán **solo in-app**: se añadirá a `notifyAssignment` una opción de canal (o un tipo propio `ATTENDANCE_RECORDED` sin plantilla) para no disparar WhatsApp.

**Sin push.** No se pidió push en esta tanda; el push al alumno sigue sin usarse (`sendPushToUsers` solo tiene *callers* en tests). Queda como mejora aparte.

**Pruebas.** Integración con el ID de la tarea en el `describe`: se crea la notificación al marcar ausente; se crea al marcar presente; **no** se crea al reguardar sin cambios; el tutor la recibe. Mock de notificaciones con `vi.mock('@/lib/notifications/create', …)`, según la convención del repo.

---

## 4. Verificación

Al cerrar **cada** tarea, desde `nextfrontend/`:

```bash
pnpm lint
pnpm typecheck
pnpm test                 # unit + component
pnpm test:integration     # obligatorio en T7 (toca BD/notificaciones); Docker Desktop arrancado
```

Filtrar un archivo de integración: `pnpm exec vitest run --config vitest.integration.config.mts tests/integration/<archivo>` (`pnpm test:integration -- <archivo>` **no** filtra).

Comprobaciones manuales por tarea (a 375 px y en escritorio):

| Tarea | Qué comprobar a mano |
|---|---|
| T1 | En móvil, expandir un alumno en `/dashboard/admin/alumnos` y llegar al expediente de un toque. El listado del instructor despliega métricas y **no** enlaza a `/admin/`. |
| T2 | Elegir la política vigente deja el botón deshabilitado; cambiarla pide confirmación y luego aparece en el historial con su fecha. |
| T3 | Un alumno con varias faltas aparece una sola vez; al expandir salen sus fechas y "Agendar" abre el formulario correcto. |
| T4 | Con una clase y un mes reales, la cuadrícula cuadra con el expediente de 2–3 alumnos; los feriados no aparecen como columna; se imprime legible. |
| T5 | En el Inicio del alumno solo salen katas de su grado; un kihon pendiente no aparece. Contrastar con `/dashboard/estudiante/progreso`. |
| T6 | Borrar un `takenAt` en local y confirmar que ese día aparece como pendiente; el enlace abre la clase y la fecha correctas. Tras guardar, la lista del admin se cierra. |
| T7 | Pasar lista en local y ver la notificación en la campana del alumno y en la del tutor; reguardar sin cambios no genera una segunda. |

Además, en cada tarea: entrada en `docs/ux-reorganizacion-log.md`, commit único con prefijo de tarea, y **ningún push ni merge a `main`** sin instrucción explícita de León en esa sesión.

---

## 5. Fuera de alcance (anotado, no se hace aquí)

- Expediente del alumno para el instructor — descartado por decisión de León (decisión 1).
- Resumen de asistencia por alumno en un rango y vista de reporte para el instructor — se eligió solo la cuadrícula; quedan disponibles si luego hacen falta.
- Push al alumno/tutor para estas notificaciones.
- M-12 y M-13 de `docs/revision-dashboards.md` (re-notificación y criterio de pertenencia en `confirm-all`): adyacentes a T7, pero son su propia tarea.
- `ensureClassAbsences()` (`lib/dashboard/attendance-absences.ts`) está escrito y probado pero **no lo llama nadie** en producción. T6 resuelve la visibilidad del problema sin depender de él; decidir aparte si se conecta o se elimina.
