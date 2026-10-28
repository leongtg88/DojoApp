# Auditoría UX-B1 · Navegación del alumno y del tutor

- **Fecha:** 2026-10-27
- **Alcance:** paridad de la navegación del alumno (UX-B1), con el tutor como usuario del mismo portal.
- **Producción auditada:** `08008ee` (`main`, confirmado por el usuario).
- **Versión nueva:** `310dc4c` (`ux/reorganizacion`, HEAD).
- **Commit de B1:** `b6e66c1`.
- **Entorno:** builds de producción locales (`next build` + `next start`) en `127.0.0.1:3100` (producción) y `127.0.0.1:3101` (nueva).
- **Base de datos:** PostgreSQL 16 aislado en `127.0.0.1:55433/dojo_audit`, migrado y sembrado; sin acceso a producción y sin leer ni copiar `.env.local`.
- **Regla cumplida:** no se modificó código de la aplicación. Solo se crearon archivos en `audit/` y este informe.

> **Nota posterior:** este informe describe el estado auditado (`310dc4c`). Las correcciones de B1-01 a B1-05 están en la rama `fix/b1-auditoria` (ver sección 13). No se reejecutó la suite de navegador completa después de los cambios; la verificación posterior fue unitaria/integración.

---

## 1. Resumen ejecutivo

La estructura de 5 destinos **funciona**: las cinco páginas nuevas cargan, la barra inferior tiene 5 ítems y las rutas antiguas terminan en `Clases` cuando el navegador ejecuta JavaScript. Sin embargo, la auditoría encontró un problema que invalida el criterio de aceptación de B1 y varios problemas de contexto familiar:

| ID | Severidad | Hallazgo |
|---|---|---|
| **B1-01** | **Bloqueante** | Las rutas antiguas responden **200**, no 308/301. El cambio a `Clases` ocurre por JavaScript, sin cabecera `Location`. |
| **B1-02** | **Importante** | El tutor recibe **403** en toda la API de notificaciones. La campana muestra “3 notificaciones sin leer” pero el desplegable está vacío. |
| **B1-03** | **Importante** | Las redirecciones antiguas **pierden `?estudiante=`**. El tutor vuelve a “Cuenta familiar” y puede acabar viendo/actuando sobre el hijo por defecto. |
| **B1-04** | **Importante** | En la URL canónica `/estudiante`, el tutor pierde el selector familiar, los enlaces dejan de arrastrar al hijo y el sidebar lo etiqueta como **“Administrador”**. |
| **B1-05** | **Importante** | Las notificaciones de técnicas (`TECHNIQUES_ASSIGNED`, `TECHNIQUES_REMOVED`, `KATAS_UNLOCKED`) llevan a **Progreso**, pero el syllabus se movió a **Entrenar**. |
| **B1-06** | **Menor** | El sidebar y el drawer tienen **6 ítems** (5 + Seguridad), no los “mismos 5”. Perfil no contiene passkeys/ajustes; se llega por el 6.º ítem. |
| **B1-07** | **Menor** | Los enlaces del drawer móvil miden **40 px** de alto; el mínimo de la guía es 44 px. La barra inferior sí cumple (56 px). |
| **B1-08** | **Menor** | La guía documenta `/estudiante/entrenar/katas` y `/practica`, pero solo existe una página `/estudiante/entrenar`; las rutas documentadas dan 404. |
| **B1-09** | **Observación** | Los redirects por rol o por hijo ajeno también son de cliente: responden 200 y terminan en `/no-autorizado` tras JavaScript. No se observó fuga de datos. |

**No encontré** rutas huérfanas, enlaces de notificación rotos, enlaces viejos en correos/WhatsApp, ni accesos sin sesión que se salten `/login`. El detalle y la evidencia están abajo.

---

## 2. Inventario de rutas

Se probaron las dos formas: `/dashboard/...` (alias con `rewrite`) y `/...` (canónica de App Router). El resultado fue el mismo en ambas. Todas las peticiones llevaban sesión de alumno.

