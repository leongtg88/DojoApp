import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SlideOver } from '@/components/common/SlideOver'

function renderSlideOver(open = true) {
    const onClose = vi.fn()
    const result = render(
        <div>
            <button type="button">Abrir</button>
            <SlideOver open={open} onClose={onClose} title="Expediente del alumno">
                <button type="button">Acción uno</button>
                <button type="button">Acción dos</button>
            </SlideOver>
        </div>,
    )
    return { ...result, onClose }
}

describe('UX-B0 · SlideOver accesible', () => {
    it('no renderiza nada cuando está cerrado', () => {
        renderSlideOver(false)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('abre con el foco en cerrar y expone el título', () => {
        renderSlideOver()

        expect(screen.getByRole('dialog', { name: 'Expediente del alumno' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Cerrar panel' })).toHaveFocus()
    })

    it('Esc cierra y devuelve el foco al disparador', () => {
        const trigger = document.createElement('button')
        trigger.textContent = 'Abrir expediente'
        document.body.appendChild(trigger)
        trigger.focus()

        const { onClose, unmount } = renderSlideOver()

        fireEvent.keyDown(document, { key: 'Escape' })
        expect(onClose).toHaveBeenCalledTimes(1)

        unmount()
        expect(trigger).toHaveFocus()
        trigger.remove()
    })

    it('atrapa el foco entre el primer y el último control', () => {
        renderSlideOver()

        const close = screen.getByRole('button', { name: 'Cerrar panel' })
        const last = screen.getByRole('button', { name: 'Acción dos' })

        last.focus()
        fireEvent.keyDown(document, { key: 'Tab' })
        expect(close).toHaveFocus()

        close.focus()
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
        expect(last).toHaveFocus()
    })
})
