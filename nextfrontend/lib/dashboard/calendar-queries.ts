import { db } from '@/lib/db'
import type { ExamConvocationSummary, HolidaySummary } from '@/types/dashboard'

export interface AdminCalendarData {
  holidays: HolidaySummary[]
  convocations: ExamConvocationSummary[]
}

/**
 * Feriados y convocatorias visibles para el alcance: los globales (schoolId null)
 * más los propios de la escuela.
 */
export async function getAdminCalendar(schoolId: string | null): Promise<AdminCalendarData> {
  const [holidays, convocations] = await Promise.all([
    db.holiday.findMany({
      where: schoolId ? { OR: [{ schoolId }, { schoolId: null }] } : {},
      orderBy: { date: 'asc' },
      select: { id: true, name: true, date: true, recurring: true },
    }),
    db.examConvocation.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { date: 'asc' },
      select: { id: true, date: true, examDay: true, label: true, notes: true, confirmed: true },
    }),
  ])

  return {
    holidays: holidays.map((holiday) => ({
      id: holiday.id,
      name: holiday.name,
      date: holiday.date.toISOString(),
      recurring: holiday.recurring,
    })),
    convocations: convocations.map((convocation) => ({
      id: convocation.id,
      date: convocation.date.toISOString(),
      examDay: convocation.examDay,
      label: convocation.label,
      notes: convocation.notes,
      confirmed: convocation.confirmed,
    })),
  }
}
