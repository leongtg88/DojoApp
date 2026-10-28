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
| UX-A4 · Selector familiar único | 2026-10-26 | `ux(A4): un solo selector familiar en el encabezado` | ✅ Hecha | — |
| UX-A8 · Embudo público con un CTA | 2026-10-26 | `ux(A8): un CTA principal en las páginas públicas` | ↩️ Revertida (2026-10-27) | — |
| 🚦 GATE 1 · Prueba base | — | — | ⏳ Pendiente (León) | — |
| UX-A5a · `getPrimaryAction` | 2026-10-26 | `ux(A5a): función getPrimaryAction` | ✅ Hecha | — |
| UX-A5b · Nuevo Inicio del alumno | 2026-10-26 | `ux(A5b): nuevo Inicio del alumno` | ✅ Hecha (sin eventos) | — |
| UX-B1 · Navegación de 5 destinos | 2026-10-26 | `ux(B1): navegación de 5 destinos y rutas Clases/Entrenar` | ✅ Hecha | ⏳ Pendiente (León) |
| UX-B4 · Instructor: modo tatami | 2026-10-27 | `ux(B4): modo tatami del instructor` | ✅ Hecha | — |
| UX-B5 · Admin en 5 secciones y bandeja Hoy | 2026-10-27 | `ux(B5): admin en 5 secciones y bandeja Hoy` | ✅ Hecha | ⏳ Pendiente (León) |
| UX-B5.1 · Correcciones post-auditoría | 2026-10-27 | `ux(B5.1): corregir pendientes, justificaciones y etiquetas móviles` | ✅ Hecha | ⏳ Pendiente (León) |
| UX-B6 · Asistencia del admin en pestañas | 2026-10-27 | `ux(B6): asistencia del admin en pestañas` | ✅ Hecha | — |
| UX-B8 · Alumnos: una ruta, dos modos | 2026-10-27 | `8893b6c` | ↩️ Revertida (2026-10-27) | — |

**Nota de orden (UX-A7a).** Se pospone la instrumentación para no crear todavía la tabla `ProductEvent`. Decisión tomada con León: A7a se retoma **antes de UX-A5b** (el cambio de Inicio), que es donde de verdad hace falta el antes/después. Mientras tanto se avanzó con A2, A3 y A4, que son solo frontend. Ver la entrada de A7a al final del documento cuando se cierre.

**Nota de alcance (UX-A8).** El 2026-10-27 León decidió que ningún cambio de la reorganización toque la página web pública: todo el trabajo va a los dashboards. Se restauraron a producción `Hero5`, `HomeView`, `Navbar`, `AboutView`, `AssistantChat`, `AuthSidePanel` y `app/globals.css`, y se eliminó `tests/component/public-cta.test.tsx`. Detalle en la entrada "Reversión de la web pública" al final del documento.

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

---

## UX-A4 · Selector familiar único

- **Fecha:** 2026-10-26
- **Commit:** `ux(A4): un solo selector familiar en el encabezado`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Modificado | `components/dashboard/shell/FamilyMemberSwitcher.tsx` |
| Modificado | `components/dashboard/shell/DashboardShell.tsx` |
| Modificado | `components/dashboard/shell/DashboardSidebar.tsx` |
| Modificado | `components/dashboard/shell/MobileDashboardSidebar.tsx` |
| Modificado | `app/(dashboard)/estudiante/page.tsx` |
| Modificado | `app/(dashboard)/estudiante/asistencia/page.tsx` |
| Modificado | `tests/component/family-members.test.tsx` |
| **Eliminado** | `components/dashboard/student/FamilyQuickSwitcher.tsx` |

**Decisiones tomadas y por qué:**

1. **Un solo selector, en el encabezado del shell.** Se quitó de `DashboardSidebar`, de `MobileDashboardSidebar` y de las páginas de Inicio y Asistencia. El del encabezado ya funcionaba en móvil (icono) y escritorio (etiqueta), así que no hacía falta crear otro.
2. **Se eliminó `FamilyQuickSwitcher`**, no solo su uso: dejarlo sería código muerto (regla 3.3) y duplicaba el patrón que la guía prohíbe (principio 7).
3. **Copy nuevo:** el botón muestra "Viendo el expediente de" sobre el nombre del miembro activo, y lleva `aria-label="Viendo el expediente de: {nombre}"`. Se fue el "¿Quién marca su asistencia?".
4. **Sigue oculto sin hijos:** la regla no cambió (`totalMembers <= 1` → no se renderiza). Un alumno sin hijos no ve el selector; un tutor con hijos sí.
5. **Seguridad intacta.** No se tocó `resolveStudentView` ni la validación de `?estudiante=` contra los hijos del tutor, ni la cabecera `X-Student-Id`, ni `isChildView`. El selector solo cambia la URL y el servidor valida.
6. **Limpieza de props:** al quitar el selector de los sidebars, la prop `familyMembers` ya no se usaba ahí y se eliminó; `DashboardShell` sigue pasándola solo al encabezado.

**Pruebas:**

| Test | Cambio |
|---|---|
| `family-members.test.tsx` | Se quitó el test del selector rápido (componente eliminado). Se añadieron 2: el botón dice "Viendo el expediente de: Ana Uno" y no se muestra con `children: []`. |
| `edit-profile-modal.test.tsx` | Sin cambios, ✅ en verde (criterio de aceptación). |

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 34 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 56 archivos / **261 tests** / 7,86 s |
| `pnpm test:integration` | No aplica: no se tocaron API ni BD |
| `pnpm test:e2e` | Pendiente: el cambio es de navegación entre expedientes y conviene un pase visual |

**Desviaciones respecto a la guía:** ninguna.

**Pendientes o dudas:**

