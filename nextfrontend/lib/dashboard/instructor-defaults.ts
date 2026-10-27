/**
 * UX-B4 · Alumno por defecto en Evaluaciones.
 *
 * Prefiere al primer alumno de la clase en curso (el pase de lista que el
 * instructor acaba de abrir) y, si no hay clase, al primero de su lista.
 */
export function pickDefaultEvaluationStudentId(
    rosterStudentIds: readonly string[],
    fallbackStudentIds: readonly string[],
): string | null {
    return rosterStudentIds.find(Boolean) ?? fallbackStudentIds.find(Boolean) ?? null
}
