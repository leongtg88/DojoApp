'use client'

import * as React from 'react'
import type { Matcher } from 'react-day-picker'
import { CalendarDays } from 'lucide-react'
import { Calendar, type CalendarVariant } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatCalendarDate } from '@/lib/format/datetime'
import { toDateKey } from '@/lib/dashboard/schedule-utils'
import { cn } from '@/lib/utils'

export type DatePickerVariant = CalendarVariant

const TRIGGER_CLASSES: Record<DatePickerVariant, string> = {
  dashboard:
    'flex w-full items-center justify-between gap-2 rounded-lg border border-edge-strong bg-surface-1 px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-surface-3/40 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  light:
    'flex w-full items-center justify-between gap-2 rounded-lg border border-brand-accent/60 bg-white px-4 py-2 text-left text-sm text-stone-900 transition-colors hover:border-brand-accent focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50',
  glass:
    'flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left text-sm text-white shadow-inner transition-all hover:border-white/30 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50',
}

const EMPTY_CLASSES: Record<DatePickerVariant, string> = {
  dashboard: 'text-ink-4',
  light: 'text-stone-400',
  glass: 'text-white/40',
}

const ICON_CLASSES: Record<DatePickerVariant, string> = {
  dashboard: 'text-ink-3',
  light: 'text-stone-400',
  glass: 'text-white/40',
}

const CONTENT_CLASSES: Record<DatePickerVariant, string> = {
  dashboard: 'border-edge-strong bg-surface-2 text-ink',
  light: 'border-stone-200 bg-white text-stone-900',
  glass: 'border-white/10 bg-[#161b22] text-white',
}

interface DatePickerProps {
  id?: string
  /** Fecha seleccionada en formato "YYYY-MM-DD". */
  value: string
  /** Se dispara con la fecha elegida en formato "YYYY-MM-DD". */
  onChange: (value: string) => void
  /** Fecha mínima permitida ("YYYY-MM-DD"). */
  min?: string
  /** Fecha máxima permitida ("YYYY-MM-DD"). */
  max?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  /** Lenguaje visual; por defecto el del dashboard. */
  variant?: DatePickerVariant
  /**
   * Presentación del título del mes. Usa `dropdown` en fechas de nacimiento
   * para poder saltar de año sin navegar mes a mes.
   */
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'
  'aria-describedby'?: string
}

/** Convierte una clave "YYYY-MM-DD" a un Date local (medianoche local). */
function parseDateKey(value?: string | null): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Selector de fecha propio (calendario) para reemplazar el `<input type="date">`
 * nativo y poder mostrar siempre la fecha en formato día/mes/año.
 * El valor que expone sigue siendo la clave "YYYY-MM-DD" que espera la API.
 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = 'Selecciona una fecha',
  className,
  variant = 'dashboard',
  captionLayout,
  'aria-describedby': ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = parseDateKey(value)
  const minDate = parseDateKey(min)
  const maxDate = parseDateKey(max)

  const disabledDays: Matcher[] = []
  if (minDate) disabledDays.push({ before: minDate })
  if (maxDate) disabledDays.push({ after: maxDate })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          className={cn(TRIGGER_CLASSES[variant], !selected && EMPTY_CLASSES[variant], className)}
        >
          <span className="truncate">{selected ? formatCalendarDate(value) : placeholder}</span>
          <CalendarDays className={cn('size-4 shrink-0', ICON_CLASSES[variant])} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn('w-auto p-0', CONTENT_CLASSES[variant])}>
        <Calendar
          variant={variant}
          captionLayout={captionLayout}
          mode="single"
          required
          selected={selected}
          defaultMonth={selected ?? maxDate ?? new Date()}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
          onSelect={(date) => {
            onChange(toDateKey(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
