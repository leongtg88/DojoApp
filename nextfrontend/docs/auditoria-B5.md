# Auditoría UX-B5 · Admin: 5 secciones y bandeja “Hoy”

- **Fecha:** 2026-10-27
- **Alcance:** paridad del menú del admin y bandeja “Hoy” (UX-B5), incluyendo autorización e INV-06.
- **Producción auditada:** `08008ee` (`main`).
- **Versión nueva:** `f29fac9` (`fix/b1-auditoria`), verificado descendiente de `310dc4c`.
- **Entorno:** builds de producción locales en `127.0.0.1:3110` (producción) y `3111` (nueva), PostgreSQL aislado en `55434/dojo_audit_b5`.
- **Regla cumplida:** no se modificó código de la aplicación. Solo se crearon archivos en `audit/b5/` y este informe.

---

## 1. Resumen ejecutivo

El menú nuevo **funciona y no dejó rutas viejas rotas**: las 16 rutas antiguas probadas del admin responden 200 en ambas versiones, los 3 hubs nuevos existen solo en la nueva y no hay ningún 404 antiguo. La autorización y el aislamiento por escuela pasaron, sin fugas en el HTML inicial.

Los problemas están en la bandeja “Hoy” y en la calidad del menú:

| ID | Severidad | Hallazgo |
|---|---|---|
| **B5-01** | **Importante** | Falta la fila de **justificaciones** en “Hoy”, aunque hay 1 pendiente en la BD. La consulta existe a nivel de roster de asistencia; el log dice que no existe. |
| **B5-02** | **Dependencia documentada** | Faltan las **solicitudes de reposición** de UX-A6. No hay modelo `RecoveryRequest`; no es un bug de B5. |
| **B5-03** | **Importante** | Los contadores **“sin plan” y “sin horario”** cuentan inactivos y al propio sensei. Hoy muestra 3/3; la BD confirma Inactivo, Sensei y los dos casos de prueba. |
| **B5-04** | **Importante** | Las filas **“Alumnos sin plan”** y **“Alumnos sin horario”** no filtran ni llevan a una pantalla útil: van a la lista general de alumnos y a la gestión de horarios. |
| **B5-05** | **Importante (proceso)** | La matriz de autorización de la app solo prueba `STUDENT` como rol incorrecto para admin y no cubre las páginas nuevas. La matriz negra ampliada (300 combinaciones) pasó; se propone el cambio de test aparte. |
| **B5-06** | **Menor** | Navegación: 6 ítems en sidebar/drawer (5 + Seguridad), etiquetas “Configuración” y “Comunicación” truncadas a 375 px, badges solo en Hoy/Alumnos y **+1 clic** en todas las funciones que quedaron detrás de un hub. |

**Lo que sí pasó:**

- 16 rutas antiguas probadas 200 en producción y en la nueva; **0 rutas viejas con 404**. La 17.ª (`/admin/blog/[postId]`) no se probó por falta de artículo.
- 3 hubs nuevos 404 en producción y 200 en la nueva; los enlaces de las tarjetas llevan a pantallas 200.
- Los 4 contadores existentes de “Hoy” coinciden exactamente con SQL.
- Admin de la escuela B no ve datos de A en páginas, contadores ni API; y viceversa.
- 7 páginas: sin sesión 307 a `/login`; alumno/instructor/tutor terminan en `/no-autorizado` con **0 datos del admin en el HTML inicial**.
- 300 combinaciones de API: alumno/instructor/tutor 403; admin 200/400/404, nunca 403; sin sesión 401/403.
- 169 tests de la matriz de integración existente en verde.
- 39 capturas (15 de producción, 24 de la nueva) sin errores de consola.

---

## 2. Inventario de rutas

Se probaron las dos formas: `/admin/...` y `/dashboard/admin/...` (alias). El resultado fue el mismo. Todas con sesión de admin.

| Grupo | Producción `08008ee` | Nueva `f29fac9` |
|---|---:|---:|
| Rutas antiguas probadas (16) | **200** | **200** |
| `/admin/operacion` | 404 | 200 |
| `/admin/configuracion` | 404 | 200 |
| `/admin/comunicacion` | 404 | 200 |

