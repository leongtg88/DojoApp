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
