import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AdminAbsencePolicyCard } from '@/components/dashboard/admin/AdminAbsencePolicyCard'

describe('política de reposición del administrador', () => {
  it('muestra la política actual y explica el efecto de cada opción', () => {
    render(
      <AdminAbsencePolicyCard
        initialPolicy="LOCK_AT_CLOSE"
        initialSchoolId="school-1"
        schools={[]}
      />,
    )

    expect(screen.getByText(/no se restaura con reposiciones posteriores/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Política'), { target: { value: 'RESTORE_ON_RECOVERY' } })

    expect(screen.getByText(/se restaura en la siguiente carga/i)).toBeInTheDocument()
  })

  it('permite elegir la escuela al superadmin', () => {
    render(
      <AdminAbsencePolicyCard
        initialPolicy="LOCK_AT_CLOSE"
        initialSchoolId="school-1"
        schools={[
          { id: 'school-1', name: 'Dojo Centro' },
          { id: 'school-2', name: 'Dojo Norte' },
        ]}
      />,
    )

    expect(screen.getByLabelText('Escuela')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dojo Norte' })).toBeInTheDocument()
  })
})
