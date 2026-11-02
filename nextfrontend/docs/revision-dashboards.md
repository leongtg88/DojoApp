# Revisión de dashboards · admin, estudiante e instructor

- **Fecha:** revisión 2026-10-30; verificación y merge 2026-11-02.
- **Alcance:** revisión de UX y *correctness* del interior funcional de los tres paneles. No es una auditoría de navegación (eso ya lo cubrieron B1 y B5).
- **Dónde vive:** ya integrado en `main` (la rama `fix/revision-dashboards` quedó fusionada). Base anterior: `4d3acff`.
- **Commits:** `96e5f9f` (C-0), `0361529` (seguridad), `0890845` (fechas), `618db03` (este documento), `57906d7` (arreglo de typecheck).
- **Estado:** implementado y **verificado en verde** — lint, typecheck, 315/315 unit+component y 416/416 integración (ver sección 4). Quedan pendientes los tests por hallazgo (sección 5), el backlog menor (sección 6) y las decisiones de negocio (sección 8).

---

## 1. Qué es este documento

Es el punto de entrada para retomar este trabajo en una sesión nueva, sin contexto previo. Resume qué se corrigió, cómo se verificó, qué falta y en qué orden conviene atacarlo.

**Qué NO repite:** los hallazgos de `auditoria-B1.md` (navegación del alumno) y `auditoria-B5.md` (menú del admin) que **ya están corregidos en `main`**: redirecciones 308 reales, notificaciones del tutor, enlaces de técnicas a Entrenar, fila de justificaciones en "Hoy", conteo de "sin plan/horario" con `excludeFromPendingCounts` y etiquetas móviles. Lo que sigue abierto de esas auditorías está en la sección 9.

Los hallazgos nuevos salieron de revisar el código que las auditorías de navegación no tocaron: `student-queries.ts`, `admin-queries.ts`, `instructor-queries.ts`, las rutas de API de los tres paneles y sus componentes.

---

## 2. Ya corregido en esta rama

| ID | Hallazgo | Qué fallaba | Archivo principal | Commit |
|---|---|---|---|---|
| **C-0** | Fuga entre escuelas al asignar técnicas (instructor) | La ruta leía `instructor.schoolId` del perfil y lo aplicaba condicionalmente; con `schoolId = null` el filtro desaparecía y el `findFirst` de `student` alcanzaba a cualquier alumno ACTIVE de otra escuela. Era la única ruta del instructor que filtraba escuela a mano. | `app/api/dashboard/instructor/techniques/assign/route.ts` | `96e5f9f` |
| **I-1** | CSRF inconsistente (transversal) | `isSameOrigin` solo estaba en las rutas de asistencia. Las demás mutaciones de los tres paneles —incluido el `DELETE` en cascada de alumno— dependían solo de la cookie `SameSite=Lax`. | 19 rutas de `app/api/dashboard/**` | `0361529` |
| **I-3** | Opt-in de WhatsApp del tutor contaminado | `setWhatsAppOptIn` usaba siempre el usuario de la sesión con el teléfono del hijo: un tutor con varios hijos sobrescribía su propio `WhatsAppContact` en cada guardado. | `app/api/dashboard/student/profile/route.ts`, `components/dashboard/student/EditProfileModal.tsx` | `0361529` |
| **I-4** | Identidad del menor editable desde el servidor | El modo restringido era solo de cliente; un `PATCH` manual con `X-Student-Id` cambiaba `firstName`/`dateOfBirth` del menor. | `app/api/dashboard/student/profile/route.ts`, `lib/family/guardians.ts` | `0361529` |
| **I-5** | Práctica por técnica sin límites | Aceptaba hasta `100_000` repeticiones por llamada, sin `consumeRateLimit` ni tope diario (el endpoint masivo sí los tenía). | `app/api/dashboard/student/techniques/[techniqueId]/practice/route.ts` | `0361529` |
| **I-2** | Fecha de examen con un día de desfase | `GradoProgress` tenía un `formatDate` propio con `toLocaleDateString` **sin `timeZone`** y `ExaminationCriteriaCard` formateaba como instante una fecha de calendario: un examen del sábado 5 se mostraba como viernes 4. | `components/dashboard/dojo/GradoProgress.tsx`, `components/dashboard/student/ExaminationCriteriaCard.tsx` | `0890845` |
| **I-6** | Balance: mes calculado en UTC | Entre las 20:00 y 23:59 AST del último día del mes, el reporte ya mostraba el mes siguiente (vacío) y perdía las horas de esa noche. | `lib/dashboard/balance.ts`, `lib/dashboard/admin-queries.ts` | `0890845` |
| **I-7** | `confirm-all` filtraba por día UTC | Un punch-in de las 21:00 locales caía fuera de la ventana y no se confirmaba. | `app/api/dashboard/instructor/attendance/confirm-all/route.ts` | `0890845` |

