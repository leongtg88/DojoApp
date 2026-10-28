import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { contextFor, readJson, writeJson } from '../fixtures/helpers.mjs'

const inventory = JSON.parse(fs.readFileSync('reports/link-inventory.json', 'utf8'))
const techniqueTypes = new Set(['TECHNIQUES_ASSIGNED', 'TECHNIQUES_REMOVED', 'KATAS_UNLOCKED'])

function roleFor(link) {
  if (link.startsWith('/dashboard/admin')) return 'admin'
  if (link.startsWith('/dashboard/instructor')) return 'instructor'
  return 'student'
}

test.describe('Enlaces generados por notificaciones, correo y WhatsApp', () => {
  test('todos los enlaces del inventario resuelven con el rol destinatario', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'El inventario se valida contra la versión nueva')
    const contexts = new Map()
    const rows = []
    for (const item of inventory) {
      if (!item.link) continue
      const role = roleFor(item.link)
      if (!contexts.has(role)) {
        contexts.set(role, await contextFor(browser, 'new', role, testInfo.project.use.baseURL))
      }
      const ctx = contexts.get(role)
      const res = await ctx.request.get(item.link, { maxRedirects: 0, failOnStatusCode: false })
      const row = { type: item.type, link: item.link, role, status: res.status(), location: res.headers()['location'] ?? null }
      rows.push(row)
      expect.soft(row.status, `${item.type} -> ${item.link} con rol ${role}`).toBe(200)
      if (techniqueTypes.has(item.type)) {
        expect.soft(item.link, `${item.type} debería llevar a Entrenar (mapa UX-B1)`).toBe('/dashboard/estudiante/entrenar')
      }
    }
    for (const ctx of contexts.values()) await ctx.close()
    writeJson('links-inventory.json', rows)
    console.log('\nEnlaces del inventario:', JSON.stringify(rows, null, 2))
  })

  test('enlaces históricos guardados con rutas viejas', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const ctx = await contextFor(browser, 'new', 'student', testInfo.project.use.baseURL)
    const page = await ctx.newPage()
    const rows = []
    for (const path of ['/dashboard/estudiante/horario', '/dashboard/estudiante/asistencia']) {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForURL(/\/dashboard\/estudiante\/clases/, { timeout: 15_000 }).catch(() => {})
      rows.push({ path, httpStatus: res?.status() ?? null, finalUrl: page.url(), h1: await page.locator('h1').allTextContents() })
      expect.soft(page.url()).toContain('/dashboard/estudiante/clases')
    }
    writeJson('links-historical.json', rows)
    console.log('\nEnlaces históricos:', JSON.stringify(rows, null, 2))
    await ctx.close()
  })

  test('API de notificaciones para el tutor', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const guardian = await contextFor(browser, 'new', 'guardian', testInfo.project.use.baseURL)
    const student = await contextFor(browser, 'new', 'student', testInfo.project.use.baseURL)
    const guardianGet = await guardian.request.get('/api/dashboard/notifications?limit=6', { failOnStatusCode: false })
    const guardianPatch = await guardian.request.patch('/api/dashboard/notifications', { failOnStatusCode: false })
    const studentGet = await student.request.get('/api/dashboard/notifications?limit=6', { failOnStatusCode: false })
    const row = {
      guardianGet: { status: guardianGet.status(), body: await guardianGet.text() },
      guardianPatch: { status: guardianPatch.status(), body: await guardianPatch.text() },
      studentGet: { status: studentGet.status() },
    }
    writeJson('links-notification-api.json', row)
    console.log('\nAPI notificaciones:', JSON.stringify(row, null, 2))
    expect.soft(row.guardianGet.status, 'El tutor debería poder listar sus notificaciones').toBe(200)
    expect.soft(row.guardianPatch.status, 'El tutor debería poder marcar las notificaciones').toBe(200)
    expect.soft(row.studentGet.status, 'El alumno debe poder listar sus notificaciones').toBe(200)
    await guardian.close()
    await student.close()
  })

  test('campana del alumno: notificación de técnicas', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const ctx = await contextFor(browser, 'new', 'student', testInfo.project.use.baseURL)
    const page = await ctx.newPage()
    await page.goto('/dashboard/estudiante', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const bell = page.locator('button[aria-label*="notificaciones"]').first()
    const bellLabel = await bell.getAttribute('aria-label')
    await bell.click()
    await page.waitForTimeout(800)
    const target = page.locator('a[href="/dashboard/estudiante/progreso"]').filter({ hasText: 'Técnicas nuevas para practicar' })
    const count = await target.count()
    let finalUrl = null
    let h1 = []
    if (count > 0) {
      await target.first().click()
      await page.waitForTimeout(1200)
      finalUrl = page.url()
      h1 = await page.locator('h1').allTextContents()
    }
    const row = { bellLabel, notificationCount: count, finalUrl, h1 }
    writeJson('links-bell-student.json', row)
    console.log('\nCampana del alumno:', JSON.stringify(row, null, 2))
    expect.soft(count, 'La campana debe mostrar la notificación sembrada').toBeGreaterThan(0)
    expect.soft(finalUrl ?? '', 'La notificación de técnicas debería llevar a Entrenar').toContain('/dashboard/estudiante/entrenar')
    expect.soft(h1).toContain('Entrenar')
    await ctx.close()
  })
})
