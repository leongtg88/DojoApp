'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, ImageOff, LoaderCircle, X } from 'lucide-react'
import { downloadFileFromEndpoint } from '@/lib/ui/download'
import type { StudentDocumentSummary } from '@/types/dashboard'

interface AdminStudentMediaProps {
	documents: StudentDocumentSummary[]
	studentId: string
}

interface MediaItem {
	id: string
	studentId: string
	label: string
	fileName: string
	url: string
}

const DOCUMENT_LABELS: Record<StudentDocumentSummary['type'], string> = {
	PROFILE_PHOTO: 'Foto de perfil',
	IDENTITY: 'Documento de identidad',
	BIRTH_CERTIFICATE: 'Acta de nacimiento',
	PASSPORT: 'Pasaporte',
	MEDICAL_CERTIFICATE: 'Certificado médico',
	OTHER: 'Documento adicional',
}

export function AdminStudentMedia({ documents, studentId }: AdminStudentMediaProps) {
	const imageDocuments = useMemo(() => documents.filter((document) => document.mimeType.startsWith('image/')), [documents])
	const [activeIndex, setActiveIndex] = useState<number | null>(null)
	const [downloadingId, setDownloadingId] = useState<string | null>(null)
	const [downloadError, setDownloadError] = useState<string | null>(null)

	const items: MediaItem[] = useMemo(
		() =>
			imageDocuments
				.filter((document) => Boolean(document.url))
				.map((document) => ({ id: document.id, studentId, label: DOCUMENT_LABELS[document.type], fileName: document.fileName, url: document.url as string })),
		[imageDocuments, studentId],
	)

	useEffect(() => {
		if (activeIndex === null) return
		function handleKey(event: KeyboardEvent) {
			if (event.key === 'Escape') setActiveIndex(null)
			if (event.key === 'ArrowRight') setActiveIndex((index) => (index === null ? null : (index + 1) % items.length))
			if (event.key === 'ArrowLeft') setActiveIndex((index) => (index === null ? null : (index - 1 + items.length) % items.length))
			setDownloadError(null)
		}
		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [activeIndex, items.length])

	function activate(index: number | null) {
		setDownloadError(null)
		setActiveIndex(index)
	}

	async function downloadDocument(item: MediaItem) {
		setDownloadError(null)
		setDownloadingId(item.id)
		try {
			await downloadFileFromEndpoint(`/api/dashboard/admin/students/${item.studentId}/documents/${item.id}/download`, item.fileName)
		} catch (reason: unknown) {
			setDownloadError(reason instanceof Error ? reason.message : 'No fue posible descargar la imagen.')
		} finally {
			setDownloadingId(null)
		}
	}

	if (imageDocuments.length === 0) return null

	const activeItem = activeIndex !== null ? items[activeIndex] : null

	return (
		<section className="mt-7 rounded-lg border border-edge bg-surface-2 shadow-sm">
			<div className="flex items-center justify-between border-b border-edge px-5 py-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-accent">Galería</p>
					<h2 className="mt-1 font-display text-lg font-bold text-ink">Imágenes cargadas</h2>
				</div>
			</div>

			{items.length === 0 ? (
				<p className="flex items-center gap-2 px-5 py-8 text-xs text-ink-3">
					<ImageOff aria-hidden="true" className="size-4 text-ink-4" />
					Las imágenes registradas ya no están disponibles en el almacenamiento. Elimina esos registros desde Documentos y solicita que se vuelvan a subir.
				</p>
			) : (
				<div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-4">
					{items.map((item, index) => (
						<button
							key={item.id}
							type="button"
							onClick={() => activate(index)}
							className="group relative aspect-square overflow-hidden rounded-lg border border-edge bg-surface-1 transition-colors hover:border-cyan-500/40"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={item.url} alt={item.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
							<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-1.5 text-left text-[11px] font-semibold text-ink">{item.label}</span>
						</button>
					))}
				</div>
			)}

			{activeItem && (
				<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => activate(null)}>
					<div className="absolute inset-x-4 top-4 flex items-center justify-between">
						<p className="text-xs font-semibold uppercase tracking-wide text-accent">{activeItem.label} · {activeIndex! + 1} / {items.length}</p>
						<div className="flex items-center gap-2">
							<button type="button" aria-label="Descargar imagen" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-cyan-500 hover:text-[#0d1117] disabled:opacity-50" disabled={downloadingId === activeItem.id} onClick={(event) => { event.stopPropagation(); void downloadDocument(activeItem) }} title="Descargar imagen">
								{downloadingId === activeItem.id ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
							</button>
							<button type="button" aria-label="Cerrar" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-red-500" onClick={() => activate(null)}>
								<X aria-hidden="true" className="size-4" />
							</button>
						</div>
					</div>
					{downloadError && <p className="absolute inset-x-4 top-20 z-10 text-center text-xs font-medium text-red-400">{downloadError}</p>}
					<button type="button" aria-label="Anterior" onClick={(event) => { event.stopPropagation(); activate(activeIndex === null ? null : (activeIndex - 1 + items.length) % items.length) }} className="absolute left-2 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-cyan-500 hover:text-[#0d1117] md:left-8">
						<ChevronLeft aria-hidden="true" className="size-5" />
					</button>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={activeItem.url} alt={activeItem.label} className="max-h-[75vh] max-w-full rounded-xl border border-white/10 object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
					<button type="button" aria-label="Siguiente" onClick={(event) => { event.stopPropagation(); activate(activeIndex === null ? null : (activeIndex + 1) % items.length) }} className="absolute right-2 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-cyan-500 hover:text-[#0d1117] md:right-8">
						<ChevronRight aria-hidden="true" className="size-5" />
					</button>
				</div>
			)}
		</section>
	)
}
