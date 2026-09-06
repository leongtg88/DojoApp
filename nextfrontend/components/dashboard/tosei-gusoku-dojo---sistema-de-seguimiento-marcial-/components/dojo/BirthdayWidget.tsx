'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useDojo } from '@/context/DojoContext';
import { Cake, Calendar, Sparkles, Heart } from 'lucide-react';

interface BirthdayWidgetProps {
  compact?: boolean;
}

export function BirthdayWidget({ compact = false }: BirthdayWidgetProps) {
  const { todayBirthdays, upcomingBirthdays, showToast } = useDojo();
  const [congratulatedIds, setCongratulatedIds] = useState<Record<string, boolean>>({});

  const handleCongratulate = (id: string, name: string) => {
    setCongratulatedIds((prev) => ({ ...prev, [id]: true }));
    showToast('¡Felicitación enviada!', `Has enviado tus saludos de cumpleaños a ${name} en el tatami. 🥋🎉`, 'success');
  };

  const hasToday = todayBirthdays.length > 0;
  const hasUpcoming = upcomingBirthdays.length > 0;

  if (!hasToday && !hasUpcoming) {
    return null;
  }

  return (
    <section aria-labelledby="birthday-widget-heading" className="space-y-3">
      {/* Cumpleaños de HOY */}
      {hasToday && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-neutral-900/50 p-4 sm:p-5 shadow-lg shadow-amber-950/20">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Cake className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <h3 id="birthday-widget-heading" className="text-sm font-semibold tracking-wide text-amber-200 uppercase flex items-center gap-1.5">
                <span>¡Cumpleaños Hoy en el Dojo!</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-xs text-amber-300/80">La familia Tosei-Gusoku celebra a sus integrantes</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {todayBirthdays.map((person) => {
              const isCongratulated = congratulatedIds[person.id];
              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between gap-3 bg-neutral-900/80 border border-amber-500/30 rounded-lg p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400 shrink-0">
                      <Image
                        src={person.avatar}
                        alt={person.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">{person.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                          {person.turningAge} años
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/70 truncate">{person.detail}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCongratulate(person.id, person.name)}
                    disabled={isCongratulated}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isCongratulated
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-sm active:scale-95'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isCongratulated ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>{isCongratulated ? '¡Felicitado!' : 'Felicitar'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximos Cumpleaños */}
      {!compact && hasUpcoming && (
        <div className="rounded-xl border border-neutral-800 bg-[#14181f]/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Próximos Cumpleaños ({upcomingBirthdays.length})
              </h4>
            </div>
            <span className="text-[11px] text-gray-400">Próximos 60 días</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingBirthdays.slice(0, 3).map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-900/50 hover:border-neutral-700 transition-colors"
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-neutral-700 shrink-0">
                  <Image
                    src={person.avatar}
                    alt={person.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-gray-200 truncate">{person.name}</p>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded shrink-0">
                      en {person.daysUntil}d
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">
                    {person.formattedDate} • Cumple {person.turningAge}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
