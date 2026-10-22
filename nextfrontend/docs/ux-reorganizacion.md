# GUÍA DE REORGANIZACIÓN UX/UI — DojoApp (Tosei Gusoku) · v2

> Documento para el agente de código (OpenCode). Léelo completo al iniciar cada sesión.
> Guárdalo en `nextfrontend/docs/ux-reorganizacion.md` y refiérelo desde `AGENTS.md`.
> Este documento es la **guía** (reglas y tareas). Los resultados de cada tarea (línea base, cierres, decisiones) se registran en **`docs/ux-reorganizacion-log.md`**, no aquí.

---

## 0. CÓMO USAR ESTE DOCUMENTO

1. **Una tarea por sesión.** Cada tarea tiene un ID (`UX-A5a`, `UX-B3`…). Trabaja solo la que te asignen.
2. **Antes de escribir código:** lee las secciones 1 a 6 y la tarea. Luego **muestra un plan corto** (archivos que vas a tocar, pasos, pruebas) y espera confirmación si la tarea toca BD, rutas o seguridad.
3. **No inventes rutas, archivos ni nombres.** Verifica siempre con `grep`/`find`/lectura del archivo. Si un nombre de este documento no existe en el repo, dilo y propón el equivalente real.
4. **Diff pequeño.** Máximo ~400 líneas cambiadas por tarea (**~550** en las tareas estructurales B1, B5, B7 y B8, porque incluyen actualización de tests). Si la tarea es más grande, divídela y avisa.
5. **Al terminar:** ejecuta los comandos de la sección 4, reporta el resultado y agrega una entrada en `docs/ux-reorganizacion-log.md`. Un commit por tarea: `ux(A5a): función getPrimaryAction`.
6. **Si algo es ambiguo, pregunta.** No asumas. Mejor una pregunta concreta que un rediseño equivocado.
7. **Revisión humana obligatoria** (León revisa el diff a mano, además de las pruebas) en las tareas que tocan BD, rutas autorizadas o enlaces en producción: **UX-A6, UX-A7a, UX-B1, UX-B5, UX-B7**. En esas tareas, no hagas merge sin aprobación.

---

## 1. CONTEXTO DEL PROYECTO

**DojoApp** es la plataforma de gestión de Tosei Gusoku (karate, Santo Domingo, República Dominicana), parte de la federación Inoue Ha.

- Stack: Next.js (App Router) en `nextfrontend/`, TypeScript, Tailwind, Prisma + PostgreSQL, pnpm.
- Tests: Vitest (unit, component, integration con Postgres vía testcontainers), Playwright (E2E).
- Roles: `STUDENT` (alumno), `GUARDIAN` (tutor, ve a sus hijos), instructor, admin de escuela, superadmin.
- Portales: `app/(dashboard)/estudiante/**`, `app/(dashboard)/instructor/**`, `app/(dashboard)/admin/**`.
- Idioma de toda la interfaz: **español (RD)**. Zona horaria de negocio: Santo Domingo.

### Fuera de alcance (NO tocar)

- `components/dashboard/tosei-gusoku-dojo---sistema-de-seguimiento-marcial-/` (prototipos no conectados).
- `InstructorAttendanceBoard.tsx` (código muerto).
- Colores, tipografías y tokens visuales actuales: **la identidad visual ya está definida; no la cambies ni introduzcas paletas nuevas.** Usa las clases/tokens existentes.
- Tienda, facturación, ranking y videos: **todavía no se implementan** (ver sección 9). Solo se deja el espacio en la navegación.

---

## 2. PRINCIPIOS DE DISEÑO (reglas de decisión)

Si dudas entre dos opciones, aplica estas reglas en orden:

1. **Organizar por lo que la persona quiere hacer, no por tabla de la BD.** Una pantalla = una tarea. No crear "una pantalla más por entidad".
2. **Una acción primaria por pantalla.** Un solo botón dominante; los demás son secundarios. En pantallas públicas, **un** CTA primario.
3. **El contenido vive donde se necesita** (ej. el tutorial de una kata aparece como botón en esa kata, no solo en una sección aislada).
4. **Defaults rápidos antes que opciones.** (ej. "Marcar todos presentes" y desmarcar excepciones.)
5. **Nada que prometa lo que el sistema no cumple.** Si una acción solo crea una solicitud, el texto debe decir "Solicitar" y mostrar el estado "En revisión".
6. **Todo estado vacío tiene una acción.** Nunca "No hay datos" a secas.
7. **Un solo componente por patrón.** Un solo modal de confirmación, un solo selector familiar, un solo asistente de asignación.

---

## 3. REGLAS DE IMPLEMENTACIÓN (obligatorias)

### 3.1 Interfaz y accesibilidad
- Mobile first; también debe verse bien en desktop. Tablas con scroll horizontal en móvil.
- Objetivos táctiles **mínimo 44×44 px** en acciones principales (en el tatami y en móvil).
- Contraste mínimo 4.5:1 con los colores ya existentes. Si un color existente no cumple, repórtalo; no lo cambies por tu cuenta.
- Etiquetas accesibles: `getByRole`/`getByLabelText` deben funcionar. Usa `aria-label`, `<label>` y foco visible. Navegación por teclado en modales (foco atrapado, `Esc` cierra, **el foco vuelve al elemento que abrió el modal**).
- Estados de carga con **skeleton**, éxito/error con **toast** (`aria-live`), acciones destructivas con **`ConfirmModal`** (nunca `window.confirm`).
- La verificación **responsive** (375 px, 768 px, 1440 px) se hace en Playwright o a mano; **no** se prueba en jsdom porque no calcula layout.

