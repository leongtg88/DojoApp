import { request } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const ctx = await request.newContext({ baseURL })
const paths = [
  '/estudiante',
  '/dashboard/estudiante',
  '/estudiante/clases',
  '/dashboard/estudiante/clases',
  '/estudiante/entrenar',
  '/dashboard/estudiante/entrenar',
  '/estudiante/horario',
  '/dashboard/estudiante/horario',
  '/estudiante/asistencia',
  '/dashboard/estudiante/asistencia',
  '/dashboard/ajustes',
  '/dashboard/admin',
  '/dashboard/instructor/asistencia',
]
for (const path of paths) {
  const res = await ctx.get(path, { maxRedirects: 0, failOnStatusCode: false })
  console.log(`${res.status()} ${path} -> ${res.headers()['location'] ?? ''}`)
}
await ctx.dispose()
