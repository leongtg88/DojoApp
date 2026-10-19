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

    expect(screen.getByText(/No se encontraron alumnos/i)).toBeInTheDocument()
  })
})
