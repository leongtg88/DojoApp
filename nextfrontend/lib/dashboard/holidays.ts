/**
 * Feriados oficiales de la República Dominicana y utilidades de calendario.
 *
 * Reglas:
 *  - Fijos (inamovibles): 1 ene, 21 ene, 27 feb, Viernes Santo, Corpus Christi,
 *    24 sep y 25 dic.
 *  - Movibles (Ley 139-97, art. 1): si caen martes/miércoles pasan al lunes
 *    anterior; si caen jueves/viernes pasan al lunes siguiente. Sábado, domingo
 *    y lunes se quedan.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface HolidayRow {
  date: Date
  recurring: boolean
}

/** Domingo de Resurrección (algoritmo gregoriano anónimo). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Aplica el traslado al lunes de la Ley 139-97 a un feriado movible. */
export function observedHolidayDate(date: Date, movable: boolean): Date {
  if (!movable) return new Date(date)
  const weekday = date.getDay()
  if (weekday === 2 || weekday === 3) return addDays(date, weekday === 2 ? -1 : -2)
  if (weekday === 4 || weekday === 5) return addDays(date, 8 - weekday)
  return new Date(date)
}

export interface DominicanHoliday {
  name: string
  date: Date
  movable: boolean
}

/** Feriados oficiales de RD para un año, con la fecha ya observada. */
export function dominicanHolidays(year: number): DominicanHoliday[] {
  const easter = easterSunday(year)
  const raw: DominicanHoliday[] = [
    { name: 'Año Nuevo', date: new Date(year, 0, 1), movable: false },
    { name: 'Día de los Santos Reyes', date: new Date(year, 0, 6), movable: true },
    { name: 'Nuestra Señora de la Altagracia', date: new Date(year, 0, 21), movable: false },
    { name: 'Natalicio de Juan Pablo Duarte', date: new Date(year, 0, 26), movable: true },
    { name: 'Día de la Independencia', date: new Date(year, 1, 27), movable: false },
    { name: 'Viernes Santo', date: addDays(easter, -2), movable: false },
    { name: 'Día del Trabajo', date: new Date(year, 4, 1), movable: true },
    { name: 'Corpus Christi', date: addDays(easter, 60), movable: false },
    { name: 'Día de la Restauración', date: new Date(year, 7, 16), movable: true },
    { name: 'Nuestra Señora de las Mercedes', date: new Date(year, 8, 24), movable: false },
    { name: 'Día de la Constitución', date: new Date(year, 10, 6), movable: true },
    { name: 'Día de Navidad', date: new Date(year, 11, 25), movable: false },
  ]

  return raw.map((holiday) => ({ ...holiday, date: observedHolidayDate(holiday.date, holiday.movable) }))
}

/** Clave de día local `YYYY-MM-DD`. */
export function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function yearsBetween(start: Date, end: Date): number[] {
  const years: number[] = []
  for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) years.push(year)
  return years
}

/**
 * Conjunto de feriados para un rango: feriados oficiales RD de cada año más los
 * registrados en base de datos (recurrentes expandidos por año).
 */
export function buildHolidaySet(rows: HolidayRow[], start: Date, end: Date): Set<string> {
  const keys = new Set<string>()

  for (const year of yearsBetween(start, end)) {
    for (const holiday of dominicanHolidays(year)) keys.add(dateKey(holiday.date))
  }

  for (const row of rows) {
    if (row.recurring) {
      for (const year of yearsBetween(start, end)) {
        keys.add(dateKey(new Date(year, row.date.getMonth(), row.date.getDate())))
      }
    } else {
      keys.add(dateKey(row.date))
    }
  }

  return keys
}

export function isHoliday(holidaySet: Set<string>, date: Date): boolean {
  return holidaySet.has(dateKey(date))
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY)
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
