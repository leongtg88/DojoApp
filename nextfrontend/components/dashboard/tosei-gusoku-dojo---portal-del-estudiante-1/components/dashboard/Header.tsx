'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Award,
  Calendar,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { mockStudentProfile, mockBeltRank } from '@/data/mock-data';

interface HeaderProps {
  currentPageTitle?: string;
  onLogoutClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPageTitle,
  onLogoutClick,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive current title if not provided
  let pageTitle = currentPageTitle;
  if (!pageTitle) {
    if (pathname.includes('/datos')) pageTitle = 'Mis Datos';
    else if (pathname.includes('/grado')) pageTitle = 'Mi Grado';
    else if (pathname.includes('/horario')) pageTitle = 'Horario';
    else pageTitle = 'Resumen';
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FCF9F8]/90 backdrop-blur-md border-b border-[#E5E2E1]/60 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#DC2626] rounded-sm" />
            <Link
              href="/dashboard/estudiante"
              className="flex flex-col group transition-opacity hover:opacity-90"
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base tracking-tight text-[#1C1B1B] sm:text-lg">
                  TOSEI GUSOKU
                </span>
                <span
                  className="text-xs font-bold text-[#DC2626] select-none tracking-widest opacity-90 hidden sm:inline"
                  title="当世具足 - Armadura Contemporánea"
                >
                  当世具足
                </span>
              </div>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="text-[10px] font-bold tracking-widest text-[#666028] uppercase">
                  DOJO
                </span>
                <span className="w-1 h-1 rounded-full bg-[#666028]/40" />
                <span className="text-[11px] font-medium text-[#5C403C]">
                  {pageTitle}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Area: Student Avatar, Name, Alumno badge, Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/dashboard/estudiante/datos"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F0EDEC] transition-colors"
              title="Ver perfil de estudiante"
            >
              <div className="flex flex-col items-end text-right hidden sm:flex">
                <span className="text-xs font-bold text-[#1C1B1B] leading-tight">
                  Alejandro S.
                </span>
                <span className="text-[10px] font-semibold text-[#666028] uppercase tracking-wider scale-95 origin-right">
                  Alumno
                </span>
              </div>

              {/* Student Circular Avatar with AS Initials */}
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#B70011] text-white flex items-center justify-center font-display font-bold text-xs shadow-sm border border-white/50">
                  AS
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FCF9F8] flex items-center justify-center"
                  title="Alumno Activo"
                >
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                </span>
              </div>
            </Link>

            {/* Logout Action */}
            <button
              type="button"
              onClick={onLogoutClick}
              aria-label="Cerrar sesión"
              title="Cerrar sesión segura"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C403C] hover:text-[#DC2626] hover:bg-[#F0EDEC] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle for full navigation drawer */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#5C403C] hover:bg-[#F0EDEC] transition-colors"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Accessible when clicking menu) */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-[#1C1B1B]/60 backdrop-blur-sm flex flex-col"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[#FCF9F8] w-4/5 max-w-xs h-full p-5 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E2E1]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#DC2626] rounded-sm" />
                  <span className="font-display font-extrabold text-sm text-[#1C1B1B]">
                    TOSEI GUSOKU
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-[#5C403C]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student info box */}
              <div className="my-4 p-3 rounded-xl bg-[#F0EDEC] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#B70011] text-white flex items-center justify-center font-bold text-sm">
                  AS
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1C1B1B] truncate">
                    {mockStudentProfile.fullName}
                  </span>
                  <span className="text-[11px] text-[#666028] font-medium">
                    {mockBeltRank.currentRankName} • {mockStudentProfile.branch}
                  </span>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col gap-1 mt-3">
                <Link
                  href="/dashboard/estudiante"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname === '/dashboard/estudiante'
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#5C403C] hover:bg-[#F0EDEC]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Resumen
                </Link>

                <Link
                  href="/dashboard/estudiante/datos"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname.startsWith('/dashboard/estudiante/datos')
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#5C403C] hover:bg-[#F0EDEC]'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Mis datos
                </Link>

                <Link
                  href="/dashboard/estudiante/grado"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname.startsWith('/dashboard/estudiante/grado')
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#5C403C] hover:bg-[#F0EDEC]'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Mi grado
                </Link>

                <Link
                  href="/dashboard/estudiante/horario"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname.startsWith('/dashboard/estudiante/horario')
                      ? 'bg-[#DC2626] text-white'
                      : 'text-[#5C403C] hover:bg-[#F0EDEC]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Horario
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#E5E2E1]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogoutClick?.();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
