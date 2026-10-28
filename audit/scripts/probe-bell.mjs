import { chromium } from '@playwright/test'
import fs from 'node:fs'

const baseURL = process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101'
const fixtures = JSON.parse(fs.readFileSync('audit/reports/fixtures.json', 'utf8'))
const browser = await chromium.launch()
const context = await browser.newContext({ baseURL, storageState: 'audit/.auth/new-guardian.json', viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto(`/dashboard/estudiante?estudiante=${fixtures.anaStudentId}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(1500)
const bell = page.locator('button[aria-label*="notificaciones"]').first()
await bell.click()
await page.waitForTimeout(1500)
const text = await page.locator('body').innerText()
console.log(text.slice(text.indexOf('Notificaciones'), text.indexOf('Notificaciones') + 1200))
const items = await page.locator('a').evaluateAll((els) => els.map((el) => ({ text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90), href: el.getAttribute('href') })).filter((x) => x.href?.includes('estudiante')))
console.log(JSON.stringify(items, null, 2))
await browser.close()
