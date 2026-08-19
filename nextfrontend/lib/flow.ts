export type ValidationKind = 'name' | 'whatsapp' | 'email' | 'age';
export type FlowNodeId = string;
export type WaTextKind = 'auto' | 'enrollment' | 'quote' | 'generic' | 'cotizacion';

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
  plan_seleccionado: string;
  plan_precio: string;
  protecciones: string;
  protecciones_precio: string;
  descuento_seleccionado: string;
  acuerdo_pago: boolean;
  from_cotizacion: boolean;
  cotizacion_nombre: string;
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
  description?: string;
  originalPrice?: string;
  badge?: string;
}

export type FlowCard = ScheduleCard | PriceCard;

export interface FlowEffect {
  post?: 'internal' | 'whatsapp';
  openWhatsApp?: boolean;
  waText?: WaTextKind;
}

export interface FlowNode {
  message?: string;
  getMessage?: (draft: EnrollmentDraft) => string;
  quickReplies?: string[];
  dynamicQuickReplies?: (draft: EnrollmentDraft) => string[];
  next?: Record<string, FlowNodeId> | FlowNodeId;
  dynamicNext?: (draft: EnrollmentDraft) => Record<string, FlowNodeId> | FlowNodeId;
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

const PEQUENOS_SCHEDULE_OPTIONS = [
  'Martes/Jueves 4:00 PM - 4:45 PM',
  'Sábado 9:00 AM - 9:45 AM',
  'Sábado 10:00 AM - 10:45 AM',
];

const YOUTH_SCHEDULE_OPTIONS = [
  'Martes/Jueves 5:00 PM - 6:00 PM',
  'Lunes/Miércoles 8:20 PM - 9:20 PM',
  'Sábado 9:00 AM - 10:00 AM / 10:00 AM - 11:00 AM',
];

const TRIAL_CLASS_REQUIREMENTS =
  'Para tu clase de prueba solo necesitas:\n• Ropa deportiva sin cierres en el tobillo\n• T-shirt cómodo\n• Crocs o sandalias\n• Toalla\n• Termo de agua\n\nNo necesitas karategi.\n\nPara inscripción completa: foto del alumno, identificación (cédula/pasaporte/partida) y contacto de padres/tutores si es menor.';

function getProgramForDraft(draft: EnrollmentDraft): string {
  if (draft.tipo_alumno === 'Niño/a' && draft.edad === '5-7 años') return 'Pequeños Guerreros';
  return 'Jóvenes y Adultos';
}

function getScheduleOptions(draft: EnrollmentDraft): string[] {
  const options =
    draft.tipo_alumno === 'Niño/a'
      ? draft.edad === '5-7 años'
        ? PEQUENOS_SCHEDULE_OPTIONS
        : KID_SCHEDULE_OPTIONS
      : YOUTH_SCHEDULE_OPTIONS;
  return [...options, 'Sin preferencia', 'Volver'];
}

const HORARIO_NEXT: Record<string, FlowNodeId> = Object.fromEntries(
  [...KID_SCHEDULE_OPTIONS, ...PEQUENOS_SCHEDULE_OPTIONS, ...YOUTH_SCHEDULE_OPTIONS, 'Sin preferencia'].map((o) => [
    o,
    'clase_prueba_nombre',
  ]),
);
HORARIO_NEXT['Volver'] = 'clase_prueba_tipo';

const HORARIO_NEXT_FROM_COTIZACION: Record<string, FlowNodeId> = Object.fromEntries(
  [...KID_SCHEDULE_OPTIONS, ...PEQUENOS_SCHEDULE_OPTIONS, ...YOUTH_SCHEDULE_OPTIONS, 'Sin preferencia'].map((o) => [
    o,
    'clase_prueba_nombre',
  ]),
);
HORARIO_NEXT_FROM_COTIZACION['Volver'] = 'clase_prueba_from_cotizacion';

export const flow: Record<string, FlowNode> = {
  welcome: {
    message: 'Hola 👋, soy el asistente de Tosei Gusoku. ¿En qué puedo ayudarte hoy?',
    quickReplies: ['Clase de prueba', 'Horarios', 'Precios & cotización', 'Qué necesito para empezar', 'Niños', 'Hablar con el Sensei'],
    next: {
      'Clase de prueba': 'clase_prueba_confirm',
      Horarios: 'horarios',
      'Precios & cotización': 'precio_nombre',
      'Qué necesito para empezar': 'que_necesito',
      Niños: 'ninos_edad',
      'Hablar con el Sensei': 'hablar_sensei',
    },
  },

  /* ───────────────────────────
     FLUJO CLASE DE PRUEBA
  ─────────────────────────── */
  clase_prueba_confirm: {
    message: TRIAL_CLASS_REQUIREMENTS,
    store: (draft) => ({ ...draft, tipo: 'clase_prueba' }),
    quickReplies: ['Reservar clase de prueba', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_tipo',
      'Volver al inicio': 'welcome',
    },
  },

  clase_prueba_from_cotizacion: {
    getMessage: (draft) => {
      const lines = ['Vamos a agendar tu clase de prueba. Usaremos estos datos de contacto de la cotización:'];
      if (draft.whatsapp) lines.push(`\n📱 WhatsApp: ${draft.whatsapp}`);
      if (draft.email) lines.push(`📧 Email: ${draft.email}`);
      lines.push('\n¿Los usamos?');
      return lines.join('\n');
    },
    store: (draft, option) => {
      if (option === 'No, quiero actualizar') {
        return { ...draft, from_cotizacion: false };
      }
      return draft;
    },
    quickReplies: ['Sí, usar mis datos', 'No, quiero actualizar'],
    next: {
      'Sí, usar mis datos': 'clase_prueba_horario',
      'No, quiero actualizar': 'clase_prueba_tipo',
    },
  },

  clase_prueba_tipo: {
    message: '¿La clase es para un niño/a o adulto?',
    store: (draft, option) => (option === 'Volver' ? draft : { ...draft, tipo_alumno: option as EnrollmentDraft['tipo_alumno'] }),
    quickReplies: ['Niño/a', 'Adulto', 'Volver'],
    dynamicNext: (draft) => ({
      'Niño/a': 'clase_prueba_edad',
      Adulto: 'clase_prueba_horario',
      Volver: draft.from_cotizacion ? 'clase_prueba_from_cotizacion' : 'clase_prueba_confirm',
    }),
  },

  clase_prueba_edad: {
    message: '¿Qué edad tiene el alumno/a?',
    store: (draft, option) => (option === 'Volver' ? draft : { ...draft, edad: option, horario_pref: '', programa: '' }),
    dynamicQuickReplies: (draft) => {
      const base = ['5-7 años', '8-12 años', '13-17 años', '18+'];
      const options = draft.tipo_alumno === 'Niño/a' ? base.filter((o) => o !== '18+') : base;
      return [...options, 'Volver'];
    },
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
    dynamicNext: (draft) => (draft.from_cotizacion ? HORARIO_NEXT_FROM_COTIZACION : HORARIO_NEXT),
  },

  clase_prueba_nombre: {
    message: '¿Cuál es el nombre completo del alumno/a?',
    input: true,
    validation: 'name',
    placeholder: 'Ej. María Pérez',
    store: (draft, value) => ({ ...draft, nombre: value }),
    dynamicNext: (draft) => (draft.from_cotizacion ? 'clase_prueba_nota' : 'clase_prueba_whatsapp'),
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
    message: 'Ingresa tu email',
    input: true,
    validation: 'email',
    placeholder: 'correo@ejemplo.com',
    store: (draft, value) => ({ ...draft, email: value }),
    next: 'clase_prueba_nota',
  },

  clase_prueba_nota: {
    message: '¿Alguna nota o preferencia?',
    quickReplies: ['Sin nota', 'Escribir nota', 'Volver'],
    dynamicNext: (draft) => ({
      'Sin nota': 'clase_prueba_resumen',
      'Escribir nota': 'clase_prueba_nota_input',
      Volver: draft.from_cotizacion ? 'clase_prueba_nombre' : 'clase_prueba_email',
    }),
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
    quickReplies: ['Enviar por WhatsApp ahora', 'Editar', 'Volver'],
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
        schedule: 'Martes/Jueves 4:00 PM - 4:45 PM · Sábados 9:00-9:45 & 10:00-10:45 AM',
        cta: 'Agendar clase de prueba (este grupo)',
        next: 'clase_prueba_confirm',
        store: (draft) => ({ ...draft, programa: 'Pequeños Guerreros' }),
      },
      {
        kind: 'schedule',
        title: 'Jóvenes y Adultos (8+)',
        schedule: 'Martes/Jueves 5:00 PM - 6:00 PM · Lunes/Miércoles (Adultos) 8:20 PM - 9:20 PM · Sábado 9:00 AM - 11:00 AM',
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
    message: 'Estos son los precios vigentes en Tosei Gusoku para 2026. ¿Qué categoría te interesa?',
    quickReplies: [
      'Planes base',
      'Descuentos familiares',
      'Clases a domicilio',
      'Clases privadas',
      'Alto rendimiento',
      'Reservar clase de prueba',
      'Volver al inicio',
    ],
    next: {
      'Planes base': 'precios_base',
      'Descuentos familiares': 'precios_familia',
      'Clases a domicilio': 'precios_domicilio',
      'Clases privadas': 'precios_privadas',
      'Alto rendimiento': 'precios_alto_rendimiento',
      'Reservar clase de prueba': 'clase_prueba_confirm',
      'Volver al inicio': 'welcome',
    },
  },

  precios_base: {
    message: 'Planes mensuales regulares — la clase de prueba es gratis:',
    cards: [
      { kind: 'price', title: 'Niños 5-7 años', value: 'RD$3,800/mes', description: '90 min/semana (2 clases de 45 min)' },
      { kind: 'price', title: 'Niños 8+ y Adultos', value: 'RD$3,300/mes', description: '2 horas/semana' },
      { kind: 'price', title: 'Inscripción', value: 'RD$3,000', description: 'Por persona, pago único' },
      { kind: 'price', title: 'Uniforme (Karategi)', value: 'RD$3,000 – 12,000', description: 'Según modelo y talla' },
      { kind: 'price', title: 'Carnet Federación', value: 'RD$1,200', description: 'Gestión administrativa' },
      { kind: 'price', title: 'Sello Uniforme', value: 'RD$800', description: 'Logo de Inoue-Ha' },
      { kind: 'price', title: 'Guantines protectores manos', value: 'RD$2500', description: 'Guantines para manos' },
      { kind: 'price', title: 'Guantines protectores pies', value: 'RD$2500', description: 'Guantines para pies' },


    ],
    quickReplies: ['Descuentos familiares', 'Clases a domicilio', 'Quiero cotización', 'Reservar clase de prueba', 'Volver a precios', 'Volver al inicio'],
    next: {
      'Descuentos familiares': 'precios_familia',
      'Clases a domicilio': 'precios_domicilio',
      'Quiero cotización': 'precio_nombre',
      'Reservar clase de prueba': 'clase_prueba_confirm',
      'Volver a precios': 'precios',
      'Volver al inicio': 'welcome',
    },
  },

  precios_familia: {
    message: 'Descuentos familiares — combinaciones y precios especiales. La inscripción familiar siempre es más barata:',
    cards: [
      { kind: 'price', title: 'Hermanos mixtos (5-7 + 8+)', value: 'RD$7,100/mes total', description: 'Un hermano de  5-7 años y otro de 8+ años. Cada uno paga tarifa regular. Inscripción 2x1.', badge: '2x1 INSCRIPCIÓN' },
      { kind: 'price', title: '2 hermanos ambos 5-7 años', value: 'RD$7,000/mes total', description: ' RD$3,200 c/u (ahorro RD$600). Inscripción 2x1.', badge: '2x1 INSCRIPCIÓN' },
      { kind: 'price', title: '3 hermanos ambos 5-7 años', value: 'RD$9,600/mes total', description: 'RD$3,200 c/u (ahorro RD$1,800). Inscripción: 1.5x.', badge: 'AHORRO RD$1,800' },
      { kind: 'price', title: '2 hermanos 8+ ó Padre + hijo 8+', value: 'RD$6,000/mes total', description: 'Dos hermanos de 8+ años o Padre + hijo de 8+ años. RD$3,000 c/u (ahorro RD$600). Inscripción 2x1.', badge: '2x1 INSCRIPCIÓN' },
      { kind: 'price', title: '3 hermanos 8+', value: 'RD$9,000/mes total', description: 'RD$3,000 c/u (ahorro RD$900). Inscripción: 1.5x.', badge: 'AHORRO RD$900' },
      { kind: 'price', title: 'Padre + hijo 5-7 años', value: 'RD$6,400/mes total', description: 'RD$3,200 c/u (ahorro RD$700). Inscripción 2x1.', badge: '2x1 INSCRIPCIÓN' },
    ],
    quickReplies: ['Planes base', 'Clases a domicilio', 'Solicitar cotización por WhatsApp', 'Volver a precios', 'Volver al inicio'],
    next: {
      'Planes base': 'precios_base',
      'Clases a domicilio': 'precios_domicilio',
      'Solicitar cotización por WhatsApp': 'cotizacion_whatsapp',
      'Volver a precios': 'precios',
      'Volver al inicio': 'welcome',
    },
  },

  precios_domicilio: {
    message: 'Clases a domicilio — precios por paquete. La mensualidad se paga por adelantado:',
    cards: [
      { kind: 'price', title: 'Sesión suelta (1 alumno)', value: 'RD$1,500/sesión', description: '1 sesión individual a domicilio' },
      { kind: 'price', title: '4 sesiones (1 alumno)', value: 'RD$4,800', description: 'RD$1,200/sesión · Ahorro vs. suelta' },
      { kind: 'price', title: '8 sesiones (1 alumno)', value: 'RD$7,000', description: 'RD$1,000/sesión · Ahorro vs. suelta', badge: 'MEJOR VALOR' },
      { kind: 'price', title: '8 sesiones grupo (2 alumnos)', value: 'RD$10,400/mes', description: 'RD$650/alumno/sesión · 8 sesiones' },
      { kind: 'price', title: '8 sesiones grupo (4 alumnos)', value: 'RD$14,400/mes', description: 'RD$450/alumno/sesión · 8 sesiones', badge: 'GRUPO' },
    ],
    quickReplies: ['Planes base', 'Clases privadas', 'Solicitar cotización por WhatsApp', 'Volver a precios', 'Volver al inicio'],
    next: {
      'Planes base': 'precios_base',
      'Clases privadas': 'precios_privadas',
      'Solicitar cotización por WhatsApp': 'cotizacion_whatsapp',
      'Volver a precios': 'precios',
      'Volver al inicio': 'welcome',
    },
  },

  precios_privadas: {
    message: 'Clases privadas en el dojo — sesión individual con el Sensei:',
    cards: [
      { kind: 'price', title: 'Clase Privada en Dojo', value: 'RD$1,000/sesión', description: '45 min · Martes/Jueves 3:15-4:00 PM · Sábados 8:00-9:00 AM' },
    ],
    quickReplies: ['Alto rendimiento', 'Planes base', 'Volver a precios', 'Volver al inicio'],
    next: {
      'Alto rendimiento': 'precios_alto_rendimiento',
      'Planes base': 'precios_base',
      'Volver a precios': 'precios',
      'Volver al inicio': 'welcome',
    },
  },

  precios_alto_rendimiento: {
    message: 'Entrenamiento de Alto Rendimiento — sábados y domingos 6:00-9:00 AM:',
    cards: [
      { kind: 'price', title: 'Por fin de semana', value: 'RD$2,000', description: 'Sábado + Domingo · 6 horas totales (3h c/u)' },
      { kind: 'price', title: 'Paquete mensual', value: 'RD$7,000/mes', description: '4 fines de semana · Pago único', badge: 'MEJOR VALOR' },
    ],
    quickReplies: ['Clases privadas', 'Quiero cotización', 'Volver a precios', 'Volver al inicio'],
    next: {
      'Clases privadas': 'precios_privadas',
      'Quiero cotización': 'precio_nombre',
      'Volver a precios': 'precios',
      'Volver al inicio': 'welcome',
    },
  },

  precios_competicion: {
    message: 'Paquetes para cinturones avanzados / competición — se suman al plan base regular (RD$3,300/mes):',
    cards: [
      {
        kind: 'price', title: 'Programa Técnico', value: 'RD$6,800/mes',
        description: '8 privadas/mes (Martes y Jueves, 45 min c/u). Trabajo técnico individualizado.',
        originalPrice: 'RD$8,000', badge: '15% OFF',
      },
      {
        kind: 'price', title: 'Programa Alto Rendimiento', value: 'RD$7,600/mes',
        description: '4 fines de semana/mes (24h totales). Volumen y condición física.',
        originalPrice: 'RD$8,000', badge: '5% OFF',
      },
      {
        kind: 'price', title: 'Programa Integral', value: 'RD$12,800/mes',
        description: 'Técnico + Alto Rendimiento completos. El paquete más completo.',
        originalPrice: 'RD$16,000', badge: '20% OFF',
      },
    ],
    quickReplies: ['Planes base', 'Alto rendimiento', 'Quiero cotización', 'Volver a precios', 'Volver al inicio'],
    next: {
      'Planes base': 'precios_base',
      'Alto rendimiento': 'precios_alto_rendimiento',
      'Quiero cotización': 'precio_nombre',
      'Volver a precios': 'precios',
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

  /* ───────────────────────────
     FLUJO COTIZACIÓN / SELECCIÓN DE PRECIO
  ─────────────────────────── */
  precio_nombre: {
    message: 'Perfecto, vamos a armar tu cotización. Primero necesito algunos datos.\n\n¿Cuál es tu nombre completo?',
    input: true,
    validation: 'name',
    placeholder: 'Ej. María Pérez',
    store: (draft, value) => ({ ...draft, nombre: value, tipo: 'cotizacion' }),
    next: 'precio_telefono',
  },

  precio_telefono: {
    message: '¿Cuál es tu número de WhatsApp con prefijo internacional?',
    input: true,
    validation: 'whatsapp',
    placeholder: '+1 829 637 8733',
    store: (draft, value) => ({ ...draft, whatsapp: value }),
    next: 'precio_email',
  },

  precio_email: {
    message: '¿Cuál es tu email?',
    input: true,
    validation: 'email',
    placeholder: 'correo@ejemplo.com',
    store: (draft, value) => ({ ...draft, email: value }),
    next: 'precio_seleccion_plan',
  },

  precio_seleccion_plan: {
    message: 'Ahora selecciona el plan mensual que se ajuste a tu caso:',
    cards: [
      { kind: 'price', title: 'Niños 5-7 años', value: 'RD$3,800/mes', description: '90 min/semana (2 clases de 45 min)' },
      { kind: 'price', title: 'Niños 8+ y Adultos', value: 'RD$3,300/mes', description: '2 horas/semana' },
    ],
    quickReplies: ['Niños 5-7 años (RD$3,800/mes)', 'Niños 8+ / Adultos (RD$3,300/mes)', 'Volver'],
    store: (draft, option) => {
      if (option === 'Volver') return draft;
      const isKid = option.includes('5-7');
      return {
        ...draft,
        plan_seleccionado: isKid ? 'Niños 5-7 años' : 'Niños 8+ / Adultos',
        plan_precio: isKid ? 'RD$3,800/mes' : 'RD$3,300/mes',
        edad: isKid ? '5-7 años' : '8+',
        tipo_alumno: isKid ? 'Niño/a' : 'Adulto',
      };
    },
    next: {
      'Niños 5-7 años (RD$3,800/mes)': 'precio_seleccion_protecciones',
      'Niños 8+ / Adultos (RD$3,300/mes)': 'precio_seleccion_protecciones',
      Volver: 'precio_email',
    },
  },

  precio_seleccion_protecciones: {
    message: '¿Necesitas guantines protectores? Puedes elegir uno, ambos o ninguno:',
    quickReplies: [
      'Guantines manos (RD$2,500)',
      'Espinilleras pies (RD$2,900)',
      'Ambas protecciones (RD$5,400)',
      'Sin protecciones',
      'Volver',
    ],
    store: (draft, option) => {
      if (option === 'Volver') return draft;
      let precio = 'RD$0';
      if (option.includes('Ambos')) precio = 'RD$5,400';
      else if (option.includes('manos') || option.includes('pies')) precio = 'RD$2,500';
      return { ...draft, protecciones: option, protecciones_precio: precio };
    },
    next: {
      'Guantines manos (RD$2,500)': 'precio_seleccion_descuento',
      'Espinilleras pies (RD$2,900)': 'precio_seleccion_descuento',
      'Ambas protecciones (RD$5,400)': 'precio_seleccion_descuento',
      'Sin protecciones': 'precio_seleccion_descuento',
      Volver: 'precio_seleccion_plan',
    },
  },

  precio_seleccion_descuento: {
    message: '¿Aplica algún descuento familiar? Selecciona el que corresponda o "Ninguno". Lo verificaremos al procesar tu solicitud.',
    quickReplies: [
      'Hermanos mixtos (5-7 + 8+)',
      '2 hermanos ambos 5-7',
      '3 hermanos ambos 5-7',
      '(2 hermanos 8+) ó (Padre + hijo 8+)',
      '3 hermanos 8+',
      'Padre + hijo 5-7',
      'Ninguno',
      'Volver',
    ],
    store: (draft, option) => (option === 'Volver' ? draft : { ...draft, descuento_seleccionado: option }),
    next: {
      'Hermanos mixtos (5-7 + 8+)': 'precio_resumen',
      '2 hermanos ambos 5-7': 'precio_resumen',
      '3 hermanos ambos 5-7': 'precio_resumen',
      '(2 hermanos 8+) ó (Padre + hijo 8+)': 'precio_resumen',
      '3 hermanos 8+': 'precio_resumen',
      'Padre + hijo 5-7': 'precio_resumen',
      Ninguno: 'precio_resumen',
      Volver: 'precio_seleccion_protecciones',
    },
  },

  precio_resumen: {
    message: 'Revisa tu cotización antes de enviar. Todo incluye carnet de federación, sello de uniforme y uniforme de principiante.',
    summary: true,
    store: (draft, option) => {
      if (option === 'Agendar clase de cortesía') {
        return { ...draft, from_cotizacion: true, tipo: 'clase_prueba', cotizacion_nombre: draft.nombre };
      }
      return draft;
    },
    quickReplies: ['Enviar por WhatsApp', 'Acuerdo de pago', 'Agendar clase de cortesía', 'Editar selección', 'Volver'],
    next: {
      'Enviar por WhatsApp': 'precio_whatsapp_send',
      'Acuerdo de pago': 'precio_acuerdo_pago',
      'Agendar clase de cortesía': 'clase_prueba_from_cotizacion',
      'Editar selección': 'precio_editar',
      Volver: 'precio_seleccion_descuento',
    },
  },

  precio_acuerdo_pago: {
    message: 'Marcado ✓ — Necesitas un acuerdo de pago. El Sensei te contactará para definir las condiciones.',
    store: (draft) => ({ ...draft, acuerdo_pago: true }),
    quickReplies: ['Enviar por WhatsApp', 'Volver al resumen'],
    next: {
      'Enviar por WhatsApp': 'precio_whatsapp_send',
      'Volver al resumen': 'precio_resumen',
    },
  },

  precio_editar: {
    message: '¿Qué dato quieres editar?',
    quickReplies: ['Editar nombre', 'Editar teléfono', 'Editar plan', 'Editar protecciones', 'Editar descuento', 'Volver al resumen'],
    next: {
      'Editar nombre': 'precio_nombre',
      'Editar teléfono': 'precio_telefono',
      'Editar plan': 'precio_seleccion_plan',
      'Editar protecciones': 'precio_seleccion_protecciones',
      'Editar descuento': 'precio_seleccion_descuento',
      'Volver al resumen': 'precio_resumen',
    },
  },

  precio_whatsapp_send: {
    message: 'Abriendo WhatsApp con tu cotización completa...',
    effect: { openWhatsApp: true, waText: 'cotizacion' },
    quickReplies: ['Volver al inicio'],
    next: {
      'Volver al inicio': 'welcome',
    },
  },

  que_necesito: {
    message:
      'Te sugerimos revisar las informaciones de los horarios, nuestra ubicación y las condiciones para la clase de prueba.',
    quickReplies: ['Clase de prueba', 'Horarios', 'Ubicación', 'Volver al inicio'],
    next: {
      'Clase de prueba': 'que_necesito_clase_prueba',
      Horarios: 'horarios',
      'Ubicación': 'ubicacion',
      'Volver al inicio': 'welcome',
    },
  },

  que_necesito_clase_prueba: {
    message: TRIAL_CLASS_REQUIREMENTS,
    quickReplies: ['Reservar prueba', 'Ir a Inscripción completa', 'Chat con Sensei', 'Volver al inicio'],
    next: {
      'Reservar prueba': 'clase_prueba_confirm',
      'Ir a Inscripción completa': 'inscripcion_info',
      'Chat con Sensei': 'hablar_sensei',
      'Volver al inicio': 'welcome',
    },
  },

  ubicacion: {
    message:
      'Nos encontramos en Plaza Lulie, 3era planta, esquina Av. 27 de Febrero con C. Carmen Mendoza, Ensanche Quisqueya, Los Millones, Santo Domingo.\n\nHorario de atención: Lunes a Viernes 2:30 PM - 7:30 PM.',
    quickReplies: ['Reservar clase de prueba', 'Horarios', 'Volver al inicio'],
    next: {
      'Reservar clase de prueba': 'clase_prueba_confirm',
      Horarios: 'horarios',
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
        ? 'Martes/Jueves 4:00 PM - 4:45 PM · Sábados 9:00-9:45 & 10:00-10:45 AM'
        : 'Martes/Jueves 4:00 PM - 5:00 PM · Sábados 9:00-10:00 & 10:00-11:00 AM';
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
