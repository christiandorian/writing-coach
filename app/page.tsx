'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const SAMPLE_PROMPT = 'A startup has $500k in runway and must choose between hiring a senior engineer or doubling the marketing budget. As the CEO, what would you do and why?'
const SAMPLE_POSITION = 'I would hire the senior engineer, because sustainable growth depends on product quality before scaling acquisition.'

const SAMPLE_FEEDBACK = [
  { label: 'Position Clarity', score: 8 },
  { label: 'Argument Structure', score: 6 },
  { label: 'Use of Evidence', score: 5 },
  { label: 'Tradeoff Awareness', score: 4 },
]

function ScoreBar({ score }: { score: number }) {
  const color = score >= 8 ? '#44ff88' : score >= 5 ? '#ffaa00' : '#ff4444'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums font-semibold" style={{ color }}>{score}/10</span>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
        <span className="font-display font-bold text-[var(--text-primary)]">Writing Coach</span>
        <Link
          href="/auth"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-display font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              Train your thinking.{' '}
              <span className="text-[var(--accent)]">Not your spellcheck.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
              A deliberate practice system for writing structured arguments under pressure.
            </p>
            <div className="pt-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--bg)] font-bold px-8 py-4 text-base hover:bg-[#d4eb3a] transition-colors active:scale-[0.98]"
              >
                Start practicing →
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Demo loop */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-semibold text-center mb-8">
              How it works
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 - Prompt */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5">01</span>
                  <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Prompt</span>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{SAMPLE_PROMPT}</p>
                <div className="border-t border-[var(--border)] pt-3">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Your position:</p>
                  <p className="text-xs text-[var(--text-primary)] italic leading-relaxed">{SAMPLE_POSITION}</p>
                </div>
              </motion.div>

              {/* Step 2 - Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5">02</span>
                  <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Write</span>
                </div>
                <div className="space-y-3">
                  <div className="font-display text-4xl font-bold text-[var(--text-secondary)] tabular-nums">18:32</div>
                  <p className="text-xs text-[var(--text-secondary)]">247 words</p>
                  <div className="h-20 bg-[var(--bg)] border border-[var(--border)] p-2">
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed opacity-60">
                      The engineering hire is the right call. Marketing can scale a broken product into a faster failure...
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 - Feedback */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[var(--surface)] border border-[var(--border)] p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5">03</span>
                  <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Feedback</span>
                </div>
                <div className="space-y-3">
                  {SAMPLE_FEEDBACK.map((f) => (
                    <div key={f.label} className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{f.label}</p>
                      <ScoreBar score={f.score} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="border-t border-[var(--border)] px-6 py-16">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { title: 'Position first', body: 'Commit to a stance before you write. No hedging.' },
              { title: 'Timed pressure', body: 'A countdown clock simulates real decision-making conditions.' },
              { title: 'Reasoning feedback', body: 'AI evaluates your logic — not your grammar.' },
            ].map((v) => (
              <div key={v.title} className="space-y-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{v.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-5 text-center">
        <p className="text-xs text-[var(--text-secondary)]">Writing Coach — Think better, argue clearly.</p>
      </footer>
    </div>
  )
}
