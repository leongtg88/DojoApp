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
    'mt-1.5 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-cyan-500'

export function EditProfileModal({ onClose, profile }: EditProfileModalProps) {
    const router = useRouter()
    const [firstName, setFirstName] = useState(profile.firstName)
    const [lastName, setLastName] = useState(profile.lastName)
    const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth.slice(0, 10))
    const [contactPhone, setContactPhone] = useState(profile.contactPhone ?? '')
    const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact ?? '')
    const [medicalInfo, setMedicalInfo] = useState(profile.medicalInfo ?? '')
    const [giSize, setGiSize] = useState(profile.giSize ?? '')
    const [beltSize, setBeltSize] = useState(profile.beltSize ?? '')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setIsSaving(true)

        const body: Record<string, unknown> = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            contactPhone: contactPhone.trim() || null,
            emergencyContact: emergencyContact.trim() || null,
            medicalInfo: medicalInfo.trim() || null,
            giSize: giSize.trim() || null,
            beltSize: beltSize.trim() || null,
        }
        if (dateOfBirth) {
            body.dateOfBirth = dateOfBirth
        }

        const response = await fetch('/api/dashboard/student/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-1/80 p-4 backdrop-blur-sm"
            role="dialog"
        >
            <div className="w-full max-w-lg rounded-xl border border-edge-strong bg-surface-2 shadow-2xl">
                <div className="flex items-center justify-between border-b border-edge px-5 py-4">
                    <div>
                        <h2 className="font-display text-base font-bold text-ink">Editar datos personales</h2>
                        <p className="mt-0.5 text-xs text-ink-3">Los cambios quedan asociados a tu expediente de estudiante.</p>
                    </div>
                    <button
                        aria-label="Cerrar"
                        className="flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                        onClick={onClose}
                        type="button"
                    >
                        <X aria-hidden="true" className="size-4" />
                    </button>
                </div>

                <form className="space-y-4 px-5 py-5" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-ink" htmlFor="edit-firstname">
                            Nombre
                            <input
                                className={fieldClass}
                                id="edit-firstname"
                                maxLength={80}
                                onChange={(event) => setFirstName(event.target.value)}
                                type="text"
                                value={firstName}
                            />
                        </label>

                        <label className="block text-sm font-semibold text-ink" htmlFor="edit-lastname">
                            Apellido
                            <input
                                className={fieldClass}
                                id="edit-lastname"
                                maxLength={120}
                                onChange={(event) => setLastName(event.target.value)}
                                type="text"
                                value={lastName}
                            />
                        </label>
                    </div>

                    <label className="block text-sm font-semibold text-ink" htmlFor="edit-dob">
                        Fecha de nacimiento
                        <input
                            className={fieldClass}
                            id="edit-dob"
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(event) => setDateOfBirth(event.target.value)}
                            type="date"
                            value={dateOfBirth}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-ink" htmlFor="edit-phone">
                        Teléfono
                        <input
                            className={fieldClass}
                            id="edit-phone"
                            onChange={(event) => setContactPhone(event.target.value)}
                            type="tel"
                            value={contactPhone}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-ink" htmlFor="edit-emergency">
                        Contacto de emergencia
                        <textarea
                            className={fieldClass}
                            id="edit-emergency"
                            onChange={(event) => setEmergencyContact(event.target.value)}
                            rows={3}
                            value={emergencyContact}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-ink" htmlFor="edit-medical">
                        Información médica relevante
                        <textarea
                            className={fieldClass}
                            id="edit-medical"
                            onChange={(event) => setMedicalInfo(event.target.value)}
                            rows={4}
                            value={medicalInfo}
                        />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-semibold text-ink" htmlFor="edit-gi-size">
                            Talla de karategi (uniforme)
                            <input
                                className={fieldClass}
                                id="edit-gi-size"
                                maxLength={20}
                                onChange={(event) => setGiSize(event.target.value)}
                                placeholder="Ej: 2, 160 cm, Adulto M"
                                type="text"
                                value={giSize}
                            />
                        </label>

                        <label className="block text-sm font-semibold text-ink" htmlFor="edit-belt-size">
                            Talla de cinturón
                            <input
                                className={fieldClass}
                                id="edit-belt-size"
                                maxLength={20}
                                onChange={(event) => setBeltSize(event.target.value)}
                                placeholder="Ej: 160, 180 cm"
                                type="text"
                                value={beltSize}
                            />
                        </label>
                    </div>

                    {error && <p className="text-sm font-medium text-danger-text">{error}</p>}

                    <div className="flex flex-col-reverse gap-2 border-t border-edge pt-4 sm:flex-row sm:justify-end">
                        <button
                            className="rounded-md border border-edge-strong px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
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