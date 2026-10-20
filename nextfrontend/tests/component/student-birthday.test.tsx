import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudentBirthdayCard } from '@/components/dashboard/student/StudentBirthdayCard'

// Fase 4 · F4-05 — Cumpleaños: "hoy" y días restantes.
// La fecha se guarda como la API real: medianoche UTC. "Hoy" se evalúa en RD.
const DOB_ISO = '2000-07-10T00:00:00.000Z'

afterEach(() => {
  vi.useRealTimers()
})

describe('F4-05 · cumpleaños', () => {
  it('celebra el cumpleaños cuando es hoy (sin restar un día)', () => {
    vi.useFakeTimers()
    // 10 de julio, 12:00 en RD = 16:00 UTC.
    vi.setSystemTime(new Date('2026-07-10T16:00:00.000Z'))

    render(<StudentBirthdayCard dateOfBirth={DOB_ISO} />)

    expect(screen.getByText(/Hoy celebramos tu cumpleaños/i)).toBeInTheDocument()
  })

  it('indica los días restantes cuando aún no llega', () => {
    vi.useFakeTimers()
    // 5 de julio, 12:00 en RD.
    vi.setSystemTime(new Date('2026-07-05T16:00:00.000Z'))

    render(<StudentBirthdayCard dateOfBirth={DOB_ISO} />)

    expect(screen.getByText(/Faltan 5 días/i)).toBeInTheDocument()
  })
})
