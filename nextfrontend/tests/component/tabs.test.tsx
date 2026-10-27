import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Tabs } from '@/components/common/Tabs'

const items = [
    { id: 'pase', label: 'Pase de lista', content: <p>Contenido del pase</p> },
    { id: 'auditoria', label: 'Auditoría', content: <p>Contenido de auditoría</p> },
    { id: 'politica', label: 'Política', content: <p>Contenido de política</p> },
]

describe('UX-B0 · Tabs accesibles', () => {
    it('muestra la primera pestaña y asocia el panel', () => {
        render(<Tabs items={items} label="Secciones de asistencia" />)

        const tab = screen.getByRole('tab', { name: 'Pase de lista' })
        expect(tab).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido del pase')
    })

    it('cambia de pestaña al hacer clic', () => {
        render(<Tabs items={items} label="Secciones de asistencia" />)

        fireEvent.click(screen.getByRole('tab', { name: 'Auditoría' }))

        expect(screen.getByRole('tab', { name: 'Auditoría' })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('tabpanel')).toHaveTextContent('Contenido de auditoría')
    })

    it('navega con flechas, Inicio y Fin', () => {
        render(<Tabs items={items} label="Secciones de asistencia" />)

        const list = screen.getByRole('tablist', { name: 'Secciones de asistencia' })
        fireEvent.keyDown(list, { key: 'ArrowRight' })
        expect(screen.getByRole('tab', { name: 'Auditoría' })).toHaveFocus()
        expect(screen.getByRole('tab', { name: 'Auditoría' })).toHaveAttribute('aria-selected', 'true')

        fireEvent.keyDown(list, { key: 'End' })
        expect(screen.getByRole('tab', { name: 'Política' })).toHaveAttribute('aria-selected', 'true')

        fireEvent.keyDown(list, { key: 'Home' })
        expect(screen.getByRole('tab', { name: 'Pase de lista' })).toHaveAttribute('aria-selected', 'true')
    })

    it('solo la pestaña activa es alcanzable con Tab', () => {
        render(<Tabs items={items} label="Secciones de asistencia" />)

        expect(screen.getByRole('tab', { name: 'Pase de lista' })).toHaveAttribute('tabindex', '0')
        expect(screen.getByRole('tab', { name: 'Auditoría' })).toHaveAttribute('tabindex', '-1')
    })
})
