'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Award, Check, Loader2, Pencil, Plus, Search, UserCheck, UserMinus, Users, X } from 'lucide-react'
import { BeltRankIndicator } from '../shared/BeltRankIndicator'
import type { AdminBeltRankSummary, AdminStudentSummary } from '@/types/dashboard'

interface AdminStudentsProps {
	students: AdminStudentSummary[]
}

interface BranchOption {
	id: string
	name: string
}

type StudentFormState = {
	firstName: string
	lastName: string
	dateOfBirth: string
	contactPhone: string
	medicalInfo: string
	emergencyContact: string
	branchId: string
	beltRankId: string
}

const emptyForm: StudentFormState = {
	firstName: '',
	lastName: '',
	dateOfBirth: '',
	contactPhone: '',
	medicalInfo: '',
	emergencyContact: '',
	branchId: '',
	beltRankId: '',
}

function statusBadgeClass(status: string) {
	if (status === 'ACTIVE') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
	if (status === 'INACTIVE') return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
	return 'border-neutral-700 bg-[#0d1117] text-neutral-300'
}

function attendanceBadgeClass(percent: number) {
	if (percent >= 85) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
	if (percent >= 50) return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
	return 'border-red-500/30 bg-red-500/10 text-red-200'
}

interface ConfirmModalProps {
	open: boolean
	title: string
	message: string
	confirmLabel: string
	isDestructive?: boolean
	onConfirm: () => void
	onCancel: () => void
}

function ConfirmModal({ open, title, message, confirmLabel, isDestructive = false, onConfirm, onCancel }: ConfirmModalProps) {
	if (!open) return null

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onCancel}>
			<div className="w-full max-w-sm rounded-lg border border-neutral-800 bg-[#161b22] shadow-xl" onClick={(event) => event.stopPropagation()}>
				<div className="border-b border-neutral-800 px-5 py-4">
					<h3 className="font-display text-lg font-bold text-white">{title}</h3>
				</div>
				<p className="px-5 py-4 text-sm text-neutral-300">{message}</p>
				<div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 px-5 py-3.5">
					<button type="button" onClick={onCancel} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white">
						Cancelar
					</button>
					<button type="button" onClick={onConfirm} className={`rounded-md px-4 py-2 text-xs font-semibold text-white ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-500 hover:bg-cyan-400 text-[#0d1117]'}`}>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}

interface StudentFormModalProps {
	open: boolean
	mode: 'create' | 'edit'
	student: AdminStudentSummary | null
	students: AdminStudentSummary[]
	onClose: () => void
	onSaved: () => void
}

