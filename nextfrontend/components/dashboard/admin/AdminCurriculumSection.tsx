'use client'

import { useState } from 'react'
import { AdminCurriculumCatalog } from './AdminCurriculumCatalog'
import { AdminTechniqueManager } from './AdminTechniqueManager'
import type { AdminBeltRankSummary, AdminTechniqueSummary } from '@/types/dashboard'

interface AdminCurriculumSectionProps {
    ranks: AdminBeltRankSummary[]
    techniques: AdminTechniqueSummary[]
    canReorder: boolean
}

/**
 * Comparte el grado seleccionado entre el catálogo curricular y el catálogo de
 * técnicas, para que al crear una técnica se pueda asociar al grado activo y
 * (opcionalmente) asignarla a sus alumnos.
 */
export function AdminCurriculumSection({ ranks, techniques, canReorder }: AdminCurriculumSectionProps) {
    const [selectedRankId, setSelectedRankId] = useState(ranks[0]?.id ?? '')
    const selectedRank = ranks.find(({ id }) => id === selectedRankId) ?? ranks[0] ?? null

    return (
        <>
            <AdminCurriculumCatalog
                canReorder={canReorder}
                onSelectRank={setSelectedRankId}
                ranks={ranks}
                selectedRankId={selectedRankId}
                techniques={techniques}
            />
            <div className="mt-8 border-t border-edge" />
            <AdminTechniqueManager ranks={ranks} selectedRank={selectedRank} techniques={techniques} />
        </>
    )
}
