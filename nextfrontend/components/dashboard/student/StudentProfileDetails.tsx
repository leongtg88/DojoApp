import Link from 'next/link'
import { BookUser, CalendarPlus, GraduationCap, HeartPulse, Mail, Phone, Ruler, ShieldAlert, UserRound } from 'lucide-react'
import type { StudentProfile } from '@/types/dashboard'

interface StudentProfileDetailsProps {
    profile: StudentProfile
    isChildView?: boolean
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

export function StudentProfileDetails({ profile, isChildView = false }: StudentProfileDetailsProps) {
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
                { icon: Ruler, label: 'Karategi (uniforme)', value: profile.giSize ?? 'No registrado' },
                { icon: Ruler, label: 'Cinturón', value: profile.beltSize ?? 'No registrado' },
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

    if (profile.guardianName) {
        const guardianFields: ProfileField[] = [{ icon: UserRound, label: 'Nombre', value: profile.guardianName }]
        if (profile.guardianRelationship) guardianFields.push({ icon: ShieldAlert, label: 'Relación', value: profile.guardianRelationship })
        if (profile.guardianPhone) guardianFields.push({ icon: Phone, label: 'Teléfono', value: profile.guardianPhone })
        sections.splice(2, 0, { title: 'Tutor responsable', icon: ShieldAlert, fields: guardianFields })
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            {isChildView && (
                <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm">
                    <UserRound aria-hidden="true" className="size-4 shrink-0 text-accent" />
                    <p className="min-w-0 text-ink-2">
                        Estás viendo el perfil de <span className="font-bold text-ink">{profile.firstName} {profile.lastName}</span> (tu hijo).
                    </p>
                    <Link className="ml-auto shrink-0 font-bold text-accent hover:text-accent-text" href="/dashboard/estudiante/perfil">Volver a mi cuenta</Link>
                </div>
            )}

            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{isChildView ? 'Perfil del hijo' : 'Mi perfil'}</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">{isChildView ? `Perfil de ${profile.firstName}` : 'Datos del dojo'}</h1>
            <p className="mt-2 text-sm text-ink-3">Información registrada en la secretaría del dojo Tosei Gusoku.</p>

            <section className="mt-7 rounded-xl border border-edge bg-surface-2 p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {profile.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.photoUrl} alt={`Foto de ${profile.firstName}`} className="size-16 shrink-0 rounded-xl border-2 border-edge-strong object-cover" />
                    ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border-2 border-edge-strong bg-surface-1 font-display text-xl font-extrabold text-accent-text">
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-display text-xl font-bold text-ink">{profile.firstName} {profile.lastName}</h2>
                            {isChildView && <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-text">Hijo(a)</span>}
                        </div>
                        <p className="mt-1 font-mono text-xs text-ink-3">Expediente {expediente} · Ingreso {formatLongDate(profile.enrollmentDate)}</p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-accent-text">
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
        <section className="rounded-xl border border-edge bg-surface-2 p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-edge pb-3">
                <Icon aria-hidden="true" className="size-4 text-accent" />
                <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-ink">{title}</h3>
            </div>
            <dl className="mt-4 space-y-4">
                {fields.map((field) => {
                    const IconField = field.icon
                    const isEmpty = field.value === 'No registrado' || field.value === 'No registrada' || field.value === 'Sin grado asignado'

                    return (
                        <div className="flex gap-3" key={field.label}>
                            <IconField aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-4" />
                            <div className="min-w-0">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-4">{field.label}</dt>
                                <dd className={`mt-0.5 break-words text-sm font-medium ${isEmpty ? 'text-ink-4' : 'text-ink'}`}>{field.value}</dd>
                            </div>
                        </div>
                    )
                })}
            </dl>
        </section>
    )
}