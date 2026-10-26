# LOG DE REORGANIZACIÓN UX/UI — DojoApp

> Registro de resultados de las tareas definidas en `docs/ux-reorganizacion.md`.
> **La guía manda.** Este documento solo guarda evidencia: línea base, cierres, desviaciones y decisiones.
> Una entrada por tarea, en orden cronológico. No se reescribe el pasado: si algo cambia, se añade una nota.

---

## Cómo se registra una tarea

Cada cierre usa este formato (plantilla de la sección 10.2 de la guía):

```
### UX-XXXX · Título
- Fecha / commit:
- Archivos creados/modificados:
- Decisiones tomadas y por qué:
- Pruebas añadidas:
- Resultado: lint / typecheck / test / integration / e2e
- Desviaciones respecto a la guía:
- Pendientes o dudas:
- Revisión humana: (solo tareas marcadas)
```

---

## Seguimiento

| Tarea | Fecha | Commit | Estado | Revisión humana |
|---|---|---|---|---|
| UX-00 · Línea base | 2026-10-26 | `fd0187a` | ✅ Hecha | — |
| UX-01 · Constantes de nav y copy | 2026-10-26 | `ux(01): constantes de navegación, estados de reposición y copy` | ✅ Hecha | — |
| UX-A1 · Unificar glosario | 2026-10-26 | `ux(A1): glosario de reposición en textos visibles y guía` | ✅ Hecha | — |
| UX-A7a · Eventos de producto | 2026-10-26 | — | ⏳ Aplazada (decisión) | — |
| UX-A2 · Eliminar la confirmación nativa | 2026-10-26 | `ux(A2): ConfirmModal accesible en las 14 confirmaciones` | ✅ Hecha | — |
| UX-A3 · EmptyState y aplicación | 2026-10-26 | `ux(A3): EmptyState único en 17 estados vacíos` | ✅ Hecha | — |

**Nota de orden (UX-A7a).** Se pospone la instrumentación para no crear todavía la tabla `ProductEvent`. Decisión tomada con León: A7a se retoma **antes de UX-A5b** (el cambio de Inicio), que es donde de verdad hace falta el antes/después. Mientras tanto se avanzó con A2, A3 y A4, que son solo frontend. Ver la entrada de A7a al final del documento cuando se cierre.

---

## Línea base (UX-00)

**Objetivo:** confirmar que el repo está sano antes de cambiar nada. No se arregla nada aquí.

| Dato | Valor |
|---|---|
| Fecha | 2026-10-26 19:12 (America/Santo_Domingo) |
| Rama de trabajo | `ux/reorganizacion` (creada desde `newui`) |
| Commit base | `3c9152d` — `docs(ux): guardar guía de reorganización UX/UI v2` |
| Node / pnpm | v25.0.0 / 10.0.0 |
| Docker | 29.9.1 (levantado para integración) |

**Tamaño del repo (archivos versionados):**

| Ámbito | Archivos |
|---|---|
| `app/**` | 140 |
| `components/**/*.tsx` | 178 |
| `lib/**/*.ts` | 78 |
| `tests/**` | 118 |

**Resultado de la sección 4:**

| Comando | Resultado | Detalle |
|---|---|---|
| `pnpm lint` | ✅ | 0 errores, **34 warnings preexistentes** (`<img>`, `no-restricted-syntax` de fechas, variables sin usar). No se tocan. |
| `pnpm typecheck` | ✅ | Sin salida. |
| `pnpm test` | ✅ | 53 archivos / **243 tests** / 43,17 s. |
| `pnpm test:integration` | ✅ | 43 archivos / **412 tests** / 274,18 s (Postgres vía testcontainers). |
| `pnpm test:e2e` | ⏳ Pendiente | Playwright levanta `pnpm dev` contra la BD real y tarda varios minutos; no se ejecuta en la línea base. Se correrá en la primera tarea que lo exija (UX-B1). |

**Fallos preexistentes:** ninguno funcional. Solo los 34 warnings de lint, que quedan registrados para no confundirlos con deuda introducida por la reorganización.

---

## Observaciones de la línea base

Comprobaciones hechas al leer el código (no se modifica nada):