### 3.2 Copy y tono
- Español claro, **tuteo**, frases cortas (CTAs de máximo ~12 palabras).
- Verbos de acción concretos en botones: "Registrar", "Solicitar", "Guardar", no "Enviar" ni "Aceptar" genéricos.
- Sin tecnicismos de sistema: "expediente" solo donde el contexto lo pida (admin/instructor), para el alumno "tu perfil" o "tu progreso".
- Usa el glosario (sección 5) y las constantes de `lib/ui/copy.ts` (UX-01). No escribas textos repetidos "a mano" en varios componentes.

### 3.3 Código
- Reutiliza componentes existentes antes de crear nuevos. Busca primero en `components/` (incluido cualquier `<Tabs>` existente).
- No agregues librerías. Si es imprescindible, **pregunta** y verifica que sea gratuita y de licencia permisiva (MIT/Apache).
- No dejes código muerto ni `TODO` sin dueño. No dejes `console.log`.
- TypeScript estricto: sin `any` nuevos.

### 3.4 Base de datos y seguridad
- **Migraciones solo aditivas** (tablas/columnas nuevas, nullable o con default). Nunca borrar ni renombrar columnas existentes sin aprobación explícita.
- **INV-04:** los seeds no borran datos.
- Toda ruta de API nueva debe: (a) exigir sesión y rol explícito (401/403, no 404), (b) validar el cuerpo con Zod, (c) comprobar mismo origen en mutaciones (`isSameOrigin` / `sameOriginResponse`), (d) usar `scopeSchoolFilter` para aislar por escuela (**INV-06**), (e) tener rate-limit si es una escritura del alumno.
- Nunca confiar en un `userId`/`studentId`/`schoolId` enviado por el cliente: se derivan de la sesión o se verifican contra el alcance del usuario (incluida la vista familiar `X-Student-Id`, que debe validarse contra los hijos del tutor).
- No registrar datos personales en logs ni en eventos de analítica.
- Consultas siempre vía Prisma (parametrizadas). Nada de SQL concatenado.
- **Menores de edad:** ninguna funcionalidad social/pública (ranking, fotos) sin consentimiento del tutor.

### 3.5 Invariantes de dominio (no romper)
| ID | Regla |
|---|---|
| INV-01 | Fechas calendario en UTC; usar `formatCalendarDate` (no restar un día). |
| INV-02 | Grado por programa (ADULT/YOUTH); usar `pickStudentRank`. |
| INV-03 | Las katas del expediente se asignan por **una sola puerta**; las asignaciones **solo agregan**, nunca borran revisadas/aprobadas. |
| INV-04 | Los seeds no borran datos. |
| INV-05 | Reglas CSS globales dentro de `@layer`. |
| INV-06 | Todo aislado por escuela/sucursal con `scopeSchoolFilter`. |
| INV-07 | "Próximo grado" tiene fuente única. |

---

## 4. VERIFICACIÓN (al final de CADA tarea)

```bash
pnpm lint
pnpm typecheck
pnpm test                 # unit + component
pnpm test:integration     # requiere Docker; obligatorio si tocaste API o BD
pnpm test:e2e             # solo si se indica en la tarea
```

Reglas de pruebas:
- Los tests existentes **deben seguir en verde**. Si un cambio de ruta/texto rompe un test legítimo, actualiza el test y explica por qué (en las tareas estructurales esto puede ser ~30 % del esfuerzo: es esperado).
- Nombres de test con prefijo de la tarea: `UX-A5a · ...` y, si aplica, el invariante: `INV-06 · ...`.
- Integración: `beforeEach(resetDb)`, mock de notificaciones con `vi.mock('@/lib/notifications/create', …)`.
- Toda ruta nueva se agrega a `tests/integration/route-auth-matrix.test.ts` (sin sesión → 401/403; rol incorrecto → 403).
- Componentes: Testing Library, `getByRole`.
- Al terminar cada fase, actualiza el documento del plan de pruebas con una línea por tarea.

---

## 5. GLOSARIO ÚNICO (usar en toda la UI)

| Usar | No usar | Significado |
|---|---|---|
| **Reposición** | recuperación, recuperar | Clase que sustituye una falta. |
| **Falta por reponer** | falta pendiente | Falta (justificada o no) que aún no se repone. |
| **Reposición online** | clase virtual | Clase de 35 min agendada por administración. |
| **Reposición presencial** | recuperación, recuperar (clase) | Asistir a otra clase distinta a la propia. |
| **Reportar inasistencia** | avisar falta | El alumno informa que no podrá asistir. |
| **Pase de lista** | asistencia (cuando es la acción) | Marcar quién asistió a una clase. |
| **Expediente** | ficha, perfil del alumno (en admin) | Registro completo del alumno. |
| **Solicitar** | pedir, reservar (si requiere aprobación) | Acción que crea una solicitud revisable. |

Estados visibles al alumno: `Por reponer` → `En revisión` → `Programada` → `Repuesta`; terminales o de retorno: `Repuesta por otra vía`, `Cancelada`, `No asististe`. (Reglas de transición en UX-A6.)

### 5.1 Convención de eventos de analítica
- Nombres en **`snake_case`**, en español, `verbo_objeto` o `view_pantalla`. Sin versión en el nombre.
- Pasos numerados con **base 1**: `inscripcion_paso_1` … `inscripcion_paso_4`.
- **Lista canónica (lista blanca del endpoint):** `view_inicio`, `click_primary_action`, `click_solicitar_reposicion`, `reposicion_solicitada`, `registro_repeticiones`, `reporte_inasistencia`, `pase_de_lista_completado`, `view_syllabus`, `inscripcion_paso_1`, `inscripcion_paso_2`, `inscripcion_paso_3`, `inscripcion_paso_4`, `inscripcion_abandono`.
- Agregar un evento nuevo = editar la lista blanca y este documento en el mismo commit.

