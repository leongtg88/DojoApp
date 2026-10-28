# Auditoría UX-B5 · entorno reproducible

Solo auditoría. No se modificó código de la aplicación.

## Base

- Producción: `08008ee`.
- Nueva: `f29fac9` (`fix/b1-auditoria`), verificado descendiente de `310dc4c`.
- BD aislada: `dojo_audit_b5` en `127.0.0.1:55434`.
- Servidores: `127.0.0.1:3110` (prod) y `3111` (nueva).
- Integraciones externas vacías.

## Preparación

```bash
git worktree add --detach ../dojoapp-prod 08008ee
git worktree add --detach ../dojoapp-b5 f29fac9

cd ../dojoapp-prod/nextfrontend && pnpm install --frozen-lockfile --ignore-scripts
cd ../dojoapp-b5/nextfrontend  && pnpm install --frozen-lockfile --ignore-scripts

docker run -d --name dojo-audit-b5-db \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=dojo_audit_b5 \
  -p 55434:5432 postgres:16-alpine
```

`scripts/write-env.mjs` genera `.env.audit.b5*` (ignorados por git). Migraciones y seed desde el worktree de producción:

```bash
cd ../dojoapp-prod/nextfrontend
node --env-file="C:/.../DojoApp/audit/b5/.env.audit.b5.old" node_modules/prisma/build/index.js migrate deploy
node --env-file="C:/.../DojoApp/audit/b5/.env.audit.b5.old" node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

Fixture B5 (segunda escuela, pendientes, inactivo, sensei sin plan, sin plan/sin horario):

```bash
node --env-file=audit/b5/.env.audit.b5 audit/b5/scripts/seed-fixture.mjs
```

## Build y servidores

```bash
cd ../dojoapp-prod/nextfrontend
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/b5/.env.audit.b5.old node node_modules/next/dist/bin/next build
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/b5/.env.audit.b5.old node node_modules/next/dist/bin/next start -p 3110

cd ../dojoapp-b5/nextfrontend
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/b5/.env.audit.b5.new node node_modules/next/dist/bin/next build
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/b5/.env.audit.b5.new node node_modules/next/dist/bin/next start -p 3111
```

## Suite

```bash
cd audit/b5
node ../scripts/run-with-env.mjs .env.audit.b5 node ../node_modules/@playwright/test/cli.js test --config playwright.config.mjs
```

Specs:

- `01-inventory`: rutas viejas/nuevas y alias.
- `02-parity`: menú, hubs, badges, truncamiento y clics.
- `03-hoy`: contadores vs SQL, destinos, segunda escuela.
- `04-auth`: sin sesión, roles incorrectos, HTML inicial, INV-06 y matriz API ampliada.
- `05-screenshots`: 375/1440.

## Limpieza

```bash
docker rm -f dojo-audit-b5-db
git worktree remove ../dojoapp-prod --force
git worktree remove ../dojoapp-b5 --force
```
