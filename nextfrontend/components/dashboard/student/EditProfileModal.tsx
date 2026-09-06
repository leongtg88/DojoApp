'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Save, X } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface EditProfileModalProps {
    onClose: () => void
    profile: StudentProfile
}

const fieldClass =
    'mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white outline-none focus:border-cyan-500'

export function EditProfileModal({ onClose, profile }: EditProfileModalProps) {
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
        onClose()
    }

    return (
        <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1117]/80 p-4 backdrop-blur-sm"
            role="dialog"
        >
            <div className="w-full max-w-lg rounded-xl border border-neutral-700 bg-[#161b22] shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                    <div>
                        <h2 className="font-display text-base font-bold text-white">Editar datos personales</h2>
                        <p className="mt-0.5 text-xs text-neutral-400">Los cambios quedan asociados a tu expediente de estudiante.</p>
                    </div>
                    <button
                        aria-label="Cerrar"
                        className="flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                        onClick={onClose}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                </div>

                <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
                    <label className="block text-sm font-semibold text-neutral-200" htmlFor="edit-phone">
                        Teléfono
                        <input
                            className={fieldClass}
                            id="edit-phone"
                            onChange={(event) => setContactPhone(event.target.value)}
                            type="tel"
                            value={contactPhone}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-neutral-200" htmlFor="edit-emergency">
                        Contacto de emergencia
                        <textarea
                            className={fieldClass}
                            id="edit-emergency"
                            onChange={(event) => setEmergencyContact(event.target.value)}
                            rows={3}
                            value={emergencyContact}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-neutral-200" htmlFor="edit-medical">
                        Información médica relevante
                        <textarea
                            className={fieldClass}
                            id="edit-medical"
                            onChange={(event) => setMedicalInfo(event.target.value)}
                            rows={4}
                            value={medicalInfo}
                        />
                    </label>

                    {error && <p className="text-sm font-medium text-red-300">{error}</p>}

                    <div className="flex flex-col-reverse gap-2 border-t border-neutral-800 pt-4 sm:flex-row sm:justify-end">
                        <button
                            className="rounded-md border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
                            onClick={onClose}
                            type="button"
                        >
                            Cancelar
                        </button>
                        <button
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSaving}
                            type="submit"
                        >
                            {isSaving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
                            {isSaving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}