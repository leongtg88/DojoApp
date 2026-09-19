#!/usr/bin/env node
// Guard de seguridad: evita filtrar secretos (.env) en commits.
// Uso: node scripts/guard-env.mjs   (o `pnpm guard:env`)

import { execFileSync } from 'node:child_process'

const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

// Rutas generadas/ruido que nunca contienen secretos propios: se omiten del escaneo.
const GENERATED_PATTERNS = [
  /(^|\/)lib\/generated\//,
  /(^|\/)pnpm-lock\.yaml$/,
  /\.tsbuildinfo$/,
]
const isGenerated = (path) => GENERATED_PATTERNS.some((re) => re.test(path))

const SECRET_PATTERNS = [
  ['Clave secreta de Supabase (sb_secret_)', /sb_secret_[A-Za-z0-9_-]{10,}/],
  ['API key de Resend (re_...)', /(^|[^A-Za-z0-9])re_[A-Za-z0-9]{16,}/],
  ['URL de Postgres con credenciales', /postgres(ql)?:\/\/[^\s:@/]+:[^\s:@/]+@/i],
  ['Clave privada PEM', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AUTH_SECRET con valor', /AUTH_SECRET\s*=\s*["']?[^\s"'#]{8,}/],
  ['SUPABASE_SERVICE_ROLE_KEY con valor', /SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']?[^\s"'#]{8,}/],
  ['API key de Google/Gemini', /AIza[0-9A-Za-z_-]{30,}/],
  ['AWS Access Key', /AKIA[0-9A-Z]{16}/],
]

const PLACEHOLDER = /(MY_|YOUR_|PROJECT_REF|PASSWORD|REGION|genera-un-secreto|tu-dominio|example|placeholder|changeme|xxxx|^["']?(x|X|0|\*)+["']?$)/i

const baseName = (path) => path.split('/').pop() ?? path
const isEnvFile = (path) => {
  const base = baseName(path)
  return base === '.env' || base.startsWith('.env.')
}
const isEnvExample = (path) => {
  const base = baseName(path)
  return base === '.env.example' || base.endsWith('.env.example')
}

const errors = []

// 1) Archivos staged: bloquear cualquier .env real (excepto .env.example)
const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)

for (const file of staged) {
  if (isEnvFile(file) && !isEnvExample(file)) {
    errors.push(`Archivo de entorno staged: ${file}`)
  }
}

// 2) Contenido agregado en el diff staged: patrones de secreto de alta confianza
let diff = ''
try {
  diff = git(['diff', '--cached', '-U0', '--no-color'])
} catch (error) {
  console.error('\n[guard-env] No fue posible leer el diff staged (¿diff demasiado grande?).')
  console.error('Detalle:', error instanceof Error ? error.message : error)
  process.exit(1)
}
let currentFile = null
for (const line of diff.split('\n')) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.slice(6)
    continue
  }
  if (!line.startsWith('+') || line.startsWith('+++') || !currentFile) continue
  if (isEnvExample(currentFile)) continue // los ejemplos pueden llevar placeholders
  if (isGenerated(currentFile)) continue // archivos generados: sin secretos propios
  const text = line.slice(1)
  for (const [name, re] of SECRET_PATTERNS) {
    if (re.test(text)) {
      errors.push(`${name} detectado en ${currentFile}: ${text.trim().slice(0, 80)}`)
      break
    }
  }
}

// 3) Validar que .env.example no traiga valores reales
for (const file of staged.filter(isEnvExample)) {
  let content = ''
  try {
    content = git(['show', `:${file}`])
  } catch {
    continue
  }
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (value.length < 12 || PLACEHOLDER.test(value)) continue
    if (/^[A-Za-z0-9+/_=-]{20,}$/.test(value)) {
      errors.push(`Posible valor real en ${file}: ${line.slice(0, eq + 1)}...`)
      break
    }
  }
}

// 4) Auditoría: archivos .env reales ya versionados en el repo
const trackedEnv = git(['ls-files'])
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && isEnvFile(line) && !isEnvExample(line))
for (const file of trackedEnv) {
  errors.push(`Archivo de entorno versionado en el repo: ${file}`)
}

if (errors.length > 0) {
  console.error('\n[guard-env] Commit bloqueado por posibles fugas de secretos:\n')
  for (const error of [...new Set(errors)]) console.error(`  - ${error}`)
  console.error('\nRevisa .env.local y quita los datos sensibles antes de commitear.\n')
  process.exit(1)
}

console.log('[guard-env] OK: sin secretos ni archivos .env en el commit.')
