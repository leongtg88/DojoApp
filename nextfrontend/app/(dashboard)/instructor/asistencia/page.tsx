import { auth } from '@/auth'
// import { InstructorAttendanceBoard } from '@/components/dashboard/instructor/InstructorAttendanceBoard'
import { InstructorAttendanceRoster } from '@/components/dashboard/instructor/InstructorAttendanceRoster'
import { InstructorJustificationBoard } from '@/components/dashboard/instructor/InstructorJustificationBoard'
import { AttendanceScheduleFilter, type AttendanceScheduleGroup } from '@/components/dashboard/shared/AttendanceScheduleFilter'
import { getInstructorAttendanceRoster, getInstructorScheduleOptions } from '@/lib/dashboard/instructor-queries'
import { getInstructorPendingJustifications } from '@/lib/dashboard/absence-justifications'
import { latestSessionDate, resolveDefaultSessionClass, toDateKey, WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'

interface InstructorAttendancePageProps {
    searchParams: Promise<{ classId?: string; date?: string }>
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default async function InstructorAttendancePage({ searchParams }: InstructorAttendancePageProps) {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        redirect('/no-autorizado')
    }

    const parameters = await searchParams
    const now = new Date()
    const classes = await getInstructorScheduleOptions(session.user.id)
    const ownClasses = classes.filter((scheduledClass) => scheduledClass.isOwnClass)
    const defaultClass = resolveDefaultSessionClass(ownClasses.length > 0 ? ownClasses : classes, now)
    const selectedClassId = parameters.classId ?? defaultClass?.id ?? classes[0]?.id
    const selectedClass = classes.find((scheduledClass) => scheduledClass.id === selectedClassId) ?? null

    // La fecha se deriva del horario de la clase; `date` en la URL es un override manual.
    const sessionDate = selectedClass ? toDateKey(latestSessionDate(selectedClass.dayOfWeek, now)) : toDateKey(now)
    const date = parameters.date && /^\d{4}-\d{2}-\d{2}$/.test(parameters.date) ? parameters.date : sessionDate
    const dayMatches = selectedClass
        ? new Date(`${date}T00:00:00`).getDay() === selectedClass.dayOfWeek
        : true

    const [roster, pendingJustifications] = await Promise.all([
        selectedClassId ? getInstructorAttendanceRoster(session.user.id, selectedClassId, date) : null,
        getInstructorPendingJustifications(session.user.id),
    ])

    const groups: AttendanceScheduleGroup[] = []
    if (ownClasses.length > 0) {
        groups.push({
            label: 'Mis horarios',
            options: ownClasses.map((scheduledClass) => ({ id: scheduledClass.id, name: `${scheduledClass.name} · ${WEEKDAY_LONG[scheduledClass.dayOfWeek]} ${scheduledClass.startTime} · ${scheduledClass.branchName}` })),
        })
    }
    const otherClasses = classes.filter((scheduledClass) => !scheduledClass.isOwnClass)
    if (otherClasses.length > 0) {
        groups.push({
            label: 'Todos los horarios (solo lectura)',
            options: otherClasses.map((scheduledClass) => ({ id: scheduledClass.id, name: `${scheduledClass.name} · ${WEEKDAY_LONG[scheduledClass.dayOfWeek]} ${scheduledClass.startTime} · ${scheduledClass.branchName}` })),
        })
    }

    const classDayLabel = selectedClass ? WEEKDAY_LONG[selectedClass.dayOfWeek] ?? null : null

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Panel de instructor</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Asistencia</h1>
            <p className="mt-2 text-xs text-ink-3">Pase de lista por clase y revisión de las faltas reportadas por tus alumnos.</p>

            {roster ? (
                <InstructorAttendanceRoster roster={roster} />
            ) : (
                <p className="mt-6 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-8 text-xs text-ink-3">No tienes clases asignadas o no puedes acceder a la clase solicitada.</p>
            )}

            <section className="mt-8">
                <InstructorJustificationBoard justifications={pendingJustifications} />
            </section>

            <div className="mt-7">
                <AttendanceScheduleFilter
                    basePath="/dashboard/instructor/asistencia"
                    classDayLabel={classDayLabel}
                    dateLabel={dateFormatter.format(new Date(`${date}T00:00:00`))}
                    dayMatches={dayMatches}
                    defaultDate={sessionDate}
                    groups={groups}
                    overrideDate={parameters.date ?? null}
                    selectedClassId={selectedClassId ?? null}
                />
            </div>
        </main>
    )
}
