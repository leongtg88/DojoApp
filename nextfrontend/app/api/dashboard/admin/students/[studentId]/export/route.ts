import { auth } from '@/auth'
import { getAdminStudentDetail } from '@/lib/dashboard/admin-queries'
import { buildStudentDetailWorkbook, studentFileName } from '@/lib/dashboard/student-detail-export'
import { NextResponse } from 'next/server'

interface StudentExportRouteContext {
  params: Promise<{ studentId: string }>
}

export async function GET(_: Request, context: StudentExportRouteContext) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { studentId } = await context.params
  const student = await getAdminStudentDetail(session.user.id, studentId)

  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  try {
    const buffer = buildStudentDetailWorkbook(student)
    const fileName = `ficha-${studentFileName(student)}-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error exportando ficha de alumno:', error)
    return NextResponse.json({ error: 'No fue posible exportar la ficha del alumno' }, { status: 500 })
  }
}
