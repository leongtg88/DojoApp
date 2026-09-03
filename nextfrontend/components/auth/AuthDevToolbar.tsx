'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { SEED_USERS } from '@/lib/auth-data';
import {
  Wrench,
  Smartphone,
  Monitor,
  Maximize2,
  Zap,
  UserCheck,
  ChevronUp,
  ChevronDown,
  LogOut,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthDevToolbarProps {
  onAutoFill?: (email: string, pass: string) => void;
  onSwitchMode?: (mode: 'login' | 'registro') => void;
  currentMode?: 'login' | 'registro';
}

export function AuthDevToolbar({
  onAutoFill,
  onSwitchMode,
  currentMode,
}: AuthDevToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, logout, viewMode, setViewMode } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  const activeScreen = currentMode || (pathname === '/registro' ? 'registro' : 'login');

  const handleToggleScreen = () => {
    const target = activeScreen === 'login' ? 'registro' : 'login';
    if (onSwitchMode) {
      onSwitchMode(target);
    } else {
      router.push(`/${target}`);
    }
  };

  const handleFillSeed = (index: number) => {
    const seed = SEED_USERS[index];
    if (!seed) return;
    if (onAutoFill) {
      onAutoFill(seed.email, seed.password);
    }
  };

  const handleQuickFlowTest = async () => {
    setIsAutoLoggingIn(true);
    try {
      // Auto login as Instructor
      const instructor = SEED_USERS[1];
      await login(instructor.email, instructor.password);
      router.push('/');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  return (
    <div
      id="dev-toolbar-container"
      className="fixed bottom-3 right-3 z-40 max-w-[95vw] text-xs font-sans shadow-2xl transition-all"
    >
      <div className="bg-[#0f0f0f]/95 backdrop-blur-md text-white border border-white/10 rounded-2xl p-2.5 shadow-2xl shadow-black/80">
        {/* Top bar header */}
        <div className="flex items-center justify-between gap-3 px-1 pb-1 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-sans font-bold uppercase tracking-[0.2em] text-[10px] text-white/70 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-white/60" />
              Dev Toolbar
            </span>
            {user && (
              <span className="bg-white/10 text-white border border-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {user.role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-white/40 hover:text-white rounded transition-colors"
              title={isOpen ? 'Minimizar barra' : 'Expandir barra'}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="pt-2.5 space-y-2.5">
            {/* Row 1: Viewport Simulator & Screen Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Screen toggle */}
              <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
                <button
                  id="btn-dev-mode-login"
                  onClick={() => (onSwitchMode ? onSwitchMode('login') : router.push('/login'))}
                  className={`px-2.5 py-1 rounded-lg font-sans uppercase tracking-[0.15em] text-[10px] font-bold transition-all ${
                    activeScreen === 'login'
                      ? 'bg-white text-black shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Login
                </button>
                <button
                  id="btn-dev-mode-registro"
                  onClick={() => (onSwitchMode ? onSwitchMode('registro') : router.push('/registro'))}
                  className={`px-2.5 py-1 rounded-lg font-sans uppercase tracking-[0.15em] text-[10px] font-bold transition-all ${
                    activeScreen === 'registro'
                      ? 'bg-white text-black shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Registro
                </button>
              </div>

              {/* Viewport mode */}
              <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10" title="Simulador de pantalla">
                <button
                  id="btn-viewmode-responsive"
                  onClick={() => setViewMode('responsive')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'responsive'
                      ? 'bg-white text-black shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title="Responsivo fluido"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-viewmode-desktop"
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'desktop'
                      ? 'bg-white text-black shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title="Vista Escritorio (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-viewmode-mobile"
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'mobile'
                      ? 'bg-white text-black shadow'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title="Simulación Móvil (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Row 2: Quick Autofill Pills (Admin, Instructor, Alumno) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-semibold">
                Autorellenar credenciales seed:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-autofill-admin"
                  type="button"
                  onClick={() => handleFillSeed(0)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-lg text-[10px] font-medium transition-colors"
                  title="admin@toseigusoku.com"
                >
                  Admin
                </button>
                <button
                  id="btn-autofill-instructor"
                  type="button"
                  onClick={() => handleFillSeed(1)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-lg text-[10px] font-medium transition-colors"
                  title="instructor@toseigusoku.com"
                >
                  Instructor
                </button>
                <button
                  id="btn-autofill-alumno"
                  type="button"
                  onClick={() => handleFillSeed(2)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-lg text-[10px] font-medium transition-colors"
                  title="alumno@test.com"
                >
                  Alumno
                </button>
              </div>
            </div>

            {/* Row 3: Action buttons: Probar Flujo & Session Reset */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                id="btn-dev-quick-test-flow"
                type="button"
                onClick={handleQuickFlowTest}
                disabled={isAutoLoggingIn}
                className="hero-button flex-1 py-1.5 px-2 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md disabled:opacity-50"
              >
                <Zap className="w-3 h-3 fill-black text-black" />
                <span>{isAutoLoggingIn ? 'Entrando...' : 'Probar Flujo'}</span>
              </button>

              {user ? (
                <button
                  id="btn-dev-logout"
                  type="button"
                  onClick={logout}
                  className="py-1.5 px-2 bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-200 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors"
                  title="Cerrar sesión activa"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push('/')}
                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                  title="Ir al Dashboard o Home"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Dojo</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