- Verificación responsive a 375/768/1440 px del encabezado con el selector (jsdom no calcula layout). Se hará en el pase de Playwright o a mano antes del Gate 1.
- El enlace de navegación entre expedientes sigue conservando el `?estudiante=` al cambiar de sección, como antes.

**Revisión humana:** no aplica.

---

## UX-A8 · Embudo público con un CTA principal

- **Fecha:** 2026-10-26
- **Commit:** `ux(A8): un CTA principal en las páginas públicas`
- **Alcance:** solo frontend. No se tocó la lógica de inscripción, el rate-limit ni el honeypot.

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `tests/component/public-cta.test.tsx` |
| Modificado | `app/globals.css` (clase `.cta-secondary`) |
| Modificado | `components/Hero5.tsx` |
| Modificado | `components/HomeView.tsx` |
| Modificado | `components/Navbar.tsx` |
| Modificado | `components/AboutView.tsx` |
| Modificado | `components/assistant/AssistantChat.tsx` (copy) |

**Jerarquía de acciones en `/`:**

| Acción | Antes | Ahora |
|---|---|---|
| CTA del hero | "Empieza Hoy" → asistente | **"Reservar clase de prueba" → modal de clase de cortesía** |
| Asistente | CTA principal del hero | Enlace secundario "¿Tienes dudas? Habla con el asistente" |
| Tarjetas de clase (2) | `hero-button` dominante | `.cta-secondary` (misma acción, programa preseleccionado) |
| Promociones familiares | `hero-button` → asistente | `.cta-secondary` → asistente (sigue siendo una duda, no una entrada) |
| "Cómo llegar" (2 variantes responsive) | `hero-button` | Enlace de texto subrayado |
| Biografías de maestros | `hero-button` | `.cta-secondary` (navegación, no conversión) |
| CTA final | `hero-button` | Se mantiene: es la **misma** acción principal, repetida al cierre |
| Navbar "CLASE DEMO GRATIS" | Botón relleno | Botón de contorno compacto "Clase de prueba" |
| Drawer móvil | "RESERVAR CLASE DEMO" | "RESERVAR CLASE DE PRUEBA" |

**Jerarquía en `/nosotros`:** un único CTA dominante ("Reservar clase de prueba"). No había más entradas que compitieran.

**Decisiones tomadas y por qué:**

1. **La acción primaria es reservar la clase de cortesía**, no abrir el asistente. El asistente resuelve dudas, no convierte; ahora es una salida secundaria explícita.
2. **Los CTA de las tarjetas de clase se conservan** porque aportan el programa (`kid`/`adult`) al modal, pero bajan a secundarios: el mismo destino, distinto peso visual.
3. **La clase `.cta-secondary` vive en `app/globals.css` dentro de `@layer utilities`** (INV-05), junto a `.hero-button`. Es un solo patrón para todos los CTA secundarios públicos.
4. **El CTA final se mantiene dominante** porque repite la misma acción. La regla de la guía busca evitar entradas *competidoras*, no prohibir repetir la acción principal al cierre de la página.
5. **No se tocó el formulario de inscripción** (`/inscripcion`, `ToseiGosuForm`, `public-enrollments`): sigue siendo el paso posterior, fuera del embudo de la clase muestra.
6. **Corrección de copy en el asistente:** "Consulta información, sino habla con Sensei" → "Consulta información o habla con el Sensei" (error visible en una página pública).
7. **Instrumentación pendiente:** `inscripcion_paso_1…4` e `inscripcion_abandono` dependen de UX-A7a, que sigue aplazada. Se instrumentarán cuando se resuelva la medición.

**Pruebas añadidas (2, prefijo `UX-A8 ·`):**

- La acción dominante del hero invoca `onOpenEnrollment` y no el asistente.
- La acción secundaria invoca `onOpenAssistant`.

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 34 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 57 archivos / **263 tests** / 8,41 s |
| `pnpm test:integration` | No aplica: sin cambios de API (`public-enrollments` intacto) |
| `pnpm test:e2e` | Pendiente: requiere servidor y BD; se hará en el pase visual |

**Desviaciones respecto a la guía:** los eventos del embudo quedan para A7a. El resto del alcance de A8 está completo.

**Pendientes o dudas:**

- Verificación visual responsive (375/768/1440) de `/` y `/nosotros` con los nuevos pesos de botones.
- Confirmar con León que "Clase de prueba" es el nombre que quiere en la navbar (antes "Clase demo gratis").

**Revisión humana:** no aplica.

---

## Revisión de front antes del despliegue (2026-10-26)

**Entorno aislado, sin tocar producción:** Postgres 16 efímero en Docker (puerto 55433) con `prisma migrate deploy` + `prisma/seed.ts`; app en `localhost:3100` con `DATABASE_URL`/`DIRECT_URL` sobrescritas solo para ese proceso; Playwright headless. **42 páginas** auditadas en 375/768/1440 px (público) y 375/1440 (alumno, instructor, admin).

### Hallazgos corregidos

| # | Hallazgo | Corrección |
|---|---|---|
| 1 | **Hidratación rota** en el Inicio del alumno y del instructor: `new Date()` dentro del render de `NextClassCard` / `InstructorDashboardOverview` producía "Hoy/Mañana" distinto en servidor y cliente | Nuevo `lib/ui/use-now.ts` con `useSyncExternalStore` (servidor → `null`, cliente tras hidratar). Esqueleto estable mientras tanto |
| 2 | **Imagen bloqueada por CSP** en `/login`: `picsum.photos` no está en `img-src` | Fondo local `/assets/20250830_110023.jpg`; cero errores de consola |
| 3 | **CTA del hero con área táctil de 170×20 px** (A8) | `min-h-11` en el botón → **177×44 px**; el enlace del asistente también llega a 44 px |
| 4 | Selector de tipo de documento y campo de archivo **sin nombre accesible** en el perfil | `aria-label` en ambos; el auditor deja de marcarlos |
| 5 | Botones editar/eliminar grado de **20×20 px** en móvil | `size-11` (44×44); objetivos pequeños en esa pantalla: 107 → **33** |
| 6 | Controles del encabezado de **36 px** (menú, campana, tema, cerrar sesión) y login público de 32 px | `size-11` (44×44) en los cinco |
| 7 | Log con nombre del aspirante al convertir inscripción | Eliminado (commit `14798fc`) |
| 8 | Aviso de Next por `scroll-behavior: smooth` | `data-scroll-behavior="smooth"` en `<html>` |

