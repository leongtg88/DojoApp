import { startOfDay } from '@/lib/dashboard/holidays'

export type ExamDayValue = 'SATURDAY' | 'SUNDAY'

export const EXAM_DAY_WEEKDAY: Record<ExamDayValue, number> = {
  SUNDAY: 0,
  SATURDAY: 6,
}

export const EXAM_DAY_LABEL: Record<ExamDayValue, string> = {
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export interface Cuatrimestre {
  year: number
  index: number // 0 = Ene–Abr, 1 = May–Ago, 2 = Sep–Dic
  start: Date // inclusive
  end: Date // exclusivo (primer día del siguiente cuatrimestre)
  label: string
}

function cuatrimestreStart(year: number, index: number): Date {
  return new Date(year, index * 4, 1)
}

function cuatrimestreEnd(year: number, index: number): Date {
  return index === 2 ? new Date(year + 1, 0, 1) : new Date(year, (index + 1) * 4, 1)
}

function labelFor(year: number, index: number): string {
  const startMonth = index * 4
  const endMonth = startMonth + 3
  return `${MONTH_LABELS[startMonth]}–${MONTH_LABELS[endMonth]} ${year}`
}

export function makeCuatrimestre(year: number, index: number): Cuatrimestre {
  return {
    year,
    index,
    start: cuatrimestreStart(year, index),
    end: cuatrimestreEnd(year, index),
    label: labelFor(year, index),
  }
}

export function cuatrimestreForDate(date: Date): Cuatrimestre {
  const year = date.getFullYear()
  const index = Math.min(2, Math.floor(date.getMonth() / 4))
  return makeCuatrimestre(year, index)
}

export function nextCuatrimestre(cuatrimestre: Cuatrimestre): Cuatrimestre {
  return cuatrimestre.index === 2
    ? makeCuatrimestre(cuatrimestre.year + 1, 0)
    : makeCuatrimestre(cuatrimestre.year, cuatrimestre.index + 1)
}

export function previousCuatrimestre(cuatrimestre: Cuatrimestre): Cuatrimestre {
  return cuatrimestre.index === 0
    ? makeCuatrimestre(cuatrimestre.year - 1, 2)
    : makeCuatrimestre(cuatrimestre.year, cuatrimestre.index - 1)
}

/** Cuatrimestres que solapan el rango [start, end). */
export function cuatrimestresInRange(start: Date, end: Date): Cuatrimestre[] {
  const result: Cuatrimestre[] = []
  let cursor = cuatrimestreForDate(start)
  const limit = end.getTime()

  while (cursor.start.getTime() < limit) {
    if (cursor.end.getTime() > start.getTime()) result.push(cursor)
    cursor = nextCuatrimestre(cursor)
  }

  return result
}

export function lastDayOf(cuatrimestre: Cuatrimestre): Date {
  const last = new Date(cuatrimestre.end)
  last.setDate(last.getDate() - 1)
  return startOfDay(last)
}

/** Fecha tentativa de examen: para Sep–Dic cae la primera semana de diciembre; en el resto, el último día de examen del cuatrimestre. */
export function tentativeExamDate(cuatrimestre: Cuatrimestre, examDay: ExamDayValue): Date {
  const weekday = EXAM_DAY_WEEKDAY[examDay]

  if (cuatrimestre.index === 2) {
    const first = new Date(cuatrimestre.year, 11, 1)
    const diff = (weekday - first.getDay() + 7) % 7
    first.setDate(first.getDate() + diff)
    return startOfDay(first)
  }

  const last = lastDayOf(cuatrimestre)
  const diff = (last.getDay() - weekday + 7) % 7
  last.setDate(last.getDate() - diff)
  return startOfDay(last)
}

export function formatCuatrimestreExam(date: Date, examDay: ExamDayValue): string {
  return `${EXAM_DAY_LABEL[examDay]} ${date.toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}`
}
