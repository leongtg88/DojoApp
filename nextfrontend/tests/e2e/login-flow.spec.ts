import { expect, test } from '@playwright/test'
import { credentials } from './helpers'

// Login: credenciales incorrectas y varios intentos fallidos no dan acceso.
// Usa un correo inexistente para no bloquear (lockout) las cuentas sembradas.
const { email, password } = credentials('USER')
const UNKNOWN = 'noexiste-e2e@test.dev'
const WRONG_PASSWORD = 'ClaveIncorrecta123'

test.describe('Login', () => {
  test.skip(!email || !password, 'Define E2E_USER_EMAIL y E2E_USER_PASSWORD para ejecutar este flujo.')

  test('credenciales incorrectas no dan acceso', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#login-email-input', UNKNOWN)
    await page.fill('#login-password-input', WRONG_PASSWORD)
    await page.click('#btn-submit-login')

    await expect(page).toHaveURL(/\/login/)
  })

  test('varios intentos fallidos siguen sin dar acceso', async ({ page }) => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await page.goto('/login')
      await page.fill('#login-email-input', UNKNOWN)
      await page.fill('#login-password-input', WRONG_PASSWORD)
      await page.click('#btn-submit-login')
      await expect(page).toHaveURL(/\/login/)
    }
  })
})
