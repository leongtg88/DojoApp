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
    const [items, setItems] = useState(documents)
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
        setItems((current) => current.map((document) => document.id === documentId ? { ...document, status, reviewNotes: notes[documentId]?.trim() || null } : document))
    }

    return <section className="mt-7 rounded-lg border border-edge bg-surface-2 shadow-sm"><div className="flex items-center justify-between border-b border-edge px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Expediente seguro</p><h2 className="mt-1 font-display text-lg font-bold text-ink">Documentos</h2></div><span className="text-xs font-bold text-accent">{items.length} archivos</span></div>{items.length === 0 ? <p className="px-5 py-8 text-sm text-ink-3">No hay documentos asociados a este alumno.</p> : <ul className="divide-y divide-edge">{items.map((document) => <li className="p-5" key={document.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-ink">{documentLabels[document.type]}</p><p className="mt-1 truncate text-xs text-ink-3">{document.fileName}</p></div><div className="flex items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${document.status === 'APPROVED' ? 'border-emerald-500/40 bg-emerald-500/15 text-ok-text' : document.status === 'REJECTED' ? 'border-red-500/40 bg-red-500/15 text-danger-text' : 'border-edge-strong bg-surface-1 text-ink-2'}`}>{document.status}</span><button aria-label={`Abrir ${documentLabels[document.type]}`} className="p-2 text-accent hover:text-accent-text disabled:opacity-50" disabled={openingId === document.id} onClick={() => openDocument(document.id)} type="button">{openingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button></div></div>{document.status !== 'EXPIRED' && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input className="min-w-0 flex-1 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" onChange={(event) => setNotes((current) => ({ ...current, [document.id]: event.target.value }))} placeholder="Observación de revisión" value={notes[document.id] ?? document.reviewNotes ?? ''} /><button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-ok-text hover:bg-emerald-500/20 disabled:opacity-50" disabled={reviewingId === document.id} onClick={() => reviewDocument(document.id, 'APPROVED')} type="button"><Check aria-hidden="true" className="size-3.5" />Aprobar</button><button className="inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-danger-text hover:bg-red-500/20 disabled:opacity-50" disabled={reviewingId === document.id} onClick={() => reviewDocument(document.id, 'REJECTED')} type="button"><X aria-hidden="true" className="size-3.5" />Rechazar</button></div>}</li>)}</ul>}{error && <p className="px-5 py-3 text-sm font-medium text-danger-text">{error}</p>}</section>
}