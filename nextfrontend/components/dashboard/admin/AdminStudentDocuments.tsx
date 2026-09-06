'use client'

import { useState } from 'react'
import { Check, ExternalLink, LoaderCircle, X } from 'lucide-react'
import type { StudentDocumentSummary } from '@/types/dashboard'

interface AdminStudentDocumentsProps {
    documents: StudentDocumentSummary[]
    studentId: string
}

const documentLabels = {
    PROFILE_PHOTO: 'Foto de perfil', IDENTITY: 'Documento de identidad', BIRTH_CERTIFICATE: 'Acta de nacimiento',
    PASSPORT: 'Pasaporte', MEDICAL_CERTIFICATE: 'Certificado médico', OTHER: 'Documento adicional',
}

export function AdminStudentDocuments({ documents, studentId }: AdminStudentDocumentsProps) {
    const [reviewingId, setReviewingId] = useState<string | null>(null)
    const [openingId, setOpeningId] = useState<string | null>(null)
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [error, setError] = useState<string | null>(null)

    async function openDocument(documentId: string) {
        setError(null); setOpeningId(documentId)
        const response = await fetch(`/api/dashboard/admin/students/${studentId}/documents/${documentId}`)
        const result = await response.json().catch(() => null)
        setOpeningId(null)
        if (!response.ok || !result?.url) { setError('No fue posible abrir el documento.'); return }
        window.open(result.url, '_blank', 'noopener,noreferrer')
    }

    async function reviewDocument(documentId: string, status: 'APPROVED' | 'REJECTED') {
        if (status === 'REJECTED' && !notes[documentId]?.trim()) { setError('Escribe una observación antes de rechazar el documento.'); return }
        setError(null); setReviewingId(documentId)
        const response = await fetch(`/api/dashboard/admin/students/${studentId}/documents/${documentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reviewNotes: notes[documentId]?.trim() || null }) })
        setReviewingId(null)
        if (!response.ok) { setError('No fue posible guardar la revisión.'); return }
        window.location.reload()
    }

    return <section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm"><div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Expediente seguro</p><h2 className="mt-1 font-display text-lg font-bold text-white">Documentos</h2></div><span className="text-xs font-bold text-cyan-400">{documents.length} archivos</span></div>{documents.length === 0 ? <p className="px-5 py-8 text-sm text-neutral-400">No hay documentos asociados a este alumno.</p> : <ul className="divide-y divide-neutral-800">{documents.map((document) => <li className="p-5" key={document.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-white">{documentLabels[document.type]}</p><p className="mt-1 truncate text-xs text-neutral-400">{document.fileName}</p></div><div className="flex items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${document.status === 'APPROVED' ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200' : document.status === 'REJECTED' ? 'border-red-500/40 bg-red-500/15 text-red-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}>{document.status}</span><button aria-label={`Abrir ${documentLabels[document.type]}`} className="p-2 text-cyan-400 hover:text-cyan-200 disabled:opacity-50" disabled={openingId === document.id} onClick={() => openDocument(document.id)} type="button">{openingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button></div></div>{document.status !== 'EXPIRED' && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" onChange={(event) => setNotes((current) => ({ ...current, [document.id]: event.target.value }))} placeholder="Observación de revisión" value={notes[document.id] ?? document.reviewNotes ?? ''} /><button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50" disabled={reviewingId === document.id} onClick={() => reviewDocument(document.id, 'APPROVED')} type="button"><Check aria-hidden="true" className="size-3.5" />Aprobar</button><button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-50" disabled={reviewingId === document.id} onClick={() => reviewDocument(document.id, 'REJECTED')} type="button"><X aria-hidden="true" className="size-3.5" />Rechazar</button></div>}</li>)}</ul>}{error && <p className="px-5 py-3 text-sm font-medium text-red-400">{error}</p>}</section>
}