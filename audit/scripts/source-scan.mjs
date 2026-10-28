import fs from 'node:fs'
import path from 'node:path'

const repo = path.resolve(import.meta.dirname, '..', '..')
const app = path.join(repo, 'nextfrontend')
const files = [
  'lib/notifications/types.ts',
  'lib/notifications/create.ts',
  'lib/integrations/whatsapp.ts',
  'app/(dashboard)/estudiante/asistencia/page.tsx',
  'app/(dashboard)/estudiante/horario/page.tsx',
  'app/(dashboard)/estudiante/clases/page.tsx',
  'app/(dashboard)/estudiante/entrenar/page.tsx',
  'app/(dashboard)/estudiante/perfil/page.tsx',
  'app/(dashboard)/estudiante/progreso/page.tsx',
  'app/(dashboard)/estudiante/page.tsx',
  'app/api/auth/forgot-password/route.ts',
  'app/api/dashboard/admin/students/[studentId]/invite/route.ts',
]
const patterns = [
  { name: 'student-route', re: /\/(?:dashboard\/)?estudiante\/[A-Za-z0-9_?&=./-]+/g },
  { name: 'app-url', re: /NEXTDOJO_APP|NEXT_PUBLIC_APP_URL/g },
  { name: 'external-url', re: /https?:\/\/[^\s"'`]+/g },
]
const results = []
for (const rel of files) {
  const abs = path.join(app, rel)
  if (!fs.existsSync(abs)) continue
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const { name, re } of patterns) {
      for (const match of line.matchAll(re)) {
        results.push({ file: `nextfrontend/${rel}`, line: index + 1, kind: name, match: match[0] })
      }
    }
  })
}
const out = path.join(repo, 'audit', 'reports', 'source-scan.json')
fs.writeFileSync(out, JSON.stringify(results, null, 2))
const unique = [...new Map(results.map((row) => [`${row.file}:${row.line}:${row.match}`, row])).values()]
console.log(JSON.stringify(unique.filter((row) => row.kind === 'student-route'), null, 2))
console.log('external/app-url count', unique.filter((row) => row.kind !== 'student-route').length)
