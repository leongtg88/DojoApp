import { chromium } from '@playwright/test'

const projects = [
  { name: 'prod', url: process.env.AUDIT_PROD_URL ?? 'http://127.0.0.1:3100' },
  { name: 'new', url: process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101' },
]
const pagesByProject = {
  prod: ['/dashboard/estudiante', '/dashboard/estudiante/perfil', '/dashboard/estudiante/progreso', '/dashboard/estudiante/horario', '/dashboard/estudiante/asistencia'],
  new: ['/dashboard/estudiante', '/dashboard/estudiante/entrenar', '/dashboard/estudiante/clases', '/dashboard/estudiante/progreso', '/dashboard/estudiante/perfil'],
}
const browser = await chromium.launch()
for (const project of projects) {
  const ctx = await browser.newContext({ baseURL: project.url, storageState: `.auth/${project.name}-student.json`, viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.setDefaultNavigationTimeout(20_000)
  for (const route of pagesByProject[project.name]) {
    const start = Date.now()
    try {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      console.log(project.name, route, res?.status(), `${Date.now() - start}ms`, (await page.locator('h1').allTextContents()).join('|'))
    } catch (error) {
      console.log(project.name, route, 'ERROR', `${Date.now() - start}ms`, error.message.split('\n')[0])
    }
  }
  await ctx.close()
}
await browser.close()
