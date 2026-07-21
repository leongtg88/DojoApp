import { MOCK_INSTRUCTORS } from '../types';

import MawashiYodan from '../assets/Mawashiguericintorunnegro2026.svg'
import LogoIskia from '../assets/LogoIskia.svg';
import negrosInoue from '../assets/NegrosInoue.svg'
interface AboutViewProps {
  onOpenEnrollment: (program?: string) => void;
  onNavigateToHome: () => void;
}

export default function AboutView({ onOpenEnrollment, onNavigateToHome }: AboutViewProps) {
  // Grab specific instructors from list
  const senseiLeon = MOCK_INSTRUCTORS.find(i => i.id === 'sensei-leon') || MOCK_INSTRUCTORS[0];
  const kyoshiJulio = MOCK_INSTRUCTORS.find(i => i.id === 'kyoshi-julio') || MOCK_INSTRUCTORS[1];
  const shihanManuel = MOCK_INSTRUCTORS.find(i => i.id === 'shihan-manuel') || MOCK_INSTRUCTORS[2];
  const shihanMuneo = MOCK_INSTRUCTORS.find(i => i.id === 'shihan-muneo') || MOCK_INSTRUCTORS[3];

  return (
    <div className="space-y-0 min-h-screen bg-brand-bg text-[#dee2f0]">

      {/* 1. Banner Hero (similar to Home, but text "Sobre Nosotros") */}
      <header
        className="relative w-full h-[60vh] flex items-center justify-center px-4 md:px-12 overflow-hidden bg-no-repeat bg-contain bg-start bg-fixed"
        style={{
          backgroundImage: `url(${MawashiYodan})`,
          backgroundSize: '30%',
          backgroundPosition: '20% 40%',
        }}
      >
        {/* title  and p*/}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-6 text-center">

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-700 leading-none capitalize">
            Sobre Nosotros
          </h1>

          <p className="text-base sm:text-lg text-gray-700/80 max-w-2xl leading-relaxed font-sans">
            Preservamos las bases puras y la rigurosidad técnica de Shito-Ryu Inoue Ha, fundado por Soke Yoshimi Inoue en Japón.
          </p>
          <p className="text-base sm:text-lg  pt-12 text-gray-700/80">Sensei León Gustavo</p>
        </div>
      </header>


      {/* 2. Logo de la organización con texto debajo */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">

        {/* Beautiful high-end Organization Emblem Placeholder (Japanese Mon style) */}

        <img src={LogoIskia} alt="Logo ISKIA" className="w-62  object-contain mx-auto items-center justify-center" />


        <div className="space-y-4 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold font-display uppercase tracking-wide text-gray-700">
            Filial Nacional Shito Ryu Inoue Ha Keishin Kai
          </h3>
          <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
            Nuestra institución está debidamente acreditada ante los organismos mundiales de Karate. Fomentamos la práctica del Karate-Do como método de perfeccionamiento del carácter, la biomecánica corporal saludable y el combate deportivo certificado. No somos solo un gimnasio; somos guardianes del linaje del Maestro Yoshimi Inoue.
          </p>
        </div>
      </section>


      {/* 3. Banner de instructores (resumen visual) 
      <section className="py-12 bg-[#101725] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold tracking-widest text-brand-accent font-display uppercase mb-6">LINAJE ININTERRUMPIDO DE MAESTROS JAPONESES Y NACIONALES</p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-80">
            <div className="text-center">
              <h5 className="font-bold text-gray-700 font-display text-sm tracking-wide">SOKE YOSHIMI INOUE</h5>
              <p className="text-[10px] text-gray-700/50">Fundador de Inoue Ha Japón</p>
            </div>
            <div className="text-gray-700/20 select-none">/</div>
            <div className="text-center">
              <h5 className="font-bold text-gray-700 font-display text-sm tracking-wide">SHIHAN MUNEO KANO</h5>
              <p className="text-[10px] text-gray-700/50">Maestro Guía Internacional</p>
            </div>
            <div className="text-gray-700/20 select-none">/</div>
            <div className="text-center">
              <h5 className="font-bold text-gray-700 font-display text-sm tracking-wide">KYOSHI JULIO MARTÍNEZ</h5>
              <p className="text-[10px] text-gray-700/50">8vo Dan - Asesor Técnico</p>
            </div>
            <div className="text-gray-700/20 select-none">/</div>
            <div className="text-center">
              <h5 className="font-bold text-gray-700 font-display text-sm tracking-wide">SENSEI LEÓN</h5>
              <p className="text-[10px] text-gray-700/50">Director Técnico Dojo</p>
            </div>
          </div>
        </div>
      </section>
*/}
      {/*<section 
  className="relative h-screen w-full pt-[1500px] bg-no-repeat bg-center"
  style={{ 
    backgroundImage: `url(${negrosInoue})`,
    backgroundAttachment: 'fixed',
    backgroundSize: '100% 100%' // o dimensiones específicas
  }}
></section>*/}

      <section
        className="relative h-screen w-full bg- bg-right bg-fixed overflow-hidden bg-no-repeat"
        style={{ backgroundImage: `url(${negrosInoue})`, backgroundPosition: ' center 10%' }}
      >
        <div className="relative z-10 h-full flex items-center justify-center">
          {/* contenido superpuesto si hace falta */}
        </div>
      </section>

      {/* 4. Historia: imagen y texto */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* History Image block */}
          <div className="lg:col-span-5 relative h-96 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=900"
              alt="Clase tradicional en el dojo antiguo"
              className="w-full h-full object-cover filter contrast-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 text-left">
              <span className="text-xs bg-brand-red text-gray-700 py-1 px-2.5 rounded font-bold font-display uppercase tracking-widest">TRADICIÓN</span>
              <h4 className="font-bold text-lg font-display text-gray-700 mt-2">Dedicación Continua</h4>
              <p className="text-xs text-gray-700/70">Formando campeones con humildad.</p>
            </div>
          </div>

          {/* History Text block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase text-gray-700 leading-tight">
              Nuestra Historia
            </h3>
            <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              La Escuela de Karate Tosei Gusoku nació con el ferviente anhelo de infundir en Santo Domingo la verdadera filosofía del Shito-Ryu, uno de los cuatro estilos base tradicionales de Japón. Tosei Gusoku significa literalmente "armadura moderna", haciendo referencia a que el karate actúa como un caparazón psicológico y físico protector para la persona en su desenvolvimiento diario en la urbe.
            </p>
            <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              Bajo la tutela directa del Kyoshi Julio Martínez y la rigurosidad heredada del Shihan Manuel Balbuena, entrenamos arduamente para que cada Kata sea la expresión viva de la fuerza interna. Llevamos más de una década destacando en campeonatos selectivos nacionales, y enviando atletas de alto rendimiento a representar con honor e hidalguía la patria caribeña.
            </p>
          </div>

        </div>
      </section>


      {/* 5. Sección "Sensei de Tosei Gusoku Dojo" (Fondo Negro, foto Sensei y card) */}
      <section className="py-20 bg-black text-gray-700 border-y border-white/5 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center max-w-4xl mx-auto space-y-4">
            <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">LÍDER TÉCNICO VIVO</span>
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight">
              Sensei de Tosei Gusoku Dojo
            </h3>
            <p className="text-sm sm:text-lg text-gray-700/70 italic leading-relaxed max-w-3xl mx-auto font-sans">
              "Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Manuel Balbuena y Kyoshi Julio Martínez."
            </p>
          </div>

          {/* Large image with card overlay */}
          <div className="relative rounded-2xl overflow-hidden h-[500px] w-full border border-white/10 shadow-2xl">
            {/* Wide artistic render picture of Sensei León */}
            <img
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=1200"
              alt="Sensei León ejecutando Kata"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
            {/* Contrast veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/90 sm:ton-transparent" />

            {/* Overlaid Float Biographic Card */}
            <div className="absolute inset-x-4 bottom-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-8 sm:max-w-md p-6 bg-brand-card backdrop-blur-xl border border-white/10 rounded-2xl space-y-4 shadow-2xl text-left">
              <div>
                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">DIRECTOR GENERAL DEL DOJO</span>
                <h4 className="font-extrabold text-2xl font-display text-gray-700 mt-1 uppercase">{senseiLeon.name}</h4>
                <p className="text-xs text-gray-700/60">Cinturón Negro 4to Dan - Inoue Ha Brach</p>
              </div>

              <p className="text-xs text-gray-700/80 leading-relaxed font-sans">
                El Sensei León ha consagrado su juventud al desarrollo técnico del karate infantil y juvenil. Cree en la disciplina positiva: forjar mentes firmes y alegres, capaces de canalizar las frustraciones cotidianas a través del rigor del ejercicio físico y el autoconocimiento marcial.
              </p>

              {senseiLeon.curriculum && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <p className="text-[10px] font-extrabold text-brand-secondary uppercase">Méritos e Instrucción:</p>
                  {senseiLeon.curriculum.map((c, i) => (
                    <div key={i} className="flex gap-2 text-[11px] text-gray-700/70">
                      <span className="text-brand-accent font-bold">•</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>


      {/* 6. Sección "Kyoshi Julio Martínez" (Foto, intro, card negro con currículo) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Large picture of Kyoshi */}
          <div className="lg:col-span-5 relative h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-brand-card">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=900"
              alt="Kyoshi Julio Martínez"
              className="w-full h-full object-cover filter contrast-102"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 block bg-black/60 px-4 py-2 border border-brand-red rounded backdrop-blur-md">
              <p className="font-display font-extrabold text-sm text-brand-red tracking-wider uppercase">KYOSHI JULIO MARTÍNEZ</p>
              <p className="text-[10px] text-gray-700/60">Cinto Negro 8vo Dan - Inoue Ha Keishin Kai</p>
            </div>
          </div>

          {/* Right Text details and Black Card with Curriculum */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs bg-brand-red/10 border border-brand-red/20 px-3 py-1 rounded-full text-brand-red font-bold font-display uppercase tracking-widest inline-block">MÁXIMA AUTORIDAD TÉCNICA</span>
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase text-gray-700 leading-tight">
              Kyoshi Julio Martínez
            </h3>

            <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              Es una eminencia del karate en el área del Caribe. Su experiencia de más de cuatro décadas en el tatami lo ha llevado a supervisar miles de graduaciones y examinar personalmente los cinturones negros que lideran actualmente la escuela de Tosei Gusoku. Es el consultor técnico que valida las metodologías de entrenamiento implementadas en nuestro dojo.
            </p>

            {/* Black Curriculum Card */}
            <div className={`glass-card p-6 rounded-2xl border border-brand-accent/20 relative overflow-hidden belt-glow-red bg-black/40`}>
              {/* Little design mark */}
              <div className="absolute right-0 top-0 w-24 h-24 bg-brand-red/5 rounded-full blur-xl" />

              <h4 className="font-extrabold text-lg text-gray-700 font-display uppercase tracking-wide border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                <span>CURRÍCULO DE KYOSHI JULIO</span>
                <span className="text-xs text-brand-red uppercase font-semibold tracking-widest font-mono">8º Dan</span>
              </h4>

              <ul className="space-y-3">
                {kyoshiJulio.curriculum?.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-700/80 leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>


      {/* 7. Sección "Shihan Muneo Kano" (Título con box shadow, foto circular, texto breve) */}
      <section className="py-16 bg-[#101725] border-t border-white/5 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">

          {/* Title styled with a nice background shadow / border visual */}
          <div className="inline-block bg-black px-8 py-4.5 rounded-2xl border border-white/10 shadow-xl relative">
            <h4 className="font-extrabold text-xl sm:text-2xl font-display uppercase tracking-tight text-brand-accent">
              Shihan Muneo Kano
            </h4>
            <p className="text-[10px] text-gray-700/60 tracking-wider font-semibold uppercase mt-0.5">Asesor Honorario de la Organización</p>
          </div>

          {/* Circular Photo */}
          <div className="w-40 h-40 rounded-full overflow-hidden mx-auto border-4 border-brand-accent/25 shadow-2xl relative">
            <img
              src={shihanMuneo.imageUrl}
              alt={shihanMuneo.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm text-gray-700/70 leading-relaxed font-sans font-medium italic">
              "{shihanMuneo.bio}"
            </p>
            {shihanMuneo.curriculum && (
              <p className="text-xs text-brand-accent font-semibold tracking-wider font-display uppercase">
                {shihanMuneo.curriculum.join(' • ')}
              </p>
            )}
          </div>

        </div>
      </section>


      {/* 8. Sección "Shihan Manuel Balbuena" (Mismo formato circular) */}
      <section className="py-16 bg-brand-bg border-t border-white/10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">

          {/* Title with box shadow / border visual */}
          <div className="inline-block bg-black px-8 py-4.5 rounded-2xl border border-white/10 shadow-xl">
            <h4 className="font-extrabold text-xl sm:text-2xl font-display uppercase tracking-tight text-brand-secondary">
              Shihan Manuel Balbuena
            </h4>
            <p className="text-[10px] text-gray-700/60 tracking-wider font-semibold uppercase mt-0.5">Cimiento de la Tecnicidad Nacional</p>
          </div>

          {/* Circular Photo */}
          <div className="w-40 h-40 rounded-full overflow-hidden mx-auto border-4 border-brand-secondary/25 shadow-2xl">
            <img
              src={shihanManuel.imageUrl}
              alt={shihanManuel.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm text-gray-700/70 leading-relaxed font-sans font-medium italic">
              "{shihanManuel.bio}"
            </p>
            {shihanManuel.curriculum && (
              <p className="text-xs text-brand-secondary font-semibold tracking-wider font-display uppercase">
                {shihanManuel.curriculum.join(' • ')}
              </p>
            )}
          </div>

        </div>
      </section>


      {/* Final Trial Trigger banner */}
      <section className="py-20 bg-[#101725] text-center border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-gray-700">
            Descubre tu fuerza hoy mismo
          </h2>
          <p className="text-xs sm:text-sm text-gray-700/70 max-w-xl mx-auto font-sans leading-relaxed">
            Te invitamos a ver y participar en una clase presencial dirigida por el Sensei León y comprobar el rigor técnico instruido directamente por nuestros Shihan.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => onOpenEnrollment('adult')}
              className="bg-brand-accent hover:bg-brand-accent-hover text-black font-extrabold px-8 py-4 rounded-xl text-xs transition-all belt-glow font-display uppercase cursor-pointer"
            >
              RESERVAR CLASE DEMO GRATIS
            </button>
            <button
              onClick={onNavigateToHome}
              className="bg-white/5 hover:bg-white/10 text-gray-700 font-semibold px-8 py-4 rounded-xl text-xs border border-white/10 transition-colors uppercase font-display cursor-pointer"
            >
              Regresar a la página principal
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