Rutas antiguas comprobadas: `/admin`, `/admin/alumnos`, `/admin/alumnos/[studentId]`, `/admin/alumnos/detalle`, `/admin/alumnos/detalle/imprimir`, `/admin/asistencia`, `/admin/balance`, `/admin/blog`, `/admin/blog/nuevo`, `/admin/calendario`, `/admin/grados-y-katas`, `/admin/horarios`, `/admin/inscripciones`, `/admin/mensajes`, `/admin/planes`, `/admin/reviews`.

**Rutas viejas sin destino:** ninguna. No se movió ninguna URL; B5 solo añadió tres hubs. `/admin/blog/[postId]` no se probó porque el seed no crea artículos; se marca como no verificado.

Evidencia: `../../audit/b5/reports/inventory-prod.json`, `inventory-new.json`, `routes-prod.json`, `routes-new.json`.

---

## 3. Redirecciones

**No aplica 308 en B5.** El log de B5 dice: “No se movieron URLs: todo lo antiguo sigue funcionando y no hizo falta redirección”. La auditoría lo confirma:

- Las 16 rutas antiguas probadas responden **200** en producción y en la nueva; `/admin/blog/[postId]` queda no verificada.
- Los hubs nuevos son aditivos: 404 en producción, 200 en la nueva.
- No hay una ruta antigua que haya quedado sin destino.
- El único 404 encontrado es el esperado de los hubs nuevos en producción.

Si el equipo esperaba redirecciones, el diseño de B5 tendría que cambiar; tal como está implementado, no hay nada que redirigir.

---

## 4. Paridad funcional y clics

El menú viejo era plano: **14 ítems** en el sidebar/drawer. El nuevo tiene **5 secciones + Seguridad** (6 en sidebar/drawer; 5 en la barra inferior).

| Función | Ruta vieja | Sección nueva | Ruta nueva | Clics viejo | Clics nuevo | Delta |
|---|---|---|---:|---:|---:|
| Hoy / Resumen | `/admin` | Hoy | `/admin` | 0 | 0 | 0 |
| Alumnos | `/admin/alumnos` | Alumnos | `/admin/alumnos` | 1 | 1 | 0 |
| Detalles Alumno | `/admin/alumnos/detalle` | Alumnos | `/admin/alumnos/[id]` | 1 | 2 | **+1** |
| Inscripciones | `/admin/inscripciones` | Hoy / Alumnos | `/admin/inscripciones` | 1 | 1 (fila Hoy) / 2 (Alumnos) | 0 / +1 |
| Asistencia | `/admin/asistencia` | Operación | `/admin/operacion` → `/admin/asistencia` | 1 | 2 | **+1** |
| Balance | `/admin/balance` | Operación | `/admin/operacion` → `/admin/balance` | 1 | 2 | **+1** |
| Horarios | `/admin/horarios` | Configuración | `/admin/configuracion` → `/admin/horarios` | 1 | 2 | **+1** |
| Calendario | `/admin/calendario` | Configuración | `/admin/configuracion` → `/admin/calendario` | 1 | 2 | **+1** |
| Planes | `/admin/planes` | Configuración | `/admin/configuracion` → `/admin/planes` | 1 | 2 | **+1** |
| Grados y katas | `/admin/grados-y-katas` | Configuración | `/admin/configuracion` → `/admin/grados-y-katas` | 1 | 2 | **+1** |
| Mensajes | `/admin/mensajes` | Comunicación | `/admin/comunicacion` → `/admin/mensajes` | 1 | 2 | **+1** |
| Reseñas | `/admin/reviews` | Comunicación | `/admin/comunicacion` → `/admin/reviews` | 1 | 2 | **+1** |
| Blog | `/admin/blog` | Comunicación | `/admin/comunicacion` → `/admin/blog` | 1 | 2 | **+1** |
| Seguridad | `/admin/ajustes` | Global | `/admin/ajustes` | 1 | 1 (drawer) | 0 |
| Técnicas | dentro de Grados y katas | Configuración | `/admin/grados-y-katas` | 1–2 | 2–3 | **+1** |

