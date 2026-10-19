import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditProfileModal } from '@/components/dashboard/student/EditProfileModal'
import { profile } from './fixtures'

// Fase 5 · F5-05 — El modo restringido (hijo) no expone los datos de identidad.
afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch() {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function lastRequestBody(fetchMock: ReturnType<typeof stubFetch>): Record<string, unknown> {
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
  return JSON.parse(call[1].body as string) as Record<string, unknown>
}

describe('F5-05 · modal de edición de perfil', () => {
  it('en modo completo envía los datos de identidad', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()

    render(<EditProfileModal onClose={() => {}} profile={profile()} studentId="student-1" />)

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(lastRequestBody(fetchMock).firstName).toBe('Ana')
    expect((call[1].headers as Record<string, string>)['X-Student-Id']).toBe('student-1')
  })

  it('en modo restringido oculta la identidad y solo envía contacto', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()

    render(<EditProfileModal onClose={() => {}} profile={profile()} studentId="child-1" restricted />)

    expect(screen.queryByLabelText('Nombre')).toBeNull()
    expect(screen.getByText(/Editar datos de Ana/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const body = lastRequestBody(fetchMock)
    expect(body.firstName).toBeUndefined()
    expect(body).toHaveProperty('contactPhone')
    expect(body).toHaveProperty('whatsappOptIn')
  })
})
