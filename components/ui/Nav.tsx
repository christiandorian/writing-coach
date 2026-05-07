'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  if (pathname === '/session') return null

  const links = [
    { href: '/dashboard', label: 'Practice' },
    { href: '/progress', label: 'Progress' },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-[var(--q-surface-base)] border-b border-[var(--q-border-primary)] px-[var(--q-space-24)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
        <Link href="/dashboard" className="q-sh3 text-[var(--q-text-primary)]">
          Writing Coach
        </Link>
        <div className="flex items-center gap-[var(--q-space-4)]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                'px-[var(--q-space-12)] py-[var(--q-space-8)] rounded-[var(--q-radius-md)] q-sh4 transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-[var(--q-selected-bg)] text-[var(--q-selected-fg)]'
                  : 'text-[var(--q-text-secondary)] hover:bg-[var(--q-btn-tertiary-bg-hover)]',
              ].join(' ')}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
