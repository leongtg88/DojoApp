import { chromium } from '@playwright/test'
import fs from 'node:fs'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const fixtures = JSON.parse(fs.readFileSync('audit/reports/fixtures.json', 'utf8'))
const browser = await chromium.launch()
const context = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-guardian.json' })
const page = await context.newPage()

async function snapshot(label, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const switcher = page.locator('[aria-label^="Viendo el expediente de:"]')
  const navHrefs = await page.locator('nav[aria-label="Navegación del dashboard"] a').evaluateAll((els) => els.map((el) => el.getAttribute('href')))
  const roleLabel = await page.locator('aside p.text-accent').first().textContent().catch(() => null)
  console.log(JSON.stringify({
    label,
    status: res?.status(),
    finalUrl: page.url(),
    switcherCount: await switcher.count(),
    switcherLabel: await switcher.first().getAttribute('aria-label').catch(() => null),
    navHrefs,
    roleLabel,
  }, null, 2))
}

await snapshot('dashboard-alias', `/dashboard/estudiante?estudiante=${fixtures.anaStudentId}`)
await snapshot('canonical', `/estudiante?estudiante=${fixtures.anaStudentId}`)

const oldRoute = await context.request.get(`/dashboard/estudiante/horario?estudiante=${fixtures.anaStudentId}`, { maxRedirects: 0, failOnStatusCode: false })
console.log(JSON.stringify({ oldRouteStatus: oldRoute.status(), location: oldRoute.headers()['location'] ?? null }, null, 2))
await snapshot('old-route-final', `/dashboard/estudiante/horario?estudiante=${fixtures.anaStudentId}`)

await browser.close()
