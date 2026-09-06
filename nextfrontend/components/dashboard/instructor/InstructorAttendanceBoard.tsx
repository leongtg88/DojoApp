'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award,
  Calendar,
  CheckCircle2,
  CheckCheck,
  Clock,
  Flame,
  Hourglass,
  Pencil,
  Save,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import type { AttendanceRecord, InstructorAttendanceBoardData } from '@/types/dashboard'

interface InstructorAttendanceBoardProps {
    data: InstructorAttendanceBoardData
}

const SESSION_LABELS: Record<string, string> = {
    class: 'Clase regular',
    private: 'Clase privada',
    autonomous: 'Entrenamiento libre',
    seminar: 'Seminario / Especial',
    other: 'Otro',
}

function sessionLabel(sessionType: string | null): string {
    return SESSION_LABELS[sessionType ?? ''] ?? sessionType ?? 'Clase'
}

export function InstructorAttendanceBoard({ data }: InstructorAttendanceBoardProps) {
    const router = useRouter()
    const todayStr = new Date().toISOString().slice(0, 10)

    const [dateFilter, setDateFilter] = useState('TODAS')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL')
    const [rejectRecordId, setRejectRecordId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
    const [editHours, setEditHours] = useState(1.5)
    const [editSessionType, setEditSessionType] = useState('class')
    const [editNotes, setEditNotes] = useState('')
    const [busy, setBusy] = useState(false)

    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
    const pendingRecords = data.records.filter((record) => record.status === 'PENDING')

    const filteredRecords = data.records.filter((record) => {
        const recordDate = record.date.slice(0, 10)
        if (dateFilter === 'HOY' && recordDate !== todayStr) return false
        if (dateFilter !== 'TODAS' && dateFilter !== 'HOY' && recordDate !== dateFilter) return false
        if (statusFilter !== 'ALL' && record.status !== statusFilter) return false
        return true
    })

    const pendingForFilter = filteredRecords.filter((record) => record.status === 'PENDING').length
    const confirmedCount = data.records.filter((record) => record.status === 'CONFIRMED').length

    async function mutate(url: string, options?: RequestInit) {
        setBusy(true)
        const response = await fetch(url, options)
        setBusy(false)

        if (response.ok) {
            router.refresh()
        } else {
            const { error } = await response.json().catch(() => ({ error: 'No fue posible completar la acción' }))
            alert(error ?? 'No fue posible completar la acción')
        }
    }

    function handleConfirm(record: AttendanceRecord) {
        mutate(`/api/dashboard/instructor/attendance/${record.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'confirm' }),
        })
    }

    function handleConfirmAll() {
        const date = dateFilter === 'HOY' ? todayStr : dateFilter !== 'TODAS' ? dateFilter : undefined
        mutate('/api/dashboard/instructor/attendance/confirm-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(date ? { date } : {}),
        })
    }

    function handleOpenReject(record: AttendanceRecord) {
        setRejectRecordId(record.id)
        setRejectReason('')
    }

    function handleConfirmReject() {
        if (!rejectRecordId) return
        mutate(`/api/dashboard/instructor/attendance/${rejectRecordId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reject', notes: rejectReason.trim() }),
        })
        setRejectRecordId(null)
    }

    function handleOpenEdit(record: AttendanceRecord) {
        setEditingRecord(record)
        setEditHours(record.hoursTrained)
        setEditSessionType(record.sessionType ?? 'class')
        setEditNotes(record.notes ?? '')
    }

    function handleSaveEdit() {
        if (!editingRecord) return
        mutate(`/api/dashboard/instructor/attendance/${editingRecord.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hoursTrained: editHours,
                sessionType: editSessionType,
                notes: editNotes.trim(),
            }),
        })
        setEditingRecord(null)
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-4">
                    <div className="mb-1 flex items-center justify-between text-neutral-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Por Validar</span>
                        <Hourglass className="size-4 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-amber-300">{data.pendingCount}</span>
                        <span className="text-xs text-neutral-400">alumnos puncharon</span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-400">Esperando firma del Sensei</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-4">
                    <div className="mb-1 flex items-center justify-between text-neutral-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Confirmadas</span>
                        <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-white">{confirmedCount}</span>
                        <span className="text-xs text-neutral-400">sesiones</span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-400">Histórico del dojo</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-4">
                    <div className="mb-1 flex items-center justify-between text-neutral-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Horas de Tatami</span>
                        <Flame className="size-4 text-orange-400" aria-hidden="true" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold text-white">{data.totalHours}h</span>
                        <span className="text-xs text-neutral-400">acumuladas</span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-400">Kihon, Katas y Kumite</p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-[#161b22] p-4">
                    <div className="mb-1 flex items-center justify-between text-neutral-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Instructor a Cargo</span>
                        <Award className="size-4 text-red-400" aria-hidden="true" />
                    </div>
                    <p className="truncate text-sm font-bold text-white">{data.instructorName}</p>
                    <p className="text-xs text-neutral-400">Dojo Tosei-Gusoku</p>
                </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-800 bg-[#161b22] p-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-[#0d1117] px-3 py-1.5 text-xs text-neutral-300">
                        <Calendar className="size-3.5 text-neutral-400" aria-hidden="true" />
                        <span className="font-semibold text-neutral-400">Fecha:</span>
                        <select
                            className="cursor-pointer bg-transparent font-medium text-white focus:outline-none"
                            onChange={(event) => setDateFilter(event.target.value)}
                            value={dateFilter}
                        >
                            <option className="bg-[#161b22]" value="TODAS">Todas las fechas</option>
                            <option className="bg-[#161b22]" value="HOY">Hoy ({todayStr})</option>
                            {data.availableDates.map((date) => <option className="bg-[#161b22]" key={date} value={date}>{date}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-[#0d1117] p-1 text-xs">
                        <button
                            className={`rounded px-2.5 py-1 transition-colors ${statusFilter === 'ALL' ? 'bg-neutral-800 font-semibold text-white' : 'text-neutral-400 hover:text-white'}`}
                            onClick={() => setStatusFilter('ALL')}
                            type="button"
                        >
                            Todas ({filteredRecords.length})
                        </button>
                        <button
                            className={`flex items-center gap-1 rounded px-2.5 py-1 transition-colors ${statusFilter === 'PENDING' ? 'border border-amber-500/30 bg-amber-500/20 font-semibold text-amber-300' : 'text-neutral-400 hover:text-amber-300'}`}
                            onClick={() => setStatusFilter('PENDING')}
                            type="button"
                        >
                            <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                            Pendientes ({data.pendingCount})
                        </button>
                        <button
                            className={`rounded px-2.5 py-1 transition-colors ${statusFilter === 'CONFIRMED' ? 'border border-emerald-500/30 bg-emerald-500/20 font-semibold text-emerald-300' : 'text-neutral-400 hover:text-emerald-300'}`}
                            onClick={() => setStatusFilter('CONFIRMED')}
                            type="button"
                        >
                            Confirmadas
                        </button>
                    </div>
                </div>

                <button
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-md transition-all ${pendingRecords.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500' : 'cursor-not-allowed bg-neutral-800 text-neutral-500'}`}
                    disabled={busy || pendingRecords.length === 0}
                    onClick={handleConfirmAll}
                    type="button"
                >
                    <CheckCheck className="size-4" aria-hidden="true" />
                    <span>
                        {pendingRecords.length > 0
                            ? `Confirmar Todas las Asistencias (${pendingForFilter})`
                            : 'No hay Asistencias Pendientes'}
                    </span>
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#161b22] shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-800 p-4">
                    <div className="flex items-center gap-2">
                        <Users className="size-4 text-neutral-400" aria-hidden="true" />
                        <h4 className="text-sm font-bold text-white">Registro de Asistencia del Tatami</h4>
                    </div>
                    <span className="text-xs text-neutral-400">{filteredRecords.length} registros listados</span>
                </div>

                {filteredRecords.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-neutral-400">No se encontraron registros con los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-800/80">
                        {filteredRecords.map((record) => {
                            const isConfirmed = record.status === 'CONFIRMED'
                            const isPending = record.status === 'PENDING'
                            const initials = record.studentName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

                            return (
                                <div className={`flex flex-col justify-between gap-4 p-4 transition-colors md:flex-row md:items-center ${isPending ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]' : 'hover:bg-neutral-800/30'}`} key={record.id}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${isConfirmed ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : isPending ? 'border-amber-500/40 bg-amber-500/10 text-amber-200' : 'border-red-500/40 bg-red-500/10 text-red-200'}`}>{initials}</span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-bold text-white">{record.studentName}</span>
                                                <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${isConfirmed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : isPending ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                                                    {isConfirmed && <CheckCircle2 className="size-3" aria-hidden="true" />}
                                                    {isPending && <Hourglass className="size-3 animate-spin" aria-hidden="true" />}
                                                    <span>{isConfirmed ? 'CONFIRMADA' : isPending ? 'PENDIENTE' : 'OBSERVADA'}</span>
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                                                <span className="flex items-center gap-1 font-mono text-neutral-300"><Calendar className="size-3 text-neutral-500" aria-hidden="true" />{formatter.format(new Date(record.date))}</span>
                                                <span className="text-neutral-600">•</span>
                                                <span className="flex items-center gap-1 font-mono font-bold text-amber-300"><Clock className="size-3 text-neutral-500" aria-hidden="true" />{record.hoursTrained} h</span>
                                                <span className="text-neutral-600">•</span>
                                                <span className="text-neutral-300">{sessionLabel(record.sessionType)}</span>
                                            </div>
                                            {record.notes && <p className="mt-1 rounded border border-neutral-800 bg-neutral-900/60 px-2 py-1 text-xs text-neutral-400">{record.notes}</p>}
                                            {isConfirmed && record.confirmedByName && (
                                                <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-emerald-400"><CheckCircle2 className="size-3" aria-hidden="true" />Confirmado por {record.confirmedByName}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end md:self-center">
                                        {isPending ? (
                                            <>
                                                <button
                                                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-500"
                                                    disabled={busy}
                                                    onClick={() => handleConfirm(record)}
                                                    title="Aprobar asistencia y sumar al historial del alumno"
                                                    type="button"
                                                >
                                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                    <span>Confirmar</span>
                                                </button>
                                                <button
                                                    className="flex items-center gap-1 rounded-lg border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-red-400"
                                                    disabled={busy}
                                                    onClick={() => handleOpenReject(record)}
                                                    title="Rechazar u observar"
                                                    type="button"
                                                >
                                                    <XCircle className="size-3.5" aria-hidden="true" />
                                                    <span>Observar</span>
                                                </button>
                                            </>
                                        ) : null}

                                        <button
                                            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:border-cyan-400 hover:bg-cyan-900/50"
                                            disabled={busy}
                                            onClick={() => handleOpenEdit(record)}
                                            title="Rectificar horas, contenido o notas"
                                            type="button"
                                        >
                                            <Pencil className="size-3.5 text-cyan-400" aria-hidden="true" />
                                            <span>Editar</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg space-y-4 rounded-xl border border-neutral-700 bg-[#161b22] p-5 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-white sm:text-base">Rectificar Asistencia de Alumno</h3>
                                <p className="text-xs font-medium text-cyan-400">{editingRecord.studentName}</p>
                            </div>
                            <button className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white" onClick={() => setEditingRecord(null)} type="button"><X className="size-5" aria-hidden="true" /></button>
                        </div>

                        <p className="text-xs text-neutral-300">Corrige las horas, el contenido o las notas ingresadas por el alumno.</p>

                        <div className="space-y-3.5 text-xs">
                            <div>
                                <label className="mb-1 block font-semibold text-neutral-400">Horas de Tatami Entrenadas</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        className="w-28 rounded-lg border border-neutral-700 bg-[#0d1117] p-2.5 font-mono font-bold text-white focus:border-cyan-500 focus:outline-none"
                                        max="12"
                                        min="0.5"
                                        onChange={(event) => setEditHours(parseFloat(event.target.value) || 0.5)}
                                        step="0.5"
                                        type="number"
                                        value={editHours}
                                    />
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {[1.0, 1.5, 2.0, 2.5, 3.0].map((quickHour) => (
                                            <button
                                                className={`rounded-lg border px-2.5 py-1.5 font-mono font-bold transition-all ${editHours === quickHour ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
                                                key={quickHour}
                                                onClick={() => setEditHours(quickHour)}
                                                type="button"
                                            >
                                                {quickHour}h
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block font-semibold text-neutral-400">Tipo de Práctica / Especialidad</label>
                                <select
                                    className="w-full cursor-pointer rounded-lg border border-neutral-700 bg-[#0d1117] p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                                    onChange={(event) => setEditSessionType(event.target.value)}
                                    value={editSessionType}
                                >
                                    <option value="class">Clase regular</option>
                                    <option value="private">Clase privada</option>
                                    <option value="autonomous">Entrenamiento libre</option>
                                    <option value="seminar">Seminario / Especial</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block font-semibold text-neutral-400">Notas u Observaciones del Sensei / Alumno</label>
                                <textarea
                                    className="w-full rounded-lg border border-neutral-700 bg-[#0d1117] p-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-cyan-500 focus:outline-none"
                                    onChange={(event) => setEditNotes(event.target.value)}
                                    placeholder="Ej: Corregido horario por Sensei - el alumno entrenó 1.5 horas en el segundo turno..."
                                    rows={2}
                                    value={editNotes}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3">
                            <span className="text-[11px] text-neutral-500">Se recalcularán las estadísticas del alumno al guardar.</span>
                            <div className="flex items-center gap-2">
                                <button className="rounded-lg border border-neutral-700 px-3.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800" onClick={() => setEditingRecord(null)} type="button">Cancelar</button>
                                <button className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-cyan-500" onClick={handleSaveEdit} type="button"><Save className="size-3.5" aria-hidden="true" /><span>Guardar Corrección</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {rejectRecordId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md space-y-4 rounded-xl border border-neutral-800 bg-[#161b22] p-5 shadow-xl">
                        <h3 className="flex items-center gap-2 text-base font-bold text-white"><XCircle className="size-5 text-red-400" aria-hidden="true" /><span>Observar Asistencia del Alumno</span></h3>
                        <p className="text-xs text-neutral-400">Indica la razón por la cual no se convalida esta sesión (ej. horario no coincidió, retiro temprano, etc.).</p>
                        <textarea
                            className="w-full rounded-lg border border-neutral-700 bg-[#0d1117] p-3 text-xs text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none"
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Escribe la observación del Sensei..."
                            rows={3}
                            value={rejectReason}
                        />
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button className="rounded-lg border border-neutral-700 px-3.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800" onClick={() => setRejectRecordId(null)} type="button">Cancelar</button>
                            <button className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500" onClick={handleConfirmReject} type="button">Guardar Observación</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}