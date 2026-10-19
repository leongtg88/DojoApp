import { describe, expect, it } from 'vitest'
import { flow, INPUT_FIELD, type EnrollmentDraft } from '@/lib/flow'

// Invariantes del grafo del asistente: sin nodos colgantes ni referencias rotas.
const DRAFT: EnrollmentDraft = {
  tipo: '',
  tipo_alumno: '',
  edad: '',
  programa: '',
  horario_pref: '',
  nombre: '',
  whatsapp: '',
  email: '',
  nota: '',
  utm: '',
  plan_seleccionado: '',
  plan_precio: '',
  protecciones: '',
  protecciones_precio: '',
  descuento_seleccionado: '',
  acuerdo_pago: false,
  from_cotizacion: false,
  cotizacion_nombre: '',
}

function targetsOf(id: string): string[] {
  const node = flow[id]
  const targets: string[] = []
  if (typeof node.next === 'string') targets.push(node.next)
  else if (node.next) targets.push(...Object.values(node.next))
  if (node.dynamicNext) {
    const dynamic = node.dynamicNext(DRAFT)
    if (typeof dynamic === 'string') targets.push(dynamic)
    else targets.push(...Object.values(dynamic))
  }
  return targets
}

describe('grafo del asistente (lib/flow)', () => {
  it('todos los destinos de navegación existen', () => {
    for (const id of Object.keys(flow)) {
      for (const target of targetsOf(id)) {
        expect(flow[target], `${id} → ${target} no existe`).toBeDefined()
      }
    }
  })

  it('los campos de entrada apuntan a nodos de entrada existentes', () => {
    for (const [nodeId, field] of Object.entries(INPUT_FIELD)) {
      expect(flow[nodeId], `${nodeId} no existe`).toBeDefined()
      expect(flow[nodeId].input, `${nodeId} debería ser input`).toBe(true)
      expect(DRAFT).toHaveProperty(field as string)
    }
  })

  it('los nodos dinámicos no lanzan con un borrador vacío', () => {
    for (const node of Object.values(flow)) {
      expect(() => node.getMessage?.(DRAFT)).not.toThrow()
      expect(() => node.dynamicQuickReplies?.(DRAFT)).not.toThrow()
      expect(() => node.dynamicCards?.(DRAFT)).not.toThrow()
      expect(() => node.dynamicNext?.(DRAFT)).not.toThrow()
    }
  })

  it('cada nodo con quickReplies ofrece al menos una opción', () => {
    for (const [id, node] of Object.entries(flow)) {
      if (!node.quickReplies) continue
      expect(node.quickReplies.length, `${id} sin opciones`).toBeGreaterThan(0)
    }
  })
})
