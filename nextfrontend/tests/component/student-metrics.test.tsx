import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudentMetricsGrid } from '@/components/dashboard/student/StudentMetricsGrid'
import { attendanceSummary, kataProgress, technique } from './fixtures'

// Fase 4 · F4-04 — El promedio de katas usa solo las katas requeridas del grado.
describe('F4-04 · métricas del alumno', () => {
  it('calcula técnicas listas, promedio de katas requeridas y asistencia', () => {
    render(
      <StudentMetricsGrid
        attendance={attendanceSummary({ attendedSessions: 8, totalSessions: 10, percentage: 80 })}
        techniques={[
          technique({ id: 't1', status: 'APPROVED' }),
          technique({ id: 't2', status: 'APPROVED' }),
          technique({ id: 't3', status: 'PENDING' }),
        ]}
        katas={[
          kataProgress({ id: 'k1', requiredForGrade: true, score: 8 }),
          kataProgress({ id: 'k2', requiredForGrade: true, score: null }),
          kataProgress({ id: 'k3', requiredForGrade: false, score: 10 }),
          kataProgress({ id: 'k4', requiredForGrade: true, score: 9 }),
        ]}
        grado={null}
      />,
    )

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    // (8 + 9) / 2 = 8.5 — la no requerida (10) y la sin nota quedan fuera.
    expect(screen.getByText('8.5 / 10')).toBeInTheDocument()
    expect(screen.getByText('8 de 10')).toBeInTheDocument()
    expect(screen.getByText(/80% del grado/)).toBeInTheDocument()
  })
})
