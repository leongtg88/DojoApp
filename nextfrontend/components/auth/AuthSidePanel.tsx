'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Globe, Award, Sparkles, CheckCircle, Shield } from 'lucide-react';
import { DOJO_INFO } from '@/lib/auth-data';

interface AuthSidePanelProps {
  mode: 'login' | 'registro';
}

export function AuthSidePanel({ mode }: AuthSidePanelProps) {
  const isLogin = mode === 'login';

  const title = isLogin ? 'Logística Global Confiable' : 'Únete a Nuestra Escuela';
  const subtitle = isLogin
    ? 'Gestiona tu entrenamiento marcial con la misma precisión que mueve el mundo.'
    : 'Comienza tu camino en el karate tradicional Shito Ryu con instructores certificados en Santo Domingo.';

  return (
    <div
      id="auth-side-panel"
      className="relative hidden md:flex flex-col justify-between p-10 lg:p-14 w-full h-full overflow-hidden text-white bg-[#0f0f0f]"
    >
      {/* Background karate image with deep elegant dark treatment */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 transform scale-105 opacity-20"
        style={{
          backgroundImage: `url('https://picsum.photos/seed/karate_dojo_master/1600/1200')`,
        }}
      />

      {/* Radial dark gradient overlay matching design */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_30%,_#1a1a1a_0%,_#0a0a0a_100%)] opacity-90" />

      {/* Subtle dot matrix pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header section in side panel */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-white to-gray-500 flex items-center justify-center text-black shadow-lg">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-bold tracking-[0.3em] uppercase text-white">
              {DOJO_INFO.name}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] tracking-[0.2em] uppercase text-white/40 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span>Sistema Activo</span>
          </div>
        </motion.div>
      </div>

      {/* Main Dynamic Message */}
      <div className="relative z-10 my-auto py-8">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35 }}
          className="max-w-md space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            <Award className="w-3.5 h-3.5 text-white/60" />
            <span>{isLogin ? 'Acceso a Miembros' : 'Admisión Abierta'}</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-light tracking-tighter leading-[1.05] text-white">
            {title}
          </h1>

          <div className="w-12 h-[1px] bg-white/20 my-4" />

          <p className="text-sm text-white/40 leading-relaxed font-light max-w-sm">
            {subtitle}
          </p>

          {/* Quick value props */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3 text-xs text-white/70">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              <span className="font-light tracking-wide">{DOJO_INFO.target}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              <span className="font-light tracking-wide">Instructores certificados internacionalmente</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/70">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
              <span className="font-light tracking-wide">Seguimiento de grados, katas y kumite tradicional</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Info Card */}
      <div className="relative z-10 pt-4 border-t border-white/5 space-y-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
              {DOJO_INFO.cta}
            </span>
            <span className="text-[10px] font-mono text-white/30 tracking-wider">SHITO RYU // INOUE-HA</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <span className="truncate">{DOJO_INFO.location}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <span className="font-mono text-white/70">{DOJO_INFO.whatsapp}</span>
              </div>
              <a
                href={DOJO_INFO.web}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[11px] underline underline-offset-4">toseigusoku.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* System telemetry line matching design */}
        <div className="flex items-center justify-between text-[10px] font-mono text-white/20 tracking-wider pt-1">
          <span>SECURE_AUTH // V2.0</span>
          <span>LATENCY &lt; 15MS</span>
        </div>
      </div>
    </div>
  );
}
