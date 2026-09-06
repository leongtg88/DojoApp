'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award } from 'lucide-react'
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
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">{student.firstName} {student.lastName}</h1>
            <p className="mt-2 text-sm text-[#5c403c]">{student.currentRank ?? 'Sin grado asignado'} · {student.branchName} · {student.status}</p>

            <section className="mt-7 border border-[#e5e2e1] bg-white p-5">
                <h2 className="font-display text-lg font-bold text-[#1c1b1b]">Registrar ascenso</h2>
                {eligibleRanks.length === 0 ? (
                    <p className="mt-3 text-sm text-[#5c403c]">No hay grados superiores configurados para este alumno.</p>
                ) : (
                    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={promoteStudent}>
                        <label className="text-sm font-semibold text-[#1c1b1b]" htmlFor="beltRankId">Nuevo grado
                            <select className="mt-1.5 block w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" id="beltRankId" onChange={(event) => setBeltRankId(event.target.value)} value={beltRankId}>
                                {eligibleRanks.map((rank) => <option key={rank.id} value={rank.id}>{rank.name}</option>)}
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-[#1c1b1b]" htmlFor="promotedAt">Fecha de ascenso
                            <input className="mt-1.5 block w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" id="promotedAt" onChange={(event) => setPromotedAt(event.target.value)} required type="date" value={promotedAt} />
                        </label>
                        <label className="sm:col-span-2 text-sm font-semibold text-[#1c1b1b]" htmlFor="promotionNotes">Observación
                            <textarea className="mt-1.5 block w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" id="promotionNotes" onChange={(event) => setNotes(event.target.value)} rows={3} value={notes} />
                        </label>
                        {error && <p className="sm:col-span-2 text-sm font-medium text-[#b70011]">{error}</p>}
                        <button className="inline-flex w-fit items-center gap-2 bg-[#b70011] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit"><Award aria-hidden="true" className="size-4" />{isSaving ? 'Guardando...' : 'Confirmar ascenso'}</button>
                    </form>
                )}
            </section>

            <section className="mt-7 border border-[#e5e2e1] bg-white">
                <div className="border-b border-[#e5e2e1] px-5 py-4"><h2 className="font-display text-lg font-bold text-[#1c1b1b]">Historial de grados</h2></div>
                {student.rankHistory.length === 0 ? <p className="px-5 py-8 text-sm text-[#5c403c]">No hay ascensos registrados.</p> : (
                    <ul className="divide-y divide-[#e5e2e1]">
                        {student.rankHistory.map((entry) => (
                            <li className="px-5 py-4" key={entry.id}>
                                <p className="text-sm font-semibold text-[#1c1b1b]">{entry.rankName}</p>
                                <p className="mt-1 text-xs text-[#5c403c]">{new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(entry.promotedAt))} · {entry.promoterName ?? 'Sin responsable registrado'}</p>
                                {entry.notes && <p className="mt-2 text-sm text-[#5c403c]">{entry.notes}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    )
}