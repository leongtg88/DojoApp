'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Award, CalendarDays, GraduationCap, History, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { AdminStudentDocuments } from './AdminStudentDocuments'
import type { AdminStudentDetail as StudentDetail } from '@/types/dashboard'

interface AdminStudentDetailProps {
    student: StudentDetail
}

export function AdminStudentDetail({ student }: AdminStudentDetailProps) {
    const router = useRouter()
    const eligibleRanks = student.availableRanks.filter((rank) => rank.order > (student.currentRankOrder ?? 0))
    const [beltRankId, setBeltRankId] = useState(eligibleRanks[0]?.id ?? '')
    const [promotedAt, setPromotedAt] = useState(new Date().toISOString().slice(0, 10))
    const [notes, setNotes] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function promoteStudent(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!beltRankId) {
            setError('No hay un grado superior disponible.')
            return
        }

        setError(null)
        setIsSaving(true)
        const response = await fetch(`/api/dashboard/admin/students/${student.id}/promotions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ beltRankId, promotedAt, notes: notes.trim() || null }),
        })
        setIsSaving(false)

        if (!response.ok) {
            setError('No fue posible registrar el ascenso. Verifica el grado seleccionado.')
            return
        }

        router.refresh()
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-cyan-300" href="/dashboard/admin/alumnos"><ArrowLeft aria-hidden="true" className="size-4" />Volver al padrón</Link>
            <section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-center gap-4">
                        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-lg font-extrabold text-cyan-100">{`${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()}</span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Expediente de alumno</p>
                            <h1 className="mt-1 truncate font-display text-3xl font-extrabold text-white">{student.firstName} {student.lastName}</h1>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400"><span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 text-cyan-400" />{student.branchName}</span>{student.contactPhone && <span className="inline-flex items-center gap-1.5"><Phone aria-hidden="true" className="size-3.5 text-cyan-400" />{student.contactPhone}</span>}</div>
                        </div>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${student.status === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}><ShieldCheck aria-hidden="true" className="size-3.5" />{student.status}</span>
                </div>
                <div className="mt-5 border-t border-neutral-800 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Grado actual</p>
                    <div className="mt-2 flex items-center gap-3"><span aria-hidden="true" className="h-8 w-20 border border-white/20 bg-amber-700 shadow-inner" /><div><p className="text-lg font-bold text-white">{student.currentRank ?? 'Sin grado asignado'}</p><p className="text-xs text-neutral-400">Orden curricular {student.currentRankOrder ?? 'sin configurar'}</p></div></div>
                </div>
            </section>

            <AdminStudentDocuments documents={student.documents} studentId={student.id} />

            <section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 pb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Control de promociones</p><h2 className="mt-1 font-display text-lg font-bold text-white">Registrar ascenso</h2></div><span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-[#0d1117] px-2.5 py-1 text-xs font-bold text-neutral-300"><GraduationCap aria-hidden="true" className="size-3.5" />{eligibleRanks.length} grados disponibles</span></div>
                {eligibleRanks.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-400">No hay grados superiores configurados para este alumno.</p>
                ) : (
                    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={promoteStudent}>
                        <label className="text-sm font-semibold text-neutral-200" htmlFor="beltRankId">Nuevo grado
                            <select className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="beltRankId" onChange={(event) => setBeltRankId(event.target.value)} value={beltRankId}>
                                {eligibleRanks.map((rank) => <option key={rank.id} value={rank.id}>{rank.name}</option>)}
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-neutral-200" htmlFor="promotedAt">Fecha de ascenso
                            <input className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="promotedAt" onChange={(event) => setPromotedAt(event.target.value)} required type="date" value={promotedAt} />
                        </label>
                        <label className="sm:col-span-2 text-sm font-semibold text-neutral-200" htmlFor="promotionNotes">Observación
                            <textarea className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="promotionNotes" onChange={(event) => setNotes(event.target.value)} rows={3} value={notes} />
                        </label>
                        {error && <p className="sm:col-span-2 text-sm font-medium text-red-300">{error}</p>}
                        <p className="sm:col-span-2 inline-flex items-start gap-2 rounded-md border border-cyan-900/50 bg-cyan-950/20 p-3 text-xs leading-5 text-cyan-100"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-400" />La promoción actualizará el grado actual y añadirá un registro permanente al historial.</p>
                        <button className="inline-flex w-fit items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:opacity-60" disabled={isSaving} type="submit"><Award aria-hidden="true" className="size-4" />{isSaving ? 'Guardando...' : 'Confirmar ascenso'}</button>
                    </form>
                )}
            </section>

            <section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4"><div className="flex items-center gap-2"><History aria-hidden="true" className="size-4 text-cyan-400" /><h2 className="font-display text-lg font-bold text-white">Historial de grados</h2></div><span className="text-xs font-bold text-neutral-400">{student.rankHistory.length} registros</span></div>
                {student.rankHistory.length === 0 ? <p className="px-5 py-8 text-sm text-neutral-400">No hay ascensos registrados.</p> : (
                    <ul className="divide-y divide-neutral-800">
                        {student.rankHistory.map((entry) => (
                            <li className="flex gap-3 px-5 py-4" key={entry.id}>
                                <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" />
                                <div><p className="text-sm font-semibold text-white">{entry.rankName}</p><p className="mt-1 inline-flex items-center gap-1.5 text-xs text-neutral-400"><CalendarDays aria-hidden="true" className="size-3.5 text-cyan-400" />{new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(entry.promotedAt))} · {entry.promoterName ?? 'Sin responsable registrado'}</p>
                                {entry.notes && <p className="mt-2 text-sm text-neutral-300">{entry.notes}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}