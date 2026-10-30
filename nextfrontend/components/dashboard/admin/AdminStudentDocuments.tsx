'use client'

import { useState } from 'react'
import { Check, Download, ExternalLink, FolderArchive, LoaderCircle, Trash2 } from 'lucide-react'
import { ConfirmModal } from '../shared/ConfirmModal'
import { downloadFileFromEndpoint } from '@/lib/ui/download'
import type { StudentDocumentSummary } from '@/types/dashboard'

interface AdminStudentDocumentsProps {
    documents: StudentDocumentSummary[]
    studentId: string
    onChange: (next: StudentDocumentSummary[]) => void
}

const documentLabels = {
    PROFILE_PHOTO: 'Foto de perfil', IDENTITY: 'Documento de identidad', BIRTH_CERTIFICATE: 'Acta de nacimiento',
    PASSPORT: 'Pasaporte', MEDICAL_CERTIFICATE: 'Certificado médico', OTHER: 'Documento adicional',
}

const STATUS_LABELS: Record<StudentDocumentSummary['status'], string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    EXPIRED: 'Expirado',
}

const STATUS_OPTIONS: StudentDocumentSummary['status'][] = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']

export function AdminStudentDocuments({ documents, studentId, onChange }: AdminStudentDocumentsProps) {
    const [reviewingId, setReviewingId] = useState<string | null>(null)
    const [openingId, setOpeningId] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [downloadingAll, setDownloadingAll] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [pendingDelete, setPendingDelete] = useState<StudentDocumentSummary | null>(null)
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [draftStatus, setDraftStatus] = useState<Record<string, StudentDocumentSummary['status']>>({})
    const [error, setError] = useState<string | null>(null)

    async function openDocument(documentId: string) {
        setError(null); setOpeningId(documentId)
        const response = await fetch(`/api/dashboard/admin/students/${studentId}/documents/${documentId}`)
        const result = await response.json().catch(() => null)
        setOpeningId(null)
        if (!response.ok || !result?.url) { setError('No fue posible abrir el documento.'); return }
        window.open(result.url, '_blank', 'noopener,noreferrer')
    }

    async function downloadDocument(document: StudentDocumentSummary) {
        setError(null); setDownloadingId(document.id)
        try {
            await downloadFileFromEndpoint(`/api/dashboard/admin/students/${studentId}/documents/${document.id}/download`, document.fileName)
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : 'No fue posible descargar el documento.')
        } finally {
            setDownloadingId(null)
        }
    }

    async function downloadAllDocuments() {
        setError(null); setDownloadingAll(true)
        try {
            await downloadFileFromEndpoint(`/api/dashboard/admin/students/${studentId}/documents/archive`, 'documentos.zip')
        } catch (reason: unknown) {
            setError(reason instanceof Error ? reason.message : 'No fue posible descargar los documentos.')
        } finally {
            setDownloadingAll(false)
        }
    }

    async function reviewDocument(documentId: string, status: StudentDocumentSummary['status']) {
        if (status === 'REJECTED' && !notes[documentId]?.trim()) { setError('Escribe una observación antes de rechazar el documento.'); return }
        setError(null); setReviewingId(documentId)
        const response = await fetch(`/api/dashboard/admin/students/${studentId}/documents/${documentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reviewNotes: notes[documentId]?.trim() || null }) })
        setReviewingId(null)
        if (!response.ok) { setError('No fue posible guardar la revisión.'); return }
        onChange(documents.map((document) => document.id === documentId ? { ...document, status, reviewNotes: status === 'REJECTED' ? notes[documentId]?.trim() || null : null } : document))
    }

    async function deleteDocument(documentId: string) {
        setError(null); setDeletingId(documentId)
        const response = await fetch(`/api/dashboard/admin/students/${studentId}/documents/${documentId}`, { method: 'DELETE' })
        setDeletingId(null)
        setPendingDelete(null)
        if (!response.ok) {
            const result = await response.json().catch(() => null)
            setError((result as { error?: string } | null)?.error ?? 'No fue posible borrar el documento.')
            return
        }
        onChange(documents.filter((document) => document.id !== documentId))
    }

    return (
        <>
            <section className="mt-7 rounded-lg border border-edge bg-surface-2 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Expediente seguro</p>
                        <h2 className="mt-1 font-display text-lg font-bold text-ink">Documentos</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-accent">{documents.length} archivos</span>
                        {documents.length > 0 && (
                            <button
                                className="inline-flex items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-3 disabled:opacity-50"
                                disabled={downloadingAll || downloadingId !== null}
                                onClick={() => void downloadAllDocuments()}
                                type="button"
                            >
                                {downloadingAll ? <LoaderCircle className="size-3.5 animate-spin" /> : <FolderArchive className="size-3.5" />}
                                Descargar todos
                            </button>
                        )}
                    </div>
                </div>
                {documents.length === 0 ? (
                    <p className="px-5 py-8 text-xs text-ink-3">No hay documentos asociados a este alumno.</p>
                ) : (
                    <ul className="divide-y divide-edge">
                        {documents.map((document) => {
                            const unavailable = document.available === false
                            return (
                            <li className="p-5" key={document.id}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-ink">{documentLabels[document.type]}</p>
                                        <p className="mt-1 truncate text-xs text-ink-3">{document.fileName}</p>
                                        {unavailable && <p className="mt-2 text-xs font-medium text-warn-text">El archivo ya no está disponible en el almacenamiento. Puedes eliminar el registro.</p>}
                                        {document.reviewNotes && <p className="mt-2 text-xs text-danger-text">{document.reviewNotes}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${document.status === 'APPROVED' ? 'border-emerald-500/40 bg-emerald-500/15 text-ok-text' : document.status === 'REJECTED' ? 'border-red-500/40 bg-red-500/15 text-danger-text' : document.status === 'EXPIRED' ? 'border-edge-strong bg-surface-1 text-ink-3 line-through' : 'border-amber-500/40 bg-amber-500/10 text-warn-text'}`}>{STATUS_LABELS[document.status]}</span>
                                        <button aria-label={`Abrir ${documentLabels[document.type]}`} className="p-2 text-accent hover:text-accent-text disabled:opacity-50" disabled={unavailable || openingId === document.id || deletingId === document.id || downloadingId === document.id || downloadingAll} onClick={() => openDocument(document.id)} title={unavailable ? 'El archivo ya no está disponible' : 'Abrir documento'} type="button">{openingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button>
                                        <button aria-label={`Descargar ${documentLabels[document.type]}`} className="p-2 text-accent hover:text-accent-text disabled:opacity-50" disabled={unavailable || downloadingId === document.id || openingId === document.id || deletingId === document.id || downloadingAll} onClick={() => void downloadDocument(document)} title={unavailable ? 'El archivo ya no está disponible' : 'Descargar documento'} type="button">{downloadingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}</button>
                                        <button aria-label={`Eliminar ${documentLabels[document.type]}`} className="p-2 text-ink-3 transition-colors hover:text-danger-text disabled:opacity-50" disabled={deletingId === document.id || openingId === document.id || downloadingId === document.id || downloadingAll} onClick={() => setPendingDelete(document)} title="Eliminar documento" type="button">{deletingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    <input className="min-w-0 flex-1 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500" onChange={(event) => setNotes((current) => ({ ...current, [document.id]: event.target.value }))} placeholder="Observación de la revisión..." value={notes[document.id] ?? ''} />
                                    <select className="rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs text-ink outline-none focus:border-cyan-500" onChange={(event) => setDraftStatus((current) => ({ ...current, [document.id]: event.target.value as StudentDocumentSummary['status'] }))} value={draftStatus[document.id] ?? document.status}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>
                                    <button className="inline-flex items-center justify-center gap-1.5 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-bold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50" disabled={reviewingId === document.id || deletingId === document.id || (draftStatus[document.id] ?? document.status) === document.status} onClick={() => reviewDocument(document.id, draftStatus[document.id] ?? document.status)} type="button">{reviewingId === document.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}Guardar</button>
                                </div>
                            </li>
                            )
                        })}
                    </ul>
                )}
                {error && <p className="border-t border-edge px-5 py-3 text-sm font-medium text-danger-text">{error}</p>}
            </section>

            <ConfirmModal
                confirmLabel={deletingId ? 'Eliminando…' : 'Eliminar'}
                isDestructive
                message={pendingDelete ? `¿Eliminar "${documentLabels[pendingDelete.type]}" (${pendingDelete.fileName})? Esta acción no se puede deshacer.` : ''}
                onCancel={() => setPendingDelete(null)}
                onConfirm={() => { if (pendingDelete) void deleteDocument(pendingDelete.id) }}
                open={pendingDelete !== null}
                title="Eliminar documento"
            />
        </>
    )
}
