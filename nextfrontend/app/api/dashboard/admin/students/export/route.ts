import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getAdminScope, scopeSchoolFilter } from '@/lib/dashboard/scope'
import { ClassEnrollmentStatus } from '@/lib/generated/prisma'
import { STUDENT_EXPORT_COLUMNS, buildStudentExportRow } from '@/lib/dashboard/student-export'
import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const session = await auth()

	if (!session?.user?.id) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
	}

	const scope = await getAdminScope(session.user.id)

	if (!scope) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
	}

	const url = new URL(request.url)
	const statusFilter = url.searchParams.get('status') ?? 'ALL'
	const branchFilter = url.searchParams.get('branch') ?? 'ALL'
	const searchTerm = (url.searchParams.get('search') ?? '').trim().toLocaleLowerCase('es')

	const students = await db.student.findMany({
		where: scopeSchoolFilter(scope),
		orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
		select: {
			id: true,
			firstName: true,
			lastName: true,
			gender: true,
			memberNumber: true,
			dateOfBirth: true,
			email: true,
			contactPhone: true,
			currentRank: true,
			status: true,
			enrollmentDate: true,
			scholarshipType: true,
			isCompetitor: true,
			userId: true,
			registrationData: true,
			branch: { select: { name: true } },
			plan: { select: { name: true } },
			invitationTokens: {
				where: { usedAt: null, expiresAt: { gt: new Date() } },
				select: { id: true },
				take: 1,
			},
			classEnrollments: {
				where: { status: ClassEnrollmentStatus.ACTIVE },
				select: { class: { select: { name: true } } },
			},
			enrollments: {
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					origin: true,
					status: true,
					applicantName: true,
					createdAt: true,
					registrationData: true,
					applicants: { select: { id: true, name: true, dateOfBirth: true, profileData: true, studentId: true } },
				},
			},
		},
	})

	const filtered = students.filter((student) => {
		const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter
		const matchesBranch = branchFilter === 'ALL' || student.branch.name === branchFilter
		const searchable = [
			student.firstName,
			student.lastName,
			student.memberNumber ?? '',
			student.currentRank ?? '',
			student.branch.name,
			...student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
		]
		const matchesSearch = !searchTerm || searchable.some((value) => value.toLocaleLowerCase('es').includes(searchTerm))
		return matchesStatus && matchesBranch && matchesSearch
	})

	const rows: (string | number | null)[][] = [
		STUDENT_EXPORT_COLUMNS.map((column) => column.label),
		...filtered.map((student) =>
			buildStudentExportRow({
				id: student.id,
				firstName: student.firstName,
				lastName: student.lastName,
				gender: student.gender,
				memberNumber: student.memberNumber,
				dateOfBirth: student.dateOfBirth,
				email: student.email,
				contactPhone: student.contactPhone,
				currentRank: student.currentRank,
				status: student.status,
				enrollmentDate: student.enrollmentDate,
				scholarshipType: student.scholarshipType,
				isCompetitor: student.isCompetitor,
				branchName: student.branch.name,
				planName: student.plan?.name ?? null,
				accountStatus: student.userId ? 'ACTIVO' : student.invitationTokens.length > 0 ? 'INVITADO' : 'SIN_CUENTA',
				activeClassNames: student.classEnrollments.map(({ class: enrolledClass }) => enrolledClass.name),
				registrationData: student.registrationData as Record<string, unknown> | null,
				enrollments: student.enrollments,
			}),
		),
	]

	const worksheet = XLSX.utils.aoa_to_sheet(rows)
	worksheet['!cols'] = STUDENT_EXPORT_COLUMNS.map((column) => ({ wch: Math.max(14, Math.min(36, column.label.length + 4)) }))
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumnos')

	const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
	const fileName = `alumnos-${new Date().toISOString().slice(0, 10)}.xlsx`

	return new NextResponse(new Uint8Array(buffer), {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Cache-Control': 'no-store',
		},
	})
}
