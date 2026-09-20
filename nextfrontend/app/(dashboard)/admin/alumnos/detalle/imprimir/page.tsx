import { auth } from '@/auth'
import { db } from '@/lib/db'
import { createPrivateDocumentUrl } from '@/lib/document-storage'
import { getAdminStudentDetail } from '@/lib/dashboard/admin-queries'
import { PrintStudentButton } from '@/components/dashboard/admin/PrintStudentButton'
import { redirect } from 'next/navigation'
import { hasAnyRole } from '@/lib/auth/roles'

interface PrintStudentPageProps {
    searchParams: Promise<{ studentId?: string }>
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    PROFILE_PHOTO: 'Foto de perfil',
    IDENTITY: 'Documento de identidad',
    BIRTH_CERTIFICATE: 'Acta de nacimiento',
    PASSPORT: 'Pasaporte',
    MEDICAL_CERTIFICATE: 'Certificado médico',
    OTHER: 'Documento adicional',
}

function formatDate(value: string | null) {
    if (!value) return '—'
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value))
}

function formatDateTime(value: string | null) {
    if (!value) return '—'
    return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default async function PrintStudentPage({ searchParams }: PrintStudentPageProps) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['SCHOOL_ADMIN', 'SUPERADMIN']) || !userId) {
        redirect('/no-autorizado')
    }

    const { studentId } = await searchParams
    if (!studentId) redirect('/dashboard/admin/alumnos/detalle')

    const student = await getAdminStudentDetail(userId, studentId)
    if (!student) redirect('/dashboard/admin/alumnos/detalle')

    const documents = await db.studentDocument.findMany({
        where: { studentId: student.id },
        orderBy: { uploadedAt: 'desc' },
        select: { id: true, type: true, status: true, fileName: true, mimeType: true, storageKey: true, uploadedAt: true },
    })

    const imageUrls = new Map<string, string>()
    await Promise.all(
        documents
            .filter((document) => document.mimeType.startsWith('image/'))
            .map(async (document) => {
                try {
                    imageUrls.set(document.id, await createPrivateDocumentUrl(document.storageKey, 600))
                } catch (error) {
                    console.error('Error firmando imagen para impresión:', error)
                }
            }),
    )

    return (
        <div className="w-full bg-neutral-900 px-4 py-8 sm:px-6 lg:px-8 print:bg-white print:p-0">
            <div className="mx-auto max-w-4xl">
                <div className="mb-4 flex items-center justify-between print:hidden">
                    <p className="text-sm font-semibold text-neutral-300">Vista de impresión del expediente</p>
                    <PrintStudentButton />
                </div>

                <article className="rounded-lg border border-neutral-200 bg-white p-8 text-neutral-900 shadow-sm print:border-0 print:p-0 print:shadow-none">
                    <header className="flex items-start justify-between border-b-2 border-neutral-900 pb-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Tosei Gusoku</p>
                            <h1 className="mt-1 text-2xl font-extrabold">Ficha del alumno</h1>
                            <p className="mt-1 text-sm text-neutral-600">{student.firstName} {student.lastName} · {student.memberNumber ?? 'Sin matrícula'}</p>
                        </div>
                        <div className="text-right text-xs text-neutral-500">
                            <p>Generado: {formatDateTime(new Date().toISOString())}</p>
                            <p className="mt-1">Sucursal: {student.branchName}</p>
                        </div>
                    </header>

                    <Section title="Datos personales">
                        <Grid items={[
                            ['Nombre completo', `${student.firstName} ${student.lastName}`],
                            ['Matrícula', student.memberNumber],
                            ['Género', student.gender === 'MALE' ? 'Masculino' : student.gender === 'FEMALE' ? 'Femenino' : null],
                            ['Fecha de nacimiento', formatDate(student.dateOfBirth)],
                            ['Email', student.email],
                            ['Teléfono', student.contactPhone],
                            ['Sucursal', student.branchName],
                            ['Estado del expediente', student.status],
                            ['Grado actual', student.currentRank ?? 'Sin grado'],
                            ['Fecha de alta', formatDateTime(student.enrollmentDate)],
                            ['Plan', student.planName ?? 'Sin plan'],
                            ['Beca', student.scholarshipType === 'NONE' ? 'Sin beca' : student.scholarshipType],
                            ['Horarios activos', student.activeScheduleNames.join(', ') || null],
                            ['Asistencia', `${student.attendancePercent ?? 0}% (${student.attendedCount} de ${student.targetAttendances})`],
                            ['Contacto de emergencia', student.emergencyContact],
                            ['Información médica', student.medicalInfo],
                        ]} />
                    </Section>

                    <Section title="Datos de inscripción">
                        {student.registration.hasForm ? (
                            <>
                                <Grid items={[
                                    ['Origen', student.registration.origin === 'FORM' ? 'Formulario web' : student.registration.origin === 'ASSISTANT' ? 'Asistente virtual' : 'Registro manual'],
                                    ['Estado', student.registration.status],
                                    ['Fecha de inscripción', formatDateTime(student.registration.registeredAt)],
                                    ['Referencia', student.registration.applicantName],
                                ]} />
                                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                    {student.registration.groups.map((group) => (
                                        <div key={group.title}>
                                            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{group.title}</h3>
                                            <dl className="mt-2 space-y-1.5">
                                                {group.fields.map((field) => (
                                                    <div key={field.label} className="flex justify-between gap-4 border-b border-neutral-100 pb-1.5 text-sm">
                                                        <dt className="text-neutral-500">{field.label}</dt>
                                                        <dd className="text-right font-medium text-neutral-900">{field.value ?? '—'}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-neutral-500">Sin formulario de inscripción asociado.</p>
                        )}
                        {student.registration.applicants.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Aspirantes de la solicitud</h3>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {student.registration.applicants.map((applicant) => (
                                        <li key={applicant.id} className="flex justify-between border-b border-neutral-100 pb-1.5">
                                            <span>{applicant.name}</span>
                                            <span className="text-neutral-500">{formatDate(applicant.dateOfBirth)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Section>

                    {documents.length > 0 && (
                        <Section title={`Documentos (${documents.length})`}>
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                                        <th className="py-2">Tipo</th>
                                        <th className="py-2">Archivo</th>
                                        <th className="py-2">Estado</th>
                                        <th className="py-2">Subido</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.map((document) => (
                                        <tr key={document.id} className="border-b border-neutral-100">
                                            <td className="py-2 font-medium">{DOCUMENT_TYPE_LABELS[document.type] ?? document.type}</td>
                                            <td className="py-2 text-neutral-600">{document.fileName}</td>
                                            <td className="py-2">{document.status}</td>
                                            <td className="py-2 text-neutral-500">{formatDate(document.uploadedAt.toISOString())}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>
                    )}

                    {imageUrls.size > 0 && (
                        <Section title="Imágenes cargadas">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {documents.filter((document) => imageUrls.has(document.id)).map((document) => (
                                    <figure key={document.id} className="overflow-hidden rounded-md border border-neutral-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imageUrls.get(document.id)} alt={DOCUMENT_TYPE_LABELS[document.type] ?? document.type} className="h-40 w-full object-cover" />
                                        <figcaption className="border-t border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-600">{DOCUMENT_TYPE_LABELS[document.type] ?? document.type}</figcaption>
                                    </figure>
                                ))}
                            </div>
                        </Section>
                    )}

                    {student.techniques.length > 0 && (
                        <Section title={`Katas y técnicas (${student.techniques.length})`}>
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                                        <th className="py-2">Kata / técnica</th>
                                        <th className="py-2">Categoría</th>
                                        <th className="py-2">Estado</th>
                                        <th className="py-2">Aprobada</th>
                                        <th className="py-2">Repeticiones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.techniques.map((entry) => (
                                        <tr key={entry.id} className="border-b border-neutral-100">
                                            <td className="py-2 font-medium">{entry.technique.name}</td>
                                            <td className="py-2 text-neutral-600">{entry.technique.category}</td>
                                            <td className="py-2">{entry.status}</td>
                                            <td className="py-2">{entry.approved ? 'Sí' : 'No'}</td>
                                            <td className="py-2">{entry.practiceRepetitions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>
                    )}

                    <Section title={`Historial de grados (${student.rankHistory.length})`}>
                        {student.rankHistory.length === 0 ? (
                            <p className="text-sm text-neutral-500">No hay ascensos registrados.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {student.rankHistory.map((entry) => (
                                    <li key={entry.id} className="border-b border-neutral-100 pb-2">
                                        <p className="font-semibold">{entry.rankName} <span className="font-normal text-neutral-500">· {formatDateTime(entry.promotedAt)}</span></p>
                                        <p className="text-neutral-500">{entry.promoterName ?? 'Sin responsable'}{entry.examinerName ? ` · Examinador: ${entry.examinerName}` : ''}</p>
                                        {entry.notes && <p className="mt-1 text-neutral-600">{entry.notes}</p>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>

                    <Section title={`Asistencias (${student.attendanceHistory.length})`}>
                        {student.attendanceHistory.length === 0 ? (
                            <p className="text-sm text-neutral-500">Sin asistencias registradas.</p>
                        ) : (
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                                        <th className="py-2">Fecha</th>
                                        <th className="py-2">Estado</th>
                                        <th className="py-2">Clase</th>
                                        <th className="py-2">Horas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.attendanceHistory.map((entry) => (
                                        <tr key={entry.id} className="border-b border-neutral-100">
                                            <td className="py-2">{formatDateTime(entry.date)}</td>
                                            <td className="py-2">{entry.status}</td>
                                            <td className="py-2 text-neutral-600">{entry.className ?? '—'}</td>
                                            <td className="py-2">{entry.hoursTrained}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Section>

                    <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
                        Documento generado automáticamente por el sistema de gestión Tosei Gusoku. La información es confidencial y de uso interno.
                    </footer>
                </article>
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mt-6 break-inside-avoid">
            <h2 className="border-b border-neutral-300 pb-1.5 text-sm font-bold uppercase tracking-wide text-neutral-800">{title}</h2>
            <div className="mt-3">{children}</div>
        </section>
    )
}

function Grid({ items }: { items: [string, string | number | null][] }) {
    return (
        <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {items.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-neutral-100 pb-1.5 text-sm">
                    <dt className="text-neutral-500">{label}</dt>
                    <dd className="text-right font-medium text-neutral-900">{value ?? '—'}</dd>
                </div>
            ))}
        </dl>
    )
}
