'use client';

import { CheckCircle2, CircleDot, Flame } from 'lucide-react';
import { KataStatus } from '@/types';

interface KataBadgeProps {
  status: KataStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  approvedAt?: string | null;
  className?: string;
  id?: string;
}

const statusStyles: Record<KataStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  APROBADA: { label: 'Aprobada', className: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', Icon: CheckCircle2 },
  EN_PRACTICA: { label: 'En Práctica', className: 'bg-amber-500/20 border-amber-500/40 text-amber-300', Icon: Flame },
  NO_INICIADA: { label: 'Por Iniciar', className: 'bg-neutral-800 border-neutral-700 text-neutral-300', Icon: CircleDot },
};

export function KataBadge({ status, showIcon = true, size = 'sm', className = '', id }: KataBadgeProps) {
  const { label, className: statusClassName, Icon } = statusStyles[status];
  const spacing = size === 'md' ? 'gap-1.5 px-3 py-1.5 text-xs' : 'gap-1 px-2 py-1 text-[11px]';
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span id={id} className={`inline-flex items-center rounded-md border font-semibold ${spacing} ${statusClassName} ${className}`}>
      {showIcon && <Icon className={`${iconSize} shrink-0`} />}
      {label}
    </span>
  );
}