---

## 6. DECISIONES YA TOMADAS

1. **Navegación del alumno: 5 destinos fijos.** `Inicio · Entrenar · Clases · Progreso · Perfil`. Los nombres se validarán con usuarios reales; viven en constantes (UX-01).
2. **Admin: 5 secciones.** `Hoy · Alumnos · Operación · Configuración · Comunicación` (+ `Finanzas` reservada, oculta hasta que exista el módulo).
3. **Instructor: modo tatami.** Abre directo en la clase de hoy o la próxima; "Marcar todos presentes" es la acción principal.
4. **Una sola herramienta de asignación de técnicas** con pestañas Grado / Alumno / Grupo (solo agrega).
5. **Contenido educativo contextual:** cada kata/técnica del syllabus tendrá botón "Ver tutorial" cuando exista video. La sección Academia será solo la vista agregada.
6. **Gamificación en capas:** (1) siempre: racha personal, progreso de cinturón y logros, sin competir; (2) opt-in: ranking de clase; (3) opt-in futuro: ranking de escuela. Nunca ranking con menores sin consentimiento del tutor.
7. **Rutas viejas:** al mover una ruta se deja **redirección permanente** (no temporal). Los enlaces de correos, WhatsApp y notificaciones viven para siempre.

---

## 7. FASES Y TAREAS

Cada fase tiene **puertas (gates)** que deben cumplirse antes de empezar ciertas tareas.

### FASE 0 — Preparación

#### UX-00 · Línea base
- **Objetivo:** confirmar que el repo está sano antes de cambiar nada.
- **Pasos:** crear rama `ux/reorganizacion`; crear `docs/ux-reorganizacion-log.md`; ejecutar la sección 4 completa; registrar el resultado (nº de archivos y tests) en el log bajo "Línea base".
- **Aceptación:** todo en verde; si algo falla, reportar sin arreglar.

#### UX-01 · Constantes de navegación y copy
- **Objetivo:** centralizar nombres de menús, estados y textos reutilizables.
- **Pasos:** crear `lib/ui/nav-labels.ts` (etiquetas de la nav del alumno, admin e instructor), `lib/ui/recovery-status.ts` (estados de reposición, sección 5) y `lib/ui/copy.ts` (textos reutilizables: vacíos, confirmaciones, errores comunes).
- **Aceptación:** ningún componente nuevo escribe esas etiquetas "a mano".

---

### FASE A — Limpieza y mejoras de alto impacto

#### UX-A1 · Unificar glosario
- **Objetivo:** que toda la UI diga "reposición".
- **Pasos:** `grep -ri "recuper"` en `app/`, `components/`, `docs/guia-padres-y-alumnos.md`; reemplazar según sección 5. **No tocar nombres de campos de BD ni del esquema Prisma** (`recoveredById`, etc.), solo textos visibles.
- **Aceptación:** cero "recuperación/recuperar" en textos visibles; tests de componente actualizados.
- **Doc:** actualizar `docs/guia-padres-y-alumnos.md`: bullet de "Tus entrenamientos" → "Si faltaste, puedes **reportar la inasistencia** y ver si está pendiente, justificada o **por reponer**"; añadir la sección "Reposición de clases que faltaste" (2 faltas por mes incluidas, desde la 3.ª se repone; presencial en otro horario u online de 35 min; estados; costo informado por administración; política al cierre del cuatrimestre; avisos).

#### UX-A7a · Instrumentación mínima de eventos *(va antes de cambiar pantallas)*
- **Objetivo:** poder medir antes y después de cada cambio. Sin librerías de pago ni terceros.
- **Backend:** tabla aditiva `ProductEvent { id, userId?, schoolId?, name, screen?, props (JSON, sin datos personales), createdAt }` con índice `(name, createdAt)`. Endpoint `POST /api/events`: sesión requerida, Zod, **nombre dentro de la lista blanca** (sección 5.1), rate-limit, mismo origen, **`userId` y `schoolId` salen de la sesión, nunca del cuerpo**. Helper cliente `track(name, props)` que **nunca bloquea ni rompe la UI** si falla.
- **Consentimiento:** el helper `track()` debe respetar la decisión de analítica existente (`AnalyticsGate` / `ConsentProvider`): si el usuario no consintió, no se envía el evento (no-op silencioso). Nunca bloquear la UI ni mostrar errores por esto.
- **Eventos a instrumentar ahora:** `view_inicio`, `reporte_inasistencia`, `registro_repeticiones`, `view_syllabus` (los flujos que ya existen). El resto se agrega junto con su tarea.
- **Privacidad:** no guardar nombres, correos ni teléfonos en `props`. Respetar el banner de consentimiento si aplica.
- **Pruebas:** integración (nombre no permitido 400, sin sesión 401, 429, `userId` del cuerpo ignorado); unit del helper (incluido el caso sin consentimiento: no envía); matriz de autorización.
- **Revisión humana obligatoria.**

