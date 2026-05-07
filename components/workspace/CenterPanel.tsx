'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '@/lib/store/workspace'
import { createClient } from '@/lib/supabase/client'
import { countWords, scoreColorClass } from '@/lib/utils'
import PromptDisplay from '@/components/session/PromptDisplay'
import PositionInput from '@/components/session/PositionInput'
import WritingArea from '@/components/session/WritingArea'
import CountdownTimer from '@/components/session/CountdownTimer'
import WordCount from '@/components/session/WordCount'
import DimensionCard from '@/components/feedback/DimensionCard'
import CoachNote from '@/components/feedback/CoachNote'
import VersionComparison from '@/components/feedback/VersionComparison'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useState } from 'react'
import type { FeedbackResponse } from '@/lib/types'
import type { PromptCategory, TimeLimitOption } from '@/lib/types'

const DIMENSIONS = [
  { key: 'position_clarity' as const, name: 'Position Clarity', label: 'Is there a clear, unambiguous thesis?' },
  { key: 'argument_structure' as const, name: 'Argument Structure', label: 'Is the response logically organized?' },
  { key: 'logical_consistency' as const, name: 'Logical Consistency', label: 'Do the points support each other?' },
  { key: 'use_of_evidence' as const, name: 'Use of Evidence', label: 'Are claims supported or reasoned?' },
  { key: 'tradeoff_awareness' as const, name: 'Tradeoff Awareness', label: 'Were counterarguments acknowledged?' },
]

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'policy', label: 'Policy' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'case_study', label: 'Case Study' },
]

const TIME_OPTIONS: { value: TimeLimitOption; label: string }[] = [
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
]

export default function CenterPanel() {
  const { step } = useWorkspaceStore()
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--q-surface-bg)] relative">
      <AnimatePresence mode="wait">
        {step === 'idle'       && <IdleState key="idle" />}
        {step === 'setup'      && <SetupState key="setup" />}
        {step === 'writing'    && <WritingState key="writing" />}
        {step === 'submitting' && <SubmittingState key="submitting" />}
        {step === 'feedback'   && <FeedbackState key="feedback" />}
      </AnimatePresence>
    </div>
  )
}

function panel(children: React.ReactNode) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: [0.30, 0.00, 0.44, 1.00] }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

/* ── Idle ─────────────────────────────────────────────────────────────────── */

