'use client'

import { useEffect, useState } from 'react'

const KATAKANA_NUMBERS = ['イチ', 'ニ', 'サン', 'ヨン', 'ゴ', 'ロク', 'ナナ', 'ハチ', 'キュウ', 'ジュウ']

export function KatakanaLoader() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((current) => (current + 1) % KATAKANA_NUMBERS.length), 350)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-7 animate-spin">
        <div className="absolute inset-0 rounded-full border-[3px] border-white/20" />
        <div className="katakana-loader-arc absolute inset-0 rounded-full border-[3px] border-transparent border-t-current" />
      </div>
      <span
        key={index}
        aria-hidden="true"
        className="katakana-loader-number katakana-loader-swap inline-flex w-20 justify-center font-display text-xs font-bold tracking-[0.3em]"
      >
        {KATAKANA_NUMBERS[index]}
      </span>
    </div>
  )
}
