import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { contextFor, screenshotsDir, writeJson } from '../fixtures/helpers.mjs'

const pagesByProject = {
  prod: [
    ['inicio', '/dashboard/estudiante'],
    ['clases-horario', '/dashboard/estudiante/horario'],
    ['clases-asistencia', '/dashboard/estudiante/asistencia'],
    ['progreso', '/dashboard/estudiante/progreso'],
    ['perfil', '/dashboard/estudiante/perfil'],
  ],
  new: [
    ['inicio', '/dashboard/estudiante'],
    ['clases', '/dashboard/estudiante/clases'],
    ['entrenar', '/dashboard/estudiante/entrenar'],
    ['progreso', '/dashboard/estudiante/progreso'],
    ['perfil', '/dashboard/estudiante/perfil'],
  ],
}
const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]

test.describe('Capturas de paridad visual', () => {
  test('capturas 375 / 768 / 1440', async ({ browser }, testInfo) => {
    test.setTimeout(240_000)
    const project = testInfo.project.name
    const ctx = await contextFor(browser, project, 'student', testInfo.project.use.baseURL)
    const page = await ctx.newPage()
    const rows = []
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      for (const [name, route] of pagesByProject[project]) {
        const errors = []
        const onError = (error) => errors.push(`pageerror: ${error.message}`)
        const onConsole = (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) }
        page.on('pageerror', onError)
        page.on('console', onConsole)
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1100)
        const outDir = path.join(screenshotsDir, project, String(viewport.width))
        fs.mkdirSync(outDir, { recursive: true })
        const file = path.join(outDir, `${name}.png`)
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
        const row = {
          project,
          viewport,
          name,
          route,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          h1: await page.locator('h1').allTextContents(),
          screenshot: path.relative(process.cwd(), file).replaceAll('\\', '/'),
          errors: [...errors],
        }
        rows.push(row)
        expect.soft(row.status, `${route} a ${viewport.width}px`).toBe(200)
        page.off('pageerror', onError)
        page.off('console', onConsole)
      }
    }
    writeJson(`screenshots-${project}.json`, rows)
    console.log(`\nCapturas ${project}: ${rows.length}`)
    await ctx.close()
  })
})
