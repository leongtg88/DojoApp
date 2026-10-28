import { chromium } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const browser = await chromium.launch()
const context = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-student.json' })
const page = await context.newPage()
const res = await page.goto('/dashboard/estudiante/horario', { waitUntil: 'domcontentloaded' })
console.log('initial', res?.status(), page.url())
for (const delay of [500, 1500, 3000]) {
  await page.waitForTimeout(delay)
  console.log(`after ${delay}ms`, page.url(), await page.locator('h1').allTextContents())
}
const body = await page.content()
console.log('has clases', body.includes('/dashboard/estudiante/clases'))
console.log('has NEXT_REDIRECT', body.includes('NEXT_REDIRECT'))
console.log('has no-autorizado', body.includes('no-autorizado'))
console.log('text', (await page.locator('body').innerText()).slice(0, 500))
await browser.close()
