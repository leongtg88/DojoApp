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

const dateTimeFormatter = new Intl.DateTimeFormat('es-DO', dateTimeOptions)
const dateFormatter = new Intl.DateTimeFormat('es-DO', dateOptions)

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
