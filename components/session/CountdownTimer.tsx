'use client'

import { useEffect, useRef, useState } from 'react'
import { formatTime } from '@/lib/utils'

interface CountdownTimerProps {
  totalSeconds: number
  onExpire: () => void
  onTick?: (remaining: number) => void
}

export default function CountdownTimer({ totalSeconds, onExpire, onTick }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        onTick?.(next)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining, onExpire, onTick])

  const isWarning = remaining <= 5 * 60 && remaining > 2 * 60
  const isDanger = remaining <= 2 * 60

  return (
    <div className={[
      'flex items-center gap-[var(--q-space-6)] px-[var(--q-space-12)] py-[var(--q-space-6)]',
      'rounded-[var(--q-radius-full)] q-sh3 tabular-nums transition-all duration-300',
      isDanger
        ? 'bg-[var(--q-cherry-300)]/20 text-[var(--q-cherry-500)] animate-pulse-danger'
        : isWarning
        ? 'bg-[var(--q-sherbert-300)]/30 text-[var(--q-sherbert-500)]'
        : 'bg-[var(--q-surface-bg)] text-[var(--q-text-muted)]',
    ].join(' ')}>
      <span className="q-b5 opacity-60">⏱</span>
      {formatTime(remaining)}
    </div>
  )
}
