'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function WorkspaceHeader() {
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <header
      className="flex items-center justify-between px-[var(--q-space-16)] pt-[var(--q-space-20)] pb-[var(--q-space-16)] flex-shrink-0"
      style={{ position: 'relative', zIndex: 10000 }}
    >
      {/* Left — menu + logo */}
      <div className="flex items-center gap-[var(--q-space-8)]">
        <Button variant="text-secondary" size="medium" circle title="Menu">
          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>menu</span>
        </Button>
        <img src="/q-logo.png" alt="Quizlet" className="w-8 h-8 object-contain" />
      </div>

      <div />

      {/* Right — avatar + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-[var(--q-radius-full)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--q-twilight-300)] focus-visible:ring-offset-2"
        >
          <img
            src="/avatar.png"
            alt="User avatar"
            className="w-10 h-10 rounded-[var(--q-radius-full)] object-cover"
          />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 mt-[var(--q-space-8)] bg-[var(--q-surface-base)] py-[var(--q-space-4)] min-w-[160px]"
            style={{
              borderRadius: 'var(--q-radius-lg)',
              border: '1px solid var(--q-border-primary)',
              boxShadow: 'var(--q-shadow-md)',
              zIndex: 10001,
            }}
          >
            <button
              onClick={handleSignOut}
              className="w-full text-left px-[var(--q-space-16)] py-[var(--q-space-10)] q-b4 text-[var(--q-text-secondary)] hover:bg-[var(--q-surface-bg)] hover:text-[var(--q-text-primary)] transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
