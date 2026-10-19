// Usuario autenticado "mutable" para las pruebas de handlers de ruta.
// En el test se registra con:
//   vi.mock('@/auth', async () => {
//     const mod = await import('./route-auth')
//     return { auth: mod.authMock.auth }
//   })
// y luego se controla con `authMock.setUser(userId | null, extraUserFields)`.
// `extraUserFields` permite simular `roles`/`schoolId` para las rutas que llaman
// `hasAnyRole(session.user, …)` directamente (p. ej. documentos y conversión).
let currentUser: Record<string, unknown> | null = null

export const authMock = {
  setUser(userId: string | null, extra: Record<string, unknown> = {}) {
    currentUser = userId ? { id: userId, ...extra } : null
  },
  auth() {
    return Promise.resolve(currentUser ? { user: currentUser } : null)
  },
}
