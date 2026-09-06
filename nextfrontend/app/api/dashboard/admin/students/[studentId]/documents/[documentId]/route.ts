import { auth } from '@/auth'
import { db } from '@/lib/db'
import { createPrivateDocumentUrl } from '@/lib/document-storage'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'EXPIRED']),
  reviewNotes: z.string().trim().max(1_000).nullable(),
}).superRefine(({ reviewNotes, status }, context) => {
  if (status === 'REJECTED' && !reviewNotes) {
    context.addIssue({ code: 'custom', message: 'El rechazo requiere una observación', path: ['reviewNotes'] })
  }
})

interface DocumentRouteContext {
  params: Promise<{ studentId: string; documentId: string }>
}

async function findScopedDocument(context: DocumentRouteContext) {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPERADMIN')) return null
  const [{ studentId, documentId }, admin] = await Promise.all([
    context.params,
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true, schoolId: true } }),
  ])
  if (!admin || (admin.role === 'SCHOOL_ADMIN' && !admin.schoolId)) return null

  return db.studentDocument.findFirst({
    where: { id: documentId, studentId, student: admin.role === 'SUPERADMIN' ? {} : { schoolId: admin.schoolId! } },
    select: { id: true, storageKey: true },
  })
}

export async function GET(_: Request, context: DocumentRouteContext) {
  const document = await findScopedDocument(context)
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  try {
    return NextResponse.json({ url: await createPrivateDocumentUrl(document.storageKey) })
  } catch {
    return NextResponse.json({ error: 'No fue posible abrir el documento' }, { status: 503 })
  }
}

export async function PATCH(request: Request, context: DocumentRouteContext) {
  const document = await findScopedDocument(context)
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  const result = reviewSchema.safeParse(await request.json().catch(() => null))
  if (!result.success) return NextResponse.json({ error: 'Datos de revisión no válidos' }, { status: 400 })

  await db.studentDocument.update({
    where: { id: document.id },
    data: { status: result.data.status, reviewNotes: result.data.reviewNotes, reviewedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}