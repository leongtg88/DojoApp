export type ValidationKind = 'name' | 'whatsapp' | 'email' | 'age';
export type FlowNodeId = string;
export type WaTextKind = 'auto' | 'enrollment' | 'quote' | 'generic';

export interface EnrollmentDraft {
  tipo: string;
  tipo_alumno: string;
  edad: string;
  programa: string;
  horario_pref: string;
  nombre: string;
  whatsapp: string;
  email: string;
  nota: string;
  utm: string;
}

export type DraftStore = (draft: EnrollmentDraft, value: string) => EnrollmentDraft;

export interface ScheduleCard {
  kind: 'schedule';
  title: string;
  schedule: string;
  cta: string;
  next: FlowNodeId;
  store?: DraftStore;
}

export interface PriceCard {
  kind: 'price';
  title: string;
  value: string;
}

export type FlowCard = ScheduleCard | PriceCard;

export interface FlowEffect {
  post?: 'internal' | 'whatsapp';
  openWhatsApp?: boolean;
  waText?: WaTextKind;
}

export interface FlowNode {
  message?: string;
  quickReplies?: string[];
  dynamicQuickReplies?: (draft: EnrollmentDraft) => string[];
  next?: Record<string, FlowNodeId> | FlowNodeId;
  input?: boolean;
  validation?: ValidationKind;
  placeholder?: string;
  cards?: FlowCard[];
  dynamicCards?: (draft: EnrollmentDraft) => FlowCard[];
  summary?: boolean;
  store?: DraftStore;
  effect?: FlowEffect;
}

const KID_SCHEDULE_OPTIONS = [
  'Martes/Jueves 4:00 PM - 5:00 PM',
  'Sábado 9:00 AM - 10:00 AM',
  'Sábado 10:00 AM - 11:00 AM',
];

const YOUTH_SCHEDULE_OPTIONS = [
  'Martes/Jueves 5:00 PM - 6:00 PM',
  'Lunes/Miércoles 8:20 PM - 9:20 PM',
  'Sábado 10:30 AM - 12:30 PM',
];

function getProgramForDraft(draft: EnrollmentDraft): string {
  if (draft.tipo_alumno === 'Niño/a' && draft.edad === '5-7 años') return 'Pequeños Guerreros';
  return 'Jóvenes y Adultos';
}

function getScheduleOptions(draft: EnrollmentDraft): string[] {
  const options = draft.tipo_alumno === 'Niño/a' && draft.edad === '5-7 años' ? KID_SCHEDULE_OPTIONS : YOUTH_SCHEDULE_OPTIONS;
  return [...options, 'Sin preferencia', 'Volver'];
}

const HORARIO_NEXT: Record<string, FlowNodeId> = Object.fromEntries(
  [...KID_SCHEDULE_OPTIONS, ...YOUTH_SCHEDULE_OPTIONS, 'Sin preferencia'].map((o) => [o, 'clase_prueba_nombre']),
);
HORARIO_NEXT['Volver'] = 'clase_prueba_edad';

