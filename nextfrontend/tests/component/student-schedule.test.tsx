import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentSchedule } from '@/components/dashboard/student/StudentSchedule'
import { classSchedule } from './fixtures'

// Fase 4 · F4-03 — Horario: agenda semanal filtrable por día.
describe('F4-03 · horario del alumno', () => {
  it('sin clases muestra el estado informativo', () => {
    render(<StudentSchedule classes={[]} />)
    expect(screen.getByText(/No tienes clases activas asignadas/i)).toBeInTheDocument()
  })

  it('cuenta las clases por día y muestra el vacío del día sin sesiones', async () => {
    const user = userEvent.setup()
    render(
      <StudentSchedule
        classes={[
          classSchedule({ id: 'c1', name: 'Karate Niños', dayOfWeek: 1 }),
          classSchedule({ id: 'c2', name: 'Karate Adultos', dayOfWeek: 3, startTime: '20:00' }),
        ]}
      />,
    )

    expect(screen.getByText('Agenda semanal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Lun \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Mié \(1\)/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Dom \(0\)/ }))
    expect(screen.getByText(/No tienes clases este día/i)).toBeInTheDocument()
  })
})