**Cambio de API interna a tener presente:** `resolveStudentView()` y `resolveRequestStudent()` (`lib/family/guardians.ts`) ahora devuelven `{ studentId, isSelf }`. El campo `isSelf` es lo que habilita el modo restringido en servidor (I-4) y evita la contaminación del opt-in (I-3). Es un cambio aditivo, pero rompe cualquier aserción con `toEqual({ studentId })`.

**Helper nuevo:** `santoDomingoMonthRange()` en `lib/dashboard/balance.ts` calcula el mes natural en la zona del dojo y lo devuelve como instantes UTC. `monthRange()` se mantuvo intacto porque lo usan `student-queries.ts` y un test.

---

## 3. Nota sobre el commit de C-0

`96e5f9f` incluye también el guard `isSameOrigin` de I-1 para ese handler: vive en el mismo archivo y no era separable sin staging interactivo (`git add -p` no está disponible en el entorno de agente). Por eso ese commit toca 1 archivo con dos arreglos.

---

## 4. Verificación · ejecutada y en verde (2026-11-02)

| Suite | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | 0 errores, 35 warnings (los preexistentes; no se añadió ninguno) |
| Typecheck | `pnpm typecheck` | Limpio |
| Unit + component | `pnpm test` | **315 / 315** ✅ (66 archivos) |
| Integración | `pnpm test:integration` | **416 / 416** ✅ (45 archivos, ~20 min) |

Se ejecutó la suite **completa**, no un subconjunto. Los tres archivos de test que se habían editado a mano pasan: `tests/unit/family-guardians.test.ts` (contrato `isSelf`), `tests/component/edit-profile-modal.test.tsx` (no se envía `whatsappOptIn` en modo restringido) y `tests/integration/admin-curriculum.test.ts`.

**Un flake conocido, no una regresión.** En la primera corrida falló `webauthn-routes.test.ts > rechaza si el desafío no corresponde (400)` con `Hook timed out in 30000ms` en el `beforeEach` que llama a `resetDb()`. No es una aserción: la base tardó más de 30 s en resetearse porque había tres procesos de test solapados en la máquina. Al ejecutar ese archivo solo pasa 25/25 en 94 s (frente a 349 s bajo contención). WebAuthn no fue modificado por esta revisión. Si reaparece, correr ese archivo aislado antes de investigarlo.

**Regresión que sí hubo y cómo se detectó.** El guard CSRF obligó a cambiar la firma de `apply-curriculum/route.ts` de `POST()` a `POST(request: Request)`, pero el test de integración seguía llamándolo sin argumentos. Eso rompió el typecheck y **tumbó el build de Vercel** (TS2554 en `admin-curriculum.test.ts:177,193`). Arreglado en `57906d7`. Lección: al añadir un parámetro a un handler hay que buscar sus llamadas en `tests/` (`grep -rE "\.(POST|PATCH|PUT|DELETE)\(\)" tests/`).

**Lo que la suite NO puede verificar.** Todos los tests construyen peticiones **sin header `Origin`**, e `isSameOrigin` permite las peticiones sin ese header. Es decir: el guard CSRF nunca se ejercita de verdad. En un navegador real sí llega `Origin` y el guard compara su host contra el header `Host`; si en producción no coincidieran (dominio propio vs. `vercel.app`, un proxy delante), **toda mutación devolvería 403 `BAD_ORIGIN`**. Mitigante: ese mismo guard ya llevaba tiempo en producción en las cuatro rutas de `attendance/*`, así que el mecanismo está probado en ese entorno. Aun así, tras cada despliegue conviene abrir el dashboard y guardar algo (un perfil, un plan) para confirmarlo.

**Nota de mantenimiento.** El rate-limit de I-5 comparte las claves `technique-practice:ip:*` y `technique-practice:student:*` con el endpoint masivo. En los tests, `getClientIp` sobre un `Request` sin cabeceras devuelve siempre la misma clave, así que si alguna vez se añaden tests que llamen al `POST` por técnica, un orden desfavorable podría agotar el presupuesto por IP.

---

## 5. Tests que faltan escribir

La convención del repo es un `describe` con el ID del hallazgo. Solo se actualizaron tests existentes; **ninguno de estos ocho se escribió**:

