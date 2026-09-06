'use client';

import React from 'react';
import { BeltRank } from '@/types';
import { BeltRankIndicator } from './BeltRankIndicator';
import { CheckCircle2, Plus, Edit2, Trash2 } from 'lucide-react';

interface RankCatalogProps {
  ranks: BeltRank[];
  selectedRankId: string;
  onSelectRank: (rankId: string) => void;
  onEditRank?: (rank: BeltRank) => void;
  onDeleteRank?: (rankId: string) => void;
  onAddRank?: () => void;
  className?: string;
  id?: string;
}

export function RankCatalog({
  ranks,
  selectedRankId,
  onSelectRank,
  onEditRank,
  onDeleteRank,
  onAddRank,
  className = '',
  id,
}: RankCatalogProps) {
  const sortedRanks = [...ranks].sort((a, b) => a.order - b.order);

  return (
    <div id={id} className={`space-y-2 ${className}`}>
      {/* Top indicator strip */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Escalafón Oficial de Cinturones
          </span>
          <span className="text-xs text-gray-500">
            ({sortedRanks.length} Grados configurados)
          </span>
        </div>
        {onAddRank && (
          <button
            type="button"
            onClick={onAddRank}
            className="text-xs font-semibold text-[#00FFFF] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Grado</span>
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Obi Strip */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none select-none">
        {sortedRanks.map((rank) => {
          const isSelected = rank.id === selectedRankId;

          return (
            <div
              key={rank.id}
              className={`shrink-0 w-48 p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#1E1E1E] shadow-md border-[#D10000] ring-1 ring-[#D10000]/30'
                  : 'bg-[#161616] hover:bg-[#1A1A1A] border-[#2A2A2A] shadow-xs opacity-90 hover:opacity-100'
              }`}
              onClick={() => onSelectRank(rank.id)}
            >
              {/* Belt representation and Kyu number */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BeltRankIndicator rank={rank} size="sm" />
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-[#D10000]' : 'text-gray-400'
                    }`}
                  >
                    {rank.kyuDan}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[#D10000] shrink-0" />
                )}
              </div>

              {/* Title & subtitle */}
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">
                    {rank.name.replace('Cinturón ', '')}
                  </h4>
                  {isSelected && (
                    <span className="text-[10px] bg-red-950/60 text-[#D10000] border border-red-900/40 px-1.5 py-0.2 rounded font-semibold">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1 truncate">
                  {rank.estimatedDurationMonths > 0
                    ? `${rank.estimatedDurationMonths}m · `
                    : '0m · '}
                  {rank.isMaximumRank ? 'Shodan Budo' : rank.japaneseName || 'Iniciación'}
                </p>
              </div>

              {/* Actions for admin */}
              {(onEditRank || onDeleteRank) && (
                <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-[#2A2A2A]">
                  {onEditRank && (
                    <button
                      type="button"
                      title="Editar grado"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRank(rank);
                      }}
                      className="p-1 rounded hover:bg-[#222222] text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {onDeleteRank && !rank.isMaximumRank && (
                    <button
                      type="button"
                      title="Eliminar grado"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRank(rank.id);
                      }}
                      className="p-1 rounded hover:bg-red-950/50 text-gray-400 hover:text-[#D10000] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
