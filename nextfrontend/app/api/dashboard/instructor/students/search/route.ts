import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasRole } from '@/lib/auth/roles'
import { getInstructorStudentsSearch } from '@/lib/dashboard/instructor-queries'

export async function GET(request: NextRequest) {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

    if (q.length < 2) {
        return NextResponse.json({ students: [] })
    }

    const students = await getInstructorStudentsSearch(session.user.id, q)

    return NextResponse.json({ students })
}