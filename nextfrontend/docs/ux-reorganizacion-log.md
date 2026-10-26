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
| UX-00 · Línea base | 2026-10-26 | pendiente | ✅ Hecha | — |
| UX-01 · Constantes de nav y copy | 2026-10-26 | pendiente | 🚧 En curso | — |

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