**Ninguna función supera los 3 clics**, pero el criterio “>3” oculta la fricción real: **todos los hijos de un hub pasaron de 1 a 2 clics**. El dry-run de León sigue siendo necesario para decidir si eso es aceptable.

Los hubs tienen las tarjetas correctas:

- **Operación:** Asistencia y reposiciones; Balance de horas.
- **Configuración:** Horarios; Calendario; Planes; Grados y katas (incluye técnicas).
- **Comunicación:** Mensajes; Reseñas; Blog.

`Alumnos` conserva el acceso a `Inscripciones` en la cabecera (1 enlace). `Grados y katas` contiene técnicas. Evidencia: `../../audit/b5/reports/parity-prod.json`, `parity-new.json`.

### Navegación móvil

- Barra inferior: 5 ítems (`Hoy, Alumnos, Operación, Configuración, Comunicación`).
- Sidebar/drawer: 6 ítems (los 5 + `Seguridad`).
- A 375 px, **“Configuración” y “Comunicación” se truncan** (`Configurac…`, `Comunicac…`); el log ya lo anticipaba.
- Badges: `Hoy` = 1 (inscripciones pendientes), `Alumnos` = 5 (alumnos nuevos). No hay badge de documentos, justificaciones ni reposiciones.
- Sin scroll horizontal.

Evidencia: `parity-new.json` (`mobile.bottomLabels`, `mobile.badges`).

---

## 5. Bandeja “Hoy”

### 5.1 Contadores existentes

| Fila | UI | BD | Enlace | Destino |
|---|---:|---:|---|---|
| Inscripciones pendientes | 1 | 1 | `/admin/inscripciones` | 200; muestra “Pendiente A” |
| Documentos por revisar | 1 | 1 | `/admin/alumnos?docs=pending` | 200; muestra el documento pendiente |
| Alumnos sin plan | 3 | 3 | `/admin/alumnos` | 200, pero **sin filtro de plan** |
| Alumnos sin horario | 3 | 3 | `/admin/horarios` | 200, pero es la **gestión de horarios**, no la lista de alumnos |

Los cuatro contadores coinciden exactamente con SQL. Evidencia: `../../audit/b5/reports/hoy-admin-a.json`.

### 5.2 Lo que falta y lo que cuenta de más

- **Justificaciones:** la BD tiene **1 pendiente**, pero “Hoy” no tiene fila. Es un hallazgo **importante**: el dato existe y la página de Asistencia ya calcula `justificationsPending` en `getAdminAttendanceRoster`; el log dice que “no existe consulta”, lo cual es parcialmente inexacto.
- **Solicitudes de reposición:** no hay fila. Es la dependencia de **UX-A6**, que no está implementada; no hay modelo `RecoveryRequest`. Se documenta, no se cuenta como bug. La reposición online existente (1 programada) vive en la tab Reposiciones de Asistencia, no en “Hoy”.
- **“Sin plan” / “sin horario”:** los 3 nombres son:
  - `Sensei Tosei Gusoku` (owner/staff con expediente de alumno),
  - `Inactivo Auditoría` (status INACTIVE),
  - `Sin Plan Con Horario` / `Sin Horario Con Plan` (los casos de prueba).
  
  El contador no filtra `status: ACTIVE` ni excluye al staff. Es **importante**; el número no representa “alumnos activos sin plan/horario”. El dato viene del mismo `summary.pendingCases` que ya usaba producción, así que **no es una regresión de B5**, pero B5 lo convierte en una fila accionable y sigue siendo engañoso.

### 5.3 Destinos

- “Alumnos sin plan” → `/admin/alumnos`: la página lista a los 5 alumnos y solo tiene filtro de documentos, no de plan. El contador no es accionable.
- “Alumnos sin horario” → `/admin/horarios`: la página muestra grupos y franjas (“Adultos Noche”, “Niños Tarde”), no los alumnos sin horario. Tampoco es accionable.
- “Inscripciones” y “Documentos” sí llevan a la pantalla correcta.