1. **Rutas canónicas y alias `/dashboard/*`.** Las páginas viven en `app/(dashboard)/estudiante/**`, así que su URL canónica es `/estudiante`, `/estudiante/perfil`, `/estudiante/progreso`, `/estudiante/horario` y `/estudiante/asistencia`. `next.config.ts` tiene un `rewrite` de `/dashboard/:path*` → `/:path*`, por lo que la forma `/dashboard/...` (la que enlaza hoy `RoleNavigation.tsx`) también funciona. El mapa de UX-B1 usa las canónicas: es correcto. Se decide en B1 si el alias se conserva junto a las redirecciones permanentes.
2. **La nav del alumno tiene hoy 6 ítems** (Resumen, Mi perfil, Mi progreso, Horario, Asistencia, Seguridad), no 5. El paso a 5 destinos con renombrado es UX-B1, no UX-01.
3. **No existe todavía la sección "Entrenar"** (`app/(dashboard)/estudiante/` solo tiene `asistencia`, `horario`, `perfil`, `progreso`). Por eso UX-01 define los nombres y descripciones de los 5 destinos **sin `href`**: las rutas se crean en UX-B1.
4. **`window.confirm`: 14 usos**, coincide con lo que estima la guía para UX-A2.
5. No existían `lib/ui/`, `components/common/` ni este documento; el log nace en UX-00.

---

## UX-01 · Constantes de navegación y copy

- **Fecha:** 2026-10-26
- **Commit:** `ux(01): constantes de navegación, estados de reposición y copy`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `lib/ui/nav-labels.ts` |
| Nuevo | `lib/ui/recovery-status.ts` |
| Nuevo | `lib/ui/copy.ts` |
| Nuevo | `tests/unit/ui-labels.test.ts` |
| Modificado | `components/dashboard/shell/RoleNavigation.tsx` |
| Modificado | `components/dashboard/shared/ConfirmModal.tsx` |

**Decisiones tomadas y por qué:**

1. **Dos capas en `nav-labels.ts`.** `STUDENT_DESTINATIONS` y `ADMIN_SECTIONS` describen los destinos objetivo (Inicio · Entrenar · Clases · Progreso · Perfil y Hoy · Alumnos · Operación · Configuración · Comunicación + Finanzas reservada) **sin `href`**, porque `/estudiante/entrenar/*` todavía no existe. `NAV_LABELS` centraliza las etiquetas que la app usa hoy. Así se fija el vocabulario sin programar contra rutas inventadas (guía, sección 0.3).
2. **`RoleNavigation` pasa a consumir `NAV_LABELS`.** La guía pedía crear los módulos; se cableó este componente en el mismo commit para no dejar constantes sin uso (sección 3.3). Las etiquetas son idénticas a las anteriores: **cero cambio visual y cero cambio de rutas**.
3. **`ConfirmModal` toma "Cancelar" de `COPY.actions.cancel`.** Único consumidor real de `copy.ts` hoy; es el mismo texto de antes.
4. **`recovery-status.ts` es una capa de presentación.** No duplica `OnlineRecoveryStatus` (`SCHEDULED | COMPLETED | CANCELLED | NO_SHOW`): ese sigue siendo el estado de la BD. La derivación estado-BD → estado visible se define en UX-A6, no aquí.
5. **Nombres objetivo sin aplicar.** Renombrar "Resumen → Inicio" y pasar a 5 ítems exige mover rutas y dejar redirecciones permanentes: es UX-B1, con revisión humana. No se adelanta aquí.

**Pruebas añadidas (8, prefijo `UX-01 ·`):**

- Los 5 destinos del alumno, en orden, con sus etiquetas exactas.
- Las 5 secciones de admin visibles y `Finanzas` marcada como reservada.
- `getRoleNavigation` devuelve las etiquetas de `NAV_LABELS` (alumno y admin).
- Las 7 etiquetas de reposición coinciden con la sección 5 de la guía.
- `isRecoveryUiStatus` acepta solo los estados declarados.
- Guardarraíl de glosario: ningún texto contiene "recuperaci/recuperar" ni está vacío.
- Todo estado vacío de `COPY.empty` trae una acción.

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 34 warnings preexistentes (sin cambios) |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 54 archivos / **251 tests** (antes 53 / 243) / 8,51 s |
| `pnpm test:integration` | No aplica: no se tocaron API ni BD |
| `pnpm test:e2e` | No aplica: sin cambio de rutas ni de flujo |

**Desviaciones respecto a la guía:** ninguna de alcance. Se adelantó el cableado de dos componentes existentes con textos idénticos para evitar código muerto.

**Pendientes o dudas:**

