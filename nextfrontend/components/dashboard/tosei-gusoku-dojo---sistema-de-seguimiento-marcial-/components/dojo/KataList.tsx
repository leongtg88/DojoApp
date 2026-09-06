'use client';

import React, { useState, useMemo } from 'react';
import { KataProgressItem } from '@/context/DojoContext';
import { KataBadge } from './KataBadge';
import { KataStatusControl } from './KataStatusControl';
import { ExamRubricModal } from './ExamRubricModal';
import { Kata, KataStatus } from '@/types';
import {
  FileText,
  Search,
  MessageSquare,
  History,
  Trash2,
  Unlink,
  Edit2,
  MoveUp,
  MoveDown,
  Layers,
  Inbox,
} from 'lucide-react';

interface KataListProps {
  items: KataProgressItem[];
  mode?: 'student' | 'instructor' | 'admin';
  onStatusChange?: (kataId: string, newStatus: KataStatus) => Promise<unknown> | void;
  onEditKata?: (kata: Kata) => void;
  onUnassignKata?: (kataId: string) => void;
  onReorder?: (kataId: string, direction: 'up' | 'down') => void;
  showFilters?: boolean;
  emptyMessage?: string;
  className?: string;
  id?: string;
}

export function KataList({
  items,
  mode = 'student',
  onStatusChange,
  onEditKata,
  onUnassignKata,
  onReorder,
  showFilters = true,
  emptyMessage,
  className = '',
  id,
}: KataListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'progress' | 'mastered'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRubricKata, setSelectedRubricKata] = useState<Kata | null>(null);

  // Counts
  const counts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((i) => i.status === 'POR_PRACTICAR').length,
      progress: items.filter((i) => i.status === 'EN_PROGRESO').length,
      mastered: items.filter((i) => i.status === 'DOMINADA').length,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by status
      if (filter === 'pending' && item.status !== 'POR_PRACTICAR') return false;
      if (filter === 'progress' && item.status !== 'EN_PROGRESO') return false;
      if (filter === 'mastered' && item.status !== 'DOMINADA') return false;

      // Filter by search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.kata.name.toLowerCase().includes(term);
        const matchDesc = item.kata.description?.toLowerCase().includes(term) || false;
        const matchKanji = item.kata.kanji?.toLowerCase().includes(term) || false;
        return matchName || matchDesc || matchKanji;
      }
      return true;
    });
  }, [items, filter, searchTerm]);

  return (
    <div id={id} className={`space-y-3 ${className}`}>
      {/* Search & Filter Bar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                filter === 'all'
                  ? 'bg-[#252525] text-white border-[#3A3A3A] shadow-xs'
                  : 'bg-[#161616] text-gray-400 border-[#2A2A2A] hover:bg-[#1E1E1E] hover:text-white'
              }`}
            >
              <span>Todas</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filter === 'all' ? 'bg-white/20 text-white' : 'bg-[#111111] text-gray-400'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                filter === 'pending'
                  ? 'bg-[#252525] text-white border-[#3A3A3A] shadow-xs'
                  : 'bg-[#161616] text-gray-400 border-[#2A2A2A] hover:bg-[#1E1E1E] hover:text-white'
              }`}
            >
              <span>Por practicar</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-950/50 text-amber-400 border border-amber-800/40">
                {counts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                filter === 'progress'
                  ? 'bg-[#252525] text-white border-[#3A3A3A] shadow-xs'
                  : 'bg-[#161616] text-gray-400 border-[#2A2A2A] hover:bg-[#1E1E1E] hover:text-white'
              }`}
            >
              <span>En progreso</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-950/50 text-blue-400 border border-blue-800/40">
                {counts.progress}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('mastered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                filter === 'mastered'
                  ? 'bg-[#252525] text-white border-[#3A3A3A] shadow-xs'
                  : 'bg-[#161616] text-gray-400 border-[#2A2A2A] hover:bg-[#1E1E1E] hover:text-white'
              }`}
            >
              <span>Dominadas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-green-950/50 text-green-400 border border-green-800/40">
                {counts.mastered}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-[#2A2A2A] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F5F5] placeholder:text-gray-500 focus:outline-none focus:border-[#00FFFF]"
            />
          </div>
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#161616] rounded-xl p-8 text-center border border-[#2A2A2A] shadow-lg space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center mx-auto text-gray-500">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-200">
            {emptyMessage || 'No se encontraron katas con este filtro'}
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Prueba seleccionando otra pestaña de estado o limpiando el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item, idx) => (
            <div
              key={item.kata.id}
              className="bg-[#161616] p-4 rounded-xl shadow-lg border border-[#2A2A2A] hover:border-[#383838] transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-xs font-bold text-gray-300 shrink-0 border border-[#2A2A2A]">
                    #{item.requirement.requiredOrder || idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white truncate">
                        {item.kata.name}
                      </h4>
                      {item.kata.kanji && (
                        <span className="text-xs text-gray-400 font-serif">
                          {item.kata.kanji}
                        </span>
                      )}
                      <KataBadge
                        status={item.status}
                        approvedAt={item.approvedAt}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {item.kata.description || 'Kata oficial Inoue Ha Shito-Ryu.'}
                    </p>
                  </div>
                </div>

                {/* Right controls based on mode */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Mode: Student */}
                  {mode === 'student' && (
                    <button
                      type="button"
                      onClick={() => setSelectedRubricKata(item.kata)}
                      className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-gray-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span>Ver pautas de examen</span>
                    </button>
                  )}

                  {/* Mode: Instructor */}
                  {mode === 'instructor' && onStatusChange && (
                    <KataStatusControl
                      currentStatus={item.status}
                      kataId={item.kata.id}
                      kataName={item.kata.name}
                      onStatusSelect={(status) => onStatusChange(item.kata.id, status)}
                    />
                  )}

                  {/* Mode: Admin */}
                  {mode === 'admin' && (
                    <div className="flex items-center gap-1">
                      {onReorder && (
                        <>
                          <button
                            type="button"
                            onClick={() => onReorder(item.kata.id, 'up')}
                            title="Subir orden"
                            className="p-1.5 rounded hover:bg-[#222222] text-gray-400 hover:text-white cursor-pointer"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReorder(item.kata.id, 'down')}
                            title="Bajar orden"
                            className="p-1.5 rounded hover:bg-[#222222] text-gray-400 hover:text-white cursor-pointer"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {onEditKata && (
                        <button
                          type="button"
                          onClick={() => onEditKata(item.kata)}
                          title="Editar Kata"
                          className="p-1.5 rounded hover:bg-[#222222] text-gray-400 hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onUnassignKata && (
                        <button
                          type="button"
                          onClick={() => onUnassignKata(item.kata.id)}
                          title="Desasignar del grado"
                          className="p-1.5 rounded hover:bg-red-950/40 text-red-400 cursor-pointer"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sensei Observation / Feedback Note */}
              {item.notes && (
                <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-[#2A2A2A] flex items-start gap-2 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 text-[#D10000] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[#D10000] uppercase text-[10px]">
                      Observación del Sensei
                    </span>
                    <p className="text-gray-300 italic mt-0.5">&ldquo;{item.notes}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Metadata strip */}
              <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1 border-t border-[#222222]">
                <span>{item.kata.movementsCount} movimientos</span>
                <span>•</span>
                <span>{item.kata.embusen || 'Línea de tatami'}</span>
                <span>•</span>
                <span className="capitalize">{item.kata.category}</span>
                {item.approvedAt && (
                  <>
                    <span>•</span>
                    <span className="text-green-400 font-medium flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Evaluada el {new Date(item.approvedAt).toLocaleDateString('es-DO')}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rubric Examination Modal */}
      <ExamRubricModal
        kata={selectedRubricKata}
        isOpen={Boolean(selectedRubricKata)}
        onClose={() => setSelectedRubricKata(null)}
      />
    </div>
  );
}
