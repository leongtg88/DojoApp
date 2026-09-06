'use client';

import React, { useState } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { LogOut, X, AlertCircle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCF9F8] flex flex-col antialiased">
      {/* Top Header */}
      <Header onLogoutClick={() => setShowLogoutModal(true)} />

      {/* Main Container with Sidebar and Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1B1B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#E5E2E1] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E2E1] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#DC2626] rounded-sm" />
                <h3 className="font-display text-base font-bold text-[#1C1B1B]">
                  Cerrar Sesión
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="text-[#5C403C] hover:text-[#1C1B1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C403C] leading-relaxed">
              ¿Deseas cerrar tu sesión activa en el portal de estudiantes de Tosei Gusoku Dojo? Tendrás que volver a ingresar tus credenciales para acceder a tus registros de tatami.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-[#F0EDEC] hover:bg-[#E5E2E1] text-[#1C1B1B] text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  alert('Sesión cerrada con éxito. Regresando al portal de bienvenida.');
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B70011] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
