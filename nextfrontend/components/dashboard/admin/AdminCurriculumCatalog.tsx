import { GraduationCap, ListChecks } from 'lucide-react'
import type { AdminBeltRankSummary } from '@/types/dashboard'

interface AdminCurriculumCatalogProps {
    ranks: AdminBeltRankSummary[]
}

export function AdminCurriculumCatalog({ ranks }: AdminCurriculumCatalogProps) {
    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a7400]">Administración</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-[#1c1b1b]">Grados y técnicas</h1>
            <p className="mt-2 text-sm text-[#5c403c]">Catálogo curricular configurado para tu escuela.</p>
            {ranks.length === 0 ? (
                <p className="mt-7 border border-[#e5e2e1] bg-white px-5 py-8 text-sm text-[#5c403c]">No hay grados configurados.</p>
            ) : (
                <ol className="mt-7 grid gap-3 sm:grid-cols-2">
                    {ranks.map((rank) => (
                        <li className="border border-[#e5e2e1] bg-white p-5" key={rank.id}>
                            <div className="flex items-start justify-between gap-3">
                                <GraduationCap aria-hidden="true" className="size-5 text-[#b70011]" />
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#8a7400]">Orden {rank.order}</span>
                            </div>
                            <h2 className="mt-4 font-display text-xl font-bold text-[#1c1b1b]">{rank.name}</h2>
                            <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#5c403c]"><ListChecks aria-hidden="true" className="size-4 text-[#b70011]" />{rank.techniqueCount} técnicas asociadas</p>
                        </li>
                    ))}
                </ol>
            )}
        </main>
    )
}