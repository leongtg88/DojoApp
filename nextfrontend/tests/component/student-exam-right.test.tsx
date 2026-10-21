import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExaminationCriteriaCard } from '@/components/dashboard/student/ExaminationCriteriaCard'
import { GradoProgress } from '@/components/dashboard/dojo/GradoProgress'
import { grado } from './fixtures'

function withCurrentPeriod(overrides: Parameters<typeof grado>[0] = {}) {
  return grado({
    currentPeriod: {
      label: 'Cuatrimestre 3',
      classSessions: 10,
      capacitySessions: 12,
      classHours: 10,
      requiredHours: 8,
      libreHours: 0,
      extraClasses: 0,
      creditHours: 0,
      monthAbsences: [
        { label: 'octubre de 2026', count: 3, max: 2, recovered: 1, excess: 1, pendingRecovery: 0, lateRecovery: 0 },
      ],
      totalAbsences: 3,
      maxAbsencesTotal: 8,
      exempt: false,
      met: true,
    },
    ...overrides,
  })
}

describe('aviso de inasistencias y derecho a examen', () => {
  it('explica la regla general de 2 faltas por mes', () => {
    render(<ExaminationCriteriaCard grado={grado()} />)

    expect(screen.getByText(/2 faltas por mes incluidas/i)).toBeInTheDocument()
  })

  it('muestra el total del mes con las repuestas y las pendientes', () => {
    render(<ExaminationCriteriaCard grado={withCurrentPeriod()} />)

    expect(screen.getByText(/3 faltas · 1 repuesta/i)).toBeInTheDocument()
    expect(screen.queryByText(/por reponer/i)).not.toBeInTheDocument()
  })

  it('avisa cuando hay una falta 3.ª+ pendiente y ofrece la alternativa online', () => {
    render(<ExaminationCriteriaCard grado={withCurrentPeriod({ examAtRisk: true, pendingRecoveries: 1 })} />)

    expect(screen.getByText(/desde la 3.ª del mes sin reponer/i)).toBeInTheDocument()
    expect(screen.getByText(/Repón en otro horario antes del cierre del cuatrimestre/i)).toBeInTheDocument()
    expect(screen.getAllByText(/clase online de 35 min/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Derecho a examen suspendido/i)).not.toBeInTheDocument()
  })

  it('suspende el derecho solo cuando el cuatrimestre cerró con pendientes', () => {
    render(<ExaminationCriteriaCard grado={grado({ examRightLost: true, pendingRecoveries: 2 })} />)

    expect(screen.getByText(/Derecho a examen suspendido/i)).toBeInTheDocument()
    expect(screen.getByText(/Te quedan 2 por regularizar/i)).toBeInTheDocument()
  })

  it('explica que LOCK no restaura el derecho con una reposición posterior al cierre', () => {
    render(<ExaminationCriteriaCard grado={grado({ examAtRisk: true, pendingRecoveries: 1, absencePolicy: 'LOCK_AT_CLOSE' })} />)

    expect(screen.getAllByText(/Reponer después del cierre no restaura/i).length).toBeGreaterThan(0)
  })

  it('explica que RESTORE sí restaura el derecho', () => {
    render(<ExaminationCriteriaCard grado={grado({ examAtRisk: true, pendingRecoveries: 1, absencePolicy: 'RESTORE_ON_RECOVERY' })} />)

    expect(screen.getAllByText(/Reponer después del cierre restaura/i).length).toBeGreaterThan(0)
  })

  it('repite el aviso ámbar en el progreso de grado', () => {
    render(<GradoProgress grado={grado({ examAtRisk: true, pendingRecoveries: 1 })} />)

    expect(screen.getByText('Faltas pendientes de reponer')).toBeInTheDocument()
    expect(screen.getByText(/clase online de 35 min/i)).toBeInTheDocument()
  })

  it('repite el aviso rojo en el progreso de grado al cierre', () => {
    render(<GradoProgress grado={grado({ examRightLost: true, pendingRecoveries: 2 })} />)

    expect(screen.getByText('Derecho a examen suspendido')).toBeInTheDocument()
    expect(screen.getByText(/cerró con faltas sin reponer/i)).toBeInTheDocument()
  })
})
