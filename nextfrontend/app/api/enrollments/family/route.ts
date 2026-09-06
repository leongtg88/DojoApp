import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { uploadPrivateDocument } from '@/lib/document-storage'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const applicantSchema = z.object({
  name: z.string().trim().min(2).max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  profileData: z.record(z.string(), z.unknown()),
})

const payloadSchema = z.object({
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(30).nullable(),
  applicants: z.array(applicantSchema).min(1).max(10),
  registrationData: z.record(z.string(), z.unknown()),
})

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const maxFileSize = 5 * 1024 * 1024

function validateFile(file: File) {
  return file.size > 0 && file.size <= maxFileSize && allowedTypes.has(file.type)
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null)
  const payload = formData?.get('payload')
  const parsed = typeof payload === 'string' ? payloadSchema.safeParse(JSON.parse(payload)) : null

  if (!parsed?.success) {
    return NextResponse.json({ error: 'Datos de inscripción no válidos' }, { status: 400 })
  }

  if (!formData) {
    return NextResponse.json({ error: 'Solicitud sin archivos adjuntos' }, { status: 400 })
  }

  const branch = await db.branch.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, schoolId: true } })
  if (!branch) {
    return NextResponse.json({ error: 'No hay una sede disponible para la inscripción' }, { status: 503 })
  }

  const invalidFile = [...formData.entries()].find(([key, value]) => key.startsWith('document-') && value instanceof File && !validateFile(value))
  if (invalidFile) {
    return NextResponse.json({ error: 'Los archivos deben ser JPG, PNG, WEBP o PDF de hasta 5 MB' }, { status: 400 })
  }

  const input = parsed.data
  const enrollment = await db.enrollment.upsert({
    where: { contactEmail_status: { contactEmail: input.email.toLowerCase(), status: 'PENDING' } },
    update: { origin: 'FORM', applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`, contactPhone: input.phone, schoolId: branch.schoolId, branchId: branch.id, registrationData: input.registrationData as Prisma.InputJsonValue, applicants: { deleteMany: {} } },
    create: { origin: 'FORM', applicantName: input.applicants.length === 1 ? input.applicants[0].name : `Solicitud familiar (${input.applicants.length} aspirantes)`, contactEmail: input.email.toLowerCase(), contactPhone: input.phone, schoolId: branch.schoolId, branchId: branch.id, registrationData: input.registrationData as Prisma.InputJsonValue },
    select: { id: true },
  })

  const applicants = await Promise.all(input.applicants.map((applicant) => db.enrollmentApplicant.create({ data: { enrollmentId: enrollment.id, name: applicant.name, dateOfBirth: new Date(`${applicant.dateOfBirth}T00:00:00.000Z`), profileData: applicant.profileData as Prisma.InputJsonValue }, select: { id: true } })))

  try {
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('document-') || !(value instanceof File)) continue
      const [, applicantIndex, type] = key.split('-')
      const applicant = applicants[Number(applicantIndex)]
      if (!applicant) continue
      const storageKey = `enrollments/${enrollment.id}/${applicant.id}/${crypto.randomUUID()}-${value.name}`
      await uploadPrivateDocument(storageKey, value)
      await db.studentDocument.create({ data: { enrollmentId: enrollment.id, applicantId: applicant.id, type: type === 'PROFILE_PHOTO' ? 'PROFILE_PHOTO' : 'IDENTITY', fileName: value.name, storageKey, mimeType: value.type, fileSize: value.size } })
    }
  } catch {
    return NextResponse.json({ error: 'No fue posible guardar los documentos. Verifica la configuración de almacenamiento.' }, { status: 503 })
  }

  return NextResponse.json({ ok: true, id: enrollment.id })
}