'use client';

import React, { useState } from 'react';
import { useDojo } from '@/context/DojoContext';
import { RankCatalog } from '../dojo/RankCatalog';
import { BeltRankIndicator } from '../dojo/BeltRankIndicator';
import { KataAssignmentDialog } from '../dojo/KataAssignmentDialog';
import { ConfirmModal } from '../dojo/ConfirmModal';
import { BeltRank, Kata } from '@/types';
import {
  Award,
  Plus,
  BookmarkCheck,
  Edit2,
  Trash2,
  Clock,
  ShieldCheck,
  BookOpen,
  Users,
  MoveUp,
  MoveDown,
  Unlink,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export function AdminCurriculumView() {
  const {
    ranks,
    katas,
    requirements,
    assignKatasToRank,
    unassignKataFromRank,
    reorderKataInRank,
    students,
    showToast,
  } = useDojo();

  // Selected rank defaults to Marrón (rank-6) or first rank
  const [selectedRankId, setSelectedRankId] = useState<string>('rank-6');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [unassigningKataId, setUnassigningKataId] = useState<string | null>(null);

  const selectedRank = ranks.find((r) => r.id === selectedRankId) || ranks[0];

  // Requirements for selected rank
  const currentRequirements = requirements
    .filter((req) => req.rankId === selectedRank?.id)
    .sort((a, b) => a.requiredOrder - b.requiredOrder);

  const assignedKatas = currentRequirements
    .map((req) => ({
      req,
      kata: katas.find((k) => k.id === req.kataId),
    }))
    .filter((item): item is { req: typeof currentRequirements[0]; kata: Kata } => Boolean(item.kata));

  const assignedKataIds = assignedKatas.map((item) => item.kata.id);

  // Students in this rank
  const studentsInRank = students.filter((s) => s.currentRankId === selectedRank?.id);

  const handleSaveAssignment = (newSelectedKataIds: string[]) => {
    if (!selectedRank) return;
    assignKatasToRank(selectedRank.id, newSelectedKataIds);
    showToast(
      'Malla técnica actualizada',
      `Se vincularon ${newSelectedKataIds.length} katas a ${selectedRank.name}.`,
      'success'
    );
  };

  const handleConfirmUnassign = () => {
    if (!selectedRank || !unassigningKataId) return;
    unassignKataFromRank(selectedRank.id, unassigningKataId);
    showToast(
      'Kata desasignada',
      'La forma fue removida de los requisitos de este grado.',
      'info'
    );
    setUnassigningKataId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#D10000] tracking-wider">
            Dirección Técnica & Malla Curricular
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            GESTIÓN DE GRADOS Y KATAS
          </h2>
          <p className="text-xs text-gray-400">
            Define el syllabus técnico oficial de Shito-Ryu Inoue Ha para cada cinturón.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAssignDialogOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Asignar Katas al Grado</span>
          </button>
        </div>
      </div>

      {/* Componente Reutilizable 8: RankCatalog (Horizontal Obi strip matching Image 4) */}
      <div className="bg-[#161616] rounded-xl p-4 shadow-sm border border-[#2A2A2A]">
        <RankCatalog
          ranks={ranks}
          selectedRankId={selectedRankId}
          onSelectRank={setSelectedRankId}
        />
      </div>

      {/* Selected Rank Deep Dive Card */}
      {selectedRank && (
        <div className="bg-[#161616] rounded-xl p-5 shadow-sm border border-[#2A2A2A] space-y-5">
          {/* Rank Identification */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 border border-white/10"
                style={{ backgroundColor: selectedRank.beltColor }}
              >
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {selectedRank.name} ({selectedRank.kyuDan})
                  </h3>
                  <span className="text-xs font-bold text-gray-400 bg-[#222222] border border-[#333333] px-2 py-0.5 rounded">
                    Orden #{selectedRank.order}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedRank.japaneseName} • {selectedRank.kanji} • {selectedRank.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAssignDialogOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] text-gray-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-[#00FFFF]" />
                <span>Modificar Katas ({assignedKatas.length})</span>
              </button>
            </div>
          </div>

          {/* Metric Stats Strip (Matching Image 4) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-[#D10000]" />
                <span>Permanencia mínima</span>
              </div>
              <span className="text-base font-bold text-white">
                {selectedRank.estimatedDurationMonths > 0
                  ? `${selectedRank.estimatedDurationMonths} meses`
                  : 'Sin límite'}
              </span>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00FFFF]" />
                <span>Asistencia requerida</span>
              </div>
              <span className="text-base font-bold text-white">85% clases</span>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold mb-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Katas requeridas</span>
              </div>
              <span className="text-base font-bold text-white">
                {assignedKatas.length} formas
              </span>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold mb-1">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Karatekas en grado</span>
              </div>
              <span className="text-base font-bold text-white">
                {studentsInRank.length} alumnos
              </span>
            </div>
          </div>

          {/* Table / List of Assigned Katas */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Malla de Katas Vinculadas a este Grado ({assignedKatas.length})
              </h4>
              <button
                type="button"
                onClick={() => setIsAssignDialogOpen(true)}
                className="text-xs text-[#00FFFF] hover:underline font-semibold cursor-pointer"
              >
                + Vincular más formas
              </button>
            </div>

            {assignedKatas.length === 0 ? (
              <div className="p-8 text-center bg-[#1A1A1A] rounded-xl border border-dashed border-[#333333] space-y-2">
                <BookOpen className="w-8 h-8 text-gray-500 mx-auto" />
                <h5 className="text-sm font-bold text-white">
                  No hay katas asignadas a este grado
                </h5>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Utiliza el botón &ldquo;Asignar Katas al Grado&rdquo; para vincular los requerimientos técnicos oficiales.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAssignDialogOpen(true)}
                  className="mt-2 px-3.5 py-1.5 bg-[#D10000] hover:bg-[#B30000] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Asignar ahora
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#2A2A2A] border border-[#2A2A2A] rounded-xl overflow-hidden bg-[#161616]">
                {assignedKatas.map(({ req, kata }, idx) => (
                  <div
                    key={kata.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1A1A1A]/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center font-bold text-xs text-gray-300 shrink-0 border border-[#333333]">
                        #{req.requiredOrder || idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                            {kata.name}
                          </h5>
                          {kata.kanji && (
                            <span className="text-xs text-gray-400 font-serif">
                              {kata.kanji}
                            </span>
                          )}
                          <span className="text-[10px] bg-[#222222] border border-[#333333] text-gray-300 px-1.5 py-0.2 rounded font-semibold">
                            {kata.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {kata.description || `${kata.movementsCount} movimientos · ${kata.embusen}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      {/* Reorder buttons */}
                      <button
                        type="button"
                        onClick={() => reorderKataInRank(selectedRank.id, kata.id, 'up')}
                        disabled={idx === 0}
                        title="Mover arriba"
                        className="p-1.5 rounded-md hover:bg-[#222222] text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => reorderKataInRank(selectedRank.id, kata.id, 'down')}
                        disabled={idx === assignedKatas.length - 1}
                        title="Mover abajo"
                        className="p-1.5 rounded-md hover:bg-[#222222] text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>

                      {/* Unassign button */}
                      <button
                        type="button"
                        onClick={() => setUnassigningKataId(kata.id)}
                        title="Desasignar del grado"
                        className="p-1.5 rounded-md hover:bg-red-950/50 text-gray-400 hover:text-[#D10000] cursor-pointer ml-1 transition-colors"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Componente Reutilizable 9: KataAssignmentDialog */}
      <KataAssignmentDialog
        rank={selectedRank}
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        availableKatas={katas}
        alreadyAssignedKataIds={assignedKataIds}
        onSaveAssignment={handleSaveAssignment}
      />

      {/* Unassign Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(unassigningKataId)}
        title="¿Desasignar kata del grado?"
        message="Esta acción retirará la kata de los requisitos de examen para este cinturón. Los alumnos que ya la dominaron conservarán su registro histórico."
        confirmLabel="Sí, desasignar"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmUnassign}
        onCancel={() => setUnassigningKataId(null)}
      />
    </div>
  );
}
