import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminStudents } from '@/components/dashboard/admin/AdminStudents'
import type { AdminStudentSummary } from '@/types/dashboard'

// Fase 3 · F3-09 — El padrón filtra en cliente por búsqueda.
function student(overrides: Partial<AdminStudentSummary>): AdminStudentSummary {
  return {
    id: 'base',
    firstName: 'Alumno',
    lastName: 'Base',
    gender: null,
    memberNumber: 'KYU-2026-001',
    currentRank: 'Blanco',
    kyuDan: null,
    beltColor: null,
    beltSecondaryColor: null,
    status: 'ACTIVE',
    email: null,
    accountStatus: 'SIN_CUENTA',
    branchName: 'Sede Central',
    branchId: null,
    dateOfBirth: null,
    contactPhone: null,
    medicalInfo: null,
    emergencyContact: null,
    giSize: null,
    beltSize: null,
    guardianManaged: false,
    guardianName: null,
    activeClassNames: [],
    activeScheduleIds: [],
    planId: null,
    planName: null,
    scholarshipType: 'NONE',
    scholarshipNote: null,
    isCompetitor: false,
    needsPlan: false,
    needsSchedule: false,
    countsForPending: true,
    techniques: [],
    studentCount: 1,
    kataMasteredCount: 0,
    kataTotalCount: 0,
    pendingDocumentCount: 0,
    attendancePercent: null,
    rankAwardedAt: null,
    nextRankName: null,
    nextRankKyuDan: null,
    nextRankBeltColor: null,
    ...overrides,
  }
}

describe('F3-09 · padrón de alumnos (filtro de búsqueda)', () => {
  it('filtra por nombre al escribir en el buscador', async () => {
    const user = userEvent.setup()
    render(
      <AdminStudents
        students={[
          student({ id: 'a', firstName: 'Ana', lastName: 'Kurosawa', memberNumber: 'KYU-2026-001' }),
          student({ id: 'b', firstName: 'Beto', lastName: 'Tanaka', memberNumber: 'KYU-2026-002' }),
        ]}
      />,
    )

    expect(screen.queryAllByText('Ana Kurosawa').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Beto Tanaka').length).toBeGreaterThan(0)

    await user.type(screen.getByRole('searchbox'), 'Kurosawa')

    expect(screen.queryAllByText('Ana Kurosawa').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Beto Tanaka')).toHaveLength(0)
  })

  it('muestra el estado vacío cuando no hay coincidencias', async () => {
    const user = userEvent.setup()
    render(<AdminStudents students={[student({ id: 'a', firstName: 'Ana', lastName: 'Kurosawa' })]} />)

    await user.type(screen.getByRole('searchbox'), 'zzzz')

    expect(screen.getByText(/No encontramos alumnos con esos filtros/i)).toBeInTheDocument()
  })
})

describe('UX-B5.1 · filtros de pendientes', () => {
  it('aplica el filtro inicial ?plan=none solo a activos no excluidos', () => {
    render(
      <AdminStudents
        initialPlanFilter
        students={[
          student({ id: 'ana', firstName: 'Ana', lastName: 'Sin Plan', needsPlan: true }),
          student({ id: 'beto', firstName: 'Beto', lastName: 'Con Plan', needsPlan: false }),
          student({ id: 'carla', firstName: 'Carla', lastName: 'Inactiva', status: 'INACTIVE', needsPlan: true, countsForPending: false }),
          student({ id: 'dani', firstName: 'Dani', lastName: 'Excluida', needsPlan: true, countsForPending: false }),
        ]}
      />,
    )

    expect(screen.queryAllByText('Ana Sin Plan').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Beto Con Plan')).toHaveLength(0)
    expect(screen.queryAllByText('Carla Inactiva')).toHaveLength(0)
    expect(screen.queryAllByText('Dani Excluida')).toHaveLength(0)
  })

  it('aplica el filtro inicial ?horario=none solo a activos no excluidos', () => {
    render(
      <AdminStudents
        initialScheduleFilter
        students={[
          student({ id: 'ana', firstName: 'Ana', lastName: 'Sin Horario', needsSchedule: true }),
          student({ id: 'beto', firstName: 'Beto', lastName: 'Con Horario', needsSchedule: false }),
          student({ id: 'carla', firstName: 'Carla', lastName: 'Inactiva', status: 'INACTIVE', needsSchedule: true, countsForPending: false }),
          student({ id: 'dani', firstName: 'Dani', lastName: 'Excluida', needsSchedule: true, countsForPending: false }),
        ]}
      />,
    )

    expect(screen.queryAllByText('Ana Sin Horario').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Beto Con Horario')).toHaveLength(0)
    expect(screen.queryAllByText('Carla Inactiva')).toHaveLength(0)
    expect(screen.queryAllByText('Dani Excluida')).toHaveLength(0)
  })
})
