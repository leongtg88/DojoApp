<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Secretos y entorno (regla del proyecto)

- **Nunca** leer, mostrar, copiar ni editar `.env.local` (ni ningún `.env*` que no sea `.env.example`). Contiene credenciales reales.
- Si se necesita una variable de entorno, referenciarla por su nombre (`process.env.X`) sin volcar su valor.
- No añadir secretos a componentes cliente ni variables `NEXT_PUBLIC_*`.
- Hay un guard que bloquea commits con secretos: `pnpm guard:env` (activo vía hook `.githooks/pre-commit`).

