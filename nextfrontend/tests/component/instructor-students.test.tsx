import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstructorStudents } from '@/components/dashboard/instructor/InstructorStudents'
import type { InstructorStudentSummary } from '@/types/dashboard'

function student(overrides: Partial<InstructorStudentSummary> = {}): InstructorStudentSummary {
  return {
    id: 'ana',
    firstName: 'Ana',
    lastName: 'Kurosawa',
    currentRank: 'Blanco',
    status: 'ACTIVE',
    classNames: ['Adultos 19:00'],
    kyuDan: null,
    beltColor: null,
    masteredCount: 3,
    requiredCount: 5,
    attendancePercent: 80,
    ...overrides,
  }
}

// T1 · En móvil el listado del instructor despliega sus métricas sin abrir el
// expediente del admin (decisión: el detalle del alumno es solo del admin).
describe('T1 · detalles del alumno en móvil (instructor)', () => {
  it('despliega katas, asistencia y clases sin enlazar al panel de admin', async () => {
    const user = userEvent.setup()
    render(<InstructorStudents students={[student()]} />)

    const toggle = screen.getByRole('button', { name: /Mostrar detalles de Ana Kurosawa/i })
    const panelId = toggle.getAttribute('aria-controls') ?? ''
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(panelId)).toBeNull()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const panel = document.getElementById(panelId)
    expect(panel).not.toBeNull()
    expect(within(panel as HTMLElement).getByText('Katas revisadas')).toBeInTheDocument()
    expect(within(panel as HTMLElement).getByText('3/5')).toBeInTheDocument()
    expect(within(panel as HTMLElement).getByText('Asistencia')).toBeInTheDocument()
    expect(within(panel as HTMLElement).getByText('80%')).toBeInTheDocument()
    expect(within(panel as HTMLElement).getByText('Adultos 19:00')).toBeInTheDocument()

    const adminLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/dashboard/admin'))
    expect(adminLinks).toHaveLength(0)
  })
})
