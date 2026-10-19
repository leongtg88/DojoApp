import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudentBirthdayCard } from '@/components/dashboard/student/StudentBirthdayCard'

// Fase 4 · F4-05 — Cumpleaños: "hoy" y días restantes.
// Se calcula la fecha local del nacimiento igual que el componente para ser
// independiente de la zona horaria del entorno.
const DOB_ISO = '2000-07-10T12:00:00.000Z'
const dob = new Date(DOB_ISO)

afterEach(() => {
  vi.useRealTimers()
})

describe('F4-05 · cumpleaños', () => {
  it('celebra el cumpleaños cuando es hoy', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, dob.getMonth(), dob.getDate(), 12, 0, 0))

    render(<StudentBirthdayCard dateOfBirth={DOB_ISO} />)

    expect(screen.getByText(/Hoy celebramos tu cumpleaños/i)).toBeInTheDocument()
  })

  it('indica los días restantes cuando aún no llega', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, dob.getMonth(), dob.getDate() - 5, 12, 0, 0))

    render(<StudentBirthdayCard dateOfBirth={DOB_ISO} />)

    expect(screen.getByText(/Faltan 5 días/i)).toBeInTheDocument()
  })
})