| Ruta | Producción `08008ee` | Nueva `310dc4c` | Observación |
|---|---:|---:|---|
| `/estudiante` | 200 | 200 | Inicio |
| `/estudiante/perfil` | 200 | 200 | Perfil |
| `/estudiante/progreso` | 200 | 200 | Progreso |
| `/estudiante/horario` | 200 | **200** | En la nueva, el navegador acaba en `/dashboard/estudiante/clases` por JS |
| `/estudiante/asistencia` | 200 | **200** | Igual: destino final `Clases` por JS |
| `/estudiante/clases` | 404 | 200 | Nueva ruta |
| `/estudiante/entrenar` | 404 | 200 | Nueva ruta |
| `/estudiante/entrenar/katas` | 404 | 404 | Documentada, no implementada |
| `/dashboard/ajustes` | 200 | 200 | Seguridad/passkeys, fuera del portal del alumno |

**Rutas antiguas sin destino:** ninguna. Las dos rutas antiguas (`horario`, `asistencia`) apuntan a `Clases`, aunque no con un 308 real (ver B1-01).

**Rutas nuevas sin equivalente antiguo:** `clases` y `entrenar`. La versión de producción no las tiene; por eso las capturas de “Clases” y “Entrenar” no son comparaciones 1:1.

Evidencia: `../../audit/reports/inventory-prod.json` y `../../audit/reports/inventory-new.json`.

---

## 3. Redirecciones

### 3.1 Código HTTP

| Ruta antigua | HTTP nueva | `Location` | Destino final | ¿Permanente? |
|---|---:|---|---|---|
| `/dashboard/estudiante/horario` | **200** | — | `/dashboard/estudiante/clases` (JS) | **No** |
| `/estudiante/horario` | **200** | — | `/dashboard/estudiante/clases` (JS) | **No** |
| `/dashboard/estudiante/asistencia` | **200** | — | `/dashboard/estudiante/clases` (JS) | **No** |
| `/estudiante/asistencia` | **200** | — | `/dashboard/estudiante/clases` (JS) | **No** |
| `/dashboard/estudiante/horario/` | 308 | `/dashboard/estudiante/horario` | Luego 200 + JS a `Clases` | Solo la barra final |

El `permanentRedirect` está en `app/(dashboard)/estudiante/horario/page.tsx:9` y `asistencia/page.tsx:9`. El efecto observado es consistente con que el layout `(dashboard)` ya haya enviado el shell cuando la página lanza el redirect; Next lo resuelve en el cliente. La URL cambia después de ~500–1500 ms, pero el HTTP inicial es 200 y no trae `Location`.

**Impacto:** un navegador con JS llega a `Clases`, pero un `curl`, un bot, un preview de enlace o un cliente sin JS no. No hay señal HTTP permanente. El criterio “redirección permanente (308/301)” de la tarea no se cumple.

Evidencia: `../../audit/reports/redirects-http-new.json`, `../../audit/reports/redirects-browser-new.json`, `../../audit/reports/inventory-new.json`.

### 3.2 Contexto del tutor

| Petición | URL final | Selector familiar |
|---|---|---|
| `/dashboard/estudiante/horario?estudiante=<Ana>` | `/dashboard/estudiante/clases` (sin query) | “Cuenta familiar” |
| `/dashboard/estudiante/asistencia?estudiante=<Ana>` | `/dashboard/estudiante/clases` (sin query) | “Cuenta familiar” |
| `/estudiante/horario?estudiante=<Ana>` | `/dashboard/estudiante/clases` (sin query) | “Cuenta familiar” |

La query se pierde porque el destino del `permanentRedirect` es una constante sin `searchParams`. En un tutor con dos hijos, el portal vuelve al hijo por defecto.

Evidencia: `../../audit/reports/redirects-guardian.json`.

---

## 4. Enlaces generados

### 4.1 Notificaciones

Se generaron los 25 tipos de `NotificationType` con `buildNotificationContent()` y se probó cada enlace con el rol destinatario. **Los 25 responden 200**, pero tres llevan a un destino semánticamente incorrecto:

