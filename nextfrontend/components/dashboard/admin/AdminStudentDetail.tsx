'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Award, BookOpen, CalendarDays, ClipboardList, GraduationCap, History, Loader2, Mail, MapPin, Phone, ShieldCheck, Stethoscope, Trash2, Users } from 'lucide-react'
import { AdminPlacementModal } from './AdminPlacementModal'
import { AdminStudentDocuments } from './AdminStudentDocuments'
import { AssignRankDialog } from '../dojo/AssignRankDialog'
import { KataAssignmentDialog } from '../dojo/KataAssignmentDialog'
import { KataBadge } from '../dojo/KataBadge'
import { BeltRankIndicator } from '../shared/BeltRankIndicator'
import { InvitationLinkModal } from './InvitationLinkModal'
import type { AdminStudentDetail as StudentDetail } from '@/types/dashboard'

interface AdminStudentDetailProps {
	student: StudentDetail
}

type DetailTab = 'katas' | 'attendance' | 'inscripcion' | 'medical'

function formatDate(value: string | null) {
	if (!value) return '—'
	return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value))
}

function formatDateTime(value: string | null) {
	if (!value) return '—'
	return new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

const ORIGIN_LABELS: Record<string, string> = {
	FORM: 'Formulario web',
	ASSISTANT: 'Asistente virtual',
	MANUAL: 'Registro manual',
}

export function AdminStudentDetail({ student }: AdminStudentDetailProps) {
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<DetailTab>('katas')
	const [isAssignRankOpen, setIsAssignRankOpen] = useState(false)
	const [isKataAssignOpen, setIsKataAssignOpen] = useState(false)
	const [isInviteConfirmOpen, setIsInviteConfirmOpen] = useState(false)
	const [isInviting, setIsInviting] = useState(false)
	const [isPlacementOpen, setIsPlacementOpen] = useState(false)
	const [isPurgeOpen, setIsPurgeOpen] = useState(false)
	const [isPurging, setIsPurging] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [invitationLink, setInvitationLink] = useState<{ url: string; name: string; email: string | null } | null>(null)

	const studentFullName = `${student.firstName} ${student.lastName}`

	async function handleInvite() {
		setIsInviting(true)
		setActionError(null)
		try {
			const response = await fetch(`/api/dashboard/admin/students/${student.id}/invite`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			})
			const payload = await response.json().catch(() => ({})) as { error?: string; invitationUrl?: string }
			if (!response.ok) {
				throw new Error(payload.error ?? 'No fue posible enviar la invitación.')
			}
			setIsInviteConfirmOpen(false)
			router.refresh()
			if (typeof payload.invitationUrl === 'string' && payload.invitationUrl.length > 0) {
				setInvitationLink({ url: payload.invitationUrl, name: studentFullName, email: student.email ?? null })
			}
		} catch (reason: unknown) {
			setActionError(reason instanceof Error ? reason.message : 'No fue posible enviar la invitación.')
		} finally {
			setIsInviting(false)
		}
	}

	async function handlePurgeRegistration() {
		setIsPurging(true)
		setActionError(null)
		try {
			const response = await fetch(`/api/dashboard/admin/students/${student.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ purgeRegistrationData: true }),
			})
			const payload = await response.json().catch(() => ({})) as { error?: string }
			if (!response.ok) {
				throw new Error(payload.error ?? 'No fue posible eliminar la información de inscripción.')
			}
			setIsPurgeOpen(false)
			router.refresh()
		} catch (reason: unknown) {
			setActionError(reason instanceof Error ? reason.message : 'No fue posible eliminar la información de inscripción.')
		} finally {
			setIsPurging(false)
		}
	}

	const currentRankInfo = student.currentRank ? student.availableRanks.find((rank) => rank.name === student.currentRank) : undefined
	const nextRank = student.nextRankName ? student.availableRanks.find((rank) => rank.name === student.nextRankName) : undefined
	const requiredKatas = nextRank?.techniques ?? []
	const masteredCount = student.techniques.filter(({ approved }) => approved).length
	const masteredTowardNext = student.techniques.filter((entry) => entry.approved && requiredKatas.some((required) => required.id === entry.technique.id)).length
	const nextRankPercent = requiredKatas.length > 0 ? Math.round((masteredTowardNext / requiredKatas.length) * 100) : 0
	const eligibleRanks = student.availableRanks.filter((rank) => rank.order > (student.currentRankOrder ?? 0))

	const availableTechniques = [...new Map(student.availableRanks.flatMap((rank) => rank.techniques).map((technique) => [technique.id, technique])).values()]
	const assignedTechniqueIds = student.techniques.map((entry) => entry.technique.id)

	return (
		<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-cyan-300" href="/dashboard/admin/alumnos">
					<ArrowLeft aria-hidden="true" className="size-4" />Volver al padrón
				</Link>
				<div className="flex items-center gap-2">
					{student.accountStatus !== 'ACTIVO' && student.email && (
						<button type="button" onClick={() => setIsInviteConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-[#0d1117] px-3.5 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-100">
							<Mail className="size-4" />{student.accountStatus === 'INVITADO' ? 'Reenviar invitación' : 'Invitar'}
						</button>
					)}
					<button type="button" onClick={() => setIsPlacementOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-3.5 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white">
						<CalendarDays className="size-4" />Plan y horarios
					</button>
					<button type="button" onClick={() => setIsKataAssignOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-neutral-700 bg-[#0d1117] px-3.5 py-2 text-xs font-semibold text-neutral-200 transition-colors hover:bg-neutral-800 hover:text-white">
						<BookOpen className="size-4" />Asignar katas
					</button>
					<button type="button" onClick={() => setIsAssignRankOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400">
						<Award className="size-4" />Asignar nuevo grado
					</button>
				</div>
			</div>

			<section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm sm:p-6">
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
					<div className="flex min-w-0 items-center gap-4">
						<span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-lg font-extrabold text-cyan-100">{`${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()}</span>
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Expediente de alumno</p>
							<div className="mt-1 flex flex-wrap items-center gap-2">
								<h1 className="truncate font-display text-3xl font-extrabold text-white">{student.firstName} {student.lastName}</h1>
								{student.memberNumber && <span className="rounded border border-neutral-700 bg-[#0d1117] px-2 py-0.5 font-mono text-xs font-bold text-neutral-300">{student.memberNumber}</span>}
							</div>
							<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
								<span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 text-cyan-400" />{student.branchName}</span>
								{student.contactPhone && <span className="inline-flex items-center gap-1.5"><Phone aria-hidden="true" className="size-3.5 text-cyan-400" />{student.contactPhone}</span>}
								<span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-3.5 text-cyan-400" />Alta: {formatDateTime(student.enrollmentDate)}</span>
							</div>
						</div>
					</div>
					<span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${student.status === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : student.status === 'INACTIVE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}>
						<ShieldCheck aria-hidden="true" className="size-3.5" />{student.status}
					</span>
					<span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${student.accountStatus === 'ACTIVO' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : student.accountStatus === 'INVITADO' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-400'}`}>
						<Mail aria-hidden="true" className="size-3.5" />Cuenta: {student.accountStatus === 'ACTIVO' ? 'Activa' : student.accountStatus === 'INVITADO' ? 'Pendiente de registro' : 'Sin cuenta'}
					</span>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-800 pt-5 sm:grid-cols-3">
					<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Grado actual</p>
						<div className="mt-2 flex items-center gap-3">
							<BeltRankIndicator rank={currentRankInfo} size="sm" />
							<div>
								<p className="text-sm font-bold text-white">{student.currentRank ?? 'Sin grado asignado'}</p>
								{currentRankInfo?.kyuDan && <p className="text-xs font-semibold text-cyan-300">{currentRankInfo.kyuDan}</p>}
							</div>
						</div>
						<p className="mt-2 text-[11px] text-neutral-400">Otorgado: {formatDateTime(student.rankAwardedAt)}</p>
					</div>

					<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Asistencia</p>
						<div className="mt-2 flex items-center justify-between">
							<p className="text-sm font-bold text-white">{student.attendancePercent ?? 0}%</p>
							{student.attendancePercent !== null && student.attendancePercent >= 85 && (
								<span className="rounded border border-emerald-900/40 bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-400">Apta para examen</span>
							)}
						</div>
						<p className="mt-2 text-[11px] text-neutral-400">{student.attendedCount} de {student.targetAttendances} asistencias registradas</p>
					</div>

					<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Siguiente grado: {student.nextRankName ?? 'Completado'}</p>
						<div className="mt-2 flex items-center justify-between">
							<p className="text-sm font-bold text-cyan-300">{nextRankPercent}%</p>
							<p className="text-xs text-neutral-400">{masteredTowardNext}/{requiredKatas.length} katas</p>
						</div>
						<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
							<div className="h-full rounded-full bg-cyan-400" style={{ width: `${nextRankPercent}%` }} />
						</div>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Plan de mensualidad</p>
						<p className="mt-2 text-sm font-bold text-white">{student.planName ?? 'Sin plan asignado'}</p>
						<p className="mt-1 text-[11px] text-neutral-400">
							{student.planId ? (student.isUnlimitedPlan ? 'Horas ilimitadas' : `${student.planMonthlyHours} h/mes`) : 'Requiere asignación'}
						</p>
						{student.planStartDate && <p className="mt-1 text-[11px] text-neutral-500">Desde: {formatDate(student.planStartDate)}</p>}
					</div>

					<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Beca</p>
						<p className="mt-2 text-sm font-bold text-white">{student.scholarshipType === 'NONE' ? 'Sin beca' : student.scholarshipType === 'ECONOMIC' ? 'Beca económica' : student.scholarshipType === 'MERIT' ? 'Beca por mérito' : 'Beca competidor'}</p>
						<p className="mt-1 text-[11px] text-neutral-400">{student.scholarshipNote || (student.isCompetitor ? 'Competidor de alto rendimiento' : '—')}</p>
					</div>

					<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Horarios de referencia</p>
						<p className="mt-2 text-sm font-bold text-white">{student.activeScheduleNames.length > 0 ? student.activeScheduleNames.join(', ') : 'Sin horario asignado'}</p>
						<p className="mt-1 text-[11px] text-neutral-400">{student.activeScheduleNames.length} horario(s) activo(s)</p>
					</div>
				</div>
			</section>

			<div className="mt-7 border-b border-neutral-800">
				<div className="flex items-center gap-5 text-xs font-semibold">
					{([
						{ key: 'katas' as const, label: 'Katas e historial técnico' },
						{ key: 'attendance' as const, label: 'Asistencias' },
						{ key: 'inscripcion' as const, label: 'Inscripción' },
						{ key: 'medical' as const, label: 'Ficha médica' },
					]).map(({ key, label }) => (
						<button key={key} type="button" onClick={() => setActiveTab(key)} className={`relative cursor-pointer pb-3 transition-colors ${activeTab === key ? 'font-bold text-cyan-300' : 'text-neutral-400 hover:text-white'}`}>
							{label}
							{activeTab === key && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400" />}
						</button>
					))}
				</div>
			</div>

			{activeTab === 'katas' && (
				<div className="mt-5 space-y-5">
					<section className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
						<div className="flex flex-wrap items-start justify-between gap-2">
							<div>
								<h2 className="font-display text-base font-bold text-white">Katas requeridas hacia {student.nextRankName ?? 'el grado máximo'}</h2>
								<p className="mt-1 text-xs text-neutral-400">Estas katas determinan el {nextRankPercent}% de avance al siguiente grado.</p>
							</div>
							<span className="text-xs font-semibold text-cyan-300">{masteredTowardNext} de {requiredKatas.length} dominadas</span>
						</div>
						{requiredKatas.length === 0 ? (
							<p className="mt-4 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] px-4 py-8 text-center text-sm text-neutral-400">
								No hay katas vinculadas a {student.nextRankName ?? 'este grado'}. Usa la opción &ldquo;Asignar katas&rdquo; desde la gestión de grados.
							</p>
						) : (
							<div className="mt-4 divide-y divide-neutral-800 overflow-hidden rounded-lg border border-neutral-800 bg-[#0d1117]">
								{requiredKatas.map((required) => {
									const entry = student.techniques.find(({ technique }) => technique.id === required.id)
									const status = entry?.status ?? 'PENDING'

									return (
										<div key={required.id} className="flex items-center justify-between gap-3 p-3 text-xs transition-colors hover:bg-neutral-800/50">
											<div className="flex items-center gap-3">
												<span className="font-bold text-neutral-500">#{required.order}</span>
												<div>
													<p className="font-bold text-white">{required.name}</p>
													{required.kanji && <span className="ml-1.5 text-neutral-400">{required.kanji}</span>}
													<p className="text-[11px] text-neutral-400">{required.category} · {required.movementsCount ?? '—'} movimientos</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												{entry?.practiceHours ? <span className="text-[11px] text-neutral-400">{entry.practiceHours} h</span> : null}
												<KataBadge status={status} />
											</div>
										</div>
									)
								})}
							</div>
						)}
					</section>

					<section className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<History aria-hidden="true" className="size-4 text-cyan-400" />
								<h2 className="font-display text-base font-bold text-white">Historial técnico del expediente ({masteredCount} acreditadas)</h2>
							</div>
							<span className="text-xs text-neutral-400">Registro permanente</span>
						</div>
						{student.techniques.length === 0 ? (
							<p className="mt-4 rounded-md border border-dashed border-neutral-700 bg-[#0d1117] px-4 py-8 text-center text-sm text-neutral-400">
								Sin técnicas vinculadas. Usa &ldquo;Asignar katas&rdquo; para incorporar katas al expediente.
							</p>
						) : (
							<div className="mt-4 divide-y divide-neutral-800 overflow-hidden rounded-lg border border-neutral-800 bg-[#0d1117]">
								{student.techniques.map((entry) => (
									<div key={entry.id} className="flex items-center justify-between gap-3 p-3 text-xs transition-colors hover:bg-neutral-800/50">
										<div className="flex items-center gap-3">
											<GraduationCap aria-hidden="true" className="size-4 shrink-0 text-cyan-400" />
											<div>
												<p className="font-bold text-white">{entry.technique.name}</p>
												{entry.technique.kanji && <span className="ml-1.5 text-neutral-400">{entry.technique.kanji}</span>}
												<p className="text-[11px] text-neutral-400">{entry.technique.category}</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<KataBadge status={entry.status} />
											{entry.approvedAt && <span className="text-[11px] text-neutral-400">{formatDateTime(entry.approvedAt)}</span>}
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			)}

			{activeTab === 'attendance' && (
				<section className="mt-5 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
					<div className="flex items-center gap-2">
						<CalendarDays aria-hidden="true" className="size-4 text-cyan-400" />
						<h2 className="font-display text-base font-bold text-white">Resumen de asistencia al tatami</h2>
					</div>
					<div className="mt-4 grid gap-4 sm:grid-cols-3">
						<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Porcentaje</p>
							<p className="mt-1 text-2xl font-extrabold text-white">{student.attendancePercent ?? 0}%</p>
						</div>
						<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Registros confirmados</p>
							<p className="mt-1 text-2xl font-extrabold text-white">{student.attendedCount}</p>
						</div>
						<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Meta de referencia</p>
							<p className="mt-1 text-2xl font-extrabold text-white">{student.targetAttendances}</p>
							<p className="mt-1 text-[11px] text-neutral-400">Base para el cómputo de porcentaje.</p>
						</div>
					</div>
				</section>
			)}

			{activeTab === 'inscripcion' && (
				<div className="mt-5 space-y-5">
					<section className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="flex items-center gap-2">
								<ClipboardList aria-hidden="true" className="size-4 text-cyan-400" />
								<h2 className="font-display text-base font-bold text-white">Datos del formulario de inscripción</h2>
							</div>
							<div className="flex flex-wrap items-center gap-2">
							{student.registration.hasForm && (
								<button type="button" onClick={() => setIsPurgeOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-red-900/40 bg-red-950/20 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200">
									<Trash2 className="size-3.5" />Eliminar datos de inscripción
								</button>
							)}
							<span className="rounded border border-neutral-700 bg-[#0d1117] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-300">{ORIGIN_LABELS[student.registration.origin] ?? 'Registro manual'}</span>
						</div>
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-3">
							<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Fecha de inscripción</p>
								<p className="mt-1 text-sm font-semibold text-white">{formatDateTime(student.registration.registeredAt)}</p>
							</div>
							<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Referencia</p>
								<p className="mt-1 text-sm font-semibold text-white">{student.registration.applicantName ?? '—'}</p>
							</div>
							<div className="rounded-lg border border-neutral-800 bg-[#0d1117] p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Estado de la inscripción</p>
								<p className="mt-1 text-sm font-semibold text-white">{student.registration.status ?? '—'}</p>
							</div>
						</div>
					</section>

					{!student.registration.hasForm ? (
						<section className="rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
							<ClipboardList aria-hidden="true" className="mx-auto size-6 text-neutral-500" />
							<p className="mt-3 text-sm font-semibold text-white">Sin formulario de inscripción.</p>
							<p className="mt-1 text-sm text-neutral-400">Este alumno fue creado manualmente o no tiene datos del formulario asociados.</p>
						</section>
					) : (
						<div className="grid gap-4 lg:grid-cols-2">
							{student.registration.groups.map((group) => (
								<section key={group.title} className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
									<h3 className="font-display text-sm font-bold uppercase tracking-wide text-cyan-300">{group.title}</h3>
									<dl className="mt-3 divide-y divide-neutral-800/70">
										{group.fields.map((field) => (
											<div key={field.label} className="flex items-start justify-between gap-4 py-2">
												<dt className="text-xs font-semibold text-neutral-400">{field.label}</dt>
												<dd className="max-w-[60%] break-words text-right text-sm text-neutral-100">{field.value ?? '—'}</dd>
											</div>
										))}
									</dl>
								</section>
							))}
						</div>
					)}

					{student.registration.applicants.length > 0 && (
						<section className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
							<div className="flex items-center gap-2">
								<Users aria-hidden="true" className="size-4 text-cyan-400" />
								<h3 className="font-display text-base font-bold text-white">Aspirantes de la solicitud</h3>
							</div>
							<ul className="mt-3 divide-y divide-neutral-800">
								{student.registration.applicants.map((applicant) => (
									<li key={applicant.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
										<span className="font-semibold text-white">{applicant.name}</span>
										<span className="text-xs text-neutral-400">{formatDate(applicant.dateOfBirth)}</span>
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			)}

			{activeTab === 'medical' && (
				<section className="mt-5 space-y-4">
					<div className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
						<div className="flex items-center gap-2">
							<Stethoscope aria-hidden="true" className="size-4 text-cyan-400" />
							<h2 className="font-display text-base font-bold text-white">Ficha médica</h2>
						</div>
						<p className="mt-3 text-sm text-neutral-300"><span className="font-semibold text-neutral-200">Fecha de nacimiento:</span> {formatDate(student.dateOfBirth)}</p>
						<p className="mt-2 text-sm text-neutral-300"><span className="font-semibold text-neutral-200">Información médica:</span> {student.medicalInfo || 'Sin información registrada.'}</p>
					</div>
					<div className="rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
						<h2 className="font-display text-base font-bold text-white">Contacto de emergencia</h2>
						<p className="mt-3 text-sm text-neutral-300">{student.emergencyContact || 'Sin contacto de emergencia registrado.'}</p>
					</div>
				</section>
			)}

			<AdminStudentDocuments documents={student.documents} studentId={student.id} />

			<section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
				<div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
					<div className="flex items-center gap-2">
						<History aria-hidden="true" className="size-4 text-cyan-400" />
						<h2 className="font-display text-lg font-bold text-white">Historial de grados</h2>
					</div>
					<span className="text-xs font-bold text-neutral-400">{student.rankHistory.length} registros</span>
				</div>
				{student.rankHistory.length === 0 ? (
					<p className="px-5 py-8 text-sm text-neutral-400">No hay ascensos registrados.</p>
				) : (
					<ul className="divide-y divide-neutral-800">
						{student.rankHistory.map((entry) => (
							<li className="flex gap-3 px-5 py-4" key={entry.id}>
								<span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" />
								<div>
									<p className="text-sm font-semibold text-white">{entry.rankName}</p>
									<p className="mt-1 inline-flex items-center gap-1.5 text-xs text-neutral-400">
										<CalendarDays aria-hidden="true" className="size-3.5 text-cyan-400" />{formatDateTime(entry.promotedAt)} · {entry.promoterName ?? 'Sin responsable registrado'}
									</p>
									{entry.examinerName && <p className="mt-1 text-xs text-neutral-400">Sensei examinador: <span className="text-neutral-200">{entry.examinerName}</span></p>}
									{entry.notes && <p className="mt-2 text-sm text-neutral-300">{entry.notes}</p>}
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-sm">
				<p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200"><GraduationCap aria-hidden="true" className="size-3.5 text-cyan-400" />{eligibleRanks.length} grados superiores disponibles</p>
			</section>

			{eligibleRanks.length > 0 && (
				<AssignRankDialog
					student={{ id: student.id, name: `${student.firstName} ${student.lastName}`, memberNumber: student.memberNumber, currentRank: student.currentRank }}
					currentRankOrder={student.currentRankOrder}
					ranks={student.availableRanks}
					isOpen={isAssignRankOpen}
					onClose={() => setIsAssignRankOpen(false)}
				/>
			)}

			<KataAssignmentDialog
				studentId={student.id}
				studentName={studentFullName}
				isOpen={isKataAssignOpen}
				onClose={() => setIsKataAssignOpen(false)}
				assignedTechniqueIds={assignedTechniqueIds}
				availableTechniques={availableTechniques}
			/>

			<AdminPlacementModal
				open={isPlacementOpen}
				studentId={student.id}
				studentName={studentFullName}
				initialPlanId={student.planId}
				initialSchedules={student.activeScheduleIds}
				initialScholarshipType={student.scholarshipType}
				initialScholarshipNote={student.scholarshipNote}
				initialIsCompetitor={student.isCompetitor}
				onClose={() => setIsPlacementOpen(false)}
			/>

			{actionError && (
				<p className="mt-4 rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-300">{actionError}</p>
			)}

			{isInviteConfirmOpen && (
				<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsInviteConfirmOpen(false)}>
					<div className="w-full max-w-md rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<h3 className="font-display text-lg font-bold text-white">{student.accountStatus === 'INVITADO' ? 'Reenviar invitación' : 'Enviar invitación'}</h3>
						<p className="mt-2 text-sm leading-relaxed text-neutral-300">
							Se enviará un correo de invitación a <span className="font-semibold text-white">{student.email}</span> para que {studentFullName} cree su cuenta y acceda al dashboard como estudiante.
						</p>
						{isInviting && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-cyan-300"><Loader2 className="size-4 animate-spin" />Enviando invitación…</p>}
						<div className="mt-5 flex items-center justify-end gap-2.5">
							<button type="button" onClick={() => setIsInviteConfirmOpen(false)} disabled={isInviting} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-50">
								Cancelar
							</button>
							<button type="button" onClick={handleInvite} disabled={isInviting} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] hover:bg-cyan-400 disabled:opacity-50">
								<Mail className="size-4" />{student.accountStatus === 'INVITADO' ? 'Reenviar' : 'Enviar invitación'}
							</button>
						</div>
					</div>
				</div>
			)}

			{isPurgeOpen && (
				<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsPurgeOpen(false)}>
					<div className="w-full max-w-md rounded-lg border border-neutral-800 bg-[#161b22] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<h3 className="font-display text-lg font-bold text-white">Eliminar información de inscripción</h3>
						<p className="mt-2 text-sm leading-relaxed text-neutral-300">
							Se borrarán de forma permanente los datos capturados por el formulario de {studentFullName}: perfil físico, cédula, dirección, padres/tutores, condiciones médicas, motivación y aceptaciones. El expediente, asistencias, grados y katas se conservan.
						</p>
						<p className="mt-2 text-sm font-semibold text-red-300">Esta acción no se puede deshacer.</p>
						{isPurging && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-cyan-300"><Loader2 className="size-4 animate-spin" />Eliminando información…</p>}
						<div className="mt-5 flex items-center justify-end gap-2.5">
							<button type="button" onClick={() => setIsPurgeOpen(false)} disabled={isPurging} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-50">
								Cancelar
							</button>
							<button type="button" onClick={handlePurgeRegistration} disabled={isPurging} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50">
								<Trash2 className="size-4" />Eliminar definitivamente
							</button>
						</div>
					</div>
				</div>
			)}

			<InvitationLinkModal
				open={invitationLink !== null}
				name={invitationLink?.name ?? ''}
				email={invitationLink?.email ?? null}
				url={invitationLink?.url ?? ''}
				onClose={() => setInvitationLink(null)}
			/>
		</main>
	)
}