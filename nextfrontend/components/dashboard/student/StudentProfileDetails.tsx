import { HeartPulse, Phone, ShieldAlert, UserRound } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface StudentProfileDetailsProps {
    profile: StudentProfile
}

export function StudentProfileDetails({ profile }: StudentProfileDetailsProps) {
    const dateOfBirth = new Intl.DateTimeFormat('es-DO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(profile.dateOfBirth))

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Mi perfil</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Datos personales</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Información registrada en tu expediente del dojo.</p>

            <section className="mt-7 divide-y divide-[#e5e2e1] border border-[#e5e2e1] bg-white">
                <ProfileRow icon={UserRound} label="Nombre completo" value={`${profile.firstName} ${profile.lastName}`} />
                <ProfileRow icon={Phone} label="Teléfono" value={profile.contactPhone ?? 'No registrado'} />
                <ProfileRow icon={UserRound} label="Correo electrónico" value={profile.email ?? 'No registrado'} />
                <ProfileRow icon={UserRound} label="Fecha de nacimiento" value={dateOfBirth} />
                <ProfileRow icon={ShieldAlert} label="Contacto de emergencia" value={profile.emergencyContact ?? 'No registrado'} />
                <ProfileRow icon={HeartPulse} label="Información médica" value={profile.medicalInfo ?? 'No registrada'} />
            </section>
        </main>
    )
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
    return (
        <div className="flex gap-3 px-5 py-4">
            <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#b70011]" />
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">{label}</p>
                <p className="mt-1 break-words text-sm font-medium text-[#1c1b1b]">{value}</p>
            </div>
        </div>
    )
}