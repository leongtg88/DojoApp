import { describe, expect, it } from 'vitest'
import { validateAge, validateEmail, validateName, validateWhatsApp } from '@/lib/validation'

describe('validación del asistente', () => {
  it('validateName exige al menos 2 caracteres', () => {
    expect(validateName('A')).toBe(false)
    expect(validateName('  ')).toBe(false)
    expect(validateName('Ana')).toBe(true)
  })

  it('validateAge acepta "adulto", "18+" y rangos numéricos', () => {
    expect(validateAge('adulto')).toBe(true)
    expect(validateAge('18+')).toBe(true)
    expect(validateAge('5')).toBe(true)
    expect(validateAge('2')).toBe(false)
    expect(validateAge('101')).toBe(false)
    expect(validateAge('abc')).toBe(false)
  })

  it('validateWhatsApp exige prefijo + y 8-15 dígitos', () => {
    expect(validateWhatsApp('+1 829 637 8733')).toBe(true)
    expect(validateWhatsApp('8296378733')).toBe(false)
    expect(validateWhatsApp('+12')).toBe(false)
  })

  it('validateEmail es opcional pero valida el formato si hay valor', () => {
    expect(validateEmail('')).toBe(true)
    expect(validateEmail('a@b.co')).toBe(true)
    expect(validateEmail('no-es-email')).toBe(false)
  })
})
