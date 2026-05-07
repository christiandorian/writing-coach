'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function WorkspaceHeader() {
  return (
    <header className="flex items-center justify-between px-[var(--q-space-16)] pt-[var(--q-space-20)] pb-[var(--q-space-16)] flex-shrink-0" style={{ position: 'relative', zIndex: 10000 }}>
      {/* Left — hamburger + logo */}
      <div className="flex items-center gap-[var(--q-space-8)]">
        <Button variant="text-secondary" size="medium" circle title="Menu">
          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>menu</span>
        </Button>
        <img src="/q-logo.png" alt="Quizlet" className="w-8 h-8 object-contain" />
      </div>

      <div />

      {/* Right — avatar */}
      <div className="flex items-center gap-[var(--q-space-8)]">
        <img src="/avatar.png" alt="User avatar" className="w-10 h-10 rounded-[var(--q-radius-full)] object-cover" />
      </div>
    </header>
  )
}
