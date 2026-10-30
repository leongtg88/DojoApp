import { Prisma } from '@/lib/generated/prisma'
import { db } from '@/lib/db'
import { deletePrivateDocuments, listPrivateDocuments } from '@/lib/document-storage'
import { persistEnrollmentDocument } from '@/lib/dashboard/enrollment-document-storage'

// Prefijo (una sola "carpeta") donde viven los documentos subidos antes de
// confirmar la inscripción.
export const PENDING_UPLOADS_PREFIX = 'enrollments/pending'

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

/**
 * Barre los documentos que se subieron pero nunca se asociaron a una inscripción
 * (por ejemplo, formularios abandonados a mitad de camino). Solo borra objetos
 * con más antigüedad que `olderThanHours`, para no tocar subidas en curso: los
 * tokens de subida caducan en 1 hora.
 *
 * Los documentos ya asociados a una inscripción se migran a su ruta definitiva
 * (fuera de `enrollments/pending`) y se conservan. Los que ya no tienen registro
 * se eliminan.
 *
 * Es best-effort: los errores se registran y no se propagan.
 */
export async function purgeStalePendingUploads(olderThanHours = 24, limit = 100): Promise<number> {
	const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000

	try {
		const objects = await listPrivateDocuments(PENDING_UPLOADS_PREFIX, limit)
		const staleKeys = objects
			.filter((object) => Boolean(object.createdAt) && new Date(object.createdAt as string).getTime() < cutoff)
			.map((object) => `${PENDING_UPLOADS_PREFIX}/${object.name}`)

		if (staleKeys.length === 0) return 0

		const documents = await db.studentDocument.findMany({
			where: { storageKey: { in: staleKeys } },
			select: { id: true, storageKey: true, fileName: true, enrollmentId: true, applicantId: true },
		})
		const referencedKeys = new Set(documents.map(({ storageKey }) => storageKey))

		// Migra los documentos válidos que todavía estén en la carpeta temporal.
		for (const document of documents) {
			if (!document.enrollmentId || !document.applicantId) continue
			await persistEnrollmentDocument({
				document,
				enrollmentId: document.enrollmentId,
				applicantId: document.applicantId,
			})
		}

		const orphanKeys = staleKeys.filter((storageKey) => !referencedKeys.has(storageKey))

		if (orphanKeys.length === 0) return 0

		await deletePrivateDocuments(orphanKeys)
		return orphanKeys.length
	} catch (reason) {
		console.error('[purge-inscripciones] no fue posible barrer subidas pendientes:', reason)
		return 0
	}
}
