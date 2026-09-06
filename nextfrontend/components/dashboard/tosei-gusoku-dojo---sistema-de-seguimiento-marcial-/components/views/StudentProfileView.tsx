'use client';

import React from 'react';
import { useDojo } from '@/context/DojoContext';
import { BeltRankIndicator } from '../dojo/BeltRankIndicator';
import { User, Phone, Mail, MapPin, Award, Calendar, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export function StudentProfileView() {
  const { activeStudent, activeStudentProgress } = useDojo();

  return (
    <div className="space-y-5 animate-in fade-in max-w-3xl">
      <div>
        <span className="text-[10px] uppercase font-bold text-[#D10000] tracking-wider">
          Expediente del Alumno
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          MIS DATOS DEL DOJO
        </h2>
        <p className="text-xs text-gray-400">
          Información registrada en la secretaría del dojo Tosei Gusoku.
        </p>
      </div>

      <div className="bg-[#161616] rounded-xl p-6 shadow-sm border border-[#2A2A2A] space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#2A2A2A] shrink-0">
            <Image
              src={activeStudent.avatar}
              alt={activeStudent.name}
              fill
              sizes="64px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{activeStudent.name}</h3>
            <p className="text-xs text-gray-400 font-mono">
              Matrícula: {activeStudent.matricula} • Ingreso: {activeStudent.enrollmentDate || activeStudent.joinedDojo}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <BeltRankIndicator rank={activeStudentProgress.currentRank} size="sm" />
              <span className="text-xs font-semibold text-gray-300">
                {activeStudentProgress.currentRank?.name} ({activeStudentProgress.currentRank?.kyuDan})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#2A2A2A] text-xs">
          <div className="space-y-1">
            <span className="text-gray-500 font-bold uppercase text-[10px]">Teléfono de contacto</span>
            <p className="text-gray-200 font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-500" />
              {activeStudent.phone}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-gray-500 font-bold uppercase text-[10px]">Correo electrónico</span>
            <p className="text-gray-200 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-500" />
              {activeStudent.email || 'sofia.martinez@dojo.com'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-gray-500 font-bold uppercase text-[10px]">Sede de entrenamiento</span>
            <p className="text-gray-200 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              {activeStudent.location}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-gray-500 font-bold uppercase text-[10px]">Sensei Tutor</span>
            <p className="text-gray-200 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
              Sensei Roberto Castillo (4.º Dan)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
