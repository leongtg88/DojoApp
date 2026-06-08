export interface Benefit {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon identifier
  colorClass: string;
}

export interface Instructor {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  curriculum?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  relationship: string; // e.g. "Padre de Alumno (Cinturón Amarillo)"
  quote: string;
  rating: number;
  avatarUrl: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface DojoClass {
  category: string;
  age: string;
  schedule: {
    days: string;
    hours: string;
  }[];
}

// Highly polished mockup images of professional martial arts
export const MOCK_BENEFITS: Benefit[] = [
  {
    id: "discipline",
    title: "Disciplina",
    description: "Fortaleza mental, respeto y enfoque que se extienden más allá del tatami hacia la vida diaria y escolar.",
    iconName: "BrainCircuit",
    colorClass: "text-brand-accent bg-brand-accent/10 border-brand-accent/20"
  },
  {
    id: "health",
    title: "Condición Física",
    description: "Acondicionamiento físico integral diseñado para incrementar la longevidad, agilidad y fuerza explosiva.",
    iconName: "Flame",
    colorClass: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20"
  },
  {
    id: "defense",
    title: "Defensa Personal",
    description: "Técnicas eficaces y de alto impacto del estilo Shito-Ryu Inoue Ha para resguardar la integridad y seguridad en la vida real.",
    iconName: "ShieldAlert",
    colorClass: "text-brand-red bg-brand-red/10 border-brand-red/20"
  },
  {
    id: "confidence",
    title: "Confianza",
    description: "Espíritu de superación constante y superación de límites personales que fomenta una autoestima inquebrantable.",
    iconName: "HeartHandshake",
    colorClass: "text-brand-purple bg-brand-purple/10 border-brand-purple/20"
  }
];

export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "sensei-leon",
    name: "Sensei León",
    role: "Director Tecnico / Head of Dojo",
    bio: "Campeón Nacional e Internacional. Experto en la disciplina de Kata y Kumite, dedicado al perfeccionamiento técnico de niños y adultos de Tosei Gusoku.",
    imageUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=600",
    curriculum: [
      "Representante oficial de Shito Ryu Inoue Ha en Santo Domingo.",
      "Aprendiz directo de Shihan Manuel Balbuena y Kyoshi Julio Martínez.",
      "Múltiple medallista en torneos de rango internacional y panamericano.",
      "Especialista en metodología de enseñanza psicopedagógica para infantes (Little Warriors)."
    ]
  },
  {
    id: "kyoshi-julio",
    name: "Kyoshi Julio Martínez",
    role: "Gran Maestro de la Organización",
    bio: "Linaje directo de Inoue Ha Shito-Ryu con más de 40 años de trayectoria impecable formando campeones mundiales.",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
    curriculum: [
      "Cinturón Negro 8vo Dan - Certificación Internacional de Japón.",
      "Asesor Técnico de la Federación Dominicana de Karate.",
      "Entrenador mentor de múltiples selecciones nacionales del Caribe.",
      "Líder de seminarios y Gasshuku en América Latina y Europa oriental."
    ]
  },
  {
    id: "shihan-manuel",
    name: "Shihan Manuel Balbuena",
    role: "Maestro Precursor",
    bio: "Columna vital de la tradición y el rigor marcial, responsable de la tecnificación constante en las filiales nacionales.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
    curriculum: [
      "Cinturón Negro 7mo Dan - Inoue Ha Shito-Ryu Keishin Kai.",
      "Co-fundador de la enseñanza estructurada de Shito-Ryu en República Dominicana.",
      "Evaluador oficial de grados cinto negro a nivel de federación."
    ]
  },
  {
    id: "shihan-muneo",
    name: "Shihan Muneo Kano",
    role: "Guía Honorario de Inoue Ha",
    bio: "Aportó la visión global del Maestro Soke Yoshimi Inoue, supervisando periódicamente la pureza y rigurosidad técnica de los dojos.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    curriculum: [
      "Maestro Emérito Internacional con sede en Japón.",
      "Difusor de los principios dinámicos de movimiento de potencia del estilo Inoue Ha."
    ]
  }
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "María González",
    relationship: "Madre de Rodrigo (8 años, Cinturón Amarillo)",
    quote: "Encontrar este dojo fue un verdadero punto de inflexión para la confianza de mi hijo. El enfoque en la disciplina, el respeto y el compañerismo es justo lo que los deportes modernos suelen obviar.",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "test-2",
    name: "Carlos Rivera",
    relationship: "Alumno Adulto (Cinturón Verde)",
    quote: "Como profesional con alto nivel de estrés, Tosei Gusoku me ha devuelto el balance. Sensie León y la hermandad del tatami te exigen lo mejor en cada sesión. Es demandante pero sumamente gratificante.",
    rating: 5,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  }
];

export const MOCK_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "¿A qué edad pueden comenzar los niños?",
    answer: "Nuestro programa especializado de 'Little Warriors' acepta niños desde los 4 años de edad. En estas etapas nos enfocamos en el desarrollo psicomotor, el equilibrio, la coordinación de movimientos y, sobre todo, la asimilación del respeto y la disciplina básica en formato lúdico pero con estructura."
  },
  {
    id: "faq-2",
    question: "¿Es necesario adquirir el uniforme (karategi) inmediatamente?",
    answer: "No. Para las primeras clases gratuitas de prueba o iniciación, el alumno puede asistir con ropa deportiva cómoda de gimnasia (pantalla corta/larga y camiseta). Una vez formalice su inscripción de manera definitiva, le suministramos su uniforme oficial completo (Gi y cinta blanca)."
  },
  {
    id: "faq-3",
    question: "¿El karate Inoue Ha Shito-Ryu es seguro para principiantes?",
    answer: "Completamente. La seguridad de todos nuestros practicantes es el pilar sagrado de Tosei Gusoku. Todas las técnicas se enseñan de manera progresiva. No existe el combate de contacto pleno sin el debido equipamiento de protección (guanteletas, espinilleras, protector bucal) y supervisión directa de los instructores autorizados."
  }
];

export const MOCK_GALLERY: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Entrenamiento de Kata",
    description: "Sensei León corrigiendo la postura Heian Shodan con los Little Warriors en el tatami.",
    imageUrl: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-2",
    title: "Exámenes de Grado",
    description: "Nuestros alumnos mostrando fortaleza técnica y mental ante el comité de Kyoshi Julio Martínez.",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-3",
    title: "Karate en Familia",
    description: "Sesiones especiales de fin de semana donde padres e hijos compiten y entrenan en sintonía.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "gal-4",
    title: "Seminarios Internacionales",
    description: "Nuestras delegaciones en seminarios técnicos internacionales y copas panamericanas.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800"
  }
];

export const DOJO_CLASSES: DojoClass[] = [
  {
    category: "LITTLE WARRIORS (Pre-Karate)",
    age: "Edades 4 a 7 años",
    schedule: [
      { days: "Lunes / Miércoles / Viernes", hours: "4:00 PM - 5:00 PM" },
      { days: "Sábado", hours: "9:00 AM - 10:30 AM" }
    ]
  },
  {
    category: "YOUTH & ADULTS (Juvenil y Adultos)",
    age: "Edades 8 años en adelante",
    schedule: [
      { days: "Lunes a Jueves", hours: "6:30 PM - 8:30 PM" },
      { days: "Sábado (Entrenamiento Especial de Selección)", hours: "10:30 AM - 12:30 PM" }
    ]
  }
];
