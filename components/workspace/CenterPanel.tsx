'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '@/lib/store/workspace'
import { createClient } from '@/lib/supabase/client'
import { countWords, scoreColorClass, computeTotalScore, toDisplayScore } from '@/lib/utils'
import PromptDisplay from '@/components/session/PromptDisplay'
import WritingArea from '@/components/session/WritingArea'
import CountdownTimer from '@/components/session/CountdownTimer'
import WordCount from '@/components/session/WordCount'
import DimensionCard from '@/components/feedback/DimensionCard'
import CoachNote from '@/components/feedback/CoachNote'
import VersionComparison from '@/components/feedback/VersionComparison'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useState, useRef, useEffect } from 'react'
import type { FeedbackResponse } from '@/lib/types'
import type { PromptCategory, TimeLimitOption } from '@/lib/types'

const DIMENSIONS = [
  { key: 'position_clarity' as const, name: 'Position Clarity', label: 'Is there a clear, unambiguous thesis?' },
  { key: 'argument_structure' as const, name: 'Argument Structure', label: 'Is the response logically organized?' },
  { key: 'logical_consistency' as const, name: 'Logical Consistency', label: 'Do the points support each other?' },
  { key: 'use_of_evidence' as const, name: 'Use of Evidence', label: 'Are claims supported or reasoned?' },
  { key: 'tradeoff_awareness' as const, name: 'Tradeoff Awareness', label: 'Were counterarguments acknowledged?' },
]

const CATEGORIES: { value: PromptCategory; label: string; desc: string }[] = [
  { value: 'general', label: 'General', desc: 'Broad arguable questions' },
  { value: 'business', label: 'Business', desc: 'Strategy & decisions' },
  { value: 'policy', label: 'Policy', desc: 'Governance & public affairs' },
  { value: 'ethics', label: 'Ethics', desc: 'Moral dilemmas' },
  { value: 'case_study', label: 'Custom', desc: 'Real-world scenarios' },
]

