import { chromium } from '@playwright/test'
import fs from 'node:fs'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const fixtures = JSON.parse(fs.readFileSync('audit/reports/fixtures.json', 'utf8'))
const browser = await chromium.launch()

const context = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-student.json', viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
for (const [name, path] of [
  ['inicio', '/dashboard/estudiante'],
  ['entrenar', '/dashboard/estudiante/entrenar'],
  ['clases', '/dashboard/estudiante/clases'],
  ['progreso', '/dashboard/estudiante/progreso'],
  ['perfil', '/dashboard/estudiante/perfil'],
]) {
  errors.length = 0
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  const h1 = await page.locator('h1').allTextContents()
  const body = await page.locator('body').innerText()
  const ajustesLinks = await page.locator('a[href*="/dashboard/ajustes"]').count()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  console.log(JSON.stringify({ name, status: res?.status(), h1, hasAjustesLink: ajustesLinks > 0, overflow, errors: [...errors], excerpt: body.slice(0, 220).replace(/\n+/g, ' | ') }))
}

// Tap targets at 375
const mobile = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-student.json', viewport: { width: 375, height: 812 } })
const mp = await mobile.newPage()
await mp.goto('/dashboard/estudiante', { waitUntil: 'domcontentloaded' })
await mp.waitForTimeout(1000)
const bottomBoxes = await mp.locator('nav[aria-label="Navegación móvil del dashboard"] a').evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { text: el.textContent?.trim(), w: r.width, h: r.height } }))
await mp.locator('[aria-label="Abrir menú"]').click()
await mp.waitForTimeout(400)
const drawerBoxes = await mp.locator('nav[aria-label="Navegación del menú móvil"] a').evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return { text: el.textContent?.trim(), w: r.width, h: r.height } }))
console.log(JSON.stringify({ bottomBoxes, drawerBoxes }, null, 2))
await mobile.close()

// Guardian notification click
const gctx = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-guardian.json', viewport: { width: 1440, height: 900 } })
const gp = await gctx.newPage()
await gp.goto(`/dashboard/estudiante?estudiante=${fixtures.anaStudentId}`, { waitUntil: 'domcontentloaded' })
await gp.waitForTimeout(1200)
const bell = gp.locator('button[aria-label*="notificaciones"], button[aria-label="Notificaciones"]').first()
console.log('bell label', await bell.getAttribute('aria-label'))
await bell.click()
await gp.waitForTimeout(500)
const links = await gp.locator('a[href^="/dashboard/estudiante"]').evaluateAll((els) => els.map((el) => ({ text: (el.textContent ?? '').trim().slice(0, 80), href: el.getAttribute('href') })))
console.log('notification links', JSON.stringify(links, null, 2))
const target = gp.locator('a[href="/dashboard/estudiante/horario"]').filter({ hasText: 'Horario asignado (Ana)' })
console.log('target count', await target.count())
if (await target.count()) {
  await target.first().click()
  await gp.waitForTimeout(1800)
  const switcher = gp.locator('[aria-label^="Viendo el expediente de:"]').first()
  console.log('after notification', gp.url(), await switcher.getAttribute('aria-label').catch(() => null))
}
await gctx.close()
await browser.close()
