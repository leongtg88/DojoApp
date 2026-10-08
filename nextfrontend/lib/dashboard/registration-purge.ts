import { Prisma } from '@/lib/generated/prisma'
import { db } from '@/lib/db'
import { deletePrivateDocuments } from '@/lib/document-storage'

/**
 * Elimina la información capturada por el formulario de inscripción de un alumno:
 * - `Student.registrationData`
 * - `Enrollment.registrationData` y notas de la solicitud
 * - El `EnrollmentApplicant` del alumno (perfil físico, cédula, dirección, condición médica, etc.)
 *
 * Se usa cuando se da de baja a un alumno y el administrador elige purgar sus datos.
 * El expediente del alumno (asistencias, grados, katas) se conserva, y no se tocan
 * los aspirantes de otros hermanos en una solicitud familiar.
 */
export async function purgeStudentRegistrationData(studentId: string): Promise<void> {
	await db.$transaction(async (tx) => {
		const enrollments = await tx.enrollment.findMany({
			where: { OR: [{ studentId }, { applicants: { some: { studentId } } }] },
			select: { id: true },
		})
		const enrollmentIds = enrollments.map((enrollment) => enrollment.id)

		await tx.enrollmentApplicant.deleteMany({ where: { studentId } })

		if (enrollmentIds.length > 0) {
			await tx.enrollment.updateMany({
				where: { id: { in: enrollmentIds } },
				data: { registrationData: Prisma.DbNull, notes: null },
			})
		}

		await tx.student.update({
			where: { id: studentId },
			data: { registrationData: Prisma.DbNull },
		})
	})
}

/**
 * Elimina solicitudes de inscripción antiguas que quedaron en PENDING y nunca se
 * convirtieron en alumnos (por ejemplo, enviadas por bots para llenar la base de
 * datos). Borra primero los documentos del storage y luego las filas.
 *
 * Es idempotente y best-effort: si falla el borrado en el storage, igual se
 * eliminan las filas para no acumular datos; los archivos huérfanos se pueden
 * barrer por separado. Devuelve cuántas solicitudes eliminó.
 */
export async function purgeStalePendingEnrollments(olderThanDays = 30, limit = 50): Promise<number> {
	const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

	const stale = await db.enrollment.findMany({
		where: {
			status: 'PENDING',
			createdAt: { lt: cutoff },
			studentId: null,
			applicants: { none: { studentId: { not: null } } },
		},
		select: { id: true, documents: { select: { storageKey: true } } },
		orderBy: { createdAt: 'asc' },
		take: limit,
	})

	if (stale.length === 0) return 0

	const storageKeys = stale.flatMap((enrollment) => enrollment.documents.map(({ storageKey }) => storageKey))
	if (storageKeys.length > 0) {
		try {
			await deletePrivateDocuments(storageKeys)
		} catch (reason) {
			console.error('[purge-inscripciones] no fue posible borrar archivos del storage:', reason)
		}
	}

	const ids = stale.map(({ id }) => id)
	await db.$transaction([
		db.studentDocument.deleteMany({ where: { enrollmentId: { in: ids } } }),
		db.enrollment.deleteMany({ where: { id: { in: ids } } }),
	])

	return ids.length
}
