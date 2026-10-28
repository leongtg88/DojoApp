# Auditoría UX-B1 · entorno reproducible

Esta carpeta contiene **solo** la auditoría. No se modificó código de la aplicación.

## Requisitos

- Docker Desktop.
- Node 25 + pnpm 11.
- Puertos libres: `3100`, `3101` y `55433`. El puerto `3000` no se usa para no chocar con el dev server del usuario.
- `audit/node_modules` es un junction local a `nextfrontend/node_modules` (ignorado por git); no se instala un segundo árbol de dependencias.

## 1. Worktrees

```bash
git worktree add --detach ../dojoapp-prod 08008ee
git worktree add --detach ../dojoapp-new  310dc4c

# Dependencias reales en cada worktree (Turbopack rechaza un node_modules enlazado fuera del proyecto)
cd ../dojoapp-prod/nextfrontend && pnpm install --frozen-lockfile --ignore-scripts
cd ../dojoapp-new/nextfrontend  && pnpm install --frozen-lockfile --ignore-scripts
```

## 2. Base de datos aislada

```bash
docker run -d --name dojo-audit-db \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=dojo_audit \
  -p 55433:5432 postgres:16-alpine
```

Migraciones y seed desde el worktree de producción (no tiene `.env.local`):

```bash
cd ../dojoapp-prod/nextfrontend
node --env-file="C:/.../DojoApp/audit/.env.audit.old" node_modules/prisma/build/index.js migrate deploy
node --env-file="C:/.../DojoApp/audit/.env.audit.old" node_modules/tsx/dist/cli.mjs prisma/seed.ts
```

Fixture de auditoría (tutor con dos hijos, notificaciones históricas y de técnicas):

```bash
node --env-file=audit/.env.audit audit/scripts/seed-audit.mjs
```

## 3. Variables

`scripts/write-env.mjs` genera `.env.audit`, `.env.audit.old` y `.env.audit.new` (ignorados por git). Apuntan **solo** a `127.0.0.1:55433/dojo_audit` y dejan vacías todas las integraciones externas (Resend, WhatsApp, Telegram, N8N, Supabase, VAPID, GA, Meta).

El wrapper `scripts/run-with-env.mjs` carga el archivo y lanza el comando sin `--env-file` en `NODE_OPTIONS`, porque Next lo rechaza en sus workers.

## 4. Build y servidores

```bash
cd ../dojoapp-new/nextfrontend
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/.env.audit.new node node_modules/next/dist/bin/next build
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/.env.audit.new node node_modules/next/dist/bin/next start -p 3101

cd ../dojoapp-prod/nextfrontend
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/.env.audit.old node node_modules/next/dist/bin/next build
node C:/.../DojoApp/audit/scripts/run-with-env.mjs C:/.../DojoApp/audit/.env.audit.old node node_modules/next/dist/bin/next start -p 3100
```

## 5. Suite

```bash
cd audit
node scripts/run-with-env.mjs .env.audit node node_modules/@playwright/test/cli.js test --config playwright.config.mjs
```

El informe completo está en `nextfrontend/docs/auditoria-B1.md`.

> La suite usa `expect.soft` para los hallazgos: los tests que documentan fallos (308, contexto del tutor, enlaces de técnicas, etc.) **fallan a propósito** y el exit code puede ser 1. El resultado se lee en `reports/*.json` y en el informe.

## 6. Limpieza

```bash
docker rm -f dojo-audit-db
git worktree remove ../dojoapp-prod --force
git worktree remove ../dojoapp-new --force
```

No se tocó `.env.local`, la base de datos de desarrollo ni `omaskuchen-db`.
