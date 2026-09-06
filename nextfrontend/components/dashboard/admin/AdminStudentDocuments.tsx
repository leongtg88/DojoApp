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

    return <section className="mt-7 border border-[#e5e2e1] bg-white shadow-sm"><div className="flex items-center justify-between border-b border-[#e5e2e1] px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Expediente seguro</p><h2 className="mt-1 font-display text-lg font-bold text-[#1c1b1b]">Documentos</h2></div><span className="text-xs font-bold text-[#8a7400]">{documents.length} archivos</span></div>{documents.length === 0 ? <p className="px-5 py-8 text-sm text-[#5c403c]">No hay documentos asociados a este alumno.</p> : <ul className="divide-y divide-[#e5e2e1]">{documents.map((document) => <li className="p-5" key={document.id}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-[#1c1b1b]">{documentLabels[document.type]}</p><p className="mt-1 truncate text-xs text-[#5c403c]">{document.fileName}</p></div><div className="flex items-center gap-2"><span className={`border px-2 py-1 text-[10px] font-bold uppercase ${document.status === 'APPROVED' ? 'border-[#cee2b7] bg-[#e6f1d8] text-[#426020]' : document.status === 'REJECTED' ? 'border-[#f2c9c5] bg-[#fff1f0] text-[#b70011]' : 'border-[#e5e2e1] bg-[#f6f3f2] text-[#5c403c]'}`}>{document.status}</span><button aria-label={`Abrir ${documentLabels[document.type]}`} className="p-2 text-[#8a7400] hover:text-[#b70011] disabled:opacity-50" disabled={openingId === document.id} onClick={() => openDocument(document.id)} type="button">{openingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button></div></div>{document.status !== 'EXPIRED' && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input className="min-w-0 flex-1 border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm outline-none focus:border-[#b70011]" onChange={(event) => setNotes((current) => ({ ...current, [document.id]: event.target.value }))} placeholder="Observación de revisión" value={notes[document.id] ?? document.reviewNotes ?? ''} /><button className="inline-flex items-center justify-center gap-1.5 border border-[#5b7f38] px-3 py-2 text-xs font-bold text-[#426020] hover:bg-[#e6f1d8] disabled:opacity-50" disabled={reviewingId === document.id} onClick={() => reviewDocument(document.id, 'APPROVED')} type="button"><Check aria-hidden="true" className="size-3.5" />Aprobar</button><button className="inline-flex items-center justify-center gap-1.5 border border-[#b70011] px-3 py-2 text-xs font-bold text-[#b70011] hover:bg-[#fff1f0] disabled:opacity-50" disabled={reviewingId === document.id} onClick={() => reviewDocument(document.id, 'REJECTED')} type="button"><X aria-hidden="true" className="size-3.5" />Rechazar</button></div>}</li>)}</ul>}{error && <p className="px-5 py-3 text-sm font-medium text-[#b70011]">{error}</p>}</section>
}