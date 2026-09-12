import { Prisma } from '@/lib/generated/prisma'
import { db } from '@/lib/db'

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
