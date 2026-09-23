import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAnyRole, hasRole } from '@/lib/auth/roles'
import { createPrivateDocumentUrl, deletePrivateDocuments } from '@/lib/document-storage'
import { notifyAssignment } from '@/lib/notifications/create'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'EXPIRED', 'PENDING']),
  reviewNotes: z.string().trim().max(1_000).nullable(),
}).superRefine(({ reviewNotes, status }, context) => {
  if (status === 'REJECTED' && !reviewNotes) {
    context.addIssue({ code: 'custom', message: 'El rechazo requiere una observación', path: ['reviewNotes'] })
  }
})

const DOCUMENT_TYPE_LABELS: Record<'PROFILE_PHOTO' | 'IDENTITY' | 'BIRTH_CERTIFICATE' | 'PASSPORT' | 'MEDICAL_CERTIFICATE' | 'OTHER', string> = {
  PROFILE_PHOTO: 'Tu foto de perfil',
  IDENTITY: 'Tu documento de identidad',
  BIRTH_CERTIFICATE: 'Tu acta de nacimiento',
  PASSPORT: 'Tu pasaporte',
  MEDICAL_CERTIFICATE: 'Tu certificado médico',
  OTHER: 'Tu documento',
}

interface DocumentRouteContext {
  params: Promise<{ studentId: string; documentId: string }>
}

async function findScopedDocument(context: DocumentRouteContext) {
  const session = await auth()
  if (!session?.user?.id || !hasAnyRole(session.user, ['SCHOOL_ADMIN', 'SUPERADMIN'])) return null
  const [{ studentId, documentId }, admin] = await Promise.all([
    context.params,
    db.user.findUnique({ where: { id: session.user.id }, select: { roles: true, schoolId: true } }),
  ])
  if (!admin || (hasRole(admin, 'SCHOOL_ADMIN') && !hasRole(admin, 'SUPERADMIN') && !admin.schoolId)) return null

  return db.studentDocument.findFirst({
    where: { id: documentId, studentId, student: hasRole(admin, 'SUPERADMIN') ? {} : { schoolId: admin.schoolId! } },
    select: { id: true, storageKey: true, studentId: true, type: true },
  })
}

export async function GET(_: Request, context: DocumentRouteContext) {
  const document = await findScopedDocument(context)
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  try {
    return NextResponse.json({ url: await createPrivateDocumentUrl(document.storageKey) })
  } catch (urlError) {
    console.error('Error abriendo documento:', urlError)
    return NextResponse.json({ error: 'No fue posible abrir el documento' }, { status: 503 })
  }
}

export async function PATCH(request: Request, context: DocumentRouteContext) {
  const document = await findScopedDocument(context)
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  const result = reviewSchema.safeParse(await request.json().catch(() => null))
  if (!result.success) return NextResponse.json({ error: 'Datos de revisión no válidos' }, { status: 400 })

  // Al volver un documento a "Pendiente" se limpian revisión y observaciones,
  // para que quede como recién subido a la espera del Sensei.
  const isPending = result.data.status === 'PENDING'
  await db.studentDocument.update({
    where: { id: document.id },
    data: {
      status: result.data.status,
      reviewNotes: isPending ? null : result.data.reviewNotes,
      reviewedAt: isPending ? null : new Date(),
    },
  })

  const documentName = DOCUMENT_TYPE_LABELS[document.type]
  const targetStudentId = document.studentId

  if (targetStudentId && result.data.status === 'APPROVED') {
    await notifyAssignment({
      type: 'DOCUMENT_APPROVED',
      studentId: targetStudentId,
      data: { documentName },
    })
  } else if (targetStudentId && result.data.status === 'REJECTED') {
    await notifyAssignment({
      type: 'DOCUMENT_REJECTED',
      studentId: targetStudentId,
      data: { documentName, reviewNotes: result.data.reviewNotes ?? '' },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, context: DocumentRouteContext) {
  const document = await findScopedDocument(context)
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  try {
    await deletePrivateDocuments([document.storageKey])
    await db.studentDocument.delete({ where: { id: document.id } })
  } catch (deleteError) {
    console.error('Error borrando documento:', deleteError)
    return NextResponse.json({ error: 'No fue posible borrar el documento. Inténtalo nuevamente.' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}