import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StudentAbsenceReport } from '@/components/dashboard/student/StudentAbsenceReport'
import type { StudentAbsenceJustification } from '@/types/dashboard'

const justification: StudentAbsenceJustification = {
  id: 'justification-1',
  classId: 'class-1',
  className: 'Karate Niños',
  date: '2026-09-10',
  reason: 'Enfermedad',
  status: 'APPROVED',
  reviewedByName: 'Sensei',
  reviewedAt: '2026-09-11T12:00:00.000Z',
  createdAt: '2026-09-10T12:00:00.000Z',
  recovered: true,
  recoveryDate: '2026-10-05',
  lateRecovery: true,
}

describe('reporte de inasistencia del alumno', () => {
  it('marca la reposición hecha después del cierre', () => {
    render(<StudentAbsenceReport justifications={[justification]} schedule={[]} />)

    expect(screen.getByText(/fuera de plazo/i)).toBeInTheDocument()
  })

  it('guarda las reglas de inasistencias en un desplegable', () => {
    render(<StudentAbsenceReport justifications={[]} schedule={[]} />)

    expect(screen.queryByText(/Siempre reporta cuando no puedas asistir/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Reglas de inasistencias/i }))

    expect(screen.getByText(/Siempre reporta cuando no puedas asistir/i)).toBeInTheDocument()
    expect(screen.getByText(/3\.ª falta/i)).toBeInTheDocument()
  })
})
