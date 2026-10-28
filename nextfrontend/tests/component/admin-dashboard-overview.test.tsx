import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminDashboardOverview } from '@/components/dashboard/admin/AdminDashboardOverview'
import type { AdminDashboardSummary } from '@/types/dashboard'

const summary: AdminDashboardSummary = {
  studentCount: 5,
  classCount: 2,
  activeEnrollmentCount: 3,
  pendingCases: {
    noPlan: 2,
    noSchedule: 1,
    justifications: 4,
    oldestJustification: { classId: 'clase-antigua', date: '2026-10-19' },
  },
}

const baseProps = {
  birthdays: [],
  instructorCandidates: [],
  pendingDocumentCount: 0,
  pendingEnrollmentCount: 0,
  summary,
}

describe('UX-B5.1 · filas de Hoy', () => {
  it('enlaza plan/horario con su filtro y justificaciones con la más antigua', () => {
    render(<AdminDashboardOverview {...baseProps} />)

    expect(screen.getByRole('link', { name: /Alumnos sin plan/i }).getAttribute('href')).toBe(
      '/dashboard/admin/alumnos?plan=none',
    )
    expect(screen.getByRole('link', { name: /Alumnos sin horario/i }).getAttribute('href')).toBe(
      '/dashboard/admin/alumnos?horario=none',
    )
    expect(screen.getByRole('link', { name: /Justificaciones pendientes/i }).getAttribute('href')).toBe(
      '/dashboard/admin/asistencia?tab=pase&classId=clase-antigua&date=2026-10-19',
    )
  })

  it('con contador pendiente pero sin justificación más antigua cae en la pestaña de pase', () => {
    render(
      <AdminDashboardOverview
        {...baseProps}
        summary={{
          ...summary,
          pendingCases: { ...summary.pendingCases, justifications: 3, oldestJustification: null },
        }}
      />,
    )

    expect(screen.getByRole('link', { name: /Justificaciones pendientes/i }).getAttribute('href')).toBe(
      '/dashboard/admin/asistencia?tab=pase',
    )
  })
})
