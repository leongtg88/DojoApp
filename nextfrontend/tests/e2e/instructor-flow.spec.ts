import { expect, test } from '@playwright/test'
import { credentials, login } from './helpers'

// Fase 8 · F8-02 — Flujo del instructor (requiere una cuenta de prueba sembrada).
const { email, password } = credentials('INSTRUCTOR')

test.describe('Flujo del instructor', () => {
  test.skip(!email || !password, 'Define E2E_INSTRUCTOR_EMAIL y E2E_INSTRUCTOR_PASSWORD para ejecutar este flujo.')

  test('entra y abre el pase de lista', async ({ page }) => {
    await login(page, email!, password!)

    await page.goto('/dashboard/instructor')
    await expect(page.getByRole('heading', { name: /Resumen de tatami/i })).toBeVisible()

    await page.goto('/dashboard/instructor/asistencia')
    await expect(page.getByRole('heading', { name: /Asistencia/i })).toBeVisible()
  })
})
