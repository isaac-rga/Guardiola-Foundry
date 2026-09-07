import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

export type PrototypeVariant = 'A' | 'B'

const variantNames: Record<PrototypeVariant, string> = {
  A: 'Composition table',
  B: 'Construction board',
}

const variants: PrototypeVariant[] = ['A', 'B']

export function PrototypeSwitcher({
  current,
  onChange,
  state,
}: {
  current: PrototypeVariant
  onChange: (variant: PrototypeVariant) => void
  state: unknown
}) {
  const [showState, setShowState] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      const offset = event.key === 'ArrowRight' ? 1 : -1
      const currentIndex = variants.indexOf(current)
      onChange(variants[(currentIndex + offset + variants.length) % variants.length])
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, onChange])

  if (import.meta.env.PROD) return null

  const cycle = (offset: number) => {
    const currentIndex = variants.indexOf(current)
    onChange(variants[(currentIndex + offset + variants.length) % variants.length])
  }

  return (
    <>
      {showState ? (
        <aside className="fixed right-5 bottom-24 z-50 max-h-[55svh] w-[min(32rem,calc(100vw-2.5rem))] overflow-auto rounded-2xl border border-stone-700 bg-stone-950 p-4 text-stone-100 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase">Prototype state</p>
            <Button
              className="text-stone-300 hover:bg-stone-800 hover:text-white"
              onClick={() => setShowState(false)}
              size="xs"
              type="button"
              variant="ghost"
            >
              Close
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-[11px] leading-5 text-stone-300">
            {JSON.stringify(state, null, 2)}
          </pre>
        </aside>
      ) : null}

      <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-stone-700 bg-stone-950 p-1.5 text-stone-100 shadow-2xl">
        <Button
          aria-label="Previous prototype variant"
          className="rounded-full text-stone-200 hover:bg-stone-800 hover:text-white"
          onClick={() => cycle(-1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeftIcon />
        </Button>
        <button
          className="min-w-48 px-3 text-center text-xs font-medium"
          onClick={() => setShowState((currentValue) => !currentValue)}
          type="button"
        >
          {current} — {variantNames[current]}
          <span className="ml-2 text-stone-500">State</span>
        </button>
        <Button
          aria-label="Next prototype variant"
          className="rounded-full text-stone-200 hover:bg-stone-800 hover:text-white"
          onClick={() => cycle(1)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <ArrowRightIcon />
        </Button>
      </div>
    </>
  )
}
