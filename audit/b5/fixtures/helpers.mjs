import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

export const root = process.cwd()
export const reportsDir = path.join(root, 'reports')
export const authDir = path.join(root, '.auth')
export const screenshotsDir = path.join(root, 'screenshots')

export function authFile(project, role) {
  return path.join(authDir, `${project}-${role}.json`)
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(reportsDir, file), 'utf8'))
}

export function writeJson(file, data) {
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(path.join(reportsDir, file), JSON.stringify(data, null, 2))
}

export async function contextFor(browser, project, role, baseURL, options = {}) {
  return browser.newContext({
    baseURL,
    storageState: authFile(project, role),
    locale: 'es-DO',
    timezoneId: 'America/Santo_Domingo',
    reducedMotion: 'reduce',
    ...options,
  })
}

export async function navLinks(page, selector) {
  return page.locator(selector).evaluateAll((els) =>
    els.map((el) => ({
      text: (el.textContent ?? '').trim().replace(/\s+/g, ' '),
      href: el.getAttribute('href'),
    })),
  )
}

export async function openMobileDrawer(page) {
  const menu = page.locator('[aria-label="Abrir menú"]')
  if ((await menu.count()) === 0) return []
  await menu.first().click()
  await page.waitForTimeout(300)
  return navLinks(page, 'nav[aria-label="Navegación del menú móvil"] a')
}

export async function dbQuery(sql, params = []) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    await client.end()
  }
}

export function fixtures() {
  return readJson('fixtures.json')
}
