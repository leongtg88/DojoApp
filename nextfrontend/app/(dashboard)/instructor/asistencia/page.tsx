import { auth } from '@/auth'
import { InstructorAttendanceBoard } from '@/components/dashboard/instructor/InstructorAttendanceBoard'
import { InstructorAttendanceRoster } from '@/components/dashboard/instructor/InstructorAttendanceRoster'
import { getInstructorAttendanceBoard, getInstructorAttendanceRoster, getInstructorClasses } from '@/lib/dashboard/instructor-queries'
import { redirect } from 'next/navigation'

interface InstructorAttendancePageProps {
    searchParams: Promise<{ classId?: string; date?: string }>
}

export default async function InstructorAttendancePage({ searchParams }: InstructorAttendancePageProps) {
    const session = await auth()

    if (session?.user?.role !== 'INSTRUCTOR' || !session.user.id) {
        redirect('/dashboard/no-autorizado')
    }

    const parameters = await searchParams
    const classes = await getInstructorClasses(session.user.id)
    const selectedClassId = parameters.classId ?? classes[0]?.id
    const date = parameters.date ?? new Date().toISOString().slice(0, 10)
    const [roster, board] = await Promise.all([
        selectedClassId ? getInstructorAttendanceRoster(session.user.id, selectedClassId, date) : null,
        getInstructorAttendanceBoard(session.user.id),
    ])

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Asistencia</h1>
            <p className="mt-2 text-sm text-neutral-400">Pase de lista por clase y revisión de los punch-ins de tus alumnos.</p>

            <form className="mt-7 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-[#161b22] p-5" method="get">
                <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-semibold text-neutral-200" htmlFor="classId">
                    Clase
                    <select className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" defaultValue={selectedClassId} id="classId" name="classId">
                        {classes.map((scheduledClass) => <option key={scheduledClass.id} value={scheduledClass.id}>{scheduledClass.name}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-200" htmlFor="date">
                    Fecha
                    <input className="rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" defaultValue={date} id="date" name="date" type="date" />
                </label>
                <button className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117]" type="submit">Cargar</button>
            </form>

            {roster ? (
                <InstructorAttendanceRoster roster={roster} />
            ) : (
                <p className="mt-6 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-8 text-sm text-neutral-400">No tienes clases asignadas o no puedes acceder a la clase solicitada.</p>
            )}

            <section className="mt-10">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Punch-ins de tus alumnos</p>
                <h2 className="mt-1 font-display text-xl font-bold text-white">Revisión de marcaciones</h2>
                <div className="mt-4">
                    <InstructorAttendanceBoard data={board} />
                </div>
            </section>
        </main>
    )
}