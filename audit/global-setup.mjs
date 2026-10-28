import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const auditDir = path.resolve(import.meta.dirname)
const authDir = path.join(auditDir, '.auth')
const reportsDir = path.join(auditDir, 'reports')

const projects = [
  { name: 'prod', url: process.env.AUDIT_PROD_URL ?? 'http://127.0.0.1:3100' },
  { name: 'new', url: process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101' },
]

const roles = [
  { name: 'student', email: process.env.STUDENT_EMAIL, password: process.env.STUDENT_PASSWORD },
  { name: 'guardian', email: process.env.GUARDIAN_EMAIL, password: process.env.GUARDIAN_PASSWORD },
  { name: 'instructor', email: process.env.INSTRUCTOR_EMAIL, password: process.env.INSTRUCTOR_PASSWORD },
  { name: 'admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
]

export function authFile(project, role) {
  return path.join(authDir, `${project}-${role}.json`)
}

export default async function globalSetup() {
  fs.mkdirSync(authDir, { recursive: true })
  fs.mkdirSync(reportsDir, { recursive: true })
  const results = []
  const browser = await chromium.launch()

  for (const project of projects) {
    for (const role of roles) {
      if (!role.email || !role.password) {
        results.push({ project: project.name, role: role.name, ok: false, error: 'credenciales ausentes' })
        continue
      }
      const stateFile = authFile(project.name, role.name)
      if (fs.existsSync(stateFile) && process.env.AUDIT_REUSE_AUTH !== '0') {
        results.push({ project: project.name, role: role.name, ok: true, reused: true })
        console.log(`auth reuse ${project.name}/${role.name}`)
        continue
      }
      const context = await browser.newContext({
        baseURL: project.url,
        locale: 'es-DO',
        timezoneId: 'America/Santo_Domingo',
      })
      const page = await context.newPage()
      try {
        await page.goto('/login', { waitUntil: 'domcontentloaded' })
        await page.fill('#login-email-input', role.email)
        await page.fill('#login-password-input', role.password)
        await page.click('#btn-submit-login')
        await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
        await page.waitForTimeout(800)
        await context.storageState({ path: authFile(project.name, role.name) })
        results.push({ project: project.name, role: role.name, ok: true, finalUrl: page.url() })
        console.log(`auth OK ${project.name}/${role.name} -> ${page.url()}`)
      } catch (error) {
        const shot = path.join(reportsDir, `auth-failure-${project.name}-${role.name}.png`)
        await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
        results.push({
          project: project.name,
          role: role.name,
          ok: false,
          finalUrl: page.url(),
          error: error instanceof Error ? error.message : String(error),
          screenshot: shot,
        })
        console.error(`auth FAIL ${project.name}/${role.name}: ${error instanceof Error ? error.message : error}`)
      } finally {
        await context.close()
      }
    }
  }

  await browser.close()
  fs.writeFileSync(path.join(reportsDir, 'auth.json'), JSON.stringify(results, null, 2))
  const failed = results.filter((result) => !result.ok)
  if (failed.length > 0) {
    console.warn(`Auth falló en ${failed.length} combinaciones; las pruebas que dependan de ellas se omitirán.`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await globalSetup()
}
