'use client'

import { useState } from 'react'
import { ExternalLink, FileUp, FileWarning, LoaderCircle } from 'lucide-react'
import type { StudentDocumentSummary } from '@/types/dashboard'

interface StudentDocumentsProps {
    documents: StudentDocumentSummary[]
}

const documentLabels = {
    PROFILE_PHOTO: 'Foto de perfil', IDENTITY: 'Documento de identidad', BIRTH_CERTIFICATE: 'Acta de nacimiento',
    PASSPORT: 'Pasaporte', MEDICAL_CERTIFICATE: 'Certificado médico', OTHER: 'Documento adicional',
}

export function StudentDocuments({ documents }: StudentDocumentsProps) {
    const [selectedType, setSelectedType] = useState<keyof typeof documentLabels>('IDENTITY')
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [openingId, setOpeningId] = useState<string | null>(null)

    async function uploadDocument(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!file) { setError('Selecciona un archivo para continuar.'); return }
        setError(null); setIsUploading(true)
        const formData = new FormData(); formData.append('type', selectedType); formData.append('file', file)
        const response = await fetch('/api/dashboard/student/documents', { method: 'POST', body: formData })
        setIsUploading(false)
        if (!response.ok) { setError('No fue posible cargar el documento.'); return }
        window.location.reload()
    }

    async function openDocument(documentId: string) {
        setOpeningId(documentId); setError(null)
        const response = await fetch(`/api/dashboard/student/documents?documentId=${documentId}`)
        const result = await response.json().catch(() => null)
        setOpeningId(null)
        if (!response.ok || !result?.url) { setError('No fue posible abrir el documento.'); return }
        window.open(result.url, '_blank', 'noopener,noreferrer')
    }

    return <section className="mt-8 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Expediente seguro</p><h2 className="mt-1 font-display text-lg font-bold text-white">Documentos de identidad</h2></div><span className="text-xs font-semibold text-neutral-400">{documents.length} archivo{documents.length === 1 ? '' : 's'}</span></div>
        {documents.length === 0 ? <p className="mt-5 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] p-4 text-sm text-neutral-400">Aún no hay documentos asociados a tu expediente.</p> : <ul className="mt-5 divide-y divide-neutral-800 rounded-lg border border-neutral-800">{documents.map((document) => <li className="flex flex-wrap items-center justify-between gap-3 p-3.5" key={document.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{documentLabels[document.type]}</p><p className="mt-1 truncate text-xs text-neutral-400">{document.fileName}</p>{document.reviewNotes && <p className="mt-2 text-xs text-red-400">{document.reviewNotes}</p>}</div><div className="flex items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${document.status === 'APPROVED' ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200' : document.status === 'REJECTED' ? 'border-red-500/40 bg-red-500/15 text-red-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}>{document.status}</span><button aria-label={`Abrir ${documentLabels[document.type]}`} className="p-2 text-cyan-400 hover:text-cyan-200 disabled:opacity-50" disabled={openingId === document.id} onClick={() => openDocument(document.id)} type="button">{openingId === document.id ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button></div></li>)}</ul>}
        <form className="mt-5 border-t border-neutral-800 pt-5" onSubmit={uploadDocument}><h3 className="text-sm font-bold text-white">Cargar o renovar documento</h3><div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><select className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" onChange={(event) => setSelectedType(event.target.value as keyof typeof documentLabels)} value={selectedType}>{Object.entries(documentLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select><input accept="image/jpeg,image/png,image/webp,application/pdf" className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#0d1117] outline-none" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /><button className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 disabled:opacity-60" disabled={isUploading} type="submit">{isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <FileUp className="size-4" />}{isUploading ? 'Cargando...' : 'Cargar'}</button></div><p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500"><FileWarning aria-hidden="true" className="size-3.5 text-cyan-400" />JPG, PNG, WEBP o PDF. Tamaño máximo 5 MB.</p>{error && <p className="mt-3 text-sm font-medium text-red-400">{error}</p>}</form>
    </section>
}