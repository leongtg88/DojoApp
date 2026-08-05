import { MOCK_INSTRUCTORS } from '../types';
import MawashiYodan from '../assets/Mawashiguericintorunnegro2026.svg'
import LogoIskia from '../assets/LogoIskia.svg';
import negrosInoue from '../assets/NegrosInoue.svg'
import letrasIKIA from '../assets/letrasIKSKiatradu.svg'

import BannerHero from '../assets/BannerHeroMar.svg'
import Germangris from '../assets/germanGris.svg'
import LeonSuto from '../assets/leonshutouke.svg'
import SenseiManuel from '../assets/SenseiManuelSolo.svg'
import SenseiMuneo from '../assets/muneoKanoSolo.svg'
import { useState } from 'react';
import Bannerblack from '../assets/bannerheroblack.svg'
import Kyoshi from '../assets/kyoshiSeizafondoTransp.svg'
interface AboutViewProps {
  onOpenEnrollment: (program?: string) => void;
  onNavigateToHome: () => void;
}

export default function AboutView({ onOpenEnrollment, onNavigateToHome }: AboutViewProps) {
  // Grab specific instructors from list
  const senseiLeon = MOCK_INSTRUCTORS.find(i => i.id === 'sensei-leon') || MOCK_INSTRUCTORS[0];
  const shihanManuel = MOCK_INSTRUCTORS.find(i => i.id === 'shihan-manuel') || MOCK_INSTRUCTORS[2];
  const shihanMuneo = MOCK_INSTRUCTORS.find(i => i.id === 'shihan-muneo') || MOCK_INSTRUCTORS[3];
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [expandedLeon, setExpandedLeon] = useState(false);
  const [expandedGerman, setExpandedGerman] = useState(false);

  const historiaParrafos = [
    'Tosei Gusoku es una escuela que nació en tiempos de grandes desafíos, ha logrado cumplir su objetivo de enseñar karate a personas de todas las edades. Pertenciendo a Organización Inoue-Ha Internacional y con el apoyo de nuestros alumnos, padres y representantes, quienes comprenden el profundo valor de contar con un Dojo que transmite el karate más allá de un deporte, podemos compartir nuestra esencia marcial, siguiendo la tradición japonesa y fomentando valores como la humildad, la ausencia de ego, la motivación por el logro basado en el mérito personal, sin comparaciones con los demás, además de muchos otros principios positivos para cualquier practicante.',
    'Una parte importante de nuestra labor es fomentar una nueva generación de hábitos positivos que construyan, paso a paso, nuevas estructuras de pensamiento y, en consecuencia, nuevas formas de actuar y de vivir el día a día. El karate no se queda en el dojo. Tanto para los adultos como para los niños, promovemos junto a los padres y representantes la importancia de motivar, apoyar y desarrollar gradualmente en el hogar la autodisciplina, tanto en la práctica del karate como en el cumplimiento de las tareas domésticas que les correspondan.',
    'Asimismo, incentivamos hábitos de alimentación e hidratación saludables, momentos adecuados de recreación y descanso, promoviendo valores como la responsabilidad de cuidar de uno mismo. Del mismo modo, fomentamos la constancia y el compromiso de mantener en el tiempo la práctica, ya sea directa o indirecta, mediante los entrenamientos, las tareas y las responsabilidades asumidas con la escuela y con los Senseis.'
  ];

  const leonBioParrafos = [
    'Inició karate a la temprana edad de 4 años gracias a su abuelo, quien lo inscribió al ver su inquietud por hacer movimientos de puños y patadas inspirados en las películas de artes marciales de los 80. Su primera escuela fue en el estilo Shotokan en Caracas, Venezuela.',
    'Por cambios en la escuela, debió pausar sus prácticas hasta los 14 años, cuando se incorporó a la escuela de Miyagiken bajo la tutela del Maestro Luis Alberte en la Organización Shito Kai, donde logró el oro dominando las categorías a nivel nacional en kata y kumite.',
    'Una vez iniciados sus estudios universitarios y de maestría en el exterior, retomó sus prácticas en la escuela de Dimitrova Dojo, en Santo Domingo, República Dominicana, bajo la tutela de la Maestra María Dimitrova. Allí continuó entrenando y compitiendo en categorías intermedias, alcanzando oro en kata y kumite en diversas competencias nacionales e internacionales en República Dominicana, y comenzó a dar clases de karate a niños.',
    'Al alcanzar el grado de Marrón Primero, Sensei León decidió fundar su propia escuela e incorporarse a la Organización Inoue Ha Dominicana, gracias a su Sensei Manuel Valbuena, quien lo orientó durante los procesos de cambio y lo refirió ante Kyoshi Julio Martínez.',
    'El Sensei León posee conocimientos en otras artes marciales como Jujutsu, Aikido e Iaido, complementando así su formación en diferentes aspectos tradicionales y de combate de estas disciplinas japonesas.'
  ];

  const germanBioParrafos = [
    'Inició karate a la temprana edad de 4 años gracias a su abuelo, quien lo inscribió al ver su inquietud por hacer movimientos de puños y patadas inspirados en las películas de artes marciales de los 80. Su primera escuela fue en el estilo Shotokan en Caracas, Venezuela.',
    'Por cambios en la escuela, debió pausar sus prácticas hasta los 14 años, cuando se incorporó a la escuela de Miyagiken bajo la tutela del Maestro Luis Alberte en la Organización Shito Kai, donde logró el oro dominando las categorías a nivel nacional en kata y kumite.',
    'Una vez iniciados sus estudios universitarios y de maestría en el exterior, retomó sus prácticas en la escuela de Dimitrova Dojo, en Santo Domingo, República Dominicana, bajo la tutela de la Maestra María Dimitrova. Allí continuó entrenando y compitiendo en categorías intermedias, alcanzando oro en kata y kumite en diversas competencias nacionales e internacionales en República Dominicana, y comenzó a dar clases de karate a niños.',
    'Al alcanzar el grado de Marrón Primero, Sensei Germán decidió fundar su propia escuela e incorporarse a la Organización Inoue Ha Dominicana, gracias a su Sensei Manuel Valbuena, quien lo orientó durante los procesos de cambio y lo refirió ante Kyoshi Julio Martínez.',
    'El Sensei Germán posee conocimientos en otras artes marciales como Jujutsu, Aikido e Iaido, complementando así su formación en diferentes aspectos tradicionales y de combate de estas disciplinas japonesas.'
  ];

  const preview = historiaParrafos[0].slice(0, 200);
  const leonPreview = leonBioParrafos[0].slice(0, 180) + '...';
  const germanPreview = germanBioParrafos[0].slice(0, 180) + '...';

  return (
    <div className="space-y-0 min-h-screen bg-brand-bg text-[#dee2f0]">


      {/* 1. Banner Hero Mobile  ") */}
      <header
        className="relative md:hidden  w-full h-[60vh] flex items-center justify-center px-4 md:px-12 overflow-hidden bg-no-repeat bg-contain bg-start bg-fixed"
        style={{
          backgroundImage: `url(${MawashiYodan})`,
          backgroundSize: '35%',
          backgroundPosition: '10% 60%',
        }}


      >
        <div className=" absolute inset-0 bg-gradient-to-t from-white via-white/30 via-30% to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-start pt-16 h-full max-w-4xl mx-auto w-full space-y-6 text-center">

          <h1 className="font-display text-4xl sm:text-4xl font-extrabold tracking-tight text-gray-700 leading-none capitalize">
            Sobre Nosotros
          </h1>

          <p className="text-sm    sm:text-md text-gray-700/80   max-w-xs  sm:max-w-sm leading-relaxed font-sans">
            Preservamos las bases puras y la rigurosidad técnica de Shito-Ryu Inoue Ha, fundado por Soke Yoshimi Inoue en Japón.
          </p>

          <p className="text-base sm:text-lg pt-12 pl-6   text-gray-700/80">Sensei León Gustavo</p>
        </div>

      </header>


      {/* 1. Banner Hero desktop */}
      <header
        className="relative hidden md:flex md:flex-col w-full h-[60vh] md:items-center justify-center px-4 md:px-12 overflow-hidden bg-no-repeat bg-contain bg-start bg-fixed"
        style={{
          backgroundImage: `url(${MawashiYodan})`,
          backgroundSize: '30%',
          backgroundPosition: '20% 40%',
        }}
      >



        <div className=" absolute inset-0 bg-gradient-to-t from-white via-white/30 via-30% to-transparent" />
        {/* title  and p*/}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-6 text-center">

          <h1 className="font-display text-4xl sm:text-4xl font-extrabold tracking-tight text-gray-700 leading-none capitalize">
            Sobre Nosotros
          </h1>

          <p className="text-sm    sm:text-md text-gray-700/80   max-w-xs  sm:max-w-sm leading-relaxed font-sans">
            Preservamos las bases puras y la rigurosidad técnica de Shito-Ryu Inoue Ha, fundado por Soke Yoshimi Inoue en Japón.
          </p>
          <p className="text-base sm:text-lg  pt-12 text-gray-700/80">Sensei León Gustavo</p>
        </div>
      </header>


      {/* 2. Logo de la organización con texto debajo */}
      <section className="md:py-16 max-w-5xl mx-auto px-8 sm:px-6 text-center space-y-6">


        <img src={LogoIskia} alt="Logo ISKIA" className="w-62  object-contain mx-auto items-center justify-center" />


        <div className="space-y-4 max-w-3xl mx-auto">
          <h3 className="md:text-2xl text-xl font-bold font-display uppercase tracking-wide text-gray-700">
            International  Shito Ryu Inoue Ha Karate Do of the Americas
          </h3>
          <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
            Nuestra institución está debidamente acreditada ante los organismos mundiales de Karate. Fomentamos la práctica del Karate-Do como método de perfeccionamiento del carácter, la biomecánica corporal saludable y el combate deportivo certificado. No somos solo un gimnasio; somos guardianes del linaje del Maestro Yoshimi Inoue.
          </p>
        </div>
      </section>



      {/* 3 Beautiful high-end Organization */}
      <section
        className="relative h-[300px]  md:h-[1200px] w-full bg-center bg-contain   md:bg-cover md:bg-right md:bg-fixed  bg-no-repeat"
        style={{ backgroundImage: `url(${negrosInoue})`, backgroundPosition: 'center 90px' }}
      >
        {/* High-contrast vignettes */}
        <div className="absolute inset-0 -bottom-[2px] bg-gradient-to-t from-white via-white/30 via-20% to-transparent" />


      </section>

      {/* 4. Historia: imagen y texto */}
      <section className="md:py-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8 px-8">

          {/* History Image block */}
          <div className="lg:col-span-5 relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img
              src={letrasIKIA}
              alt="Clase tradicional en el dojo antiguo"
              className="w-full h-full object-contain filter contrast-105 px-8 py-8"
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
            <div className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              <div className="hidden md:block">
                <>
                  <p>{historiaParrafos[0]}</p>
                  <br />
                  <p>{historiaParrafos[1]}</p>
                  <br />
                  <p>{historiaParrafos[2]}</p>
                </>
              </div>

              <div className="md:hidden">
                {expandedHistory ? (
                  <>
                    <p>{historiaParrafos[0]}</p>
                    <br />
                    <p>{historiaParrafos[1]}</p>
                    <br />
                    <p>{historiaParrafos[2]}</p>
                  </>
                ) : (
                  <p>{preview}...</p>
                )}
              </div>
            </div>

            <button
              onClick={() => setExpandedHistory(!expandedHistory)}
              className="text-sm md:hidden font-bold text-brand-accent hover:text-brand-accent-hover underline"
            >
              {expandedHistory ? 'Ver menos' : 'Ver más'}
            </button>

          </div>

        </div>
      </section>


      {/* 5. Sección "Sensei de Tosei Gusoku Dojo Leon"  */}

      {/*  Banner titulo Leon */}
      <div className=" bg-black px-8  text-left  w-full lg:pl-20  2xl:pl-[20rem] space-y-4 py-10">
        <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">FUNDADOR DEL DOJO </span>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight">
          Sensei de Tosei Gusoku Dojo
        </h3>
        <p className="text-sm sm:text-lg text-white italic leading-relaxed max-w-3xl  font-sans">
          "Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Manuel Balbuena y Kyoshi Julio Martínez."
        </p>
      </div>



      {/* Bakground Imag + Descripcion */}
      <section className="relative w-full h-auto md:h-[950px] px-8 overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed py-20"
        style={{
          backgroundImage: `url(${BannerHero})`,
        }}
      >
        <div className="flex h-full flex-col md:flex-row items-center justify-center ">
          <div className="flex-1  flex justify-center md:justify-end">
            <img className='h-[400px] md:pt-[150px] md:h-[1000px] z-10' src={LeonSuto} alt="" />
          </div>

          {/* Overlaid Float Biographic Card */}
          <div className="flex-1 flex justify-center">
            <div className="p-6 bg-gray backdrop-blur-2xl border border-blue-700 max-w-2xl rounded-2xl space-y-4 shadow-2xl text-left">
              <div>
                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">DIRECTOR GENERAL DEL DOJO</span>
                <h4 className="font-extrabold text-2xl font-display text-gray-700 mt-1 uppercase">{senseiLeon.name}</h4>
                <p className="text-xs text-gray-700/60">Cinturón Negro 2do Dan - Inoue Ha </p>
              </div>

              <div className="space-y-3 text-xs text-gray-900 leading-relaxed font-sans">
                <div className="hidden md:block">
                  {leonBioParrafos.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="md:hidden">
                  {expandedLeon ? (
                    <>
                      {leonBioParrafos.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </>
                  ) : (
                    <p>{leonPreview}</p>
                  )}
                </div>

                <button
                  onClick={() => setExpandedLeon(!expandedLeon)}
                  className="text-sm md:hidden font-bold text-brand-accent hover:text-brand-accent-hover underline"
                >
                  {expandedLeon ? 'Ver menos' : 'Ver más'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 6. Sección "Sensei German"/}


      {/*  Banner titulo German */}
      <div className=" bg-black text-left  px-8 w-full lg:pl-20 2xl:pl-[20rem] space-y-2 py-4">
        <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">INSTRUCTOR</span>
        <h3 className="text-3xl sm:text-4xl font-extrabold font-display uppercase tracking-tight">
          Sensei de Tosei Gusoku Dojo
        </h3>
        <p className="text-sm sm:text-lg text-white italic leading-relaxed max-w-3xl  font-sans">
          "Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Ramón Percinal y Kyoshi Julio Martínez."
        </p>
      </div>

      {/* Bakground Imag + Descripcion */}
      <section className="relative w-full h-auto  md:h-[750px] px-8  overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed py-20"
        style={{
          backgroundImage: `url(${BannerHero})`
        }}
      >
        <div className="flex h-full flex-col md:flex-row items-center justify-center md:gap-12">
          <div className="flex-1 flex justify-center md:justify-end">
            <img className=' h-[360px] md:pt-[150px] md:h-[1000px] z-10' src={Germangris} alt="" />
          </div>

          {/* Overlaid Float Biographic Card */}
          <div className="flex-1 flex justify-center">
            <div className="p-6 bg-gray backdrop-blur-[80px] border border-blue-700 max-w-2xl rounded-2xl space-y-4 shadow-2xl text-left ">
              <div>
                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">Instructor</span>
                <h4 className="font-extrabold text-2xl font-display text-gray-900 mt-1 uppercase">SENSEI GERMAN LIZARDO</h4>
                <p className="text-xs text-gray-700">Cinturón Negro 1er Dan - Inoue Ha </p>
              </div>

              <div className="space-y-3 text-xs text-gray-900 leading-relaxed font-sans">
                <div className="hidden md:block">
                  {germanBioParrafos.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="md:hidden">
                  {expandedGerman ? (
                    <>
                      {germanBioParrafos.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </>
                  ) : (
                    <p>{germanPreview}</p>
                  )}
                </div>

                <button
                  onClick={() => setExpandedGerman(!expandedGerman)}
                  className="text-sm md:hidden font-bold text-brand-accent hover:text-brand-accent-hover underline"
                >
                  {expandedGerman ? 'Ver menos' : 'Ver más'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>




      {/* 6. Sección "Kyoshi Julio Martínez" (Foto, intro, card negro con currículo) */}

      {/* Banner titulo  */}
      <div className=" bg-white text-left  px-8 w-full  2xl:pl-[20rem] space-y-4 py-15">

        <h3 className="text-3xl sm:text-5xl font-extrabold font-display  text-gray-700 uppercase tracking-tight">
          Maestros Guías de Tosei Gusoku Dojo
        </h3>
        <p className="text-sm sm:text-lg text-gray-700 italic leading-relaxed max-w-3xl  font-sans">
          Karate Do Shito Ryu Inoue Ha Santo Domingo
        </p>
      </div>

      <section className="relative w-full h-auto flex flex-col md:flex-row items-center justify-end overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${Bannerblack})`,
        }}
      >
        {/* Layer 2: Gradient */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-white/10 via-30% to-transparent" />

        {/* Layer 1: Image */}
        <div className="flex w-full   md:flex-1 pt-10">
          <img src={Kyoshi} alt="Banner" className="w-full h-full " />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-white/1 via-60% to-transparent" />
        </div>

        {/* Layer 3: Text content */}
        <div className="relative z-20  flex md:flex-1 items-center  ">
          {/* Right Text details and Black Card with Curriculum */}
          <div className="space-y-6 md:pt- px-8  text-center md:text-left  md:pt-10">
            <span className="text-xs border border-brand-accent text-brand-accent px-6 py-1 rounded-full font-bold font-display uppercase tracking-widest inline-block">
              MÁXIMA AUTORIDAD TÉCNICA
            </span>
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


      {/* 7. Sección "Shihan Muneo Kano" y Manuel Balbuena */}
      <section className="h-auto py-16 bg-no-repeat bg-scroll bg-cover bg-center relative isolate overflow-hidden flex flex-col lg:flex-row items-start justify-center gap-12" style={{
          backgroundImage: `url(${Bannerblack})`
        }}
      >
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black via-white/10 via-30% to-transparent" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-50% to-transparent" />
              {/* Shihan Muneo Kano*/}
        <div className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center z-10 relative">


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

          <div className="max-w-2xl px-8 mx-auto space-y-3">
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
        <div className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center z-10">


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

          <div className="max-w-2xl px-8 mx-auto space-y-3">
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
