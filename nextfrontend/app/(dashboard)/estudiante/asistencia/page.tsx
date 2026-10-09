import { auth } from '@/auth'
import { StudentAbsenceReport } from '@/components/dashboard/student/StudentAbsenceReport'
import { StudentPracticeLog } from '@/components/dashboard/student/StudentPracticeLog'
import { StudentAttendanceRecords } from '@/components/dashboard/student/StudentAttendanceRecords'
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
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Mi asistencia</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Asistencia &amp; Seguimiento</h1>
            <p className="mt-2 text-xs text-ink-3">Tu instructor registra tu asistencia en el pase de lista. Si faltaste, reporta el motivo aquí.</p>
            {familyMembers && (
                <section className="mt-7">
                    <FamilyQuickSwitcher members={familyMembers} currentStudentId={view.studentId} baseHref="/dashboard/estudiante/asistencia" />
                </section>
            )}
            <section className="mt-7 space-y-6">
                <StudentAbsenceReport schedule={data.schedule} justifications={data.justifications} studentId={view.studentId} />
                <StudentPracticeLog techniques={data.practiceTechniques} program={data.program} studentId={view.studentId} />
                <StudentAttendanceRecords records={data.records} />
            </section>
        </main>
    )
}