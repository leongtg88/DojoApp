import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DatePicker } from '@/components/ui/date-picker'

// INV-01 (UI) · El selector muestra la fecha de calendario en UTC.
// Regresión: la ficha médica mostraba un día menos en zona RD.
describe('INV-01 · DatePicker muestra la fecha de calendario (UTC)', () => {
  it('muestra el día guardado (medianoche UTC) sin restarlo', () => {
    render(<DatePicker onChange={() => {}} value="2017-05-06" />)

    expect(screen.getByRole('button')).toHaveTextContent('6 de mayo de 2017')
  })
})
