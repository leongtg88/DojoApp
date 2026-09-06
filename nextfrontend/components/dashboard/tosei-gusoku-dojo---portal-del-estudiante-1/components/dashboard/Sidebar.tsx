'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Award,
  Calendar,
  LogOut,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { mockStudentProfile, mockBeltRank } from '@/data/mock-data';

interface SidebarProps {
  onLogoutClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogoutClick }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Resumen',
      href: '/dashboard/estudiante',
      icon: LayoutDashboard,
      active: pathname === '/dashboard/estudiante',
    },
    {
      label: 'Mis datos',
      href: '/dashboard/estudiante/datos',
      icon: User,
      active: pathname.startsWith('/dashboard/estudiante/datos'),
    },
    {
      label: 'Mi grado',
      href: '/dashboard/estudiante/grado',
      icon: Award,
      active: pathname.startsWith('/dashboard/estudiante/grado'),
    },
    {
      label: 'Horario',
      href: '/dashboard/estudiante/horario',
      icon: Calendar,
      active: pathname.startsWith('/dashboard/estudiante/horario'),
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FFFFFF] border-r border-[#E5E2E1] min-h-[calc(100vh-4rem)] p-5 justify-between shrink-0 select-none">
      <div className="flex flex-col gap-6">
        {/* Student Badge Card */}
        <div className="p-3.5 rounded-xl bg-[#F6F3F2] border border-[#E5E2E1]/80 flex items-center gap-3 shadow-sm">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#B70011] text-white flex items-center justify-center font-display font-extrabold text-sm shadow-sm">
              AS
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#1C1B1B] truncate">
              {mockStudentProfile.fullName}
            </span>
            <span className="text-[11px] font-semibold text-[#666028]">
              {mockBeltRank.currentRankName} • {mockBeltRank.currentRankBeltColor}
            </span>
            <span className="text-[10px] text-[#5C403C]/80 truncate">
              {mockStudentProfile.branch}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#5C403C]/70 uppercase tracking-widest px-3 mb-1">
            Portal Estudiante
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  item.active
                    ? 'bg-[#DC2626] text-white shadow-sm'
                    : 'text-[#5C403C] hover:text-[#1C1B1B] hover:bg-[#F6F3F2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.active && (
                  <ChevronRight className="w-4 h-4 opacity-80" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Dojo Martial Oath Snippet */}
        <div className="p-3.5 rounded-xl bg-[#F0EDEC]/70 border border-[#E5E2E1] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666028]">
              Dojo Kun • 常在戦場
            </span>
            <span className="text-[10px] font-extrabold text-[#DC2626]">
              3er Kyu
            </span>
          </div>
          <p className="text-[11px] text-[#5C403C] leading-snug">
            La constancia forja el espíritu del cinturón negro.
          </p>
        </div>
      </div>

      {/* Bottom Session Logout */}
      <div className="pt-4 border-t border-[#E5E2E1]">
        <button
          type="button"
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-[#5C403C] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
