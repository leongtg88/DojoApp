'use client'

import { Printer } from 'lucide-react'

export function PrintStudentButton() {
	return (
		<button
			type="button"
			onClick={() => window.print()}
			className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-[#0d1117] transition-colors hover:bg-cyan-400 print:hidden"
		>
			<Printer aria-hidden="true" className="size-4" />Imprimir / Guardar PDF
		</button>
	)
}