#### UX-A2 · Eliminar `window.confirm`
- **Objetivo:** usar `ConfirmModal` en todas las confirmaciones.
- **Ubicaciones conocidas (orientativas, no exhaustivas):** retirar reporte de inasistencia y borrar documento (alumno), cancelar / "no asistió" de reposición online (admin e instructor), eliminar inscripción (admin), asistencia del instructor. **Hoy el repo tiene 14 usos de `window.confirm` en `app/` y `components/`**; la fuente de verdad es el `grep`.
- **Pasos:** `grep -rn "window.confirm" app components`; sustituir cada uno por `ConfirmModal` con título claro, texto de consecuencia y botón destructivo diferenciado.
- **Aceptación:** `grep` devuelve 0 resultados; foco atrapado, `Esc` cierra y **el foco vuelve al botón que abrió el modal**; tests de componente para al menos 2 casos.

#### UX-A3 · Componente `EmptyState` y aplicación
- **Objetivo:** estados vacíos con acción.
- **Pasos:** crear `components/common/EmptyState` (icono, título, texto, acción opcional). Aplicarlo en: horario del alumno, asistencia, reposiciones, katas, logros, bandejas del instructor y del admin.
- **Aceptación:** ninguna lista vacía muestra solo "No hay…". Ejemplo de copy: "Aún no has registrado práctica. **Registrar mi primera práctica**".

#### UX-A4 · Selector familiar único
- **Objetivo:** un solo selector persistente de "¿de quién veo el expediente?" (tutor con varios hijos).
- **Pasos:** localizar `FamilyMemberSwitcher` y `FamilyQuickSwitcher`; dejar uno solo en el encabezado del shell; eliminar el duplicado en sidebar y páginas; cambiar el texto "¿Quién marca su asistencia?" por "Viendo el expediente de: {nombre}". **El selector no se muestra** si el usuario no es tutor o no tiene hijos asociados.
- **Seguridad:** el `?estudiante=` / `X-Student-Id` sigue validándose contra los hijos del tutor (**no regresar**). Se mantiene `isChildView` (perfil restringido).
- **Aceptación:** tests `family-members.test.tsx` y `edit-profile-modal.test.tsx` en verde.

> ### 🚦 GATE 1 — Prueba base con usuarios (antes de UX-A5a)
> Ejecutar el **Anexo A** sobre la app **actual** (sin cambios en Inicio). Registrar resultados en el log. Las tareas A1–A4 y A7a pueden avanzar mientras tanto; **A5a/A5b no empiezan** sin este resultado registrado.

#### UX-A5a · Función `getPrimaryAction` *(lógica pura)*
- **Objetivo:** decidir qué mostrar como acción principal del alumno.
- **Archivo:** `lib/dashboard/primary-action.ts`, **función pura**, sin acceso a BD.
- **Prioridad de reglas:**
  1. Hay clase hoy y aún no pasó → "Tu clase es hoy a las {hora}" · acciones: *Ver clase* / *Reportar inasistencia*.
  2. Tiene falta por reponer → "Te queda {n} reposición" · acción: *Resolver*.
  3. Nada urgente → "Practica {técnica en foco} hoy" · acción: *Registrar repeticiones*.
  4. Sin datos suficientes → bienvenida con enlace a Horario.
- **Reglas:** usar **INV-01** y `santoDomingoDayKey`/`nextClassFrom` para "hoy".
- **Pruebas (unit, exhaustivas):** los 4 casos, empates, clase ya pasada, cambio de día en zona horaria de Santo Domingo, sin datos.
- **Aceptación:** función sin dependencias de React ni de Prisma; cobertura de todas las ramas.

#### UX-A5b · Nuevo Inicio del alumno *(pantalla)*
- **Diseño de arriba abajo:**
  1. Saludo + cinturón (+ racha cuando exista, UX-C2).
  2. **UNA tarjeta de acción principal** con el resultado de `getPrimaryAction`.
  3. Foco: máximo 2–3 técnicas (reutilizar `FocusTechniquesList`).
  4. Alerta de reposición pendiente con botón (si aplica).
  5. Camino al próximo cinturón (reutilizar `MartialGradeCard` / `GradoProgress`).
  6. Secundarios colapsados: métricas, cumpleaños, criterios de examen.
- **Datos:** el Inicio obtiene todo con **una sola consulta de resumen** (reutilizar `StudentDashboardSummary`); no multiplicar consultas.
- **Eventos:** `view_inicio`, `click_primary_action` (con `action_type` en `props`).
- **Pruebas:** componente por cada variante de tarjeta; actualizar `student-dashboard-overview.test.tsx`.
- **Aceptación:** una sola acción dominante visible sin scroll en móvil (≈375 px); revisión con Lighthouse móvil sin regresión frente a la línea base.

#### UX-A6 · Solicitar reposición (alumno)
- **Gates:** (1) completar las decisiones de reposición de la sección 9; (2) revisión humana obligatoria.
- **Principio:** la solicitud es un **paso previo** a la reposición online que ya existe; **no** crea un flujo paralelo. Cuando se agenda, se **enlaza** con el registro de reposición online existente, que desde ahí gobierna los estados.
- **Modelo (propuesta, verificar contra el esquema Prisma y `attendance-roster` antes de migrar):** `RecoveryRequest { id, studentId, absenceId, preferredMode (IN_PERSON | ONLINE), note?, status, createdAt, reviewedById?, reviewedAt?, reviewNote?, onlineRecoveryId? }`.
  - `status`: `PENDING | SCHEDULED | REJECTED | CANCELLED | SUPERSEDED`.
  - **Una sola solicitud activa por falta** (`PENDING` o `SCHEDULED`): imponerlo con **índice único parcial** en BD, no solo en código.
  - El estado de la **falta** ("Por reponer", "Repuesta") se **deriva**, no se guarda por duplicado.
- **Tabla de transiciones (implementar y probar cada fila):**

