'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, IdCard, Loader2, Search, SlidersHorizontal, UserRoundSearch, X } from 'lucide-react'
import { AdminStudentDetail } from './AdminStudentDetail'
import type { AdminStudentDetail as StudentDetail, AdminStudentSummary } from '@/types/dashboard'

interface AdminStudentDetailExplorerProps {
	students: AdminStudentSummary[]
	detail: StudentDetail | null
	selectedId: string | null
}

const RECENTS_KEY = 'admin-alumnos-detalle-recientes'

function statusBadgeClass(status: string) {
	if (status === 'ACTIVE') return 'border-emerald-500/30 bg-emerald-500/10 text-ok-text'
	if (status === 'INACTIVE') return 'border-amber-500/30 bg-amber-500/10 text-warn-text'
	return 'border-edge-strong bg-surface-1 text-ink-2'
}

export function AdminStudentDetailExplorer({ students, detail, selectedId }: AdminStudentDetailExplorerProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const containerRef = useRef<HTMLDivElement>(null)

	const [searchTerm, setSearchTerm] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const [highlighted, setHighlighted] = useState(0)
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [branchFilter, setBranchFilter] = useState('ALL')
	const [beltFilter, setBeltFilter] = useState('ALL')
	const [recentIds, setRecentIds] = useState<string[]>([])

	useEffect(() => {
		const timer = window.setTimeout(() => {
			try {
				const stored = window.localStorage.getItem(RECENTS_KEY)
				if (stored) setRecentIds(JSON.parse(stored) as string[])
			} catch {
				setRecentIds([])
			}
		}, 0)
		return () => window.clearTimeout(timer)
	}, [])

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false)
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const statuses = useMemo(() => [...new Set(students.map(({ status }) => status))].sort(), [students])
	const branches = useMemo(() => [...new Set(students.map(({ branchName }) => branchName))].sort(), [students])
	const belts = useMemo(() => [...new Set(students.map(({ currentRank }) => currentRank ?? 'SIN_GRADO'))].sort(), [students])

	const filteredStudents = useMemo(() => {
		const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es')
		return students.filter((student) => {
			const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter
			const matchesBranch = branchFilter === 'ALL' || student.branchName === branchFilter
			const matchesBelt = beltFilter === 'ALL' || (beltFilter === 'SIN_GRADO' ? !student.currentRank : student.currentRank === beltFilter)
			const searchable = [student.firstName, student.lastName, student.memberNumber ?? '', student.currentRank ?? '', student.branchName, ...student.activeClassNames]
			const matchesSearch = !normalizedSearch || searchable.some((value) => value.toLocaleLowerCase('es').includes(normalizedSearch))
			return matchesStatus && matchesBranch && matchesBelt && matchesSearch
		})
	}, [students, searchTerm, statusFilter, branchFilter, beltFilter])

	const recentStudents = useMemo(
		() => recentIds.map((id) => students.find((student) => student.id === id)).filter((student): student is AdminStudentSummary => Boolean(student)).slice(0, 6),
		[recentIds, students],
	)

	function selectStudent(studentId: string) {
		setIsOpen(false)
		setSearchTerm('')
		setRecentIds((current) => {
			const next = [studentId, ...current.filter((id) => id !== studentId)].slice(0, 6)
			try {
				window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
			} catch {
				/* almacenamiento no disponible */
			}
			return next
		})
		startTransition(() => {
			router.push(`/dashboard/admin/alumnos/detalle?studentId=${studentId}`, { scroll: false })
		})
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter')) {
			setIsOpen(true)
			return
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setHighlighted((index) => Math.min(index + 1, filteredStudents.length - 1))
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault()
			setHighlighted((index) => Math.max(index - 1, 0))
		}
		if (event.key === 'Enter' && filteredStudents[highlighted]) {
			event.preventDefault()
			selectStudent(filteredStudents[highlighted].id)
		}
		if (event.key === 'Escape') setIsOpen(false)
	}

	return (
		<main className="w-full px-4 py-8 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-2">
				<p className="text-sm font-semibold uppercase tracking-wide text-accent">Administración</p>
				<h1 className="font-display text-3xl font-extrabold text-ink">Detalles Alumno</h1>
				<p className="text-sm text-ink-3">Busca y filtra un alumno para ver su expediente completo, documentos, imágenes y exportarlo.</p>
			</div>

			<section className="mt-6 rounded-lg border border-edge bg-surface-2 p-4 shadow-sm sm:p-5">
				<div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.8fr))]">
					<div className="relative" ref={containerRef}>
						<label className="text-xs font-semibold text-ink-2" htmlFor="detalle-alumno-search">Buscar alumno</label>
						<div className="relative mt-1">
							<Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accent" />
							<input
								id="detalle-alumno-search"
								type="search"
								value={searchTerm}
								onFocus={() => setIsOpen(true)}
								onChange={(event) => {
									setSearchTerm(event.target.value)
									setHighlighted(0)
									setIsOpen(true)
								}}
								onKeyDown={handleKeyDown}
								placeholder="Nombre, matrícula, grado o clase"
								className="w-full rounded-md border border-edge-strong bg-surface-1 py-2.5 pl-10 pr-10 text-sm text-ink outline-none placeholder:text-ink-4 focus:border-cyan-500"
								autoComplete="off"
							/>
							{searchTerm && (
								<button type="button" aria-label="Limpiar búsqueda" onClick={() => { setSearchTerm(''); setIsOpen(true) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink">
									<X aria-hidden="true" className="size-4" />
								</button>
							)}
						</div>

						{isOpen && (
							<div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-lg border border-edge-strong bg-surface-1 shadow-xl">
								{filteredStudents.length === 0 ? (
									<p className="px-4 py-6 text-center text-sm text-ink-3">No se encontraron alumnos con esos criterios.</p>
								) : (
									filteredStudents.slice(0, 30).map((student, index) => (
										<button
											key={student.id}
											type="button"
											onMouseEnter={() => setHighlighted(index)}
											onClick={() => selectStudent(student.id)}
											className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${index === highlighted ? 'bg-cyan-500/10' : 'hover:bg-surface-3/60'}`}
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-ink">{student.firstName} {student.lastName}</p>
												<p className="truncate text-[11px] text-ink-3">
													{student.memberNumber ?? 'Sin matrícula'} · {student.currentRank ?? 'Sin grado'} · {student.branchName}
												</p>
											</div>
											<span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(student.status)}`}>{student.status}</span>
											<ArrowRight aria-hidden="true" className="size-4 shrink-0 text-accent" />
										</button>
									))
								)}
							</div>
						)}
					</div>

					<label className="text-xs font-semibold text-ink-2" htmlFor="detalle-status">
						Estado
						<select id="detalle-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2.5 text-sm text-ink">
							<option value="ALL">Todos</option>
							{statuses.map((status) => <option key={status} value={status}>{status}</option>)}
						</select>
					</label>

					<label className="text-xs font-semibold text-ink-2" htmlFor="detalle-grade">
						Grado
						<select id="detalle-grade" value={beltFilter} onChange={(event) => setBeltFilter(event.target.value)} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2.5 text-sm text-ink">
							<option value="ALL">Todos</option>
							{belts.map((belt) => <option key={belt} value={belt}>{belt === 'SIN_GRADO' ? 'Sin grado' : belt}</option>)}
						</select>
					</label>

					<label className="text-xs font-semibold text-ink-2" htmlFor="detalle-branch">
						Sucursal
						<select id="detalle-branch" value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} className="mt-1 block w-full rounded-md border border-edge-strong bg-surface-1 px-3 py-2.5 text-sm text-ink">
							<option value="ALL">Todas</option>
							{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
						</select>
					</label>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-2 border-t border-edge pt-3.5">
					<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-4">
						<SlidersHorizontal aria-hidden="true" className="size-3.5" />{filteredStudents.length} de {students.length} alumnos
					</span>
					{recentStudents.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Recientes:</span>
							{recentStudents.map((student) => (
								<button key={student.id} type="button" onClick={() => selectStudent(student.id)} className="rounded-full border border-edge-strong bg-surface-1 px-2.5 py-1 text-[11px] font-semibold text-ink-2 transition-colors hover:border-cyan-500/40 hover:text-accent-text">
									{student.firstName} {student.lastName}
								</button>
							))}
						</div>
					)}
				</div>
			</section>

			{!selectedId ? (
				<section className="mt-7 rounded-lg border border-dashed border-edge-strong bg-surface-2 px-5 py-14 text-center">
					<UserRoundSearch aria-hidden="true" className="mx-auto size-8 text-accent" />
					<p className="mt-4 text-sm font-semibold text-ink">Selecciona un alumno</p>
					<p className="mx-auto mt-1 max-w-md text-sm text-ink-3">Usa el buscador o los filtros para localizar un expediente. Al seleccionarlo verás toda su información de inscripción, documentos e imágenes.</p>
				</section>
			) : isPending ? (
				<section className="mt-7 flex items-center justify-center gap-2 rounded-lg border border-edge bg-surface-2 px-5 py-20 text-sm font-semibold text-ink-2">
					<Loader2 aria-hidden="true" className="size-5 animate-spin text-accent" />Cargando expediente…
				</section>
			) : detail ? (
				<AdminStudentDetail student={detail} embedded />
			) : (
				<section className="mt-7 rounded-lg border border-dashed border-red-900/40 bg-red-950/10 px-5 py-14 text-center">
					<IdCard aria-hidden="true" className="mx-auto size-8 text-danger-text" />
					<p className="mt-4 text-sm font-semibold text-ink">No se pudo cargar el expediente</p>
					<p className="mx-auto mt-1 max-w-md text-sm text-ink-3">El alumno pudo haber sido eliminado o no pertenece a tu alcance.</p>
				</section>
			)}
		</main>
	)
}
