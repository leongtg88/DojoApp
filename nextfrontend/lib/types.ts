export interface Benefit {
  id: string;
  title: string;
  description: string;
  iconName: string;
  colorClass: string;
}

export interface Instructor {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  imagePosition?: string;
  curriculum?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  relationship: string;
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
  description?: string;
  schedule: { days: string; hours: string }[];
}

export const MOCK_BENEFITS: Benefit[] = [
  { id: "discipline", title: "Disciplina", description: "Fortaleza mental, respeto y enfoque que se extienden más allá del tatami hacia la vida diaria y escolar.", iconName: "BrainCircuit", colorClass: "text-brand-accent bg-brand-accent/10 border-brand-accent/20" },
  { id: "health", title: "Condición Física", description: "Acondicionamiento físico integral diseñado para incrementar la longevidad, agilidad y fuerza explosiva.", iconName: "Flame", colorClass: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20" },
  { id: "defense", title: "Defensa Personal", description: "Técnicas eficaces y de alto impacto del estilo Shito-Ryu Inoue Ha para resguardar la integridad y seguridad en la vida real.", iconName: "ShieldAlert", colorClass: "text-brand-red bg-brand-red/10 border-brand-red/20" },
  { id: "confidence", title: "Confianza", description: "Espíritu de superación constante y superación de límites personales que fomenta una autoestima inquebrantable.", iconName: "HeartHandshake", colorClass: "text-brand-purple bg-brand-purple/10 border-brand-purple/20" }
];

export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: "sensei-leon",
    name: "Sensei León\n Gustavo",
    role: "Director Tecnico / Head of Dojo",
    bio: "Fundador del Dojo dedicado a la enseñanza del perfeccionamiento técnico de niños y adultos de Tosei Gusoku.",
    imageUrl: "/assets/SenseiLeon.jpeg",
    imagePosition: "center 20%",
    curriculum: [
      "Cinturón Negro 2do Dan  Inoue Ha Shito-Ryu Keishin Kai",
      "Representante oficial de Shito Ryu Inoue Ha en Santo Domingo.",
      "Aprendiz directo de Shihan Manuel Balbuena y Kyoshi Julio Martínez.",
      "Especialista en metodología de enseñanza psicopedagógica para niños y adultos."
    ]
  },
  {
    id: "kyoshi-julio",
    name: "Kyoshi Julio Martínez",
    role: "Gran Maestro de la Organización",
    bio: "Linaje directo de Inoue Ha Shito-Ryu con más de 40 años de trayectoria impecable formando campeones mundiales.",
    imageUrl: "/assets/FotoKyoshi.svg",
    imagePosition: "center 1%",
    curriculum: [
      "Cinturón Negro 8vo Dan - Certificación Internacional de Japón.",
      "Asesor Técnico de la Federación Dominicana de Karate.",
      "Entrenador mentor de múltiples selecciones nacionales de las Américas.",
      "Líder de seminarios y Gasshuku en América Latina y Europa oriental."
    ]
  },
  {
    id: "German Lizardo",
    name: "Sensei German Lizardo",
    role: "Instructor Oficial",
    bio: "Columna vital de la tradición y el rigor marcial, responsable de la tecnificación constante en las filiales nacionales.",
    imageUrl: "/assets/german.svg",
    imagePosition: "center 10%",
    curriculum: [
      "Cinturón Negro 1er Dan - Inoue Ha Shito-Ryu Keishin Kai.",
      "Instructor adjunto de Tosei Gusoku Dojo.",
      "Campeón Centro Americano y el Caribe con varios títulos en camponatos internacionales."
    ]
  },
  {
    id: "shihan-muneo",
    name: "Shihan Muneo Kano",
    role: "Guía Honorario de Inoue Ha",
    bio: "Superviso junto a Shihan Manuel Balbuena periódicamente a Sensei León para su incorporación a Inoue Ha.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    curriculum: ["Maestro con conexión directa con sede en Japón.", "Degree Black Belt Iaido Seitei.", "Miembro de FEDOKEN"]
  },
  {
    id: "shihan-manuel",
    name: "Shihan Manuel Balbuena",
    role: "Sensei de León Gustavo",
    bio: "Miembro de la Armada Dominicana, 6th Dan Shindo Ryu, 5th Dan Shito Ryu Inoue Ha, 2th Dan Jujutsu, con una trayectoria de más de 21 años como entrenador.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
    curriculum: [
      "Miembro de la Armada Dominicana.", "6th Dan Shindo Ryu.", "5th Dan Shito Ryu Inoue Ha.",
      "2th Dan Jujutsu.", "21 años como entrenador de la Armada Dominicana.",
      "12 campeonatos consecutivos con 2 records en los Juegos Militares.",
      "Integrante del Primer Equipo de Kata Internacional de República Dominicana."
    ]
  }
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1", name: "María González", relationship: "Madre de Rodrigo (8 años, Cinturón Amarillo)",
    quote: "Encontrar este dojo fue un verdadero punto de inflexión para la confianza de mi hijo. El enfoque en la disciplina, el respeto y el compañerismo es justo lo que los deportes modernos suelen obviar.",
    rating: 5, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "test-2", name: "Carlos Rivera", relationship: "Alumno Adulto (Cinturón Verde)",
    quote: "Como profesional con alto nivel de estrés, Tosei Gusoku me ha devuelto el balance. Sensie León y la hermandad del tatami te exigen lo mejor en cada sesión. Es demandante pero sumamente gratificante.",
    rating: 5, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  }
];