### Hallazgos abiertos (no corregidos en esta pasada)

| Hallazgo | Decisión |
|---|---|
| 4 `window.alert` en admin (`AdminPlans`, `AdminReviews` ×2, `AdminSchedules`) | Se sustituyen por el `Toast` de UX-B0 |
| Enlaces sociales y de texto de 16–24 px de alto en el sitio público | Son terciarios; el requisito de 44 px aplica a acciones principales. Revisar en el pase de diseño final |
| Botones de 30–42 px en admin (filtros, "Nuevo grado", exportar) | Revisar en UX-B5 al reorganizar el admin |
| Mapa de Google: el `<iframe>` existe, mide 637×414 y CSP lo permite (`frame-src`), pero no cargó en headless | Verificar en navegador real antes de desplegar |
| `WHATSAPP_DEBUG=1` registra teléfono y mensaje entrante | **No activar en producción** |
| La página pública supera las 20 pantallas de scroll en móvil | Fuera del alcance; anotado para la revisión de contenido |

### Reproducir la revisión

```bash
docker run --rm -d --name dojo-ux-review-db -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=dojo_test -p 55433:5432 postgres:16-alpine
# DATABASE_URL/DIRECT_URL -> postgresql://test:test@localhost:55433/dojo_test
pnpm exec prisma migrate deploy && pnpm exec tsx prisma/seed.ts
pnpm dev --port 3100   # con las variables sobrescritas solo en ese proceso
```

Capturas y resultados: `C:\Users\ASUS\AppData\Local\Temp\opencode\dojo-review-shots`.

**Resultado:** lint ✅ (0 errores), typecheck ✅, **263 tests** ✅. Sin cambios de esquema, sin migraciones y sin tocar la base real.

---

## 🚦 Gate 1 — Prueba base (pendiente)

> Guion completo y reglas del moderador: `docs/gate-1-guion.md`.
> **UX-A5a y UX-A5b no empiezan hasta que esta sección tenga resultados.**

**Estado:** ⏳ Pendiente de ejecutar por León (5 sesiones: 3 alumnos, 1 tutor, 1 instructor).
**Se ejecuta sobre:** la app actual (esta rama), antes de tocar el Inicio.

### Resultados por participante

| Participante | Tarea | Éxito (sí / ayuda / no) | Tiempo (s) | Errores / dónde buscó | Frase textual |
|---|---|---|---|---|---|
| Alumno 1 | 1 · Próxima clase | | | | |
| Alumno 1 | 2 · Reportar inasistencia | | | | |
| Alumno 1 | 3 · Faltas por reponer | | | | |
| Alumno 1 | 4 · Registrar práctica | | | | |
| Alumno 1 | 5 · Próximo cinturón | | | | |
| Alumno 2 | 1–5 | | | | |
| Alumno 3 | 1–5 | | | | |
| Tutor 1 | Cambiar de vista | | | | |
| Tutor 1 | Reportar falta del hijo | | | | |
| Instructor 1 | Pasar lista | | | | |
| Instructor 1 | Evaluar técnica | | | | |

### Los 3 problemas más graves

| # | Problema | Decisión (A5b / B1 / aceptar) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

### Comparación

- Tareas completadas **sin ayuda / con ayuda / no** por tarea.
- Tiempo mediano por tarea.
- Citas textuales más útiles (máximo 5).

**Nota:** este mismo guion se repite en el Gate 2 para comparar. No se modifica entre ambos.

---

## UX-A5a · Función `getPrimaryAction`

- **Fecha:** 2026-10-26
- **Commit:** `ux(A5a): función getPrimaryAction`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `lib/dashboard/primary-action.ts` |
| Nuevo | `tests/unit/primary-action.test.ts` |
| Modificado | `lib/dashboard/schedule-utils.ts` (exporta `santoDomingoWeekdayAndMinutes` y `timeToMinutes`) |

**Decisión:**

Función pura, sin React ni Prisma. Recibe `now`, `classes`, `pendingRecoveries` y `focusTechniqueName`, y devuelve una unión discriminada: `class_today` → `recovery` → `practice` → `welcome`.

- **Zona horaria:** "hoy" se resuelve con `santoDomingoWeekdayAndMinutes` (América/Santo_Domingo), no con la hora local del servidor. INV-01.
- Una clase **en curso** sigue contando; una **terminada** no.
- Si hay clase hoy y faltas pendientes, gana la clase (prioridad de la guía).
- Los hrefs no viven aquí: los decide el componente, para mantener la función pura.

**Pruebas (10):** los 4 casos, empate clase + reposición, clase en curso, clase terminada, varias clases hoy, clase de otro día, cambio de día a las 21:00 RD (01:00 UTC) y entradas inválidas.

**Resultado:** lint ✅, typecheck ✅, tests ✅.

---

## UX-A5b · Nuevo Inicio del alumno

