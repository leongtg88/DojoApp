import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Link from 'next/link'
import { AssignGradeDialog } from '@/components/dashboard/shared/AssignGradeDialog'

// Prueba "smoke" del harness: jsdom + React Testing Library + matchers de jest-dom
// + stubs de `next/link` (alias) + mock de `fetch`.
describe('harness de componentes (smoke)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ students: [] }) })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resuelve el alias de `next/link` (stub) y aplica los matchers de jest-dom', () => {
    render(<Link href="/dashboard/admin">Ir al panel</Link>)

    const link = screen.getByRole('link', { name: 'Ir al panel' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard/admin')
  })

  it('renderiza un componente real (AssignGradeDialog) con sus datos', () => {
    render(
      <AssignGradeDialog
        assignUrl="/api/dashboard/admin/students/assign-techniques-bulk"
        gradeId="belt-adult-13-nidan"
        gradeName="Nidan"
        onAssigned={() => {}}
        onClose={() => {}}
        studentsEndpoint="/api/dashboard/admin/students"
        techniqueIds={['t1', 't2']}
      />,
    )

    expect(screen.getByRole('heading', { name: /asignar katas del grado/i })).toBeInTheDocument()
    expect(screen.getByText(/Nidan · 2 katas/i)).toBeInTheDocument()
  })
})
