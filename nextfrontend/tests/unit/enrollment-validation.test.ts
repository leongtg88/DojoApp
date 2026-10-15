import { describe, expect, it } from 'vitest'
import {
  EDAD_MINIMA_ANIOS,
  esAlturaValida,
  esCedulaValida,
  esFechaNacimientoValida,
  esTelefonoValido,
  fechaMaximaNacimiento,
} from '@/lib/enrollment-validation'

// Referencia fija para que las pruebas no dependan del día en que se ejecuten.
const REFERENCIA = new Date('2026-06-15T12:00:00Z')

describe('fechaMaximaNacimiento', () => {
  it('devuelve hoy menos la edad mínima en formato YYYY-MM-DD', () => {
    expect(fechaMaximaNacimiento(REFERENCIA)).toBe('2022-06-15')
  })
})

describe('esFechaNacimientoValida', () => {
  it('acepta justo la edad mínima', () => {
    expect(esFechaNacimientoValida('2022-06-15', REFERENCIA)).toBe(true)
  })

  it('rechaza a quien no llega a la edad mínima', () => {
    expect(esFechaNacimientoValida('2022-06-16', REFERENCIA)).toBe(false)
    expect(esFechaNacimientoValida('2024-01-01', REFERENCIA)).toBe(false)
  })

  it('rechaza fechas futuras', () => {
    expect(esFechaNacimientoValida('2030-01-01', REFERENCIA)).toBe(false)
  })

  it('rechaza formatos y fechas inexistentes', () => {
    expect(esFechaNacimientoValida('15/06/2020', REFERENCIA)).toBe(false)
    expect(esFechaNacimientoValida('2026-02-31', REFERENCIA)).toBe(false)
    expect(esFechaNacimientoValida('', REFERENCIA)).toBe(false)
  })

  it('acepta un adulto', () => {
    expect(esFechaNacimientoValida('1990-03-20', REFERENCIA)).toBe(true)
  })

  it(`la edad mínima configurada es ${EDAD_MINIMA_ANIOS}`, () => {
    expect(EDAD_MINIMA_ANIOS).toBe(4)
  })
})

describe('esAlturaValida', () => {
  it('acepta el rango permitido', () => {
    expect(esAlturaValida('50')).toBe(true)
    expect(esAlturaValida('170')).toBe(true)
    expect(esAlturaValida('250')).toBe(true)
  })

  it('rechaza valores fuera de rango o no numéricos', () => {
    expect(esAlturaValida('49')).toBe(false)
    expect(esAlturaValida('251')).toBe(false)
    expect(esAlturaValida('')).toBe(false)
    expect(esAlturaValida('abc')).toBe(false)
    expect(esAlturaValida('170.5')).toBe(false)
  })
})

describe('validaciones básicas existentes', () => {
  it('valida teléfonos por cantidad de dígitos', () => {
    expect(esTelefonoValido('809-123-4567')).toBe(true)
    expect(esTelefonoValido('8091234')).toBe(false)
    expect(esTelefonoValido('1234567890123456')).toBe(false)
  })

  it('valida cédulas de 11 dígitos', () => {
    expect(esCedulaValida('001-1234567-8')).toBe(true)
    expect(esCedulaValida('001123456')).toBe(false)
  })
})
