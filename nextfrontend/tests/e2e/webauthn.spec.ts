import { expect, test, type Page } from '@playwright/test'

// Flujo completo de ingreso con huella usando el autenticador virtual de
// Chromium (CDP). Se omite si no hay credenciales de un alumno de prueba con
// acceso (verifica que exista un usuario con expediente de inscripción).
const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD

async function addVirtualAuthenticator(page: Page) {
  const client = await page.context().newCDPSession(page)
  await client.send('WebAuthn.enable')
  const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })
  return { client, authenticatorId }
}

test.describe('Ingreso con huella (WebAuthn)', () => {
  test.skip(!email || !password, 'Define E2E_USER_EMAIL y E2E_USER_PASSWORD para ejecutar estas pruebas.')

  test('registra una passkey y luego entra sin contraseña', async ({ page }) => {
    // El autenticador virtual debe existir antes de abrir el login para que la
    // detección de soporte muestre el botón de huella.
    const { client, authenticatorId } = await addVirtualAuthenticator(page)

    try {
      // 1) Inicio de sesión con contraseña.
      await page.goto('/login')
      await page.fill('#login-email-input', email!)
      await page.fill('#login-password-input', password!)
      await page.click('#btn-submit-login')
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

      // 2) Registro de la passkey desde Ajustes → Seguridad.
      await page.goto('/dashboard/ajustes')
      await page.getByRole('button', { name: /Activar en este dispositivo/i }).click()
      await expect(page.getByText(/Ya puedes entrar con tu huella/i)).toBeVisible({ timeout: 30_000 })

      // 3) Nueva sesión limpia y login con huella (sin escribir contraseña).
      await page.context().clearCookies()
      await page.goto('/login')
      await page.click('#btn-webauthn-login')
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
      await expect(page).toHaveURL(/\/dashboard/)
    } finally {
      await client.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId }).catch(() => undefined)
    }
  })
})
