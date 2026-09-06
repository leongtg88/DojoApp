import { auth } from '@/auth'
import { db } from '@/lib/db'
import { createPrivateDocumentUrl, uploadPrivateDocument } from '@/lib/document-storage'
import { NextResponse } from 'next/server'

const documentTypes = ['PROFILE_PHOTO', 'IDENTITY', 'BIRTH_CERTIFICATE', 'PASSPORT', 'MEDICAL_CERTIFICATE', 'OTHER'] as const
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const maxFileSize = 5 * 1024 * 1024

async function getStudentId() {
  const session = await auth()
  if (session?.user?.role !== 'STUDENT' || !session.user.id) return null
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, enrollments: { select: { id: true }, take: 1 } },
  })

  return student ? { id: student.id, enrollmentId: student.enrollments[0]?.id ?? null } : null
}

export async function GET(request: Request) {
  const student = await getStudentId()
  const documentId = new URL(request.url).searchParams.get('documentId')
  if (!student || !documentId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const document = await db.studentDocument.findFirst({ where: { id: documentId, studentId: student.id }, select: { storageKey: true } })
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  try {
    return NextResponse.json({ url: await createPrivateDocumentUrl(document.storageKey) })
  } catch {
    return NextResponse.json({ error: 'No fue posible abrir el documento' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const student = await getStudentId()
  if (!student?.enrollmentId) return NextResponse.json({ error: 'No se encontró el expediente de inscripción' }, { status: 409 })

  const formData = await request.formData().catch(() => null)
  const type = formData?.get('type')
  const file = formData?.get('file')
  if (!documentTypes.includes(type as typeof documentTypes[number]) || !(file instanceof File) || file.size === 0 || file.size > maxFileSize || !allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: 'Selecciona un archivo JPG, PNG, WEBP o PDF de hasta 5 MB' }, { status: 400 })
  }

  const storageKey = `students/${student.id}/${crypto.randomUUID()}-${file.name}`
  try {
    await uploadPrivateDocument(storageKey, file)
    const document = await db.$transaction(async (transaction) => {
      await transaction.studentDocument.updateMany({ where: { studentId: student.id, type: type as typeof documentTypes[number], status: { in: ['PENDING', 'APPROVED', 'REJECTED'] } }, data: { status: 'EXPIRED' } })
      return transaction.studentDocument.create({ data: { enrollmentId: student.enrollmentId, studentId: student.id, type: type as typeof documentTypes[number], fileName: file.name, storageKey, mimeType: file.type, fileSize: file.size } })
    })
    return NextResponse.json({ ok: true, id: document.id })
  } catch {
    return NextResponse.json({ error: 'No fue posible guardar el documento' }, { status: 503 })
  }
}