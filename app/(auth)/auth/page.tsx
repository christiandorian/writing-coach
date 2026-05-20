'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--q-surface-bg)] flex items-center justify-center p-[var(--q-space-16)]">

      {/* Noise texture */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', mixBlendMode: 'multiply' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <filter id="auth-noise" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.133 0.133" stitchTiles="stitch" numOctaves="3" result="noise" seed="1367"/>
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise"/>
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/>
              </feComponentTransfer>
              <feFlood floodColor="#DBDFFF" result="color1Flood"/>
              <feComposite operator="in" in2="coloredNoise1" in="color1Flood" result="color1"/>
              <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="color1"/></feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="white" filter="url(#auth-noise)"/>
        </svg>
      </div>

      {/* Card */}
      <div
        className="relative bg-[var(--q-surface-base)] flex flex-col items-center py-[var(--q-space-48)] px-[var(--q-space-48)] gap-[var(--q-space-32)] w-full max-w-[608px] overflow-hidden"
        style={{
          zIndex: 10000,
          borderRadius: 'var(--q-radius-xxl)',
          border: '1px solid var(--q-twilight-200)',
          boxShadow: '0 -1px 0 0 #EDEFFF, 0 4px 0 0 rgba(66, 85, 255, 0.25)',
        }}
      >
        {/* brand-write icon */}
        <img
          src="/brand-write.png"
          alt=""
          style={{ width: 88, height: 88 }}
          className="object-contain"
        />

        {/* Title block */}
        <div className="flex flex-col gap-[var(--q-space-8)] items-center text-center w-full">
          <p className="q-h2 text-[var(--q-text-primary)]">Write by Quizlet</p>
          <p className="q-sh3 text-[var(--q-text-secondary)]">Structure and write better essays under pressure</p>
        </div>

        {/* Auth form */}
        <div className="flex flex-col gap-[var(--q-space-32)] items-center w-full">
          {/* Google SSO */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex items-center justify-center gap-[var(--q-space-8)] bg-[var(--q-btn-tertiary-bg)] hover:bg-[var(--q-btn-tertiary-bg-hover)] text-[var(--q-btn-tertiary-fg)] disabled:opacity-50 transition-colors px-[var(--q-space-24)] py-[var(--q-space-12)] q-sh3 w-full"
            style={{ borderRadius: 'var(--q-radius-full)' }}
          >
            {loading && !email ? (
              <span className="w-5 h-5 border-2 border-[var(--q-gray-400)] border-t-[var(--q-twilight-500)] rounded-full animate-spin" />
            ) : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Email + Password form */}
          <form onSubmit={handleEmail} className="w-full flex flex-col gap-[var(--q-space-12)]">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
              className="w-full bg-[var(--q-surface-bg)] text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)] px-[var(--q-space-20)] q-sh3 focus:outline-none focus:ring-2 focus:ring-[var(--q-twilight-300)]"
              style={{ borderRadius: 'var(--q-radius-full)', paddingTop: 14, paddingBottom: 14 }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6}
              className="w-full bg-[var(--q-surface-bg)] text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)] px-[var(--q-space-20)] q-sh3 focus:outline-none focus:ring-2 focus:ring-[var(--q-twilight-300)]"
              style={{ borderRadius: 'var(--q-radius-full)', paddingTop: 14, paddingBottom: 14 }} />
            <button type="submit" disabled={loading}
              className="w-full bg-[var(--q-btn-primary-bg)] hover:bg-[var(--q-btn-primary-bg-hover)] text-white disabled:opacity-50 transition-colors px-[var(--q-space-24)] q-sh3"
              style={{ borderRadius: 'var(--q-radius-full)', paddingTop: 14, paddingBottom: 14 }}>
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Loading...</span> : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Toggle sign-up / sign-in */}
          <button type="button" onClick={() => setIsSignUp((v) => !v)} className="q-sh5 text-[var(--q-text-secondary)] hover:text-[var(--q-text-primary)] transition-colors text-center">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {error && <p className="q-b5 text-[var(--q-text-error)] text-center">{error}</p>}
        {message && <p className="q-b5 text-[var(--q-mint-600)] text-center">{message}</p>}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.41a4.63 4.63 0 01-2 3.04v2.52h3.24C18.38 15.9 19.6 13.27 19.6 10.23z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.97-.9 6.63-2.42l-3.24-2.52c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.6A10 10 0 0010 20z" fill="#34A853"/>
      <path d="M4.41 11.9A6.01 6.01 0 014.1 10c0-.66.11-1.3.31-1.9V5.5H1.07A10 10 0 000 10c0 1.61.38 3.13 1.07 4.5l3.34-2.6z" fill="#FBBC05"/>
      <path d="M10 3.98c1.47 0 2.79.51 3.83 1.5l2.87-2.87C14.97.99 12.7 0 10 0A10 10 0 001.07 5.5l3.34 2.6C5.2 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
    </svg>
  )
}
