import { test, expect } from '@playwright/test'
import { contextFor, dbQuery, fixtures, writeJson } from '../fixtures/helpers.mjs'

const f = fixtures()

async function readInbox(page) {
  const items = page.locator('section[aria-label="Pendientes de hoy"] li')
  const count = await items.count()
  const rows = []
  for (let i = 0; i < count; i += 1) {
    const link = items.nth(i).locator('a')
    const text = (await link.innerText()).split('\n').map((line) => line.trim()).filter(Boolean)
    const badge = await link.locator('span.shrink-0.rounded-full').last().textContent().catch(() => null)
    rows.push({
      title: text[0] ?? null,
      detail: text[1] ?? null,
      count: badge ? Number(badge.trim()) : 0,
      href: await link.getAttribute('href'),
    })
  }
  return rows
}

async function countsFor(schoolId) {
  const [enrollments] = await dbQuery(
    `select count(*)::int as n from "Enrollment" where "schoolId"=$1 and status='PENDING'`,
    [schoolId],
  )
  const [documents] = await dbQuery(
    `select count(*)::int as n from "StudentDocument" d join "Student" s on s.id=d."studentId" where s."schoolId"=$1 and d.status='PENDING' and s.status='ACTIVE'`,
    [schoolId],
  )
  const [noPlan] = await dbQuery(
    `select count(*)::int as n from "Student" where "schoolId"=$1 and "planId" is null`,
    [schoolId],
  )
  const [noSchedule] = await dbQuery(
    `select count(*)::int as n from "Student" s where s."schoolId"=$1 and not exists (select 1 from "ClassEnrollment" ce where ce."studentId"=s.id and ce.status='ACTIVE')`,
    [schoolId],
  )
  const [justifications] = await dbQuery(
    `select count(*)::int as n from "AbsenceJustification" j join "Student" s on s.id=j."studentId" where s."schoolId"=$1 and j.status='PENDING'`,
    [schoolId],
  )
  const [recoveries] = await dbQuery(
    `select count(*)::int as n from "OnlineRecovery" r join "Student" s on s.id=r."studentId" where s."schoolId"=$1 and r.status='SCHEDULED'`,
    [schoolId],
  )
  const [students] = await dbQuery(`select count(*)::int as n from "Student" where "schoolId"=$1`, [schoolId])
  const noPlanNames = await dbQuery(
    `select "firstName" || ' ' || "lastName" as name, status from "Student" where "schoolId"=$1 and "planId" is null order by name`,
    [schoolId],
  )
  const noScheduleNames = await dbQuery(
    `select s."firstName" || ' ' || s."lastName" as name, s.status from "Student" s where s."schoolId"=$1 and not exists (select 1 from "ClassEnrollment" ce where ce."studentId"=s.id and ce.status='ACTIVE') order by name`,
    [schoolId],
  )
  return {
    pendingEnrollments: enrollments.n,
    pendingDocuments: documents.n,
    noPlan: noPlan.n,
    noSchedule: noSchedule.n,
    pendingJustifications: justifications.n,
    onlineRecoveries: recoveries.n,
    students: students.n,
    noPlanNames,
    noScheduleNames,
  }
}

