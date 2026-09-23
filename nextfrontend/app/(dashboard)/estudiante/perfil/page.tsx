import { auth } from '@/auth'
import { StudentProfileActions } from '@/components/dashboard/student/StudentProfileActions'
import { StudentProfileDetails } from '@/components/dashboard/student/StudentProfileDetails'
import { StudentDocuments } from '@/components/dashboard/student/StudentDocuments'
import { getStudentDashboardSummary, getStudentDocuments } from '@/lib/dashboard/student-queries'
import { resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentProfilePageProps {
    searchParams: Promise<{ estudiante?: string }>
}

export default async function StudentProfilePage({ searchParams }: StudentProfilePageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(session.user.id, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const [summary, documents] = await Promise.all([getStudentDashboardSummary(view.studentId), getStudentDocuments(view.studentId)])

    if (!summary || !documents) {
        redirect('/dashboard/estudiante')
    }

    return (
        <>
            <StudentProfileDetails profile={summary.profile} />
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pb-8 sm:px-6 lg:px-8">
                <p className="text-sm text-ink-3">¿Necesitas actualizar tu nombre, fecha de nacimiento, teléfono, contacto de emergencia o notas médicas?</p>
                <StudentProfileActions profile={summary.profile} studentId={view.studentId} />
            </div>
            <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
                <StudentDocuments documents={documents} studentId={view.studentId} />
            </div>
        </>
    )
}