| ID | Test |
|---|---|
| C-0 | Un instructor de la escuela A no puede asignar técnicas a un alumno de B, tampoco con `User.schoolId = null` |
| I-1 | 403 `BAD_ORIGIN` con `Origin` cruzado en mutaciones de los tres paneles |
| I-3 | El opt-in de WhatsApp del tutor no cambia al editar el expediente de un hijo |
| I-4 | Un tutor recibe 403 al enviar campos de identidad del menor |
| I-5 | 429 al superar el tope diario y al agotar el rate-limit por alumno en la ruta por técnica |
| I-2 | La fecha de examen es estable con `TZ=UTC` (no se corre un día) |
| I-6 | El balance del último día de mes a las 22:00 AST cae en el mes correcto |
| I-7 | `confirm-all` confirma un punch de las 21:00 locales del día indicado |

---

## 6. Pendiente · backlog menor (M-1 … M-13)

| ID | Severidad | Dónde | Problema | Corrección sugerida |
|---|---|---|---|---|
| **M-1** | Menor | `components/dashboard/shell/MobileDashboardSidebar.tsx:86,106,123,132`; `StudentPracticeLog.tsx:92-121`; `StudentAbsenceReport.tsx:268-269` | Objetivos táctiles por debajo de 44 px: botón cerrar `size-9` (36 px), ítems `py-2.5` (≈40 px), stepper `size-7` (28 px), borrar (≈26 px). La barra inferior sí cumple (56 px). **Es el mismo B1-07 de la auditoría B1, que seguía abierto.** | Subir el alto efectivo a ≥44 px (`py-3` / `min-h-11`, cerrar con `size-11`) |
| **M-2** | Menor | `components/dashboard/student/EditProfileModal.tsx:80-100` | `role="dialog"` sin focus-trap, sin foco inicial, sin cierre con `Esc`, sin `aria-labelledby` y sin cierre por backdrop | Añadir las cuatro cosas; el drawer ya cierra por backdrop y sirve de referencia |
| **M-3** | Menor | `StudentPracticeLog.tsx:236,265,283`; `AdminReviews.tsx:56,78`; `AdminSchedules.tsx:147`; `AdminPlans.tsx:121` | Errores con `alert()` nativo, inconsistente con los banners inline del resto | Unificar en banners inline / toast |
| **M-4** | Menor | `app/api/dashboard/admin/students/[studentId]/placement/route.ts:93-97` | `planStartDate` por defecto guarda `new Date()` (un instante) en un campo que se lee como fecha de calendario; fijarlo de noche muestra el día siguiente | Normalizar a medianoche UTC del día de calendario |
| **M-5** | Menor | `lib/dashboard/admin-queries.ts:1040` | `getAdminUpcomingBirthdays` consulta `beltRank` **sin scope**: el mapa nombre→grado abarca todas las escuelas y un nombre repetido puede mostrar el `kyuDan` de otra. No es fuga de PII, es una etiqueta errónea | Filtrar por scope y resolver por programa |
| **M-6** | Menor | `app/api/dashboard/admin/students/assign-techniques/route.ts:79-91` | Crea `studentTechnique` inline en vez de usar `lib/dashboard/technique-assign.ts` (el bulk sí lo usa). Hoy es seguro (`skipDuplicates`, re-scopea) pero diverge del invariante | Delegar en `assignTechniquesToStudentGroup` |
| **M-7** | Menor | `components/dashboard/admin/AdminBalance.tsx:43-66` | Export CSV sin escapar comillas internas y sin guardia de inyección de fórmulas (`= + - @`) | Duplicar `"` → `""` y prefijar esas celdas |
| **M-8** | Menor | `components/dashboard/admin/AdminBalance.tsx:186-190` | Muestra "Sin resultados con los filtros" aunque la escuela no tenga alumnos | Distinguir `rows.length === 0` (onboarding) de `filtered.length === 0` |
| **M-9** | Menor | `lib/dashboard/student-queries.ts:846` | `requiredHours` del cuatrimestre en curso usa `monthsCovered` hasta un `block.end` futuro, así que exige los 4 meses completos a mitad del bloque. La elegibilidad real sí prorratea (`:962`) | Prorratear la tarjeta hasta `min(block.end, hoy)` |
| **M-10** | Menor | `app/(dashboard)/layout.tsx:22` | `[session.user.roles[0]]` sobre un array vacío produce `[undefined]` | `roles = session.user.roles ?? []` y derivar `primaryRole` con guard |
| **M-11** | Menor | `app/(dashboard)/instructor/asistencia/page.tsx:3`; `components/dashboard/instructor/InstructorAttendanceBoard.tsx` | El tablero está **desconectado** (import comentado): es código muerto. Si se reactiva arrastra fechas en UTC (`:41,56-58`), `alert()` (`:75`), contadores sobre `data.records` capado a `take:200` etiquetados como "histórico" (`:64,168`) y un badge "Fuera de horario" sobre un campo que la query no devuelve (`:273` vs `instructor-queries.ts:316-342`) | Decidir: eliminarlo o repararlo y reconectarlo |
| **M-12** | Menor | `app/api/dashboard/instructor/attendance/confirm-all/route.ts` | `findMany(status: PENDING)` y luego `updateMany` **sin** re-exigir `status: 'PENDING'`: dos peticiones concurrentes re-disparan `notifyAssignment` | Añadir `status: 'PENDING'` al `where` y notificar según su `count`, como `completeOnlineRecovery` (`lib/dashboard/online-recovery.ts:447-452`) |
| **M-13** | Menor | `app/api/dashboard/instructor/attendance/[attendanceId]/route.ts:64-70` vs `confirm-all` | Criterio de pertenencia distinto: el PATCH individual exige matrícula ACTIVE y `confirm-all` acepta además `class.instructorId`. Un punch confirmable en masa puede no ser editable (403). Re-confirmar un CONFIRMED también re-notifica (`:104-110`) | Unificar el criterio |

