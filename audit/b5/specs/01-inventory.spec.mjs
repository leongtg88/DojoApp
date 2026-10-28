import { test, expect } from '@playwright/test'
import { contextFor, fixtures, readJson, writeJson } from '../fixtures/helpers.mjs'

const fixturesData = fixtures()

function concreteRoute(route) {
  if (route.includes('[studentId]')) return route.replace('[studentId]', fixturesData.juanStudentId)
  if (route.includes('[')) return null
  return route
}

function alias(route) {
  return route.replace(/^\/admin/, '/dashboard/admin')
}

test.describe('Inventario de rutas del admin', () => {
  test('rutas antiguas y hubs nuevos', async ({ browser }, testInfo) => {
    const project = testInfo.project.name
    const routes = readJson(`routes-${project}.json`)
    const ctx = await contextFor(browser, project, 'admin', testInfo.project.use.baseURL)
    const rows = []

    for (const route of routes) {
      const concrete = concreteRoute(route)
      if (!concrete) continue
      for (const path of [concrete, alias(concrete)]) {
        const res = await ctx.request.get(path, { maxRedirects: 0, failOnStatusCode: false })
        const row = {
          project,
          route,
          path,
          status: res.status(),
          location: res.headers()['location'] ?? null,
        }
        rows.push(row)
      }
    }

    for (const extra of ['/admin/alumnos?docs=pending', '/admin/alumnos?docs=pending&selected=' + fixturesData.juanStudentId]) {
      const res = await ctx.request.get(extra, { maxRedirects: 0, failOnStatusCode: false })
      rows.push({ project, route: extra, path: extra, status: res.status(), location: res.headers()['location'] ?? null })
    }

    const hubRoutes = ['/admin/operacion', '/admin/configuracion', '/admin/comunicacion']
    for (const hub of hubRoutes) {
      if (!rows.some((row) => row.path === hub)) {
        const res = await ctx.request.get(hub, { maxRedirects: 0, failOnStatusCode: false })
        rows.push({ project, route: hub, path: hub, status: res.status(), location: res.headers()['location'] ?? null })
      }
    }
    for (const hub of hubRoutes) {
      const row = rows.find((item) => item.path === hub)
      if (project === 'new') {
        expect.soft(row?.status, `El hub ${hub} debe cargar`).toBe(200)
      } else {
        expect.soft(row?.status, `El hub ${hub} no debe existir en producción`).toBe(404)
      }
    }

    const oldStatic = rows.filter((row) => !hubRoutes.includes(row.path) && !row.route.includes('['))
    for (const row of oldStatic) {
      expect.soft(row.status, `${project} ${row.path} debe ser 200`).toBe(200)
    }

    writeJson(`inventory-${project}.json`, rows)
    console.log(`\nInventario ${project} (${rows.length}):`)
    for (const row of rows) console.log(`${row.status}\t${row.path}\t${row.location ?? ''}`)
    await ctx.close()
  })
})
