'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const DojoApp = dynamic(() => import('@/components/dojo/DojoApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 font-mono text-sm tracking-wider">Cargando Dojo Tosei-Gusoku...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  return <DojoApp />;
}

