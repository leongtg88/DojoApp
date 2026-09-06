'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { ConfirmModal } from './ConfirmModal';
import { Role, AppRoute } from '@/types';
import {
  LayoutDashboard,
  BookOpen,
  UserCheck,
  Award,
  Calendar,
  User,
  Bell,
  Menu,
  X,
  FileCheck,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import Image from 'next/image';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const {
    role,
    setRole,
    currentRoute,
    setCurrentRoute,
    activeStudent,
    activeInstructor,
    toast,
    dismissToast,
    pendingReversion,
    confirmPendingReversion,
    cancelPendingReversion,
    attendances,
    todayBirthdays,
  } = useDojo();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const pendingAttendanceCount = attendances.filter((a) => a.status === 'PENDIENTE').length;

  // Navigation Items per role
  const getNavItems = (): Array<{ id: AppRoute; label: string; icon: any; badge?: number }> => {
    switch (role) {
      case 'student':
        return [
          { id: 'student-dashboard' as AppRoute, label: 'Resumen', icon: LayoutDashboard },
          { id: 'student-katas' as AppRoute, label: 'Mi grado y katas', icon: BookOpen },
          { id: 'student-schedule' as AppRoute, label: 'Horario y Asistencia', icon: Calendar },
          { id: 'student-profile' as AppRoute, label: 'Mis datos', icon: User },
        ];
      case 'instructor':
        return [
          {
            id: 'instructor-eval' as AppRoute,
            label: 'Evaluación y Asistencias',
            icon: UserCheck,
            badge: pendingAttendanceCount > 0 ? pendingAttendanceCount : undefined,
          },
          { id: 'instructor-students' as AppRoute, label: 'Mis alumnos', icon: Users },
          { id: 'instructor-schedule' as AppRoute, label: 'Horario tatami', icon: Calendar },
        ];
      case 'admin':
        return [
          { id: 'admin-curriculum' as AppRoute, label: 'Grados y katas', icon: Award },
          {
            id: 'admin-students' as AppRoute,
            label: 'Alumnos y Asistencias',
            icon: Users,
            badge: pendingAttendanceCount > 0 ? pendingAttendanceCount : undefined,
          },
          { id: 'admin-student-detail' as AppRoute, label: 'Ficha y ascensos', icon: FileCheck },
        ];
    }
  };

  const navItems = getNavItems();

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      {/* DESKTOP SIDEBAR (w-64, dark #111111) */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen bg-[#111111] text-gray-400 z-50 select-none border-r border-[#2A2A2A]">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D10000] border border-[#D4AF37]/60 flex items-center justify-center text-white font-bold shadow-xs">
              <span className="text-base">當</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white uppercase font-sans">
                Tosei Gusoku
              </span>
              <span className="text-[10px] text-[#D4AF37] tracking-wider uppercase font-semibold">
                Karate Shito-Ryu Dojo
              </span>
            </div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="px-4 py-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full bg-[#1A1A1A] hover:bg-[#222222] rounded-lg p-2.5 flex items-center justify-between transition-colors cursor-pointer border border-[#2A2A2A]"
            >
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                  Rol Activo
                </span>
                <span className="text-xs font-bold text-white truncate flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      role === 'student'
                        ? 'bg-[#00FFFF] shadow-[0_0_6px_#00FFFF]'
                        : role === 'instructor'
                        ? 'bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]'
                        : 'bg-[#D10000] shadow-[0_0_6px_#D10000]'
                    }`}
                  />
                  {role === 'student' && 'Estudiante (Sofía)'}
                  {role === 'instructor' && 'Sensei (Instructor)'}
                  {role === 'admin' && 'Administrador Dojo'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Role Dropdown */}
            {isRoleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                    role === 'student' ? 'bg-[#D10000] text-white' : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#00FFFF]" />
                  <span>Estudiante (Sofía Martínez)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('instructor');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                    role === 'instructor' ? 'bg-[#D10000] text-white' : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>Sensei (Roberto Castillo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                    role === 'admin' ? 'bg-[#D10000] text-white' : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D10000]" />
                  <span>Administrador Central</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 py-1">
            Navegación {role === 'student' ? 'Estudiante' : role === 'instructor' ? 'Sensei' : 'Dirección'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white border-l-4 border-[#D10000] shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-mono font-bold shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-[#2A2A2A] mt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3 py-1">
              Google Studio MVP
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('deliverable-docs')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                currentRoute === 'deliverable-docs'
                  ? 'bg-[#1A1A1A] text-[#00FFFF] border-[#00FFFF]/50 shadow-xs'
                  : 'bg-transparent text-[#00FFFF]/80 border-[#00FFFF]/20 hover:bg-[#1A1A1A] hover:text-[#00FFFF]'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0 text-[#00FFFF]" />
              <span>Entregable & Matriz</span>
            </button>
          </div>
        </nav>

        {/* User Info Card at bottom */}
        <div className="p-3 border-t border-[#2A2A2A] bg-[#0E0E0E] flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#D4AF37]/50">
            <Image
              src={
                role === 'student'
                  ? activeStudent.avatar
                  : activeInstructor.avatar
              }
              alt="Profile"
              fill
              sizes="32px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">
              {role === 'student' ? activeStudent.name : activeInstructor.name}
            </span>
            <span className="text-[11px] text-gray-500 truncate">
              {role === 'student' ? '9.º kyu · Inoue Ha' : activeInstructor.dan}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col w-full lg:pl-64 min-h-screen">
        {/* HEADER BAR */}
        <header className="sticky top-0 right-0 left-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#2A2A2A] shadow-2xs">
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
            {/* Left: Mobile trigger & App branding */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-300 hover:bg-[#1A1A1A]"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#D10000] border border-[#D4AF37]/50 flex items-center justify-center text-white font-bold text-xs shadow-xs lg:hidden">
                  當
                </div>
                <div>
                  <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight uppercase">
                    Tosei Gusoku Dojo
                  </h1>
                  <p className="text-[10px] text-gray-400 hidden sm:block">
                    Shito-Ryu Inoue Ha Karate-Do · Ciclo 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Role Switcher Buttons & Profile */}
            <div className="flex items-center gap-2">
              {/* Role Fast Switcher Pills (Desktop & Tablet) */}
              <div className="hidden sm:flex items-center bg-[#161616] p-1 rounded-xl border border-[#2A2A2A] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    role === 'student'
                      ? 'bg-[#252525] text-white shadow-2xs font-bold border border-[#D4AF37]/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    role === 'instructor'
                      ? 'bg-[#252525] text-white shadow-2xs font-bold border border-[#D4AF37]/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Instructor</span>
                  {pendingAttendanceCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    role === 'admin'
                      ? 'bg-[#252525] text-white shadow-2xs font-bold border border-[#D4AF37]/40'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Admin</span>
                  {pendingAttendanceCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Documentation shortcut */}
              <button
                type="button"
                onClick={() => handleNavigate('deliverable-docs')}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  currentRoute === 'deliverable-docs'
                    ? 'bg-[#1A1A1A] border-[#00FFFF]/60 text-[#00FFFF]'
                    : 'bg-[#161616] border-[#2A2A2A] text-gray-300 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00FFFF]" />
                <span>Entregable & Matriz</span>
              </button>

              {/* Notification icon */}
              <button
                type="button"
                aria-label="Notificaciones"
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D10000]" />
              </button>

              {/* Avatar */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]/60 shrink-0">
                <Image
                  src={
                    role === 'student'
                      ? activeStudent.avatar
                      : activeInstructor.avatar
                  }
                  alt="Avatar"
                  fill
                  sizes="32px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE DRAWER (overlay) */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-[#111111] text-[#F5F5F5] border-r border-[#2A2A2A] h-full p-4 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#D10000] border border-[#D4AF37]/60 flex items-center justify-center font-bold">
                      當
                    </div>
                    <span className="font-bold text-sm text-white">Tosei Gusoku Dojo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Role Switcher in Mobile Drawer */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                    Cambiar Rol Activo
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-[#1A1A1A] border border-[#2A2A2A] p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-1.5 text-xs font-semibold rounded cursor-pointer ${
                        role === 'student' ? 'bg-[#D10000] text-white font-bold' : 'text-gray-400'
                      }`}
                    >
                      Estudiante
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('instructor')}
                      className={`py-1.5 text-xs font-semibold rounded cursor-pointer ${
                        role === 'instructor' ? 'bg-[#D10000] text-white font-bold' : 'text-gray-400'
                      }`}
                    >
                      Sensei
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-1.5 text-xs font-semibold rounded cursor-pointer ${
                        role === 'admin' ? 'bg-[#D10000] text-white font-bold' : 'text-gray-400'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {/* Mobile Nav Links */}
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block px-1 mb-1">
                    Vistas Disponibles
                  </span>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentRoute === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-[#1A1A1A] text-white border-l-4 border-[#D10000]'
                            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-mono font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleNavigate('deliverable-docs')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold mt-2 border ${
                      currentRoute === 'deliverable-docs'
                        ? 'bg-[#1A1A1A] text-[#00FFFF] border-[#00FFFF]/50'
                        : 'text-[#00FFFF]/80 border-[#00FFFF]/20 hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <FileCheck className="w-4 h-4 text-[#00FFFF]" />
                    <span>Entregable & Matriz de Flujos</span>
                  </button>
                </div>
              </div>

              {/* Mobile Footer */}
              <div className="pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                Inoue Ha Karate-Do · Santo Domingo
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-[#2A2A2A] shadow-lg">
          <div className="h-16 flex items-center justify-around px-2">
            <button
              type="button"
              onClick={() => handleNavigate('student-dashboard')}
              className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer ${
                currentRoute === 'student-dashboard'
                  ? 'text-[#D10000] font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-1">Resumen</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('student-katas')}
              className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer ${
                currentRoute === 'student-katas'
                  ? 'text-[#D10000] font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] mt-1">Katas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('instructor');
                handleNavigate('instructor-eval');
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer ${
                role === 'instructor' && currentRoute === 'instructor-eval'
                  ? 'text-[#D10000] font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-[10px] mt-1">Instructor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('admin');
                handleNavigate('admin-curriculum');
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer ${
                role === 'admin' && currentRoute === 'admin-curriculum'
                  ? 'text-[#D10000] font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px] mt-1">Admin</span>
            </button>
          </div>
        </nav>
      </div>

      {/* TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#161616] text-[#F5F5F5] rounded-xl p-3.5 shadow-2xl border border-[#2A2A2A] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-[#D10000] shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-[#00FFFF] shrink-0 mt-0.5" />
              )}
              <div>
                <h5 className="text-xs font-bold leading-tight text-white">{toast.title}</h5>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION FOR REVERTING MASTERED KATA */}
      <ConfirmModal
        isOpen={Boolean(pendingReversion)}
        title="¿Revertir estado de kata dominada?"
        message={`Al cambiar el estado de "${pendingReversion?.kataName}" desde Dominada, se eliminará el registro oficial de aprobación y la fecha de acreditación técnica.`}
        confirmLabel="Sí, revertir estado"
        cancelLabel="Mantener aprobada"
        isDestructive={true}
        onConfirm={confirmPendingReversion}
        onCancel={cancelPendingReversion}
      />
    </div>
  );
}
