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
			<div className="w-full max-w-lg rounded-lg border border-neutral-800 bg-[#161b22] shadow-xl" onClick={(event) => event.stopPropagation()}>
				<div className="border-b border-neutral-800 px-5 py-4">
					<h3 className="font-display text-lg font-bold text-white">Enlace de invitación</h3>
				</div>
				<div className="px-5 py-4">
					<p className="text-sm text-neutral-300">
						Enlace creado para <span className="font-semibold text-white">{name}</span>{email ? ` (${email})` : ''}. Vence en 7 días. Si el correo no llegó, envíale este enlace manualmente.
					</p>
					<div className="mt-3 flex items-stretch gap-2">
						<input readOnly value={url} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2.5 text-xs text-cyan-300 outline-none focus:border-cyan-500" />
						<button type="button" onClick={handleCopy} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400">
							{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
							{copied ? 'Copiado' : 'Copiar'}
						</button>
					</div>
				</div>
				<div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 px-5 py-3.5">
					<button type="button" onClick={onClose} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white">
						Cerrar
					</button>
				</div>
			</div>
		</div>
	)
}