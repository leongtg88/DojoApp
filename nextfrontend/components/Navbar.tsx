'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu, X, BookOpen, Calendar, MapPin, Camera, MessagesSquare,
  Play, Home, ClipboardList
} from 'lucide-react';
import DojoEnrollmentModal from './DojoEnrollmentModal';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [preSelectedProgram, setPreSelectedProgram] = useState<'kid' | 'adult'>('adult');

  const handleOpenEnrollment = (program: string = 'adult') => {
    setPreSelectedProgram(program === 'kid' ? 'kid' : 'adult');
    setIsEnrollmentModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 w-full h-20 bg-white backdrop-blur-xs border-b border-white/60 shadow-lg z-50 flex items-center justify-between px-4 sm:px-8 md:px-12">
        <Link href="/" className="flex items-center gap-3 cursor-pointer focus:outline-none text-left">
          <div className="w-[220px] h-[50px] flex items-center justify-center font-extrabold font-display text-lg text-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/LogoRecatangularNegro.svg" alt="Logo Tosei Gusoku" />
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <Link href="/" className={`cursor-pointer transition-colors hover:text-brand-accent ${pathname === '/' ? 'text-brand-accent font-bold' : 'text-gray-700'}`}>
            Inicio
          </Link>
          <Link href="/nosotros" className={`cursor-pointer transition-colors hover:text-brand-accent ${pathname === '/nosotros' ? 'text-brand-accent font-bold' : 'text-gray-700'}`}>
            Sobre Nosotros
          </Link>
          <Link href="/#horarios" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:text-brand-accent transition-colors cursor-pointer">
            Horarios
          </Link>
          <Link href="/#contacto" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-700 hover:text-brand-accent transition-colors cursor-pointer">
            Sucursal y Contacto
          </Link>
          <Link href="/inscripcion" className={`cursor-pointer transition-colors hover:text-brand-accent ${pathname === '/inscripcion' ? 'text-brand-accent font-bold' : 'text-gray-700'}`}>
            Inscripción
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => handleOpenEnrollment('adult')}
            className="bg-brand-accent/10 border border-brand-accent/20 hover:bg-brand-accent hover:text-black text-brand-accent font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95 uppercase tracking-wide"
          >
            CLASE DEMO GRATIS
          </button>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-gray-700 hover:text-brand-accent p-2 rounded-lg cursor-pointer focus:outline-none"
          aria-label="Menú principal"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 w-full md:hidden h-14 bg-brand-bg/95 backdrop-blur-xl border-t border-white/10 z-40 flex items-center justify-around px-4 ">
        <Link href="/" className={`flex flex-col items-center justify-center p-2 text-xs cursor-pointer ${pathname === '/' ? 'text-brand-accent font-bold' : 'text-gray-700/60'}`}>
          <Home className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider">Dojo Home</span>
        </Link>
        <Link href="/nosotros" className={`flex flex-col items-center justify-center p-2 text-xs cursor-pointer ${pathname === '/nosotros' ? 'text-brand-accent font-bold' : 'text-gray-700/60'}`}>
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider">Nosotros</span>
        </Link>
        <Link href="/#horarios" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center justify-center p-2 text-xs text-gray-700/60 cursor-pointer">
          <Calendar className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider">Horarios</span>
        </Link>
        <Link href="/inscripcion" className={`flex flex-col items-center justify-center p-2 text-xs cursor-pointer ${pathname === '/inscripcion' ? 'text-brand-accent font-bold' : 'text-gray-700/60'}`}>
          <ClipboardList className="w-5 h-5 mb-1" />
          <span className="font-display text-[9px] uppercase tracking-wider font-bold">Inscripción</span>
        </Link>
      </nav>

      {/* Mobile slide-out drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-45 md:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="absolute top-20 right-0 w-72 h-[calc(100vh-80px)] bg-white border-l border-white/10 p-6 flex flex-col justify-between z-10"
            >
              <div className="space-y-6 text-left">
                <p className="text-xs font-bold tracking-widest text-brand-accent uppercase font-display">SECCIONES DE TOSEI GUSOKU</p>
                <div className="flex flex-col gap-4 text-base font-regular">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`text-left transition-colors flex items-center gap-3 py-1 cursor-pointer ${pathname === '/' ? 'text-brand-accent' : 'text-gray-700/80'}`}>
                    <Home className="w-4 h-4 shrink-0" /><span>Inicio (Dojo Home)</span>
                  </Link>
                  <Link href="/nosotros" onClick={() => setIsMobileMenuOpen(false)} className={`text-left transition-colors flex items-center gap-3 py-1 cursor-pointer ${pathname === '/nosotros' ? 'text-brand-accent' : 'text-gray-700/80'}`}>
                    <BookOpen className="w-4 h-4 shrink-0" /><span>Sobre Nosotros</span>
                  </Link>
                  <Link href="/#horarios" onClick={() => setIsMobileMenuOpen(false)} className="text-left text-gray-700/80 hover:text-brand-accent transition-colors flex items-center gap-3 py-1">
                    <Calendar className="w-4 h-4 shrink-0" /><span>Horarios Semanales</span>
                  </Link>
                  <Link href="/#contacto" onClick={() => setIsMobileMenuOpen(false)} className="text-left text-gray-700/80 hover:text-brand-accent transition-colors flex items-center gap-3 py-1">
                    <MapPin className="w-4 h-4 shrink-0" /><span>Sucursal y Contacto</span>
                  </Link>
                  <Link href="/inscripcion" onClick={() => setIsMobileMenuOpen(false)} className={`text-left transition-colors flex items-center gap-3 py-1 cursor-pointer ${pathname === '/inscripcion' ? 'text-brand-accent' : 'text-gray-700/80'}`}>
                    <ClipboardList className="w-4 h-4 shrink-0" /><span>Formulario de Inscripción</span>
                  </Link>
                </div>
              </div>
              <div className="py-2 px-6 inline-block bg-current backdrop-blur-sm shadow-xl/30 border hover-color-change hover:bg-white hover:text-gray-700 font-regular rounded-lg mt-auto" style={{ animation: "border-color-change 10s infinite linear" }}>
                <button
                  onClick={() => handleOpenEnrollment('adult')}
                  className="block w-full text-center text-gray-700 hover:text-white hover:bg-white text-sm text-center font-semibold 2xl:text-base transition-colors duration-300 cursor-pointer">
                  RESERVAR CLASE DEMO
                </button>
              </div>
                <p className="text-[10px] pt-4 text-gray-700/40 text-center">Primer entrenamiento gratuito sin compromiso de pago.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DojoEnrollmentModal
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
        preSelectedProgram={preSelectedProgram}
      />

      {/* Social icons placeholders used in footer - kept here for Camera/MessagesSquare/Play imports */}
      <span className="hidden"><Camera /><MessagesSquare /><Play /></span>
    </>
  );
}
