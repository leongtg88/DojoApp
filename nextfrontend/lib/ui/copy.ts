/**
 * UX-01 · Textos reutilizables (guía, secciones 3.2 y 5).
 *
 * Reglas: español claro, tuteo, frases cortas y verbos de acción concretos.
 * Si un texto se repite en dos componentes, vive aquí.
 * Los estados vacíos siempre traen una acción (principio 6 de la guía).
 */

export const COPY = {
  actions: {
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    retry: 'Reintentar',
    close: 'Cerrar',
  },
  confirm: {
    destructiveTitle: '¿Seguro que quieres continuar?',
    destructiveMessage: 'Esta acción no se puede deshacer.',
  },
  errors: {
    generic: 'No pudimos completar la acción. Inténtalo de nuevo.',
    network: 'Revisa tu conexión e inténtalo otra vez.',
  },
  empty: {
    practice: {
      title: 'Aún no has registrado práctica',
      description: 'Anota tus repeticiones para ver tu avance.',
      action: 'Registrar mi primera práctica',
    },
    recoveries: {
      title: 'No tienes faltas por reponer',
      description: 'Si faltas a clase, aquí podrás solicitar la reposición.',
      action: 'Ver mi horario',
    },
    katas: {
      title: 'Todavía no tienes katas asignadas',
      description: 'Tu instructor asignará las katas de tu grado.',
      action: 'Ver mi grado',
    },
  },
} as const

export type EmptyStateCopy = keyof typeof COPY['empty']
