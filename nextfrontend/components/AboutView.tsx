'use client';

import { useState } from 'react';
import { MOCK_INSTRUCTORS } from '@/lib/types';
import Link from 'next/link';

interface AboutViewProps {
  onOpenEnrollment: (program?: string) => void;
}

export default function AboutView({ onOpenEnrollment }: AboutViewProps) {
  const senseiLeon = MOCK_INSTRUCTORS.find(i => i.id === 'sensei-leon') || MOCK_INSTRUCTORS[0];
  const shihanManuel = MOCK_INSTRUCTORS.find(i => i.id === 'shihan-manuel') || MOCK_INSTRUCTORS[4];
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
    'Inició karate a la temprana edad de 4 años gracias a su abuelo, quien lo inscribió al ver su inquietud por hacer movimientos de puños y patadas inspirados en las películas de artes marciales de los 80.',
    'Por cambios en la escuela, debió pausar sus prácticas hasta los 14 años, cuando se incorporó a la escuela de Miyagiken bajo la tutela del Maestro Luis Alberte en la Organización Shito Kai.',
    'Una vez iniciados sus estudios universitarios, retomó sus prácticas en la escuela de Dimitrova Dojo, en Santo Domingo, República Dominicana.',
    'Al alcanzar el grado de Marrón Primero, Sensei Germán decidió fundar su propia escuela e incorporarse a la Organización Inoue Ha Dominicana.',
    'El Sensei Germán posee conocimientos en otras artes marciales como Jujutsu, Aikido e Iaido.'
  ];

  const preview = historiaParrafos[0].slice(0, 200);
  const leonPreview = leonBioParrafos[0].slice(0, 180) + '...';
  const germanPreview = germanBioParrafos[0].slice(0, 180) + '...';

  return (
    <div className="space-y-0 min-h-screen bg-brand-bg text-[#dee2f0]">

      {/* Banner Hero Mobile */}
      <header
        className="relative md:hidden w-full h-[60vh] flex items-center justify-center px-4 overflow-hidden bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(/assets/Mawashiguericintorunnegro2026.svg)`, backgroundSize: '35%', backgroundPosition: '10% 60%' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 via-30% to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-start pt-16 h-full max-w-4xl mx-auto w-full space-y-6 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-700 leading-none capitalize">Sobre Nosotros</h1>
          <p className="text-sm text-gray-700/80 max-w-xs sm:max-w-sm leading-relaxed font-sans">
            Preservamos las bases puras y la rigurosidad técnica de Shito-Ryu Inoue Ha, fundado por Soke Yoshimi Inoue en Japón.
          </p>
          <p className="text-base sm:text-lg pt-12 pl-6 text-gray-700/80">Sensei León Gustavo</p>
        </div>
      </header>

      {/* Banner Hero Desktop */}
      <header
        className="relative hidden md:flex md:flex-col w-full h-[60vh] md:items-center justify-center px-4 md:px-12 overflow-hidden bg-no-repeat bg-fixed"
        style={{ backgroundImage: `url(/assets/Mawashiguericintorunnegro2026.svg)`, backgroundSize: '30%', backgroundPosition: '20% 40%' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 via-30% to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-6 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-gray-700 leading-none capitalize">Sobre Nosotros</h1>
          <p className="text-sm text-gray-700/80 max-w-xs sm:max-w-sm leading-relaxed font-sans">
            Preservamos las bases puras y la rigurosidad técnica de Shito-Ryu Inoue Ha, fundado por Soke Yoshimi Inoue en Japón.
          </p>
          <p className="text-base sm:text-lg pt-12 text-gray-700/80">Sensei León Gustavo</p>
        </div>
      </header>

      {/* Logo organización */}
      <section className="md:py-16 max-w-5xl mx-auto px-8 sm:px-6 text-center space-y-6">
        <img src="/assets/LogoIskia.svg" alt="Logo ISKIA" className="w-62 object-contain mx-auto" />
        <div className="space-y-4 max-w-3xl mx-auto">
          <h3 className="md:text-2xl text-xl font-bold font-display uppercase tracking-wide text-gray-700">
            International Shito Ryu Inoue Ha Karate Do of the Americas
          </h3>
          <p className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
            Nuestra institución está debidamente acreditada ante los organismos mundiales de Karate. Fomentamos la práctica del Karate-Do como método de perfeccionamiento del carácter, la biomecánica corporal saludable y el combate deportivo certificado. No somos solo un gimnasio; somos guardianes del linaje del Maestro Yoshimi Inoue.
          </p>
        </div>
      </section>

      {/* Imagen organización */}
      <section
        className="relative h-[300px] md:h-[1200px] w-full bg-center bg-contain md:bg-cover md:bg-right md:bg-fixed bg-no-repeat"
        style={{ backgroundImage: `url(/assets/NegrosInoue.svg)`, backgroundPosition: 'center 90px' }}
      >
        <div className="absolute inset-0 -bottom-[2px] bg-gradient-to-t from-white via-white/30 via-20% to-transparent" />
      </section>

      {/* Historia */}
      <section className="md:py-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8 px-8">
          <div className="lg:col-span-5 relative h-full w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <img src="/assets/letrasIKSKiatradu.svg" alt="Letras IKIA" className="w-full h-full object-contain filter contrast-105 px-8 py-8" />
          </div>
          <div className="lg:col-span-7 space-y-6 text-left">
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase text-gray-700 leading-tight">Nuestra Historia</h3>
            <div className="text-sm sm:text-base text-gray-700/70 leading-relaxed font-sans">
              <div className="hidden md:block">
                {historiaParrafos.map((p, i) => <p key={i}>{p}{i < historiaParrafos.length - 1 && <><br /><br /></>}</p>)}
              </div>
              <div className="md:hidden">
                {expandedHistory
                  ? historiaParrafos.map((p, i) => <p key={i}>{p}{i < historiaParrafos.length - 1 && <><br /><br /></>}</p>)
                  : <p>{preview}...</p>
                }
              </div>
            </div>
            <button onClick={() => setExpandedHistory(!expandedHistory)} className="text-sm md:hidden font-bold text-brand-accent hover:text-brand-accent-hover underline">
              {expandedHistory ? 'Ver menos' : 'Ver más'}
            </button>
          </div>
        </div>
      </section>

      {/* Banner Sensei León */}
      <div className="bg-black px-8 text-left w-full lg:pl-20 2xl:pl-[20rem] space-y-4 py-10">
        <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">FUNDADOR DEL DOJO</span>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight">Sensei de Tosei Gusoku Dojo</h3>
        <p className="text-sm sm:text-lg text-white italic leading-relaxed max-w-3xl font-sans">
          &ldquo;Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Manuel Balbuena y Kyoshi Julio Martínez.&rdquo;
        </p>
      </div>

      {/* Sección León */}
      <section
        className="relative w-full h-auto md:h-[950px] px-8 overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed py-20"
        style={{ backgroundImage: `url(/assets/BannerHeroMar.svg)` }}
      >
        <div className="flex h-full flex-col md:flex-row items-center justify-center">
          <div className="flex-1 flex justify-center md:justify-end">
            <img className="h-[400px] md:pt-[150px] md:h-[1000px] z-10" src="/assets/leonshutouke.svg" alt="Sensei León" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="p-6 backdrop-blur-2xl border border-blue-700 max-w-2xl rounded-2xl space-y-4 shadow-2xl text-left">
              <div>
                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">DIRECTOR GENERAL DEL DOJO</span>
                <h4 className="font-extrabold text-2xl font-display text-gray-700 mt-1 uppercase">{senseiLeon.name}</h4>
                <p className="text-xs text-gray-700/60">Cinturón Negro 2do Dan - Inoue Ha</p>
              </div>
              <div className="space-y-3 text-xs text-gray-900 leading-relaxed font-sans">
                <div className="hidden md:block">
                  {leonBioParrafos.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <div className="md:hidden">
                  {expandedLeon ? leonBioParrafos.map((p, i) => <p key={i}>{p}</p>) : <p>{leonPreview}</p>}
                </div>
                <button onClick={() => setExpandedLeon(!expandedLeon)} className="text-sm md:hidden font-bold text-brand-accent hover:text-brand-accent-hover underline">
                  {expandedLeon ? 'Ver menos' : 'Ver más'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Sensei Germán */}
      <div className="bg-black text-left px-8 w-full lg:pl-20 2xl:pl-[20rem] space-y-2 py-4">
        <span className="text-xs font-bold text-brand-accent tracking-widest font-display uppercase block">INSTRUCTOR</span>
        <h3 className="text-3xl sm:text-4xl font-extrabold font-display uppercase tracking-tight">Sensei de Tosei Gusoku Dojo</h3>
        <p className="text-sm sm:text-lg text-white italic leading-relaxed max-w-3xl font-sans">
          &ldquo;Representante oficial de Shito Ryu Inoue Ha Santo Domingo y aprendiz de Shihan Ramón Percinal y Kyoshi Julio Martínez.&rdquo;
        </p>
      </div>

      {/* Sección Germán */}
      <section
        className="relative w-full h-auto md:h-[750px] px-8 overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed py-20"
        style={{ backgroundImage: `url(/assets/BannerHeroMar.svg)` }}
      >
        <div className="flex h-full flex-col md:flex-row items-center justify-center md:gap-12">
          <div className="flex-1 flex justify-center md:justify-end">
            <img className="h-[360px] md:pt-[150px] md:h-[1000px] z-10" src="/assets/germanGris.svg" alt="Sensei Germán" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="p-6 backdrop-blur-[80px] border border-blue-700 max-w-2xl rounded-2xl space-y-4 shadow-2xl text-left">
              <div>
                <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider font-display">Instructor</span>
                <h4 className="font-extrabold text-2xl font-display text-gray-900 mt-1 uppercase">SENSEI GERMAN LIZARDO</h4>
                <p className="text-xs text-gray-700">Cinturón Negro 1er Dan - Inoue Ha</p>
              </div>
              <div className="space-y-3 text-xs text-gray-900 leading-relaxed font-sans">
                <div className="hidden md:block">
                  {germanBioParrafos.map((p, i) => <p key={i}>{p}</p>)}
                </div>
                <div className="md:hidden">
                  {expandedGerman ? germanBioParrafos.map((p, i) => <p key={i}>{p}</p>) : <p>{germanPreview}</p>}
                </div>
                <button onClick={() => setExpandedGerman(!expandedGerman)} className="text-sm md:hidden font-bold text-brand-accent hover:text-brand-accent-hover underline">
                  {expandedGerman ? 'Ver menos' : 'Ver más'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maestros Guías */}
      <div className="bg-white text-left px-8 w-full 2xl:pl-[20rem] space-y-4 py-15">
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display text-gray-700 uppercase tracking-tight">Maestros Guías de Tosei Gusoku Dojo</h3>
        <p className="text-sm sm:text-lg text-gray-700 italic leading-relaxed max-w-3xl font-sans">Karate Do Shito Ryu Inoue Ha Santo Domingo</p>
      </div>

      {/* Kyoshi Julio */}
      <section
        className="relative w-full h-auto flex flex-col md:flex-row items-center justify-end overflow-hidden bg-no-repeat bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(/assets/bannerheroblack.svg)` }}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-white/10 via-30% to-transparent" />
        <div className="flex w-full md:flex-1 pt-10">
          <img src="/assets/kyoshiSeizafondoTransp.svg" alt="Kyoshi" className="w-full h-full" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-white/1 via-60% to-transparent" />
        </div>
        <div className="relative z-20 flex md:flex-1 items-center">
          <div className="space-y-6 px-8 text-center md:text-left md:pt-10">
            <span className="text-xs border border-brand-accent text-brand-accent px-6 py-1 rounded-full font-bold font-display uppercase tracking-widest inline-block">MÁXIMA AUTORIDAD TÉCNICA</span>
            <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase text-brand-accent leading-tight">Kyoshi Julio Martínez</h3>
            <p className="text-sm sm:text-base text-white leading-relaxed font-sans">
              Es una eminencia del karate moderno. Su experiencia de más de cinco décadas en el tatami lo ha llevado a supervisar miles de graduaciones y examinar personalmente a cientos de cinturones negros que lideran en karate en diferentes partes del mundo.
            </p>
            <div className="p-6 rounded-2xl border border-brand-accent relative overflow-hidden bg-white/20 backdrop-blur-[80px]">
              <h4 className="font-extrabold text-lg text-brand-accent font-display uppercase tracking-wide border-b border-white/10 pb-3 mb-4">CURRÍCULO DE KYOSHI JULIO</h4>
              <div className="space-y-4 flex gap-8">
                <ul className="space-y-3 text-xs sm:text-sm text-white leading-relaxed">
                  <li><strong>7th Degree Black Belt</strong><br />Karate-Do Hayashi-ha Shito-Ryu (1999).</li>
                  <li><strong>7th Degree Black Belt</strong><br />Karate-Do Inoue-ha Shito-Ryu (2008).</li>
                  <li><strong>6th Degree Black Belt</strong><br />Okinawa Goju-Ryu (2009).</li>
                  <li><strong>5th Degree Black Belt</strong><br />Okinawa Karate-Do Ryu El-Ryu (1992).</li>
                  <li><strong>5th Degree Black Belt</strong><br />Okinawa Kobudo (Weapons) (1992).</li>
                </ul>
                <ul className="space-y-3 text-xs sm:text-sm text-white leading-relaxed">
                  <li><strong>5th Degree Black Belt</strong><br />SKIF Shotokan (1990).</li>
                  <li><strong>5th Degree Black Belt</strong><br />Eishin Ryu Iaido (2007).</li>
                  <li><strong>National Class &ldquo;A&rdquo; Referee.</strong></li>
                  <li><strong>Member</strong><br />World Karate Federation (WKF), 160 countries.</li>
                  <li><strong>Member</strong><br />Dominican Karate Federation (FEDOKA).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shihan Muneo y Manuel */}
      <section
        className="h-auto py-16 bg-no-repeat bg-scroll bg-cover bg-center relative isolate overflow-hidden flex flex-col lg:flex-row items-start justify-center gap-12"
        style={{ backgroundImage: `url(/assets/bannerheroblack.svg)` }}
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black via-white/10 via-30% to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-50% to-transparent" />

        {/* Shihan Muneo */}
        <div className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center z-10 relative">
          <div className="inline-block px-8 py-4 rounded-2xl border border-brand-accent shadow-xl">
            <h4 className="font-extrabold text-xl sm:text-2xl font-display uppercase tracking-tight text-brand-accent">Shihan Muneo Kano</h4>
            <p className="text-[10px] text-white tracking-wider font-semibold uppercase mt-0.5">5th Degree Black Belt</p>
          </div>
          <img src="/assets/muneoKanoSolo.svg" alt={shihanMuneo.name} className="max-h-[500px] w-auto object-contain" />
          <div className="max-w-2xl px-8 mx-auto space-y-3">
            <p className="text-xs sm:text-sm text-white leading-relaxed font-sans font-medium italic">&ldquo;{shihanMuneo.bio}&rdquo;</p>
            {shihanMuneo.curriculum && (
              <p className="text-xs text-brand-accent font-semibold tracking-wider font-display uppercase">{shihanMuneo.curriculum.join(' • ')}</p>
            )}
          </div>
        </div>

        {/* Shihan Manuel */}
        <div className="w-full max-w-4xl mx-auto px-4 text-center space-y-6 flex flex-col items-center z-10">
          <div className="inline-block px-8 py-4 rounded-2xl border border-brand-accent shadow-xl">
            <h4 className="font-extrabold text-xl sm:text-2xl font-display uppercase tracking-tight text-brand-accent">Shihan Manuel Balbuena</h4>
            <p className="text-[10px] text-white tracking-wider font-semibold uppercase mt-0.5">5th Dan Shito Ryu Inoue Ha.</p>
          </div>
          <img src="/assets/SenseiManuelSolo.svg" alt={shihanManuel.name} className="max-h-[500px] w-auto object-contain" />
          <div className="max-w-2xl px-8 mx-auto space-y-3">
            <p className="text-xs sm:text-sm text-white leading-relaxed font-sans font-medium italic">&ldquo;{shihanManuel.bio}&rdquo;</p>
            {shihanManuel.curriculum && (
              <p className="text-xs text-brand-accent font-semibold tracking-wider font-display uppercase">{shihanManuel.curriculum.join(' • ')}</p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-white text-center border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
                    <img src="/assets/LogoSolo.svg" alt="Tosei Gusoku Logo" className="w-28 h-28 mx-auto drop-shadow-lg" style={{ animation: "color-change 10s infinite linear" }} />
          <h2 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-gray-700">Descubre tu fuerza hoy mismo</h2>
          <p className="text-xs sm:text-sm text-gray-700/70 max-w-xl mx-auto font-sans leading-relaxed">
            Te invitamos a ver y participar en una clase presencial dirigida por el Sensei León.
          </p>
         <div className="pt-4">
            <button onClick={() => onOpenEnrollment('adult')} className="hero-button glass-card-hover">RESERVAR CLASE DEMO GRATUITA</button>
          </div>
        </div>
      </section>

    </div>
  );
}
