import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasAnyRole } from '@/lib/auth/roles'
import { getStudentMonthlyStatus } from '@/lib/dashboard/student-queries'

export async function GET(request: NextRequest) {
    const session = await auth()
    const userId = session?.user?.id

    if (!hasAnyRole(session?.user, ['STUDENT']) || !userId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const date = month ? new Date(`${month}-01T12:00:00`) : new Date()

    const status = await getStudentMonthlyStatus(userId, date)

    if (!status) {
        return NextResponse.json({ error: 'No se encontró el expediente del estudiante' }, { status: 404 })
    }

    return NextResponse.json(status)
}