import { test, expect } from '@playwright/test'
import { contextFor, navLinks, openMobileDrawer, writeJson } from '../fixtures/helpers.mjs'

test.describe('Paridad funcional y clics del admin', () => {
  test('menú, hubs y accesos', async ({ browser }, testInfo) => {
    const project = testInfo.project.name
    const baseURL = testInfo.project.use.baseURL
    const rows = { project, desktop: {}, mobile: {}, hubs: [], checks: {} }

    const desktop = await contextFor(browser, project, 'admin', baseURL, { viewport: { width: 1440, height: 900 } })
    const page = await desktop.newPage()
    page.setDefaultTimeout(8_000)
    await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    rows.desktop.sidebar = await navLinks(page, 'nav[aria-label="Navegación del dashboard"] a')
    rows.desktop.roleLabel = (await page.locator('aside p.text-accent').first().textContent().catch(() => null))?.trim() ?? null

    if (project === 'new') {
      const labels = rows.desktop.sidebar.map((item) => item.text.replace(/\d+/g, '').trim())
      expect.soft(labels.slice(0, 5), 'Las 5 secciones del admin').toEqual([
        'Hoy',
        'Alumnos',
        'Operación',
        'Configuración',
        'Comunicación',
      ])
      expect.soft(rows.desktop.sidebar.length, 'El sidebar incluye Seguridad además de las 5 secciones').toBe(6)

      for (const hub of [
        ['Operación', '/dashboard/admin/operacion'],
        ['Configuración', '/dashboard/admin/configuracion'],
        ['Comunicación', '/dashboard/admin/comunicacion'],
      ]) {
        await page.goto(hub[1], { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(700)
        const cards = await page.locator('main .grid a[href^="/dashboard/admin"]').evaluateAll((els) =>
          els.map((el) => ({ text: (el.textContent ?? '').trim().replace(/\s+/g, ' '), href: el.getAttribute('href') })),
        )
        rows.hubs.push({ hub: hub[0], path: hub[1], cards })
        expect.soft(cards.length, `El hub ${hub[0]} debe tener tarjetas`).toBeGreaterThan(0)
      }

      await page.goto('/dashboard/admin/alumnos', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(900)
      rows.checks.alumnosInscripcionesLink = await page.locator('a[href="/dashboard/admin/inscripciones"]').count()
      expect.soft(rows.checks.alumnosInscripcionesLink, 'Alumnos debe conservar el acceso a Inscripciones').toBeGreaterThan(0)

      await page.goto('/dashboard/admin/grados-y-katas', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(900)
      const gradosBody = (await page.locator('body').innerText()).toLowerCase()
      rows.checks.tecnicasEnGrados = gradosBody.includes('técnica') || gradosBody.includes('tecnica')
      expect.soft(rows.checks.tecnicasEnGrados, 'Grados y katas debe incluir técnicas').toBe(true)
    }

    const mobile = await contextFor(browser, project, 'admin', baseURL, { viewport: { width: 375, height: 812 } })
    const mp = await mobile.newPage()
    mp.setDefaultTimeout(8_000)
    await mp.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' })
    await mp.waitForTimeout(1000)
    rows.mobile.bottom = await navLinks(mp, 'nav[aria-label="Navegación móvil del dashboard"] a')
    rows.mobile.drawer = await openMobileDrawer(mp)
    rows.mobile.overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    rows.mobile.bottomLabels = await mp.locator('nav[aria-label="Navegación móvil del dashboard"] a span.max-w-16').evaluateAll((els) =>
      els.map((el) => ({
        text: (el.textContent ?? '').trim(),
        truncated: el.scrollWidth > el.clientWidth,
      })),
    )
    rows.mobile.badges = await mp.locator('nav[aria-label="Navegación móvil del dashboard"] a').evaluateAll((els) =>
      els.map((el) => ({ text: (el.textContent ?? '').trim().replace(/\s+/g, ' '), hasNumber: /\d/.test(el.textContent ?? '') })),
    )

    if (project === 'new') {
      expect.soft(rows.mobile.bottom.length, 'La barra inferior debe tener 5 ítems').toBe(5)
      expect.soft(rows.mobile.bottomLabels.map((item) => item.text), 'Etiquetas de la barra inferior').toEqual([
        'Hoy',
        'Alumnos',
        'Operación',
        'Configuración',
        'Comunicación',
      ])
      expect.soft(rows.mobile.drawer.length, 'El drawer debe tener 5 secciones + Seguridad').toBe(6)
      expect.soft(rows.mobile.overflow, 'Sin scroll horizontal a 375 px').toBe(false)
    }

    writeJson(`parity-${project}.json`, rows)
    console.log(`\nParidad ${project}:`, JSON.stringify(rows, null, 2))
    await desktop.close()
    await mobile.close()
  })
})
