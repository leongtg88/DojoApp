import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Hero5 from '@/components/Hero5'

// UX-A8 · Un CTA dominante por pantalla pública: reservar la clase de prueba.
// El asistente queda como salida secundaria para dudas.
describe('UX-A8 · CTA del hero público', () => {
    it('la acción dominante reserva la clase de prueba', () => {
        const onOpenEnrollment = vi.fn()
        const onOpenAssistant = vi.fn()

        render(<Hero5 onOpenAssistant={onOpenAssistant} onOpenEnrollment={onOpenEnrollment} />)
        fireEvent.click(screen.getByRole('button', { name: /Reservar clase de prueba/i }))

        expect(onOpenEnrollment).toHaveBeenCalledTimes(1)
        expect(onOpenAssistant).not.toHaveBeenCalled()
    })

    it('el asistente es una acción secundaria y no el CTA principal', () => {
        const onOpenEnrollment = vi.fn()
        const onOpenAssistant = vi.fn()

        render(<Hero5 onOpenAssistant={onOpenAssistant} onOpenEnrollment={onOpenEnrollment} />)
        fireEvent.click(screen.getByRole('button', { name: /Habla con el asistente/i }))

        expect(onOpenAssistant).toHaveBeenCalledTimes(1)
        expect(onOpenEnrollment).not.toHaveBeenCalled()
    })
})
