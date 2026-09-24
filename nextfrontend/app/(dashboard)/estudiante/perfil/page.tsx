import { auth } from '@/auth'
import { StudentProfileActions } from '@/components/dashboard/student/StudentProfileActions'
import { StudentProfileDetails } from '@/components/dashboard/student/StudentProfileDetails'
import { StudentDocuments } from '@/components/dashboard/student/StudentDocuments'
import { getStudentDashboardSummary, getStudentDocuments } from '@/lib/dashboard/student-queries'
import { getFamilyMembers, resolveStudentView } from '@/lib/family/guardians'
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

    // True cuando el expediente activo es el de un hijo (el padre lo está viendo),
    // para mostrar el contexto "perfil del hijo" y restringir la edición.
    const familyMembers = hasAnyRole(session.user, ['GUARDIAN']) ? await getFamilyMembers(session.user.id) : null
    const isChildView = Boolean(familyMembers && view.studentId !== (familyMembers.self?.id ?? null))

    return (
        <>
            <StudentProfileDetails profile={summary.profile} isChildView={isChildView} />
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pb-8 sm:px-6 lg:px-8">
                <p className="text-sm text-ink-3">
                    {isChildView
                        ? `¿Necesitas actualizar el teléfono, el contacto de emergencia o las notas médicas de ${summary.profile.firstName}?`
                        : '¿Necesitas actualizar tu nombre, fecha de nacimiento, teléfono, contacto de emergencia o notas médicas?'}
                </p>
                <StudentProfileActions profile={summary.profile} studentId={view.studentId} restricted={isChildView} />
            </div>
            <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
                <StudentDocuments documents={documents} studentId={view.studentId} />
            </div>
        </>
    )
}