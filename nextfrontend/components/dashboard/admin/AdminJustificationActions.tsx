'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

interface AdminJustificationActionsProps {
    justificationId: string
}

export function AdminJustificationActions({ justificationId }: AdminJustificationActionsProps) {
    const router = useRouter()
    const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function review(action: 'approve' | 'reject') {
        setBusy(action)
        setError(null)

        const response = await fetch(`/api/dashboard/admin/attendance/justification/${justificationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        })

        setBusy(null)

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            setError(data?.error ?? 'No fue posible revisar el reporte.')
            return
        }

        router.refresh()
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
                <button
                    className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                    disabled={busy !== null}
                    onClick={() => review('approve')}
                    type="button"
                >
                    {busy === 'approve' ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-3" aria-hidden="true" />}
                    Justificar
                </button>
                <button
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 px-2.5 py-1 text-[11px] font-bold text-danger-text hover:bg-rose-500/10 disabled:opacity-50"
                    disabled={busy !== null}
                    onClick={() => review('reject')}
                    type="button"
                >
                    {busy === 'reject' ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <XCircle className="size-3" aria-hidden="true" />}
                    Rechazar
                </button>
            </div>
            {error && <span className="text-[10px] text-danger-text">{error}</span>}
        </div>
    )
}
