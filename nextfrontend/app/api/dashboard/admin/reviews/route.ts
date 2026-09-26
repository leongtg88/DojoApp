import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const reviews = await db.review.findMany({
    where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({
    reviews: reviews.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      relationship: review.relationship,
      email: review.email,
      rating: review.rating,
      message: review.message,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      approvedAt: review.approvedAt?.toISOString() ?? null,
    })),
  })
}
