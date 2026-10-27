'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { AdminStudents } from './AdminStudents'
import { AdminStudentDetail } from './AdminStudentDetail'
import { SlideOver } from '@/components/common/SlideOver'
import { EmptyState } from '@/components/common/EmptyState'
import type { AdminStudentDetail as StudentDetail, AdminStudentSummary } from '@/types/dashboard'

interface AdminStudentsWorkspaceProps {
    students: AdminStudentSummary[]
    detail: StudentDetail | null
    selectedId: string | null
    initialDocsOnly: boolean
}

/**
 * UX-B8 · Workspace de Alumnos: padrón + expediente inline.
 *
 * Escritorio: dos columnas. Móvil: el expediente se abre en un `SlideOver`.
 * La selección se guarda en `?selected=` y no recarga la lista (navegación
 * cliente de Next). El listado conserva filtros y scroll.
 */
export function AdminStudentsWorkspace({ students, detail, selectedId, initialDocsOnly }: AdminStudentsWorkspaceProps) {
    const router = useRouter()
    const [closedFor, setClosedFor] = useState<string | null>(null)

    function selectStudent(studentId: string) {
        router.push(`/dashboard/admin/alumnos?selected=${encodeURIComponent(studentId)}`, { scroll: false })
    }

    const mobileOpen = Boolean(selectedId) && closedFor !== selectedId

    return (
        <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
                <AdminStudents
                    embedded
                    initialDocsOnly={initialDocsOnly}
                    onSelect={selectStudent}
                    selectedId={selectedId}
                    students={students}
                />

                <aside aria-label="Expediente del alumno" className="hidden xl:block">
                    {detail ? (
                        <div className="sticky top-20">
                            <AdminStudentDetail embedded student={detail} />
                        </div>
                    ) : (
                        <EmptyState
                            description="Elige una fila del padrón para ver sus datos, documentos y progreso."
                            icon={FileText}
                            title="Ningún alumno seleccionado"
                        />
                    )}
                </aside>
            </div>

            <div className="xl:hidden">
                <SlideOver
                    onClose={() => setClosedFor(selectedId)}
                    open={mobileOpen}
                    title="Expediente del alumno"
                >
                    {detail ? <AdminStudentDetail embedded student={detail} /> : null}
                </SlideOver>
            </div>
        </main>
    )
}
