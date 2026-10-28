import { chromium } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const browser = await chromium.launch()
const context = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-student.json', viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto('/dashboard/estudiante', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
const bell = page.locator('button[aria-label*="notificaciones"]').first()
console.log('bell', await bell.getAttribute('aria-label'))
await bell.click()
await page.waitForTimeout(1500)
const notifText = await page.locator('body').innerText()
const idx = notifText.indexOf('Notificaciones')
console.log(notifText.slice(idx, idx + 700))
const target = page.locator('a[href="/dashboard/estudiante/progreso"]').filter({ hasText: 'Técnicas nuevas para practicar' })
console.log('target count', await target.count())
if (await target.count()) {
  await target.first().click()
  await page.waitForTimeout(1500)
  console.log('after click', page.url(), await page.locator('h1').allTextContents())
}
await browser.close()
