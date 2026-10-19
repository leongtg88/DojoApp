import { expect, test, type Page } from '@playwright/test'
import { credentials, login } from './helpers'

// Fase 8 · F8-03 — Flujo del administrador (requiere una cuenta de prueba sembrada).
const { email, password } = credentials('ADMIN')

/** Abre el calendario del DatePicker, fija mes/año y elige el día. */
async function pickBirthDate(page: Page, id: string, year: string, monthLabel: string, day: number) {
  await page.click(`#${id}`)
  await page.getByRole('combobox', { name: 'Elegir el año' }).selectOption(year)
  await page.getByRole('combobox', { name: 'Elegir el mes' }).selectOption({ label: monthLabel })
  await page.getByRole('button', { name: new RegExp(`^.+ ${day} de ${monthLabel} de ${year}$`) }).click()
}

test.describe('Flujo del administrador', () => {
  test.skip(!email || !password, 'Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD para ejecutar este flujo.')

  test('entra y abre el padrón de alumnos y el catálogo', async ({ page }) => {
    await login(page, email!, password!)

    await page.goto('/dashboard/admin')
    await expect(page.getByRole('navigation', { name: 'Navegación del dashboard' }).getByRole('link', { name: 'Alumnos' })).toBeVisible()

    await page.goto('/dashboard/admin/alumnos')
    await expect(page.getByRole('button', { name: 'Nuevo alumno' })).toBeVisible()

    await page.goto('/dashboard/admin/grados-y-katas')
    await expect(page.getByRole('heading', { name: /Grados y técnicas/i })).toBeVisible()
  })

  test('crea un alumno con plan y aparece en el padrón', async ({ page }) => {
    await login(page, email!, password!)
    await page.goto('/dashboard/admin/alumnos')

    await page.getByRole('button', { name: 'Nuevo alumno' }).click()

    const suffix = Date.now().toString().slice(-6)
    await page.fill('#student-first-name', 'E2E')
    await page.fill('#student-last-name', `Prueba${suffix}`)
    await pickBirthDate(page, 'student-dob', '2000', 'mayo', 15)

    // Espera a que el modal cargue sucursales/planes/horarios.
    await page.waitForFunction(() => {
      const branch = document.querySelector('#student-branch') as HTMLSelectElement | null
      return Boolean(branch && Array.from(branch.options).some((option) => option.value))
    })
    await page.selectOption('#student-branch', { index: 1 })

    const plan = page.locator('#student-plan')
    if ((await plan.locator('option').count()) > 1) await plan.selectOption({ index: 1 })

    await page.getByRole('button', { name: 'Registrar alumno' }).click()

    await expect(page.getByRole('button', { name: 'Registrar alumno' })).toBeHidden()
    await page.fill('#admin-student-search', `Prueba${suffix}`)
    await expect(page.getByText(`E2E Prueba${suffix}`).filter({ visible: true }).first()).toBeVisible()
  })
})
