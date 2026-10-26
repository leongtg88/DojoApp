import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FamilyMembersView } from '@/components/dashboard/student/FamilyMembersView'
import { FamilyMemberSwitcher } from '@/components/dashboard/shell/FamilyMemberSwitcher'
import type { FamilyView } from '@/lib/family/guardians'

// Fase 4 · F4-06 — Vista de tutor: expedientes de la familia y contexto `?estudiante=`.
const members: FamilyView = {
  self: {
    id: 'self-1',
    firstName: 'Ana',
    lastName: 'Uno',
    dateOfBirth: '1990-01-01T00:00:00.000Z',
    currentRank: 'Blanco',
    photoUrl: null,
    relationship: null,
  },
  children: [
    {
      id: 'child-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: '2015-05-01T00:00:00.000Z',
      currentRank: 'Amarillo',
      photoUrl: null,
      relationship: 'Hijo',
    },
    {
      id: 'child-2',
      firstName: 'María',
      lastName: 'Pérez',
      dateOfBirth: '2017-09-20T00:00:00.000Z',
      currentRank: null,
      photoUrl: null,
      relationship: 'Hija',
    },
  ],
}

function hrefs(): (string | null)[] {
  return screen.getAllByRole('link').map((link) => link.getAttribute('href'))
}

describe('F4-06 · vista de familia (tutor)', () => {
  it('lista el expediente propio y el de los hijos con enlaces por estudiante', () => {
    render(<FamilyMembersView members={members} />)

    expect(screen.getByText('Mi familia')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('María Pérez')).toBeInTheDocument()

    expect(hrefs()).toContain('/dashboard/estudiante/perfil?estudiante=child-1')
    expect(hrefs()).toContain('/dashboard/estudiante/asistencia?estudiante=child-2')
    // El expediente propio no lleva parámetro.
    expect(hrefs()).toContain('/dashboard/estudiante/perfil')
  })

  it('el selector del encabezado dice de quién es el expediente', () => {
    render(<FamilyMemberSwitcher members={members} />)

    expect(screen.getByRole('button', { name: /Viendo el expediente de: Ana Uno/i })).toBeInTheDocument()
  })

  it('el selector no se muestra si la cuenta no tiene hijos asociados', () => {
    render(<FamilyMemberSwitcher members={{ ...members, children: [] }} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
