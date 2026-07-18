import { useState } from 'react';
import { motion } from 'motion/react';
import {
  MOCK_BENEFITS,
  MOCK_TESTIMONIALS,
  MOCK_FAQS,
  DOJO_CLASSES,
  MOCK_INSTRUCTORS
} from '../types';
import {
  BrainCircuit,
  Flame,
  ShieldAlert,
  HeartHandshake,
  ChevronDown,
  Star,
  MapPin,
  Phone,
  Clock,
  Navigation,
  ArrowRight,
  Sparkles,
  Camera,
  MessagesSquare,
  Play,
  Users,
  Award,
  CalendarDays,
  Smile,
  ShieldCheck
} from 'lucide-react';
import GalleryLightbox from './GalleryLightbox';
import Hero5 from './Hero5';
import Mawashi from '../assets/Mawashiguericintorunnegro2026.svg';
import LetrasIkia from '../assets/letrasIkia.png';
import Karafamilia from '../assets/20250830_110023.jpg';
import Logosolo from '../assets/LogoSolo.svg'


interface HomeViewProps {
  onOpenEnrollment: (program?: string) => void;
  onNavigateToAbout: () => void;
}

export default function HomeView({ onOpenEnrollment, onNavigateToAbout }: HomeViewProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Simple icon renderer based on registered benefit ID
  const getBenefitIcon = (iconName: string) => {
    switch (iconName) {
      case 'BrainCircuit': return <BrainCircuit className="w-8 h-8" />;
      case 'Flame': return <Flame className="w-8 h-8" />;
      case 'ShieldAlert': return <ShieldAlert className="w-8 h-8" />;
      case 'HeartHandshake': return <HeartHandshake className="w-8 h-8" />;
      default: return <BrainCircuit className="w-8 h-8" />;
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="space-y-0 min-h-screen bg-brand-bg text-[#dee2f0]">

      {/* 1. Hero Banner */}
      <Hero5 />

      {/* 2. Karate en Santo Domingo */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className=" space-y-3">
          <h2 className="text-right   max-w-5xl mx-auto text-3xl sm:text-4xl font-extrabold font-display uppercase tracking-tight leading-4 text-gray-700">
            Karate Do en Santo Domingo
          </h2>
          <h3 className="text-right   max-w-5xl mx-auto text-xl sm:text-2xl font-bold text-gray-700">
            Shito Ryu Inoue-Ha
          </h3>
          <p className="text-sm text-right sm:text-base text-gray-700 max-w-5xl mx-auto">
            Tenemos como finalidad darle a cada <span className="font-semibold">niño, joven y adulto, la posibilidad de evolucionar y alcanzar las metas que se propongan </span> dentro de sus capacidades, siempre teniendo en <span className="font-semibold"> alto el espíritu y trabajando para desarrollar la voluntad para lograrlo</span>. Acompañamos y apoyamos a los practicantes en entender que <span className="font-semibold">los obstáculos son desafíos que deben atravesar</span>, que a veces <span className="font-semibold">la disciplina puede ser  frustrante a pesar de amar lo que hacemos, a través de la motivación al logro por merito personal, sin caer en comparación con otros, venciendose así mismos, volvemos éstos, fines últimos del verdadero sentido de la victoria.</span><br /> <br />

            Sabemos que podemos <span className="font-semibold"> promover la preparación de nuevas generaciones </span> colabornado en aumentar las  posibilidades de  mantener los objetivos que se propongan, a pesar de los obstáculos que se les presenten ahora y siempre, <span className="font-semibold">no darse por vencidos fácilmente y mantener el espíritu de un guerrero son las herramientas con las que lograrán superarse por medio de la practica del karate.</span>
            <br /> <br />
            <span className="font-bold">León Gustavo</span>
            <br />
            <span className="font-bold">Sensei</span>          </p>
          <div className="flex flex-row items-center justify-center pt-6">
            <img src={LetrasIkia} alt="Letras Iskia" className="w-[16em]  h-auto   " />
            <img src={Mawashi} alt="Logo Iskia" className="w-[16em]  h-auto   " />
          </div>
        </div>

      </section>


      {/* 3. Sucursal 27 de Febrero */}
      <section className="py-15 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className=" text-left">
          <span className="inline-block px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-xs font-bold font-display uppercase">Sede Santo Domingo</span>
          <h3 className="text-3xl  sm:text-4xl  pb-8 font-extrabold font-display text-gray-700">
            Sucursal 27 de Feb.
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">


          {/* Left info box */}
          <div className="lg:col-span-5 space-y-6 text-left backdrop-blur-xs">

            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-sans">
              Visítanos en nuestras instalaciones principales. Ofrecemos <span className="font-semibold">áreas de entrenamiento climatizadas con vestidores y baños, </span> secretaría de atención personalizada y zona de espera para padres de familia.
            </p>

            <div className="space-y-4  shadow-lg backdrop-blur-xl p-5 rounded-2xl">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-accent shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-gray-700">Dirección de la Escuela</h4>
                  <p className="text-xs text-gray-700/70 mt-0.5">Plaza Lulie 3era planta, esquina Av. 27 de Febrero con C. Carmen Mendoza, Ensache Quisquella, Los Millones, Santo Domingo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-accent shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-gray-700">Llama Directamente / WhatsApp</h4>
                  <p className="text-xs text-gray-700/70 mt-0.5">+1 (829) 6378733</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-brand-secondary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-gray-700">Horario de Atención</h4>
                  <p className="text-xs text-gray-700/70 mt-0.5">Lunes a Viernes: 2:30 PM - 7:30 PM</p>
                </div>
              </div>
            </div>

            {/*Button Map */}
            <div className="pt-2">
              <a
                href="https://www.google.com/maps/place/Karate+Do+Tosei+Gusoku+Dojo+Shito+Ryu+Inoue+Ha/@18.4574589,-69.9520022,825m/data=!3m2!1e3!4b1!4m6!3m5!1s0x8ea563c15898befd:0x386c75f4f249964f!8m2!3d18.4574538!4d-69.9494273!16s%2Fg%2F11rckyjhp1?entry=ttu&g_ep=EgoyMDI2MDcwOC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="hero-button glass-card-hover  w-full sm:w-auto"
              >
                ¿CÓMO LLEGAR AL DOJO?
                <Navigation className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>

          {/*End  Left info box */}


          {/* Right Side Map Placeholder visual */}
          <div className="lg:col-span-7 h-[28rem] w-full rounded-2xl overflow-hidden relative border border-white/10 group  flex items-center justify-center shadow-lg backdrop-blur-xl">
            {/* Visual satellite stylized map background representation */}
            <div className="absolute inset-0  bg-brand-bg flex flex-col justify-between p-4 ">

              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3592.39242156863!2d-69.95200222512133!3d18.45745887109965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ea563c15898befd%3A0x386c75f4f249964f!2sKarate%20Do%20Tosei%20Gusoku%20Dojo%20Shito%20Ryu%20Inoue%20Ha!5e1!3m2!1ses!2sdo!4v1783807868699!5m2!1ses!2sdo"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="mapa-container iframe  w-full h-full "
              />
              {/* Graphic custom retro map grid look 
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />*/}

              {/* Mock roads layout in SVG or lines
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-full h-1.5 bg-white/5" />
                <div className="absolute top-1/2 left-0 w-full h-2 bg-brand-accent/10" />
                <div className="absolute left-1/3 top-0 w-2 h-full bg-white/5" />
                <div className="absolute left-2/3 top-0 w-1.5 h-full bg-white/5" />
              </div> */}

              {/* Glowing Dojo Marker Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center space-y-2 z-10 flex flex-col items-center">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-red border-2 border-white flex items-center justify-center shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  </span>
                </span>
                <p className="bg-black/90 text-[10px] font-bold text-white px-2 py-1 rounded-md border border-brand-accent uppercase tracking-wider whitespace-nowrap">
                  TOSEI GUSOKU DOJO
                </p>
                <p className="text-[9px] text-white block bg-black/85 px-1.5 py-0.5 rounded font-mono">
                  Av. 27 de Febrero
                </p>
              </div>
            </div>

            {/* Interactive maps callout button 
            <a
              href="https://maps.google.com/?q=Av.+27+de+Febrero+Santo+Domingo"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 glass-card px-6 py-4 rounded-full flex items-center gap-3 text-gray-700 border-white/20 font-bold shadow-2xl hover:bg-brand-accent hover:text-black transition-all group-hover:scale-105 cursor-pointer"
            >
              <span className="material-symbols-outlined text-brand-accent group-hover:text-black">location_on</span>
              <span>ABRIR EN GOOGLE MAPS</span>
            </a>*/}
          </div>

        </div>
      </section>


      {/* 4. Horarios del Dojo */}
      <section className="py-20 bg-white
        border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">

          <div className="text-left ">
            <div className="inline-flex items-center gap-2 bg-white border border-brand-accent/20 px-3 py-1 rounded-full text-brand-accent text-xs font-bold font-display uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5" /> Clases Semanales
            </div>
            <h2 className="text-3xl text-left sm:text-4xl font-extrabold font-display  tracking-tight text-gray-700">
              Horarios de Entrenamiento
            </h2>
            <p className="text-sm text-left sm:text-base text-gray-700/60 max-w-2xl ">

            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">
            {DOJO_CLASSES.map((cls, idx) => (
              <div
                key={idx}
                className={`p-6 md:p-8 shadow-xl rounded-2xl border ${idx === 0 ? 'border-brand-accent/10' : 'border-brand-secondary/10'
                  } space-y-6 flex flex-col justify-between`}
              >
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${idx === 0 ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-secondary/10 text-brand-secondary'
                      }`}>
                      {cls.age}
                    </span>
                    <Clock className="w-5 h-5 text-gray-700/40" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-700 font-display uppercase tracking-wide  whitespace-pre-line">
                    {cls.category}
                  </h3>
                  <p className="text-sm text-gray-700">
                    {cls.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 shadow-md border-t border-white/10 rounded-xl">
                  {cls.schedule.map((sch, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex justify-between items-center bg-brand-bg p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="text-left space-y-0.5">
                        <p className="text-sm font-bold text-gray-700">{sch.days}</p>
                        <p className="text-xs text-gray-700/60">Días establecidos</p>
                      </div>
                      <div className="text-right">
                        <span className="text-brand-accent font-mono text-sm font-bold">{sch.hours}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => onOpenEnrollment(idx === 0 ? 'kid' : 'adult')}
                    className="hero-button uppercase cursor-pointer"
                  >
                    AGENDAR CLASE DE PRUEBA DE ESTE GRUPO
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* 6. Karate para la Familia (Sección Promocional) */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Ambient glow container */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl -z-10" />
        <div className="absolute left-0 bottom-0 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20 px-3 py-1 rounded-full text-xs font-bold font-display uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Comunidad Familiar
          </div>
          <h3 className="text-3xl  sm:text-4xl font-extrabold font-display text-gray-700 leading-tight">
            Karate para Toda la Familia
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-6">

            {/* Promo Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">

              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                El Karate es una de las pocas disciplinas integrales donde <span className="font-semibold">padres e hijos pueden entrenar y crecer en la mismo espacio. </span>Ofrecemos clases con programas para pequeños desde los 5 años y clases de adultos que re-establecen su salud y confianza.
              </p>
              <div className="p-4 shadow-xl ring-1 ring-white/10 rounded-xl space-y-2 max-w-md">
                <p className="font-bold text-brand-accent text-sm sm:text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Descuentos Especiales para Familias
                </p>
                <p className="text-xs text-gray-700/60">
                  Inscribe a dos miembros de la familia y obtén un <span className="text-gray-700 font-bold">2 x 1 en la inscripción y/u otras condiciones especiales</span> . Queremos que el camino del cinturón negro sea un recorrido conjunto.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenEnrollment('kid')}
                  className=" hero-button"
                >
                  Consultar sobre Promociones Familiares
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Promo Right Illustration image */}
            <div className="lg:col-span-6 relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden    shadow-xl shadow-black/40">
              <img
                src={Karafamilia}
                alt="Familia de karate entrenando"
                className="w-full h-full object-cover scale-130 "
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <span className="text-[10px] bg-brand-accent text-black font-bold px-2 py-0.5 rounded uppercase">Crecimiento en Equipo</span>
                <h4 className="font-bold font-display text-base text-white mt-1">Sinergia y respeto mutuo</h4>
                <p className="text-xs text-white">Unidos en el sendero del Bushido.</p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* 5. Beneficios del Karate */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-left space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full text-brand-accent text-xs font-bold font-display uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Estilo de Vida Marcial
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display  tracking-tight text-gray-700">
            Beneficios del Karate
          </h2>
          <p className="text-sm text-left  sm:text-base text-gray-700  ">
            Por qué entrenar en Escuela Tosei Gusoku va mucho más allá de aprender a golpear o patear.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" >
          {MOCK_BENEFITS.map((benefit) => (
            <div
              key={benefit.id}
              className="p-6 rounded-2xl flex flex-col space-y-4 glass-card-hover border border-white/5 relative overflow-hidden group shadow-md shadow-black/40"
              style={{ animation: "border-color-change 8s infinite linear" }}
            >

              {/* Subtle top horizontal color indicator bar */}
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity`} />

              <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${benefit.colorClass}`}>
                {getBenefitIcon(benefit.iconName)}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-xl font-display text-gray-700 group-hover:text-brand-accent transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed font-sans">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 4. Instructores Banner / Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-left space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-full text-brand-purple text-xs font-bold font-display uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Linaje Oficial Keishin Kai
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display  tracking-tight text-gray-700">
            Nuestros Instructores
          </h2>
          <p className="text-sm text-left sm:text-base text-gray-700/60 max-w-2xl ">
            Aprende de cinturones negros de alto rango, con certificación oficial internacional de la organización Inoue Ha de Japón.
          </p>
        </div>

        {/* Dynamic Grid showing the core instructors for home */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {MOCK_INSTRUCTORS.slice(0, 3).map((inst) => (
            <div
              key={inst.id}
              className={` rounded-2xl overflow-hidden border border-white/5 flex flex-col relative group h-full ring-1 ring-brand-accent/50 group-hover:ring-brand-accent shadow-md shadow-black/40 }`}
            >
              {/* Image banner frame */}
              <div className="h-64 sm:h-[30rem] w-full relative overflow-hidden bg-slate-900 border-b border-white/10 ">
                <img
                  src={inst.imageUrl}
                  alt={inst.name}
                  className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-[1.03]"
                  style={{
                    objectPosition: 'center 45%',
                    transform: inst.id === 'kyoshi-julio' ? 'translateY(5px)' : undefined
                  }}
                  referrerPolicy="no-referrer"
                />

                {/* Specific overlay tag badge */}
                <div className="absolute top-2 left-2 z-10 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                  <p className="font-display font-medium text-[10px] text-brand-accent tracking-wider font-semibold uppercase">{inst.role}</p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-6 space-y-4 text-left flex-1 flex flex-col ">
                <div className="space-y-2">
                  <h4 className="font-extrabold text-2xl text-gray-700 font-display uppercase tracking-tight group-hover:text-brand-accent transition-colors  whitespace-pre-line">
                    {inst.name}
                  </h4>
                  <p className="text-sm text-gray-700 font-sans leading-relaxed">
                    {inst.bio}
                  </p>
                </div>

                {inst.curriculum && (
                  <ul className="bg-white/5 rounded-lg border border-white/5 mt-1">
                    {inst.curriculum.slice(0, 2).map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-start gap-1">
                        <span className="text-brand-accent mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={onNavigateToAbout}
            className="hero-button"
          >
            Ver biografías completas y currículo de maestros
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </section>


      {/* 7. Testimonios */}
      <section className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-left space-y-3">
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 px-3 py-1 rounded-full text-brand-accent text-xs font-bold font-display uppercase tracking-wider">
              <Smile className="w-3.5 h-3.5" /> Voces de Familia
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display  tracking-tight text-gray-700 animate-pulse">
              Testimonios Reales
            </h2>
            <p className="text-sm text-left sm:text-base text-gray-700/60 max-w-2xl ">
              Lee la opinión honesta de los padres de familia y alumnos adultos que entrenan en nuestro dojo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {MOCK_TESTIMONIALS.map((test) => (
              <div
                key={test.id}
                className=" p-6 md:p-8 rounded-2xl border border-white/5 space-y-6 flex flex-col justify-between text-left relative overflow-hidden"
              >
                {/* Visual quotes sign */}
                <span className="absolute top-6 right-6 font-serif text-gray-700/5 text-8xl pointer-events-none select-none">“</span>

                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-brand-accent fill-brand-accent" />
                    ))}
                  </div>

                  <p className="text-sm sm:text-base text-gray-700/80 italic leading-relaxed font-sans">
                    "{test.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-brand-accent/30 shrink-0">
                    <img
                      src={test.avatarUrl}
                      alt={test.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-700 font-display uppercase tracking-wide">
                      {test.name}
                    </h4>
                    <p className="text-xs text-brand-accent font-semibold">
                      {test.relationship}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>


      {/* 8. Avales Internacionales */}
      <section className="py-12  border-y border-white/10 font-display overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 mb-6">
          <p className="text-[10px] font-bold text-gray-700/50 tracking-widest uppercase">RECONOCIMIENTO Y CERTIFICACIONES OFICIALES</p>
        </div>

        {/* Infinite scrolling marquee of logos/text */}
        <div className="w-full overflow-hidden relative">
          <div className="flex whitespace-nowrap animate-marquee gap-10 text-gray-700/40 text-xs md:text-sm font-bold uppercase tracking-widest py-2">
            <div className="flex gap-12 shrink-0 items-center">
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-brand-accent" /> INOUE HA SHITO-RYU KENSHIN KAI JAPÓN</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-secondary" /> FEDERACIÓN DOMINICANA DE KARATE (FEDOKARATE)</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-brand-accent" /> WORLD KARATE FEDERATION (WKF) CERTIFIED</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-purple" /> INOUE HA SHITO-RYU KARATE DO INTERNATIONAL OF AMERICA (ISKIA) </span>
            </div>
            {/* Duplicate list to build continuous marquee loop effect */}
            <div className="flex gap-12 shrink-0 items-center select-none" aria-hidden="true">
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-brand-accent" /> INOUE HA SHITO-RYU KEISHIN KAI JAPÓN</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-secondary" /> FEDERACIÓN DOMINICANA DE KARATE (FEDOKARATE)</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-brand-accent" /> WORLD KARATE FEDERATION (WKF) CERTIFIED</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-purple" /> INOUE HA SHITO-RYU KARATE DO INTERNATIONAL OF AMERICA (ISKIA) </span>
            </div>
          </div>
        </div>
      </section>


      {/* 9. Galería con Lightbox */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-left space-y-3">
          <span className="inline-block px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-xs font-bold font-display uppercase">Sinergia en Fotos</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display  tracking-tight text-gray-700">
            Algunos Momentos
          </h2>

        </div>

        <GalleryLightbox />
      </section>


      {/* 10. FAQ Accordion */}
      <section className="py-20  border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 space-y-12 text-left">

          <div className="text-left space-y-3">
            <span className="inline-block px-3 py-1 bg-brand-secondary/10 text-brand-secondary rounded-full text-xs font-bold font-display uppercase">Preguntas Comunes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-left font-display uppercase tracking-tight text-gray-700">
              Preguntas Frecuentes
            </h2>
            <p className="text-sm text-left sm:text-base text-gray-700/60 max-w-2xl ">

              Aclaramos tus dudas para que puedas ingresar al tatami con absoluta tranquilidad y seguridad.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {MOCK_FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className=" rounded-xl overflow-hidden border border-white/5 transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left p-5 md:p-6 flex justify-between items-center bg-[#18181b]/30 hover:bg-[#18181b]/60 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-base sm:text-lg font-display text-gray-700 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-brand-accent shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="p-5 md:p-6 text-sm text-gray-700/70 bg-black/10 border-t border-white/5 leading-relaxed font-sans">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* 11. CTA final */}
      <section className="relative py-24 px-4 text-center overflow-hidden bg-brand-bg">
        {/* Background decorative images or meshes */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-brand-accent/5 mix-blend-color-dodge rounded-full blur-3xl scale-125 translate-y-12" />
          <div className="absolute inset-0 " />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-block px-3.5 py-1 bg-brand-accent/10 border border-brand-accent/25 text-brand-accent rounded-full text-xs font-bold font-display uppercase tracking-wider animate-pulse">¿Listo para empezar tu viaje?</span>
          <div>


            <img src={Logosolo} alt="Tosei Gusoku Logo" className="w-28 h-28 mx-auto drop-shadow-lg inset-0 rounded-r rounded-l" style={{
              animation: "color-change 10s infinite linear",
              backgroundImage: "radial-gradient(closest-side, currentColor, transparent)"
            }}></img>

          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold font-display uppercase tracking-tight text-gray-700 leading-tight " >


            El camino del cinturón negro comienza aquí
          </h2>
          <p className="text-sm sm:text-base text-gray-700/70 max-w-xl mx-auto font-sans leading-relaxed">
            Te regalamos tu primera sesión completa de cortesía. Entrena, diviértete y comprueba la calidad de nuestra escuela por ti mismo. Sin compromisos.
          </p>

          <div className="pt-4">
            <button
              onClick={() => onOpenEnrollment('adult')}
              className="hero-button"
            >
              RESERVAR CLASE DEMO GRATUITA
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
