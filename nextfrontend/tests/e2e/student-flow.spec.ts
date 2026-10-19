import { expect, test } from '@playwright/test'
import { credentials, login } from './helpers'

// Fase 8 · F8-01 — Flujo del alumno (requiere una cuenta de prueba sembrada).
const { email, password } = credentials('USER')

test.describe('Flujo del alumno', () => {
  test.skip(!email || !password, 'Define E2E_USER_EMAIL y E2E_USER_PASSWORD para ejecutar este flujo.')

  test('entra y consulta su resumen, progreso y asistencia', async ({ page }) => {
    await login(page, email!, password!)

    await page.goto('/dashboard/estudiante')
    await expect(page.getByRole('heading', { name: /Bienvenid/i })).toBeVisible()

    await page.goto('/dashboard/estudiante/progreso')
    await expect(page.getByRole('heading', { name: /Katas y grado/i })).toBeVisible()

    await page.goto('/dashboard/estudiante/asistencia')
    await expect(page.getByRole('heading', { level: 1, name: /Asistencia/i })).toBeVisible()
  })

  test('reporta una inasistencia y la ve confirmada', async ({ page }) => {
    await login(page, email!, password!)
    await page.goto('/dashboard/estudiante/asistencia')

    await page.locator('summary').filter({ hasText: 'Reportar una inasistencia' }).click()
    await page.selectOption('#absence-class', { index: 0 })
    await page.fill('#absence-reason', 'Prueba E2E: cita médica')
    await page.getByRole('button', { name: 'Reportar inasistencia' }).click()

    await expect(page.getByText(/Motivo enviado/)).toBeVisible()
  })
})
