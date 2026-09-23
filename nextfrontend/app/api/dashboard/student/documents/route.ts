import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole } from '@/lib/auth/roles'
import { resolveRequestStudent } from '@/lib/family/guardians'
import { createPrivateDocumentUrl, uploadPrivateDocument, deletePrivateDocuments, sanitizeStorageName } from '@/lib/document-storage'
import { notifySchoolStaff } from '@/lib/notifications/create'
import { NextResponse } from 'next/server'

const documentTypes = ['PROFILE_PHOTO', 'IDENTITY', 'BIRTH_CERTIFICATE', 'PASSPORT', 'MEDICAL_CERTIFICATE', 'OTHER'] as const
const DOCUMENT_TYPE_LABELS: Record<typeof documentTypes[number], string> = {
  PROFILE_PHOTO: 'la foto de perfil',
  IDENTITY: 'el documento de identidad',
  BIRTH_CERTIFICATE: 'el acta de nacimiento',
  PASSPORT: 'el pasaporte',
  MEDICAL_CERTIFICATE: 'el certificado médico',
  OTHER: 'un documento',
}
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const maxFileSize = 5 * 1024 * 1024

async function getStudentId(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !hasAnyRole(session?.user, ['STUDENT', 'GUARDIAN'])) return null
  const view = await resolveRequestStudent(request, session.user.id)
  if (!view) return null
  const student = await db.student.findUnique({
    where: { id: view.studentId },
    select: { id: true, enrollments: { select: { id: true }, take: 1 } },
  })

  return student ? { id: student.id, enrollmentId: student.enrollments[0]?.id ?? null } : null
}

export async function GET(request: Request) {
  const student = await getStudentId(request)
  const documentId = new URL(request.url).searchParams.get('documentId')
  if (!student || !documentId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const document = await db.studentDocument.findFirst({ where: { id: documentId, studentId: student.id }, select: { storageKey: true } })
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  try {
    return NextResponse.json({ url: await createPrivateDocumentUrl(document.storageKey) })
  } catch (urlError) {
    console.error('Error abriendo documento:', urlError)
    return NextResponse.json({ error: 'No fue posible abrir el documento' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const student = await getStudentId(request)
  if (!student) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await request.formData().catch(() => null)
  const type = formData?.get('type')
  const file = formData?.get('file')
  if (!documentTypes.includes(type as typeof documentTypes[number]) || !(file instanceof File) || file.size === 0 || file.size > maxFileSize || !allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: 'Selecciona un archivo JPG, PNG, WEBP o PDF de hasta 5 MB' }, { status: 400 })
  }

  const storageKey = `students/${student.id}/${crypto.randomUUID()}-${sanitizeStorageName(file.name)}`
  try {
    await uploadPrivateDocument(storageKey, file)
    const document = await db.$transaction(async (transaction) => {
      await transaction.studentDocument.updateMany({ where: { studentId: student.id, type: type as typeof documentTypes[number], status: { in: ['PENDING', 'APPROVED', 'REJECTED'] } }, data: { status: 'EXPIRED' } })
      return transaction.studentDocument.create({
        data: { enrollmentId: student.enrollmentId, studentId: student.id, type: type as typeof documentTypes[number], fileName: file.name, storageKey, mimeType: file.type, fileSize: file.size },
      })
    })
    await notifySchoolStaff({
      type: 'DOCUMENT_UPLOADED',
      studentId: student.id,
      data: { documentName: DOCUMENT_TYPE_LABELS[type as typeof documentTypes[number]] },
    })
    return NextResponse.json({
      ok: true,
      id: document.id,
      document: {
        id: document.id,
        type: document.type,
        status: document.status,
        fileName: document.fileName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        reviewNotes: document.reviewNotes,
        uploadedAt: document.uploadedAt.toISOString(),
      },
    })
  } catch (uploadError) {
    console.error('Error guardando documento de estudiante:', uploadError)
    return NextResponse.json({ error: 'No fue posible guardar el documento. Inténtalo nuevamente.' }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  const student = await getStudentId(request)
  if (!student) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const documentId = new URL(request.url).searchParams.get('documentId')
  if (!documentId) return NextResponse.json({ error: 'Documento no especificado' }, { status: 400 })

  const document = await db.studentDocument.findFirst({
    where: { id: documentId, studentId: student.id },
    select: { id: true, storageKey: true },
  })
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  try {
    await deletePrivateDocuments([document.storageKey])
    await db.studentDocument.delete({ where: { id: document.id } })
  } catch (deleteError) {
    console.error('Error borrando documento del estudiante:', deleteError)
    return NextResponse.json({ error: 'No fue posible borrar el documento. Inténtalo nuevamente.' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}