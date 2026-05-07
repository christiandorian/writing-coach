'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

type Tab = 'sign-in' | 'sign-up'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (tab === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account.')
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo/brand */}
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">Writing Coach</h1>
          <p className="text-sm text-[var(--text-secondary)]">Train your thinking. Not your spellcheck.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {(['sign-in', 'sign-up'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setMessage('') }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-[var(--accent)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t === 'sign-in' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-semibold">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--text-secondary)] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-semibold">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={6}
                className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3 text-sm focus:outline-none focus:border-[var(--text-secondary)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--accent-danger)]">{error}</p>
            )}

            {message && (
              <p className="text-sm text-[var(--score-high)]">{message}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : tab === 'sign-in' ? 'Sign in →' : 'Create account →'}
            </Button>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  )
}