| Situación | Resultado |
|---|---|
| Alumno crea solicitud | Solicitud `PENDING` → se ve **En revisión** |
| Alumno la retira (solo si `PENDING`) | `CANCELLED`; la falta vuelve a **Por reponer** y puede solicitar de nuevo |
| Retirar una ya revisada | **409** |
| Admin/instructor rechaza | `REJECTED` con nota; la falta vuelve a **Por reponer** |
| Admin/instructor agenda la online | `SCHEDULED` + enlace a la reposición online → se ve **Programada** |
| Alumno asiste a otra clase y el Sensei lo marca presente (flujo `recoveredById`) | Solicitud activa pasa a `SUPERSEDED` → se ve **Repuesta por otra vía** |
| Online completada | Falta **Repuesta** (flujo existente) |
| Online cancelada por admin | Falta vuelve a **Por reponer** con aviso |
| Online con "no asistió" | Falta vuelve a **Por reponer** (reglas de reintento: sección 9) |
| Cierre del cuatrimestre con falta sin reponer | Se aplica la política existente (`LOCK_AT_CLOSE` / `RESTORE_ON_RECOVERY`) |

- **Endpoints:** `POST /api/dashboard/student/recovery-requests`, `DELETE …/{id}`; para admin/instructor: listado y `PATCH` (aprobar/rechazar/agendar). Validar: la falta pertenece al alumno (o a su hijo vía vista familiar), está sin reponer, no hay solicitud activa, rate-limit 429.
- **Notificaciones:** a admin/instructor al crear; al alumno al revisar (tipos nuevos con enlace a "Mis reposiciones").
- **Frontend:** botón **"Solicitar reposición"** junto a cada falta por reponer; selector de modalidad; texto honesto: *"Administración revisará tu solicitud. La reposición online puede tener un costo que te informaremos."*
- **Eventos:** `click_solicitar_reposicion`, `reposicion_solicitada`.
- **Pruebas:** integración de **cada fila de la tabla**, falta ajena 404, duplicada 409 (incluida la carrera de dos solicitudes simultáneas), hijo vs. tutor ajeno, 429, INV-06; matriz de autorización; componente por estado.
- **Aceptación:** el flujo existente de reposición online **no cambia** ni se rompe.

#### UX-A8 · Embudo público con un CTA principal
- **Objetivo:** reducir entradas competidoras (modal de clase muestra, asistente, wizard, WhatsApp, cotización).
- **Pasos:** en `/` y `/nosotros`, **un** CTA primario ("Reserva tu clase muestra") y secundarios discretos; el asistente y el wizard pasan a ser pasos del mismo embudo (el asistente deriva a la clase muestra / inscripción, no compite). Instrumentar `inscripcion_paso_1…4` e `inscripcion_abandono`.
- **No tocar:** lógica de inscripción pública ni su rate-limit/honeypot.
- **Aceptación:** exactamente un CTA dominante por pantalla pública; tests públicos y `public-enrollments` en verde.

#### UX-A7b · Eventos restantes y tablero mensual
Completar los eventos de la lista canónica que falten y un tablero simple (puede ser una consulta SQL guardada o una página admin). **Métricas de negocio:** % de alumnos activos por semana · tiempo para pasar lista · faltas con reposición resuelta · abandono en el wizard. **Métricas de fricción:** taps hasta la acción principal, tiempo hasta la primera acción tras iniciar sesión, abandono por pantalla.

> ### 🚦 GATE 2 — Antes de la Fase B
> (a) Repetir el **Anexo A** sobre el nuevo Inicio y comparar con la prueba base; incluir la prueba de **nombres de navegación**. (b) Decisiones de la sección 9 marcadas como "bloquea Fase B" resueltas. (c) Resultados registrados en el log.

---

### FASE B — Estructura

#### UX-B0 · Primitivos de diseño (solo los necesarios)
Crear o consolidar **solo**: `ConfirmModal` (evolucionar el existente: hoy no tiene foco atrapado ni retorno de foco; **no** crear un segundo `ConfirmDialog`), `EmptyState` (UX-A3), `PageHeader`, `StatCard`, `Timeline`, `Toast`, `Tabs` y `SlideOver` (necesario para el panel de detalle de UX-B8 en móvil). **No** crear `CommandPalette`, `ProductCard`, `InvoiceCard`, `VideoCard`, etc. hasta que exista el módulo que los use.

> Nota: hoy **no existe** un componente `<Tabs>` reutilizable. Se crea aquí y lo consumen UX-B2 (Asistencia) y UX-B6 (Admin Asistencia).

**Checklist por primitivo (tests de componente):**
- **Accesibilidad:** `role` y `aria-*` correctos, operable con teclado, foco atrapado y devuelto al cerrar (`ConfirmModal`, `SlideOver`), `aria-live` (`Toast`), `role="tablist"`/`aria-selected` y navegación con flechas (`Tabs`).
- **Estados:** carga (skeleton), vacío y error, donde aplique.
- **Responsive:** verificado en Playwright o a mano (no en jsdom).

#### UX-B1 · Navegación del alumno de 5 destinos *(tarea estructural, revisión humana)*
- **Mapa y estructura de URLs (verificar rutas reales antes):**

| Destino | Contiene hoy | Rutas internas | Reservado para |
|---|---|---|---|
| **Inicio** | Resumen + tarjeta de acción | `/estudiante` | retos, novedades |
| **Entrenar** | Katas, syllabus, registro de repeticiones | `/estudiante/entrenar/katas`, `/estudiante/entrenar/practica` | `/estudiante/entrenar/aprender/…` (**solo documentado**, no crear páginas vacías) |
| **Clases** | Horario, reportar inasistencia, historial | `/estudiante/clases` | reservas |
| **Progreso** | Grado, requisitos, criterios de examen | `/estudiante/progreso` | ranking, logros |
| **Perfil** | Datos, documentos, passkeys/ajustes | `/estudiante/perfil` | pagos, facturas, pedidos |