test.describe('Bandeja Hoy', () => {
  test('contadores y destinos con admin A', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Hoy solo se audita en la versión nueva')
    const baseURL = testInfo.project.use.baseURL
    const ctx = await contextFor(browser, 'new', 'admin', baseURL)
    const page = await ctx.newPage()
    page.setDefaultTimeout(10_000)
    await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const inbox = await readInbox(page)
    const db = await countsFor(f.schoolA)
    const navBadges = await page.locator('nav[aria-label="Navegación del dashboard"] a').evaluateAll((els) =>
      els.map((el) => ({ text: (el.textContent ?? '').trim().replace(/\s+/g, ' '), href: el.getAttribute('href') })),
    )

    const byTitle = Object.fromEntries(inbox.map((row) => [row.title, row]))
    const rowInscripciones = byTitle['Inscripciones pendientes']
    const rowDocumentos = byTitle['Documentos por revisar']
    const rowSinPlan = byTitle['Alumnos sin plan']
    const rowSinHorario = byTitle['Alumnos sin horario']

    expect.soft(rowInscripciones?.count, 'Contador de inscripciones vs BD').toBe(db.pendingEnrollments)
    expect.soft(rowDocumentos?.count, 'Contador de documentos vs BD').toBe(db.pendingDocuments)
    expect.soft(rowSinPlan?.count, 'Contador de sin plan vs BD').toBe(db.noPlan)
    expect.soft(rowSinHorario?.count, 'Contador de sin horario vs BD').toBe(db.noSchedule)

    // Brecha conocida: la fila de justificaciones no existe, aunque hay datos.
    expect.soft(byTitle['Justificaciones pendientes'], 'Hoy debe incluir justificaciones (hay datos en la BD)').toBeTruthy()
    // Reposiciones es dependencia de A6: no se exige como bug, solo se documenta.
    const hasRecoveryRow = Boolean(byTitle['Solicitudes de reposición'] || byTitle['Reposiciones pendientes'])

    const destinations = {}
    if (rowInscripciones) {
      const res = await page.goto(rowInscripciones.href, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(700)
      const body = await page.locator('body').innerText()
      destinations.inscripciones = { href: rowInscripciones.href, status: res?.status() ?? null, showsPending: body.includes('Pendiente A') || body.includes('pendiente-a@audit.test') }
      expect.soft(destinations.inscripciones.status, 'Inscripciones debe cargar').toBe(200)
      expect.soft(destinations.inscripciones.showsPending, 'Inscripciones debe mostrar la solicitud pendiente').toBe(true)
    }
    if (rowDocumentos) {
      const res = await page.goto(rowDocumentos.href, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(700)
      const body = await page.locator('body').innerText()
      destinations.documentos = { href: rowDocumentos.href, status: res?.status() ?? null, showsPending: body.includes('documento-a.pdf') || body.includes('Documento') }
      expect.soft(destinations.documentos.status, 'Documentos debe cargar').toBe(200)
    }
    if (rowSinPlan) {
      const res = await page.goto(rowSinPlan.href, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(700)
      const body = await page.locator('body').innerText()
      destinations.sinPlan = { href: rowSinPlan.href, status: res?.status() ?? null, hasPlanFilter: /plan=/.test(rowSinPlan.href ?? ''), bodyHead: body.slice(0, 120) }
      expect.soft(destinations.sinPlan.hasPlanFilter, 'La fila de sin plan debe filtrar la lista').toBe(true)
    }
    if (rowSinHorario) {
      const res = await page.goto(rowSinHorario.href, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(700)
      const body = await page.locator('body').innerText()
      destinations.sinHorario = { href: rowSinHorario.href, status: res?.status() ?? null, hasStudentFilter: /alumnos/.test(rowSinHorario.href ?? ''), bodyHead: body.slice(0, 120) }
      expect.soft(destinations.sinHorario.hasStudentFilter, 'La fila de sin horario debe llevar a la lista de alumnos').toBe(true)
    }

    const result = {
      inbox,
      db,
      navBadges,
      destinations,
      hasRecoveryRow,
      a6Dependency: !hasRecoveryRow,
    }
    writeJson('hoy-admin-a.json', result)
    console.log('\nHoy A:', JSON.stringify(result, null, 2))
    await ctx.close()
  })

  test('contadores aislados del admin B', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'new', 'Hoy solo se audita en la versión nueva')
    const baseURL = testInfo.project.use.baseURL
    const ctx = await contextFor(browser, 'new', 'adminB', baseURL)
    const page = await ctx.newPage()
    page.setDefaultTimeout(10_000)
    await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1200)
    const inbox = await readInbox(page)
    const body = await page.locator('body').innerText()
    const db = await countsFor(f.schoolB)
    const byTitle = Object.fromEntries(inbox.map((row) => [row.title, row]))

    expect.soft(byTitle['Inscripciones pendientes']?.count, 'B: inscripciones vs BD').toBe(db.pendingEnrollments)
    expect.soft(byTitle['Documentos por revisar']?.count, 'B: documentos vs BD').toBe(db.pendingDocuments)
    expect.soft(byTitle['Alumnos sin plan']?.count, 'B: sin plan vs BD').toBe(db.noPlan)
    expect.soft(byTitle['Alumnos sin horario']?.count, 'B: sin horario vs BD').toBe(db.noSchedule)
    expect.soft(body.includes('Pendiente A'), 'B no debe ver la inscripción de A').toBe(false)
    expect.soft(body.includes('Sin Plan Con Horario'), 'B no debe ver alumnos de A').toBe(false)
    expect.soft(body.includes('documento-a.pdf'), 'B no debe ver documentos de A').toBe(false)

    const result = { inbox, db, leaksA: { pendingA: body.includes('Pendiente A'), sinPlanA: body.includes('Sin Plan Con Horario'), docA: body.includes('documento-a.pdf') } }
    writeJson('hoy-admin-b.json', result)
    console.log('\nHoy B:', JSON.stringify(result, null, 2))
    await ctx.close()
  })
})
