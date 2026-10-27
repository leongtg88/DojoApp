import { auth } from '@/auth'
import { EmptyState } from '@/components/common/EmptyState'
import { Tabs } from '@/components/common/Tabs'
import { AdminAbsencePolicyCard } from '@/components/dashboard/admin/AdminAbsencePolicyCard'
import { AdminAttendanceView } from '@/components/dashboard/admin/AdminAttendanceView'
import { AdminExpectedControls } from '@/components/dashboard/admin/AdminExpectedControls'
import { OnlineRecoveryPanel } from '@/components/dashboard/shared/OnlineRecoveryPanel'
import { AdminExpectedSummary } from '@/components/dashboard/admin/AdminExpectedSummary'
import { AdminExpectedTable } from '@/components/dashboard/admin/AdminExpectedTable'
import { AdminPassListPanel } from '@/components/dashboard/admin/AdminPassListPanel'
import type { AttendanceScheduleGroup } from '@/components/dashboard/shared/AttendanceScheduleFilter'
import { getAdminAttendanceRoster, getAdminInstructors, getAdminSchedules } from '@/lib/dashboard/admin-queries'
import { getAbsencePolicyAdminData } from '@/lib/dashboard/absence-policy-settings'
import { getOnlineRecoveryActor, getOnlineRecoveryPanelData } from '@/lib/dashboard/online-recovery'
import { latestSessionDate, resolveDefaultSessionClass, santoDomingoDayKey, WEEKDAY_LONG } from '@/lib/dashboard/schedule-utils'
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
    const recoveryActor = await getOnlineRecoveryActor(userId)
    const [classesResult, policyData, recoveryData, instructors] = await Promise.all([
        getAdminSchedules(userId),
        getAbsencePolicyAdminData(userId),
        recoveryActor ? getOnlineRecoveryPanelData(recoveryActor) : Promise.resolve(null),
        getAdminInstructors(userId),
    ])
    const classes = classesResult ?? []
    const activeClasses = classes.filter((scheduledClass) => scheduledClass.active)
    const defaultClass = resolveDefaultSessionClass(activeClasses, now)
    const selectedClassId = parameters.classId || defaultClass?.id || activeClasses[0]?.id || null
    const selectedClass = activeClasses.find((scheduledClass) => scheduledClass.id === selectedClassId) ?? null

    const sessionDate = selectedClass ? santoDomingoDayKey(latestSessionDate(selectedClass.dayOfWeek, now)) : santoDomingoDayKey(now)
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
            <p className="mt-2 text-xs text-ink-3">Pase de lista, reposiciones, auditoría y política en un solo lugar.</p>

            <div className="mt-7">
                <AdminExpectedControls
                    classDayLabel={classDayLabel}
                    dateLabel={dateFormatter.format(new Date(`${date}T00:00:00`))}
                    dayMatches={dayMatches}
                    defaultDate={sessionDate}
                    groups={groups}
                    hasRoster={Boolean(roster)}
                    inSessionClassId={defaultClass?.id ?? null}
                    overrideDate={parameters.date ?? null}
                    selectedClassId={selectedClassId}
                />
            </div>

            <div className="mt-6">
                <Tabs
                    items={[
                        {
                            id: 'pase',
                            label: 'Pase de lista',
                            content: roster ? (
                                <div className="space-y-6">
                                    <AdminExpectedSummary roster={roster} />
                                    <AdminPassListPanel roster={roster} />
                                </div>
                            ) : (
                                <EmptyState description="Elige una clase con el filtro de arriba para pasar lista." title="No hay una clase seleccionada" />
                            ),
                        },
                        {
                            id: 'reposiciones',
                            label: 'Reposiciones',
                            content: recoveryData ? (
                                <OnlineRecoveryPanel
                                    candidates={recoveryData.candidates}
                                    currentUserId={userId}
                                    instructors={instructors ?? []}
                                    mode="admin"
                                    recoveries={recoveryData.recoveries}
                                />
                            ) : (
                                <EmptyState description="Cuando haya faltas por reponer o clases online, aparecerán aquí." title="No hay reposiciones disponibles" />
                            ),
                        },
                        {
                            id: 'auditoria',
                            label: 'Auditoría',
                            content: (
                                <div className="space-y-6">
                                    {roster && <AdminExpectedTable roster={roster} />}
                                    <AdminAttendanceView />
                                </div>
                            ),
                        },
                        {
                            id: 'politica',
                            label: 'Política',
                            content: policyData ? (
                                <AdminAbsencePolicyCard
                                    initialPolicy={policyData.policy}
                                    initialSchoolId={policyData.selectedSchoolId}
                                    schools={policyData.schools}
                                />
                            ) : (
                                <EmptyState description="Configura la política de faltas de la escuela." title="No hay política configurada" />
                            ),
                        },
                    ]}
                    label="Secciones de asistencia"
                />
            </div>
        </main>
    )
}