- **Fecha:** 2026-10-26
- **Commit:** `ux(A5b): nuevo Inicio del alumno`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `components/dashboard/student/PrimaryActionCard.tsx` |
| Nuevo | `tests/component/primary-action-card.test.tsx` |
| Modificado | `components/dashboard/student/StudentDashboardOverview.tsx` |
| Modificado | `components/dashboard/student/StudentGreeting.tsx` (badge de cinturón) |
| Modificado | `components/dashboard/student/FocusTechniquesList.tsx` (`limit`) |
| Modificado | `tests/component/student-dashboard-overview.test.tsx` |
| **Eliminado** | `components/dashboard/student/NextClassCard.tsx` |

**Orden nuevo del Inicio:**

1. Saludo + cinturón actual.
2. **Una sola tarjeta de acción principal** (`PrimaryActionCard`).
3. Máximo **3 técnicas en foco**.
4. Aviso de reposición pendiente **solo si la acción principal no es ya la reposición** (sin duplicar).
5. Camino al próximo cinturón (`MartialGradeCard` + Budo Pass).
6. **“Más detalles”** plegado: métricas, cumpleaños y criterios de examen.

**Decisiones tomadas y por qué:**

1. **Sin consultas nuevas.** `kataSummary.grado.pendingRecoveries` ya trae las faltas por reponer; no hizo falta añadir la consulta pesada que había previsto el plan.
2. **`NextClassCard` se elimina**, no se deja al lado: su contenido pasa a la acción principal y dejarlo sería código muerto.
3. **Hidratación resuelta en la tarjeta cliente.** `PrimaryActionCard` espera a `useNow()` y muestra un esqueleto con la misma altura; el servidor y el primer render del cliente coinciden.
4. **La presentación se separa de la decisión** (`PrimaryActionView` exportada), para poder probar las 4 variantes con datos fijos sin depender del reloj.
5. **Los enlaces conservan el contexto familiar** (`?estudiante=…`) con `studentHref`.

**Pruebas (8 de componente + ajuste del overview):** las 4 variantes, singular/plural de reposición, aviso sin duplicar, contexto familiar, “Más detalles” cerrado por defecto.

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 59 archivos / **281 tests** |
| `pnpm test:integration` | No aplica: sin cambios de API ni BD |
| `pnpm test:e2e` | Pendiente: conviene el pase visual del nuevo Inicio |

**Desviaciones respecto a la guía:**

- **Gate 1 no ejecutado todavía.** Decisión de León: priorizar la parte visual. El “antes” no se pierde: la app previa sigue en `main` y el Gate 1 puede correrse después sobre ese checkout con el entorno aislado.
- Los eventos `view_inicio` y `click_primary_action` quedan para UX-A7a.

**Pendientes o dudas:**

- El enlace de “Registrar repeticiones” apunta a Asistencia porque el registro aún vive ahí; se moverá a Entrenar en UX-B2.
- “Resolver” apunta a Asistencia hasta que exista el hub de UX-B3.
- Verificación visual en 375 px del nuevo Inicio antes del Gate 1.

**Revisión humana:** no aplica.

---

## UX-B1 · Navegación de 5 destinos

- **Fecha:** 2026-10-26
- **Commit:** `ux(B1): navegación de 5 destinos y rutas Clases/Entrenar`
- **Revisión humana:** ⏳ pendiente (B1 está en la lista de la sección 0.7)

**Destinos del alumno:**

| Destino | Ruta | Contenido |
|---|---|---|
| Inicio | `/estudiante` | Nuevo Inicio (A5b) |
| Entrenar | `/estudiante/entrenar` | Registro de práctica + katas y syllabus |
| Clases | `/estudiante/clases` | Horario + reportar inasistencia + reposiciones online + historial |
| Progreso | `/estudiante/progreso` | Grado, requisitos y criterios de examen |
| Perfil | `/estudiante/perfil` | Datos, documentos y seguridad (sin cambios) |

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `app/(dashboard)/estudiante/clases/page.tsx` |
| Nuevo | `app/(dashboard)/estudiante/entrenar/page.tsx` |
| Modificado | `app/(dashboard)/estudiante/horario/page.tsx` → `permanentRedirect` |
| Modificado | `app/(dashboard)/estudiante/asistencia/page.tsx` → `permanentRedirect` |
| Modificado | `components/dashboard/shell/RoleNavigation.tsx` (5 ítems + Seguridad oculta) |
| Modificado | `lib/ui/nav-labels.ts` (Inicio/Entrenar/Clases/Progreso/Perfil) |
| Modificado | `StudentSchedule.tsx` (`embedded` + `useNow`) |
| Modificado | `StudentProgressOverview.tsx` (el syllabus pasa a Entrenar) |
| Modificados | Enlaces: `PrimaryActionCard`, `FamilyMembersView`, `StudentMetricsGrid`, `ExaminationCriteriaCard`, `StudentAttendanceHistory/Records`, `FocusTechniquesList`, `lib/notifications/types.ts` |
| Modificados | Tests: `ui-labels`, `primary-action-card`, `empty-state`, `family-members`, `e2e/student-flow` |

**Decisiones tomadas y por qué:**

1. **Se adelantó la parte de UX-B2 para el alumno.** Los 5 destinos necesitaban contenido real: Clases reúne horario + reporte + historial y Entrenar reúne práctica + syllabus. No se creó ninguna página vacía ni se duplicaron componentes.
2. **Redirecciones permanentes en las páginas viejas**, con `permanentRedirect`, en lugar de `next.config`. Así funcionan tanto `/estudiante/horario` como `/dashboard/estudiante/horario` (alias con rewrite).
3. **Las reposiciones online siguen dentro de Clases** hasta que exista el hub de UX-B3. “Resolver” de la acción principal apunta ahí.
4. **Progreso deja de mostrar el syllabus**: ahora es grado, requisitos y examen. Las katas viven en Entrenar, como pide la guía.
5. **Notificaciones actualizadas**: los enlaces de horario y asistencia apuntan a `/clases`, así los avisos ya enviados no se rompen.
6. **Hidratación en el horario**: `StudentSchedule` calculaba `nextClassFrom()` con `new Date()` en render. Ahora espera a `useNow()` para no repetir el desajuste servidor/cliente.
7. **Barra inferior**: el filtro `!hideInBottomNav` deja exactamente 5 destinos; Seguridad sigue en el sidebar.

