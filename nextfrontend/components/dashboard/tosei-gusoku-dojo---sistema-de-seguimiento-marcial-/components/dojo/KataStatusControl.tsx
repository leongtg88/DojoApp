'use client';

import React, { useState } from 'react';
import { KataStatus } from '@/types';
import { Clock, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';

interface KataStatusControlProps {
  currentStatus: KataStatus;
  kataId: string;
  kataName: string;
  onStatusSelect: (newStatus: KataStatus) => Promise<unknown> | void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function KataStatusControl({
  currentStatus,
  onStatusSelect,
  disabled = false,
  className = '',
  id,
}: KataStatusControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSelect = async (status: KataStatus) => {
    if (status === currentStatus || disabled || isUpdating) return;
    setIsUpdating(true);
    try {
      await onStatusSelect(status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      id={id}
      className={`inline-flex items-center rounded-lg bg-[#111111] p-1 border border-[#2A2A2A] ${className}`}
    >
      {/* 1. Por practicar */}
      <button
        type="button"
        disabled={disabled || isUpdating}
        onClick={() => handleSelect('POR_PRACTICAR')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
          currentStatus === 'POR_PRACTICAR'
            ? 'bg-[#222222] text-gray-200 shadow-sm border border-[#3A3A3A]'
            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
        }`}
      >
        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
        <span>Por practicar</span>
      </button>

      {/* 2. En progreso */}
      <button
        type="button"
        disabled={disabled || isUpdating}
        onClick={() => handleSelect('EN_PROGRESO')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
          currentStatus === 'EN_PROGRESO'
            ? 'bg-blue-950/50 text-blue-300 shadow-sm border border-blue-700/50'
            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
        }`}
      >
        <RefreshCw className="w-3 h-3 text-blue-400 shrink-0" />
        <span>En progreso</span>
      </button>

      {/* 3. Dominada */}
      <button
        type="button"
        disabled={disabled || isUpdating}
        onClick={() => handleSelect('DOMINADA')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
          currentStatus === 'DOMINADA'
            ? 'bg-green-950/50 text-green-300 shadow-sm border border-green-700/50 font-bold'
            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
        }`}
      >
        {isUpdating ? (
          <Loader2 className="w-3 h-3 text-green-400 animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
        )}
        <span>Dominada</span>
      </button>
    </div>
  );
}