function IdleState() {
  const { sources, startActivity, pastSessions } = useWorkspaceStore()
  const [category, setCategory] = useState<PromptCategory>('general')
  const [timeLimit, setTimeLimit] = useState<TimeLimitOption>(20)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const selectedSources = sources.filter((s) => s.selected)
  const hasSources = sources.length > 0

  const handleStart = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const sourceText = selectedSources.map((s) => s.content).join('\n\n')
      const res = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, sourceText: sourceText || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.prompt) {
        setGenError(data.error ?? 'Failed to generate prompt. Check your OpenAI API key in .env.local.')
        return
      }
      startActivity(data.prompt, category, timeLimit)
    } catch (err) {
      setGenError('Network error — could not reach the server.')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return panel(
    <div className="flex flex-col items-center justify-center h-full px-[var(--q-space-32)]">
      {!hasSources ? (
        <div className="flex flex-col items-center gap-[var(--q-space-16)] text-center w-full max-w-2xl">
          <div className="space-y-[var(--q-space-8)]">
            <h2 className="q-h2 text-[var(--q-text-primary)]">Welcome to Writing Coach</h2>
            <p className="q-sh2 text-[var(--q-text-secondary)]">Add some sources to get started.</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg space-y-[var(--q-space-24)]">
          <div className="text-center space-y-[var(--q-space-8)]">
            <div className="q-h2 mb-[var(--q-space-12)]">✍️</div>
            <h2 className="q-h4 text-[var(--q-text-primary)]">Writing Coach</h2>
            <p className="q-b4 text-[var(--q-text-secondary)]">
              Argue a position under timed pressure. Get feedback on your reasoning.
            </p>
          </div>

          {selectedSources.length > 0 && (
            <div className="flex items-center gap-[var(--q-space-8)] bg-[var(--q-twilight-100)] rounded-[var(--q-radius-md)] px-[var(--q-space-12)] py-[var(--q-space-8)]">
              <span className="q-b4 text-[var(--q-twilight-500)]">📎</span>
              <p className="q-sh5 text-[var(--q-twilight-600)]">
                Prompt generated from {selectedSources.length} selected source{selectedSources.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-20)] space-y-[var(--q-space-20)]">
            <div className="space-y-[var(--q-space-8)]">
              <p className="q-sh5 uppercase tracking-wider text-[var(--q-text-muted)]">Topic</p>
              <div className="flex flex-wrap gap-[var(--q-space-8)]">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={[
                      'px-[var(--q-space-12)] py-[var(--q-space-6)] rounded-[var(--q-radius-full)]',
                      'q-sh5 transition-all border',
                      category === c.value
                        ? 'bg-[var(--q-twilight-500)] text-white border-[var(--q-twilight-500)]'
                        : 'bg-white text-[var(--q-text-secondary)] border-[var(--q-border-primary)] hover:border-[var(--q-twilight-500)] hover:text-[var(--q-twilight-500)]',
                    ].join(' ')}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-[var(--q-space-8)]">
              <p className="q-sh5 uppercase tracking-wider text-[var(--q-text-muted)]">Time limit</p>
              <div className="flex gap-[var(--q-space-8)]">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTimeLimit(t.value)}
                    className={[
                      'flex-1 py-[var(--q-space-8)] rounded-[var(--q-radius-md)] q-sh5 transition-all border',
                      timeLimit === t.value
                        ? 'bg-[var(--q-twilight-500)] text-white border-[var(--q-twilight-500)]'
                        : 'bg-white text-[var(--q-text-secondary)] border-[var(--q-border-primary)] hover:border-[var(--q-twilight-500)] hover:text-[var(--q-twilight-500)]',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handleStart} disabled={generating}>
              {generating ? (
                <span className="flex items-center gap-[var(--q-space-8)] justify-center">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating prompt...
                </span>
              ) : 'Start session →'}
            </Button>

            {genError && (
              <p className="q-b5 text-[var(--q-text-error)] text-center">⚠ {genError}</p>
            )}
          </div>

          {pastSessions.length > 0 && (
            <div className="space-y-[var(--q-space-8)]">
              <p className="q-sh5 uppercase tracking-wider text-[var(--q-text-muted)]">Recent sessions</p>
              <div className="space-y-[var(--q-space-6)]">
                {pastSessions.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-[var(--q-surface-base)] rounded-[var(--q-radius-md)] border border-[var(--q-border-primary)] px-[var(--q-space-16)] py-[var(--q-space-10)]">
                    <p className="q-b4 text-[var(--q-text-secondary)] truncate flex-1">{s.promptSnippet}</p>
                    {s.score != null && (
                      <span className={`q-sh4 tabular-nums ml-[var(--q-space-12)] flex-shrink-0 ${scoreColorClass(Math.round(s.score))}`}>
                        {Number(s.score).toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Setup ────────────────────────────────────────────────────────────────── */

function SetupState() {
  const { prompt, category, lockPosition } = useWorkspaceStore()
  return panel(
    <div className="max-w-2xl mx-auto px-[var(--q-space-24)] py-[var(--q-space-48)] space-y-[var(--q-space-24)]">
      <div className="space-y-[var(--q-space-4)]">
        <p className="q-sh5 uppercase tracking-wider text-[var(--q-text-muted)]">Step 1 of 2</p>
        <h1 className="q-h4 text-[var(--q-text-primary)]">Read the prompt</h1>
      </div>
      <PromptDisplay text={prompt} category={category} />
      <PositionInput onSubmit={lockPosition} />
    </div>
  )
}

/* ── Writing ──────────────────────────────────────────────────────────────── */

function WritingState() {
  const { position, responseText, timeLimitSeconds, setResponse, setStep, setSessionId, setFeedbackV1, startTime, prompt, addPastSession } = useWorkspaceStore()
  const supabase = createClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)

  const handleSubmit = async () => {
    setStep('submitting')
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .insert({ prompt_text: prompt, position, response_v1: responseText, time_taken_seconds: elapsed, time_limit_seconds: timeLimitSeconds, status: 'complete' })
        .select()
        .single()

      const sessionId = sessionData?.id
      if (sessionId) setSessionId(sessionId)

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, position, response: responseText, time_taken_seconds: elapsed, session_id: sessionId, version: 1 }),
      })

      const feedback = await res.json() as FeedbackResponse
      setFeedbackV1(feedback)

      if (sessionId) {
        addPastSession({ id: sessionId, promptSnippet: prompt.slice(0, 60) + (prompt.length > 60 ? '...' : ''), score: feedback.overall_score, createdAt: new Date().toISOString() })
      }
      setStep('feedback')
    } catch (err) {
      console.error('Submit error:', err)
      setStep('writing')
    }
  }

  const handleExpire = () => {
    if (!autoSubmitted) { setAutoSubmitted(true); handleSubmit() }
  }

  return panel(
    <div className="flex flex-col h-full">
      <div className="bg-[var(--q-surface-base)] border-b border-[var(--q-border-primary)] px-[var(--q-space-24)] py-[var(--q-space-12)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <WordCount text={responseText} minWords={50} />
          <CountdownTimer totalSeconds={timeLimitSeconds} onExpire={handleExpire} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-[var(--q-space-24)] py-[var(--q-space-20)] flex flex-col gap-[var(--q-space-16)]">
          <div className="flex items-start gap-[var(--q-space-8)] bg-[var(--q-twilight-100)] rounded-[var(--q-radius-md)] px-[var(--q-space-16)] py-[var(--q-space-12)]">
            <span className="q-b4 text-[var(--q-twilight-500)] mt-0.5">📌</span>
            <p className="q-b4 text-[var(--q-text-secondary)] italic leading-relaxed">{position}</p>
          </div>
          <WritingArea value={responseText} onChange={setResponse} />
          <div className="flex justify-end">
            <Button onClick={() => setShowConfirm(true)} disabled={countWords(responseText) < 50} size="lg">
              Submit for feedback →
            </Button>
          </div>
        </div>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Ready to submit?">
        <div className="space-y-[var(--q-space-20)]">
          <p className="q-b4 text-[var(--q-text-secondary)]">You won't be able to edit after submitting.</p>
          <div className="flex gap-[var(--q-space-12)]">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowConfirm(false)}>Keep writing</Button>
            <Button size="md" className="flex-1" onClick={() => { setShowConfirm(false); handleSubmit() }}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ── Submitting ───────────────────────────────────────────────────────────── */

function SubmittingState() {
  return panel(
    <div className="flex flex-col items-center justify-center h-full gap-[var(--q-space-16)]">
      <div className="w-14 h-14 bg-[var(--q-twilight-100)] rounded-[var(--q-radius-full)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--q-twilight-500)] border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-center space-y-[var(--q-space-4)]">
        <p className="q-sh3 text-[var(--q-text-primary)]">Analyzing your reasoning...</p>
        <p className="q-b4 text-[var(--q-text-muted)]">This takes about 10 seconds</p>
      </div>
    </div>
  )
}

/* ── Feedback ─────────────────────────────────────────────────────────────── */

function FeedbackState() {
  const { feedbackV1, feedbackV2, setFeedbackV2, responseText, rewriteText, setRewriteText, timeLimitSeconds, prompt, position, sessionId, startRewrite, resetSession, pastSessions } = useWorkspaceStore()
  const supabase = createClient()
  const [showRewrite, setShowRewrite] = useState(false)
  const [isSubmittingRewrite, setIsSubmittingRewrite] = useState(false)
  const [showRewriteConfirm, setShowRewriteConfirm] = useState(false)

  if (!feedbackV1) return null

  const handleStartRewrite = () => { startRewrite(); setShowRewrite(true) }

  const handleRewriteSubmit = async () => {
    setIsSubmittingRewrite(true)
    try {
      if (sessionId) await supabase.from('sessions').update({ response_v2: rewriteText }).eq('id', sessionId)
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, position, response: rewriteText, session_id: sessionId, version: 2 }),
      })
      setFeedbackV2(await res.json())
      setShowRewrite(false)
    } catch (err) { console.error(err) }
    finally { setIsSubmittingRewrite(false) }
  }

  const overall = feedbackV1.overall_score

  return panel(
    <div className="max-w-3xl mx-auto px-[var(--q-space-24)] py-[var(--q-space-32)] space-y-[var(--q-space-24)]">
      {/* Score + coach note */}
      <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-24)] flex items-center gap-[var(--q-space-24)]">
        <div className="text-center flex-shrink-0">
          <div className={`q-h1 tabular-nums ${scoreColorClass(Math.round(overall))}`}>
            {overall.toFixed(1)}
          </div>
          <p className="q-b5 text-[var(--q-text-muted)] mt-[var(--q-space-4)]">out of 10</p>
        </div>
        <div className="flex-1">
          <CoachNote note={feedbackV1.coach_note} />
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--q-space-12)]">
        {DIMENSIONS.map((d) => (
          <DimensionCard
            key={d.key}
            name={d.name}
            label={d.label}
            score={feedbackV1.dimensions[d.key].score}
            diagnosis={feedbackV1.dimensions[d.key].diagnosis}
            suggestion={feedbackV1.dimensions[d.key].suggestion}
          />
        ))}
      </div>

      {/* Version comparison */}
      {feedbackV2 && (
        <VersionComparison v1Text={responseText} v2Text={rewriteText} feedbackV1={feedbackV1} feedbackV2={feedbackV2} />
      )}

      {/* Rewrite */}
      {showRewrite && !feedbackV2 && (
        <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-20)] space-y-[var(--q-space-16)]">
          <div className="flex items-center justify-between">
            <h3 className="q-h5 text-[var(--q-text-primary)]">Rewrite</h3>
            <CountdownTimer totalSeconds={timeLimitSeconds} onExpire={handleRewriteSubmit} />
          </div>
          <p className="q-b5 text-[var(--q-text-muted)]">Fresh canvas — write from scratch.</p>
          <WritingArea value={rewriteText} onChange={setRewriteText} />
          <div className="flex items-center justify-between">
            <WordCount text={rewriteText} />
            <Button onClick={() => setShowRewriteConfirm(true)} disabled={countWords(rewriteText) < 50 || isSubmittingRewrite} size="lg">
              {isSubmittingRewrite ? (
                <span className="flex items-center gap-[var(--q-space-8)]">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : 'Submit rewrite →'}
            </Button>
          </div>
        </div>
      )}

      {/* Progress summary */}
      {pastSessions.length > 1 && (
        <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-20)] space-y-[var(--q-space-16)]">
          <div className="flex items-center justify-between">
            <p className="q-sh4 text-[var(--q-text-primary)]">Your progress</p>
            <p className="q-b5 text-[var(--q-text-muted)]">{pastSessions.length} sessions total</p>
          </div>

          {/* Score trend — last 8 sessions as mini bars */}
          <div className="flex items-end gap-[var(--q-space-4)] h-10">
            {pastSessions.slice(0, 8).reverse().map((s, i) => {
              const h = s.score != null ? Math.max(4, Math.round((s.score / 10) * 40)) : 4
              const isLatest = i === pastSessions.slice(0, 8).reverse().length - 1
              return (
                <div
                  key={s.id}
                  title={`${s.score?.toFixed(1) ?? '—'}/10`}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: h,
                    backgroundColor: isLatest
                      ? 'var(--q-twilight-500)'
                      : s.score != null && s.score >= 8
                      ? 'var(--q-mint-400)'
                      : s.score != null && s.score >= 5
                      ? 'var(--q-twilight-200)'
                      : 'var(--q-cherry-300)',
                    opacity: isLatest ? 1 : 0.6,
                  }}
                />
              )
            })}
          </div>

          {/* Avg score */}
          {(() => {
            const scored = pastSessions.filter(s => s.score != null)
            const avg = scored.length > 0
              ? scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length
              : null
            const latest = pastSessions[0]?.score
            const prev = pastSessions[1]?.score
            const delta = latest != null && prev != null ? latest - prev : null
            return (
              <div className="flex items-center gap-[var(--q-space-16)]">
                {avg != null && (
                  <div>
                    <p className="q-b5 text-[var(--q-text-muted)]">All-time avg</p>
                    <p className={`q-sh3 tabular-nums ${scoreColorClass(Math.round(avg))}`}>{avg.toFixed(1)}</p>
                  </div>
                )}
                {delta != null && (
                  <div>
                    <p className="q-b5 text-[var(--q-text-muted)]">vs last session</p>
                    <p className={`q-sh3 tabular-nums ${delta > 0 ? 'text-[var(--q-mint-600)]' : delta < 0 ? 'text-[var(--q-cherry-500)]' : 'text-[var(--q-text-muted)]'}`}>
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta === 0 ? '—' : delta.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-[var(--q-space-12)] pt-[var(--q-space-8)] border-t border-[var(--q-border-primary)]">
        {!showRewrite && !feedbackV2 && (
          <Button variant="secondary" size="md" onClick={handleStartRewrite}>
            Try again with feedback in mind
          </Button>
        )}
        <Button variant="tertiary" size="md" onClick={resetSession}>← New session</Button>
      </div>

      <Modal open={showRewriteConfirm} onClose={() => setShowRewriteConfirm(false)} title="Submit your rewrite?">
        <div className="space-y-[var(--q-space-20)]">
          <p className="q-b4 text-[var(--q-text-secondary)]">This will be scored as Version 2.</p>
          <div className="flex gap-[var(--q-space-12)]">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRewriteConfirm(false)}>Keep writing</Button>
            <Button size="md" className="flex-1" onClick={() => { setShowRewriteConfirm(false); handleRewriteSubmit() }}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
