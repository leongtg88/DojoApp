'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilePlus2, Trash2 } from 'lucide-react'
import type { AdminEnrollmentSummary } from '@/types/dashboard'

interface AdminEnrollmentsProps {
    enrollments: AdminEnrollmentSummary[]
}

export function AdminEnrollments({ enrollments }: AdminEnrollmentsProps) {
    const router = useRouter()
    const [selectedEnrollment, setSelectedEnrollment] = useState<AdminEnrollmentSummary | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [gender, setGender] = useState<'female' | 'male' | ''>('')
    const [applicantId, setApplicantId] = useState('')

    function sexoToGender(sexo: unknown): 'female' | 'male' | '' {
        if (sexo === 'Femenino') return 'female'
        if (sexo === 'Masculino') return 'male'
        return ''
    }

    function openConversion(enrollment: AdminEnrollmentSummary) {
        console.log('[convertir-alumno] abrir formulario para:', enrollment.id, enrollment.applicantName)
        const applicant = enrollment.applicants[0]
        const parts = (applicant?.name ?? enrollment.applicantName ?? '').trim().split(/\s+/)
        setSelectedEnrollment(enrollment)
        setFirstName(parts[0] ?? '')
        setLastName(parts.slice(1).join(' '))
        setDateOfBirth(applicant?.dateOfBirth.slice(0, 10) ?? '')
        setGender(sexoToGender(applicant?.profileData?.sexo))
        setApplicantId(applicant?.id ?? '')
        setError(null)
    }

    async function deleteEnrollment(enrollment: AdminEnrollmentSummary) {
        const applicantCount = enrollment.applicants.length
        const label = enrollment.applicantName ?? 'esta inscripción'
        const message = applicantCount > 0
            ? `¿Eliminar la inscripción de ${label}? Se borrarán ${applicantCount} aspirante${applicantCount === 1 ? '' : 's'} y sus documentos. Esta acción no se puede deshacer.`
            : `¿Eliminar la inscripción de ${label}? Esta acción no se puede deshacer.`
        if (!window.confirm(message)) return

        setError(null)
        setIsSaving(true)
        try {
            const response = await fetch(`/api/dashboard/admin/enrollments/${enrollment.id}`, { method: 'DELETE' })

            const payload = await response.json().catch(() => ({})) as { error?: string }

            if (!response.ok) {
                setError(payload.error ?? 'No fue posible eliminar esta inscripción.')
                return
            }

            router.refresh()
        } catch (reason: unknown) {
            console.error('[eliminar-inscripcion] error al eliminar:', reason)
            setError(reason instanceof Error ? reason.message : 'No fue posible eliminar esta inscripción. Verifica tu conexión e inténtalo nuevamente.')
        } finally {
            setIsSaving(false)
        }
    }

    async function convertEnrollment(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!selectedEnrollment) {
            return
        }

        setError(null)
        setIsSaving(true)
        try {
            const response = await fetch(`/api/dashboard/admin/enrollments/${selectedEnrollment.id}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    dateOfBirth,
                    gender: gender || undefined,
                    applicantId: applicantId || undefined,
                    contactPhone: selectedEnrollment.contactPhone,
                    medicalInfo: null,
                    emergencyContact: null,
                }),
            })

            const payload = await response.json().catch(() => ({})) as { error?: string }

            if (!response.ok) {
                setError(payload.error ?? 'No fue posible convertir esta inscripción. Verifica los datos e inténtalo nuevamente.')
                return
            }

            setSelectedEnrollment(null)
            router.refresh()
        } catch (reason: unknown) {
            console.error('[convertir-alumno] error al convertir:', reason)
            setError(reason instanceof Error ? reason.message : 'No fue posible convertir esta inscripción. Verifica tu conexión e inténtalo nuevamente.')
        } finally {
            setIsSaving(false)
        }
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
                            <p className="mt-2 text-xs text-neutral-400">{enrollment.interest ?? 'Sin programa'} · {enrollment.schedule ?? 'Sin horario'} · {enrollment.createdAtLabel ?? enrollment.createdAt}</p>
                            {enrollment.applicants.length > 0 && <p className="mt-1 text-xs font-semibold text-cyan-300">{enrollment.applicants.length} aspirante{enrollment.applicants.length === 1 ? '' : 's'} pendiente{enrollment.applicants.length === 1 ? '' : 's'}</p>}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button className="rounded-md border border-cyan-500/40 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-60" disabled={isSaving} onClick={() => openConversion(enrollment)} type="button">
                                    Convertir en alumno
                                </button>
                                <button className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60" disabled={isSaving} onClick={() => deleteEnrollment(enrollment)} type="button"><Trash2 aria-hidden="true" className="size-4" />Eliminar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {selectedEnrollment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedEnrollment(null)} role="dialog" aria-modal="true" aria-label="Completar expediente de alumno">
                    <form className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-neutral-800 bg-[#161b22] p-5" onClick={(event) => event.stopPropagation()} onSubmit={convertEnrollment}>
                        <h2 className="font-display text-lg font-bold text-white">Completar expediente de alumno</h2>
                        <p className="mt-1 text-sm text-neutral-400">Se creará el expediente sin cuenta de acceso. La cuenta se invita en un paso posterior.</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {selectedEnrollment.applicants.length > 1 && <label className="sm:col-span-2 text-sm font-semibold text-neutral-200" htmlFor="applicantId">Aspirante
                                <select className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="applicantId" onChange={(event) => { const applicant = selectedEnrollment.applicants.find(({ id }) => id === event.target.value); setApplicantId(event.target.value); const parts = applicant?.name.split(/\s+/) ?? []; setFirstName(parts[0] ?? ''); setLastName(parts.slice(1).join(' ')); setDateOfBirth(applicant?.dateOfBirth.slice(0, 10) ?? ''); setGender(sexoToGender(applicant?.profileData?.sexo)) }} value={applicantId}>{selectedEnrollment.applicants.map((applicant) => <option key={applicant.id} value={applicant.id}>{applicant.name}</option>)}</select>
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
                            <label className="text-sm font-semibold text-neutral-200" htmlFor="gender">Sexo
                                <select className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="gender" onChange={(event) => setGender(event.target.value as 'female' | 'male' | '')} value={gender}>
                                    <option value="">No especificado</option>
                                    <option value="female">Femenino</option>
                                    <option value="male">Masculino</option>
                                </select>
                            </label>
                        </div>
                        {error && <p className="mt-4 text-sm font-medium text-red-300">{error}</p>}
                        <div className="mt-5 flex gap-3">
                            <button className="rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:opacity-60" disabled={isSaving} type="submit">{isSaving ? 'Convirtiendo...' : 'Crear alumno'}</button>
                            <button className="rounded-md border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-800" onClick={() => setSelectedEnrollment(null)} type="button">Cancelar</button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    )
}