| Tipo | Enlace actual | Destino esperado según B1 | Resultado |
|---|---|---|---|
| `TECHNIQUES_ASSIGNED` | `/dashboard/estudiante/progreso` | `/dashboard/estudiante/entrenar` | **Incorrecto** |
| `TECHNIQUES_REMOVED` | `/dashboard/estudiante/progreso` | `/dashboard/estudiante/entrenar` | **Incorrecto** |
| `KATAS_UNLOCKED` | `/dashboard/estudiante/progreso` | `/dashboard/estudiante/entrenar` | **Incorrecto** |
| `RANK_PROMOTED` | `/dashboard/estudiante/progreso` | Progreso | Correcto |
| `CLASS_ENROLLED`, `CLASS_REMOVED` | `/dashboard/estudiante/clases` | Clases | Correcto |
| `ATTENDANCE_*` | `/dashboard/estudiante/clases` | Clases | Correcto |
| `DOCUMENT_*`, `PLAN_ASSIGNED`, `SCHOLARSHIP_ASSIGNED` | `/dashboard/estudiante/perfil` | Perfil | Correcto |
| `ONLINE_RECOVERY_*` | `/dashboard/estudiante/clases` | Clases (hub en B3) | Correcto por ahora |
| `DOCUMENT_UPLOADED`, `ATTENDANCE_PUNCHED`, `ATTENDANCE_ABSENCE_REPORTED`, `REVIEW_SUBMITTED` | `/dashboard/admin/...` | Admin | Correcto con rol admin |
| `ONLINE_RECOVERY_ASSIGNED` | `/dashboard/instructor/asistencia` | Instructor | Correcto con rol instructor |

B1 quitó `StudentSyllabus` de Progreso (`StudentProgressOverview.tsx`) y lo movió a Entrenar, pero no actualizó estos tres enlaces (`lib/notifications/types.ts:57-84`). La notificación “Nuevas técnicas asignadas” abre “Grado y examen” y no muestra las técnicas.

Evidencia: `../../audit/reports/links-inventory.json`, `../../audit/reports/links-bell-student.json` (clic real: URL `/progreso`, H1 “Grado y examen”), `../../audit/reports/link-inventory.json`.

### 4.2 Enlaces históricos

Las rutas antiguas guardadas en notificaciones viejas siguen funcionando en un navegador: `/dashboard/estudiante/horario` y `/asistencia` acaban en `Clases` por JS. No hay 308 (B1-01), pero el usuario llega.

Evidencia: `../../audit/reports/links-historical.json`.

### 4.3 API de notificaciones del tutor

| Petición | Rol | HTTP |
|---|---|---:|
| `GET /api/dashboard/notifications?limit=6` | Alumno | 200 |
| `GET /api/dashboard/notifications?limit=6` | Tutor | **403** |
| `PATCH /api/dashboard/notifications` | Tutor | **403** |

La lista `ALL_ROLES` de `app/api/dashboard/notifications/route.ts:8` y `[notificationId]/route.ts:13` no incluye `GUARDIAN`. El layout sí cuenta las notificaciones del tutor y muestra “3 notificaciones sin leer”, pero el desplegable queda vacío. Además, como el shell renderiza dos campanas (escritorio y móvil), cada página del tutor genera **dos errores 403 en consola**.

Es un problema **preexistente** (producción tiene el mismo código), pero afecta directamente al portal del tutor que B1 reutiliza.

Evidencia: `../../audit/reports/links-notification-api.json`, `../../audit/reports/reachability-content-new-guardian.json`.

### 4.4 Correo y WhatsApp

- **Correo:** no hay plantillas de correo con rutas del portal del alumno. Resend solo se usa para restablecer contraseña e invitaciones; sus enlaces son de autenticación (`app/api/auth/forgot-password/route.ts:75`, `app/api/dashboard/admin/students/[studentId]/invite/route.ts:81`).
- **WhatsApp:** el código envía nombre de plantilla y parámetros; no contiene URLs del portal (`lib/integrations/whatsapp.ts`). El cuerpo de la plantilla vive en Meta y no se puede verificar desde el repo.

Evidencia: `../../audit/reports/source-scan.json`.

---

## 5. Alcanzabilidad

### 5.1 Menú

| Rol | Sidebar 1440 | Barra inferior 375 | Drawer 375 |
|---|---:|---:|---:|
| Alumno | **6** | 5 | **6** |
| Tutor | **6** | 5 | **6** |

Los 5 destinos son `Inicio, Entrenar, Clases, Progreso, Perfil`. El sexto es `Seguridad` (`/dashboard/ajustes`). La guía pide “barra inferior con máximo 5; sidebar de escritorio con los mismos 5”; el sidebar y el drawer no cumplen. El B1 log dice que fue intencional, pero sigue siendo una desviación de la guía.

