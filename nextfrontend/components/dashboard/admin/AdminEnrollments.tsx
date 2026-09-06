'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilePlus2 } from 'lucide-react'
import type { AdminEnrollmentSummary } from '@/types/dashboard'

interface AdminEnrollmentsProps {
    enrollments: AdminEnrollmentSummary[]
}

export function AdminEnrollments({ enrollments }: AdminEnrollmentsProps) {
    const router = useRouter()
    const formatter = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
    const [selectedEnrollment, setSelectedEnrollment] = useState<AdminEnrollmentSummary | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [applicantId, setApplicantId] = useState('')

    function openConversion(enrollment: AdminEnrollmentSummary) {
        const applicant = enrollment.applicants[0]
        const parts = (applicant?.name ?? enrollment.applicantName ?? '').trim().split(/\s+/)
        setSelectedEnrollment(enrollment)
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
        setDateOfBirth(applicant?.dateOfBirth.slice(0, 10) ?? '')
        setApplicantId(applicant?.id ?? '')
        setError(null)
    }

    async function convertEnrollment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedEnrollment) {
            return
        }

        setError(null)
        setIsSaving(true)
        const response = await fetch(`/api/dashboard/admin/enrollments/${selectedEnrollment.id}/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                dateOfBirth,
                applicantId: applicantId || undefined,
                contactPhone: selectedEnrollment.contactPhone,
                medicalInfo: null,
                emergencyContact: null,
            }),
        })
        setIsSaving(false)

        if (!response.ok) {
            setError('No fue posible convertir esta inscripción. Verifica los datos e inténtalo nuevamente.')
            return
        }

        setSelectedEnrollment(null)
        router.refresh()
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <header>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Inscripciones pendientes</h1>
                <p className="mt-2 text-sm text-neutral-400">Solicitudes recibidas desde el asistente de inscripción.</p>
            </header>
            {enrollments.length === 0 ? (
                <section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
                    <FilePlus2 aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
                    <p className="mt-3 text-sm font-semibold text-white">No hay inscripciones pendientes.</p>
                    <p className="mt-1 text-sm text-neutral-400">Las nuevas solicitudes aparecerán aquí para completar su expediente.</p>
                </section>
            ) : (
                <ul className="mt-7 divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-[#161b22]">
                    {enrollments.map((enrollment) => (
                        <li className="px-5 py-4" key={enrollment.id}>
                            <p className="text-sm font-semibold text-white">{enrollment.applicantName ?? 'Nombre pendiente'}</p>
                            <p className="mt-1 text-sm text-neutral-300">{enrollment.contactEmail} · {enrollment.contactPhone ?? 'Sin teléfono'}</p>
                            <p className="mt-2 text-xs text-neutral-400">{enrollment.interest ?? 'Sin programa'} · {enrollment.schedule ?? 'Sin horario'} · {formatter.format(new Date(enrollment.createdAt))}</p>
                            {enrollment.applicants.length > 0 && <p className="mt-1 text-xs font-semibold text-cyan-300">{enrollment.applicants.length} aspirante{enrollment.applicants.length === 1 ? '' : 's'} pendiente{enrollment.applicants.length === 1 ? '' : 's'}</p>}
                            <button className="mt-3 rounded-md border border-cyan-500/40 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10" onClick={() => openConversion(enrollment)} type="button">
                                Convertir en alumno
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {selectedEnrollment && (
                <form className="mt-6 rounded-lg border border-neutral-800 bg-[#161b22] p-5" onSubmit={convertEnrollment}>
                    <h2 className="font-display text-lg font-bold text-white">Completar expediente de alumno</h2>
                    <p className="mt-1 text-sm text-neutral-400">Se creará el expediente sin cuenta de acceso. La cuenta se invita en un paso posterior.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {selectedEnrollment.applicants.length > 1 && <label className="sm:col-span-2 text-sm font-semibold text-neutral-200" htmlFor="applicantId">Aspirante
                            <select className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="applicantId" onChange={(event) => { const applicant = selectedEnrollment.applicants.find(({ id }) => id === event.target.value); setApplicantId(event.target.value); const parts = applicant?.name.split(/\s+/) ?? []; setFirstName(parts[0] ?? ''); setLastName(parts.slice(1).join(' ')); setDateOfBirth(applicant?.dateOfBirth.slice(0, 10) ?? '') }} value={applicantId}>{selectedEnrollment.applicants.map((applicant) => <option key={applicant.id} value={applicant.id}>{applicant.name}</option>)}</select>
                        </label>}
                        <label className="text-sm font-semibold text-neutral-200" htmlFor="firstName">Nombre
                            <input className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="firstName" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
                        </label>
                        <label className="text-sm font-semibold text-neutral-200" htmlFor="lastName">Apellido
                            <input className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="lastName" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
                        </label>
                        <label className="text-sm font-semibold text-neutral-200" htmlFor="dateOfBirth">Fecha de nacimiento
                            <input className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="dateOfBirth" onChange={(event) => setDateOfBirth(event.target.value)} required type="date" value={dateOfBirth} />
                        </label>
                    </div>
                    {error && <p className="mt-4 text-sm font-medium text-red-300">{error}</p>}
                    <div className="mt-5 flex gap-3">
                        <button className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Convirtiendo...' : 'Crear alumno'}</button>
                        <button className="rounded-md border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-800" onClick={() => setSelectedEnrollment(null)} type="button">Cancelar</button>
                    </div>
                </form>
            )}
        </main>
    )
}