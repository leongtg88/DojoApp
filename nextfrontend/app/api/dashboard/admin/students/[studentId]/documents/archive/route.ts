import JSZip from 'jszip'
import { auth } from '@/auth'
import { getAdminScope } from '@/lib/dashboard/scope'
import { getStudentHeaderForAdmin, listStudentDocumentsForAdmin } from '@/lib/dashboard/student-documents'
import { downloadPrivateDocument, isMissingDocumentError, sanitizeStorageName } from '@/lib/document-storage'
import { recordAudit } from '@/lib/security/audit'
import { NextResponse } from 'next/server'

interface StudentDocumentsArchiveRouteContext {
  params: Promise<{ studentId: string }>
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function GET(_: Request, context: StudentDocumentsArchiveRouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)
  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await context.params
  const student = await getStudentHeaderForAdmin(scope, studentId)
  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const documents = await listStudentDocumentsForAdmin(scope, student.id)
  if (documents.length === 0) {
    return NextResponse.json({ error: 'Este alumno no tiene documentos para descargar' }, { status: 404 })
  }

  await recordAudit({
    actorId: session.user.id,
    schoolId: scope.isSuperAdmin ? null : scope.schoolId,
    action: 'student.documents.zip',
    targetType: 'student',
    targetId: student.id,
    detail: { documentCount: documents.length },
  })

  try {
    const zip = new JSZip()
    const missing: string[] = []

    for (const document of documents) {
      try {
        const { buffer } = await downloadPrivateDocument(document.storageKey)
        const safeName = sanitizeStorageName(document.fileName)
        zip.file(`${document.type}-${document.id.slice(0, 6)}-${safeName}`, buffer)
      } catch (downloadError) {
        if (isMissingDocumentError(downloadError)) {
          missing.push(`${document.type} - ${document.fileName}`)
        } else {
          console.error('Error descargando documento para el ZIP del alumno:', document.id, downloadError)
        }
      }
    }

    if (missing.length > 0) {
      zip.file(
        'ARCHIVOS-NO-DISPONIBLES.txt',
        [
          'Estos documentos están registrados en el expediente, pero su archivo ya no existe en el almacenamiento:',
          '',
          ...missing,
        ].join('\n'),
      )
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const baseName = slugify(`${student.firstName}-${student.lastName}`) || student.id
    const fileName = `documentos-${baseName}-${new Date().toISOString().slice(0, 10)}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generando ZIP de documentos del alumno:', error)
    return NextResponse.json({ error: 'No fue posible generar el archivo ZIP' }, { status: 500 })
  }
}
