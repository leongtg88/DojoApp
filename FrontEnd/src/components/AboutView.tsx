import { MOCK_INSTRUCTORS } from '../types';

import MawashiYodan from '../assets/Mawashiguericintorunnegro2026.svg'
import LogoIskia from '../assets/LogoIskia.svg';
import negrosInoue from '../assets/NegrosInoue.svg'
import letrasIKIA from '../assets/letrasIKSKiatradu.svg'
import LeonMar from '../assets/LeonMar.svg'
import kyoshi from '../assets/kyoshiSeiza.svg'
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
        <div className=" absolute inset-0 bg-gradient-to-t from-white via-white/30 via-30% to-transparent" />
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



      {/* 3 Beautiful high-end Organization */}
      <section
        className="relative h-[1200px] w-full bg- bg-right bg-fixed overflow-hidden bg-no-repeat"
        style={{ backgroundImage: `url(${negrosInoue})`, backgroundPosition: ' center  50px' }}
      >
        {/* High-contrast vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 via-30% to-transparent" />

        <div className="relative z-10 h-full flex items-center justify-center">
          {/* contenido superpuesto si hace falta */}
        </div>
      </section>

      {/* 4. Historia: imagen y texto */}
      <section className="py-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* History Image block */}
          <div className="lg:col-span-5 relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img
              src={letrasIKIA}
              alt="Clase tradicional en el dojo antiguo"
              className="w-full h-full object-contain filter contrast-105"
              referrerPolicy="no-referrer"
            />

            <div className="absolute bottom-6 left-6 text-left">


            </div>
          </div>

          {/* History Text block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase text-gray-700 leading-tight">
              Nuestra Historia
            </h3>
            <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              Tosei Gusoku es una escuela que nació en tiempos de grandes desafíos, ha logrado cumplir su objetivo de enseñar karate a personas de todas las edades. Pertenciendo a Organización Inoue-Ha Internacional y con el apoyo de nuestros alumnos, padres y representantes, quienes comprenden el profundo valor de contar con un Dojo que transmite el karate más allá de un deporte, podemos compartir nuestra esencia marcial, siguiendo la tradición japonesa y fomentando valores como la humildad, la ausencia de ego, la motivación por el logro basado en el mérito personal, sin comparaciones con los demás, además de muchos otros principios positivos para cualquier practicante. <br /> <br />

              Una parte importante de nuestra labor es fomentar una nueva generación de hábitos positivos que construyan, paso a paso, nuevas estructuras de pensamiento y, en consecuencia, nuevas formas de actuar y de vivir el día a día. El karate no se queda en el dojo. Tanto para los adultos como para los niños, promovemos junto a los padres y representantes la importancia de motivar, apoyar y desarrollar gradualmente en el hogar la autodisciplina, tanto en la práctica del karate como en el cumplimiento de las tareas domésticas que les correspondan. <br /> <br />

              Asimismo, incentivamos hábitos de alimentación e hidratación saludables, momentos adecuados de recreación y descanso, promoviendo valores como la responsabilidad de cuidar de uno mismo. Del mismo modo, fomentamos la constancia y el compromiso de mantener en el tiempo la práctica, ya sea directa o indirecta, mediante los entrenamientos, las tareas y las responsabilidades asumidas con la escuela y con los Senseis.

            </p>
            <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              Bajo la tutela directa del Kyoshi Julio Martínez y la rigurosidad heredada del Shihan Manuel Balbuena, entrenamos arduamente para que cada Kata sea la expresión viva de la fuerza interna. Llevamos más de una década destacando en campeonatos selectivos nacionales, y enviando atletas de alto rendimiento a representar con honor e hidalguía la patria caribeña.
            </p>
          </div>

        </div>
      </section>


    {/* 5. Sección "Sensei de Tosei Gusoku Dojo"  */}

        {/*  Banner titulo  */}
      <div className=" bg-gray-900  text-left  w-full pl-[20rem] space-y-4 py-10">
        <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">LÍDER TÉCNICO </span>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight">
          Sensei de Tosei Gusoku Dojo
        </h3>
        <p className="text-sm sm:text-lg text-white italic leading-relaxed max-w-3xl  font-sans">
          "Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Manuel Balbuena y Kyoshi Julio Martínez."
        </p>
      </div>



      {/* Bakground Imag + Descripcion */}
      <section className="relative w-full h-[900px] flex items-center justify-end overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${LeonMar})`,
          backgroundPosition: ' center 10px'

        }}
      >

          {/* Overlaid Float Biographic Card */}
        <div className=" p-6 bg-gray   backdrop-blur-2xl border border-blue-700  max-w-2xl   mr-40 rounded-2xl space-y-4 shadow-2xl text-left">
          <div>
            <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">DIRECTOR GENERAL DEL DOJO</span>
            <h4 className="font-extrabold text-2xl font-display text-gray-700 mt-1 uppercase">{senseiLeon.name}</h4>
            <p className="text-xs text-gray-700/60">Cinturón Negro 2do Dan - Inoue Ha </p>
          </div>

          <p className="text-xs text-gray-700/80 leading-relaxed font-sans">
            <p>Inició karate a la temprana edad de <strong>4 años gracias a su abuelo</strong>, quien lo inscribió al ver su inquietud por hacer movimientos de puños y patadas inspirados en las películas de artes marciales de los 80. <strong>Su primera escuela fue en el estilo Shotokan en Caracas, Venezuela.</strong></p><p>Por cambios en la escuela, debió pausar sus prácticas hasta los 14 años, cuando<strong> se incorporó a la escuela de Miyagiken bajo la tutela del Maestro Luis Alberte en la Organización Shito Kai, donde logró el oro dominando las categorías a nivel nacional en kata y kumite.</strong></p><p>Una vez iniciados sus estudios universitarios y de maestría en el exterior, retomó sus prácticas en la escuela de Dimitrova Dojo, en Santo Domingo, República Dominicana, bajo la tutela de la Maestra María Dimitrova. Allí<strong> continuó entrenando y compitiendo en categorías intermedias, alcanzando oro en kata y kumite en diversas competencias nacionales e internacionales en República Dominicana, y comenzó a dar clases de karate a niños.</strong></p><p>Al alcanzar el grado de Marrón Primero, <strong>Sensei León decidió fundar su propia escuela e incorporarse a la Organización Inoue Ha Dominicana, gracias a su Sensei Manuel Valbuena</strong>, quien lo orientó durante los procesos de cambio y <strong>lo refirió ante Kyoshi Julio Martínez.</strong></p><p>El Sensei León posee conocimientos en <strong>otras artes marciales como Jujutsu, Aikido e Iaido,</strong> complementando así su <strong>formación en diferentes aspectos tradicionales y de combate de estas disciplinas japonesas.</strong></p>
          </p>


        </div>



      </section>


      {/* 6. Sección "Kyoshi Julio Martínez" (Foto, intro, card negro con currículo) */}

        {/* Banner titulo  */}
        <div className=" bg-white text-left  w-full pl-[20rem] space-y-4 py-10">
       
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display  text-gray-700 uppercase tracking-tight">
          Maestros Guías de Tosei Gusoku Dojo 
        </h3>
        <p className="text-sm sm:text-lg text-gray-700 italic leading-relaxed max-w-3xl  font-sans">
          Karate Do Shito Ryu Inoue Ha Santo Domingo
        </p>
      </div>

      <section className="relative w-full h-[900px] flex items-center justify-end overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${kyoshi})`,
          backgroundPosition: ' center 10px'

        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">



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