**Pruebas:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 59 archivos / **281 tests** |
| `pnpm test:integration` | No aplica: sin cambios de API ni BD |
| `pnpm test:e2e` | Smoke con Playwright en entorno aislado: Inicio, Entrenar, Clases, Progreso y Perfil cargan; `/asistencia` y `/horario` redirigen a `/clases`; 0 errores de consola |

**Ajuste posterior:** la barra inferior móvil es fija y podía tapar el final del contenido; el contenedor del shell ahora reserva `pb-20` en móvil (`fix(front): espacio para la barra inferior móvil`).

**Desviaciones respecto a la guía:**

- **Gate 2 no ejecutado** (validación de los 5 nombres con usuarios). Se hará después, ya con la app real.
- **B1 incluye la separación de contenido de B2** para el alumno. Se documenta aquí para no repetirlo.

**Pendientes o dudas:**

- **B3**: hub “Mis reposiciones”; hoy las reposiciones online están en Clases.
- **B4–B8**: instructor y admin, sin tocar.
- Revisión humana del diff antes de mergear (obligatoria para B1).
- Verificación visual en 375 px de Clases y Entrenar.

---

## UX-B4 · Instructor: modo tatami

- **Fecha:** 2026-10-27
- **Commit:** `ux(B4): modo tatami del instructor`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `app/(dashboard)/instructor/resumen/page.tsx` (el resumen anterior, preservado) |
| Nuevo | `lib/dashboard/instructor-defaults.ts` |
| Nuevo | `tests/unit/instructor-defaults.test.ts` |
| Modificado | `app/(dashboard)/instructor/page.tsx` → redirección permanente al pase de lista |
| Modificado | `app/(dashboard)/instructor/asistencia/page.tsx` (bandeja de pendientes + anclas) |
| Modificado | `app/(dashboard)/instructor/evaluaciones/page.tsx` (alumno preseleccionado) |
| Modificado | `components/dashboard/instructor/InstructorAttendanceRoster.tsx` |
| Modificado | `components/dashboard/shell/RoleNavigation.tsx` (Tatami primero; Resumen oculto) |
| Modificado | `lib/ui/nav-labels.ts` |
| Modificados | Tests de roster y e2e de instructor |

**Decisiones tomadas y por qué:**

1. **`/instructor` redirige al pase de lista** (`/instructor/asistencia`). El instructor entra directo en la clase de hoy o la próxima; el resumen anterior sigue disponible en `/instructor/resumen` (oculto en la barra inferior).
2. **Bandeja de pendientes al inicio** con tres contadores reales: prácticas/punch por confirmar (`getInstructorPendingCount`), justificaciones pendientes y reposiciones online programadas. Cada uno enlaza a su bloque (`#pase-de-lista`, `#justificaciones`, `#reposiciones`).
3. **“Marcar todos presentes” es la acción dominante** (verde sólido, 44 px) y desmarcar excepciones sigue siendo un clic por alumno. Las acciones de justificar, corregir y guardar también llegan a 44 px; el checkbox tiene un área táctil de 44×44.
4. **Evaluaciones preselecciona alumno**: primero el de la clase en curso (roster del horario por defecto) y, si no hay, el primero de su lista. La decisión vive en una función pura con 3 tests.
5. **Sin cambios de API**: `POST instructor/attendance`, `PATCH attendance/justification/{id}` y las reglas de propiedad (403 en clase ajena) quedan intactas.
6. **La medición `pase_de_lista_completado` queda para UX-A7a** (aplazada). No se instrumentó nada.

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 60 archivos / **284 tests** |
| `pnpm test:integration` | No aplica: sin cambios de API ni BD |
| Smoke instructor (Playwright, entorno aislado) | ✅ `/instructor` y `/dashboard/instructor` abren el pase de lista en `/asistencia`; bandeja con 3 contadores; “Marcar todos presentes”; Evaluaciones abre con Juan Pérez preseleccionado; 0 errores de consola |

**Desviaciones respecto a la guía:** ninguna de alcance. La instrumentación se pospone con A7a.

**Pendientes o dudas:**

- La fila de acciones del roster se desbordaba en 375 px; ahora usa `flex-wrap` y no hay scroll horizontal (`fix(instructor): acciones del roster en móvil`). Captura: `375-instructor-tatami-fix.png`.
- `permanentRedirect` se resuelve como redirección de cliente: la URL termina en `/asistencia` tras unos cientos de ms. El e2e espera la URL con reintento, así que pasa.
- La confirmación de punchs sigue fuera del pase de lista; el contador enlaza al bloque pero no hay una bandeja dedicada. Se decide en B5/B6 al reorganizar admin.

---

## UX-B5 · Admin en 5 secciones y bandeja “Hoy”

- **Fecha:** 2026-10-27
- **Commit:** `ux(B5): admin en 5 secciones y bandeja Hoy`
- **Revisión humana:** ⏳ pendiente (B5 está en la lista de la sección 0.7)

**Secciones:**