- `STUDENT_DESTINATIONS` lo consumirán UX-B1 (navegación) y el Anexo A.6 (prueba de nombres); `ADMIN_SECTIONS`, UX-B5.
- `COPY.confirm` y `COPY.empty` se consumen en UX-A2 (`ConfirmModal`) y UX-A3 (`EmptyState`).
- La guía no fija nombres para la navegación del instructor (modo tatami, UX-B4); se mantienen los actuales en `NAV_LABELS`.

**Revisión humana:** no aplica (UX-01 no está en la lista de la sección 0.7).

---

## UX-A1 · Unificar glosario

- **Fecha:** 2026-10-26
- **Commit:** `ux(A1): glosario de reposición en textos visibles y guía`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Modificado | `components/dashboard/student/StudentAbsenceReport.tsx` |
| Modificado | `docs/guia-padres-y-alumnos.md` |
| Modificado | `docs/ux-reorganizacion-log.md` |

**Cambios de texto:**

1. `StudentAbsenceReport`: "Aprobada — pendiente de reponer (asiste a otra clase para **recuperarla**)" → "Aprobada — pendiente de reponer (**repónela en otra clase**)".
2. Guía, sección "Tus entrenamientos": "Si faltaste con justificación, ves las **recuperaciones** que tienes pendientes" → "Si faltaste, puedes **reportar la inasistencia** y ver si está pendiente, justificada o **por reponer**".
3. Guía, sección "Para papá y mamá": "si le faltan **recuperaciones**" → "si le faltan **reposiciones**".
4. Guía: nueva sección "🔄 Reposición de clases que faltaste" (2 faltas incluidas por mes, presencial u online de 35 min, estados reales, costo, cierre de cuatrimestre y avisos).

**Decisiones tomadas y por qué:**

1. **Solo textos visibles.** No se tocó el esquema Prisma ni identificadores (`recoveredById`, `recoveredAt`, `recovered`): el glosario aplica a la interfaz, no al modelo de datos.
2. **"Recuperación de contraseña/cuenta" se deja como está.** Es otro concepto (acceso a la cuenta) y cambiarlo confundiría. Quedan 6 archivos de auth y un comentario técnico (`purge-enrollments`) que el grep reporta y que se excluyen a propósito.
3. **La guía no documenta "En revisión" ni "Programada", ni el botón "Solicitar reposición".** Ese flujo es UX-A6 y todavía no existe: documentarlo incumpliría el principio 5 ("nada que prometa lo que el sistema no cumple"). Esta es una desviación consciente del texto literal de la guía y se completa en A6.
4. **Estados documentados = estados implementados hoy**, verificados en `StudentAbsenceReport`: Pendiente de revisión, Aprobada, Rechazada, Repuesta (con fecha) y "fuera de plazo".
5. **Datos verificados contra el dominio, no inventados:** `FREE_ABSENCES_PER_MONTH = 2` (`lib/dashboard/absence-policy.ts`), `ONLINE_RECOVERY_MINUTES = 35` (`lib/dashboard/online-recovery.ts`) y notificaciones `ONLINE_RECOVERY_*` (`lib/notifications/types.ts`).

**Pruebas:** no se añadieron tests nuevos porque ningún test afirmaba estos textos (verificado con `grep`). No se creó un guardarraíl de texto fuente porque exigiría una lista de excepciones frágil para auth; la comprobación se hace con el `grep` de la tarea.

**Resultado:**

| Comando | Resultado |
|---|---|
| `grep -rni "recuper" app components` (excluyendo auth y prototipos) | ✅ 0 coincidencias |
| `pnpm lint` | ✅ 0 errores, 34 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 54 archivos / 251 tests |
| `pnpm test:integration` | No aplica: sin cambios en API ni BD |
| `pnpm test:e2e` | No aplica: solo texto |

**Desviaciones respecto a la guía:** la sección nueva de la guía de padres omite los estados de solicitud (`En revisión`, `Programada`) hasta que exista UX-A6.

**Pendientes o dudas:** en UX-A6 hay que ampliar la sección "Reposición de clases que faltaste" con el botón *Solicitar reposición* y los estados de solicitud.

**Revisión humana:** no aplica.

---

## UX-A2 · Eliminar la confirmación nativa

- **Fecha:** 2026-10-26
- **Commit:** `ux(A2): ConfirmModal accesible en las 14 confirmaciones`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `components/dashboard/shared/useConfirm.tsx` |
| Nuevo | `tests/component/confirm-modal.test.tsx` |
| Modificado | `components/dashboard/shared/ConfirmModal.tsx` |
| Modificados | 12 componentes con confirmaciones (admin, instructor, alumno y notificaciones) |

