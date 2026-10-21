import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StudentPracticeLog } from '@/components/dashboard/student/StudentPracticeLog'
import type { StudentPracticeTechniqueOption } from '@/types/dashboard'

const kihon: StudentPracticeTechniqueOption = {
  id: 'kihon-age-uke',
  name: 'Age Uke',
  japaneseName: '上段受け',
  category: 'KIHON',
  order: 1,
  kihonCategory: 'UKE_WAZA',
  kumiteCategory: null,
  targetRepetitions: 20,
  practiceRepetitions: 0,
  assigned: false,
  kataLevels: [],
}

describe('registro de repeticiones', () => {
  it('muestra las técnicas de Kihon del catálogo aunque no estén asignadas', () => {
    render(<StudentPracticeLog program="ADULT" techniques={[kihon]} />)

    fireEvent.click(screen.getByRole('button', { name: /Añadir/i }))

    expect(screen.getByText('Age Uke')).toBeInTheDocument()
    expect(screen.getByText('Práctica libre')).toBeInTheDocument()
  })
})