| Sección | Ruta | Contenido |
|---|---|---|
| **Hoy** | `/admin` | Bandeja única de pendientes + métricas del dojo |
| **Alumnos** | `/admin/alumnos` | Padrón y expediente, con acceso directo a Inscripciones |
| **Operación** | `/admin/operacion` | Hub: Asistencia/reposiciones y Balance de horas |
| **Configuración** | `/admin/configuracion` | Hub: Horarios, Calendario, Planes, Grados y katas |
| **Comunicación** | `/admin/comunicacion` | Hub: Mensajes, Reseñas, Blog |

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `components/dashboard/admin/AdminSectionHub.tsx` |
| Nuevo | `app/(dashboard)/admin/operacion/page.tsx` |
| Nuevo | `app/(dashboard)/admin/configuracion/page.tsx` |
| Nuevo | `app/(dashboard)/admin/comunicacion/page.tsx` |
| Modificado | `components/dashboard/admin/AdminDashboardOverview.tsx` (bandeja Hoy) |
| Modificado | `components/dashboard/admin/AdminStudents.tsx` (enlace a Inscripciones) |
| Modificado | `components/dashboard/shell/RoleNavigation.tsx` (5 secciones) |
| Modificado | `lib/ui/nav-labels.ts` |
| Modificado | `tests/unit/ui-labels.test.ts` |

**Decisiones tomadas y por qué:**

1. **Cinco destinos, con hubs en lugar de mover rutas.** Operación, Configuración y Comunicación agrupan las pantallas existentes en tarjetas. **No se movieron URLs**: todo lo antiguo sigue funcionando y no hizo falta redirección. El anidamiento profundo (`/admin/operacion/asistencia`, etc.) se hará en B6/B8, donde ya toca reorganizar esas pantallas.
2. **“Hoy” es una bandeja, no un resumen.** Cuatro filas con contador y enlace directo: Inscripciones pendientes, Documentos por revisar, Alumnos sin plan y Alumnos sin horario. Las métricas (alumnos, clases, inscripciones activas) bajan a segundo plano.
3. **Justificaciones y solicitudes de reposición no están en la bandeja todavía.** Las justificaciones sí tienen consulta en el roster de Asistencia (`justificationsPending`); falta el agregado para Hoy. Las solicitudes llegan con UX-A6. Se añaden cuando existan, sin inventar contadores.
4. **Badges en la nav:** el contador de inscripciones pendientes pasa a “Hoy” (antes vivía en Inscripciones) y el de alumnos nuevos sigue en “Alumnos”.
5. **Alumnos conserva Inscripciones a mano** con un enlace en la cabecera, para que no quede enterrada al quitar el ítem del menú.

**Pruebas:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 60 archivos / **284 tests** |
| `pnpm test:integration` | No aplica: sin cambios de API ni BD |
| Smoke admin (Playwright, entorno aislado) | ✅ “Hoy” con las 4 filas, nav de 5 secciones, los 3 hubs cargan y las rutas antiguas (`/admin/asistencia`, `/admin/grados-y-katas`) siguen accesibles; 0 errores de consola |

**Desviaciones respecto a la guía:**

- Las rutas no se han anidado todavía bajo cada sección (B6/B8).
- La bandeja no incluye justificaciones ni solicitudes de reposición (no implementadas).

**Pendientes o dudas:**

- Revisión humana del diff antes de mergear (obligatoria para B5).
- En 375 px los nombres “Configuración” y “Comunicación” se truncan en la barra inferior. Se puede acortar a “Config.” / “Comunic.” o permitir dos líneas; se decide con León en el dry-run.
- Dry-run de León recorriendo sus tareas diarias en la nueva estructura (lo pide la guía). Si algo quedó enterrado, se ajusta el agrupamiento.

---

## UX-B6 · Asistencia del admin en pestañas

- **Fecha:** 2026-10-27
- **Commit:** `ux(B6): asistencia del admin en pestañas`

**Archivos:**

| Tipo | Archivo |
|---|---|
| Nuevo | `components/common/Tabs.tsx` |
| Nuevo | `tests/component/tabs.test.tsx` |
| Modificado | `app/(dashboard)/admin/asistencia/page.tsx` |

**Pestañas:**

| Pestaña | Contenido movido |
|---|---|
| **Pase de lista** | `AdminExpectedSummary` + `AdminPassListPanel` |
| **Reposiciones** | `OnlineRecoveryPanel` (modo admin) |
| **Auditoría** | `AdminExpectedTable` + `AdminAttendanceView` (registros globales) |
| **Política** | `AdminAbsencePolicyCard` |

El filtro de clase/fecha (`AdminExpectedControls`) queda encima de las pestañas porque alimenta el pase de lista y la auditoría.

**Decisiones tomadas y por qué:**

1. **Se creó el primitivo `Tabs` ahora** porque UX-B0 aún no existe y B6 lo necesita. Accesible: `role="tablist"`, `aria-selected`, panel asociado, flechas/Inicio/Fin y 44 px. B0 no debe duplicarlo.
2. **No se cambió la lógica de ningún bloque**: solo se movieron a su pestaña. Las APIs y los permisos quedan igual.
3. **Las pestañas se envuelven en móvil** (`flex-wrap`), no se desplazan horizontalmente: las 4 quedan visibles a 375 px.
4. **El estado de la pestaña es local**. Si cambias el filtro de clase/fecha, la página recarga y vuelve a “Pase de lista”. Es aceptable porque el filtro vive arriba y el uso normal es pasar lista; se puede persistir en la URL más adelante.
5. **Las solicitudes de UX-A6 aparecerán en “Reposiciones”** cuando existan; hoy esa pestaña muestra las clases online y las faltas por agendar que ya había.

**Pruebas (4 nuevas, prefijo `UX-B0 ·`):** pestaña inicial y panel asociado, cambio con clic, navegación con flechas/Inicio/Fin, y solo la activa alcanzable con Tab.

**Resultado:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 61 archivos / **288 tests** |
| `pnpm test:integration` | No aplica: sin cambios de API ni BD |
| Smoke admin (Playwright, entorno aislado) | ✅ 4 pestañas, cambio de panel correcto, contenido esperado en cada una, sin overflow horizontal a 375 px y 0 errores de consola |

