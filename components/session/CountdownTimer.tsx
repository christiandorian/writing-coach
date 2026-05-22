'use client'

import { useEffect, useRef, useState } from 'react'
import { formatTime } from '@/lib/utils'

interface CountdownTimerProps {
  totalSeconds: number
  onExpire: () => void
  onTick?: (remaining: number) => void
  hideIcon?: boolean
}

export default function CountdownTimer({ totalSeconds, onExpire, onTick, hideIcon }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const expiredRef = useRef(false)
  // Keep callback refs stable so the tick interval never restarts unnecessarily
  const onExpireRef = useRef(onExpire)
  const onTickRef = useRef(onTick)
  useEffect(() => { onExpireRef.current = onExpire }, [onExpire])
  useEffect(() => { onTickRef.current = onTick }, [onTick])

  useEffect(() => {
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpireRef.current()
      }
      return
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1
        onTickRef.current?.(next)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [remaining])

  const isWarning = remaining <= 3 * 60 && remaining > 60
  const isDanger = remaining <= 60

  return (
    <div className={[
      'flex items-center gap-[var(--q-space-6)]',
      'q-sh3 tabular-nums transition-all duration-300',
      isDanger
        ? 'text-[var(--q-cherry-500)] animate-pulse-danger'
        : isWarning
        ? 'text-[var(--q-sherbert-500)]'
        : 'text-[var(--q-twilight-500)]',
    ].join(' ')}>
      {!hideIcon && (
        <span
          className="material-symbols-rounded"
          style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
        >
          schedule
        </span>
      )}
      {formatTime(remaining)}
    </div>
  )
}
