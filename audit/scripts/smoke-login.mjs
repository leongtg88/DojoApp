import { chromium } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const email = process.env.STUDENT_EMAIL ?? 'alumno@test.com'
const password = process.env.STUDENT_PASSWORD
if (!password) throw new Error('Falta STUDENT_PASSWORD')

const browser = await chromium.launch()
const context = await browser.newContext({ baseURL, locale: 'es-DO', timezoneId: 'America/Santo_Domingo' })
const page = await context.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('console.error:', msg.text())
})
await page.goto('/login', { waitUntil: 'domcontentloaded' })
await page.fill('#login-email-input', email)
await page.fill('#login-password-input', password)
await page.click('#btn-submit-login')
await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
console.log('OK', page.url())
await page.screenshot({ path: 'audit/reports/login-smoke.png', fullPage: true })
await context.storageState({ path: 'audit/.auth/new-student.json' })
await browser.close()
