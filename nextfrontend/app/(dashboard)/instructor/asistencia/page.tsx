import { auth } from '@/auth'
import { ClipboardCheck, Inbox, Video } from 'lucide-react'
// import { InstructorAttendanceBoard } from '@/components/dashboard/instructor/InstructorAttendanceBoard'
import { InstructorAttendanceRoster } from '@/components/dashboard/instructor/InstructorAttendanceRoster'
import { InstructorJustificationBoard } from '@/components/dashboard/instructor/InstructorJustificationBoard'
import { AttendanceScheduleFilter, type AttendanceScheduleGroup } from '@/components/dashboard/shared/AttendanceScheduleFilter'
import { OnlineRecoveryPanel } from '@/components/dashboard/shared/OnlineRecoveryPanel'
import { getInstructorAttendanceRoster, getInstructorPendingCount, getInstructorScheduleOptions } from '@/lib/dashboard/instructor-queries'
import { getInstructorPendingJustifications } from '@/lib/dashboard/absence-justifications'
import { getOnlineRecoveryActor, getOnlineRecoveryPanelData } from '@/lib/dashboard/online-recovery'
import { latestSessionDate, resolveDefaultSessionClass, santoDomingoDayKey, WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'
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
    const recoveryActor = await getOnlineRecoveryActor(session.user.id)
    const classes = await getInstructorScheduleOptions(session.user.id)
    const ownClasses = classes.filter((scheduledClass) => scheduledClass.isOwnClass)
    const defaultClass = resolveDefaultSessionClass(ownClasses.length > 0 ? ownClasses : classes, now)
    const selectedClassId = parameters.classId ?? defaultClass?.id ?? classes[0]?.id
    const selectedClass = classes.find((scheduledClass) => scheduledClass.id === selectedClassId) ?? null

    // La fecha se deriva del horario de la clase; `date` en la URL es un override manual.
    const sessionDate = selectedClass ? santoDomingoDayKey(latestSessionDate(selectedClass.dayOfWeek, now)) : santoDomingoDayKey(now)
    const date = parameters.date && /^\d{4}-\d{2}-\d{2}$/.test(parameters.date) ? parameters.date : sessionDate
    const dayMatches = selectedClass
        ? new Date(`${date}T00:00:00`).getDay() === selectedClass.dayOfWeek
        : true

    const [roster, pendingJustifications, pendingPunches, recoveryData] = await Promise.all([
        selectedClassId ? getInstructorAttendanceRoster(session.user.id, selectedClassId, date) : null,
        getInstructorPendingJustifications(session.user.id),
        getInstructorPendingCount(session.user.id),
        recoveryActor ? getOnlineRecoveryPanelData(recoveryActor) : Promise.resolve(null),
    ])

    const pendingReviews = pendingJustifications.length
    const scheduledRecoveries = recoveryData?.recoveries.filter((recovery) => recovery.status === 'SCHEDULED').length ?? 0

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
            <p className="mt-2 text-xs text-ink-3">Modo tatami: pasa lista de la clase de hoy o la próxima y revisa lo pendiente.</p>

            <section className="mt-5 rounded-lg border border-edge bg-surface-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Pendientes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <a className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-xs font-bold text-ink-2 transition-colors hover:bg-surface-3" href="#pase-de-lista">
                        <ClipboardCheck aria-hidden="true" className="size-4 text-ok-text" />{pendingPunches} práctica{pendingPunches === 1 ? '' : 's'} por confirmar
                    </a>
                    <a className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-warn-text transition-colors hover:bg-amber-500/20" href="#justificaciones">
                        <Inbox aria-hidden="true" className="size-4" />{pendingReviews} justificaci{pendingReviews === 1 ? 'ón' : 'ones'}
                    </a>
                    <a className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-info-text transition-colors hover:bg-sky-500/20" href="#reposiciones">
                        <Video aria-hidden="true" className="size-4" />{scheduledRecoveries} reposici{scheduledRecoveries === 1 ? 'ón' : 'ones'} online
                    </a>
                </div>
            </section>

            <div className="mt-7 scroll-mt-24" id="pase-de-lista">
                <AttendanceScheduleFilter
                    basePath="/dashboard/instructor/asistencia"
                    classDayLabel={classDayLabel}
                    dateLabel={dateFormatter.format(new Date(`${date}T00:00:00`))}
                    dayMatches={dayMatches}
                    defaultDate={sessionDate}
                    groups={groups}
                    inSessionClassId={defaultClass?.id ?? null}
                    overrideDate={parameters.date ?? null}
                    selectedClassId={selectedClassId ?? null}
                />
            </div>

            {roster ? (
                <InstructorAttendanceRoster roster={roster} />
            ) : (
                <p className="mt-6 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-8 text-xs text-ink-3">No tienes clases asignadas o no puedes acceder a la clase solicitada.</p>
            )}

            <section className="mt-8 scroll-mt-24" id="justificaciones">
                <InstructorJustificationBoard justifications={pendingJustifications} />
            </section>

            {recoveryData && (
                <section className="mt-8 scroll-mt-24" id="reposiciones">
                    <OnlineRecoveryPanel
                        candidates={recoveryData.candidates}
                        currentUserId={session.user.id}
                        instructors={[]}
                        mode="instructor"
                        recoveries={recoveryData.recoveries}
                    />
                </section>
            )}
        </main>
    )
}
