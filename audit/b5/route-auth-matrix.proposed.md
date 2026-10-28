# Propuesta aparte: ampliar `route-auth-matrix.test.ts`

No se modificó el test de la app. La copia está en `route-auth-matrix.extended.ts`; para ejecutarla hay que moverla a `nextfrontend/tests/integration/`.

## Cambio propuesto

```diff
 const WRONG_ROLES: Record<Panel, TestRole[]> = {
-  admin: ['STUDENT'],
+  admin: ['STUDENT', 'INSTRUCTOR', 'GUARDIAN'],
   instructor: ['STUDENT'],
   student: ['INSTRUCTOR'],
   user: [],
 }
```

## Motivo

La matriz actual solo comprueba `STUDENT` como rol incorrecto para las APIs de admin. La auditoría B5 comprobó en negro **300 combinaciones** (50 rutas × 6 roles) y las tres rutas de rol incorrecto devolvieron 403; falta dejar esa cobertura en el test de integración.

La copia no incluye las páginas nuevas (`/admin/operacion`, `/admin/configuracion`, `/admin/comunicacion`) porque el harness actual invoca handlers de API, no Server Components. Esas páginas se cubren en `specs/04-auth.spec.mjs` con Playwright, incluido el HTML inicial antes del redirect de cliente.

## Evidencia ejecutada

- `reports/api-auth-matrix.json`: 300 combinaciones; 0 no esperadas.
- `specs/04-auth.spec.mjs`: páginas, HTML inicial y INV-06.