const TIME_OPTIONS: { value: TimeLimitOption; label: string }[] = [
  { value: 5,  label: '5 min' },
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
        {(step === 'setup' || step === 'writing') && <PromptWritingState key="prompt-writing" />}
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
  const [customContext, setCustomContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const customTextareaRef = useRef<HTMLTextAreaElement>(null)
  const selectedSources = sources.filter((s) => s.selected)
  const hasSources = sources.length > 0

  useEffect(() => {
    if (category === 'case_study') {
      const el = customTextareaRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    }
  }, [category])

  const handleStart = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const sourceText = selectedSources.map((s) => s.content).join('\n\n')
      const res = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          sourceText: sourceText || undefined,
          timeLimit,
          customContext: category === 'case_study' && customContext.trim() ? customContext.trim() : undefined,
        }),
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
        <div className={hasSources ? 'flex flex-col h-full bg-[var(--q-surface-base)]' : 'flex flex-col items-center justify-center h-full px-[var(--q-space-32)] bg-[var(--q-surface-base)]'}>
      {!hasSources ? (
        <div className="relative flex flex-col items-center gap-[var(--q-space-16)] text-center">
          <img src="/brand-write.png" alt="" style={{ width: 88, height: 88 }} className="mx-auto object-contain" />

          {/* Text block — hugs content */}
          <div className="relative flex flex-col items-center gap-[var(--q-space-8)]">
            <h2 className="q-h2 text-[var(--q-text-primary)]">Welcome to Writing Coach</h2>

            <p className="q-sh2 text-[var(--q-text-secondary)]">
              Add some{' '}
              <span className="relative inline-block">
                sources
                <img
                  src="/underline-scribble.png"
                  alt=""
                  className="absolute pointer-events-none select-none object-contain"
                  style={{ bottom: -2, left: 0, width: '100%' }}
                />
              </span>
              {' '}to get started.
            </p>

            {/* Arrow — 40px to the left of the subtitle */}
            <img
              src="/arrow-scribble.png"
              alt=""
              className="absolute pointer-events-none select-none object-contain"
              style={{ width: 100, top: 'calc(50% + 32px)', transform: 'translateY(-50%)', right: 'calc(100% + 24px)' }}
            />
          </div>
        </div>
      ) : (
        /* Sources exist — full-height layout with scrollable config + sticky bottom bar */
        <div className="flex flex-col h-full w-full">
          {/* Scrollable config area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center py-[var(--q-space-32)] px-[var(--q-space-24)] bg-[var(--q-surface-base)]">
            <div className="w-full max-w-[500px] space-y-[var(--q-space-32)]">
              {/* No sources selected notice */}
              <AnimatePresence initial={false}>
                {selectedSources.length === 0 && (
                  <motion.div
                    key="no-source-notice"
                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginBottom: 0 }}
                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                    transition={{ duration: 0.22, ease: [0.30, 0.00, 0.44, 1.00] }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-[var(--q-space-12)] px-[var(--q-space-16)] py-[var(--q-space-12)] rounded-[var(--q-radius-md)] bg-[var(--q-cherry-50,#fff5f5)] border border-[var(--q-cherry-200,#fecaca)]">
                      <span className="material-symbols-rounded text-[var(--q-cherry-500)] shrink-0" style={{ fontSize: 20 }}>warning</span>
                      <p className="q-sh4 text-[var(--q-cherry-500)]">You need to select a source to start an activity</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title */}
              <div className="flex flex-col items-center gap-[var(--q-space-8)] text-center">
                <img src="/brand-write.png" alt="" style={{ width: 48, height: 48 }} className="object-contain" />
                <h2 className="q-h2 text-[var(--q-text-primary)]">Welcome to Writing Coach</h2>
                <p className="q-sh3 text-[var(--q-text-secondary)]">Customize your time limit and prompt type</p>
              </div>

              {/* Config */}
              <div className="space-y-[var(--q-space-24)]">
                {/* Time limit */}
                <div className="space-y-[var(--q-space-12)]">
                  <p className="q-sh5 text-[var(--q-text-secondary)]">Time limit</p>
                  <div className="flex gap-[var(--q-space-8)]">
                    {TIME_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTimeLimit(t.value)}
                        className={[
                          'flex-1 py-[var(--q-space-8)]',
                          'rounded-[var(--q-radius-full)] q-sh4 transition-all border-2',
                          timeLimit === t.value
                            ? 'border-[var(--q-twilight-500)] text-[var(--q-twilight-500)] bg-[var(--q-selected-bg)]'
                            : 'border-transparent bg-[var(--q-surface-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-btn-tertiary-bg-hover)]',
                        ].join(' ')}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt type */}
                <div className="space-y-[var(--q-space-12)]">
                  <p className="q-sh5 text-[var(--q-text-secondary)]">Prompt type</p>
                  <div className="flex gap-[var(--q-space-8)]">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className={[
                          'flex-1 py-[var(--q-space-8)]',
                          'rounded-[var(--q-radius-full)] q-sh4 transition-all border-2',
                          category === c.value
                            ? 'border-[var(--q-twilight-500)] text-[var(--q-twilight-500)] bg-[var(--q-selected-bg)]'
                            : 'border-transparent bg-[var(--q-surface-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-btn-tertiary-bg-hover)]',
                        ].join(' ')}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {/* Description box — static for presets, editable textarea for Custom */}
                  {category === 'case_study' ? (
                    <textarea
                      ref={customTextareaRef}
                      value={customContext}
                      onChange={(e) => setCustomContext(e.target.value)}
                      placeholder="Add a custom prompt.."
                      rows={4}
                      className={[
                        'w-full bg-[var(--q-surface-bg)] rounded-[var(--q-radius-md)]',
                        'p-[var(--q-space-16)] min-h-[96px] resize-none q-sh3',
                        'text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)]',
                        'border-2 border-transparent',
                        'focus:outline-none focus:border-[var(--q-twilight-500)]',
                        'transition-all',
                      ].join(' ')}
                    />
                  ) : (
                    <div
                      className="bg-[var(--q-surface-bg)] rounded-[var(--q-radius-md)] p-[var(--q-space-16)] min-h-[96px] cursor-text border-2 border-transparent"
                      onClick={() => {
                        const desc = CATEGORIES.find((c) => c.value === category)?.desc ?? ''
                        setCustomContext(desc)
                        setCategory('case_study')
                      }}
                    >
                      <p className="q-sh3 text-[var(--q-text-secondary)]">
                        {CATEGORIES.find((c) => c.value === category)?.desc}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky bottom bar with gradient fade */}
          <div className="flex-shrink-0 relative">
            {/* Gradient fade from transparent to surface */}
            <div
              className="absolute -top-8 left-0 right-0 h-8 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)' }}
            />
          <div className="bg-[var(--q-surface-base)] px-[var(--q-space-24)] py-[var(--q-space-16)] flex items-center justify-center gap-[var(--q-space-24)]">
            {genError ? (
              <p className="q-b5 text-[var(--q-text-error)]">⚠ {genError}</p>
            ) : (
              <p className="q-sh4 text-[var(--q-text-muted)]">
                {selectedSources.length > 0
                  ? `Based on ${selectedSources.length} source${selectedSources.length !== 1 ? 's' : ''}`
                  : '0 sources selected'}
              </p>
            )}
            <Button size="large" onClick={handleStart} disabled={generating || selectedSources.length === 0}>
              {generating ? (
                <span className="flex items-center gap-[var(--q-space-8)]">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating...
                </span>
              ) : 'Start activity'}
            </Button>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Prompt + Writing (unified) ───────────────────────────────────────────── */

function PromptWritingState() {
  const {
    prompt, category, step, lockPosition,
    position, responseText, timeLimitSeconds,
    setResponse, setStep, setSessionId, setFeedbackV1,
    startTime, addPastSession,
  } = useWorkspaceStore()
  const supabase = createClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const isWriting = step === 'writing'

  const handleSubmit = async () => {
    setStep('submitting')
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: sessionData } = await supabase
        .from('sessions')
        .insert({ user_id: user?.id ?? null, prompt_text: prompt, position, response_v1: responseText, time_taken_seconds: elapsed, time_limit_seconds: timeLimitSeconds, status: 'complete' })
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
      if (!res.ok || !feedback.dimensions) throw new Error('Invalid feedback response')
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
    <div className="flex flex-col h-full bg-[var(--q-surface-base)]">

      {/* Timer bar — slides down when writing starts */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            key="timer-bar"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.30, 0.00, 0.44, 1.00] }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="bg-[var(--q-surface-base)] px-[var(--q-space-24)] py-[var(--q-space-24)] flex items-center justify-between">
              <div className="flex items-center gap-[var(--q-space-8)]">
                <img src="/brand-write.png" alt="" style={{ width: 24, height: 24 }} className="object-contain" />
                <span className="q-sh3 text-[var(--q-text-primary)]">Writing Coach</span>
              </div>
              <CountdownTimer totalSeconds={timeLimitSeconds} onExpire={handleExpire} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {!isWriting ? (
          /* ── Phase 1: centered prompt ── */
          <div className="flex flex-col h-full">
            <div className="flex-1 flex items-center justify-center px-[var(--q-space-24)] py-[var(--q-space-48)]">
              <div className="w-full max-w-2xl">
                <PromptDisplay text={prompt} category={category} />
              </div>
            </div>
          </div>
        ) : (
          /* ── Phase 2: 2-up layout ── */
          <div className="h-full px-[var(--q-space-24)] py-[var(--q-space-24)] flex gap-[var(--q-space-24)]">
            {/* Left: prompt (sticky) */}
            <div className="flex-1 min-w-0 self-start sticky top-[var(--q-space-24)]">
              <PromptDisplay text={prompt} category={category} />
            </div>

            {/* Right: writing area animates in */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.30, 0.00, 0.44, 1.00] }}
              className="flex-1 min-w-0 flex flex-col gap-[var(--q-space-16)]"
            >
              <WritingArea value={responseText} onChange={setResponse} />
              <div className="flex items-center justify-between">
                <WordCount text={responseText} minWords={50} />
                <Button onClick={() => setShowConfirm(true)} disabled={countWords(responseText) < 50} size="lg">
                  Submit for feedback →
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom bar — fades out when writing starts */}
      <AnimatePresence>
        {!isWriting && (
          <motion.div
            key="start-bar"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 relative"
          >
            <div
              className="absolute -top-8 left-0 right-0 h-8 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, var(--q-surface-base))' }}
            />
            <div className="bg-[var(--q-surface-base)] px-[var(--q-space-24)] py-[var(--q-space-16)] flex justify-center">
              <Button size="xlarge" onClick={() => lockPosition('')}>
                Start writing
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Ready to submit?">
        <div className="space-y-[var(--q-space-20)]">
          <p className="q-b4 text-[var(--q-text-secondary)]">You won't be able to edit after submitting.</p>
          <div className="flex flex-col gap-[var(--q-space-8)]">
            <Button size="md" className="w-full" onClick={() => { setShowConfirm(false); handleSubmit() }}>Submit</Button>
            <Button variant="secondary" size="md" className="w-full" onClick={() => setShowConfirm(false)}>Keep writing</Button>
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

  const totalScore = computeTotalScore(feedbackV1.dimensions)

  return panel(
    <div className="max-w-3xl mx-auto px-[var(--q-space-24)] py-[var(--q-space-32)] space-y-[var(--q-space-24)]">
      {/* Score + coach note */}
      <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-lg)] border border-[var(--q-border-primary)] shadow-q-sm p-[var(--q-space-24)] flex items-center gap-[var(--q-space-24)]">
        <div className="text-center flex-shrink-0">
          <div className={`q-h1 tabular-nums ${scoreColorClass(totalScore, 100)}`}>
            {totalScore}
          </div>
          <p className="q-b5 text-[var(--q-text-muted)] mt-[var(--q-space-4)]">out of 100</p>
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