El contexto `?estudiante=<Ana>` **sí se conserva** en el sidebar, la barra inferior y el drawer cuando se navega desde `/dashboard/estudiante` (el alias que usa la app). Se pierde en la URL canónica `/estudiante` (B1-04).

Evidencia: `../../audit/reports/reachability-nav-new-student.json`, `reachability-nav-new-guardian.json`, `reachability-nav-prod-student.json`, `reachability-nav-prod-guardian.json`.

### 5.2 Funciones del inventario B1

| Destino | Función esperada | Resultado |
|---|---|---|
| Inicio | Resumen + acción principal | ✅ “Bienvenido/a”, tarjeta de clase, técnicas en foco, grado |
| Entrenar | Katas, syllabus, registro de repeticiones | ✅ “Registrar repeticiones” + “Técnicas asignadas” |
| Clases | Horario, reportar inasistencia, historial | ✅ “Mis clases”, agenda, reporte, historial y reposiciones online |
| Progreso | Grado, requisitos, criterios de examen | ✅ “Grado y examen”, “Criterios de postulación”, “Requisitos de examen de grado” |
| Perfil | Datos, documentos, passkeys/ajustes | ⚠️ Datos y documentos ✅; passkeys/ajustes **no** están dentro de Perfil, sino en el 6.º ítem `Seguridad` |

No se perdió ninguna función del inventario. La única desviación es la agrupación de passkeys/ajustes.

### 5.3 Páginas huérfanas

Rutas de `app/(dashboard)/estudiante/**/page.tsx`:

```
/dashboard/estudiante
/dashboard/estudiante/asistencia   (stub de redirección)
/dashboard/estudiante/clases
/dashboard/estudiante/entrenar
/dashboard/estudiante/horario      (stub de redirección)
/dashboard/estudiante/perfil
/dashboard/estudiante/progreso
```

Todas están enlazadas o son stubs de redirección. **Huérfanas: 0.**

Evidencia: `../../audit/reports/reachability-orphans.json`.

### 5.4 Objetivos táctiles y layout

| Elemento | Alto medido | Mínimo | Resultado |
|---|---:|---:|---|
| Ítems de la barra inferior | 56 px | 44 px | ✅ |
| Ítems del drawer móvil | **40 px** | 44 px | ❌ |
| Scroll horizontal a 375 px | No | — | ✅ |

Evidencia: `../../audit/reports/reachability-nav-new-student.json`, `reachability-nav-new-guardian.json`.

### 5.5 URL canónica `/estudiante`

| Comprobación | Resultado |
|---|---|
| Selector familiar visible | **0** (no se renderiza) |
| Enlaces del sidebar con `?estudiante=` | **No** |
| Etiqueta del rol en el sidebar | **“Administrador”** |

Causa: `resolveActiveRole()` solo reconoce `/dashboard/estudiante` (`DashboardShell.tsx:30-37`); `withStudentContext()` exige `activeRole === 'STUDENT'` (`DashboardSidebar.tsx:32`, `MobileDashboardNav.tsx:74`, `MobileDashboardSidebar.tsx:39`). El B1 log declara `/estudiante` como canónica, pero el shell asume el alias `/dashboard`.

Es un problema **preexistente**, pero la nueva organización lo hace más visible porque la canónica es la ruta que se documenta.

Evidencia: `../../audit/reports/reachability-canonical.json`.

---

## 6. Seguridad básica

### 6.1 Sin sesión

Todas las rutas nuevas y antiguas, en ambas formas (`/estudiante/...` y `/dashboard/estudiante/...`), responden **307** a `/login?callbackUrl=...`. Incluye `/estudiante` exacto, `/clases`, `/entrenar`, `/horario`, `/asistencia`, `/dashboard/ajustes`, `/dashboard/admin` y `/dashboard/instructor/asistencia`.

Evidencia: `../../audit/reports/security-anon.json`.

### 6.2 Rol incorrecto

| Escenario | HTTP inicial | URL final |
|---|---:|---|
| Instructor → rutas de alumno | 200 | `/no-autorizado` |
| Admin → rutas de alumno | 200 | `/no-autorizado` |
| Alumno → `/dashboard/admin` o `/dashboard/instructor/...` | 200 | `/no-autorizado` |

El usuario termina en `/no-autorizado`, como pide la tarea, pero el HTTP inicial es 200 y el cambio es por JavaScript (B1-09). No se observó contenido protegido en el HTML inicial.

