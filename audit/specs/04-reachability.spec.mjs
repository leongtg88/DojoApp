import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { contextFor, navLinks, openMobileDrawer, writeJson } from '../fixtures/helpers.mjs'

const fixtures = JSON.parse(fs.readFileSync('reports/fixtures.json', 'utf8'))
const suffixFor = (role) => (role === 'guardian' ? `?estudiante=${fixtures.anaStudentId}` : '')

const pathsByProject = {
  prod: [
    ['inicio', '/dashboard/estudiante'],
    ['perfil', '/dashboard/estudiante/perfil'],
    ['progreso', '/dashboard/estudiante/progreso'],
    ['horario', '/dashboard/estudiante/horario'],
    ['asistencia', '/dashboard/estudiante/asistencia'],
  ],
  new: [
    ['inicio', '/dashboard/estudiante'],
    ['entrenar', '/dashboard/estudiante/entrenar'],
    ['clases', '/dashboard/estudiante/clases'],
    ['progreso', '/dashboard/estudiante/progreso'],
    ['perfil', '/dashboard/estudiante/perfil'],
  ],
}

const contentMarkers = {
  inicio: ['Bienvenid'],
  entrenar: ['Entrenar', 'Registrar'],
  clases: ['Mis clases', 'Reportar una inasistencia'],
  progreso: ['Grado y examen', 'Criterios de postulación'],
  perfil: ['Documentos'],
}

function routeFiles() {
  const base = path.resolve('..', 'nextfrontend', 'app', '(dashboard)', 'estudiante')
  const routes = []
  const walk = (dir, rel = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const nextRel = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(full, nextRel)
      else if (entry.name === 'page.tsx') routes.push(`/dashboard/estudiante${rel ? `/${rel}` : ''}`)
    }
  }
  walk(base)
  return routes.sort()
}

