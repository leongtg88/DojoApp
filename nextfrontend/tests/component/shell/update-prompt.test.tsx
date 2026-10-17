import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UPDATE_DISMISSED_STORAGE_KEY, UpdatePrompt } from '@/components/dashboard/shell/UpdatePrompt'

function mockVersion(version: string | null) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version }) }))
}

// El aviso existe para las PWA instaladas: una app reanudada desde memoria sigue
// ejecutando el bundle viejo y sin él nadie se entera de que hay que recargar.
describe('UpdatePrompt · aviso de nueva versión', () => {
    beforeEach(() => {
        document.documentElement.dataset.dplId = 'build-viejo'
        sessionStorage.clear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
        delete document.documentElement.dataset.dplId
    })

    it('avisa cuando el servidor sirve otro build', async () => {
        mockVersion('build-nuevo')
        render(<UpdatePrompt />)

        expect(await screen.findByText('Hay una actualización disponible')).toBeInTheDocument()
    })

    it('no avisa si el build coincide', async () => {
        mockVersion('build-viejo')
        render(<UpdatePrompt />)

        await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
        expect(screen.queryByText('Hay una actualización disponible')).not.toBeInTheDocument()
    })

    it('no insiste si el usuario ya descartó ese build en la sesión', async () => {
        sessionStorage.setItem(UPDATE_DISMISSED_STORAGE_KEY, 'build-nuevo')
        mockVersion('build-nuevo')
        render(<UpdatePrompt />)

        await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
        expect(screen.queryByText('Hay una actualización disponible')).not.toBeInTheDocument()
    })

    it('recarga la app al pulsar Actualizar', async () => {
        mockVersion('build-nuevo')
        const reload = vi.fn()
        const user = userEvent.setup()
        render(<UpdatePrompt onReload={reload} />)

        await user.click(await screen.findByRole('button', { name: 'Actualizar' }))

        expect(reload).toHaveBeenCalledTimes(1)
    })

    it('no consulta nada en desarrollo (sin data-dpl-id)', async () => {
        delete document.documentElement.dataset.dplId
        mockVersion('build-nuevo')
        render(<UpdatePrompt />)

        expect(globalThis.fetch).not.toHaveBeenCalled()
    })
})