function StudentFormModal({ open, mode, student, students, onClose, onSaved }: StudentFormModalProps) {
	const router = useRouter()
	const [form, setForm] = useState<StudentFormState>(emptyForm)
	const [ranks, setRanks] = useState<AdminBeltRankSummary[]>([])
	const [branches, setBranches] = useState<BranchOption[]>([])
	const [isDirty, setIsDirty] = useState(false)
	const [isLoadingOptions, setIsLoadingOptions] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [confirmClose, setConfirmClose] = useState(false)
	const modalKey = `${mode}:${student?.id ?? ''}`
	const [lastModalKey, setLastModalKey] = useState(modalKey)

	if (open && lastModalKey !== modalKey) {
		setLastModalKey(modalKey)
		setForm(
			mode === 'edit' && student
				? {
						firstName: student.firstName,
						lastName: student.lastName,
						dateOfBirth: '',
						contactPhone: '',
						medicalInfo: '',
						emergencyContact: '',
						branchId: '',
						beltRankId: '',
					}
				: emptyForm,
		)
		setIsDirty(false)
		setError(null)
	}

	useEffect(() => {
		if (!open) return

		Promise.all([
			fetch('/api/dashboard/admin/belt-ranks').then((response) => response.json()),
			fetch('/api/dashboard/admin/branches').then((response) => response.json()),
		])
			.then(([ranksResponse, branchesResponse]) => {
				setRanks(ranksResponse.ranks ?? [])
				setBranches(branchesResponse.branches ?? [])
			})
			.catch(() => setError('No fue posible cargar grados y sucursales.'))
			.finally(() => setIsLoadingOptions(false))
	}, [open])

	const year = new Date().getFullYear()
	const prefix = `KYU-${year}-`
	const existingThisYear = students.filter((entry) => entry.memberNumber?.startsWith(prefix)).length
	const nextMemberNumber = `${prefix}${String(existingThisYear + 1).padStart(3, '0')}`

	function updateField<K extends keyof StudentFormState>(field: K, value: string) {
		setForm((previous) => ({ ...previous, [field]: value }))
		setIsDirty(true)
	}

	function handleCreate() {
		if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.branchId) {
			setError('Completa nombre, apellido, fecha de nacimiento y sucursal.')
			return
		}
		setIsSaving(true)
		setError(null)
		fetch('/api/dashboard/admin/students', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: form.firstName.trim(),
				lastName: form.lastName.trim(),
				dateOfBirth: form.dateOfBirth,
				contactPhone: form.contactPhone.trim() || null,
				medicalInfo: form.medicalInfo.trim() || null,
				emergencyContact: form.emergencyContact.trim() || null,
				branchId: form.branchId,
				beltRankId: form.beltRankId || null,
			}),
		})
			.then(async (response) => {
				const payload = await response.json().catch(() => ({}))
				if (!response.ok) throw new Error(payload.error ?? 'No fue posible registrar el alumno.')
				router.refresh()
				onSaved()
			})
			.catch((reason: Error) => setError(reason.message))
			.finally(() => setIsSaving(false))
	}

	function handleUpdate() {
		setIsSaving(true)
		setError(null)
		fetch(`/api/dashboard/admin/students/${student?.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				firstName: form.firstName.trim() || undefined,
				lastName: form.lastName.trim() || undefined,
				contactPhone: form.contactPhone.trim() || null,
				medicalInfo: form.medicalInfo.trim() || null,
				emergencyContact: form.emergencyContact.trim() || null,
			}),
		})
			.then(async (response) => {
				const payload = await response.json().catch(() => ({}))
				if (!response.ok) throw new Error(payload.error ?? 'No fue posible actualizar el alumno.')
				router.refresh()
				onSaved()
			})
			.catch((reason: Error) => setError(reason.message))
			.finally(() => setIsSaving(false))
	}

	function requestClose() {
		if (isDirty) setConfirmClose(true)
		else onClose()
	}

	if (!open) return null

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={requestClose}>
			<div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-neutral-800 bg-[#161b22] shadow-2xl" onClick={(event) => event.stopPropagation()}>
				<div className="flex items-center justify-between border-b border-neutral-800 bg-[#0d1117] px-5 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-900/50 bg-cyan-950/50 text-cyan-400">
							<Award className="h-5 w-5" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-white">{mode === 'create' ? 'Nuevo alumno' : 'Editar alumno'}</h3>
							<p className="text-xs text-neutral-400">
								{mode === 'create' ? `Matrícula sugerida: ${nextMemberNumber}` : student ? `${student.firstName} ${student.lastName}` : 'Actualizar datos'}
							</p>
						</div>
					</div>
					<button type="button" onClick={requestClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex-1 space-y-3 overflow-y-auto p-5">
					{isLoadingOptions && (
						<p className="flex items-center gap-2 text-xs text-neutral-400">
							<Loader2 className="h-4 w-4 animate-spin" /> Cargando opciones...
						</p>
					)}
					<div className="grid gap-3 sm:grid-cols-2">
						<label className="text-sm font-semibold text-neutral-200" htmlFor="student-first-name">
							Nombre *
							<input id="student-first-name" value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" />
						</label>
						<label className="text-sm font-semibold text-neutral-200" htmlFor="student-last-name">
							Apellido *
							<input id="student-last-name" value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" />
						</label>
						<label className="text-sm font-semibold text-neutral-200" htmlFor="student-dob">
							Fecha de nacimiento *
							<input id="student-dob" type="date" value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" />
						</label>
						<label className="text-sm font-semibold text-neutral-200" htmlFor="student-phone">
							Teléfono de contacto
							<input id="student-phone" value={form.contactPhone} onChange={(event) => updateField('contactPhone', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" />
						</label>
						<label className="text-sm font-semibold text-neutral-200" htmlFor="student-branch">
							Sucursal *
							<select id="student-branch" value={form.branchId} onChange={(event) => updateField('branchId', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white">
								<option value="">Selecciona una sucursal</option>
								{branches.map((branch) => (
									<option key={branch.id} value={branch.id}>{branch.name}</option>
								))}
							</select>
						</label>
						{mode === 'create' ? (
							<label className="text-sm font-semibold text-neutral-200" htmlFor="student-initial-rank">
								Grado inicial
								<select id="student-initial-rank" value={form.beltRankId} onChange={(event) => updateField('beltRankId', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white">
									<option value="">Sin grado asignado</option>
									{ranks.map((rank) => (
										<option key={rank.id} value={rank.id}>{rank.kyuDan ? `${rank.kyuDan} · ` : ''}{rank.name}</option>
									))}
								</select>
							</label>
						) : (
							<div className="flex items-end">
								<p className="text-xs text-neutral-400">Para ver o cambiar el grado usa la ficha del alumno.</p>
							</div>
						)}
						<label className="text-sm font-semibold text-neutral-200 sm:col-span-2" htmlFor="student-medical">
							Información médica
							<textarea id="student-medical" rows={2} value={form.medicalInfo} onChange={(event) => updateField('medicalInfo', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" />
						</label>
						<label className="text-sm font-semibold text-neutral-200 sm:col-span-2" htmlFor="student-emergency">
							Contacto de emergencia
							<input id="student-emergency" value={form.emergencyContact} onChange={(event) => updateField('emergencyContact', event.target.value)} className="mt-1.5 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" />
						</label>
					</div>
					{error && <p className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-300">{error}</p>}
				</div>

				<div className="flex items-center justify-end gap-2.5 border-t border-neutral-800 bg-[#0d1117] px-5 py-3.5">
					<button type="button" onClick={requestClose} className="rounded-md border border-neutral-700 bg-[#0d1117] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white">
						Cancelar
					</button>
					<button type="button" onClick={mode === 'create' ? handleCreate : handleUpdate} disabled={isSaving || isLoadingOptions} className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-xs font-semibold text-[#0d1117] disabled:opacity-60">
						{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
						{mode === 'create' ? 'Registrar alumno' : 'Guardar cambios'}
					</button>
				</div>
			</div>

			<ConfirmModal
				open={confirmClose}
				title="Descartar cambios"
				message="Tienes cambios sin guardar. ¿Deseas cerrar esta ventana?"
				confirmLabel="Sí, cerrar"
				onConfirm={() => {
					setConfirmClose(false)
					onClose()
				}}
				onCancel={() => setConfirmClose(false)}
			/>
		</div>
	)
}

export function AdminStudents({ students }: AdminStudentsProps) {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState('')
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [branchFilter, setBranchFilter] = useState('ALL')
	const [beltFilter, setBeltFilter] = useState('ALL')
	const [isCreateOpen, setIsCreateOpen] = useState(false)
	const [editingStudent, setEditingStudent] = useState<AdminStudentSummary | null>(null)
	const [togglingStudent, setTogglingStudent] = useState<AdminStudentSummary | null>(null)
	const [isToggling, setIsToggling] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)

	const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
	const statuses = [...new Set(students.map(({ status }) => status))].sort()
	const branches = [...new Set(students.map(({ branchName }) => branchName))].sort()
	const belts = [...new Set(students.map(({ currentRank }) => currentRank ?? 'SIN_GRADO'))].sort()

	const filteredStudents = students.filter((student) => {
		const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter
		const matchesBranch = branchFilter === 'ALL' || student.branchName === branchFilter
		const matchesBelt = beltFilter === 'ALL' || (beltFilter === 'SIN_GRADO' ? !student.currentRank : student.currentRank === beltFilter)
		const searchable = [student.firstName, student.lastName, student.memberNumber ?? '', student.currentRank ?? '', student.branchName, ...student.activeClassNames]
		const matchesSearch = !normalizedSearch || searchable.some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))

		return matchesStatus && matchesBranch && matchesBelt && matchesSearch
	})

	function handleToggleStatus(student: AdminStudentSummary) {
		const nextStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
		setIsToggling(true)
		setActionError(null)
		fetch(`/api/dashboard/admin/students/${student.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: nextStatus }),
		})
			.then(async (response) => {
				const payload = await response.json().catch(() => ({}))
				if (!response.ok) throw new Error(payload.error ?? 'No fue posible actualizar el estado.')
				router.refresh()
				setTogglingStudent(null)
			})
			.catch((reason: Error) => setActionError(reason.message))
			.finally(() => setIsToggling(false))
	}

	return (
		<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">Administración</p>
					<h1 className="mt-2 font-display text-3xl font-extrabold text-white">Gestión de alumnos</h1>
					<p className="mt-2 text-sm text-neutral-400">Padrón, matrículas, progreso técnico y altas/bajas dentro de tu escuela.</p>
				</div>
				<button type="button" onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 self-start rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] hover:bg-cyan-400">
					<Plus className="size-4" />Nuevo alumno
				</button>
			</div>

			{actionError && <p className="mt-4 rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm font-medium text-red-300">{actionError}</p>}

			{students.length === 0 ? (
				<section className="mt-7 rounded-lg border border-dashed border-neutral-700 bg-[#161b22] px-5 py-10 text-center">
					<Users aria-hidden="true" className="mx-auto size-7 text-cyan-400" />
					<p className="mt-3 text-sm font-semibold text-white">No hay alumnos registrados para este alcance.</p>
				</section>
			) : (
				<section className="mt-7 rounded-lg border border-neutral-800 bg-[#161b22] shadow-sm">
					<div className="grid gap-3 border-b border-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:p-5">
						<label className="relative block" htmlFor="admin-student-search">
							<Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-400" />
							<input className="w-full rounded-md border border-neutral-700 bg-[#0d1117] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-cyan-500" id="admin-student-search" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por alumno, matrícula, grado o clase" type="search" value={searchTerm} />
						</label>
						<label className="text-xs font-semibold text-neutral-300" htmlFor="admin-student-status">
							Estado
							<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="admin-student-status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
								<option value="ALL">Todos</option>
								{statuses.map((status) => (
									<option key={status} value={status}>{status}</option>
								))}
							</select>
						</label>
						<label className="text-xs font-semibold text-neutral-300" htmlFor="admin-student-grade">
							Grado
							<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="admin-student-grade" onChange={(event) => setBeltFilter(event.target.value)} value={beltFilter}>
								<option value="ALL">Todos</option>
								{belts.map((belt) => (
									<option key={belt} value={belt}>{belt === 'SIN_GRADO' ? 'Sin grado' : belt}</option>
								))}
							</select>
						</label>
						<label className="text-xs font-semibold text-neutral-300" htmlFor="admin-student-branch">
							Sucursal
							<select className="mt-1 block w-full rounded-md border border-neutral-700 bg-[#0d1117] px-3 py-2 text-sm text-white" id="admin-student-branch" onChange={(event) => setBranchFilter(event.target.value)} value={branchFilter}>
								<option value="ALL">Todas</option>
								{branches.map((branch) => (
									<option key={branch} value={branch}>{branch}</option>
								))}
							</select>
						</label>
					</div>

					{filteredStudents.length === 0 ? (
						<div className="px-5 py-10 text-center">
							<Users aria-hidden="true" className="mx-auto size-6 text-neutral-500" />
							<p className="mt-3 text-sm font-semibold text-white">No se encontraron alumnos.</p>
							<p className="mt-1 text-sm text-neutral-400">Ajusta los filtros para ver otros expedientes.</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[880px] text-left text-sm">
								<thead className="border-b border-neutral-800 text-xs font-semibold uppercase tracking-wide text-neutral-400">
									<tr>
										<th className="px-5 py-3">Alumno</th>
										<th className="px-5 py-3">Grado</th>
										<th className="px-5 py-3">Katas dominadas</th>
										<th className="px-5 py-3">Asistencia</th>
										<th className="px-5 py-3">Sucursal</th>
										<th className="px-5 py-3">Estado</th>
										<th className="px-5 py-3 text-right">Acciones</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-neutral-800">
									{filteredStudents.map((student) => {
										const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase()
										const kataPercent = student.kataTotalCount > 0 ? Math.round((student.kataMasteredCount / student.kataTotalCount) * 100) : 0

										return (
											<tr key={student.id} className="transition-colors hover:bg-neutral-800/50">
												<td className="px-5 py-4">
													<div className="flex min-w-0 items-center gap-3">
														<span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 font-display text-sm font-extrabold text-cyan-100">{initials}</span>
														<div className="min-w-0">
															<div className="flex flex-wrap items-center gap-2">
																<p className="truncate text-sm font-bold text-white">{student.firstName} {student.lastName}</p>
															</div>
															<p className="mt-1 font-mono text-xs text-neutral-400">{student.memberNumber ?? '—'}</p>
														</div>
													</div>
												</td>
												<td className="px-5 py-4">
													<div className="flex items-center gap-2">
														<BeltRankIndicator rank={{ beltColor: student.beltColor, beltSecondaryColor: student.beltSecondaryColor }} size="sm" />
														<div>
															<p className="text-sm font-semibold text-white">{student.currentRank ?? 'Sin grado'}</p>
															{student.nextRankName && <p className="text-[11px] text-neutral-400">Próximo: {student.nextRankName}</p>}
														</div>
													</div>
												</td>
												<td className="px-5 py-4">
													<div className="text-sm font-semibold text-white">{student.kataMasteredCount}<span className="text-neutral-500"> / {student.kataTotalCount}</span></div>
													<div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-neutral-800">
														<div className="h-full rounded-full bg-cyan-400" style={{ width: `${kataPercent}%` }} />
													</div>
												</td>
												<td className="px-5 py-4">
													<span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${student.attendancePercent === null ? 'border-neutral-700 text-neutral-300' : attendanceBadgeClass(student.attendancePercent)}`}>{student.attendancePercent ?? 0}%</span>
												</td>
												<td className="px-5 py-4 text-xs text-neutral-300">{student.branchName}</td>
												<td className="px-5 py-4">
													<span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(student.status)}`}>{student.status}</span>
												</td>
												<td className="px-5 py-4">
													<div className="flex items-center justify-end gap-1">
														{student.status !== 'ACTIVE' && (
															<button type="button" title="Dar de alta" onClick={() => setTogglingStudent(student)} className="rounded p-1.5 text-emerald-400 transition-colors hover:bg-emerald-950/40">
																<UserCheck className="size-4" />
															</button>
														)}
														{student.status === 'ACTIVE' && (
															<button type="button" title="Dar de baja" onClick={() => setTogglingStudent(student)} className="rounded p-1.5 text-amber-400 transition-colors hover:bg-amber-950/40">
																<UserMinus className="size-4" />
															</button>
														)}
														<button type="button" title="Editar alumno" onClick={() => setEditingStudent(student)} className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
															<Pencil className="size-4" />
														</button>
														<Link href={`/dashboard/admin/alumnos/${student.id}`} title="Ver ficha y promover" className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-cyan-400 transition-colors hover:bg-cyan-950/40 hover:text-cyan-300">
															<Award className="size-4" />Promover
														</Link>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</section>
			)}

			<StudentFormModal open={isCreateOpen} mode="create" student={null} students={students} onClose={() => setIsCreateOpen(false)} onSaved={() => setIsCreateOpen(false)} />
			<StudentFormModal open={editingStudent !== null} mode="edit" student={editingStudent} students={students} onClose={() => setEditingStudent(null)} onSaved={() => setEditingStudent(null)} />

			<ConfirmModal
				open={togglingStudent !== null}
				title={togglingStudent?.status === 'ACTIVE' ? 'Dar de baja al alumno' : 'Dar de alta al alumno'}
				message={togglingStudent ? `¿Confirmas el cambio de estado de ${togglingStudent.firstName} ${togglingStudent.lastName}${togglingStudent.status === 'ACTIVE' ? ' a INACTIVO' : ' a ACTIVO'}? El expediente y su historial se conservan.` : ''}
				confirmLabel={isToggling ? 'Procesando...' : 'Confirmar'}
				isDestructive={togglingStudent?.status === 'ACTIVE'}
				onConfirm={() => {
					if (togglingStudent) handleToggleStatus(togglingStudent)
				}}
				onCancel={() => setTogglingStudent(null)}
			/>
		</main>
	)
}