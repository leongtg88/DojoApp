import { auth } from '@/auth'
import { StudentProfileActions } from '@/components/dashboard/student/StudentProfileActions'
import { StudentProfileDetails } from '@/components/dashboard/student/StudentProfileDetails'
import { StudentDocuments } from '@/components/dashboard/student/StudentDocuments'
import { getStudentDashboardSummary, getStudentDocuments } from '@/lib/dashboard/student-queries'
import { redirect } from 'next/navigation'

export default async function StudentProfilePage() {
    if ((await auth())?.user?.role !== 'STUDENT') {
        redirect('/dashboard/no-autorizado')
    }

    const session = await auth()
    const [summary, documents] = session?.user?.id ? await Promise.all([getStudentDashboardSummary(session.user.id), getStudentDocuments(session.user.id)]) : [null, null]

    if (!summary || !documents) {
        redirect('/dashboard/estudiante')
    }

    return (
        <>
            <StudentProfileDetails profile={summary.profile} />
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 pb-8 sm:px-6 lg:px-8">
                <p className="text-sm text-neutral-400">¿Necesitas actualizar tu teléfono, contacto de emergencia o notas médicas?</p>
                <StudentProfileActions profile={summary.profile} />
            </div>
            <div className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 lg:px-8">
                <StudentDocuments documents={documents} />
            </div>
        </>
    )
}