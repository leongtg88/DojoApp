'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

    function openConversion(enrollment: AdminEnrollmentSummary) {
        const parts = enrollment.applicantName?.trim().split(/\s+/) ?? []
        setSelectedEnrollment(enrollment)
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
        setDateOfBirth('')
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
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Inscripciones pendientes</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Solicitudes recibidas desde el asistente de inscripción.</p>
            {enrollments.length === 0 ? (
                <p className="mt-7 border border-[#e5e2e1] bg-white px-5 py-8 text-sm text-[#5c403c]">No hay inscripciones pendientes.</p>
            ) : (
                <ul className="mt-7 divide-y divide-[#e5e2e1] border border-[#e5e2e1] bg-white">
                    {enrollments.map((enrollment) => (
                        <li className="px-5 py-4" key={enrollment.id}>
                            <p className="text-sm font-semibold text-[#1c1b1b]">{enrollment.applicantName ?? 'Nombre pendiente'}</p>
                            <p className="mt-1 text-sm text-[#5c403c]">{enrollment.contactEmail} · {enrollment.contactPhone ?? 'Sin teléfono'}</p>
                            <p className="mt-2 text-xs text-[#5c403c]">{enrollment.interest ?? 'Sin programa'} · {enrollment.schedule ?? 'Sin horario'} · {formatter.format(new Date(enrollment.createdAt))}</p>
                            <button className="mt-3 border border-[#b70011] px-3 py-2 text-sm font-semibold text-[#b70011]" onClick={() => openConversion(enrollment)} type="button">
                                Convertir en alumno
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {selectedEnrollment && (
                <form className="mt-6 border border-[#e5e2e1] bg-white p-5" onSubmit={convertEnrollment}>
                    <h2 className="font-display text-lg font-bold text-[#1c1b1b]">Completar expediente de alumno</h2>
                    <p className="mt-1 text-sm text-[#5c403c]">Se creará el expediente sin cuenta de acceso. La cuenta se invita en un paso posterior.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-[#1c1b1b]" htmlFor="firstName">Nombre
                            <input className="mt-1.5 block w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" id="firstName" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
                        </label>
                        <label className="text-sm font-semibold text-[#1c1b1b]" htmlFor="lastName">Apellido
                            <input className="mt-1.5 block w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" id="lastName" onChange={(event) => setLastName(event.target.value)} required value={lastName} />
                        </label>
                        <label className="text-sm font-semibold text-[#1c1b1b]" htmlFor="dateOfBirth">Fecha de nacimiento
                            <input className="mt-1.5 block w-full border border-[#d8d1cf] bg-[#fcf9f8] px-3 py-2 text-sm" id="dateOfBirth" onChange={(event) => setDateOfBirth(event.target.value)} required type="date" value={dateOfBirth} />
                        </label>
                    </div>
                    {error && <p className="mt-4 text-sm font-medium text-[#b70011]">{error}</p>}
                    <div className="mt-5 flex gap-3">
                        <button className="bg-[#b70011] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Convirtiendo...' : 'Crear alumno'}</button>
                        <button className="border border-[#d8d1cf] px-4 py-2.5 text-sm font-semibold text-[#5c403c]" onClick={() => setSelectedEnrollment(null)} type="button">Cancelar</button>
                    </div>
                </form>
            )}
        </main>
    )
}