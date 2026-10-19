import { expect, type Page } from '@playwright/test'

/** Inicio de sesión por correo/contraseña y espera al dashboard. */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.fill('#login-email-input', email)
  await page.fill('#login-password-input', password)
  await page.click('#btn-submit-login')
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  await expect(page).toHaveURL(/\/dashboard/)
}

/** Credenciales de un rol desde variables de entorno (undefined si no están). */
export function credentials(prefix: string): { email?: string; password?: string } {
  return {
    email: process.env[`E2E_${prefix}_EMAIL`],
    password: process.env[`E2E_${prefix}_PASSWORD`],
  }
}