Evidencia: `../../audit/b5/reports/hoy-admin-a.json`; capturas `../../audit/b5/screenshots/new/375/hoy-viewport.png`, `../../audit/b5/screenshots/new/375/alumnos-viewport.png`, `../../audit/b5/screenshots/new/375/configuracion-horarios-viewport.png`.

### 5.4 Segunda escuela

Con el admin B:

| Fila | UI B | BD B |
|---|---:|---:|
| Inscripciones | 1 | 1 |
| Documentos | 1 | 1 |
| Sin plan | 1 | 1 |
| Sin horario | 1 | 1 |
| Alumnos | 1 | 1 |

No aparece “Pendiente A”, “Sin Plan Con Horario” ni `documento-a.pdf`. La escuela A tampoco muestra datos de B. Evidencia: `../../audit/b5/reports/hoy-admin-b.json`.

---

## 6. Autorización e INV-06

### 6.1 Páginas nuevas

| Escenario | Resultado |
|---|---|
| Sin sesión (7 páginas) | **307** a `/login?callbackUrl=...` |
| Alumno, instructor o tutor (7 páginas × 3 roles) | HTTP inicial **200** (redirect de cliente) y URL final **`/no-autorizado`** |
| HTML inicial de esos 21 casos | **0** apariciones de datos del admin (inscripciones, documentos, alumnos, escuela B, owner) |
| Admin B en páginas de A | **0** datos de A en Hoy, Alumnos, Documentos, Asistencia, Horarios, ficha de Juan y API de alumnos |

La comprobación del HTML inicial es importante porque el redirect de rol es de cliente: el status inicial es 200, pero el cuerpo **no** contiene datos del otro rol ni de la otra escuela.

Evidencia: `../../audit/b5/reports/auth-pages.json`, `auth-inv06.json`.

### 6.2 Matriz de APIs

Se ejecutó una matriz negra ampliada con las rutas de `route-auth-matrix.test.ts` (sin modificar el test de la app):

| Rol | Resultado en 50 rutas de admin |
|---|---|
| Sin sesión | 403 |
| Alumno | 403 |
| Instructor | 403 |
| Tutor | 403 |
| Admin | 200 / 400 / 404; **nunca 403** |

**300 combinaciones, 0 no esperadas.** Evidencia: `../../audit/b5/reports/api-auth-matrix.json`.

La matriz de integración existente también pasó: **169 tests**. Pero solo prueba `STUDENT` como rol incorrecto para admin y no cubre las páginas nuevas. Por eso:

- Copia ampliada en `../../audit/b5/route-auth-matrix.extended.ts` (no ejecutada desde `audit/`).
- Propuesta de cambio aparte en `../../audit/b5/route-auth-matrix.proposed.md`.

---

## 7. Capturas

**39 PNG**: 15 de producción (5 páginas × 2 anchos + 5 viewport de 375) y 24 de la nueva (8 páginas × 2 anchos + 8 viewport de 375). Sin errores de consola.

| Documento | Producción | Nueva |
|---|---|---|
| Hoy | `prod/{375,1440}/hoy.png` | `new/{375,1440}/hoy.png` |
| Alumnos | `prod/{...}/alumnos.png` | `new/{...}/alumnos.png` |
| Operación | `prod/{...}/operacion-asistencia.png` | `new/{...}/operacion-hub.png` + `operacion-asistencia.png` |
| Configuración | `prod/{...}/configuracion-horarios.png` | `new/{...}/configuracion-hub.png` + `configuracion-horarios.png` |
| Comunicación | `prod/{...}/comunicacion-mensajes.png` | `new/{...}/comunicacion-hub.png` + `comunicacion-mensajes.png` |

Producción no tiene los hubs; se capturaron las pantallas hijas equivalentes. En 375 px se ve el truncamiento de “Configuración” y “Comunicación”, y la barra inferior de 5 ítems con badges. Evidencia: `../../audit/b5/reports/screenshots-prod.json`, `screenshots-new.json`.