export const MOCK_FAQS: FaqItem[] = [
  { id: "faq-1", question: "¿A qué edad pueden comenzar los niños?", answer: "Nuestro programa de Pre-Karate acepta niños desde los 5 años de edad previa evaluación. En estas etapas nos enfocamos en el desarrollo psicomotor, el equilibrio, la coordinación de movimientos y, sobre todo, la asimilación del respeto y la disciplina básica en formato lúdico pero con estructura." },
  { id: "faq-2", question: "¿Es necesario adquirir el uniforme (karategi) inmediatamente?", answer: "No. Para la clase gratis de prueba puede realizarla con pantalones deportivos sin cierres en los tobillos, t-shirt comodo, crocs o sandalias, una toallita y termo de agua. Una vez formalice su inscripción de manera definitiva, puede adquirir el uniforme oficial completo (Gi y cinta blanca)." },
  { id: "faq-3", question: "¿El karate Inoue Ha Shito-Ryu es seguro para principiantes?", answer: "Completamente. La seguridad de todos nuestros practicantes es el pilar sagrado de Tosei Gusoku. Todas las técnicas se enseñan de manera progresiva. No existe el combate de contacto pleno sin el debido equipamiento de protección y supervisión directa de los instructores autorizados." }
];

export const MOCK_GALLERY: GalleryItem[] = [
  { id: "gal-1", title: "Entrenamiento nocturno", description: "Un momento exlusivo para conocer el karate para adultos", imageUrl: "/assets/adultos.jpeg" },
  { id: "gal-2", title: "Coraje y energía", description: "Nuestros alumnos mostrando fortaleza técnica y mental.", imageUrl: "/assets/joseig.jpeg" },
  { id: "gal-3", title: "Karate en Familia", description: "Sesiones especiales de fin de semana donde padres e hijos compiten y entrenan en sintonía.", imageUrl: "/assets/adultosyninos.jpeg" },
  { id: "gal-4", title: "Pequeños pero poderosos", description: "Nuestros jovenes subiendo de nivel.", imageUrl: "/assets/soto.jpeg" }
];

export const DOJO_CLASSES: DojoClass[] = [
  {
    category: "Pequeños Guerreros\n(Pre-Karate)", age: "Edades 5 a 7 años",
    description: "Programa especializado para niños en edad preescolar y primeros años de primaria, enfocado en la coordinación motora, disciplina y respeto.",
    schedule: [
      { days: "Martes / Jueves", hours: "4:00 PM - 5:00 PM" },
      { days: "Sábados", hours: "9:00 AM - 10:00 AM / 10:00 AM - 11:00 AM" }
    ]
  },
  {
    category: "Jovenes y Adultos\n", age: "Edades 8 años en adelante",
    description: "Programa para jóvenes y adultos, enfocado en el desarrollo de habilidades técnicas y físicas.",
    schedule: [
      { days: "Martes / Jueves", hours: "5:00 PM - 6:00 PM" },
      { days: "Lunes / Miércoles (Adultos)", hours: "8:20 PM - 9:20 PM" },
      { days: "Sábado (Niños y adultos)", hours: "10:30 AM - 12:30 PM" }
    ]
  }
];