export const flow: Record<string, FlowNode> = {
  welcome: {
    message: 'Hola 👋, soy el asistente de Tosei Gusoku. ¿En qué puedo ayudarte hoy?',
    quickReplies: ['Clase de prueba', 'Horarios', 'Precios', 'Qué necesito para empezar', 'Niños', 'Hablar con el Sensei'],
    next: {
      'Clase de prueba': 'clase_prueba_confirm',
      Horarios: 'horarios',
      Precios: 'precios',
      'Qué necesito para empezar': 'que_necesito',
      Niños: 'ninos_edad',
      'Hablar con el Sensei': 'hablar_sensei',
    },
  },

  /* ───────────────────────────
     FLUJO CLASE DE PRUEBA
  ─────────────────────────── */
  clase_prueba_confirm: {
    message: '¡Perfecto! La primera clase de prueba es gratis y no necesitas karategi. Vamos a reservar tu espacio.',
    store: (draft) => ({ ...draft, tipo: 'clase_prueba' }),
    quickReplies: ['Reservar clase de prueba', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_tipo',
      'Volver al inicio': 'welcome',
    },
  },

  clase_prueba_tipo: {
    message: '¿La clase es para un niño/a o adulto?',
    store: (draft, option) => (option === 'Volver' ? draft : { ...draft, tipo_alumno: option as EnrollmentDraft['tipo_alumno'] }),
    quickReplies: ['Niño/a', 'Adulto', 'Volver'],
    next: {
      'Niño/a': 'clase_prueba_edad',
      Adulto: 'clase_prueba_edad',
      Volver: 'clase_prueba_confirm',
    },
  },

  clase_prueba_edad: {
    message: '¿Qué edad tiene el alumno/a?',
    store: (draft, option) => (option === 'Volver' ? draft : { ...draft, edad: option, horario_pref: '', programa: '' }),
    quickReplies: ['5-7 años', '8-12 años', '13-17 años', '18+', 'Volver'],
    next: {
      '5-7 años': 'clase_prueba_horario',
      '8-12 años': 'clase_prueba_horario',
      '13-17 años': 'clase_prueba_horario',
      '18+': 'clase_prueba_horario',
      Volver: 'clase_prueba_tipo',
    },
  },

  clase_prueba_horario: {
    message: 'Elige el horario que prefieras. También puedes decirme "sin preferencia".',
    dynamicQuickReplies: (draft) => getScheduleOptions(draft),
    store: (draft, option) => (option === 'Volver' ? draft : { ...draft, horario_pref: option, programa: getProgramForDraft(draft) }),
    next: HORARIO_NEXT,
  },

  clase_prueba_nombre: {
    message: '¿Cuál es el nombre completo del alumno/a?',
    input: true,
    validation: 'name',
    placeholder: 'Ej. María Pérez',
    store: (draft, value) => ({ ...draft, nombre: value }),
    next: 'clase_prueba_whatsapp',
  },

  clase_prueba_whatsapp: {
    message: 'Ingresa tu número de WhatsApp con prefijo internacional. Ejemplo: +18296378733',
    input: true,
    validation: 'whatsapp',
    placeholder: '+1 829 637 8733',
    store: (draft, value) => ({ ...draft, whatsapp: value }),
    next: 'clase_prueba_email',
  },

  clase_prueba_email: {
    message: '¿Deseas dejarnos un email? (opcional)',
    quickReplies: ['Omitir', 'Escribir email', 'Volver'],
    next: {
      Omitir: 'clase_prueba_nota',
      'Escribir email': 'clase_prueba_email_input',
      Volver: 'clase_prueba_whatsapp',
    },
  },

  clase_prueba_email_input: {
    message: 'Escribe tu email (opcional):',
    input: true,
    validation: 'email',
    placeholder: 'correo@ejemplo.com',
    store: (draft, value) => ({ ...draft, email: value }),
    next: 'clase_prueba_nota',
  },

  clase_prueba_nota: {
    message: '¿Alguna nota o preferencia?',
    quickReplies: ['Sin nota', 'Escribir nota', 'Volver'],
    next: {
      'Sin nota': 'clase_prueba_resumen',
      'Escribir nota': 'clase_prueba_nota_input',
      Volver: 'clase_prueba_email',
    },
  },

  clase_prueba_nota_input: {
    message: 'Cuéntanos tu nota o preferencia:',
    input: true,
    placeholder: 'Ej. Prefiero sábado en la mañana',
    store: (draft, value) => ({ ...draft, nota: value }),
    next: 'clase_prueba_resumen',
  },

  clase_prueba_resumen: {
    message: 'Revisa tu solicitud antes de enviar. Puedes confirmar internamente, enviar por WhatsApp o editar cualquier dato.',
    summary: true,
    quickReplies: ['Confirmar y enviar (Interno)', 'Enviar por WhatsApp ahora', 'Editar', 'Volver'],
    next: {
      'Confirmar y enviar (Interno)': 'confirmacion_interna',
      'Enviar por WhatsApp ahora': 'whatsapp_send',
      Editar: 'editar_campos',
      Volver: 'clase_prueba_nota',
    },
  },

  editar_campos: {
    message: '¿Qué dato quieres editar?',
    quickReplies: ['Editar nombre', 'Editar edad', 'Editar horario', 'Editar WhatsApp', 'Editar nota', 'Volver al resumen'],
    next: {
      'Editar nombre': 'clase_prueba_nombre',
      'Editar edad': 'clase_prueba_edad',
      'Editar horario': 'clase_prueba_horario',
      'Editar WhatsApp': 'clase_prueba_whatsapp',
      'Editar nota': 'clase_prueba_nota',
      'Volver al resumen': 'clase_prueba_resumen',
    },
  },

  confirmacion_interna: {
    message: 'Gracias — El Sensei te contactará para confirmar. También te enviaremos un WhatsApp de confirmación si proporcionaste número.',
    effect: { post: 'internal' },
    quickReplies: ['Abrir WhatsApp', 'Volver al inicio'],
    next: {
      'Abrir WhatsApp': 'whatsapp_direct',
      'Volver al inicio': 'welcome',
    },
  },

  whatsapp_send: {
    message: 'Hemos guardado tu solicitud — también puedes continuar por WhatsApp.',
    effect: { post: 'whatsapp', openWhatsApp: true, waText: 'enrollment' },
    quickReplies: ['Abrir WhatsApp', 'Volver al inicio'],
    next: {
      'Abrir WhatsApp': 'whatsapp_direct',
      'Volver al inicio': 'welcome',
    },
  },

  whatsapp_direct: {
    message: 'Abriendo WhatsApp para ti…',
    effect: { openWhatsApp: true, waText: 'auto' },
    quickReplies: ['Volver al inicio'],
    next: {
      'Volver al inicio': 'welcome',
    },
  },

  /* ───────────────────────────
     OTROS FLUJOS
  ─────────────────────────── */
  horarios: {
    message: 'Estos son los horarios por grupo:',
    cards: [
      {
        kind: 'schedule',
        title: 'Pequeños Guerreros (5-7 años)',
        schedule: 'Martes/Jueves 4:00 PM - 5:00 PM · Sábados 9:00-10:00 & 10:00-11:00 AM',
        cta: 'Agendar clase de prueba (este grupo)',
        next: 'clase_prueba_confirm',
        store: (draft) => ({ ...draft, programa: 'Pequeños Guerreros' }),
      },
      {
        kind: 'schedule',
        title: 'Jóvenes y Adultos (8+)',
        schedule: 'Martes/Jueves 5:00 PM - 6:00 PM · Lunes/Miércoles (Adultos) 8:20 PM - 9:20 PM · Sábado 10:30 AM - 12:30 PM',
        cta: 'Agendar clase de prueba (este grupo)',
        next: 'clase_prueba_confirm',
        store: (draft) => ({ ...draft, programa: 'Jóvenes y Adultos' }),
      },
    ],
    quickReplies: ['Reservar clase de prueba', 'Hablar con el Sensei', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_confirm',
      'Hablar con el Sensei': 'hablar_sensei',
      'Volver al inicio': 'welcome',
    },
  },

  precios: {
    message:
      'Estos son los planes actuales. La primera clase de prueba es gratis. Promoción familiar: 2x1 en inscripción (aplican condiciones).',
    cards: [
      { kind: 'price', title: 'Plan mensual', value: '[Precio mensual]' },
      { kind: 'price', title: 'Plan trimestral', value: '[Precio trimestral]' },
      { kind: 'price', title: 'Promoción familiar', value: '2x1 en inscripción' },
    ],
    quickReplies: ['Reservar clase de prueba', 'Solicitar cotización por WhatsApp', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_confirm',
      'Solicitar cotización por WhatsApp': 'cotizacion_whatsapp',
      'Volver al inicio': 'welcome',
    },
  },

  cotizacion_whatsapp: {
    message: 'Te estamos conectando con el equipo para enviarte una cotización personalizada.',
    effect: { openWhatsApp: true, waText: 'quote' },
    quickReplies: ['Volver al inicio'],
    next: {
      'Volver al inicio': 'welcome',
    },
  },

  que_necesito: {
    message:
      'Para tu clase de prueba solo necesitas:\n• Ropa deportiva sin cierres en el tobillo\n• T-shirt cómodo\n• Crocs o sandalias\n• Toalla\n• Termo de agua\n\nNo necesitas karategi.\n\nPara inscripción completa: foto del alumno, identificación (cédula/pasaporte/partida) y contacto de padres/tutores si es menor.',
    quickReplies: ['Reservar prueba', 'Ir a Inscripción completa', 'Chat con Sensei', 'Volver al inicio'],
    next: {
      'Reservar prueba': 'clase_prueba_confirm',
      'Ir a Inscripción completa': 'inscripcion_info',
      'Chat con Sensei': 'hablar_sensei',
      'Volver al inicio': 'welcome',
    },
  },

  inscripcion_info: {
    message:
      'La inscripción completa la formalizamos en el dojo. Trae: foto del alumno, identificación (cédula/pasaporte/partida) y, si es menor, el contacto de padres o tutores. ¿Te agendo tu clase de prueba?',
    quickReplies: ['Reservar clase de prueba', 'Hablar con el Sensei', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_confirm',
      'Hablar con el Sensei': 'hablar_sensei',
      'Volver al inicio': 'welcome',
    },
  },

  ninos_edad: {
    message: '¡Perfecto! Cuéntame un poco más. ¿Qué edad tiene el niño/a?',
    store: (draft, option) => (option === 'Volver al inicio' ? draft : { ...draft, tipo_alumno: 'Niño/a', edad: option }),
    quickReplies: ['5-7 años', '8-12 años', '13-17 años', 'Volver al inicio'],
    next: {
      '5-7 años': 'ninos_nombre',
      '8-12 años': 'ninos_nombre',
      '13-17 años': 'ninos_nombre',
      'Volver al inicio': 'welcome',
    },
  },

  ninos_nombre: {
    message: '¿Cuál es el nombre del niño/a?',
    input: true,
    validation: 'name',
    placeholder: 'Ej. Rodrigo González',
    store: (draft, value) => ({ ...draft, nombre: value, tipo: 'clase_prueba' }),
    next: 'ninos_tutor_contacto',
  },

  ninos_tutor_contacto: {
    message: 'Número de WhatsApp del padre, madre o tutor:',
    input: true,
    validation: 'whatsapp',
    placeholder: '+1 829 637 8733',
    store: (draft, value) => ({ ...draft, whatsapp: value }),
    next: 'ninos_recomendacion',
  },

  ninos_recomendacion: {
    message: 'Según la edad te recomendamos:',
    dynamicCards: (draft) => {
      const isKid = draft.edad === '5-7 años';
      const title = isKid ? 'Pequeños Guerreros (5-7 años)' : 'Jóvenes y Adultos (8+)';
      const schedule = isKid
        ? 'Martes/Jueves 4:00 PM - 5:00 PM · Sábados 9:00-10:00 & 10:00-11:00 AM'
        : 'Martes/Jueves 5:00 PM - 6:00 PM · Lunes/Miércoles (Adultos) 8:20 PM - 9:20 PM · Sábado 10:30 AM - 12:30 PM';
      return [
        {
          kind: 'schedule' as const,
          title,
          schedule,
          cta: 'Reservar clase de prueba para este grupo',
          next: 'clase_prueba_confirm',
          store: (d) => ({ ...d, programa: title }),
        },
      ];
    },
    quickReplies: ['Reservar clase de prueba', 'Agendar evaluación', 'Hablar con el Sensei', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_confirm',
      'Agendar evaluación': 'hablar_sensei',
      'Hablar con el Sensei': 'hablar_sensei',
      'Volver al inicio': 'welcome',
    },
  },

  hablar_sensei: {
    message: 'Claro, ¿prefieres que el Sensei te contacte o abrir WhatsApp ahora?',
    quickReplies: ['Solicitar llamada/WhatsApp', 'Abrir chat WhatsApp ahora', 'Volver al inicio'],
    next: {
      'Solicitar llamada/WhatsApp': 'hablar_sensei_contacto',
      'Abrir chat WhatsApp ahora': 'whatsapp_direct',
      'Volver al inicio': 'welcome',
    },
  },

  hablar_sensei_contacto: {
    message: 'Déjame tu nombre para que el Sensei te contacte:',
    input: true,
    validation: 'name',
    placeholder: 'Tu nombre',
    store: (draft, value) => ({ ...draft, nombre: value, tipo: 'contacto_sensei' }),
    next: 'hablar_sensei_whatsapp',
  },

  hablar_sensei_whatsapp: {
    message: '¿Cuál es tu número de WhatsApp?',
    input: true,
    validation: 'whatsapp',
    placeholder: '+1 829 637 8733',
    store: (draft, value) => ({ ...draft, whatsapp: value }),
    next: 'hablar_sensei_confirmacion',
  },

  hablar_sensei_confirmacion: {
    message: 'Listo, el Sensei te contactará en breve. Si es urgente, abre WhatsApp directo.',
    effect: { post: 'internal' },
    quickReplies: ['Abrir WhatsApp', 'Volver al inicio'],
    next: {
      'Abrir WhatsApp': 'whatsapp_direct',
      'Volver al inicio': 'welcome',
    },
  },
};
