'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Award, BookOpen, CalendarDays, ClipboardList, FileSpreadsheet, FileText, FolderArchive, GraduationCap, History, Loader2, Mail, MapPin, Phone, ShieldCheck, Stethoscope, Trash2, Users } from 'lucide-react'
import { AdminPlacementModal } from './AdminPlacementModal'
import { AdminStudentDocuments } from './AdminStudentDocuments'
import { AdminStudentMedia } from './AdminStudentMedia'
import { AssignRankDialog } from '../dojo/AssignRankDialog'
import { KataAssignmentDialog } from '../dojo/KataAssignmentDialog'
import { KataBadge } from '../dojo/KataBadge'
import { BeltRankIndicator } from '../shared/BeltRankIndicator'
import { InvitationLinkModal } from './InvitationLinkModal'
import type { AdminStudentDetail as StudentDetail } from '@/types/dashboard'

interface AdminStudentDetailProps {
	student: StudentDetail
	embedded?: boolean
}

type ExportKind = 'excel' | 'zip'

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

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
	PENDING: 'Pendiente',
	CONFIRMED: 'Confirmada',
	REJECTED: 'Rechazada',
	JUSTIFIED: 'Justificada',
}

function attendanceStatusClass(status: string) {
	if (status === 'CONFIRMED') return 'border-emerald-500/30 bg-emerald-500/10 text-ok-text'
	if (status === 'JUSTIFIED') return 'border-cyan-500/30 bg-cyan-500/10 text-accent-text'
	if (status === 'REJECTED') return 'border-red-500/30 bg-red-500/10 text-danger-text'
	return 'border-edge-strong bg-surface-1 text-ink-2'
}

