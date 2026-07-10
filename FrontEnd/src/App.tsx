import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import logoRectangularNegro from './assets/LogoRecatangularNegro.svg';
import { 
  Menu, 
  X, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Camera,
  MessagesSquare,
  Play,
  Home,
  UserCheck
} from 'lucide-react';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import DojoEnrollmentModal from './components/DojoEnrollmentModal';

export default function App() {
  const [view, setView] = useState<'home' | 'about'>('home');
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [preSelectedProgram, setPreSelectedProgram] = useState<'kid' | 'adult'>('adult');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleOpenEnrollment = (program: string = 'adult') => {
    setPreSelectedProgram(program === 'kid' ? 'kid' : 'adult');
    setIsEnrollmentModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (targetView: 'home' | 'about') => {
    setView(targetView);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-[#dee2f0] flex flex-col font-sans relative antialiased selection:bg-brand-accent selection:text-white">
      
      {/* 1. Header Navigation Bar */}
      <nav className="fixed top-0 w-full h-20 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-lg z-50 flex items-center justify-between px-4 sm:px-8 md:px-12">
        {/* Logo click returns to home */}
        <button 
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-3 cursor-pointer focus:outline-none text-left"
        >
          <div className="w-[220px] h-[50px] flex items-center justify-center font-extrabold font-display text-lg text-white">
            <img src={logoRectangularNegro} alt="Logo Tosei Gusoku" />
          </div>

        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <button 
            onClick={() => handleNavigate('home')}
            className={`cursor-pointer transition-colors hover:text-brand-accent ${view === 'home' ? 'text-brand-accent font-bold' : 'text-gray-700'}`}
          >
            Inicio
          </button>
          
          <button 
            onClick={() => handleNavigate('about')}
            className={`cursor-pointer transition-colors hover:text-brand-accent ${view === 'about' ? 'text-brand-accent font-bold' : 'text-gray-700'}`}
          >
            Sobre Nosotros
          </button>

          <a 
            href="#horarios" 
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('horarios');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-gray-700 hover:text-brand-accent transition-colors"
          >
            Horarios
          </a>

          <a 
            href="#contacto"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('contacto');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }} 
            className="text-gray-700 hover:text-brand-accent transition-colors"
          >
            Sucursal y Contacto
          </a>
        </div>

        {/* Desktop CTA actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => handleOpenEnrollment('adult')}
            className="bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent hover:text-black text-brand-accent font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95 uppercase tracking-wide"
          >
            CLASE DEMO GRATIS
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-white hover:text-brand-accent p-2 rounded-lg cursor-pointer focus:outline-none"
          aria-label="Menú principal"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-45 md:hidden">
            {/* Backdrop click indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Menu List */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute top-20 right-0 w-72 h-[calc(100vh-80px)] bg-[#0e0e0e] border-l border-white/10 p-6 flex flex-col justify-between z-10"
            >
              <div className="space-y-6 text-left">
                <p className="text-[10px] font-bold tracking-widest text-brand-accent uppercase font-display">SECCIONES DE TOSEI GUSOKU</p>
                <div className="flex flex-col gap-4 text-base font-bold">
                  <button 
                    onClick={() => handleNavigate('home')}
                    className={`text-left transition-colors flex items-center gap-3 py-1 cursor-pointer ${view === 'home' ? 'text-brand-accent' : 'text-white/80'}`}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>Inicio (Dojo Home)</span>
                  </button>

                  <button 
                    onClick={() => handleNavigate('about')}
                    className={`text-left transition-colors flex items-center gap-3 py-1 cursor-pointer ${view === 'about' ? 'text-brand-accent' : 'text-white/80'}`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>Sobre Nosotros</span>
                  </button>

                  <a 
                    href="#horarios"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate('home');
                      setTimeout(() => {
                        const el = document.getElementById('horarios');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }}
                    className="text-left text-white/80 hover:text-brand-accent transition-colors flex items-center gap-3 py-1"
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Horarios Semanales</span>
                  </a>

                  <a 
                    href="#contacto"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate('home');
                      setTimeout(() => {
                        const el = document.getElementById('contacto');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }}
                    className="text-left text-white/80 hover:text-brand-accent transition-colors flex items-center gap-3 py-1"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Ubicación y Contacto</span>
                  </a>
                </div>
              </div>

              {/* Mobile custom CTA block */}
              <div className="space-y-4 pt-6 border-t border-white/10">
                <button
                  onClick={() => handleOpenEnrollment('adult')}
                  className="w-full bg-brand-accent hover:bg-brand-accent-hover text-black font-extrabold py-3.5 rounded-xl text-xs block text-center belt-glow uppercase tracking-wider cursor-pointer"
                >
                  RESERVAR CLASE DEMO
                </button>
                <p className="text-[10px] text-white/40 text-center">
                  Primer entrenamiento gratuito sin compromiso de pago.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* 2. Main Page views with animated slide transitions */}
      <main className="flex-grow pt-20 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div id="home">
                <HomeView 
                  onOpenEnrollment={handleOpenEnrollment} 
                  onNavigateToAbout={() => handleNavigate('about')} 
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="about-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AboutView 
                onOpenEnrollment={handleOpenEnrollment} 
                onNavigateToHome={() => handleNavigate('home')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Target points for scroll linkages in parent App */}
      <div id="horarios" className="absolute top-[3150px] pointer-events-none w-1 h-1" />
      <div id="contacto" className="absolute top-[3950px] pointer-events-none w-1 h-1" />


      {/* 3. Global Footer Component */}
      <footer className="bg-[#050505] pt-16 pb-32 md:pb-16 px-6 md:px-12 border-t border-white/5 relative z-10 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Logo description block */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center font-extrabold font-display text-lg text-white">
                TG
              </div>
              <div className="leading-none text-left">
                <span className="font-display font-extrabold text-base block tracking-tighter uppercase text-white">
                  Tosei Gusoku
                </span>
                <span className="text-[9px] block text-zinc-500 uppercase tracking-widest font-bold">
                  Dojo Shito Ryu
                </span>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-sans max-w-sm">
              Escuela de Karate de primer nivel enfocada en el desarrollo integral humano de niños, jóvenes y adultos. Representantes de Inoue Ha Shito-Ryu Keishin Kai.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-brand-accent hover:text-black transition-colors">
                <Camera className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-brand-accent hover:text-black transition-colors">
                <MessagesSquare className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-brand-accent hover:text-black transition-colors">
                <Play className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick linkages lists */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Secciones</h5>
            <ul className="space-y-2 text-xs font-semibold text-white/60">
              <li>
                <button onClick={() => handleNavigate('home')} className="hover:text-brand-accent cursor-pointer">Inicio (Dojo Home)</button>
              </li>
              <li>
                <button onClick={() => handleNavigate('about')} className="hover:text-brand-accent cursor-pointer">Sobre Nosotros (Nuestros Maestros)</button>
              </li>
              <li>
                <a href="#horarios" onClick={(e) => {
                  e.preventDefault();
                  handleNavigate('home');
                  setTimeout(() => {
                    document.getElementById('horarios')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }} className="hover:text-brand-accent">Horarios de Práctica</a>
              </li>
              <li>
                <a href="#contacto" onClick={(e) => {
                  e.preventDefault();
                  handleNavigate('home');
                  setTimeout(() => {
                    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }} className="hover:text-brand-accent">Sucursal Bella Vista</a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Organización</h5>
            <div className="text-xs text-white/60 space-y-1">
              <p>• Shito Ryu Inoue Ha branch</p>
              <p>• Keishin Kai International</p>
              <p>• Reconocidos por FEDOKARATE</p>
              <p>• Miembro WKF Olímpico</p>
            </div>
          </div>

          {/* Contact block */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-widest text-brand-accent font-display">Soporte</h5>
            <div className="text-xs text-white/60 space-y-1.5">
              <a href="#" className="hover:text-brand-accent block">Términos Legales</a>
              <a href="#" className="hover:text-brand-accent block">Privacidad de Datos</a>
              <p className="pt-2 text-[10px] text-white/40">© {new Date().getFullYear()} Escuela Tosei Gusoku. Modern Bushido Excellence.</p>
            </div>
          </div>

        </div>
      </footer>


      {/* 4. Bottom Tab Navigation Bar (Highly intuitive mobile visual navigation) */}
      <nav className="fixed bottom-0 left-0 w-full md:hidden h-20 bg-brand-bg/95 backdrop-blur-xl border-t border-white/10 z-40 flex items-center justify-around px-4 pb-4">
        <button 
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center justify-center p-2 text-xs cursor-pointer ${
            view === 'home' ? 'text-brand-accent font-bold' : 'text-white/60'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider">Dojo Home</span>
        </button>

        <button 
          onClick={() => handleNavigate('about')}
          className={`flex flex-col items-center justify-center p-2 text-xs cursor-pointer ${
            view === 'about' ? 'text-brand-accent font-bold' : 'text-white/60'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider">Nosotros</span>
        </button>

        <button 
          onClick={() => {
            handleNavigate('home');
            setTimeout(() => {
              const el = document.getElementById('horarios');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex flex-col items-center justify-center p-2 text-xs text-white/60 cursor-pointer"
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider">Horarios</span>
        </button>

        <button 
          onClick={() => handleOpenEnrollment('adult')}
          className="flex flex-col items-center justify-center p-2 text-xs text-brand-secondary cursor-pointer"
        >
          <UserCheck className="w-5 h-5 mb-1 text-brand-secondary shrink-0" />
          <span className="font-display text-[9px] uppercase tracking-wider font-bold">Matrícula</span>
        </button>
      </nav>


      {/* 5. Inscription Reservation Modal Dialog */}
      <DojoEnrollmentModal 
        isOpen={isEnrollmentModalOpen} 
        onClose={() => setIsEnrollmentModalOpen(false)} 
        preSelectedProgram={preSelectedProgram}
      />

    </div>
  );
}
