'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface TooltipProps {
  text: string
  children: React.ReactNode
  /** Where the tooltip appears relative to the trigger. Defaults to 'bottom'. */
  position?: 'top' | 'bottom'
}

/**
 * Quizlet design-system tooltip.
 * Renders into a portal so it is never clipped by overflow-hidden ancestors.
 * Dark surface (--q-surface-inverse), inverse text, q-sh5, rounded-md.
 */
export default function Tooltip({ text, children, position = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const computeCoords = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords(
      position === 'bottom'
        ? { top: r.bottom + 4, left: r.left + r.width / 2 }
        : { top: r.top - 4,    left: r.left + r.width / 2 }
    )
  }

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => { computeCoords(); setVisible(true) }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}

      {mounted && createPortal(
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, x: '-50%', y: position === 'bottom' ? -4 : 'calc(-100% + 4px)' }}
              animate={{ opacity: 1, x: '-50%', y: position === 'bottom' ? 0  : '-100%' }}
              exit={{    opacity: 0, x: '-50%', y: position === 'bottom' ? -4 : 'calc(-100% + 4px)' }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 99999 }}
              className={[
                'whitespace-nowrap pointer-events-none select-none',
                'px-[var(--q-space-8)] py-[var(--q-space-4)]',
                'bg-[var(--q-surface-inverse)] text-[var(--q-text-inverse)]',
                'q-sh5 rounded-[var(--q-radius-sm)]',
              ].join(' ')}
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
