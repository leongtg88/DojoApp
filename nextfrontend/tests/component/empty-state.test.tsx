import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'

describe('UX-A3 · EmptyState', () => {
    it('explica el estado y nunca se queda en "No hay datos"', () => {
        render(
            <EmptyState
                description="Tu instructor las registrará en el pase de lista."
                icon={Inbox}
                title="Aún no tienes asistencias registradas"
            />,
        )

        expect(screen.getByText('Aún no tienes asistencias registradas')).toBeInTheDocument()
        expect(screen.getByText('Tu instructor las registrará en el pase de lista.')).toBeInTheDocument()
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('ofrece una acción de enlace accesible', () => {
        render(<EmptyState title="No tienes faltas por reponer" action={{ label: 'Ver mi horario', href: '/dashboard/estudiante/horario' }} />)

        const link = screen.getByRole('link', { name: 'Ver mi horario' })
        expect(link).toHaveAttribute('href', '/dashboard/estudiante/horario')
    })

    it('ofrece una acción de botón que ejecuta la llamada', () => {
        const onClick = vi.fn()
        render(<EmptyState title="No hay reseñas en este filtro" action={{ label: 'Ver todas', onClick }} />)

        fireEvent.click(screen.getByRole('button', { name: 'Ver todas' }))

        expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('el icono es decorativo', () => {
        const { container } = render(<EmptyState icon={Inbox} title="Sin clases este día" />)

        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    })
})