- **Reglas críticas:**
  - **Redirecciones permanentes** desde todas las rutas antiguas; actualizar los enlaces que generan `lib/notifications/**`, correos y WhatsApp, y sus tests (`notifications.test.ts`).
  - Actualizar el middleware matcher y `tests/unit/middleware-matcher.test.ts` si cambian prefijos.
  - Barra inferior móvil con **máximo 5 ítems**; sidebar de escritorio con los mismos 5.
- **Reversión:** esta tarea se despliega **sola** (sin otras mezcladas) para poder revertirla. Las redirecciones hacen que revertir no rompa enlaces ya enviados. (Un feature flag por escuela solo se evalúa si ya hay varias escuelas en producción.)
- **Aceptación:** e2e del alumno en verde; sin rutas huérfanas; `/no-autorizado` funciona.

#### UX-B2 · Separar Asistencia en tres intenciones
Dividir la página actual (reportar inasistencia + reposiciones online + registrar práctica + historial):
- **Clases:** horario + "Reportar inasistencia" + historial.
- **Reposiciones:** hub propio (UX-B3).
- **Entrenar:** registro de repeticiones (`StudentPracticeLog`) junto a las katas.
Las APIs (`student/practice`, `student/absence`) **no cambian**; solo dónde se muestran. Reutilizar el `<Tabs>` creado en UX-B0.

#### UX-B3 · Hub "Mis reposiciones" *(depende de UX-A6)*
- **Pantalla:** línea de tiempo por falta con los estados de la sección 5.
- **Antes de implementar:** hacer un **wireframe textual** de la tarjeta por estado y aprobarlo.
- **Cada tarjeta:** fecha de la falta, estado, plazo si aplica (política de cierre), y **una** acción: *Solicitar reposición* / *Retirar solicitud* / *Ver detalle*.
- **Contenido extra:** horarios alternativos para presencial; para online, fecha/hora/enlace cuando esté programada; costo si ya fue informado. Texto corto de la regla "2 faltas/mes incluidas; desde la 3.ª se repone".
- **Pruebas:** componente por cada estado y el estado vacío; e2e del alumno.

#### UX-B4 · Instructor: modo tatami
- **Pasos:** `/instructor` abre directo en la clase de hoy/próxima (sin selector previo); "Marcar todos presentes" como acción principal y desmarcar excepciones; botones ≥44 px; bandeja de pendientes (justificaciones, punches) con contador al inicio; en Evaluaciones, preseleccionar al alumno de la clase en curso o el último evaluado.
- **Medición:** `pase_de_lista_completado` con `duration_ms` medido **en el cliente**, desde que se abre el pase de lista hasta que se guarda con éxito (es una aproximación y debe documentarse así en el log).
- **No cambiar:** reglas de propiedad (403 en clase ajena), `POST instructor/attendance`, `PATCH attendance/justification/{id}`.
- **Aceptación:** `instructor-attendance*.test.*` y e2e del instructor en verde.

#### UX-B5 · Admin: 5 secciones y bandeja "Hoy" *(tarea estructural, revisión humana)*
- **Mapa:**

| Sección | Contenido |
|---|---|
| **Hoy** | Bandeja única con contadores: inscripciones, documentos, justificaciones, solicitudes de reposición, alumnos sin plan/horario |
| **Alumnos** | Padrón + expediente + inscripciones |
| **Operación** | Asistencia (tabs), reposiciones, balance |
| **Configuración** | Horarios, calendario, planes, grados y katas, técnicas |
| **Comunicación** | Mensajes, reseñas, blog |

- **Bandeja "Hoy":** una fila por tipo de pendiente con contador y botón directo; reutilizar `AdminDashboardOverview` y las consultas existentes.
- **Móvil:** barra inferior de 5 ítems con badges de pendientes; el resto en "Más".
- **Dry-run:** antes de desplegar, León recorre sus tareas diarias en la nueva estructura. Si alguna quedó enterrada, se ajusta el agrupamiento. Opcional: banner "Nuevo menú" durante 2 semanas.
- **Aceptación:** nada deja de ser accesible; redirecciones de rutas viejas.

#### UX-B6 · Admin Asistencia en tabs
Tabs: **Pase de lista · Reposiciones · Auditoría · Política**. Mover los bloques existentes (`AdminPassListPanel`, `OnlineRecoveryPanel`, `AdminExpectedTable`/auditoría, `AdminAbsencePolicyCard`) sin cambiar su lógica. Las solicitudes de UX-A6 aparecen en la tab Reposiciones. Reutilizar el `<Tabs>` de UX-B0.

#### UX-B7a · Asistente único de asignación: nueva interfaz *(riesgo alto, revisión humana)*
- **Reemplaza (cuando cubra todos sus casos):** `KataAssignmentDialog`, `TechniqueAssignDialog`, `AdminBulkKataAssignment`, `AssignGradeDialog` (verificar cuáles existen realmente).
- **Diseño:** un solo diálogo con pestañas **Grado / Alumno / Grupo**; selección → vista previa ("se agregarán N técnicas a M alumnos; K ya las tienen") → confirmar.
- **Regla de oro:** **misma lógica y mismos endpoints que ya existen** (INV-03: solo agrega, idempotente). Primero la interfaz nueva sobre los endpoints viejos; **no** refactorizar la lógica de dominio en esta tarea.
- **Pruebas:** reutilizar y extender `admin-students.test.ts`, `instructor-evaluation.test.ts`, `technique-assign.test.ts`; componente del asistente.

