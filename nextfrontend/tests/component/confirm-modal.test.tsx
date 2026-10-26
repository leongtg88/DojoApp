import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useConfirm } from '@/components/dashboard/shared/useConfirm'

function Harness() {
    const { confirm, dialog } = useConfirm()
    const [result, setResult] = useState('pendiente')

    async function open() {
        const confirmed = await confirm({
            title: '¿Eliminar el documento?',
            message: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            isDestructive: true,
        })
        setResult(String(confirmed))
    }

    return (
        <div>
            <button type="button" onClick={open}>Abrir confirmación</button>
            <p>{result}</p>
            {dialog}
        </div>
    )
}

function openDialog() {
    const trigger = screen.getByRole('button', { name: 'Abrir confirmación' })
    trigger.focus()
    fireEvent.click(trigger)
    return trigger
}

describe('UX-A2 · ConfirmModal accesible', () => {
    it('abre con el foco en Cancelar y expone el diálogo con su título', () => {
        render(<Harness />)
        openDialog()

        expect(screen.getByRole('dialog', { name: '¿Eliminar el documento?' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    })

    it('atrapa el foco: Shift+Tab desde Cancelar va al botón de confirmar', () => {
        render(<Harness />)
        openDialog()

        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
        expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus()

        fireEvent.keyDown(document, { key: 'Tab' })
        expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    })

    it('Esc cancela, cierra y devuelve el foco al botón que lo abrió', async () => {
        render(<Harness />)
        const trigger = openDialog()

        fireEvent.keyDown(document, { key: 'Escape' })

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('false')).toBeInTheDocument()
        expect(trigger).toHaveFocus()
    })

    it('confirmar resuelve true y cierra el diálogo', async () => {
        render(<Harness />)
        openDialog()

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('true')).toBeInTheDocument()
    })

    it('hacer clic fuera del diálogo cancela', async () => {
        render(<Harness />)
        openDialog()

        fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
        expect(screen.getByText('false')).toBeInTheDocument()
    })
})