**Desviaciones respecto a la guía:** ninguna de alcance. El primitivo `Tabs` se adelanta desde UX-B0 por dependencia.

**Pendientes o dudas:**

- Persistir la pestaña activa en la URL (`?tab=`), si el dry-run de León lo pide.
- Revisar el copy de la pestaña “Auditoría” con datos reales (hoy muestra el listado esperado + registros globales).

---

## Reversión de la web pública (2026-10-27)

- **Decisión:** la reorganización UX/UI se limita a los dashboards. La página web pública debe quedar igual que en producción.
- **Origen:** cambios públicos introducidos por `802348b` (UX-A8) y `1b38696` (iconos de 44 px del Navbar, fondo del login).
- **Restaurados desde `origin/main`:** `components/Hero5.tsx`, `components/HomeView.tsx`, `components/Navbar.tsx`, `components/AboutView.tsx`, `components/assistant/AssistantChat.tsx`, `components/auth/AuthSidePanel.tsx`, `app/globals.css`.
- **Eliminado:** `tests/component/public-cta.test.tsx` (probaba el CTA nuevo del hero).
- **Se conserva:** `app/layout.tsx` con `data-scroll-behavior="smooth"` (no visual; evita un aviso de Next). Todo el código de dashboards queda intacto.
- **Verificación:** `git diff origin/main -- <archivos públicos>` vacío. `pnpm lint` ✅ 0 errores / 35 warnings preexistentes; `pnpm typecheck` ✅ sin salida; `pnpm test` ✅ 60 archivos / **286 tests** (bajan 2 al eliminar el test del CTA).


---

## Reversión de UX-B8 (2026-10-27)

- **Decisión de León:** el padrón de alumnos debe volver a como estaba funcionando antes; esa pantalla se trabajará con más detalle más adelante.
- **Acción:** revertido el commit `8893b6c` (`ux(B8): workspace de alumnos con detalle inline`).
- **Se retiraron:** `AdminStudentsWorkspace`, el primitivo `SlideOver` y sus tests, y las props de selección de `AdminStudents`.
- **Se conservan intactos:** `/admin/alumnos` con el padrón original, `/admin/alumnos/[studentId]` y `/admin/alumnos/detalle` con `AdminStudentDetailExplorer`. **No se borró nada del explorador.**
- **Sin cambios de BD, APIs ni datos.** `main` sigue sin tocar.

---

## UX-B5.1 · Correcciones post-auditoría B5

- **Fecha:** 2026-10-27
- **Rama:** `fix/b5.1` (desde `fix/b1-auditoria` / `f29fac9`).
- **Commit:** `ux(B5.1): corregir pendientes, justificaciones y etiquetas móviles` (único commit de la tarea).
- **Revisión humana:** esquema, migración y seed **aprobados** por León antes del commit.

**Alcance corregido:**

1. `getAdminDashboardSummary`: “sin plan” y “sin horario” cuentan solo `Student.status = ACTIVE`, con `scopeSchoolFilter` y `excludeFromPendingCounts = false`. Sin exclusión por rol.
2. Las filas de Hoy enlazan a `/dashboard/admin/alumnos?plan=none` y `?horario=none`; `AdminStudents` aplica los mismos filtros.
3. Hoy añade “Justificaciones pendientes” y enlaza a la **más antigua** con `tab=pase`, `classId` y `date`; Asistencia ya acepta esos parámetros. No se añade la fila de reposiciones (UX-A6).
4. Etiquetas móviles cortas `Config` y `Comunic` (sin punto) en la barra inferior, con `aria-label` completo; el drawer y el sidebar de escritorio conservan “Configuración”/“Comunicación”. Decisión tomada con capturas reales a 375 y 360 px.
5. Se corrige la afirmación de B5 sobre la consulta de justificaciones.

**Archivos:**

| Tipo | Archivo |
|---|---|
| Esquema + migración | `prisma/schema.prisma`, `prisma/migrations/20261027220000_add_student_exclude_from_pending_counts/migration.sql` |
| Seed | `prisma/seed.ts` (owner con `excludeFromPendingCounts: true` en `create` y `update`) |
| Lógica | `lib/dashboard/admin-queries.ts`, `lib/dashboard/pending-students.ts`, `lib/ui/search-params.ts` |
| Tipos | `types/dashboard.ts` |
| UI admin | `components/dashboard/admin/AdminDashboardOverview.tsx`, `components/dashboard/admin/AdminStudents.tsx`, `app/(dashboard)/admin/alumnos/page.tsx`, `app/(dashboard)/admin/asistencia/page.tsx` |
| Navegación | `lib/ui/nav-labels.ts`, `components/dashboard/shell/RoleNavigation.tsx`, `MobileDashboardNav.tsx`, `MobileDashboardSidebar.tsx` |
| Tests | `tests/integration/admin-hoy.test.ts`, `tests/integration/seed-owner-flag.test.ts`, `tests/component/admin-dashboard-overview.test.tsx`, `tests/component/admin-students.test.tsx`, `tests/unit/search-params.test.ts`, `tests/unit/ui-labels.test.ts` |
| Docs | este log |

**Decisiones:**