#### UX-B7b · Retirar los diálogos antiguos
Solo cuando B7a esté en producción y verificada: eliminar los diálogos reemplazados y su código muerto.

#### UX-B8 · Admin Alumnos: una sola ruta canónica, dos modos *(tarea estructural)*
- **Conservar el "quick browse"** del explorador actual (`/admin/alumnos/detalle`):
  - `/admin/alumnos` = lista + panel lateral con el detalle inline (en móvil, `SlideOver`).
  - `/admin/alumnos/[studentId]` = página completa del expediente.
  - Ambos modos comparten los mismos componentes. La ruta antigua `detalle` redirige a `/admin/alumnos?selected={studentId}`.
- **Aceptación:** "clic en fila → ver detalle → clic en otra fila" sigue funcionando sin recargar la lista.

---

### FASE C — Motivación y preparación

#### UX-C1 · Camino al próximo cinturón
Barra visual con % de avance y qué falta (katas, asistencia, examen). **Reutilizar la fuente única (INV-07)** y `getStudentKataProgress`; no recalcular en el componente.

#### UX-C2 · Racha personal y logros básicos
- **Antes de implementar, confirmar con León la definición** (propuesta: semanas consecutivas con al menos una asistencia o práctica registrada; no castiga a quien entrena 2–3 veces por semana).
- **Cálculo como función pura sobre el histórico** (`lib/dashboard/streak.ts`), **sin contador guardado**. Así nadie empieza en 0 al lanzar y no hace falta backfill. Unit tests, INV-01 para fechas.
- Mostrar en el Inicio sin dominar la pantalla. Notificaciones de racha solo con propósito ("tu racha vence hoy"), nunca "vuelve".
- Logros: empezar con 5–8 automáticos simples; la lista la define León.

#### UX-C3 · Espacio "Entrenar" preparado para tutoriales
- En el syllabus/lista de katas, reservar la posición del botón **"Ver tutorial"** (visible solo si la kata tiene video).
- Añadir un campo **aditivo y opcional** para el enlace de video en el modelo de técnica/kata, sin reproductor todavía (el alojamiento se decide en la sección 9).

#### UX-C4 · Bienvenida de primer ingreso *(depende de poder detectar el primer ingreso)*
Tarjeta en el Inicio del alumno nuevo con 3 acciones: *Completa tu perfil*, *Mira tu próxima clase*, *Registra tu primera práctica*. Verificar primero cómo detectar el primer ingreso con los datos existentes; si requiere un campo nuevo, es aditivo y se pregunta antes.

---

### FASE D en adelante (NO implementar ahora)

Academia (videos y artículos) · ranking opt-in · tienda · facturación. Solo respetar los huecos de navegación y las reglas de la sección 6. Cada uno tendrá su propia guía cuando se definan las decisiones pendientes.

---

## 8. DESCARTADO POR AHORA (para que no se reabra sin motivo)

| Propuesta | Por qué se descarta |
|---|---|
| Feature flag de navegación por escuela | Duplica navegación y tests; se evalúa solo con varias escuelas en producción. |
| Presupuesto "P95 < 1.5 s en 3G" | No hay forma de medirlo aún; se usa una sola consulta de resumen + Lighthouse móvil. |
| Botón "Enviar comentario" en la app | Con pocos usuarios, el canal actual (WhatsApp) basta; implica guardar texto libre de menores. |
| Tests de 375/768/1440 en jsdom | jsdom no calcula layout; se verifica en Playwright o a mano. |
| Versionado de nombres de eventos | Excesivo en esta etapa. |

---

## 9. DECISIONES PENDIENTES (no inventar; preguntar)

| Tema | Pregunta | Bloquea |
|---|---|---|
| Reposición presencial | ¿Requiere solicitud previa o basta con asistir a otra clase? | UX-A6 |
| Reposición online | ¿Quién aprueba, cuánto cuesta, qué plazo hay? | UX-A6 |
| "No asistió" | ¿Consume la oportunidad o puede reintentar? | UX-A6 |
| Rechazo | ¿Puede volver a solicitar la misma falta? | UX-A6 |
| Racha | ¿Definición exacta (semanal/diaria)? | UX-C2 |
| Logros | ¿Lista inicial? | UX-C2 |
| Primer ingreso | ¿Cómo se detecta con los datos actuales? | UX-C4 |
| Nombres de navegación | ¿Se mantienen tras la prueba? | **UX-B1 (bloquea Fase B)** |
| Ranking | ¿Individual, por clase o escuela? ¿Qué mide? ¿Opt-in? | Fase D |
| Contenido | ¿Gratis, de pago o mixto? ¿Qué se bloquea? | Fase D |
| Videos | ¿Dónde se alojan (costo, privacidad, subtítulos)? | UX-C3 (reproductor) / Fase D |
| Tienda | ¿Pasarela real o pedidos manuales al inicio? | Fase D |

---

## 10. PLANTILLAS

### 10.1 Prompt de arranque por tarea
```
Lee docs/ux-reorganizacion.md (secciones 1–6) y la tarea UX-A5a.
1) Explora el código relevante y muéstrame un plan corto (archivos, pasos, pruebas). No edites todavía.
2) Tras mi OK, implementa en commits pequeños.
3) Ejecuta la sección 4, reporta resultados y agrega la entrada en docs/ux-reorganizacion-log.md.
No toques nada fuera de alcance. Si algo es ambiguo, pregunta.
```

