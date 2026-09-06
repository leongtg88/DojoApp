'use client';

import React, { useState, useMemo } from 'react';
import { Kata, BeltRank } from '@/types';
import { Search, X, CheckSquare, BookmarkCheck, Check } from 'lucide-react';

interface KataAssignmentDialogProps {
  rank: BeltRank | null;
  isOpen: boolean;
  onClose: () => void;
  availableKatas: Kata[];
  alreadyAssignedKataIds: string[];
  onSaveAssignment: (selectedKataIds: string[]) => void;
}

export function KataAssignmentDialog(props: KataAssignmentDialogProps) {
  if (!props.isOpen || !props.rank) return null;
  return <KataAssignmentDialogContent {...props} rank={props.rank} />;
}

interface KataAssignmentDialogContentProps extends Omit<KataAssignmentDialogProps, 'rank'> {
  rank: BeltRank;
}

function KataAssignmentDialogContent({
  rank,
  onClose,
  availableKatas,
  alreadyAssignedKataIds,
  onSaveAssignment,
}: KataAssignmentDialogContentProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(alreadyAssignedKataIds);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredKatas = useMemo(() => {
    if (!searchTerm.trim()) return availableKatas;
    const term = searchTerm.toLowerCase();
    return availableKatas.filter(
      (k) =>
        k.name.toLowerCase().includes(term) ||
        k.description?.toLowerCase().includes(term) ||
        k.kanji?.toLowerCase().includes(term) ||
        k.category.toLowerCase().includes(term)
    );
  }, [availableKatas, searchTerm]);

  const toggleKata = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearAll = () => setSelectedIds([]);

  const handleSave = () => {
    onSaveAssignment(selectedIds);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#161616] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-[#2A2A2A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#111111] border-b border-[#2A2A2A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/50 text-[#D10000] flex items-center justify-center border border-red-900/50">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Asignar Katas al Grado
              </h3>
              <p className="text-xs text-gray-400">
                Destino: {rank.name} ({rank.kyuDan})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Counter */}
        <div className="p-4 flex flex-col gap-2.5 border-b border-[#222222] shrink-0">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar kata por nombre, linaje o kanji..."
              className="w-full pl-9 pr-4 py-2 bg-[#111111] border border-[#2A2A2A] rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FFFF]"
            />
          </div>
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="text-[#00FFFF] font-bold">
              {selectedIds.length} katas seleccionadas de {availableKatas.length} disponibles
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-400 hover:text-white underline text-[11px] cursor-pointer"
              >
                Limpiar selección
              </button>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {filteredKatas.map((kata) => {
            const isChecked = selectedIds.includes(kata.id);

            return (
              <label
                key={kata.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-[#1E1E1E] border-[#00FFFF]/60 shadow-xs'
                    : 'bg-[#161616] hover:bg-[#1A1A1A] border-[#2A2A2A]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleKata(kata.id)}
                    className="w-4 h-4 rounded accent-[#00FFFF] cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {kata.name}
                      </span>
                      {kata.kanji && (
                        <span className="text-[11px] text-gray-400 font-serif">
                          {kata.kanji}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {kata.description || `${kata.movementsCount} movimientos`}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ml-2 border ${
                    kata.category === 'Básico'
                      ? 'bg-[#222222] text-gray-300 border-[#333333]'
                      : kata.category === 'Intermedio'
                      ? 'bg-blue-950/40 text-blue-400 border-blue-900/40'
                      : kata.category === 'Avanzado'
                      ? 'bg-amber-950/40 text-[#D4AF37] border-amber-900/40'
                      : 'bg-purple-950/40 text-purple-400 border-purple-900/40'
                  }`}
                >
                  {kata.category}
                </span>
              </label>
            );
          })}

          {filteredKatas.length === 0 && (
            <div className="p-6 text-center text-xs text-gray-500">
              No se encontraron katas que coincidan con la búsqueda.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 bg-[#111111] border-t border-[#2A2A2A] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#222222] border border-[#333333] text-gray-300 hover:bg-[#2A2A2A] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar asignación</span>
          </button>
        </div>
      </div>
    </div>
  );
}