**Las 14 confirmaciones sustituidas:**

| Archivo | Acción |
|---|---|
| `AdminBlogPosts` | Eliminar artículo |
| `AdminCurriculumCatalog` | Eliminar grado · Aplicar currículo oficial |
| `AdminEnrollments` | Eliminar inscripción (con aspirantes) |
| `AdminPlans` | Eliminar plan |
| `AdminReviews` | Eliminar reseña |
| `AdminSchedules` | Eliminar horario |
| `AdminTechniqueManager` | Eliminar técnica |
| `NotificationsCenter` | Limpiar notificaciones |
| `NotificationBell` | Limpiar notificaciones |
| `OnlineRecoveryPanel` | Cancelar clase online · Marcar "no asistió" |
| `StudentAbsenceReport` | Retirar reporte de inasistencia |
| `StudentDocuments` | Eliminar documento |

**Decisiones tomadas y por qué:**

1. **Hook `useConfirm()` en vez de repetir estado en 12 componentes.** Devuelve `{ confirm, dialog }` con una promesa `Promise<boolean>`. Cada sitio pasa de `if (!window.confirm(texto)) return` a `if (!(await confirm({ title, message, confirmLabel, isDestructive }))) return`. Un solo diálogo para todo el proyecto (principio 7).
2. **Se adelantó la accesibilidad de `ConfirmModal` a A2.** La guía la ubicaba en UX-B0, pero A2 exige foco atrapado, `Esc` y retorno de foco como criterio de aceptación. Hacerlo en B0 habría dejado A2 incompleta. Resultado: B0 no debe reimplementar `ConfirmModal`, solo verificarlo.
3. **Foco inicial en "Cancelar".** La acción destructiva nunca queda preseleccionada; `Esc` cancela; al cerrar el foco vuelve al disparador.
4. **Textos honestos y específicos.** Cada diálogo dice qué se borra y qué consecuencia tiene. En `AdminSchedules` se avisa de que el horario con alumnos se desactiva en lugar de borrarse (comportamiento real del endpoint). En `OnlineRecoveryPanel` se avisa de que la falta sigue pendiente.
5. **Densidad de diff.** A2 tocó 14 sitios: ~395 líneas entre código, hook y tests, dentro del margen de la tarea. No se dividió porque el patrón es idéntico y partirlo dejaría la app con dos formas de confirmar.

**Pruebas añadidas (5, prefijo `UX-A2 ·`):**

- Abre con el foco en "Cancelar" y el diálogo tiene nombre accesible.
- `Shift+Tab` desde "Cancelar" va al último botón y `Tab` vuelve al primero (foco atrapado).
- `Esc` cancela, cierra y **devuelve el foco al botón que abrió**.
- Confirmar resuelve `true` y cierra.
- Clic fuera del diálogo resuelve `false`.

**Resultado:**

| Comando | Resultado |
|---|---|
| `grep -rn "window.confirm" app components` | ✅ 0 resultados |
| `pnpm lint` | ✅ 0 errores, 34 warnings preexistentes (sin nuevos) |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 55 archivos / **256 tests** (antes 54 / 251) / 7,80 s |
| `pnpm test:integration` | No aplica: sin cambios en API ni BD |
| `pnpm test:e2e` | No aplica: sin cambios de rutas |

**Desviaciones respecto a la guía:**

- A7a se pospuso (ver nota de orden). No cambia el alcance de A2.
- La accesibilidad de `ConfirmModal`, prevista para B0, se resolvió aquí.

**Pendientes o dudas:**

- Quedan `window.alert` en varios componentes (fuera del alcance de A2: la guía solo pide confirmaciones). Se revisarán cuando se implemente el `Toast` de UX-B0.
- B0 debe reutilizar este `ConfirmModal` y limitarse a verificar foco/teclado.

**Revisión humana:** no aplica (A2 no está en la lista de la sección 0.7).

---

## UX-A3 · Componente `EmptyState` y aplicación

- **Fecha:** 2026-10-26
- **Commit:** `ux(A3): EmptyState único en 17 estados vacíos`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `components/common/EmptyState.tsx` |
| Nuevo | `tests/component/empty-state.test.tsx` |
| Modificados | 13 componentes del dashboard |
| Modificados | 3 tests existentes (cambio de copy) |

**Estados vacíos unificados (17 en 13 componentes):**

