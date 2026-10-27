import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstructorAttendanceRoster } from '@/components/dashboard/instructor/InstructorAttendanceRoster'
import type { InstructorAttendanceRoster as RosterData } from '@/types/dashboard'

// Fase 6 · F6-02 — El roster marca en solo lectura los horarios que no son del instructor.
function roster(overrides: Partial<RosterData> = {}): RosterData {
  return {
    classId: 'c1',
    className: 'Karate Niños',
    date: '2026-01-05',
    isOwnClass: true,
    isPassTaken: false,
    passTakenAt: null,
    passTakenByName: null,
    dayMatches: true,
    students: [
      { id: 's1', firstName: 'Ana', lastName: 'Uno', currentRank: 'Blanco', present: true, notes: null, status: 'CONFIRMED', justified: false, justification: null },
    ],
    ...overrides,
  }
}

describe('F6-02 · pase de lista (roster)', () => {
  it('en un horario ajeno muestra solo lectura y deshabilita la captura', () => {
    render(<InstructorAttendanceRoster roster={roster({ isOwnClass: false })} />)

    expect(screen.getByText(/Solo lectura: este horario no es tuyo/i)).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')[0]).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Guardar asistencia/i })).toBeNull()
  })

  it('en su propio horario permite marcar y guardar', () => {
    render(<InstructorAttendanceRoster roster={roster({ isOwnClass: true })} />)

    expect(screen.queryByText(/Solo lectura: este horario no es tuyo/i)).toBeNull()
    expect(screen.getAllByRole('checkbox')[0]).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Guardar asistencia/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar todos presentes' })).toBeInTheDocument()
  })

  it('tras guardar el pase muestra a los presentes y a los ausentes', () => {
    render(<InstructorAttendanceRoster roster={roster({
      isPassTaken: true,
      students: [
        { id: 's1', firstName: 'Ana', lastName: 'Uno', currentRank: 'Blanco', present: true, notes: null, status: 'CONFIRMED', justified: false, justification: null },
        { id: 's2', firstName: 'Luis', lastName: 'Dos', currentRank: 'Amarillo', present: false, notes: null, status: 'ABSENT', justified: false, justification: null },
      ],
    })} />)

    expect(screen.getByText('Ana Uno')).toBeInTheDocument()
    expect(screen.getByText('Luis Dos')).toBeInTheDocument()
    expect(screen.getByText('Presente')).toBeInTheDocument()
    expect(screen.getByText('Ausente')).toBeInTheDocument()
    expect(screen.getByText(/Resumen del pase de lista \(2\)/i)).toBeInTheDocument()
  })
})