test.describe('Alcanzabilidad del portal del alumno', () => {
  for (const role of ['student', 'guardian']) {
    test(`navegación y objetivos táctiles · ${role}`, async ({ browser }, testInfo) => {
      const project = testInfo.project.name
      const baseURL = testInfo.project.use.baseURL
      const suffix = suffixFor(role)
      const rows = { project, role, desktop: {}, mobile: {}, tapTargets: {} }

      const desktop = await contextFor(browser, project, role, baseURL, { viewport: { width: 1440, height: 900 } })
      const page = await desktop.newPage()
      page.setDefaultTimeout(8_000)
      await page.goto(`/dashboard/estudiante${suffix}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
      rows.desktop.sidebar = await navLinks(page, 'nav[aria-label="Navegación del dashboard"] a')
      rows.desktop.roleLabel = (await page.locator('aside p.text-accent').first().textContent().catch(() => null))?.trim() ?? null
      if (role === 'guardian') {
        const switcher = page.locator('[aria-label^="Viendo el expediente de:"]').first()
        rows.desktop.switcherCount = await switcher.count()
        rows.desktop.switcherLabel = rows.desktop.switcherCount > 0 ? await switcher.getAttribute('aria-label') : null
      }

      if (project === 'new') {
        const labels = rows.desktop.sidebar.map((item) => item.text)
        expect.soft(rows.desktop.sidebar.length, 'El sidebar debe tener 5 destinos (la guía pide los mismos 5)').toBe(5)
        expect.soft(labels, 'Etiquetas del sidebar').toEqual(['Inicio', 'Entrenar', 'Clases', 'Progreso', 'Perfil'])
        if (role === 'guardian') {
          expect.soft(rows.desktop.sidebar.every((item) => item.href?.includes(`estudiante=${fixtures.anaStudentId}`)), 'El contexto del hijo debe conservarse en el sidebar').toBe(true)
          expect.soft(rows.desktop.switcherCount, 'El selector familiar debe estar visible').toBeGreaterThan(0)
        }
      }

      const mobile = await contextFor(browser, project, role, baseURL, { viewport: { width: 375, height: 812 } })
      const mp = await mobile.newPage()
      mp.setDefaultTimeout(8_000)
      await mp.goto(`/dashboard/estudiante${suffix}`, { waitUntil: 'domcontentloaded' })
      await mp.waitForTimeout(1000)
      rows.mobile.bottom = await navLinks(mp, 'nav[aria-label="Navegación móvil del dashboard"] a')
      rows.mobile.drawer = await openMobileDrawer(mp)
      rows.mobile.overflow = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      rows.tapTargets.bottom = await mp.locator('nav[aria-label="Navegación móvil del dashboard"] a').evaluateAll((els) =>
        els.map((el) => { const r = el.getBoundingClientRect(); return { text: (el.textContent ?? '').trim(), width: r.width, height: r.height } }),
      )
      rows.tapTargets.drawer = await mp.locator('nav[aria-label="Navegación del menú móvil"] a').evaluateAll((els) =>
        els.map((el) => { const r = el.getBoundingClientRect(); return { text: (el.textContent ?? '').trim(), width: r.width, height: r.height } }),
      )

      if (project === 'new') {
        const labels = rows.mobile.bottom.map((item) => item.text)
        expect.soft(rows.mobile.bottom.length, 'La barra inferior debe tener como máximo 5 ítems').toBeLessThanOrEqual(5)
        expect.soft(labels, 'Etiquetas de la barra inferior').toEqual(['Inicio', 'Entrenar', 'Clases', 'Progreso', 'Perfil'])
        expect.soft(rows.mobile.drawer.length, 'El drawer debe tener los mismos 5 destinos').toBe(5)
        expect.soft(rows.mobile.overflow, 'Sin scroll horizontal a 375 px').toBe(false)
        expect.soft(rows.tapTargets.bottom.every((box) => box.height >= 44), 'Objetivos táctiles de la barra inferior >= 44 px').toBe(true)
        expect.soft(rows.tapTargets.drawer.every((box) => box.height >= 44), 'Objetivos táctiles del drawer >= 44 px').toBe(true)
      }

      writeJson(`reachability-nav-${project}-${role}.json`, rows)
      console.log(`\nNavegación ${project}/${role}:`, JSON.stringify(rows, null, 2))
      await desktop.close()
      await mobile.close()
    })

    test(`contenido de los destinos · ${role}`, async ({ browser }, testInfo) => {
      const project = testInfo.project.name
      const ctx = await contextFor(browser, project, role, testInfo.project.use.baseURL, { viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      page.setDefaultNavigationTimeout(20_000)
      page.setDefaultTimeout(8_000)
      const rows = []
      for (const [name, route] of pathsByProject[project]) {
        const errors = []
        const onError = (error) => errors.push(`pageerror: ${error.message}`)
        const onConsole = (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`) }
        page.on('pageerror', onError)
        page.on('console', onConsole)
        const response = await page.goto(`${route}${suffixFor(role)}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1200)
        const body = await page.locator('body').innerText()
        const h1 = await page.locator('h1').allTextContents()
        const row = {
          name,
          route,
          status: response?.status() ?? null,
          h1,
          markers: (contentMarkers[name] ?? []).map((marker) => ({ marker, present: body.includes(marker) })),
          mainAjustes: await page.locator('main a[href*="/dashboard/ajustes"]').count(),
          errors: [...errors],
          overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
        }
        rows.push(row)
        if (project === 'new') {
          expect.soft(row.status, `${name} debe cargar`).toBe(200)
          expect.soft(row.overflow, `${name} sin scroll horizontal`).toBe(false)
          for (const marker of row.markers) expect.soft(marker.present, `${name}: falta "${marker.marker}"`).toBe(true)
          expect.soft(row.errors, `${name}: errores de consola`).toEqual([])
        }
        page.off('pageerror', onError)
        page.off('console', onConsole)
      }
      writeJson(`reachability-content-${project}-${role}.json`, rows)
      console.log(`\nContenido ${project}/${role}:`, JSON.stringify(rows, null, 2))
      await ctx.close()
    })
  }

  test('URL canónica /estudiante con tutor', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const ctx = await contextFor(browser, 'new', 'guardian', testInfo.project.use.baseURL, { viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    page.setDefaultTimeout(8_000)
    await page.goto(`/estudiante?estudiante=${fixtures.anaStudentId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    const rows = {
      switcherCount: await page.locator('[aria-label^="Viendo el expediente de:"]').count(),
      switcherLabel: await page.locator('[aria-label^="Viendo el expediente de:"]').first().getAttribute('aria-label').catch(() => null),
      roleLabel: (await page.locator('aside p.text-accent').first().textContent().catch(() => null))?.trim() ?? null,
      navHrefs: (await navLinks(page, 'nav[aria-label="Navegación del dashboard"] a')).map((item) => item.href),
    }
    writeJson('reachability-canonical.json', rows)
    console.log('\nCanónica:', JSON.stringify(rows, null, 2))
    expect.soft(rows.switcherCount, 'En /estudiante el tutor debe conservar el selector').toBeGreaterThan(0)
    expect.soft(rows.navHrefs.every((href) => href?.includes(`estudiante=${fixtures.anaStudentId}`)), 'En /estudiante los enlaces deben conservar el hijo').toBe(true)
    expect.soft(rows.roleLabel, 'La etiqueta del tutor en /estudiante').toBe('Estudiante')
    await ctx.close()
  })

  test('páginas huérfanas', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Solo aplica a la versión nueva')
    const ctx = await contextFor(browser, 'new', 'student', testInfo.project.use.baseURL, { viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    page.setDefaultTimeout(8_000)
    await page.goto('/dashboard/estudiante', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    const linked = new Set((await navLinks(page, 'nav[aria-label="Navegación del dashboard"] a')).map((item) => (item.href ?? '').split('?')[0]))
    const legacy = new Set(['/dashboard/estudiante/asistencia', '/dashboard/estudiante/horario'])
    const allRoutes = routeFiles()
    const orphans = allRoutes.filter((route) => route !== '/dashboard/estudiante' && !linked.has(route) && !legacy.has(route))
    const rows = { allRoutes, linked: [...linked], legacy: [...legacy], orphans }
    writeJson('reachability-orphans.json', rows)
    console.log('\nHuérfanas:', JSON.stringify(rows, null, 2))
    expect.soft(orphans, 'No debe haber páginas huérfanas').toEqual([])
    await ctx.close()
  })
})
