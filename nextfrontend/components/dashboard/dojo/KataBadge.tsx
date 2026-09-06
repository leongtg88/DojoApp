'use client'

import { CheckCircle2, CircleDot, Flame } from 'lucide-react'
import type { KataStatus } from '@/types/dashboard'

interface KataBadgeProps {
    status: KataStatus
    showIcon?: boolean
    size?: 'sm' | 'md'
    className?: string
}

const statusStyles: Record<KataStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
    APPROVED: { label: 'Aprobada', className: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', Icon: CheckCircle2 },
    IN_PROGRESS: { label: 'En Práctica', className: 'bg-amber-500/20 border-amber-500/40 text-amber-300', Icon: Flame },
    PENDING: { label: 'Por Iniciar', className: 'bg-neutral-800 border-neutral-700 text-neutral-300', Icon: CircleDot },
}

export function KataBadge({ status, showIcon = true, size = 'sm', className = '' }: KataBadgeProps) {
    const { label, className: statusClassName, Icon } = statusStyles[status]
    const spacing = size === 'md' ? 'gap-1.5 px-3 py-1.5 text-xs' : 'gap-1 px-2 py-1 text-[11px]'
    const iconSize = size === 'md' ? 'size-4' : 'size-3.5'

    return (
        <span
            className={`inline-flex items-center rounded-md border font-semibold ${spacing} ${statusClassName} ${className}`}
        >
            {showIcon && <Icon aria-hidden="true" className={`${iconSize} shrink-0`} />}
            {label}
        </span>
    )
}