Evidencia: `../../audit/reports/security-roles.json`.

### 6.3 Hijo ajeno

| Escenario | HTTP inicial | URL final | ¿Muestra datos del hijo ajeno? |
|---|---:|---|---|
| Tutor con `?estudiante=<hijo del owner>` en Inicio/Clases/Perfil | 200 | `/no-autorizado` | **No** |
| Alumno con `?estudiante=<otro alumno>` | 200 | `/no-autorizado` | **No** |
| API `GET /api/dashboard/student/documents?estudiante=<ajeno>` | **403** | — | **No** |

Evidencia: `../../audit/reports/security-foreign.json`.

---

## 7. Capturas

Hay **30 capturas** (5 páginas × 3 anchos × 2 versiones) en `../../audit/screenshots/`.

| Documento | Producción `08008ee` | Nueva `310dc4c` |
|---|---|---|
| Inicio | `prod/{375,768,1440}/inicio.png` | `new/{375,768,1440}/inicio.png` |
| Clases | `prod/{...}/clases-horario.png` + `clases-asistencia.png` | `new/{...}/clases.png` |
| Entrenar | `prod/{...}/clases-asistencia.png` (el registro de práctica vive ahí) | `new/{...}/entrenar.png` |
| Progreso | `prod/{...}/progreso.png` | `new/{...}/progreso.png` |
| Perfil | `prod/{...}/perfil.png` | `new/{...}/perfil.png` |

Notas:

- Producción no tiene “Clases” ni “Entrenar”. Se capturaron `Horario` y `Asistencia` como proxys; la comparación es indicativa, no 1:1.
- En las capturas `fullPage` de móvil, la barra inferior fija aparece a la altura del viewport (mitad de la imagen). Es un artefacto de Playwright, no un solapamiento real: la barra inferior mide 56 px y el shell reserva `pb-20`.
- No se observaron errores de consola en las páginas del alumno. En las del tutor aparecen dos 403 por página (B1-02).

Evidencia: `../../audit/reports/screenshots-prod.json`, `screenshots-new.json`.

---

## 8. Lo que sí pasa

- Las 5 páginas nuevas cargan con 200 y el contenido esperado.
- La barra inferior tiene exactamente 5 ítems y 56 px de alto.
- No hay scroll horizontal a 375 px.
- No hay páginas huérfanas.
- Los 25 enlaces de notificación resuelven con el rol correcto.
- El tutor conserva `?estudiante=` al navegar desde `/dashboard/estudiante`.
- Sin sesión, las 11 rutas probadas llevan a `/login` con 307 y `callbackUrl`.
- Un hijo ajeno termina en `/no-autorizado`; la API responde 403; no se observó fuga.
- No se encontraron enlaces viejos en notificaciones, correos ni WhatsApp.
- Las capturas old/new están completas a 375, 768 y 1440 px.

---

## 9. No verificado

- **Cuerpo de las plantillas de WhatsApp:** vive en Meta; el repo solo envía nombre y parámetros.
- **Entrega real de correos:** `RESEND_API_KEY` se dejó vacía a propósito; solo se verificaron las URLs generadas.
- **Comportamiento en Vercel/CDN:** se usó un build de producción local, no el edge de Vercel.
- **Datos reales de producción:** se usó una BD sembrada y un tutor sintético con dos hijos.
- **Tutor con expediente propio o con un solo hijo:** el fixture tiene dos hijos y ningún expediente propio.
- **Dispositivos reales y otros navegadores:** solo Chromium 1.64.1.
- **Lector de pantalla y contraste:** no se midió WCAG completo; solo objetivos táctiles y overflow.
- **Supabase Storage:** las claves se dejaron vacías; no se probaron previews de documentos/fotos.
- **WebAuthn/passkeys:** fuera del alcance de esta sesión.
- **Rate limiting bajo carga:** no se estresó.
- **SHA exacto desplegado:** se usó `08008ee` porque el usuario lo confirmó; no se contrastó contra la API de Vercel.

---

## 10. Reproducción

El entorno completo, comandos y limpieza están en `../../audit/README.md`.

Resumen:

1. Worktrees `../dojoapp-prod` (`08008ee`) y `../dojoapp-new` (`310dc4c`).
2. PostgreSQL aislado en `55433`, migraciones, seed y fixture de tutor.
3. Build/start en `127.0.0.1:3100` y `3101` con integraciones externas vacías.
4. `audit/playwright.config.mjs` + specs `01`–`06`.
5. Capturas en `audit/screenshots/`; datos en `audit/reports/`.

