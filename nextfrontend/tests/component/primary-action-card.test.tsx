import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrimaryActionView } from '@/components/dashboard/student/PrimaryActionCard'

describe('UX-A5b · tarjeta de acción principal', () => {
    it('clase de hoy: muestra la hora y las dos acciones', () => {
        render(
            <PrimaryActionView
                action={{ kind: 'class_today', className: 'Karate Niños', startTime: '16:00', endTime: '17:00' }}
                pendingRecoveries={0}
            />,
        )

        expect(screen.getByText('Karate Niños')).toBeInTheDocument()
        expect(screen.getByText(/Hoy de 16:00 a 17:00/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Ver mi clase' })).toHaveAttribute('href', '/dashboard/estudiante/clases')
        expect(screen.getByRole('link', { name: 'No podré ir' })).toHaveAttribute('href', '/dashboard/estudiante/clases')
    })

    it('reposición: singular y plural con la acción Resolver', () => {
        const { rerender } = render(<PrimaryActionView action={{ kind: 'recovery', pendingRecoveries: 1 }} pendingRecoveries={1} />)
        expect(screen.getByText('Te queda 1 reposición')).toBeInTheDocument()

        rerender(<PrimaryActionView action={{ kind: 'recovery', pendingRecoveries: 2 }} pendingRecoveries={2} />)
        expect(screen.getByText('Te quedan 2 reposiciones')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Resolver' })).toHaveAttribute('href', '/dashboard/estudiante/clases')
    })

    it('práctica: nombra la técnica en foco', () => {
        render(<PrimaryActionView action={{ kind: 'practice', techniqueName: 'Kihon Kata Ichi' }} pendingRecoveries={0} />)

        expect(screen.getByText('Practica Kihon Kata Ichi')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Registrar repeticiones' })).toHaveAttribute('href', '/dashboard/estudiante/entrenar')
    })

    it('bienvenida: invita a ver el horario', () => {
        render(<PrimaryActionView action={{ kind: 'welcome' }} pendingRecoveries={0} />)

        expect(screen.getByRole('link', { name: 'Ver mis clases' })).toHaveAttribute('href', '/dashboard/estudiante/clases')
    })

    it('conserva el contexto familiar en los enlaces', () => {
        render(<PrimaryActionView action={{ kind: 'practice', techniqueName: 'Kata Ichi' }} pendingRecoveries={0} studentId="child-1" />)

        expect(screen.getByRole('link', { name: 'Registrar repeticiones' })).toHaveAttribute(
            'href',
            '/dashboard/estudiante/entrenar?estudiante=child-1',
        )
    })

    it('avisa de las faltas pendientes cuando la acción principal es otra', () => {
        render(
            <PrimaryActionView
                action={{ kind: 'class_today', className: 'Karate Niños', startTime: '16:00', endTime: '17:00' }}
                pendingRecoveries={2}
            />,
        )

        expect(screen.getByText(/Tienes 2 faltas por reponer/)).toBeInTheDocument()
    })

    it('no duplica el aviso cuando la acción principal ya es la reposición', () => {
        render(<PrimaryActionView action={{ kind: 'recovery', pendingRecoveries: 2 }} pendingRecoveries={2} />)

        expect(screen.queryByText(/faltas por reponer/)).not.toBeInTheDocument()
    })
})
