'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { cn } from '@/lib/utils'

export type CalendarVariant = 'dashboard' | 'light' | 'glass'

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /**
   * Lenguaje visual del calendario: `dashboard` usa los tokens de superficies
   * del panel; `light`/`glass` se ajustan a los formularios públicos.
   */
  variant?: CalendarVariant
}

type ClassNamesMap = NonNullable<React.ComponentProps<typeof DayPicker>['classNames']>

/** Estructura común (grid y celdas) compartida por todas las variantes. */
const LAYOUT_CLASSNAMES: ClassNamesMap = {
  root: 'w-fit',
  months: 'relative flex flex-col',
  month: 'flex flex-col gap-2',
  month_caption: 'flex h-8 items-center justify-center',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  week: 'mt-1 flex w-full',
  day: 'relative size-10 p-0 text-center text-sm',
  hidden: 'invisible',
}

const VARIANT_CLASSNAMES: Record<CalendarVariant, ClassNamesMap> = {
  dashboard: {
    caption_label: 'text-sm font-semibold text-ink',
    nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
    button_previous:
      'inline-flex size-8 items-center justify-center rounded-md border border-edge bg-surface-1 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40',
    button_next:
      'inline-flex size-8 items-center justify-center rounded-md border border-edge bg-surface-1 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40',
    chevron: 'size-4',
    weekday: 'w-10 text-[0.7rem] font-medium uppercase tracking-wide text-ink-4',
    day_button:
      'size-10 rounded-md font-normal text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
    selected: '[&>button]:bg-accent [&>button]:font-semibold [&>button]:text-on-accent [&>button:hover]:bg-accent-strong',
    today: '[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-accent/60',
    outside: '[&>button]:text-ink-4 [&>button]:opacity-50',
    disabled: '[&>button]:pointer-events-none [&>button]:opacity-30',
  },
  light: {
    caption_label: 'text-sm font-semibold text-stone-900',
    nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
    button_previous:
      'inline-flex size-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:pointer-events-none disabled:opacity-40',
    button_next:
      'inline-flex size-8 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:pointer-events-none disabled:opacity-40',
    chevron: 'size-4',
    weekday: 'w-10 text-[0.7rem] font-medium uppercase tracking-wide text-stone-400',
    day_button:
      'size-10 rounded-md font-normal text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
    selected: '[&>button]:bg-red-500 [&>button]:font-semibold [&>button]:text-white [&>button:hover]:bg-red-600',
    today: '[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-red-400',
    outside: '[&>button]:text-stone-300',
    disabled: '[&>button]:pointer-events-none [&>button]:opacity-30',
  },
  glass: {
    caption_label: 'text-sm font-semibold text-white',
    nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
    button_previous:
      'inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-40',
    button_next:
      'inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-40',
    chevron: 'size-4',
    weekday: 'w-10 text-[0.7rem] font-medium uppercase tracking-wide text-white/40',
    day_button:
      'size-10 rounded-md font-normal text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
    selected: '[&>button]:bg-red-500 [&>button]:font-semibold [&>button]:text-white [&>button:hover]:bg-red-600',
    today: '[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-white/40',
    outside: '[&>button]:text-white/25',
    disabled: '[&>button]:pointer-events-none [&>button]:opacity-30',
  },
}

/**
 * Cuando se usan dropdowns de mes/año (útil en fechas de nacimiento), el
 * `<select>` nativo se superpone invisible sobre una etiqueta visible.
 */
const DROPDOWN_LAYOUT_CLASSNAMES: ClassNamesMap = {
  dropdowns: 'flex items-center justify-center gap-1.5',
  dropdown_root: 'relative inline-flex items-center',
  dropdown: 'absolute inset-0 z-10 w-full cursor-pointer appearance-none opacity-0',
}

const DROPDOWN_CAPTION_CLASSNAMES: Record<CalendarVariant, ClassNamesMap> = {
  dashboard: {
    caption_label:
      'pointer-events-none inline-flex items-center gap-1 rounded-md border border-edge bg-surface-1 px-2.5 py-1 text-xs font-semibold text-ink-2',
    chevron: 'size-3.5',
  },
  light: {
    caption_label:
      'pointer-events-none inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700',
    chevron: 'size-3.5',
  },
  glass: {
    caption_label:
      'pointer-events-none inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white',
    chevron: 'size-3.5',
  },
}

/**
 * Calendario estilo shadcn/ui sobre react-day-picker, con variantes que se
 * adaptan a los distintos lenguajes visuales de la app.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant = 'dashboard',
  captionLayout,
  ...props
}: CalendarProps) {
  const usesDropdown =
    captionLayout === 'dropdown' || captionLayout === 'dropdown-months' || captionLayout === 'dropdown-years'

  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('p-3', className)}
      classNames={{
        ...LAYOUT_CLASSNAMES,
        ...VARIANT_CLASSNAMES[variant],
        ...(usesDropdown ? DROPDOWN_LAYOUT_CLASSNAMES : {}),
        ...(usesDropdown ? DROPDOWN_CAPTION_CLASSNAMES[variant] : {}),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === 'left' ? (
            <ChevronLeft className={cn('size-4', chevronClassName)} aria-hidden="true" />
          ) : (
            <ChevronRight className={cn('size-4', chevronClassName)} aria-hidden="true" />
          ),
      }}
      {...props}
    />
  )
}
