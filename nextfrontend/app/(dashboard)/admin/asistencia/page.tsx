import { auth } from '@/auth'
import { AdminAttendanceView } from '@/components/dashboard/admin/AdminAttendanceView'
import { AdminExpectedControls } from '@/components/dashboard/admin/AdminExpectedControls'
import { AdminExpectedSummary } from '@/components/dashboard/admin/AdminExpectedSummary'
import { AdminExpectedTable } from '@/components/dashboard/admin/AdminExpectedTable'
import { AdminPassListPanel } from '@/components/dashboard/admin/AdminPassListPanel'
import type { AttendanceScheduleGroup } from '@/components/dashboard/shared/AttendanceScheduleFilter'
import { getAdminAttendanceRoster, getAdminSchedules } from '@/lib/dashboard/admin-queries'
import { latestSessionDate, resolveDefaultSessionClass, toDateKey, WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface AdminAttendancePageProps {
    searchParams: Promise<{ classId?: string; date?: string }>
}

const dateFormatter = new Intl.DateTimeFormat('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default async function AdminAttendancePage({ searchParams }: AdminAttendancePageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const parameters = await searchParams
    const now = new Date()
    const classes = (await getAdminSchedules(userId)) ?? []
    const activeClasses = classes.filter((scheduledClass) => scheduledClass.active)
    const defaultClass = resolveDefaultSessionClass(activeClasses, now)
    const selectedClassId = parameters.classId || defaultClass?.id || activeClasses[0]?.id || null
    const selectedClass = activeClasses.find((scheduledClass) => scheduledClass.id === selectedClassId) ?? null

    const sessionDate = selectedClass ? toDateKey(latestSessionDate(selectedClass.dayOfWeek, now)) : toDateKey(now)
    const date = parameters.date && /^\d{4}-\d{2}-\d{2}$/.test(parameters.date) ? parameters.date : sessionDate
    const dayMatches = selectedClass
        ? new Date(`${date}T00:00:00`).getDay() === selectedClass.dayOfWeek
        : true

    const roster = selectedClassId ? await getAdminAttendanceRoster(userId, selectedClassId, date) : null

    const groups: AttendanceScheduleGroup[] = activeClasses.length > 0
        ? [{ label: null, options: activeClasses.map((scheduledClass) => ({ id: scheduledClass.id, name: `${scheduledClass.name} · ${WEEKDAY_LONG[scheduledClass.dayOfWeek]} ${scheduledClass.startTime} · ${scheduledClass.branchName}` })) }]
        : []
    const classDayLabel = selectedClass ? WEEKDAY_LONG[selectedClass.dayOfWeek] ?? null : null

    return (
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Administración</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink">Asistencia</h1>
            <div className="mt-6 space-y-6">
                {roster && <AdminExpectedSummary roster={roster} />}
                <AdminExpectedControls
                    classDayLabel={classDayLabel}
                    dateLabel={dateFormatter.format(new Date(`${date}T00:00:00`))}
                    dayMatches={dayMatches}
                    defaultDate={sessionDate}
                    groups={groups}
                    hasRoster={Boolean(roster)}
                    overrideDate={parameters.date ?? null}
                    selectedClassId={selectedClassId}
                />
                {roster && <AdminPassListPanel roster={roster} />}
                {roster && <AdminExpectedTable roster={roster} />}
                <AdminAttendanceView />
            </div>
        </main>
    )
}
