import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminBalance } from '@/components/dashboard/admin/AdminBalance'
import type { AdminBalanceRow } from '@/types/dashboard'

// Fase 7 · F7-03 — Balance de horas: niveles, alertas y filtros.
function row(overrides: Partial<AdminBalanceRow>): AdminBalanceRow {
  return {
    studentId: 's1',
    studentName: 'Ana Uno',
    memberNumber: 'KYU-2026-001',
    currentRank: 'Blanco',
    planId: 'p1',
    planName: 'Plan 8',
    planMonthlyHours: 8,
    isUnlimited: false,
    scholarshipType: 'NONE',
    isCompetitor: false,
    confirmedHours: 8,
    balanceDiff: 0,
    balanceLevel: 'OK',
    balanceAlert: false,
    balanceMessage: '',
    outOfScheduleCount: 0,
    ...overrides,
  }
}

describe('F7-03 · balance de horas (UI)', () => {
  it('muestra niveles, conteo de alertas y de fuera de horario', () => {
    render(
      <AdminBalance
        rows={[
          row({ studentId: 's1', studentName: 'Ana Uno', balanceLevel: 'LOW', balanceAlert: true, balanceDiff: -4, confirmedHours: 4 }),
          row({ studentId: 's2', studentName: 'Beto Dos', balanceLevel: 'OK' }),
          row({ studentId: 's3', studentName: 'Carla Tres', balanceLevel: 'HIGH', balanceAlert: true, outOfScheduleCount: 2, confirmedHours: 12, balanceDiff: 4 }),
        ]}
      />,
    )

    expect(screen.getAllByText('Contactar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Plan superior').length).toBeGreaterThan(0)
    expect(screen.getAllByText('En rango').length).toBeGreaterThan(0)
    expect(screen.getByText('Solo alertas (2)')).toBeInTheDocument()
    expect(screen.getByText('Con fuera de horario (1)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeInTheDocument()
  })

  it('filtra por "Solo alertas"', async () => {
    const user = userEvent.setup()
    render(
      <AdminBalance
        rows={[
          row({ studentId: 's1', studentName: 'Ana Uno', balanceLevel: 'LOW', balanceAlert: true }),
          row({ studentId: 's2', studentName: 'Beto Dos', balanceLevel: 'OK', balanceAlert: false }),
        ]}
      />,
    )

    expect(screen.getByText('Beto Dos')).toBeInTheDocument()
    await user.click(screen.getByLabelText(/Solo alertas/))
    expect(screen.getByText('Ana Uno')).toBeInTheDocument()
    expect(screen.queryByText('Beto Dos')).toBeNull()
  })
})
