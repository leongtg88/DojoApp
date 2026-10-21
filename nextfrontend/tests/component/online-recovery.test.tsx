import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StudentOnlineRecoveries } from '@/components/dashboard/student/StudentOnlineRecoveries'
import { OnlineRecoveryPanel } from '@/components/dashboard/shared/OnlineRecoveryPanel'
import type { OnlineRecoveryCandidate, OnlineRecoverySummary } from '@/types/dashboard'

const recovery: OnlineRecoverySummary = {
  id: 'recovery-1',
  studentId: 'student-1',
  studentName: 'Ana Uno',
  absenceId: 'absence-1',
  absenceDate: '2026-09-10',
  absenceRecovered: false,
  className: 'Karate Niños',
  status: 'SCHEDULED',
  scheduledAt: '2026-10-21T22:00:00.000Z',
  durationMinutes: 35,
  instructorId: 'instructor-1',
  instructorName: 'Sensei',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  costAmount: null,
  costCurrency: 'DOP',
  costNote: null,
  costInformedAt: null,
  notes: 'Repasar kata',
  completedAt: null,
}

const candidate: OnlineRecoveryCandidate = {
  absenceId: 'absence-1',
  studentId: 'student-1',
  studentName: 'Ana Uno',
  date: '2026-09-10',
  className: 'Karate Niños',
}

describe('reposiciones online', () => {
  it('no renderiza el módulo cuando el alumno no tiene clases online', () => {
    const { container } = render(<StudentOnlineRecoveries recoveries={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('el alumno ve el horario, el estado y el costo pendiente', () => {
    render(<StudentOnlineRecoveries recoveries={[recovery]} />)

    expect(screen.getByText(/Reposiciones online/i)).toBeInTheDocument()
    expect(screen.getByText(/Programada/i)).toBeInTheDocument()
    expect(screen.getByText(/Costo pendiente de informar/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Entrar a la videollamada/i })).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij',
    )
  })

  it('el admin puede abrir el formulario desde una falta pendiente', () => {
    render(
      <OnlineRecoveryPanel
        candidates={[candidate]}
        currentUserId="admin-1"
        instructors={[{ id: 'instructor-1', name: 'Sensei' }]}
        mode="admin"
        recoveries={[recovery]}
      />,
    )

    expect(screen.getAllByText('Ana Uno').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Programada/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /^Agendar$/ }))

    expect(screen.getByText(/Agendar clase online/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha y hora')).toBeInTheDocument()
    expect(screen.getByLabelText('Instructor')).toBeInTheDocument()
  })

  it('el alumno ve la clase completada y el costo informado', () => {
    render(
      <StudentOnlineRecoveries
        recoveries={[
          {
            ...recovery,
            status: 'COMPLETED',
            absenceRecovered: true,
            completedAt: '2026-10-22T00:00:00.000Z',
            costAmount: 750,
            costInformedAt: '2026-10-22T00:00:00.000Z',
          },
        ]}
      />,
    )

    expect(screen.getByText(/Completada/i)).toBeInTheDocument()
    expect(screen.getByText(/750.00 DOP/i)).toBeInTheDocument()
  })
})
