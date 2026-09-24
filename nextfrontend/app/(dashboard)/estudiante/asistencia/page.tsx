import { auth } from '@/auth'
import { StudentAttendancePunch } from '@/components/dashboard/student/StudentAttendancePunch'
import { FamilyQuickSwitcher } from '@/components/dashboard/student/FamilyQuickSwitcher'
import { getStudentAttendancePunchData } from '@/lib/dashboard/student-queries'
import { getFamilyMembers, resolveStudentView } from '@/lib/family/guardians'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface StudentAttendancePageProps {
    searchParams: Promise<{ estudiante?: string }>
}

export default async function StudentAttendancePage({ searchParams }: StudentAttendancePageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) {
        redirect('/no-autorizado')
    }

    const { estudiante } = await searchParams
    const view = await resolveStudentView(session.user.id, estudiante)

    if (!view) {
        redirect('/no-autorizado')
    }

    const data = await getStudentAttendancePunchData(view.studentId)

    if (!data) {
        redirect('/dashboard/estudiante')
    }

    const familyMembers = hasAnyRole(session.user, ['GUARDIAN']) ? await getFamilyMembers(session.user.id) : null

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Mi asistencia</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Punch &amp; Seguimiento</h1>
            <p className="mt-2 text-sm text-ink-3">Marca tus prácticas y el Sensei confirma al finalizar el tatami.</p>
            {familyMembers && (
                <section className="mt-7">
                    <FamilyQuickSwitcher members={familyMembers} currentStudentId={view.studentId} baseHref="/dashboard/estudiante/asistencia" />
                </section>
            )}
            <section className="mt-7">
                <StudentAttendancePunch data={data} studentId={view.studentId} />
            </section>
        </main>
    )
}