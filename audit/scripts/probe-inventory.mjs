import { request } from '@playwright/test'

const projects = [
  { name: 'prod', url: process.env.AUDIT_PROD_URL ?? 'http://127.0.0.1:3100' },
  { name: 'new', url: process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101' },
]
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
]
for (const project of projects) {
  const ctx = await request.newContext({ baseURL: project.url, storageState: `audit/.auth/${project.name}-student.json` })
  for (const path of paths) {
    const res = await ctx.get(path, { maxRedirects: 0, failOnStatusCode: false })
    console.log(`${project.name}\t${res.status()}\t${path}\t${res.headers()['location'] ?? ''}`)
  }
  await ctx.dispose()
}