---

## 7. Pendiente · a verificar antes de decidir (V-1 … V-3)

Son sospechas, no bugs confirmados. Conviene reproducirlas con `TZ=UTC`.

- **V-1 · Elegibilidad de examen con datos vacíos.** `lib/dashboard/student-queries.ts:1050-1060`: si `applicableMetrics` queda vacío, `every` sobre vacío devuelve `true` y con `nextRank != null` el alumno sale elegible. En el caso normal la permanencia (`minMonths > 0`) lo impide. Confirmar que ningún grado real combine `minMonths = 0`, 0 katas y plan ilimitado.
- **V-2 · Mezcla de clave UTC y clave RD al atribuir el mes.** `student-queries.ts:1011-1027` usa `toDateKey` (hora del servidor) mientras `absence-policy.ts:80` indexa con `santoDomingoDayKey`. Cerca de la medianoche de fin de mes una asistencia puede caer en meses distintos según el lado. Unificar a clave RD.
- **V-3 · Kata aprobada sin `approvedAt`.** `student-queries.ts:826-830` usa `(approvedAt ?? today)`, así que no cuenta en cuatrimestres cerrados y sí en los futuros. Depende de la calidad de los datos.

---

## 8. Preguntas abiertas · decisión de negocio

No se codificaron por ser decisiones del dojo, no del código.

1. **¿Qué significa el % de asistencia?** Hoy es `confirmadas de por vida / 30`, tanto en admin (`admin-queries.ts:216-223,627-628`) como en instructor (`instructor-queries.ts:184`), así que cualquier alumno veterano queda clavado en 100 %. ¿Debe ser mensual o sobre una ventana, o es intencional como "progreso hacia 30"? Decidir una vez y aplicar a ambos paneles.
2. **¿Reordenar y aplicar currículo es solo de SUPERADMIN?** Hoy un SCHOOL_ADMIN puede hacerlo sobre sus propios grados (`belt-ranks/reorder/route.ts`, `belt-ranks/apply-curriculum/route.ts`), y el alcance por escuela está bien resuelto. Si la regla es solo-SUPERADMIN, falta el gate `scope.isSuperAdmin`.
3. **El 6.º ítem "Seguridad" de la navegación** (B1-06 / B5-06): ¿se queda como destino aparte o se integra en Perfil? Hoy el sidebar y el drawer tienen 6 ítems, no los 5 que pide la guía.
4. **Rutas documentadas que no existen** (B1-08): `/estudiante/entrenar/katas` y `/practica` figuran en la guía y responden 404. ¿Se implementan o se corrige la documentación?
5. **Operación de datos (solo León).** Ver sección 9.

---

## 9. Heredado de auditorías anteriores y de operación

No forma parte de esta revisión, pero sigue abierto y conviene tenerlo a la vista:

- **B1-06** · 6.º ítem de navegación (es la pregunta 3).
- **B1-07** · objetivos táctiles de 40 px en el drawer — **confirmado que sigue abierto**; se registra aquí como M-1.
- **B1-08** · rutas documentadas inexistentes (es la pregunta 4).
- **B1-09** · las redirecciones por rol son de cliente: el HTTP inicial es 200 y el cambio a `/no-autorizado` ocurre por JavaScript. `proxy.ts` solo valida sesión, no rol. No se observó fuga de datos en el HTML inicial.
- **B5-05** · `tests/integration/route-auth-matrix.test.ts` solo prueba `STUDENT` como rol incorrecto para las rutas de admin. Falta cubrir `INSTRUCTOR` y `GUARDIAN` y añadir la matriz de páginas. Hay una propuesta en `audit/b5/route-auth-matrix.proposed.md`.
- **Operación (solo León, nunca el agente):**
  - `excludeFromPendingCounts` sigue en **0 de 14**: falta el `UPDATE` que marca al sensei, y hace falta confirmar antes su correo/ID real. El SQL preparado está en `docs/ux-reorganizacion-log.md`.
  - No hay interruptor en la UI de admin para ese flag, y al owner solo lo marca el seed; convendría marcarlo en el alta de escuela.
  - El pipeline de migraciones de Vercel quedó en `pnpm build` tras el post-mortem del 2026-10-29: las migraciones se aplican a mano y se verifican **antes** de desplegar el código que las usa.
  - **Gate 1** (prueba de usabilidad con usuarios reales) sigue sin ejecutarse; el guion está en `docs/gate-1-guion.md`.

---

## 10. Plan de arreglo para la próxima sesión

### Fase A · Verificar lo ya hecho — ✅ hecha el 2026-11-02
`pnpm check` y `pnpm test:integration` ejecutados y en verde (sección 4). Queda solo su punto 4: **escribir los ocho tests de la sección 5**, con el ID del hallazgo en el `describe`. Es lo que cierra de verdad esta fase, porque hoy los arreglos pasan la suite pero ninguno tiene un test que falle si se revierten.

### Fase B · Decisiones
Resolver las cinco preguntas de la sección 8. Solo después codificar lo que dependa de ellas (sobre todo la 1 y la 2).

### Fase C · Backlog agrupado, un commit por grupo
- **C1 · Accesibilidad y UX:** M-1, M-2, M-3, M-8.
- **C2 · Correctness de datos:** M-4, M-5, M-9, M-10.
- **C3 · Instructor:** M-11 (decidir primero), M-12, M-13.
- **C4 · Invariantes y seguridad:** M-6, M-7.

### Fase D · Reproducir las dudas
V-1, V-2 y V-3 con `TZ=UTC`; decidir si son bugs y, si lo son, arreglarlos.

### Fase E · Operación — solo León
El `UPDATE` del sensei y el pipeline de migraciones de Vercel (sección 9).

---

## 11. Reglas del proyecto a respetar

Resumen de `AGENTS.md`, por si la sesión nueva no lo ha leído todavía (conviene leerlo entero igualmente):

- **Nadie mueve `main` salvo León.** El agente no hace push, PR, merge ni despliegue sin instrucción explícita en esa sesión.
- **Nada contra producción:** ni migraciones, ni SQL, ni cambios de configuración. Antes de cualquier `prisma migrate`, comprobar que `DATABASE_URL` y `DIRECT_URL` apuntan a `localhost`.
- **Nunca leer ni editar `.env*`** (salvo `.env.example`).
- **Migraciones solo aditivas.** Los seeds no borran datos de alumnos.
- **Una tarea por sesión**, diff pequeño, plan previo, y el ID del hallazgo en el `describe` de los tests.
- Los invariantes de dominio (fechas de calendario vs instante, grado por programa, katas solo vía `StudentTechnique`, alcance por escuela con los helpers) están en `docs/domain/`.

---

## 12. Cómo retomar

```bash
git checkout main
git log --oneline -5          # 57906d7, 618db03, 0890845, 0361529, 96e5f9f
cd nextfrontend
pnpm install                  # node_modules no se versiona
pnpm check                    # lint + typecheck + unit + component (~90 s)
pnpm test:integration         # necesita Docker Desktop arrancado (~20 min, en serie)
```

Detalles útiles al correr la suite:

- Los tests de integración usan **testcontainers**: la primera vez descargan `postgres:16-alpine` (420 MB) y `testcontainers/ryuk`, lo que añade varios minutos. Si `docker ps` no muestra el Postgres, probablemente aún esté descargando.
- `vitest.integration.config.mts` fija `fileParallelism: false`, así que los 45 archivos corren **en serie**. Es deliberado (aislamiento por archivo) y por eso tarda ~20 min.
- Para filtrar archivos, invocar vitest directamente: `pnpm exec vitest run --config vitest.integration.config.mts tests/integration/<archivo>`. Usar `pnpm test:integration -- <archivo>` **no** filtra: el `--` llega como argumento literal y se acaba corriendo todo.

Qué leer primero, en este orden: la sección 4 (qué está verificado y qué no), la 5 (tests que faltan), `AGENTS.md` y `docs/domain/invariantes.md`.
