import { chromium } from '@playwright/test'
import fs from 'node:fs'

const fixtures = JSON.parse(fs.readFileSync('audit/reports/fixtures.json', 'utf8'))
const browser = await chromium.launch()
const projects = [
  { name: 'prod', url: process.env.AUDIT_PROD_URL ?? 'http://127.0.0.1:3100' },
  { name: 'new', url: process.env.AUDIT_NEW_URL ?? 'http://127.0.0.1:3101' },
]

async function hrefs(page, selector) {
  return page.locator(selector).evaluateAll((els) => els.map((el) => ({ text: (el.textContent ?? '').trim(), href: el.getAttribute('href') })))
}

for (const project of projects) {
  for (const role of ['student', 'guardian']) {
    const suffix = role === 'guardian' ? `?estudiante=${fixtures.anaStudentId}` : ''
    for (const width of [1440, 375]) {
      const context = await browser.newContext({
        baseURL: project.url,
        storageState: `audit/.auth/${project.name}-${role}.json`,
        viewport: { width, height: width === 375 ? 812 : 900 },
      })
      const page = await context.newPage()
      await page.goto(`/dashboard/estudiante${suffix}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1200)
      const data = {
        project: project.name,
        role,
        width,
        sidebar: width === 1440 ? await hrefs(page, 'nav[aria-label="Navegación del dashboard"] a') : [],
        bottom: await hrefs(page, 'nav[aria-label="Navegación móvil del dashboard"] a'),
      }
      if (width === 375) {
        const menu = page.locator('[aria-label="Abrir menú"]')
        if (await menu.count()) {
          await menu.first().click()
          await page.waitForTimeout(400)
          data.drawer = await hrefs(page, 'nav[aria-label="Navegación del menú móvil"] a')
        } else {
          data.drawer = []
        }
      }
      console.log(JSON.stringify(data))
      await context.close()
    }
  }
}
await browser.close()