export function AdminStudentDetail({ student, embedded = false }: AdminStudentDetailProps) {
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<DetailTab>('katas')
	const [exporting, setExporting] = useState<ExportKind | null>(null)
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

	async function handleExport(kind: ExportKind) {
		setExporting(kind)
		setActionError(null)
		try {
			const path = kind === 'excel'
				? `/api/dashboard/admin/students/${student.id}/export`
				: `/api/dashboard/admin/students/${student.id}/export/zip`
			const response = await fetch(path)
			if (!response.ok) {
				const payload = await response.json().catch(() => ({})) as { error?: string }
				throw new Error(payload.error ?? 'No fue posible exportar la ficha.')
			}
			const blob = await response.blob()
			const objectUrl = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = objectUrl
			const base = `${student.firstName}-${student.lastName}`
				.normalize('NFKD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^A-Za-z0-9]+/g, '-')
				.replace(/-+/g, '-')
				.replace(/^-|-$/g, '')
				.toLowerCase()
			link.download = `expediente-${base || student.id}.${kind === 'excel' ? 'xlsx' : 'zip'}`
			document.body.appendChild(link)
			link.click()
			link.remove()
			URL.revokeObjectURL(objectUrl)
		} catch (reason: unknown) {
			setActionError(reason instanceof Error ? reason.message : 'No fue posible exportar la ficha.')
		} finally {
			setExporting(null)
		}
	}

	function handlePrint() {
		window.open(`/dashboard/admin/alumnos/detalle/imprimir?studentId=${student.id}`, '_blank', 'noopener,noreferrer')
	}

	const currentRankInfo = student.currentRank ? student.availableRanks.find((rank) => rank.name === student.currentRank) : undefined
	const nextRank = student.nextRankName ? student.availableRanks.find((rank) => rank.name === student.nextRankName) : undefined
	const assignedTechniqueIds = new Set(student.techniques.map((entry) => entry.technique.id))
	const nextRankTechniques = nextRank?.techniques ?? []
	const requiredKatas = nextRankTechniques.filter((technique) => assignedTechniqueIds.has(technique.id))
	const masteredCount = student.techniques.filter(({ approved }) => approved).length
	const masteredTowardNext = student.techniques.filter((entry) => entry.approved && requiredKatas.some((required) => required.id === entry.technique.id)).length
	const nextRankPercent = requiredKatas.length > 0 ? Math.round((masteredTowardNext / requiredKatas.length) * 100) : 0
	const eligibleRanks = student.availableRanks.filter((rank) => rank.order > (student.currentRankOrder ?? 0))

	const availableTechniques = [...new Map(student.availableRanks.flatMap((rank) => rank.techniques).map((technique) => [technique.id, technique])).values()]
	const assignedTechniques = student.techniques.map((entry) => ({ id: entry.technique.id, approved: entry.approved }))

	return (
		<div className={embedded ? 'w-full' : 'mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8'} role={embedded ? undefined : 'main'}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				{embedded ? (
					<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-3">
						<FileText aria-hidden="true" className="size-4 text-accent" />Expediente completo
					</span>
				) : (
					<Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-accent" href="/dashboard/admin/alumnos">
						<ArrowLeft aria-hidden="true" className="size-4" />Volver al padrón
					</Link>
				)}
				<div className="flex flex-wrap items-center gap-2">
					<button type="button" onClick={() => handleExport('excel')} disabled={exporting !== null} className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-50">
						{exporting === 'excel' ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}Excel
					</button>
					<button type="button" onClick={() => handleExport('zip')} disabled={exporting !== null} className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-50">
						{exporting === 'zip' ? <Loader2 className="size-4 animate-spin" /> : <FolderArchive className="size-4" />}ZIP con archivos
					</button>
					<button type="button" onClick={handlePrint} className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-3 hover:text-ink">
						<FileText className="size-4" />Imprimir / PDF
					</button>
					{student.accountStatus !== 'ACTIVO' && student.email && (
						<button type="button" onClick={() => setIsInviteConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-surface-1 px-3.5 py-2 text-xs font-semibold text-accent-text transition-colors hover:bg-cyan-500/10 hover:text-accent-text">
							<Mail className="size-4" />{student.accountStatus === 'INVITADO' ? 'Reenviar invitación' : 'Invitar'}
						</button>
					)}
					<button type="button" onClick={() => setIsPlacementOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-3 hover:text-ink">
						<CalendarDays className="size-4" />Plan y horarios
					</button>
					<button type="button" onClick={() => setIsKataAssignOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-edge-strong bg-surface-1 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-3 hover:text-ink">
						<BookOpen className="size-4" />Asignar katas
					</button>
					<button type="button" onClick={() => setIsAssignRankOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400">
						<Award className="size-4" />Asignar nuevo grado
					</button>
				</div>
			</div>

			<section className="mt-5 rounded-lg border border-edge bg-surface-2 p-5 shadow-sm sm:p-6">
				<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
					<div className="flex min-w-0 items-center gap-4">
						<span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-lg font-extrabold text-accent-text">{`${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()}</span>
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-accent">Expediente de alumno</p>
							<div className="mt-1 flex flex-wrap items-center gap-2">
								<h1 className="truncate font-display text-3xl font-extrabold text-ink">{student.firstName} {student.lastName}</h1>
								{student.memberNumber && <span className="rounded border border-edge-strong bg-surface-1 px-2 py-0.5 font-mono text-xs font-bold text-ink-2">{student.memberNumber}</span>}
							</div>
							<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-3">
								<span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 text-accent" />{student.branchName}</span>
								{student.contactPhone && <span className="inline-flex items-center gap-1.5"><Phone aria-hidden="true" className="size-3.5 text-accent" />{student.contactPhone}</span>}
								<span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-3.5 text-accent" />Alta: <span suppressHydrationWarning>{formatDateTime(student.enrollmentDate)}</span></span>
							</div>
						</div>
					</div>
					<span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${student.status === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-ok-text' : student.status === 'INACTIVE' ? 'border-amber-500/30 bg-amber-500/10 text-warn-text' : 'border-edge-strong bg-surface-1 text-ink-2'}`}>
						<ShieldCheck aria-hidden="true" className="size-3.5" />{student.status}
					</span>
					<span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${student.accountStatus === 'ACTIVO' ? 'border-cyan-500/30 bg-cyan-500/10 text-accent-text' : student.accountStatus === 'INVITADO' ? 'border-amber-500/30 bg-amber-500/10 text-warn-text' : 'border-edge-strong bg-surface-1 text-ink-3'}`}>
						<Mail aria-hidden="true" className="size-3.5" />Cuenta: {student.accountStatus === 'ACTIVO' ? 'Activa' : student.accountStatus === 'INVITADO' ? 'Pendiente de registro' : 'Sin cuenta'}
					</span>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-4 border-t border-edge pt-5 sm:grid-cols-3">
					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Grado actual</p>
						<div className="mt-2 flex items-center gap-3">
							<BeltRankIndicator rank={currentRankInfo} size="sm" />
							<div>
								<p className="text-sm font-bold text-ink">{student.currentRank ?? 'Sin grado asignado'}</p>
								{currentRankInfo?.kyuDan && <p className="text-xs font-semibold text-accent">{currentRankInfo.kyuDan}</p>}
							</div>
						</div>
						<p className="mt-2 text-[11px] text-ink-3">Otorgado: <span suppressHydrationWarning>{formatDateTime(student.rankAwardedAt)}</span></p>
					</div>

					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Asistencia</p>
						<div className="mt-2 flex items-center justify-between">
							<p className="text-sm font-bold text-ink">{student.attendancePercent ?? 0}%</p>
							{student.attendancePercent !== null && student.attendancePercent >= 85 && (
								<span className="rounded border border-emerald-900/40 bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-ok-text">Apta para examen</span>
							)}
						</div>
						<p className="mt-2 text-[11px] text-ink-3">{student.attendedCount} de {student.targetAttendances} asistencias registradas</p>
					</div>

					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Siguiente grado: {student.nextRankName ?? 'Completado'}</p>
						<div className="mt-2 flex items-center justify-between">
							<p className="text-sm font-bold text-accent">{nextRankPercent}%</p>
							<p className="text-xs text-ink-3">{masteredTowardNext}/{requiredKatas.length} katas</p>
						</div>
						<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
							<div className="h-full rounded-full bg-cyan-400" style={{ width: `${nextRankPercent}%` }} />
						</div>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Uniforme</p>
						<p className="mt-2 text-sm font-bold text-ink">{student.giSize ? `Karategi ${student.giSize}` : 'Sin talla de karategi'}</p>
						<p className="mt-1 text-[11px] text-ink-3">{student.beltSize ? `Cinturón ${student.beltSize}` : 'Sin talla de cinturón'}</p>
					</div>

					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Plan de mensualidad</p>
						<p className="mt-2 text-sm font-bold text-ink">{student.planName ?? 'Sin plan asignado'}</p>
						<p className="mt-1 text-[11px] text-ink-3">
							{student.planId ? (student.isUnlimitedPlan ? 'Horas ilimitadas' : `${student.planMonthlyHours} h/mes`) : 'Requiere asignación'}
						</p>
						{student.planStartDate && <p className="mt-1 text-[11px] text-ink-4">Desde: {formatDate(student.planStartDate)}</p>}
					</div>

					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Beca</p>
						<p className="mt-2 text-sm font-bold text-ink">{student.scholarshipType === 'NONE' ? 'Sin beca' : student.scholarshipType === 'ECONOMIC' ? 'Beca económica' : student.scholarshipType === 'MERIT' ? 'Beca por mérito' : 'Beca competidor'}</p>
						<p className="mt-1 text-[11px] text-ink-3">{student.scholarshipNote || (student.isCompetitor ? 'Competidor de alto rendimiento' : '—')}</p>
					</div>

					<div className="rounded-lg border border-edge bg-surface-1 p-4">
						<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Horarios de referencia</p>
						<p className="mt-2 text-sm font-bold text-ink">{student.activeScheduleNames.length > 0 ? student.activeScheduleNames.join(', ') : 'Sin horario asignado'}</p>
						<p className="mt-1 text-[11px] text-ink-3">{student.activeScheduleNames.length} horario(s) activo(s)</p>
					</div>
				</div>
			</section>

			<div className="mt-7 border-b border-edge">
				<div className="flex items-center gap-5 text-xs font-semibold">
					{([
						{ key: 'katas' as const, label: 'Katas e historial técnico' },
						{ key: 'attendance' as const, label: 'Asistencias' },
						{ key: 'inscripcion' as const, label: 'Inscripción' },
						{ key: 'medical' as const, label: 'Ficha médica' },
					]).map(({ key, label }) => (
						<button key={key} type="button" onClick={() => setActiveTab(key)} className={`relative cursor-pointer pb-3 transition-colors ${activeTab === key ? 'font-bold text-accent' : 'text-ink-3 hover:text-ink'}`}>
							{label}
							{activeTab === key && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400" />}
						</button>
					))}
				</div>
			</div>

			{activeTab === 'katas' && (
				<div className="mt-5 space-y-5">
					<section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<div className="flex flex-wrap items-start justify-between gap-2">
							<div>
								<h2 className="font-display text-base font-bold text-ink">Katas requeridas hacia {student.nextRankName ?? 'el grado máximo'}</h2>
								<p className="mt-1 text-xs text-ink-3">Se muestran las katas del plan del grado que el alumno tiene marcadas en su expediente. Desmarcar una kata en &ldquo;Asignar katas&rdquo; la quita de aquí.</p>
							</div>
							<span className="text-xs font-semibold text-accent">{masteredTowardNext} de {requiredKatas.length} dominadas</span>
						</div>
						{requiredKatas.length === 0 ? (
							<div className="mt-4 rounded-md border border-dashed border-edge-strong bg-surface-1 px-4 py-8 text-center text-sm text-ink-3">
								{nextRankTechniques.length === 0 ? (
									<>
										El grado {student.nextRankName ?? 'siguiente'} no tiene katas en el plan. Configúralas en{' '}
										<Link className="font-semibold text-accent hover:text-accent-text" href="/dashboard/admin/grados-y-katas">Grados y katas</Link>.
									</>
								) : (
									<>
										El alumno no tiene marcadas katas del plan de {student.nextRankName ?? 'este grado'}. Usa &ldquo;Asignar katas&rdquo; para seleccionarlas o revisa el plan en{' '}
										<Link className="font-semibold text-accent hover:text-accent-text" href="/dashboard/admin/grados-y-katas">Grados y katas</Link>.
									</>
								)}
							</div>
						) : (
							<div className="mt-4 divide-y divide-edge overflow-hidden rounded-lg border border-edge bg-surface-1">
								{requiredKatas.map((required) => {
									const entry = student.techniques.find(({ technique }) => technique.id === required.id)
									const status = entry?.status ?? 'PENDING'

									return (
										<div key={required.id} className="flex items-center justify-between gap-3 p-3 text-xs transition-colors hover:bg-surface-3/50">
											<div className="flex items-center gap-3">
												<span className="font-bold text-ink-4">#{required.order}</span>
												<div>
													<p className="font-bold text-ink">{required.name}</p>
													{required.kanji && <span className="ml-1.5 text-ink-3">{required.kanji}</span>}
													<p className="text-[11px] text-ink-3">{required.category} · {required.movementsCount ?? '—'} movimientos</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												{entry?.practiceHours ? <span className="text-[11px] text-ink-3">{entry.practiceHours} h</span> : null}
												{entry?.practiceRepetitions ? <span className="text-[11px] text-ink-3">{entry.practiceRepetitions} rep.</span> : null}
												<KataBadge status={status} />
											</div>
										</div>
									)
								})}
							</div>
						)}
					</section>

					<section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<History aria-hidden="true" className="size-4 text-accent" />
								<h2 className="font-display text-base font-bold text-ink">Historial técnico del expediente ({masteredCount} acreditadas)</h2>
							</div>
							<span className="text-xs text-ink-3">Registro permanente</span>
						</div>
						{student.techniques.length === 0 ? (
							<p className="mt-4 rounded-md border border-dashed border-edge-strong bg-surface-1 px-4 py-8 text-center text-sm text-ink-3">
								Sin técnicas vinculadas. Usa &ldquo;Asignar katas&rdquo; para incorporar katas al expediente.
							</p>
						) : (
							<div className="mt-4 divide-y divide-edge overflow-hidden rounded-lg border border-edge bg-surface-1">
								{student.techniques.map((entry) => (
									<div key={entry.id} className="p-3 text-xs transition-colors hover:bg-surface-3/50">
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-3">
												<GraduationCap aria-hidden="true" className="size-4 shrink-0 text-accent" />
												<div>
													<p className="font-bold text-ink">{entry.technique.name}</p>
													{entry.technique.kanji && <span className="ml-1.5 text-ink-3">{entry.technique.kanji}</span>}
													<p className="text-[11px] text-ink-3">
														{entry.technique.category}
														{entry.practiceHours > 0 ? ` · ${entry.practiceHours} h` : ''}
														{entry.practiceRepetitions > 0 ? ` · ${entry.practiceRepetitions} rep.` : ''}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<KataBadge status={entry.status} />
												{entry.approvedAt && <span className="text-[11px] text-ink-3" suppressHydrationWarning>{formatDateTime(entry.approvedAt)}</span>}
											</div>
										</div>
										{entry.practiceLogs.length > 0 && (
											<ul className="mt-2 ml-7 space-y-1 border-l border-edge pl-3 text-[11px] text-ink-3">
												{entry.practiceLogs.slice(0, 5).map((log) => (
													<li key={log.id}>
														{formatDate(log.date)} · {log.repetitions} rep. · {log.place === 'DOJO' ? 'En el dojo' : 'Fuera del dojo'}
														{log.notes ? ` · ${log.notes}` : ''}
													</li>
												))}
												{entry.practiceLogs.length > 5 && <li className="text-ink-4">+{entry.practiceLogs.length - 5} registros más</li>}
											</ul>
										)}
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			)}

			{activeTab === 'attendance' && (
				<div className="mt-5 space-y-5">
					<section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<div className="flex items-center gap-2">
							<CalendarDays aria-hidden="true" className="size-4 text-accent" />
							<h2 className="font-display text-base font-bold text-ink">Resumen de asistencia al tatami</h2>
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-3">
							<div className="rounded-lg border border-edge bg-surface-1 p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Porcentaje</p>
								<p className="mt-1 text-2xl font-extrabold text-ink">{student.attendancePercent ?? 0}%</p>
							</div>
							<div className="rounded-lg border border-edge bg-surface-1 p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Registros confirmados</p>
								<p className="mt-1 text-2xl font-extrabold text-ink">{student.attendedCount}</p>
							</div>
							<div className="rounded-lg border border-edge bg-surface-1 p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Meta de referencia</p>
								<p className="mt-1 text-2xl font-extrabold text-ink">{student.targetAttendances}</p>
								<p className="mt-1 text-[11px] text-ink-3">Base para el cómputo de porcentaje.</p>
							</div>
						</div>
					</section>

					<section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<History aria-hidden="true" className="size-4 text-accent" />
								<h2 className="font-display text-base font-bold text-ink">Historial de asistencias</h2>
							</div>
							<span className="text-xs font-bold text-ink-3">{student.attendanceHistory.length} registros</span>
						</div>
						{student.attendanceHistory.length === 0 ? (
							<p className="mt-4 rounded-md border border-dashed border-edge-strong bg-surface-1 px-4 py-8 text-center text-sm text-ink-3">Sin asistencias registradas.</p>
						) : (
							<div className="mt-4 divide-y divide-edge overflow-hidden rounded-lg border border-edge bg-surface-1">
								{student.attendanceHistory.map((entry) => (
									<div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs">
										<div className="flex items-center gap-3">
											<span className={`size-2 shrink-0 rounded-full ${entry.present ? 'bg-emerald-400' : 'bg-red-400'}`} />
											<div>
												<p className="font-bold text-ink" suppressHydrationWarning>{formatDateTime(entry.date)}</p>
												<p className="text-[11px] text-ink-3">
													{entry.className ?? 'Sin clase'} · {entry.hoursTrained} h{entry.sessionType ? ` · ${entry.sessionType}` : ''}
												</p>
												{entry.confirmedByName && <p className="text-[11px] text-ink-4">Confirmada por {entry.confirmedByName}</p>}
											</div>
										</div>
										<span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${attendanceStatusClass(entry.status)}`}>
											{ATTENDANCE_STATUS_LABELS[entry.status] ?? entry.status}
										</span>
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			)}

			{activeTab === 'inscripcion' && (
				<div className="mt-5 space-y-5">
					<section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="flex items-center gap-2">
								<ClipboardList aria-hidden="true" className="size-4 text-accent" />
								<h2 className="font-display text-base font-bold text-ink">Datos del formulario de inscripción</h2>
							</div>
							<div className="flex flex-wrap items-center gap-2">
							{student.registration.hasForm && (
								<button type="button" onClick={() => setIsPurgeOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-red-900/40 bg-red-950/20 px-2.5 py-1.5 text-[11px] font-semibold text-danger-text transition-colors hover:bg-red-950/40 hover:text-danger-text">
									<Trash2 className="size-3.5" />Eliminar datos de inscripción
								</button>
							)}
							<span className="rounded border border-edge-strong bg-surface-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-2">{ORIGIN_LABELS[student.registration.origin] ?? 'Registro manual'}</span>
						</div>
						</div>
						<div className="mt-4 grid gap-4 sm:grid-cols-3">
							<div className="rounded-lg border border-edge bg-surface-1 p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Fecha de inscripción</p>
								<p className="mt-1 text-sm font-semibold text-ink" suppressHydrationWarning>{formatDateTime(student.registration.registeredAt)}</p>
							</div>
							<div className="rounded-lg border border-edge bg-surface-1 p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Referencia</p>
								<p className="mt-1 text-sm font-semibold text-ink">{student.registration.applicantName ?? '—'}</p>
							</div>
							<div className="rounded-lg border border-edge bg-surface-1 p-4">
								<p className="text-[10px] font-bold uppercase tracking-wider text-ink-4">Estado de la inscripción</p>
								<p className="mt-1 text-sm font-semibold text-ink">{student.registration.status ?? '—'}</p>
							</div>
						</div>
					</section>

					{!student.registration.hasForm ? (
						<section className="rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-10 text-center">
							<ClipboardList aria-hidden="true" className="mx-auto size-6 text-ink-4" />
							<p className="mt-3 text-sm font-semibold text-ink">Sin formulario de inscripción.</p>
							<p className="mt-1 text-sm text-ink-3">Este alumno fue creado manualmente o no tiene datos del formulario asociados.</p>
						</section>
					) : (
						<div className="grid gap-4 lg:grid-cols-2">
							{student.registration.groups.map((group) => (
								<section key={group.title} className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
									<h3 className="font-display text-sm font-bold uppercase tracking-wide text-accent">{group.title}</h3>
									<dl className="mt-3 divide-y divide-edge/70">
										{group.fields.map((field) => (
											<div key={field.label} className="flex items-start justify-between gap-4 py-2">
												<dt className="text-xs font-semibold text-ink-3">{field.label}</dt>
												<dd className="max-w-[60%] break-words text-right text-sm text-ink">{field.value ?? '—'}</dd>
											</div>
										))}
									</dl>
								</section>
							))}
						</div>
					)}

					{student.registration.applicants.length > 0 && (
						<section className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
							<div className="flex items-center gap-2">
								<Users aria-hidden="true" className="size-4 text-accent" />
								<h3 className="font-display text-base font-bold text-ink">Aspirantes de la solicitud</h3>
							</div>
							<ul className="mt-3 divide-y divide-edge">
								{student.registration.applicants.map((applicant) => (
									<li key={applicant.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
										<span className="font-semibold text-ink">{applicant.name}</span>
										<span className="text-xs text-ink-3" suppressHydrationWarning>{formatDate(applicant.dateOfBirth)}</span>
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			)}

			{activeTab === 'medical' && (
				<section className="mt-5 space-y-4">
					<div className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<div className="flex items-center gap-2">
							<Stethoscope aria-hidden="true" className="size-4 text-accent" />
							<h2 className="font-display text-base font-bold text-ink">Ficha médica</h2>
						</div>
						<p className="mt-3 text-sm text-ink-2"><span className="font-semibold text-ink">Fecha de nacimiento:</span> <span suppressHydrationWarning>{formatDate(student.dateOfBirth)}</span></p>
						<p className="mt-2 text-sm text-ink-2"><span className="font-semibold text-ink">Información médica:</span> {student.medicalInfo || 'Sin información registrada.'}</p>
					</div>
					<div className="rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
						<h2 className="font-display text-base font-bold text-ink">Contacto de emergencia</h2>
						<p className="mt-3 text-sm text-ink-2">{student.emergencyContact || 'Sin contacto de emergencia registrado.'}</p>
					</div>
				</section>
			)}

			<AdminStudentMedia documents={student.documents} />

			<AdminStudentDocuments documents={student.documents} studentId={student.id} />

			<section className="mt-7 rounded-lg border border-edge bg-surface-2 shadow-sm">
				<div className="flex items-center justify-between border-b border-edge px-5 py-4">
					<div className="flex items-center gap-2">
						<History aria-hidden="true" className="size-4 text-accent" />
						<h2 className="font-display text-lg font-bold text-ink">Historial de grados</h2>
					</div>
					<span className="text-xs font-bold text-ink-3">{student.rankHistory.length} registros</span>
				</div>
				{student.rankHistory.length === 0 ? (
					<p className="px-5 py-8 text-sm text-ink-3">No hay ascensos registrados.</p>
				) : (
					<ul className="divide-y divide-edge">
						{student.rankHistory.map((entry) => (
							<li className="flex gap-3 px-5 py-4" key={entry.id}>
								<span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" />
								<div>
									<p className="text-sm font-semibold text-ink">{entry.rankName}</p>
									<p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-3">
										<CalendarDays aria-hidden="true" className="size-3.5 text-accent" /><span suppressHydrationWarning>{formatDateTime(entry.promotedAt)}</span> · {entry.promoterName ?? 'Sin responsable registrado'}
									</p>
									{entry.examinerName && <p className="mt-1 text-xs text-ink-3">Sensei examinador: <span className="text-ink">{entry.examinerName}</span></p>}
									{entry.notes && <p className="mt-2 text-sm text-ink-2">{entry.notes}</p>}
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="mt-7 rounded-lg border border-edge bg-surface-2 p-5 shadow-sm">
				<p className="flex items-center gap-1.5 text-xs font-semibold text-ink"><GraduationCap aria-hidden="true" className="size-3.5 text-accent" />{eligibleRanks.length} grados superiores disponibles</p>
			</section>

			{student.availableRanks.length > 0 && (
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
				assignedTechniques={assignedTechniques}
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
				<p className="mt-4 rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-danger-text">{actionError}</p>
			)}

			{isInviteConfirmOpen && (
				<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsInviteConfirmOpen(false)}>
					<div className="w-full max-w-md rounded-lg border border-edge bg-surface-2 p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<h3 className="font-display text-lg font-bold text-ink">{student.accountStatus === 'INVITADO' ? 'Reenviar invitación' : 'Enviar invitación'}</h3>
						<p className="mt-2 text-sm leading-relaxed text-ink-2">
							Se enviará un correo de invitación a <span className="font-semibold text-ink">{student.email}</span> para que {studentFullName} cree su cuenta y acceda al dashboard como estudiante.
						</p>
						{isInviting && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-accent"><Loader2 className="size-4 animate-spin" />Enviando invitación…</p>}
						<div className="mt-5 flex items-center justify-end gap-2.5">
							<button type="button" onClick={() => setIsInviteConfirmOpen(false)} disabled={isInviting} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink disabled:opacity-50">
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
					<div className="w-full max-w-md rounded-lg border border-edge bg-surface-2 p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<h3 className="font-display text-lg font-bold text-ink">Eliminar información de inscripción</h3>
						<p className="mt-2 text-sm leading-relaxed text-ink-2">
							Se borrarán de forma permanente los datos capturados por el formulario de {studentFullName}: perfil físico, cédula, dirección, padres/tutores, condiciones médicas, motivación y aceptaciones. El expediente, asistencias, grados y katas se conservan.
						</p>
						<p className="mt-2 text-sm font-semibold text-danger-text">Esta acción no se puede deshacer.</p>
						{isPurging && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-accent"><Loader2 className="size-4 animate-spin" />Eliminando información…</p>}
						<div className="mt-5 flex items-center justify-end gap-2.5">
							<button type="button" onClick={() => setIsPurgeOpen(false)} disabled={isPurging} className="rounded-md border border-edge-strong bg-surface-1 px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-surface-3 hover:text-ink disabled:opacity-50">
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
		</div>
	)
}