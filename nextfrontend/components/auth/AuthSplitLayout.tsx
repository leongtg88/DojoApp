'use client';

import React from 'react';
import { AuthSidePanel } from './AuthSidePanel';
import { Shield } from 'lucide-react';
import { DOJO_INFO } from '@/lib/auth-data';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  mode: 'login' | 'registro';
}

export function AuthSplitLayout({ children, mode }: AuthSplitLayoutProps) {
  const viewMode = getDefaultViewMode();

  // If viewMode === 'mobile', wrap in simulated 390px mobile device frame
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 flex flex-col items-center justify-center">
        {/* Device frame indicator */}
        <div className="text-center mb-3 text-[10px] tracking-[0.2em] uppercase text-white/40 font-mono flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
          <span>Simulador Móvil (390px × 844px) • Tosei Gusoku Dojo</span>
        </div>

        <div
          id="mobile-device-simulator-frame"
          className="w-[390px] h-[844px] max-h-[92vh] bg-[#0f0f0f] rounded-[40px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[10px] border-neutral-900 overflow-hidden flex flex-col relative text-white"
        >
          {/* Mobile notch / dynamic island */}
          <div className="w-full bg-[#0f0f0f] pt-2.5 pb-1 px-7 flex justify-between items-center text-[10px] text-white/40 font-medium select-none z-20">
            <span>9:41</span>
            <div className="w-24 h-4 bg-black rounded-full mx-auto border border-white/5" />
            <span>5G • 100%</span>
          </div>

          {/* Mobile content scroll area */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#0f0f0f] text-white relative">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Mobile Header Logo */}
            <div className="relative z-10 flex items-center gap-2.5 pb-6 mb-4 border-b border-white/5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-white to-gray-500 flex items-center justify-center text-black shadow-md">
                <Shield className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-sans font-bold uppercase text-xs tracking-[0.3em] block text-white">
                  {DOJO_INFO.name}
                </span>
                <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-semibold">
                  {DOJO_INFO.specialty}
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="relative z-10">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="auth-split-layout-root"
      className="min-h-screen w-full bg-[#0a0a0a] bg-[radial-gradient(circle_at_70%_30%,_#1a1a1a_0%,_#0a0a0a_100%)] flex flex-col justify-center items-center p-0 md:p-6 lg:p-10 text-white"
    >
      {/* Container card */}
      <div className="w-full max-w-6xl min-h-screen md:min-h-[720px] bg-[#0f0f0f] md:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden border-0 md:border md:border-white/10 flex flex-col md:flex-row relative">
        {/* Left column: 50% Auth Form */}
        <div
          id="auth-form-column"
          className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-[#0f0f0f] md:border-r md:border-white/5 relative overflow-y-auto"
        >
          {/* Subtle dot matrix pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Brand Tag for mobile/desktop */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-white to-gray-500 flex items-center justify-center text-black shadow-lg">
                <Shield className="w-4 h-4 text-black" />
              </div>
              <div>
                <span className="font-sans font-bold uppercase text-xs tracking-[0.3em] block text-white leading-tight">
                  {DOJO_INFO.name}
                </span>
                <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-semibold">
                  {DOJO_INFO.specialty}
                </span>
              </div>
            </div>

            <div className="hidden sm:inline-flex items-center text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
              Santo Domingo
            </div>
          </div>

          {/* Form Content */}
          <div className="relative z-10 my-auto">{children}</div>

          {/* Bottom subtle copyright / location */}
          <div className="relative z-10 mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[10px] tracking-[0.15em] uppercase text-white/30 gap-2">
            <span>© {new Date().getFullYear()} {DOJO_INFO.name}</span>
            <span className="text-white/20 text-center sm:text-right font-mono">{DOJO_INFO.location}</span>
          </div>
        </div>

        {/* Right column: 50% Side Panel (Image background + overlay negro/60) */}
        <div className="w-full md:w-1/2 hidden md:block">
          <AuthSidePanel mode={mode} />
        </div>
      </div>
    </div>
  );
}

function getDefaultViewMode(): 'responsive' | 'desktop' | 'mobile' {
  return 'responsive';
}
