'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Award, BookOpen, CalendarDays, GraduationCap, History, MapPin, Phone, ShieldCheck, Stethoscope } from 'lucide-react'
import { AdminStudentDocuments } from './AdminStudentDocuments'
import { AssignRankDialog } from '../dojo/AssignRankDialog'
import { KataAssignmentDialog } from '../dojo/KataAssignmentDialog'
import { KataBadge } from '../dojo/KataBadge'
import { BeltRankIndicator } from '../shared/BeltRankIndicator'
import type { AdminStudentDetail as StudentDetail } from '@/types/dashboard'

interface AdminStudentDetailProps {
	student: StudentDetail
}

type DetailTab = 'katas' | 'attendance' | 'medical'

function formatDate(value: string | null) {
	if (!value) return '—'
	return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(new Date(value))
}

export function AdminStudentDetail({ student }: AdminStudentDetailProps) {
	const [activeTab, setActiveTab] = useState<DetailTab>('katas')
	const [isAssignRankOpen, setIsAssignRankOpen] = useState(false)
	const [isKataAssignOpen, setIsKataAssignOpen] = useState(false)

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
								<span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-3.5 text-cyan-400" />Alta: {formatDate(student.enrollmentDate)}</span>
							</div>
						</div>
					</div>
					<span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${student.status === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : student.status === 'INACTIVE' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-neutral-700 bg-[#0d1117] text-neutral-300'}`}>
						<ShieldCheck aria-hidden="true" className="size-3.5" />{student.status}
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
						<p className="mt-2 text-[11px] text-neutral-400">Otorgado: {formatDate(student.rankAwardedAt)}</p>
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
			</section>

			<div className="mt-7 border-b border-neutral-800">
				<div className="flex items-center gap-5 text-xs font-semibold">
					{([
						{ key: 'katas' as const, label: 'Katas e historial técnico' },
						{ key: 'attendance' as const, label: 'Asistencias' },
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
											{entry.approvedAt && <span className="text-[11px] text-neutral-400">{formatDate(entry.approvedAt)}</span>}
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
										<CalendarDays aria-hidden="true" className="size-3.5 text-cyan-400" />{formatDate(entry.promotedAt)} · {entry.promoterName ?? 'Sin responsable registrado'}
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
				studentName={`${student.firstName} ${student.lastName}`}
				isOpen={isKataAssignOpen}
				onClose={() => setIsKataAssignOpen(false)}
				assignedTechniqueIds={assignedTechniqueIds}
				availableTechniques={availableTechniques}
			/>
		</main>
	)
}