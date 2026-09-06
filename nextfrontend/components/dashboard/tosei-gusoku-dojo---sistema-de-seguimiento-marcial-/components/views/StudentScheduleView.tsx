'use client';

import React from 'react';
import { useDojo } from '@/context/DojoContext';
import { StudentAttendancePunch } from '../dojo/StudentAttendancePunch';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export function StudentScheduleView() {
  const { activeStudent } = useDojo();

  const sessions = [
    {
      day: 'Martes',
      time: '5:00 p. m. - 6:00 p. m.',
      type: 'Kihon & Katas Básicas',
      sensei: 'Sensei Roberto Castillo (4.º Dan)',
      tatami: 'Tatami Principal #1',
      status: 'Confirmada',
    },
    {
      day: 'Jueves',
      time: '5:00 p. m. - 6:00 p. m.',
      type: 'Bunkai & Perfeccionamiento de Grado',
      sensei: 'Sensei Roberto Castillo (4.º Dan)',
      tatami: 'Tatami Principal #1',
      status: 'Próxima sesión',
    },
    {
      day: 'Sábado',
      time: '10:00 a. m. - 11:30 a. m.',
      type: 'Kumite Deportivo & Acondicionamiento',
      sensei: 'Sensei Kenji Sato (1.º Dan)',
      tatami: 'Dojo Central Inoue Ha',
      status: 'Opcional libre',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div>
        <span className="text-[10px] uppercase font-bold text-[#D10000] tracking-wider">
          Horario de Clases Semanal
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          MI HORARIO Y ASISTENCIAS
        </h2>
        <p className="text-xs text-gray-400">
          Sede: {activeStudent.location} • Horario regular del grupo infantil/juvenil
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessions.map((session, i) => (
          <div
            key={i}
            className="p-4 bg-[#161616] rounded-xl border border-[#2A2A2A] shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#D10000] bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
                {session.day}
              </span>
              <span className="text-[11px] font-semibold text-gray-400">
                {session.status}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{session.type}</h4>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                {session.time}
              </p>
            </div>
            <div className="pt-2 border-t border-[#2A2A2A] text-xs text-gray-400 space-y-1">
              <p className="text-[11px] text-gray-300">{session.sensei}</p>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {session.tatami}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Módulo Interactivo de Asistencia */}
      <div className="pt-2">
        <StudentAttendancePunch />
      </div>
    </div>
  );
}
