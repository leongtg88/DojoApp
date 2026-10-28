import { request } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const cases = [
  { role: 'instructor', paths: ['/dashboard/estudiante', '/dashboard/estudiante/clases', '/estudiante/clases', '/estudiante/entrenar'] },
  { role: 'admin', paths: ['/dashboard/estudiante', '/dashboard/estudiante/clases', '/estudiante/clases'] },
  { role: 'student', paths: ['/dashboard/admin', '/dashboard/instructor/asistencia', '/dashboard/instructor'] },
]
for (const c of cases) {
  const ctx = await request.newContext({ baseURL, storageState: `audit/.auth/new-${c.role}.json` })
  for (const path of c.paths) {
    const res = await ctx.get(path, { maxRedirects: 0, failOnStatusCode: false })
    console.log(`${c.role} ${res.status()} ${path} -> ${res.headers()['location'] ?? ''}`)
  }
  await ctx.dispose()
}
