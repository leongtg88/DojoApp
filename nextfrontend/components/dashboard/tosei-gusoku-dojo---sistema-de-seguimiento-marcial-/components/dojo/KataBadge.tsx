'use client';

import React from 'react';
import { KataStatus } from '@/types';
import { Clock, RefreshCw, CheckCircle2 } from 'lucide-react';

interface KataBadgeProps {
  status: KataStatus;
  approvedAt?: string | null;
  approvedByName?: string | null;
  className?: string;
  id?: string;
}

export function KataBadge({
  status,
  approvedAt,
  className = '',
  id,
}: KataBadgeProps) {
  const formattedDate = approvedAt
    ? new Date(approvedAt).toLocaleDateString('es-DO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  if (status === 'DOMINADA') {
    return (
      <span
        id={id}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-900/30 text-green-400 border border-green-700/50 font-semibold text-xs transition-colors ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
        <span>Dominada</span>
        {formattedDate && (
          <span className="text-[11px] font-normal text-green-300/80 ml-0.5">
            · {formattedDate}
          </span>
        )}
      </span>
    );
  }

  if (status === 'EN_PROGRESO') {
    return (
      <span
        id={id}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-900/30 text-blue-400 border border-blue-700/50 font-semibold text-xs transition-colors ${className}`}
      >
        <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-spin-slow" />
        <span>En progreso</span>
      </span>
    );
  }

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] font-semibold text-xs transition-colors ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <span>Por practicar</span>
    </span>
  );
}
