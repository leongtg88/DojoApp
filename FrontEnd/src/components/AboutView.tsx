import { MOCK_INSTRUCTORS } from '../types';

import MawashiYodan from '../assets/Mawashiguericintorunnegro2026.svg'
import LogoIskia from '../assets/LogoIskia.svg';
import negrosInoue from '../assets/NegrosInoue.svg'
import letrasIKIA from '../assets/letrasIKSKiatradu.svg'
import kyoshi from '../assets/kyoshiSeiza.svg'
import BannerHero from '../assets/BannerHeroMar.svg' 
import Germangris from '../assets/germanGris.svg'
import LeonSuto from '../assets/leonshutouke.svg'
import SenseiManuel from '../assets/SenseiManuelSolo.svg'
import SenseiMuneo from '../assets/muneoKanoSolo.svg'

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


      {/* 5. Sección "Sensei de Tosei Gusoku Dojo Leon"  */}

      {/*  Banner titulo  */}
      <div className=" bg-gray-900  text-left  w-full pl-[20rem] space-y-4 py-10">
        <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">FUNDADOR DEL DOJO </span>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight">
          Sensei de Tosei Gusoku Dojo
        </h3>
        <p className="text-sm sm:text-lg text-white italic leading-relaxed max-w-3xl  font-sans">
          "Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Manuel Balbuena y Kyoshi Julio Martínez."
        </p>
      </div>



      {/* Bakground Imag + Descripcion */}
      <section className="relative w-full h-[950px] flex flex-row  gap-8 items-center justify-center overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed py-20"
        style={{
          backgroundImage: `url(${BannerHero})`,
     
        

        }}
      >
       <div className='flex  grow-1 justify-end '>
        

        <img className='pt-[150px] pb-[40px] h-[1000px] z-10 ' src={LeonSuto} alt="" />
               {/* Blur effect - detrás de la imagen */}
                        <div
                            className="absolute inset-0 rounded-r rounded-l"
                            style={{
                                animation: "color-change 10s infinite linear",
                                backgroundImage: "radial-gradient(closest-side, currentColor, transparent)"
                            }}
                        />
                             {/* Blur effect at the bottom */}
                        <div className="absolute bottom-1 left-1/3 -translate-x-[420px] rounded-full opacity-90 pointer-events-none
            h-[30px] w-full min-w-[330px] max-w-[600px] z-10
            2xl:max-w-[740px] 4xl:max-w-[900px]"
                            style={{
                                animation: "color-change 10s infinite linear",
                                backgroundImage: "radial-gradient(closest-side, currentColor 45%, transparent )"
                            }} />
       </div>

        {/* Overlaid Float Biographic Card */}
        <div className='flex grow-1 justify-center'>
          <div className=" p-6 bg-gray   backdrop-blur-2xl border border-blue-700  max-w-2xl   rounded-2xl space-y-4 shadow-2xl text-left ">
            <div>
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">DIRECTOR GENERAL DEL DOJO</span>
              <h4 className="font-extrabold text-2xl font-display text-gray-700 mt-1 uppercase">{senseiLeon.name}</h4>
              <p className="text-xs text-gray-700/60">Cinturón Negro 2do Dan - Inoue Ha </p>
            </div>

            <p className="text-xs text-gray-900 leading-relaxed font-sans ">
              <p>Inició karate a la temprana edad de <strong>4 años gracias a su abuelo</strong>, quien lo inscribió al ver su inquietud por hacer movimientos de puños y patadas inspirados en las películas de artes marciales de los 80. <strong>Su primera escuela fue en el estilo Shotokan en Caracas, Venezuela.</strong></p><p>Por cambios en la escuela, debió pausar sus prácticas hasta los 14 años, cuando<strong> se incorporó a la escuela de Miyagiken bajo la tutela del Maestro Luis Alberte en la Organización Shito Kai, donde logró el oro dominando las categorías a nivel nacional en kata y kumite.</strong></p><p>Una vez iniciados sus estudios universitarios y de maestría en el exterior, retomó sus prácticas en la escuela de Dimitrova Dojo, en Santo Domingo, República Dominicana, bajo la tutela de la Maestra María Dimitrova. Allí<strong> continuó entrenando y compitiendo en categorías intermedias, alcanzando oro en kata y kumite en diversas competencias nacionales e internacionales en República Dominicana, y comenzó a dar clases de karate a niños.</strong></p><p>Al alcanzar el grado de Marrón Primero, <strong>Sensei León decidió fundar su propia escuela e incorporarse a la Organización Inoue Ha Dominicana, gracias a su Sensei Manuel Valbuena</strong>, quien lo orientó durante los procesos de cambio y <strong>lo refirió ante Kyoshi Julio Martínez.</strong></p><p>El Sensei León posee conocimientos en <strong>otras artes marciales como Jujutsu, Aikido e Iaido,</strong> complementando así su <strong>formación en diferentes aspectos tradicionales y de combate de estas disciplinas japonesas.</strong></p>
            </p>
          </div>
        </div>



      </section>


      {/* 6. Sección "Sensei German"/}




      {/* Bakground Imag + Descripcion */}
      <section className="relative w-full h-[750px] flex flex-row  gap-8 items-center justify-center overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed py-20"
        style={{
          backgroundImage: `url(${BannerHero})`
        }}
      >
       {/* Overlaid Float Biographic Card */}
        <div className='flex grow-1 justify-end'>
          <div className=" p-6 bg-gray backdrop-blur-[80px] border border-blue-700  max-w-2xl   rounded-2xl space-y-4 shadow-2xl text-left ">
            <div>
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">Instructor</span>
              <h4 className="font-extrabold text-2xl font-display text-gray-900 mt-1 uppercase">SENSEI GERMAN LIZARDO</h4>
              <p className="text-xs text-gray-700">Cinturón Negro 1er Dan - Inoue Ha </p>
            </div>

            <p className="text-xs text-gray-900 leading-relaxed font-sans ">
              <p>Inició karate a la temprana edad de <strong>4 años gracias a su abuelo</strong>, quien lo inscribió al ver su inquietud por hacer movimientos de puños y patadas inspirados en las películas de artes marciales de los 80. <strong>Su primera escuela fue en el estilo Shotokan en Caracas, Venezuela.</strong></p><p>Por cambios en la escuela, debió pausar sus prácticas hasta los 14 años, cuando<strong> se incorporó a la escuela de Miyagiken bajo la tutela del Maestro Luis Alberte en la Organización Shito Kai, donde logró el oro dominando las categorías a nivel nacional en kata y kumite.</strong></p><p>Una vez iniciados sus estudios universitarios y de maestría en el exterior, retomó sus prácticas en la escuela de Dimitrova Dojo, en Santo Domingo, República Dominicana, bajo la tutela de la Maestra María Dimitrova. Allí<strong> continuó entrenando y compitiendo en categorías intermedias, alcanzando oro en kata y kumite en diversas competencias nacionales e internacionales en República Dominicana, y comenzó a dar clases de karate a niños.</strong></p><p>Al alcanzar el grado de Marrón Primero, <strong>Sensei León decidió fundar su propia escuela e incorporarse a la Organización Inoue Ha Dominicana, gracias a su Sensei Manuel Valbuena</strong>, quien lo orientó durante los procesos de cambio y <strong>lo refirió ante Kyoshi Julio Martínez.</strong></p><p>El Sensei León posee conocimientos en <strong>otras artes marciales como Jujutsu, Aikido e Iaido,</strong> complementando así su <strong>formación en diferentes aspectos tradicionales y de combate de estas disciplinas japonesas.</strong></p>
            </p>
          </div>
        </div>

       <div className='flex  grow-1 justify-start '>

        <img className='pt-[150px] h-[1000px] ' src={Germangris} alt="" />
       </div>




      </section>




      {/* 6. Sección "Kyoshi Julio Martínez" (Foto, intro, card negro con currículo) */}

      {/* Banner titulo  */}
      <div className=" bg-white text-left  w-full pl-[20rem] space-y-4 py-15">

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
          backgroundPosition: ' center 80px'

        }}
      >
        <div className=" gap-12 items-center max-w-2xl mr-40">

  <div className="absolute inset-0 bg-gradient-to-t from-black via-white/10 via-30% to-transparent" />

          {/* Right Text details and Black Card with Curriculum */}
          <div className=" space-y-6 pt-60 pb-60">
            <span className="text-xs  border border-brand-accent text-brand-accent px-3 py-1 rounded-full  font-bold font-display uppercase tracking-widest inline-block">MÁXIMA AUTORIDAD TÉCNICA</span>
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase text-brand-accent leading-tight">
              Kyoshi Julio Martínez
            </h3>

            <p className="text-sm sm:text-base text-white leading-relaxed font-sans">
              Es una eminencia del karate en el karate Moderno. Su experiencia de más de cinco décadas en el tatami lo ha llevado a supervisar miles de graduaciones y examinar personalmente a cientos de cinturones negros que lideran en karate en diferentes partes del mundo. Más allá de ser nuestro Director Técnico que valida las metodologías de entrenamiento implementadas en nuestro dojo, es una figura fraterna que nos orienta.
            </p>

            {/* Black Curriculum Card */}
            <div className={`p-6 rounded-2xl border border-brand-accent relative overflow-hidden bg-white/20 backdrop-blur-[80px] border border-brand-accent`}>
              {/* Little design mark */}
              <div className="absolute right-0 top-0 w-24 h-24 rounded-full blur-xl" />

              <h4 className="font-extrabold text-lg text-brand-accent font-display uppercase tracking-wide border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                <span>CURRÍCULO DE KYOSHI JULIO</span>
                
              </h4>

              <div className="space-y-4 flex gap-8">
                <div >
                    <ul className="space-y-3 text-xs sm:text-sm text-white leading-relaxed">
                        <li>
                          <strong>7th Degree Black Belt</strong><br />
                          Karate-Do Hayashi-ha Shito-Ryu (1999).
                        </li>
                        <li>
                          <strong>7th Degree Black Belt</strong><br />
                          Karate-Do Inoue-ha Shito-Ryu (2008).
                        </li>
                        <li>
                          <strong>6th Degree Black Belt</strong><br />
                          Okinawa Goju-Ryu (2009).
                        </li>
                        <li>
                          <strong>5th Degree Black Belt</strong><br />
                          Okinawa Karate-Do Ryu El-Ryu (1992).
                        </li>
                        <li>
                          <strong>5th Degree Black Belt</strong><br />
                          Okinawa Kobudo (Weapons) (1992).
                        </li>
                    </ul>
                </div> 
                <div>

                
                      <ul className="space-y-3 text-xs sm:text-sm text-white leading-relaxed">
                        <li>
                          <strong>5th Degree Black Belt</strong><br />
                          SKIF Shotokan (1990).
                        </li>

                        <li>
                          <strong>5th Degree Black Belt</strong><br />
                          Eishin Ryu Iaido (2007).
                        </li>
                        <li>
                          <strong>National Class "A" Referee.</strong>
                        </li>
                        <li>
                          <strong>Member</strong><br />
                          World Karate Federation (WKF), 160 countries.
                        </li>
                        <li>
                          <strong>Member</strong><br />
                          Dominican Karate Federation (FEDOKA).
                        </li>
                    </ul>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 7. Sección "Shihan Muneo Kano" (Título con box shadow, foto circular, texto breve) bg-[#020202]  */}
      <section className="h-auto py-16 bg-[#020202]  relative overflow-hidden flex flex-col lg:flex-row items-start justify-center gap-12">

        {/* Shihan Muneo Kano*/}
        <div className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center">

          
          <div className="inline-block px-8 py-4.5 rounded-2xl border border-brand-accent shadow-xl relative">
            <h4 className="font-extrabold text-xl sm:text-2xl font-display uppercase tracking-tight text-brand-accent">
              Shihan Muneo Kano
            </h4>
            <p className="text-[10px] text-white tracking-wider font-semibold uppercase mt-0.5">5th Degree Black Belt</p>
          </div>

          {/* Circular Photo */}
          <div className="w-full flex justify-center items-center">
            <img
              src={SenseiMuneo}
              alt={shihanMuneo.name}
              className="max-h-[500px] w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm text-gray-white leading-relaxed font-sans font-medium italic">
              "{shihanMuneo.bio}"
            </p>
            {shihanMuneo.curriculum && (
              <p className="text-xs text-brand-accent font-semibold tracking-wider font-display uppercase">
                {shihanMuneo.curriculum.join(' • ')}
              </p>
            )}
          </div>

        </div>



  {/* Shihan Manuel Valbuena*/}
          <div className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center">

        
          <div className="  inline-block px-8 py-4.5 rounded-2xl border border-brand-accent shadow-xl">
            <h4 className="font-extrabold text-xl sm:text-2xl font-display uppercase tracking-tight text-brand-accent">
              Shihan Manuel Balbuena
            </h4>
            <p className="text-[10px] text-white tracking-wider font-semibold uppercase mt-0.5">5th Dan Shito Ryu Inoue Ha.</p>
          </div>

          {/* Circular Photo */}
          <div className="w-full flex justify-center items-center">
            <img
              src={SenseiManuel}
              alt={shihanManuel.name}
              className="max-h-[500px] w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm text-white leading-relaxed font-sans font-medium italic">
              "{shihanManuel.bio}"
            </p>
            {shihanManuel.curriculum && (
              <p className="text-xs text-brand-accent font-semibold tracking-wider font-display uppercase">
                {shihanManuel.curriculum.join(' • ')}
              </p>
            )}
          </div>

        </div>
      </section>


 

      {/* Final Trial Trigger banner */}
      <section className="py-20 bg-white text-center border-t border-white/5">
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