---

## 8. No verificado

- **Dry-run de León** recorriendo sus tareas diarias; es el criterio real para decidir si algo quedó enterrado.
- **Revisión humana del diff de B5** (obligatoria).
- **Solicitudes de reposición (UX-A6):** no implementadas; no hay modelo ni contador.
- **Dispositivos reales y otros navegadores:** solo Chromium 1.64.1.
- **768 px:** la tarea pedía 375/1440; no se capturó 768.
- **Vercel/CDN:** se usó build de producción local, no el edge.
- **Datos reales de producción:** se usó una BD sembrada y fixtures.
- **Lector de pantalla/contraste:** no se midió WCAG completo.
- **`/admin/blog/[postId]`:** no se probó porque el seed no crea artículos.
- **Clic interno de “Técnicas”** dentro de Grados y Katas: se verificó que el contenido existe; no se midió un tab/clic separado.
- **Copia ampliada del test de integración:** no se ejecutó dentro de la app; sí se ejecutó la matriz negra equivalente.

---

## 9. Reproducción

`../../audit/b5/README.md` contiene worktrees, BD, env, seed, fixture, builds, servidores y limpieza.

Resumen:

1. Worktrees `../dojoapp-prod` (`08008ee`) y `../dojoapp-b5` (`f29fac9`).
2. PostgreSQL `55434/dojo_audit_b5`, migraciones, seed y fixture B5.
3. Build/start en `3110`/`3111` con integraciones externas vacías.
4. Specs `01`–`05` en `audit/b5/specs/`.
5. Informe en `nextfrontend/docs/auditoria-B5.md`.

Las capturas y JSON están en `audit/b5/` y están ignorados por su `.gitignore`; los scripts quedan locales para reproducir.

---

## 10. Archivos creados

| Ruta | Contenido |
|---|---|
| `audit/b5/README.md` | Entorno y comandos |
| `audit/b5/scripts/**` | Env, fixture, inventario de rutas |
| `audit/b5/specs/**` | Inventario, paridad, Hoy, auth, capturas |
| `audit/b5/reports/**` | Evidencia JSON y logs |
| `audit/b5/screenshots/**` | 39 capturas |
| `audit/b5/route-auth-matrix.extended.ts` | Copia ampliada de propuesta |
| `audit/b5/route-auth-matrix.proposed.md` | Cambio propuesto aparte |
| `nextfrontend/docs/auditoria-B5.md` | Este informe |

**No se modificó** código de la app, `route-auth-matrix.test.ts`, `.env.local`, la BD de desarrollo ni `omaskuchen-db`.

---

## 11. Recomendaciones

1. **B5-01:** añadir la fila de justificaciones usando el agregado que ya existe en `getAdminAttendanceRoster` o una consulta de conteo dedicada.
2. **B5-02:** mantener reposiciones como dependencia de A6; no inventar un contador hasta que exista el modelo.
3. **B5-03:** filtrar “sin plan” y “sin horario” por alumnos activos y excluir staff/owner; o renombrar la fila a “expedientes sin plan/horario”.
4. **B5-04:** hacer las filas accionables: `?plan=none` y `?schedule=none` en Alumnos, o una pantalla específica; no enviar “sin horario” a la gestión de horarios.
5. **B5-05:** ampliar `route-auth-matrix.test.ts` con `INSTRUCTOR`/`GUARDIAN` y añadir la matriz de páginas; la copia y el parche están en `audit/b5/`.
6. **B5-06:** decidir si `Seguridad` es un 6.º ítem o va dentro de Perfil; acortar “Config.”/“Comunic.” o permitir dos líneas; decidir si se añaden badges de documentos/justificaciones/reposiciones.
7. **Dry-run:** hacerlo antes de mergear; la auditoría no puede sustituirlo.
8. **Redirecciones:** no añadir 308 en B5; las URLs no se movieron y todas las viejas están en 200.
