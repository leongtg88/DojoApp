import { expect, test } from '@playwright/test'
import { credentials, login } from './helpers'

// Ítem 1 · Un rol sin permiso es redirigido a /no-autorizado por la página/layout.
test.describe('Autorización por panel', () => {
  test('el alumno no entra al panel de admin ni al de instructor', async ({ page }) => {
    const { email, password } = credentials('USER')
    test.skip(!email || !password, 'Define E2E_USER_EMAIL y E2E_USER_PASSWORD.')
    await login(page, email!, password!)

    await page.goto('/dashboard/admin')
    await expect(page).toHaveURL(/\/no-autorizado/)
    await expect(page.getByRole('heading', { name: /No tienes acceso/i })).toBeVisible()

    await page.goto('/dashboard/instructor')
    await expect(page).toHaveURL(/\/no-autorizado/)
  })

  test('el admin no entra al portal del estudiante', async ({ page }) => {
    const { email, password } = credentials('ADMIN')
    test.skip(!email || !password, 'Define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD.')
    await login(page, email!, password!)

    await page.goto('/dashboard/estudiante')
    await expect(page).toHaveURL(/\/no-autorizado/)
  })

  test('el instructor no entra al panel de admin', async ({ page }) => {
    const { email, password } = credentials('INSTRUCTOR')
    test.skip(!email || !password, 'Define E2E_INSTRUCTOR_EMAIL y E2E_INSTRUCTOR_PASSWORD.')
    await login(page, email!, password!)

    await page.goto('/dashboard/admin')
    await expect(page).toHaveURL(/\/no-autorizado/)
  })
})
