import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasRole } from '@/lib/auth/roles'
import { getInstructorKataAssignment } from '@/lib/dashboard/instructor-queries'

export async function GET(request: NextRequest, context: { params: Promise<{ studentId: string }> }) {
    const session = await auth()

    if (!session?.user?.id || !hasRole(session?.user, 'INSTRUCTOR')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { studentId } = await context.params

    const data = await getInstructorKataAssignment(session.user.id, studentId)

    if (!data) {
        return NextResponse.json({ error: 'Alumno no encontrado o sin clases a tu cargo' }, { status: 404 })
    }

    return NextResponse.json(data)
}