import JSZip from 'jszip'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminStudentDetail } from '@/lib/dashboard/admin-queries'
import { buildStudentDetailWorkbook, studentFileName } from '@/lib/dashboard/student-detail-export'
import { downloadPrivateDocument, sanitizeStorageName } from '@/lib/document-storage'
import { recordAudit } from '@/lib/security/audit'
import { NextResponse } from 'next/server'

interface StudentZipRouteContext {
  params: Promise<{ studentId: string }>
}

export async function GET(_: Request, context: StudentZipRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await context.params
  const student = await getAdminStudentDetail(session.user.id, studentId)

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  const documents = await db.studentDocument.findMany({
    where: { studentId: student.id },
    orderBy: { uploadedAt: 'desc' },
    select: { id: true, type: true, fileName: true, storageKey: true },
  })

  await recordAudit({
    actorId: session.user.id,
    action: 'student.export.zip',
    targetType: 'student',
    targetId: student.id,
    detail: { documentCount: documents.length },
  })

  try {
    const zip = new JSZip()
    const baseName = studentFileName(student)
    zip.file(`ficha-${baseName}.xlsx`, buildStudentDetailWorkbook(student))

    if (documents.length > 0) {
      const folder = zip.folder('documentos')
      for (const document of documents) {
        try {
          const { buffer } = await downloadPrivateDocument(document.storageKey)
          const safeName = sanitizeStorageName(document.fileName)
          folder?.file(`${document.type}-${document.id.slice(0, 6)}-${safeName}`, buffer)
        } catch (downloadError) {
          console.error('Error descargando documento para ZIP:', document.id, downloadError)
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    const fileName = `expediente-${baseName}-${new Date().toISOString().slice(0, 10)}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generando ZIP de alumno:', error)
    return NextResponse.json({ error: 'No fue posible generar el archivo ZIP' }, { status: 500 })
  }
}
