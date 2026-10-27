import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudentDashboardOverview } from '@/components/dashboard/student/StudentDashboardOverview'
import { kataSummary, summary, technique } from './fixtures'

// Fase 4 · F4-01 — Resumen del alumno: saludo, grado, Budo Pass y técnicas en enfoque.
describe('F4-01 · resumen del alumno', () => {
  it('muestra el saludo, el grado, el Budo Pass y las técnicas en enfoque', () => {
    render(
      <StudentDashboardOverview
        summary={summary({ techniques: [technique({ id: 't1', name: 'Kata Ichi', status: 'PENDING' })] })}
        kataSummary={kataSummary()}
      />,
    )

    expect(screen.getByRole('heading', { name: /Bienvenida, Ana/ })).toBeInTheDocument()
    expect(screen.getAllByText('Blanco').length).toBeGreaterThan(0)
    expect(screen.getByText(/Budo Pass/i)).toBeInTheDocument()
    expect(screen.getByTestId('primary-action-card')).toBeInTheDocument()
    expect(screen.getAllByText(/Kata Ichi/).length).toBeGreaterThan(0)
  })

  it('deja los secundarios plegados en "Más detalles"', () => {
    render(
      <StudentDashboardOverview
        summary={summary({ techniques: [technique({ id: 't1', name: 'Kata Ichi', status: 'PENDING' })] })}
        kataSummary={kataSummary()}
      />,
    )

    const details = screen.getByText('Más detalles').closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(screen.getAllByText(/Cumpleaños/i).length).toBeGreaterThan(0)
  })

  it('sin técnicas en enfoque informa que no hay pendientes', () => {
    render(
      <StudentDashboardOverview
        summary={summary({ techniques: [technique({ id: 't1', name: 'Kata Ichi', status: 'APPROVED' })] })}
        kataSummary={kataSummary()}
      />,
    )

    expect(screen.getByText(/Todas tus técnicas asignadas están revisadas/i)).toBeInTheDocument()
  })
})
