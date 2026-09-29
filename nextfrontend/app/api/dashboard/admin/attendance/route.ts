import { Prisma, type AttendanceStatus } from '@/lib/generated/prisma'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope } from '@/lib/dashboard/scope'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['CONFIRMED', 'REJECTED', 'JUSTIFIED']),
  ids: z.array(z.string().trim().min(1)).max(200),
})

function schoolStudentsFilter(scope: { isSuperAdmin: boolean; schoolId: string | null }): Prisma.AttendanceWhereInput {
  return scope.isSuperAdmin ? {} : { student: { schoolId: scope.schoolId! } }
}

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  const statusParam = searchParams.get('status')
  const query = searchParams.get('q')?.trim()
  const presentParam = searchParams.get('present')
  const branchParam = searchParams.get('branch')

  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(`${dateParam}T00:00:00.000Z`) : null
  const dayAfter = date ? new Date(date.getTime() + 86_400_000) : null
  const statusFilter: AttendanceStatus | undefined =
    statusParam === 'all' ? undefined : ((statusParam as AttendanceStatus | undefined) ?? 'PENDING')
  const presentFilter = presentParam === 'present' ? true : presentParam === 'absent' ? false : undefined
  const branchFilter = branchParam && branchParam !== 'all' ? branchParam : null

  const where: Prisma.AttendanceWhereInput = {
    ...schoolStudentsFilter(scope),
    status: statusFilter,
    present: presentFilter,
    date: date ? { gte: date, lt: dayAfter! } : undefined,
  }

  if (branchFilter) {
    where.AND = [
      {
        OR: [
          { class: { branchId: branchFilter } },
          { session: { class: { branchId: branchFilter } } },
        ],
      },
    ]
  }

  if (query) {
    where.OR = [
      { student: { OR: [{ firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }] } },
      { notes: { contains: query, mode: 'insensitive' } },
      { class: { name: { contains: query, mode: 'insensitive' } } },
      { session: { class: { name: { contains: query, mode: 'insensitive' } } } },
    ]
  }

  const [records, branches] = await Promise.all([
    db.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { punchedAt: 'desc' }],
      take: 300,
      select: {
        id: true,
        date: true,
        present: true,
        hoursTrained: true,
        sessionType: true,
        status: true,
        isOutOfSchedule: true,
        notes: true,
        punchedAt: true,
        confirmedAt: true,
        confirmedBy: { select: { name: true } },
        class: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } },
        session: { select: { class: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } } } },
        practiceLogs: {
          select: {
            repetitions: true,
            place: true,
            studentTechnique: { select: { technique: { select: { name: true } } } },
            technique: { select: { name: true } },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberNumber: true,
            plan: { select: { id: true, name: true } },
            classEnrollments: { where: { status: 'ACTIVE' }, select: { classId: true } },
          },
        },
      },
    }),
    db.branch.findMany({
      where: scope.isSuperAdmin ? {} : { schoolId: scope.schoolId! },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const items = records.map((record) => {
    const referenceIds = new Set(record.student.classEnrollments.map((entry) => entry.classId))
    const classId = record.class?.id ?? record.session?.class?.id ?? null
    const branch = record.class?.branch ?? record.session?.class?.branch ?? null
    return {
      id: record.id,
      date: record.date.toISOString(),
      present: record.present,
      hoursTrained: record.hoursTrained,
      sessionType: record.sessionType,
      status: record.status,
      notes: record.notes,
      punchedAt: record.punchedAt.toISOString(),
      confirmedAt: record.confirmedAt?.toISOString() ?? null,
      confirmedByName: record.confirmedBy?.name ?? null,
      className: record.class?.name ?? record.session?.class?.name ?? null,
      branchId: branch?.id ?? null,
      branchName: branch?.name ?? null,
      isOutOfSchedule: classId != null && !referenceIds.has(classId),
      practiceLogs: record.practiceLogs.map((log) => ({
        techniqueName: log.studentTechnique?.technique.name ?? log.technique?.name ?? 'Técnica',
        repetitions: log.repetitions,
        place: log.place,
      })),
      student: {
        id: record.student.id,
        firstName: record.student.firstName,
        lastName: record.student.lastName,
        memberNumber: record.student.memberNumber,
        planName: record.student.plan?.name ?? null,
      },
    }
  })

  return NextResponse.json({ records: items, branches })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const scope = await getAdminScope(session.user.id)

  if (!scope) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = bulkActionSchema.safeParse(await request.json().catch(() => null))

  if (!result.success) {
    return NextResponse.json({ error: 'Datos de la acción no válidos' }, { status: 400 })
  }

  const { action, ids } = result.data

  const pending = await db.attendance.findMany({
    where: {
      id: { in: ids },
      status: 'PENDING',
      ...schoolStudentsFilter(scope),
    },
    select: { id: true },
  })

  if (pending.length !== new Set(ids).size) {
    return NextResponse.json({ error: 'Algunos registros no están pendientes o no pertenecen a esta escuela' }, { status: 400 })
  }

  const isConfirmed = action === 'CONFIRMED'

  await db.attendance.updateMany({
    where: { id: { in: pending.map((record) => record.id) } },
    data: {
      status: action,
      present: isConfirmed,
      hoursTrained: isConfirmed ? undefined : 0,
      confirmedById: session.user.id,
      confirmedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, updated: pending.length })
}