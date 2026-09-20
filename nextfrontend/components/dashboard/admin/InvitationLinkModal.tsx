'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface InvitationLinkModalProps {
	open: boolean
	name: string
	email: string | null
	url: string
	onClose: () => void
}

export function InvitationLinkModal({ open, name, email, url, onClose }: InvitationLinkModalProps) {
	const [copied, setCopied] = useState(false)

	function handleCopy() {
		navigator.clipboard?.writeText(url).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}).catch(() => {})
	}

	if (!open) return null

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
			<div className="w-full max-w-lg rounded-lg border border-edge bg-surface-2 shadow-xl" onClick={(event) => event.stopPropagation()}>
				<div className="border-b border-edge px-5 py-4">
					<h3 className="font-display text-lg font-bold text-ink">Enlace de invitación</h3>
				</div>
				<div className="px-5 py-4">
					<p className="text-sm text-ink-2">
						Enlace creado para <span className="font-semibold text-ink">{name}</span>{email ? ` (${email})` : ''}. Vence en 7 días. Si el correo no llegó, envíale este enlace manualmente.
					</p>
					<div className="mt-3 flex items-stretch gap-2">
						<input readOnly value={url} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-md border border-edge-strong bg-surface-1 px-3 py-2.5 text-xs text-accent outline-none focus:border-cyan-500" />
						<button type="button" onClick={handleCopy} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400">
							{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
							{copied ? 'Copiado' : 'Copiar'}
						</button>
					</div>
				</div>
				<div className="flex items-center justify-end gap-2.5 border-t border-edge px-5 py-3.5">
					<button type="button" onClick={onClose} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink">
						Cerrar
					</button>
				</div>
			</div>
		</div>
	)
}