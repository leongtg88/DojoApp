'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, MessageSquare, Search, Timer } from 'lucide-react';
import { Kata, KataStatus, StudentKataProgress } from '@/types';
import { KataBadge } from './KataBadge';
import { kataDifficulty } from './studentKataModule';

type StatusFilter = 'ALL' | KataStatus;

interface KataListProps {
  katas?: Kata[];
  progress?: StudentKataProgress[];
  requiredKataIds?: string[];
  onStartPractice?: (kataId: string) => void;
  onSaveNote?: (kataId: string, note: string) => void;
  className?: string;
}

export function KataList({ katas = [], progress = [], requiredKataIds = [], onStartPractice, onSaveNote, className = '' }: KataListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showRequired, setShowRequired] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const progressByKata = useMemo(() => new Map(progress.map((item) => [item.kataId, item])), [progress]);
  const visibleKatas = useMemo(() => katas.filter((kata) => {
    const item = progressByKata.get(kata.id);
    const status = item?.status ?? 'NO_INICIADA';
    const matchesSearch = `${kata.name} ${kata.japaneseName ?? ''}`.toLowerCase().includes(search.toLowerCase().trim());
    return matchesSearch && (statusFilter === 'ALL' || status === statusFilter) && (showRequired === requiredKataIds.includes(kata.id));
  }), [katas, progressByKata, requiredKataIds, search, showRequired, statusFilter]);
  const filters: Array<{ value: StatusFilter; label: string }> = [{ value: 'ALL', label: 'Todas' }, { value: 'APROBADA', label: 'Aprobadas' }, { value: 'EN_PRACTICA', label: 'En práctica' }, { value: 'NO_INICIADA', label: 'Por iniciar' }];

  return <section className={`space-y-4 ${className}`}>
    <div className="space-y-3 rounded-lg border border-neutral-800 bg-[#161b22] p-3">
      <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar Pinan Nidan, Bassai Dai, Seienchin..." className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" /></label>
      <div className="flex flex-wrap gap-2">{filters.map((filter) => <button key={filter.value} type="button" onClick={() => setStatusFilter(filter.value)} className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${statusFilter === filter.value ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-200' : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white'}`}>{filter.label}</button>)}</div>
      <div className="inline-flex rounded-md border border-neutral-700 bg-[#0d1117] p-1 text-xs"><button type="button" onClick={() => setShowRequired(true)} className={`rounded px-2.5 py-1.5 ${showRequired ? 'bg-emerald-500/20 text-emerald-200' : 'text-neutral-400'}`}>Requeridas para mi grado</button><button type="button" onClick={() => setShowRequired(false)} className={`rounded px-2.5 py-1.5 ${!showRequired ? 'bg-cyan-500/20 text-cyan-200' : 'text-neutral-400'}`}>Adicionales / asignadas</button></div>
    </div>
    {visibleKatas.length === 0 ? <div className="rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-6 py-12 text-center text-sm text-neutral-400">No hay katas que coincidan con los filtros seleccionados.</div> : <div className="space-y-3">{visibleKatas.map((kata) => {
      const item = progressByKata.get(kata.id); const status = item?.status ?? 'NO_INICIADA'; const isExpanded = expandedId === kata.id;
      return <article key={kata.id} className="rounded-lg border border-neutral-800 bg-[#161b22] p-4 hover:border-neutral-700"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{kata.name}</h3><KataBadge status={status} /></div><p className="mt-1 font-serif text-sm text-neutral-400">{kata.japaneseName ?? 'Nombre japonés pendiente'}</p></div><button type="button" onClick={() => { setExpandedId(isExpanded ? null : kata.id); setNote(item?.lastFeedback ?? ''); }} className="inline-flex items-center gap-1 self-start text-xs font-semibold text-cyan-300 hover:text-cyan-100">Detalles {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400"><span>{kataDifficulty(kata)}</span><span>{kata.movementsCount} movimientos</span><span>{kata.embusen ?? 'Embusen por definir'}</span><span>{kata.rankName ?? 'Programa del dojo'}</span><span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5 text-amber-400" />{item?.practiceHours ?? 0} h de práctica</span></div>{isExpanded && <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4"><p className="text-sm leading-6 text-neutral-300">{kata.description}</p>{item?.score !== undefined && <p className="text-sm text-emerald-300">Evaluación del sensei: {item.score.toFixed(1)} / 10</p>}{item?.lastFeedback && <p className="flex gap-2 rounded-md border border-cyan-900/50 bg-cyan-950/20 p-3 text-xs text-cyan-100"><MessageSquare className="h-4 w-4 shrink-0 text-cyan-400" />{item.lastFeedback}</p>}{status === 'NO_INICIADA' && <button type="button" onClick={() => onStartPractice?.(kata.id)} className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-bold text-[#0d1117] hover:bg-amber-400"><Clock className="h-4 w-4" />Comenzar práctica</button>}<div className="flex flex-col gap-2 sm:flex-row"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota personal de práctica" className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-xs text-white outline-none focus:border-cyan-500" /><button type="button" onClick={() => onSaveNote?.(kata.id, note)} className="rounded-md border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10">Guardar nota</button></div></div>}</article>;
    })}</div>}
  </section>;
}