Los archivos de `audit/` no se commitearon ni se movieron a `main`. Las capturas y los reportes están ignorados por `audit/.gitignore`; los scripts y specs quedan locales para reproducir.

---

## 11. Archivos creados

| Ruta | Contenido |
|---|---|
| `audit/README.md` | Entorno y comandos |
| `audit/scripts/**` | Env, seed del tutor, inventarios, probes |
| `audit/specs/**` | Suite Playwright (inventario, redirects, enlaces, alcanzabilidad, seguridad, capturas) |
| `audit/reports/**` | Evidencia JSON y logs |
| `audit/screenshots/**` | 30 capturas |
| `nextfrontend/docs/auditoria-B1.md` | Este informe |

**No se modificó** `nextfrontend/app`, `components`, `lib`, `prisma`, `tests` ni `.env.local`. La base `omaskuchen-db` y el PostgreSQL de `5432` no se tocaron.

---

## 12. Recomendaciones (no aplicadas)

1. **B1-01:** mover las redirecciones de `horario`/`asistencia` a `proxy.ts`, `next.config` o un route handler que responda 308 antes del shell; conservar `searchParams`.
2. **B1-02:** añadir `GUARDIAN` a `ALL_ROLES` en las rutas de notificaciones y cubrirlo con tests.
3. **B1-03:** construir el destino del redirect con la query original (`?estudiante=` incluido).
4. **B1-04:** normalizar `/estudiante` y `/dashboard/estudiante` en `resolveActiveRole` y en `withStudentContext`.
5. **B1-05:** añadir un `ENTRENAR_LINK` para las notificaciones de técnicas; dejar `RANK_PROMOTED`/evaluaciones en Progreso.
6. **B1-06:** decidir si `Seguridad` es un 6.º destino o si se integra en Perfil; si se mantiene, actualizar la guía y el criterio “mismos 5”.
7. **B1-07:** subir los ítems del drawer a ≥44 px.
8. **B1-08:** actualizar la tabla de B1 o añadir redirecciones para `/entrenar/katas` y `/practica` si se van a enlazar.
9. **B1-09:** valorar guards HTTP para roles si los clientes sin JS importan; hoy el proxy solo valida sesión.

---

## 13. Correcciones aplicadas (rama `fix/b1-auditoria`, commit `f29fac9`)

Sin mover `main`, sin push y sin reauditoría completa:

| Hallazgo | Corrección |
|---|---|
| **B1-01** | `proxy.ts` intercepta las rutas antiguas y responde **308** con `Location`; se conserva la query. Helper `lib/navigation/legacy-redirects.ts`. |
| **B1-02** | `GUARDIAN` añadido a `ALL_ROLES` en `GET/PATCH/DELETE /api/dashboard/notifications` y en el `PATCH` de detalle. |
| **B1-03** | El redirect conserva `?estudiante=`. Además, cada notificación añade el `studentId` al enlace del portal (`lib/notifications/links.ts`). |
| **B1-04** | `resolveActiveRole` y la marca de enlace activo aceptan `/estudiante/...` y `/dashboard/estudiante/...` (`lib/navigation/panel-path.ts`). |
| **B1-05** | `TRAINING_LINK = /dashboard/estudiante/entrenar` para técnicas asignadas, retiradas y katas desbloqueadas. |

Pruebas posteriores:

| Comando | Resultado |
|---|---|
| `pnpm lint` | 0 errores, 35 warnings preexistentes |
| `pnpm typecheck` | Sin salida |
| `pnpm test` | 64 archivos / **307 tests** |
| Integración dirigida (`route-auth-matrix` + `notifications`) | 2 archivos / **174 tests** |
| Smoke real con `next dev` en 3102 | **308** + `Location` con `?estudiante=ana` (`../../audit/reports/redirects-fix-smoke.txt`) |
| Comprobación de `NextResponse.redirect(..., 308)` | 308 + `Location` con `?estudiante=ana` |

**Pendientes de decisión:** B1-06 (6.º ítem / passkeys), B1-07 (40 px del drawer), B1-08 (rutas documentadas) y B1-09 (redirects de rol por cliente). No se tocaron en esta rama.
