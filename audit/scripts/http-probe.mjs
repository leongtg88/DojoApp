import { request } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const ctx = await request.newContext({ baseURL, storageState: 'audit/.auth/new-student.json' })
const paths = [
  '/dashboard/estudiante',
  '/estudiante',
  '/dashboard/estudiante/perfil',
  '/estudiante/perfil',
  '/dashboard/estudiante/progreso',
  '/estudiante/progreso',
  '/dashboard/estudiante/horario',
  '/estudiante/horario',
  '/dashboard/estudiante/asistencia',
  '/estudiante/asistencia',
  '/dashboard/estudiante/clases',
  '/estudiante/clases',
  '/dashboard/estudiante/entrenar',
  '/estudiante/entrenar',
  '/dashboard/estudiante/entrenar/katas',
  '/estudiante/entrenar/katas',
  '/dashboard/ajustes',
  '/dashboard/estudiante/horario/',
  '/dashboard/estudiante/horario?estudiante=audit-child-ana',
]
for (const path of paths) {
  const res = await ctx.get(path, { maxRedirects: 0, failOnStatusCode: false })
  console.log(`${res.status()} ${path} -> ${res.headers()['location'] ?? ''}`)
}
await ctx.dispose()
