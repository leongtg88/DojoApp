import { auth } from '@/auth'
import { getAdminScope } from '@/lib/dashboard/scope'
import { findStudentDocumentForAdmin } from '@/lib/dashboard/student-documents'
import { downloadPrivateDocument, isMissingDocumentError } from '@/lib/document-storage'
import { recordAudit } from '@/lib/security/audit'
import { NextResponse } from 'next/server'

interface DocumentDownloadRouteContext {
  params: Promise<{ studentId: string; documentId: string }>
}

// `filename` debe ser ASCII; `filename*` lleva el nombre real codificado para
// conservar acentos y caracteres especiales. Se eliminan saltos de línea para
// no permitir inyección de cabeceras.
function contentDisposition(fileName: string) {
  const fallback = fileName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_')
    .replace(/[\r\n]/g, '')
    .trim() || 'documento'

  const encoded = encodeURIComponent(fileName).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

export async function GET(_: Request, context: DocumentDownloadRouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)
  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId, documentId } = await context.params
  const document = await findStudentDocumentForAdmin(scope, studentId, documentId)
  if (!document) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  try {
    const { buffer, contentType } = await downloadPrivateDocument(document.storageKey)

    await recordAudit({
      actorId: session.user.id,
      schoolId: scope.isSuperAdmin ? null : scope.schoolId,
      action: 'student.document.download',
      targetType: 'student_document',
      targetId: document.id,
      detail: { studentId: document.studentId, documentType: document.type },
    })

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': document.mimeType || contentType || 'application/octet-stream',
        'Content-Length': String(buffer.length),
        'Content-Disposition': contentDisposition(document.fileName),
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (downloadError) {
    if (isMissingDocumentError(downloadError)) {
      return NextResponse.json(
        { error: 'El documento ya no está disponible en el almacenamiento. Puedes eliminar el registro.' },
        { status: 404 },
      )
    }

    console.error('Error descargando documento del alumno:', document.id, downloadError)
    return NextResponse.json({ error: 'No fue posible descargar el documento' }, { status: 503 })
  }
}
