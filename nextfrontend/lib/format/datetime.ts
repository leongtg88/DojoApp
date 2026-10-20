const SANTO_DOMINGO_TIME_ZONE = 'America/Santo_Domingo'

const dateTimeOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SANTO_DOMINGO_TIME_ZONE,
}

const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: SANTO_DOMINGO_TIME_ZONE,
}

// Las fechas de calendario (claves "YYYY-MM-DD", sin hora) se formatean en UTC.
// Interpretarlas en zona de RD las desplazaría un día (quedan guardadas a
// medianoche UTC), así que fijamos UTC para mostrar el día correcto.
const calendarDateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
}

// Clave "YYYY-MM-DD" del día calendario en República Dominicana (en-CA produce
// directamente ese formato). Es la referencia para saber "qué día es hoy".
const calendarKeyOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: SANTO_DOMINGO_TIME_ZONE,
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-DO', dateTimeOptions)
const dateFormatter = new Intl.DateTimeFormat('es-DO', dateOptions)
const calendarDateFormatter = new Intl.DateTimeFormat('es-DO', calendarDateOptions)
const calendarKeyFormatter = new Intl.DateTimeFormat('en-CA', calendarKeyOptions)

const pad = (value: number): string => String(value).padStart(2, '0')

// El motor ICU del servidor y el del navegador usan caracteres de espacio
// distintos (U+00A0 vs U+202F) en "a. m."/"p. m.". Normalizarlos garantiza un
// HTML idéntico en SSR e hidratación, además de fijar la zona horaria de RD.
function normalizeSpaces(value: string): string {
    return value.replace(/[\u00a0\u202f]/g, ' ')
}

function toDate(value: string | Date | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

/** Fecha y hora en zona horaria de República Dominicana (p. ej. "22 sept de 2026, 10:38 p. m."). */
export function formatDateTime(value: string | Date | null | undefined): string {
    const date = toDate(value)
    if (!date) return ''
    return normalizeSpaces(dateTimeFormatter.format(date))
}

/** Fecha larga en zona horaria de República Dominicana (p. ej. "22 de septiembre de 2026"). */
export function formatDate(value: string | Date | null | undefined): string {
    const date = toDate(value)
    if (!date) return ''
    return normalizeSpaces(dateFormatter.format(date))
}

/**
 * Fecha de calendario (solo día) a partir de una clave "YYYY-MM-DD".
 * Se interpreta y formatea en UTC para no desplazar la fecha un día
 * (p. ej. "22 de septiembre de 2026").
 */
export function formatCalendarDate(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') return ''
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime())) return ''
    return normalizeSpaces(calendarDateFormatter.format(date))
}

/**
 * Clave "YYYY-MM-DD" del día actual en República Dominicana. Es la referencia
 * para cálculos de calendario (edades, cumpleaños), independientemente de la
 * zona horaria del servidor o del navegador.
 */
export function todayCalendarKey(now: Date = new Date()): string {
    return calendarKeyFormatter.format(now)
}

/**
 * Clave "YYYY-MM-DD" de una fecha de calendario (sin hora de reloj).
 * Las fechas guardadas en la base de datos (p. ej. `dateOfBirth`) quedan a
 * medianoche UTC, por lo que un `Date` se lee con sus componentes UTC para no
 * restar un día al interpretarlo en zona de RD. Los strings usan su parte YYYY-MM-DD.
 */
export function toCalendarKey(value: string | Date | null | undefined): string | null {
    if (value === null || value === undefined || value === '') return null

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null
        return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

/**
 * Edad cumplida a la fecha `today`, comparando días calendario: la fecha de
 * nacimiento se interpreta como calendario (UTC) y "hoy" en zona de RD.
 */
export function ageFromCalendarDate(
    birth: string | Date | null | undefined,
    today: Date = new Date(),
): number | null {
    const birthKey = toCalendarKey(birth)
    if (!birthKey) return null

    const [birthYear, birthMonth, birthDay] = birthKey.split('-').map(Number)
    const [todayYear, todayMonth, todayDay] = todayCalendarKey(today).split('-').map(Number)

    let age = todayYear - birthYear
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
        age -= 1
    }
    return Math.max(0, age)
}
