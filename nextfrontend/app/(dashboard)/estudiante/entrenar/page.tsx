import { auth } from '@/auth'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StudentPracticeLog } from '@/components/dashboard/student/StudentPracticeLog'
import { StudentSyllabus } from '@/components/dashboard/student/StudentSyllabus'
import { getStudentAttendancePunchData, getStudentDashboardSummary } from '@/lib/dashboard/student-queries'
import { resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentTrainingPageProps {
    searchParams: Promise<{ estudiante?: string }>
}

/**
 * UX-B1/B2 · Destino "Entrenar": katas, técnicas y registro de repeticiones.
 * Las APIs no cambian; solo se agrupa el contenido en un destino propio.
 */
export default async function StudentTrainingPage({ searchParams }: StudentTrainingPageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(session.user.id, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const [summary, data] = await Promise.all([
        getStudentDashboardSummary(view.studentId),
        getStudentAttendancePunchData(view.studentId),
    ])

    if (!summary || !data) {
        redirect('/dashboard/estudiante')
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">Portal del estudiante</p>
                    <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Entrenar</h1>
                    <p className="mt-2 text-xs text-ink-3">Tus katas y técnicas, y el registro de tu práctica.</p>
                </div>
                <Link className="inline-flex min-h-11 items-center gap-1 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-bold text-accent transition-colors hover:bg-surface-3" href={`/dashboard/estudiante/progreso${view.studentId ? `?estudiante=${encodeURIComponent(view.studentId)}` : ''}`}>
                    Ver mi grado
                    <ChevronRight aria-hidden="true" className="size-3.5" />
                </Link>
            </div>

            <div className="mt-7 space-y-6">
                <StudentPracticeLog program={data.program} studentId={view.studentId} techniques={data.practiceTechniques} />
                <StudentSyllabus techniques={summary.techniques} />
            </div>
        </main>
    )
}
