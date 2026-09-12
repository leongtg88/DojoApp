'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LogIn, ShieldAlert } from 'lucide-react';

export function RegistrationClosedNotice() {
  return (
    <div id="registration-closed-notice" className="w-full max-w-md mx-auto py-2">
      <div className="mb-10">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            Admisión • Karate Shito Ryu
          </span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight text-white mb-2">
          Acceso por invitación
        </h2>
        <p className="text-sm text-white/40 leading-relaxed font-light">
          El registro directo está cerrado para proteger el proceso de admisión del dojo.
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 flex items-start gap-3 text-sm shadow-lg shadow-amber-950/20">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold block text-amber-200">Para ingresar a la app primero debes haberte inscrito</span>
          <span className="text-xs text-amber-300/80 leading-relaxed">
            Completa el formulario de inscripción. Una vez que el dojo reciba tu información y te convierta en alumno,
            recibirás por correo un enlace de invitación para crear tu cuenta de acceso.
          </span>
        </div>
      </div>

      <div className="pt-3 space-y-3">
        <Link
          id="link-to-inscripcion"
          href="/inscripcion"
          className="hero-button-dark w-full shadow-xl shadow-black/50"
        >
          <span className="flex items-center justify-center gap-2">
            <span>Inscribirme ahora</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
        <Link
          id="link-to-login"
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/25"
        >
          <LogIn className="w-4 h-4" />
          <span>Ya tengo mi invitación: iniciar sesión</span>
        </Link>
      </div>
    </div>
  );
}