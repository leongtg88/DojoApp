import { BookUser, CalendarPlus, GraduationCap, HeartPulse, Mail, Phone, Ruler, ShieldAlert, UserRound } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface StudentProfileDetailsProps {
    profile: StudentProfile
}

interface ProfileField {
    icon: typeof Mail
    label: string
    value: string
}

interface ProfileSectionProps {
    title: string
    icon: typeof BookUser
    fields: ProfileField[]
}

function formatLongDate(iso: string) {
    return new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function StudentProfileDetails({ profile }: StudentProfileDetailsProps) {
    const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    const expediente = profile.id.slice(-6).toUpperCase()

    const sections: ProfileSectionProps[] = [
        {
            title: 'Registro institucional',
            icon: BookUser,
            fields: [
                { icon: Mail, label: 'Correo electrónico', value: profile.email ?? 'No registrado' },
                { icon: CalendarPlus, label: 'Fecha de nacimiento', value: formatLongDate(profile.dateOfBirth) },
                { icon: GraduationCap, label: 'Grado actual', value: profile.currentRank?.name ?? 'Sin grado asignado' },
                { icon: CalendarPlus, label: 'Ingreso al dojo', value: formatLongDate(profile.enrollmentDate) },
            ],
        },
        {
            title: 'Identidad y contacto',
            icon: UserRound,
            fields: [
                { icon: UserRound, label: 'Nombre completo', value: `${profile.firstName} ${profile.lastName}` },
                { icon: Phone, label: 'Teléfono', value: profile.contactPhone ?? 'No registrado' },
            ],
        },
        {
            title: 'Preparación física',
            icon: Ruler,
            fields: [
                { icon: Ruler, label: 'Perfil físico', value: 'Consulta con tu sensei para registrar tus medidas de uniforme.' },
            ],
        },
        {
            title: 'Emergencia',
            icon: ShieldAlert,
            fields: [
                { icon: ShieldAlert, label: 'Contacto de emergencia', value: profile.emergencyContact ?? 'No registrado' },
            ],
        },
        {
            title: 'Información médica',
            icon: HeartPulse,
            fields: [
                { icon: HeartPulse, label: 'Notas médicas', value: profile.medicalInfo ?? 'No registrada' },
            ],
        },
    ]

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Mi perfil</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white">Datos del dojo</h1>
            <p className="mt-2 text-sm text-neutral-400">Información registrada en la secretaría del dojo Tosei Gusoku.</p>

            <section className="mt-7 rounded-xl border border-neutral-800 bg-[#161b22] p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border-2 border-neutral-700 bg-[#0d1117] font-display text-xl font-extrabold text-cyan-100">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-bold text-white">{profile.firstName} {profile.lastName}</h2>
                        <p className="mt-1 font-mono text-xs text-neutral-400">Expediente {expediente} · Ingreso {formatLongDate(profile.enrollmentDate)}</p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200">
                            <GraduationCap aria-hidden="true" className="size-3.5" />
                            {profile.currentRank?.name ?? 'Sin grado asignado'}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {sections.map((section) => (
                    <ProfileSection key={section.title} {...section} />
                ))}
            </div>
        </main>
    )
}

function ProfileSection({ title, icon: Icon, fields }: ProfileSectionProps) {
    return (
        <section className="rounded-xl border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Icon aria-hidden="true" className="size-4 text-cyan-400" />
                <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-neutral-200">{title}</h3>
            </div>
            <dl className="mt-4 space-y-4">
                {fields.map((field) => {
                    const IconField = field.icon
                    const isEmpty = field.value === 'No registrado' || field.value === 'No registrada' || field.value === 'Sin grado asignado'

                    return (
                        <div className="flex gap-3" key={field.label}>
                            <IconField aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                            <div className="min-w-0">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{field.label}</dt>
                                <dd className={`mt-0.5 break-words text-sm font-medium ${isEmpty ? 'text-neutral-500' : 'text-white'}`}>{field.value}</dd>
                            </div>
                        </div>
                    )
                })}
            </dl>
        </section>
    )
}