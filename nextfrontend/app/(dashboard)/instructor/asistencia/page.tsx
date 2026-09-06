import { auth } from '@/auth'
import { InstructorAttendanceRoster } from '@/components/dashboard/instructor/InstructorAttendanceRoster'
import { getInstructorAttendanceRoster, getInstructorClasses } from '@/lib/dashboard/instructor-queries'
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
    const roster = selectedClassId
        ? await getInstructorAttendanceRoster(session.user.id, selectedClassId, date)
        : null

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Panel de instructor</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Tomar asistencia</h1>
            <form className="mt-7 flex flex-wrap items-end gap-3 border border-[#e5e2e1] bg-white p-5" method="get">
                <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-semibold text-[#1c1b1b]" htmlFor="classId">
                    Clase
                    <select className="border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" defaultValue={selectedClassId} id="classId" name="classId">
                        {classes.map((scheduledClass) => <option key={scheduledClass.id} value={scheduledClass.id}>{scheduledClass.name}</option>)}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1c1b1b]" htmlFor="date">
                    Fecha
                    <input className="border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" defaultValue={date} id="date" name="date" type="date" />
                </label>
                <button className="bg-[#5c403c] px-4 py-2.5 text-sm font-semibold text-white" type="submit">Cargar</button>
            </form>
            {roster ? <InstructorAttendanceRoster roster={roster} /> : <p className="mt-6 border border-[#e5e2e1] bg-white px-5 py-8 text-sm text-[#5c403c]">No tienes clases asignadas o no puedes acceder a la clase solicitada.</p>}
        </main>
    )
}