'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export default function Modal({ open, onClose, children, title, subtitle }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[var(--q-overlay-primary)]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.35, 1.40, 0.25, 1.00] }}
            className="relative z-10 w-full mx-[var(--q-space-16)] bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] shadow-q-lg p-[var(--q-space-24)]"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="absolute top-[var(--q-space-16)] right-[var(--q-space-16)]">
              <Button variant="tertiary" size="medium" circle onClick={onClose}>
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>close</span>
              </Button>
            </div>

            {(title || subtitle) && (
              <div className="mb-[var(--q-space-20)] pr-[var(--q-space-48)] space-y-[var(--q-space-4)]">
                {title && <h2 className="q-h3 text-[var(--q-text-primary)]">{title}</h2>}
                {subtitle && <p className="q-sh4 text-[var(--q-text-secondary)]">{subtitle}</p>}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
