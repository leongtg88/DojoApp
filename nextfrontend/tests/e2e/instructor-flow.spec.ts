import { expect, test } from '@playwright/test'
import { credentials, login } from './helpers'

// Fase 8 · F8-02 — Flujo del instructor (requiere una cuenta de prueba sembrada).
const { email, password } = credentials('INSTRUCTOR')

const WEEKDAY_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const

/**
 * Día que se quiere ejercitar. `E2E_SIMULATED_WEEKDAY` permite correr la suite
 * como si fuera otro día (p. ej. `Miércoles` o `Domingo`); por defecto usa el
 * día de Santo Domingo.
 */
function targetWeekday(): string {
  if (process.env.E2E_SIMULATED_WEEKDAY) return process.env.E2E_SIMULATED_WEEKDAY
  const label = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    timeZone: 'America/Santo_Domingo',
  }).format(new Date())
  const normalized = label.charAt(0).toUpperCase() + label.slice(1)
  return WEEKDAY_LONG.find((weekday) => weekday === normalized) ?? normalized
}

test.describe('Flujo del instructor', () => {
  test.skip(!email || !password, 'Define E2E_INSTRUCTOR_EMAIL y E2E_INSTRUCTOR_PASSWORD para ejecutar este flujo.')

  test('entra y abre el pase de lista de una clase con alumnos', async ({ page }) => {
    const weekday = targetWeekday()
    await login(page, email!, password!)

    await page.goto('/dashboard/instructor')
    await expect(page).toHaveURL(/\/dashboard\/instructor\/asistencia/)
    await expect(page.getByRole('heading', { name: /Asistencia/i })).toBeVisible()

    // Elige explícitamente una clase del día simulado en vez de confiar en la
    // que el servidor resuelve por el día actual. El seed deja al menos un
    // alumno activo en una clase de cada día (INV-04).
    const trigger = page.getByRole('button', { name: 'Clase' })
    const options = page.getByRole('button', { name: new RegExp(`· ${weekday} \\d{2}:\\d{2} ·`) })
    // El primer clic puede perderse si React aún no hidrató: se reintenta solo
    // cuando el desplegable no está abierto, para no cerrarlo por error.
    await expect(async () => {
      if (!(await page.getByRole('dialog').isVisible())) await trigger.click()
      await expect(options.first()).toBeVisible({ timeout: 1_000 })
    }).toPass({ timeout: 20_000 })
    await options.first().click()

    await expect(page.getByText(/[1-9]\d* alumnos activos en esta clase/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Marcar todos presentes/i })).toBeVisible()
  })
})