- **Campo aditivo:** `Student.excludeFromPendingCounts Boolean @default(false)`. Solo afecta a los pendientes “sin plan/sin horario”; no oculta el expediente del padrón, balance ni pase de lista.
- **Migración:** solo `ALTER TABLE ... ADD COLUMN ... DEFAULT false`; **sin backfill ni datos**.
- **Seed:** el owner se marca `true` en `create` y `update`; ningún otro alumno. No borra datos (INV-04).
- **Predicado único:** `lib/dashboard/pending-students.ts` define `status = ACTIVE` + `excludeFromPendingCounts = false`; `getAdminDashboardSummary` lo usa en Prisma y `getAdminStudents` expone `countsForPending` para que el filtro de Alumnos use la misma definición. Sin roles.
- **Justificaciones:** se extrajo `justificationScopeWhere` y se reutiliza en el roster de Asistencia y en el conteo de Hoy. `getAdminDashboardSummary` devuelve además `oldestJustification` (`classId` + `date`) ordenando por `date asc, createdAt asc`; la fila de Hoy abre `/dashboard/admin/asistencia?tab=pase&classId=…&date=YYYY-MM-DD`. El test usa dos pendientes en clases y fechas distintas: Hoy = 2, el enlace apunta a la más antigua y el roster de esa clase/fecha muestra 1.
- **Filtros:** `?plan=none` y `?horario=none` inicializan los filtros; los botones “Sin plan”/“Sin horario” se suman al panel existente y se limpian con “Limpiar filtros”.
- **Parámetros de URL:** `lib/ui/search-params.ts` es la validación única que usan las páginas. `parseStudentPendingFilter` solo acepta `none`; `parseAttendanceTab` solo `pase`, `reposiciones`, `auditoria` y `politica`; `parseIsoDate` solo `YYYY-MM-DD`. Cualquier valor desconocido se ignora y cae en el comportamiento por defecto. Hay test unitario para valores válidos, vacíos, `undefined`, mayúsculas y valores inventados.
- **Etiquetas:** `NAV_LABELS.configuracionCorta = 'Config'` y `comunicacionCorta = 'Comunic'` (sin punto). La barra inferior móvil usa `shortLabel` y expone el nombre completo en `aria-label`; el drawer móvil y el sidebar de escritorio muestran “Configuración”/“Comunicación”. Se midió primero con las etiquetas completas a 10 px y 1 px de padding: no caben (ver capturas); por eso se eligió el texto corto sin punto.

**Verificación:**

| Comando | Resultado |
|---|---|
| `pnpm lint` | ✅ 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | ✅ Sin salida |
| `pnpm test` | ✅ 66 archivos / **315 tests** |
| `pnpm test:integration` | ✅ 45 archivos / **416 tests** |
| Tests nuevos | owner no cuenta; instructor con `Student` sin plan **sí** cuenta; inactivo no cuenta; segunda escuela aislada; Hoy == lista filtrada; justificaciones Hoy = 2 y enlace a la más antigua; roster de la más antigua = 1; seed marca solo al owner; `plan`/`horario`/`tab` ignoran valores desconocidos |

**Migración:**

- Archivo: `prisma/migrations/20261027220000_add_student_exclude_from_pending_counts/migration.sql`.
- Timestamp `20261027220000` **posterior** a la última existente `20261020170100_add_online_recovery_notifications`.
- Solo `ALTER TABLE "Student" ADD COLUMN ... BOOLEAN NOT NULL DEFAULT false`; sin backfill ni datos.

**Capturas de etiquetas (375 y 360 px):**

Carpeta `audit/b5.1/screenshots/` (no versionada). Las capturas se tomaron contra una BD Postgres local y desechable en el puerto `55435`, con el seed de prueba y las integraciones externas vacías.

| Archivo | Qué muestra |
|---|---|
| `bottom-nav-375-before-clip.png`, `bottom-nav-360-before-clip.png` | Versión anterior: `Config.` / `Comunic.` |
| `bottom-nav-375-full-clip.png`, `bottom-nav-360-full-clip.png` | Prueba con nombres completos a 10 px y 1 px de padding: “Configuración” y “Comunicación” se solapan. |
| `bottom-nav-375-after-clip.png`, `bottom-nav-360-after-clip.png` | Versión final: `Config` / `Comunic`, sin punto. |
| `drawer-375-after.png`, `drawer-360-after.png` | Drawer móvil con los nombres completos. |
| `label-measurements.json` | Medidas de ancho disponible y desbordamiento por etiqueta. |

Medición de la prueba con nombres completos (10 px, padding 1 px):

| Pantalla | Ancho por ítem | Disponible | “Configuración” | “Comunicación” | ¿Cabe? |
|---|---|---|---|---|---|
| 375 px | 68,6 px | 66,6 px | 67,4 px | 68,5 px | No (desborda 0,8 / 1,9 px) |
| 360 px | 65,6 px | 63,6 px | 67,4 px | 68,5 px | No (desborda 3,8 / 4,9 px) |

Decisión: `Config` / `Comunic` sin punto, con `aria-label` completo. En la versión final ninguna etiqueta se trunca ni desborda (31 px y 42,5 px sobre 57,6 px disponibles a 360 px).

**SQL de producción (NO ejecutado):**

Confirmar antes el correo/ID real del sensei. El esquema no usa `@@map` ni `@map` en `Student`/`User`, así que los nombres son los de Prisma:

```sql
-- Ejecutar UNA sola vez, después de aplicar la migración.
-- Antes: confirmar que <CORREO_REAL_DEL_SENSEI> es la cuenta owner real.
UPDATE "Student" AS s
SET "excludeFromPendingCounts" = true
FROM "User" AS u
WHERE s."userId" = u.id
  AND u.email = '<CORREO_REAL_DEL_SENSEI>';
```

Si se prefiere por ID, sustituir la condición por `u.id = '<ID_REAL_DEL_SENSEI>'`. No se ejecutó en producción.

**Pendientes:**

- Marcar al owner en el flujo de alta de escuela (no depender solo del seed).
- Interruptor de admin para `excludeFromPendingCounts` (editar el flag desde el expediente).
- La fila de reposiciones sigue pendiente de UX-A6.
