'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useCallback } from 'react'
import type { KataProgressItem } from '@/types/dashboard'
import { KataList } from '@/components/dashboard/dojo/KataList'

interface KataProgressPanelProps {
    katas: KataProgressItem[]
}

export function KataProgressPanel({ katas }: KataProgressPanelProps) {
    const router = useRouter()
    const requiredKataIds = useMemo(() => katas.filter(({ requiredForGrade }) => requiredForGrade).map(({ id }) => id), [katas])

    const updateKata = useCallback(
        async (kataId: string, payload: Record<string, unknown>) => {
            const response = await fetch(`/api/dashboard/student/techniques/${kataId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                router.refresh()
            }
        },
        [router],
    )

    const handleStartPractice = useCallback(
        (kataId: string) => updateKata(kataId, { inPractice: true, lastPracticeDate: new Date().toISOString() }),
        [updateKata],
    )

    const handleSaveNote = useCallback(
        (kataId: string, note: string) => updateKata(kataId, { notes: note, lastPracticeDate: new Date().toISOString() }),
        [updateKata],
    )

    return (
        <KataList
            katas={katas}
            onSaveNote={handleSaveNote}
            onStartPractice={handleStartPractice}
            requiredKataIds={requiredKataIds}
        />
    )
}