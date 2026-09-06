'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface StudentProfileFormProps {
    profile: StudentProfile
}

export function StudentProfileForm({ profile }: StudentProfileFormProps) {
    const router = useRouter()
    const [contactPhone, setContactPhone] = useState(profile.contactPhone ?? '')
    const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact ?? '')
    const [medicalInfo, setMedicalInfo] = useState(profile.medicalInfo ?? '')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setIsSaving(true)

        const response = await fetch('/api/dashboard/student/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contactPhone: contactPhone.trim() || null,
                emergencyContact: emergencyContact.trim() || null,
                medicalInfo: medicalInfo.trim() || null,
            }),
        })

        setIsSaving(false)

        if (!response.ok) {
            setError('No fue posible actualizar tu perfil. Inténtalo nuevamente.')
            return
        }

        router.refresh()
    }

    return (
        <section className="mt-8 rounded-lg border border-neutral-800 bg-[#161b22] p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white">Actualizar datos de contacto</h2>
            <p className="mt-1 text-sm text-neutral-400">Los cambios quedan asociados a tu expediente de estudiante.</p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-semibold text-neutral-200" htmlFor="contact-phone">
                    Teléfono
                    <input
                        className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        id="contact-phone"
                        onChange={(event) => setContactPhone(event.target.value)}
                        type="tel"
                        value={contactPhone}
                    />
                </label>

                <label className="block text-sm font-semibold text-neutral-200" htmlFor="emergency-contact">
                    Contacto de emergencia
                    <textarea
                        className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        id="emergency-contact"
                        onChange={(event) => setEmergencyContact(event.target.value)}
                        rows={3}
                        value={emergencyContact}
                    />
                </label>

                <label className="block text-sm font-semibold text-neutral-200" htmlFor="medical-info">
                    Información médica relevante
                    <textarea
                        className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
                        id="medical-info"
                        onChange={(event) => setMedicalInfo(event.target.value)}
                        rows={4}
                        value={medicalInfo}
                    />
                </label>

                {error && <p className="text-sm font-medium text-red-300">{error}</p>}

                <button
                    className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSaving}
                    type="submit"
                >
                    <Save aria-hidden="true" className="size-4" />
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </form>
        </section>
    )
}