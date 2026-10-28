import { chromium } from '@playwright/test'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const browser = await chromium.launch()
const context = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-student.json' })
const page = await context.newPage()
const res = await page.goto('/dashboard/estudiante/horario', { waitUntil: 'domcontentloaded' })
console.log('page.goto status', res?.status(), 'url', page.url())
console.log('h1', await page.locator('h1').allTextContents())
const raw = await context.request.get('/dashboard/estudiante/horario', { maxRedirects: 0, failOnStatusCode: false })
console.log('request status', raw.status())
console.log('headers', JSON.stringify(raw.headers(), null, 2))
const body = await raw.text()
console.log('body head', body.slice(0, 800))
await browser.close()