### 10.2 Reporte final esperado
```
Tarea: UX-A5a
Archivos creados/modificados: ...
Decisiones tomadas y por qué: ...
Pruebas añadidas: ...
Resultado: lint ✅ typecheck ✅ test ✅ integration ✅ (e2e: no aplica)
Pendientes o dudas: ...
```

### 10.3 Checklist de "terminado" por tarea
- [ ] Cumple los criterios de aceptación de la tarea.
- [ ] Sin `window.confirm`, sin `any` nuevo, sin `console.log`.
- [ ] Glosario (sección 5) y copy (sección 3.2): tuteo, verbos de acción, sin tecnicismos.
- [ ] Estados: carga (skeleton), vacío (con acción), error (toast).
- [ ] Accesible: foco (y retorno de foco), etiquetas, teclado, 44 px, contraste.
- [ ] Rutas nuevas con auth + Zod + mismo origen + alcance + rate-limit + prueba en la matriz.
- [ ] Redirecciones permanentes y enlaces de notificaciones/correos/WhatsApp actualizados si cambió una ruta.
- [ ] Migraciones solo aditivas.
- [ ] Eventos nuevos agregados a la lista blanca y a la sección 5.1.
- [ ] Tests existentes en verde; tests nuevos con prefijo `UX-…`.
- [ ] Documento de pruebas y guía de usuario actualizados cuando corresponda.
- [ ] Entrada agregada a `docs/ux-reorganizacion-log.md`.
- [ ] Si es tarea marcada con revisión humana: diff aprobado por León antes del merge.

---

## 11. ORDEN RESUMIDO

```
UX-00 → UX-01 → A1 → A7a → A2 → A3 → A4
   → 🚦GATE 1 (prueba base, Anexo A)
   → A5a → A5b → A6 → A8 → A7b
   → 🚦GATE 2 (repetir Anexo A + nombres de nav + decisiones)
   → B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7a → B7b → B8
   → C1 → C2 → C3 → C4
```

---

## ANEXO A — Guion de validación con usuarios

> No es una tarea de código: la hace León (o una persona de confianza). Usar **el mismo guion** en la prueba base (Gate 1) y en la repetición (Gate 2) para poder comparar.

### A.1 Participantes y logística
- **5 sesiones:** 3 alumnos (idealmente un adulto, un joven y un nuevo), 1 tutor, 1 instructor. 20–30 minutos cada una.
- **Menores:** solo con permiso del tutor, presente durante la sesión.
- Usar el teléfono del participante o uno de prueba con una **cuenta de prueba** con datos ficticios.
- **No grabar vídeo.** Tomar notas. No anotar nombres ni datos personales: usar "Alumno 1", "Tutor 1".

### A.2 Reglas del moderador
- **No guiar, no explicar, no defender el diseño.** Si pregunta "¿dónde toco?", responder "¿dónde esperarías encontrarlo?".
- Pedir que **piense en voz alta**.
- Silencio cómodo: esperar antes de ayudar. Ayudar solo tras ~60 segundos atascado y anotarlo como "necesitó ayuda".
- No decir "es fácil" ni "es solo que…".

### A.3 Calentamiento (3 min)
1. ¿Cuándo usaste la app por última vez? ¿Para qué?
2. ¿Qué es lo que más haces en ella? ¿Qué te molesta?
3. ¿Qué intentas hacer y no encuentras?

### A.4 Tareas (con criterio de éxito)

| # | Tarea (se lee tal cual) | Éxito | Anotar |
|---|---|---|---|
| 1 | "Averigua cuándo es tu próxima clase." | La encuentra sin ayuda en ≤30 s | Dónde fue primero |
| 2 | "Avisa que mañana no podrás ir a clase." | Completa el reporte de inasistencia | Dudas, errores, tiempo |
| 3 | "¿Cuántas clases tienes pendientes por reponer?" | Da el número correcto | Dónde lo buscó; si no lo encontró |
| 4 | "Registra la práctica que hiciste hoy en casa." | Registra repeticiones | Cuántos pasos, dudas |
| 5 | "¿Qué te falta para el próximo cinturón?" | Describe lo que falta | Qué pantalla usó |
| Tutor | "Cambia para ver la información de tu hijo/a y avisa que no irá mañana." | Cambia de vista y reporta | Si entiende de quién es la vista |
| Instructor | "Pasa lista de la clase de hoy." | Guarda la asistencia | Tiempo total, toques, errores |
| Instructor | "Evalúa una técnica de un alumno." | Registra la evaluación | Pasos de más |

Por cada tarea registrar: **éxito (sí / con ayuda / no), tiempo aproximado, errores y frase textual** del participante.

### A.5 Después de cada tarea
- ¿Qué esperabas que pasara?
- ¿Fue más fácil o más difícil de lo que pensabas?

### A.6 Prueba de nombres de navegación (solo Gate 2)
Mostrar los 5 nombres sin pantallas y preguntar, uno por uno: *"¿Qué crees que encontrarías en 'Entrenar'?"* (y en los demás). Anotar si coincide con el contenido real. Si 2 de 5 personas no lo entienden, probar alternativas (ej. "Mi práctica").

### A.7 Cierre (3 min)
- ¿Qué fue lo más confuso de todo?
- Si pudieras cambiar una sola cosa, ¿cuál sería?
- ¿Usarías esta app sin que nadie te lo pida? ¿Por qué?

### A.8 Registro de resultados (en `docs/ux-reorganizacion-log.md`)
Por tarea: nº de participantes que la completaron sin ayuda / con ayuda / no, tiempo mediano y 2 citas textuales. Al final, lista de los **3 problemas más graves** y la decisión tomada. En el Gate 2, comparar contra el Gate 1.
