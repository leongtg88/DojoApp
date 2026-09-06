'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save } from 'lucide-react'
import type { InstructorTechniqueReview as TechniqueReview } from '@/types/dashboard'

interface InstructorTechniqueReviewProps {
    review: TechniqueReview
}

export function InstructorTechniqueReview({ review }: InstructorTechniqueReviewProps) {
    const router = useRouter()
    const [selectedTechniqueId, setSelectedTechniqueId] = useState('')
    const [assignmentNotes, setAssignmentNotes] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function sendUpdate(method: 'POST' | 'PATCH', body: object) {
        setError(null)
        setIsSaving(true)
        const response = await fetch('/api/dashboard/instructor/techniques', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        setIsSaving(false)

        if (!response.ok) {
            setError('No fue posible guardar la evaluación. Inténtalo nuevamente.')
            return false
        }

        router.refresh()
        return true
    }

    async function assignTechnique(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedTechniqueId) {
            setError('Selecciona una técnica para asignar.')
            return
        }

        const saved = await sendUpdate('POST', {
            studentId: review.student.id,
            techniqueId: selectedTechniqueId,
            notes: assignmentNotes.trim() || null,
        })

        if (saved) {
            setSelectedTechniqueId('')
            setAssignmentNotes('')
        }
    }

    async function updateTechnique(techniqueId: string, approved: boolean, notes: string | null) {
        await sendUpdate('PATCH', {
            studentId: review.student.id,
            techniqueId,
            approved,
            notes: notes?.trim() || null,
        })
    }

    const assignedTechniqueIds = new Set(review.techniques.map(({ id }) => id))
    const unassignedTechniques = review.availableTechniques.filter(({ id }) => !assignedTechniqueIds.has(id))

    return (
        <section className="mt-6 space-y-6">
            <form className="border border-[#e5e2e1] bg-white p-5" onSubmit={assignTechnique}>
                <h2 className="font-display text-lg font-bold text-[#1c1b1b]">Asignar técnica</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <select className="border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" onChange={(event) => setSelectedTechniqueId(event.target.value)} value={selectedTechniqueId}>
                        <option value="">Selecciona una técnica</option>
                        {unassignedTechniques.map((technique) => <option key={technique.id} value={technique.id}>{technique.category}: {technique.name}</option>)}
                    </select>
                    <input className="border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" onChange={(event) => setAssignmentNotes(event.target.value)} placeholder="Observación opcional" value={assignmentNotes} />
                    <button className="inline-flex items-center justify-center gap-2 bg-[#5c403c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit"><Plus aria-hidden="true" className="size-4" />Asignar</button>
                </div>
            </form>

            <section className="border border-[#e5e2e1] bg-white">
                <div className="border-b border-[#e5e2e1] px-5 py-4">
                    <h2 className="font-display text-lg font-bold text-[#1c1b1b]">Técnicas asignadas</h2>
                </div>
                {review.techniques.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-[#5c403c]">Este alumno no tiene técnicas asignadas.</p>
                ) : (
                    <ul className="divide-y divide-[#e5e2e1]">
                        {review.techniques.map((technique) => (
                            <TechniqueRow isSaving={isSaving} key={technique.id} onSave={updateTechnique} technique={technique} />
                        ))}
                    </ul>
                )}
            </section>
            {error && <p className="text-sm font-medium text-[#b70011]">{error}</p>}
        </section>
    )
}

function TechniqueRow({
    isSaving,
    onSave,
    technique,
}: {
    isSaving: boolean
    onSave: (techniqueId: string, approved: boolean, notes: string | null) => Promise<void>
    technique: TechniqueReview['techniques'][number]
}) {
    const [approved, setApproved] = useState(technique.status === 'APPROVED')
    const [notes, setNotes] = useState(technique.notes ?? '')

    return (
        <li className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">{technique.category}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">{technique.name}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1c1b1b]">
                    <input checked={approved} className="size-4 accent-[#b70011]" onChange={(event) => setApproved(event.target.checked)} type="checkbox" />
                    Aprobada
                </label>
            </div>
            <textarea className="mt-3 w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm outline-none focus:border-[#b70011]" onChange={(event) => setNotes(event.target.value)} rows={2} value={notes} />
            <button className="mt-3 inline-flex items-center gap-2 border border-[#b70011] px-3 py-2 text-sm font-semibold text-[#b70011] disabled:opacity-60" disabled={isSaving} onClick={() => onSave(technique.id, approved, notes)} type="button"><Save aria-hidden="true" className="size-4" />Guardar evaluación</button>
        </li>
    )
}