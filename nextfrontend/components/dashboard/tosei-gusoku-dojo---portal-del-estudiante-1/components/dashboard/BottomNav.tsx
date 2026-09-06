'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Award, Calendar } from 'lucide-react';

export const BottomNav: React.FC = () => {
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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCF9F8]/95 backdrop-blur-xl border-t border-[#E5E2E1] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navegación móvil principal"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[4rem] h-14 transition-colors ${
                item.active
                  ? 'text-[#DC2626] font-bold'
                  : 'text-[#5C403C] hover:text-[#1C1B1B]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
