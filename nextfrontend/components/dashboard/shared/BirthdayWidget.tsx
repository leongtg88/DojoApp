'use client'

import { useState } from 'react'
import { Cake, CakeSlice, Calendar, Check, ClipboardCopy, Heart, Sparkles } from 'lucide-react'
import type { DashboardBirthday } from '@/types/dashboard'

interface BirthdayWidgetProps {
    birthdays: DashboardBirthday[]
    roleFilter?: DashboardBirthday['role'] | 'all'
    title?: string
    maxItems?: number
}

const ROLE_LABELS: Record<DashboardBirthday['role'], string> = {
    student: 'Alumno',
    instructor: 'Sensei',
}

export function BirthdayWidget({
    birthdays,
    roleFilter = 'all',
    title = '¡Cumpleaños hoy!',
    maxItems = 5,
}: BirthdayWidgetProps) {
    const [congratulatedIds, setCongratulatedIds] = useState<Record<string, boolean>>({})
    const [copied, setCopied] = useState(false)
    const filtered = roleFilter === 'all' ? birthdays : birthdays.filter(({ role }) => role === roleFilter)
    const todayBirthdays = filtered.filter(({ isToday }) => isToday)
    const upcomingBirthdays = filtered.filter(({ isToday }) => !isToday)
    const todaySlice = todayBirthdays.slice(0, maxItems)
    const upcomingSlice = upcomingBirthdays.slice(0, maxItems)

    function handleCongratulate(id: string) {
        setCongratulatedIds((previous) => ({ ...previous, [id]: true }))
    }

    function buildWhatsAppMessage() {
        return todayBirthdays
            .map((person) => `🎂 ${person.name} (${computeAge(person)} años) — ${ROLE_LABELS[person.role]}${person.detail ? ` · ${person.detail}` : ''}`)
            .join('\n')
    }

    async function copyMessage() {
        const text = `🥋 ¡Felicidades en su cumpleaños, familia Tosei-Gusoku!\n\n${buildWhatsAppMessage()}\n\n¡Que lo disfrutes rodeado de quienes te queremos! 🎌`
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (filtered.length === 0) {
        return null
    }

    return (
        <section aria-labelledby="birthday-widget-heading" className="mt-7 space-y-3">
            {todayBirthdays.length > 0 && (
                <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-neutral-900/50 p-4 shadow-lg shadow-amber-950/20 sm:p-5">
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-6 size-28 rounded-full bg-amber-500/10 blur-xl" />
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-amber-400"><Cake aria-hidden="true" className="size-4 animate-bounce" /></span>
                            <div>
                                <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-amber-200" id="birthday-widget-heading"><span>{title}</span><Sparkles aria-hidden="true" className="size-3.5 text-amber-400" /></h3>
                                <p className="text-xs text-amber-300/80">La familia Tosei-Gusoku celebra a sus integrantes</p>
                            </div>
                        </div>
                        {todayBirthdays.length > 0 && (
                            <button className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${copied ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 active:scale-95'}`} onClick={copyMessage} type="button">{copied ? <Check aria-hidden="true" className="size-3.5" /> : <ClipboardCopy aria-hidden="true" className="size-3.5" />}{copied ? '¡Copiado!' : 'Copiar para WhatsApp'}</button>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {todaySlice.map((person) => {
                            const isCongratulated = congratulatedIds[person.id]
                            return (
                                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-neutral-900/80 p-3 backdrop-blur-sm" key={person.id}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/15 font-display text-sm font-extrabold text-amber-100">{person.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="truncate text-sm font-bold text-white">{person.name}</p>
                                                <span className="rounded bg-amber-400/20 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">{computeAge(person)} años</span>
                                            </div>
                                            <p className="truncate text-xs text-amber-200/70"><span className="mr-1 font-semibold uppercase tracking-wide">{ROLE_LABELS[person.role]}</span>{person.detail ? `· ${person.detail}` : ''}</p>
                                        </div>
                                    </div>
                                    <button aria-disabled={isCongratulated} className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${isCongratulated ? 'cursor-default border border-amber-500/40 bg-amber-500/20 text-amber-300' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-sm hover:from-amber-400 hover:to-amber-500 active:scale-95'}`} disabled={isCongratulated} onClick={() => handleCongratulate(person.id)} type="button"><Heart aria-hidden="true" className={`size-3.5 ${isCongratulated ? 'fill-amber-400 text-amber-400' : ''}`} />{isCongratulated ? '¡Felicitado!' : 'Felicitar'}</button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {upcomingBirthdays.length > 0 && (
                <div className="rounded-lg border border-neutral-800 bg-[#161b22] p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar aria-hidden="true" className="size-4 text-cyan-400" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">Próximos cumpleaños ({upcomingSlice.length}{upcomingBirthdays.length > upcomingSlice.length ? '+' : ''})</h4>
                        </div>
                        <span className="text-[11px] text-neutral-500">Próximos 60 días</span>
                    </div>
                    <ul className="divide-y divide-neutral-800">
                        {upcomingSlice.map((person) => (
                            <li className="flex items-center justify-between gap-3 py-2.5" key={person.id}>
                                <div className="flex min-w-0 items-center gap-3">
                                    <CakeSlice aria-hidden="true" className="size-4 shrink-0 text-cyan-400" />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">{person.name}</p>
                                        <p className="truncate text-[11px] text-neutral-400"><span className="font-semibold uppercase tracking-wide">{ROLE_LABELS[person.role]}</span>{person.detail ? ` · ${person.detail}` : ''} · {formatBirthday(person.dateOfBirth)}</p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">en {person.daysUntil}d</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}

function computeAge(person: DashboardBirthday) {
    const birth = new Date(person.dateOfBirth)
    const today = new Date()
    const hadBirthday = (today.getMonth() > birth.getMonth()) || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
    return today.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1)
}

function formatBirthday(dateOfBirth: string) {
    const birth = new Date(dateOfBirth)
    const today = new Date()
    const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
    if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        next.setFullYear(next.getFullYear() + 1)
    }
    return new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long' }).format(next)
}