| Pantalla | Archivo | Acción del estado vacío |
|---|---|---|
| Horario: sin clases | `StudentSchedule` | — (la asigna administración) |
| Horario: día sin clases | `StudentSchedule` | Ver toda la semana |
| Historial de asistencias | `StudentAttendanceHistory` | Ver mi horario |
| Asistencias (resumen) | `StudentAttendanceRecords` | Ver mi horario |
| Técnicas en enfoque | `FocusTechniquesList` | — (muestra el enlace del encabezado) |
| Syllabus filtrado | `StudentSyllabus` | Limpiar filtros |
| Registro de práctica filtrado | `StudentPracticeLog` | Limpiar filtros |
| Clases del instructor | `InstructorClasses` | — |
| Justificaciones pendientes | `InstructorJustificationBoard` | — |
| Alumnos del instructor | `InstructorStudents` | — |
| Búsqueda de alumnos | `InstructorStudents` | Limpiar búsqueda |
| Inscripciones pendientes | `AdminEnrollments` | Ver alumnos |
| Reseñas | `AdminReviews` | Ver todas (si hay filtro) |
| Alumnos por alcance | `AdminStudents` | Crear alumno |
| Filtros de alumnos | `AdminStudents` | Limpiar filtros |
| Faltas por agendar | `OnlineRecoveryPanel` | Limpiar búsqueda (si hay búsqueda) |
| Reposiciones online | `OnlineRecoveryPanel` | Ver todas (si hay filtro) |

**Decisiones tomadas y por qué:**

1. **`components/common/EmptyState.tsx`**, la ruta que nombra la guía (A3 y B0). Es un primitivo sin estado ni `'use client'`, así que sirve en componentes de servidor y de cliente.
2. **Dos variantes:** `panel` (bloque con borde discontinuo, para páginas) e `inline` (sin borde, para dentro de tarjetas que ya lo tienen). Evita cajas dentro de cajas.
3. **`action` admite enlace o botón**, con altura mínima de 44 px. 12 de los 17 estados tienen acción real; los 5 restantes no tienen una acción disponible en la app y lo explican en el texto en vez de inventar un botón roto.
4. **Los filtros sin resultados tienen acción "Limpiar filtros"**, que restablece el estado real del componente. No se inventó ningún endpoint.
5. **`FocusTechniquesList`:** se eliminó el pie "Todas tus técnicas asignadas están revisadas" porque ahora el mismo mensaje es la descripción del estado vacío; mantener ambos duplicaba el texto y rompía el test.
6. **Logros:** no existen todavía (Fase C, UX-C2). No se inventó la pantalla; se aplicará cuando se cree.
7. **Reposiciones del alumno:** `StudentOnlineRecoveries` se oculta por diseño cuando no hay reposiciones y hay un test que lo exige (`to​BeEmptyDOMElement`). Se respeta; el hub propio del alumno llega en UX-B3.
8. **Alcance:** se cubrieron las superficies que nombra la tarea (horario, asistencia, reposiciones, katas, bandejas de instructor y admin). Quedan listas fuera de ese alcance (calendario, blog, mensajes, catálogo de técnicas) que se unificarán en B0/B5 cuando se reorganicen esas pantallas.

**Pruebas añadidas (4, prefijo `UX-A3 ·`):**

- Título y descripción visibles, sin acción si no se pasa.
- Acción de enlace con `href` correcto y nombre accesible.
- Acción de botón que ejecuta la llamada.
- Icono marcado como decorativo (`aria-hidden`).

**Tests existentes actualizados (cambio legítimo de copy):**

| Test | Antes | Ahora |
|---|---|---|
| `student-schedule.test.tsx` | /No tienes clases activas asignadas/ | /Aún no tienes clases asignadas/ |
| `admin-students.test.tsx` | /No se encontraron alumnos/ | /No encontramos alumnos con esos filtros/ |
| `student-dashboard-overview.test.tsx` | — | Sin cambios: sigue pasando tras quitar el pie duplicado |

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 34 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 56 archivos / **260 tests** (antes 55 / 256) / 8,49 s |
| `pnpm test:integration` | No aplica: sin cambios en API ni BD |
| `pnpm test:e2e` | No aplica: sin cambios de rutas |

**Desviaciones respecto a la guía:** "logros" no se pudo aplicar porque la funcionalidad no existe; se hará en UX-C2.

**Pendientes o dudas:** las listas vacías de calendario, blog, mensajes y catálogo de técnicas siguen con su texto propio. Se unifican al reorganizar esas pantallas (B0/B5).

**Revisión humana:** no aplica.
