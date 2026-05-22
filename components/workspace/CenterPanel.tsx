'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '@/lib/store/workspace'
import { createClient } from '@/lib/supabase/client'
import { countWords, scoreColorClass, computeTotalScore, toDisplayScore } from '@/lib/utils'
import WritingArea from '@/components/session/WritingArea'
import CountdownTimer from '@/components/session/CountdownTimer'
import WordCount from '@/components/session/WordCount'
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

/* ── Scratch pad templates ─────────────────────────────────────────────────── */

type ScratchPadTemplate = 'outline' | 'thought-flow' | 'custom'

const SCRATCH_PAD_TEMPLATES: { id: ScratchPadTemplate; label: string }[] = [
  { id: 'outline',      label: 'Outline' },
  { id: 'thought-flow', label: 'Thought flow' },
  { id: 'custom',       label: 'Custom' },
]

interface OutlineData {
  question: string; position: string
  why1: string; why2: string; why3: string
  example: string; takeaway: string
}

interface ThoughtFlowData {
  position: string; reason1: string; reason2: string
  examples: string; conclusion: string
}

function ScratchField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <div className="flex flex-col gap-[var(--q-space-4)]">
      {label && <p className="q-sh4 text-[var(--q-text-secondary)]">{label}</p>}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={1}
        placeholder="..."
        className="w-full resize-none bg-transparent text-[var(--q-text-primary)] q-sh3 focus:outline-none placeholder-[var(--q-text-muted)] overflow-hidden"
      />
    </div>
  )
}

function NumberedField({ number, value, onChange }: {
  number: number; value: string; onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <div className="flex gap-[var(--q-space-8)]">
      <span className="q-sh3 text-[var(--q-text-muted)] flex-shrink-0 w-4">{number}.</span>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={1}
        placeholder="..."
        className="flex-1 resize-none bg-transparent text-[var(--q-text-primary)] q-sh3 focus:outline-none placeholder-[var(--q-text-muted)] overflow-hidden"
      />
    </div>
  )
}

export default function CenterPanel() {
  const { step } = useWorkspaceStore()
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--q-surface-base)] relative">
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
  const [customError, setCustomError] = useState(false)
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
    if (category === 'case_study' && !customContext.trim()) {
      setCustomError(true)
      customTextareaRef.current?.focus()
      return
    }
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
                <h2 className="q-h2 text-[var(--q-text-primary)]">Write by Quizlet</h2>

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
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="flex items-center justify-center px-[var(--q-space-16)] py-[var(--q-space-12)] rounded-[var(--q-radius-md)] bg-[var(--q-cherry-50,#fff5f5)]">
                      <p className="q-sh4 text-[var(--q-cherry-500)]">Select a source to start writing</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Title */}
              <div className="flex flex-col items-center gap-[var(--q-space-8)] text-center">
                <img src="/brand-write.png" alt="" style={{ width: 48, height: 48 }} className="object-contain" />
                <h2 className="q-h2 text-[var(--q-text-primary)]">Write by Quizlet</h2>
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
                    <div className="space-y-[var(--q-space-6)]">
                      <textarea
                        ref={customTextareaRef}
                        value={customContext}
                        onChange={(e) => { setCustomContext(e.target.value); if (e.target.value.trim()) setCustomError(false) }}
                        placeholder="Add a custom prompt.."
                        rows={4}
                        className={[
                          'w-full bg-[var(--q-surface-bg)] rounded-[var(--q-radius-md)]',
                          'p-[var(--q-space-16)] min-h-[128px] resize-none q-sh3',
                          'text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)]',
                          'border-2 transition-all focus:outline-none',
                          customError
                            ? 'border-[var(--q-cherry-500)] focus:border-[var(--q-cherry-500)]'
                            : 'border-transparent focus:border-[var(--q-twilight-500)]',
                        ].join(' ')}
                      />
                      {customError && (
                        <p className="q-b5 text-[var(--q-cherry-500)] flex items-center gap-[var(--q-space-4)]">
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>error</span>
                          Add a custom prompt to continue
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      className="bg-[var(--q-surface-bg)] rounded-[var(--q-radius-md)] p-[var(--q-space-16)] min-h-[128px] cursor-text border-2 border-transparent"
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

/* ── Prompt + Writing (combined single step) ──────────────────────────────── */

function PromptWritingState() {
  const {
    prompt, category,
    position, responseText, timeLimitSeconds,
    setResponse, setStep, setSessionId, setFeedbackV1,
    startTime, addPastSession, sources, startActivity, resetSession,
  } = useWorkspaceStore()
  const supabase = createClient()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showChangePromptConfirm, setShowChangePromptConfirm] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [promptOpen, setPromptOpen] = useState(true)
  const [isScratchPad, setIsScratchPad] = useState(false)
  const [scratchPadText, setScratchPadText] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [scratchPadTemplate, setScratchPadTemplate] = useState<ScratchPadTemplate>('outline')
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false)
  const [outlineData, setOutlineData] = useState<OutlineData>({ question: '', position: '', why1: '', why2: '', why3: '', example: '', takeaway: '' })
  const [thoughtFlowData, setThoughtFlowData] = useState<ThoughtFlowData>({ position: '', reason1: '', reason2: '', examples: '', conclusion: '' })

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const sourceText = sources.filter((s) => s.selected).map((s) => s.content).join('\n\n')
      const res = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          sourceText: sourceText || undefined,
          timeLimit: timeLimitSeconds / 60,
        }),
      })
      const data = await res.json()
      if (res.ok && data.prompt) {
        startActivity(data.prompt, category, (timeLimitSeconds / 60) as TimeLimitOption)
      }
    } catch (err) {
      console.error('Regenerate error:', err)
    } finally {
      setRegenerating(false)
    }
  }

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

  const wordCount = countWords(responseText)

  return panel(
    <div className="flex flex-col h-full bg-[var(--q-surface-base)]">

      {/* Scrollable content */}
      <div className={[
        'flex-1 px-[var(--q-space-24)] pt-[var(--q-space-24)] pb-[var(--q-space-16)] flex flex-col overflow-y-auto',
        isExpanded ? 'gap-0' : 'gap-[var(--q-space-16)]',
      ].join(' ')}>

        {/* Prompt card — collapsible, hidden when expanded */}
        {!isExpanded && (
          <div className="bg-[var(--q-surface-bg)] rounded-[var(--q-radius-xl)] flex-shrink-0">
            {/* Header — always at the same position, never moves */}
            <div className="flex items-center gap-[var(--q-space-8)] px-[var(--q-space-24)] py-[var(--q-space-16)] justify-between">
              <div className="flex items-center gap-[var(--q-space-8)] min-w-0 flex-1">
                <span className="inline-flex items-center flex-shrink-0 q-sh5 text-[var(--q-surface-base)] bg-[var(--q-text-primary)] px-[var(--q-space-12)] py-[var(--q-space-4)] rounded-[var(--q-radius-full)]">
                  Prompt
                </span>
                <AnimatePresence mode="popLayout">
                  {!promptOpen && (
                    <motion.p
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="q-sh3 text-[var(--q-text-secondary)] truncate min-w-0 flex-1"
                    >
                      {prompt}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <Button variant="text-secondary" circle size="medium" onClick={() => setPromptOpen(v => !v)}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  {promptOpen ? 'expand_less' : 'expand_more'}
                </span>
              </Button>
            </div>

            {/* Body — only this section animates height */}
            <AnimatePresence initial={false}>
              {promptOpen && (
                <motion.div
                  key="prompt-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <p className="q-sh2 text-[var(--q-text-primary)] px-[var(--q-space-24)] pb-[var(--q-space-24)]">{prompt}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Textarea with absolute controls, scratch pad toggle, expand toggle */}
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={[
            'bg-[var(--q-surface-base)] border-2 border-[var(--q-twilight-300)] rounded-[var(--q-radius-xl)] overflow-hidden flex flex-col relative',
            isExpanded ? 'flex-1 my-[var(--q-space-16)]' : 'flex-shrink-0',
          ].join(' ')}>

          {/* Buttons — absolutely overlaid top-right so textarea starts from the top */}
          <div className="absolute top-[var(--q-space-8)] right-[var(--q-space-12)] flex items-center gap-[var(--q-space-8)] z-10">
            <Button
              variant="text-secondary"
              circle
              size="medium"
              onClick={() => setIsScratchPad(v => !v)}
              title="Scratch pad"
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 20, color: isScratchPad ? 'var(--q-text-highlight)' : undefined }}
              >edit_note</span>
            </Button>
            <Button
              variant="text-secondary"
              circle
              size="medium"
              onClick={() => setIsExpanded(v => !v)}
              title="Expand"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                {isExpanded ? 'collapse_content' : 'expand_content'}
              </span>
            </Button>
          </div>

          {/* Content area — switches between response and scratch pad templates */}
          {isScratchPad ? (
            scratchPadTemplate === 'custom' ? (
              <WritingArea
                value={scratchPadText}
                onChange={setScratchPadText}
                className="border-0 focus:ring-0 rounded-none pr-[104px] placeholder:text-sm placeholder:font-semibold placeholder:text-[var(--q-text-secondary)]"
                fill={isExpanded}
                placeholder="Your position, why, supporting examples, etc."
              />
            ) : (
              <div
                className={[
                  'overflow-y-auto px-[var(--q-space-16)] pt-[var(--q-space-16)] pb-[var(--q-space-4)] flex flex-col gap-[var(--q-space-16)]',
                  isExpanded ? 'flex-1 min-h-0' : 'h-[30vh] min-h-[200px]',
                ].join(' ')}
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)',
                }}
              >
                {scratchPadTemplate === 'outline' ? (
                  <>
                    <ScratchField label="What is the question?" value={outlineData.question} onChange={v => setOutlineData(d => ({ ...d, question: v }))} />
                    <ScratchField label="What position will I take?" value={outlineData.position} onChange={v => setOutlineData(d => ({ ...d, position: v }))} />
                    <div className="flex flex-col gap-[var(--q-space-8)]">
                      <p className="q-sh4 text-[var(--q-text-secondary)]">Why?</p>
                      <NumberedField number={1} value={outlineData.why1} onChange={v => setOutlineData(d => ({ ...d, why1: v }))} />
                      <NumberedField number={2} value={outlineData.why2} onChange={v => setOutlineData(d => ({ ...d, why2: v }))} />
                      <NumberedField number={3} value={outlineData.why3} onChange={v => setOutlineData(d => ({ ...d, why3: v }))} />
                    </div>
                    <ScratchField label="Best example:" value={outlineData.example} onChange={v => setOutlineData(d => ({ ...d, example: v }))} />
                    <ScratchField label="Final takeaway:" value={outlineData.takeaway} onChange={v => setOutlineData(d => ({ ...d, takeaway: v }))} />
                  </>
                ) : (
                  <>
                    <ScratchField label="Position:" value={thoughtFlowData.position} onChange={v => setThoughtFlowData(d => ({ ...d, position: v }))} />
                    <ScratchField label="Reason 1:" value={thoughtFlowData.reason1} onChange={v => setThoughtFlowData(d => ({ ...d, reason1: v }))} />
                    <ScratchField label="Reason 2:" value={thoughtFlowData.reason2} onChange={v => setThoughtFlowData(d => ({ ...d, reason2: v }))} />
                    <ScratchField label="Example(s):" value={thoughtFlowData.examples} onChange={v => setThoughtFlowData(d => ({ ...d, examples: v }))} />
                    <ScratchField label="Conclusion:" value={thoughtFlowData.conclusion} onChange={v => setThoughtFlowData(d => ({ ...d, conclusion: v }))} />
                  </>
                )}
              </div>
            )
          ) : (
            <WritingArea
              value={responseText}
              onChange={setResponse}
              className="border-0 focus:ring-0 rounded-none pr-[104px]"
              fill={isExpanded}
              placeholder="Your response..."
            />
          )}

          {/* Footer bar */}
          <div className="px-[var(--q-space-16)] py-[var(--q-space-12)] flex items-center justify-between flex-shrink-0">
            {isScratchPad ? (
              <div className="relative">
                {/* Click-outside backdrop */}
                {templateMenuOpen && (
                  <div className="fixed inset-0 z-[5]" onClick={() => setTemplateMenuOpen(false)} />
                )}
                {/* Dropdown menu — opens upward */}
                {templateMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 z-10 bg-[var(--q-surface-base)] border border-[var(--q-border-primary)] rounded-[var(--q-radius-xl)] shadow-lg overflow-hidden min-w-[160px]">
                    {SCRATCH_PAD_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setScratchPadTemplate(t.id); setTemplateMenuOpen(false) }}
                        className="w-full flex items-center justify-between px-[var(--q-space-16)] py-[var(--q-space-10)] q-sh4 hover:bg-[var(--q-surface-bg)] transition-colors"
                      >
                        <span style={{ color: scratchPadTemplate === t.id ? 'var(--q-text-highlight)' : 'var(--q-text-primary)' }}>
                          {t.label}
                        </span>
                        {scratchPadTemplate === t.id && (
                          <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--q-text-highlight)' }}>check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {/* Trigger */}
                <button
                  onClick={() => setTemplateMenuOpen(v => !v)}
                  className="flex items-center gap-[var(--q-space-4)] q-sh4 text-[var(--q-text-secondary)] hover:text-[var(--q-text-primary)] transition-colors"
                >
                  <span>{SCRATCH_PAD_TEMPLATES.find(t => t.id === scratchPadTemplate)?.label}</span>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    {templateMenuOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
            ) : (
              <WordCount text={responseText} minWords={50} />
            )}
            <CountdownTimer totalSeconds={timeLimitSeconds} onExpire={handleExpire} />
          </div>
        </motion.div>

      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 relative">
        <div
          className="absolute -top-8 left-0 right-0 h-8 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, var(--q-surface-base))' }}
        />
        <div className="bg-[var(--q-surface-base)] px-[var(--q-space-24)] py-[var(--q-space-16)] flex items-center justify-center gap-[var(--q-space-12)]">
          <Button variant="tertiary" size="xlarge" onClick={() => setShowChangePromptConfirm(true)}>
            Change prompt
          </Button>
          <Button size="xlarge" onClick={() => setShowConfirm(true)} disabled={wordCount < 50}>
            Submit your response
          </Button>
        </div>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} maxWidth={560}>
        {/* Custom confirm modal matching Figma */}
        <div className="flex flex-col -mx-[var(--q-space-24)] -mb-[var(--q-space-24)]">
          <div className="flex flex-col gap-[var(--q-space-16)] px-[var(--q-space-32)] pb-[var(--q-space-32)] pt-[var(--q-space-4)]">
            <p className="q-h2 text-[var(--q-text-primary)]">Ready to submit?</p>
            <p className="q-b2 text-[var(--q-text-primary)]">You won't be able to edit your response after it is submitted</p>
          </div>
          <div className="h-px bg-[var(--q-border-primary)] w-full mb-[var(--q-space-16)]" />
          <div className="flex items-center justify-end gap-[var(--q-space-16)] px-[var(--q-space-16)] pb-[var(--q-space-16)]">
            <Button variant="tertiary" size="large" onClick={() => setShowConfirm(false)}>Keep writing</Button>
            <Button size="large" onClick={() => { setShowConfirm(false); handleSubmit() }}>Submit</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showChangePromptConfirm} onClose={() => setShowChangePromptConfirm(false)} maxWidth={560}>
        <div className="flex flex-col -mx-[var(--q-space-24)] -mb-[var(--q-space-24)]">
          <div className="flex flex-col gap-[var(--q-space-16)] px-[var(--q-space-32)] pb-[var(--q-space-32)] pt-[var(--q-space-4)]">
            <p className="q-h2 text-[var(--q-text-primary)]">Change prompt?</p>
            <p className="q-b2 text-[var(--q-text-primary)]">Changing the prompt during an activity will restart the activity and you will lose your current progress. Would you like to proceed?</p>
          </div>
          <div className="h-px bg-[var(--q-border-primary)] w-full mb-[var(--q-space-16)]" />
          <div className="flex items-center justify-end gap-[var(--q-space-16)] px-[var(--q-space-16)] pb-[var(--q-space-16)]">
            <Button variant="tertiary" size="large" onClick={() => setShowChangePromptConfirm(false)}>Cancel</Button>
            <Button variant="danger" size="large" onClick={() => { setShowChangePromptConfirm(false); resetSession() }}>Change prompt</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ── Submitting ───────────────────────────────────────────────────────────── */

function SubmittingState() {
  return panel(
    <div className="flex flex-col items-center justify-center h-full gap-[var(--q-space-16)] bg-[var(--q-surface-base)]">
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

/* ── Comparison chart ─────────────────────────────────────────────────────── */

function ComparisonChart({ versions }: { versions: Array<{ feedback: { dimensions?: unknown } | null }> }) {
  const scores = versions.map((v, i) => ({ n: i + 1, score: computeTotalScore(v.feedback?.dimensions as Parameters<typeof computeTotalScore>[0]) }))
  const svgW = 520, svgH = 260
  const pl = 36, pr = 24, pt = 28, pb = 44
  const chartW = svgW - pl - pr
  const chartH = svgH - pt - pb
  const N = scores.length

  const innerPadX = 48
  const plotW = chartW - 2 * innerPadX
  const getX = (i: number) => pl + innerPadX + (N === 1 ? plotW / 2 : i * plotW / (N - 1))
  const getY = (s: number) => pt + chartH - (s / 100) * chartH

  // Smooth cubic bezier path
  const linePath = scores.map((s, i) => {
    if (i === 0) return `M ${getX(0).toFixed(1)},${getY(s.score).toFixed(1)}`
    const x0 = getX(i - 1), y0 = getY(scores[i - 1].score)
    const x1 = getX(i), y1 = getY(s.score)
    const cpx = ((x0 + x1) / 2).toFixed(1)
    return `C ${cpx},${y0.toFixed(1)} ${cpx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`
  }).join(' ')

  const fillPath = N > 1
    ? `${linePath} L ${getX(N - 1).toFixed(1)},${(pt + chartH).toFixed(1)} L ${getX(0).toFixed(1)},${(pt + chartH).toFixed(1)} Z`
    : ''

  const yTicks = [0, 25, 50, 75, 100]
  const gradId = 'cmpFill'

  return (
    <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--q-twilight-400)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--q-twilight-400)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Dashed horizontal grid lines + Y labels */}

      {/* Y-axis min/max labels */}
      <text x={pl - 6} y={getY(100) + 4} textAnchor="end" fontSize="11" fill="var(--q-text-muted)">100</text>
      <text x={pl - 6} y={getY(0) + 4} textAnchor="end" fontSize="11" fill="var(--q-text-muted)">0</text>

      {/* Gradient fill */}
      {N > 1 && <path d={fillPath} fill={`url(#${gradId})`} />}

      {/* Smooth line */}
      {N > 1 && <path d={linePath} stroke="var(--q-twilight-500)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}

      {/* Points + score labels + x-axis labels */}
      {scores.map((s, i) => (
        <g key={i}>
          {/* Score above */}
          <text x={getX(i)} y={getY(s.score) - 14} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--q-text-primary)">{s.score}</text>
          {/* White-fill circle with border */}
          <circle cx={getX(i)} cy={getY(s.score)} r="6" fill="white" stroke="var(--q-twilight-500)" strokeWidth="2.5" />
          {/* X label */}
          <text x={getX(i)} y={svgH - 4} textAnchor="middle" fontSize="11" fill="var(--q-text-secondary)">Response {s.n}</text>
        </g>
      ))}
    </svg>
  )
}

/* ── Feedback helpers ─────────────────────────────────────────────────────── */

interface DimColors { bg: string; activeBg: string; border: string; text: string; highlight: string; hoverHighlight: string; activeHighlight: string }

/** Score-based semantic colors. displayScore is out of 20. */
function getDimensionColors(displayScore: number): DimColors {
  if (displayScore >= 18) {
    // A — success
    return { bg: 'var(--q-mint-100)', activeBg: 'var(--q-mint-200)', border: 'var(--q-border-success)', text: 'var(--q-text-success)', highlight: 'var(--q-mint-100)', hoverHighlight: 'var(--q-mint-200)', activeHighlight: 'var(--q-mint-300)' }
  } else {
    // Below A — warning (sherbert for all non-success scores)
    return { bg: 'var(--q-sunset-100)', activeBg: 'var(--q-sunset-200)', border: 'var(--q-border-warning)', text: 'var(--q-text-warning)', highlight: 'var(--q-sherbert-100)', hoverHighlight: 'var(--q-sherbert-200)', activeHighlight: 'var(--q-sherbert-300)' }
  }
}

function annotateEssay(
  text: string,
  annotations: Array<{ key: string; quote: string | undefined }>,
): Array<{ text: string; key: string | null }> {
  const found: Array<{ start: number; end: number; key: string }> = []
  for (const ann of annotations) {
    if (!ann.quote?.trim()) continue
    let idx = text.indexOf(ann.quote)
    if (idx === -1) idx = text.toLowerCase().indexOf(ann.quote.toLowerCase())
    if (idx === -1) continue
    const end = idx + ann.quote.length
    if (found.some(f => idx < f.end && end > f.start)) continue
    found.push({ start: idx, end, key: ann.key })
  }
  found.sort((a, b) => a.start - b.start)
  const segments: Array<{ text: string; key: string | null }> = []
  let pos = 0
  for (const { start, end, key } of found) {
    if (pos < start) segments.push({ text: text.slice(pos, start), key: null })
    segments.push({ text: text.slice(start, end), key })
    pos = end
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), key: null })
  return segments.length > 0 ? segments : [{ text, key: null }]
}

/* ── Feedback ─────────────────────────────────────────────────────────────── */

function FeedbackState() {
  const { feedbackV1, rewriteVersions, pendingText, setPendingText, submitRewriteVersion, responseText, timeLimitSeconds, prompt, position, sessionId, startRewrite, resetSession, pastSessions } = useWorkspaceStore()
  const supabase = createClient()
  const [activeDimension, setActiveDimension] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'comparison' | 'writing' | number>(1)
  const [isSubmittingRewrite, setIsSubmittingRewrite] = useState(false)
  const [showRewriteConfirm, setShowRewriteConfirm] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [overallOpen, setOverallOpen] = useState(true)
  const [openDimensions, setOpenDimensions] = useState<Set<string>>(new Set())
  const highlightRefs = useRef<Record<string, HTMLElement | null>>({})
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const rightPanelRef = useRef<HTMLDivElement | null>(null)
  const leftPanelRef = useRef<HTMLDivElement | null>(null)
  const [hoveredCompDimKey, setHoveredCompDimKey] = useState<string | null>(null)
  const [isPendingScratchPad, setIsPendingScratchPad] = useState(false)
  const [pendingScratchPadText, setPendingScratchPadText] = useState('')
  const [isPendingExpanded, setIsPendingExpanded] = useState(false)
  const [pendingScratchPadTemplate, setPendingScratchPadTemplate] = useState<ScratchPadTemplate>('outline')
  const [pendingTemplateMenuOpen, setPendingTemplateMenuOpen] = useState(false)
  const [pendingOutlineData, setPendingOutlineData] = useState<OutlineData>({ question: '', position: '', why1: '', why2: '', why3: '', example: '', takeaway: '' })
  const [pendingThoughtFlowData, setPendingThoughtFlowData] = useState<ThoughtFlowData>({ position: '', reason1: '', reason2: '', examples: '', conclusion: '' })

  if (!feedbackV1) return null

  // allVersions: [V1, ...submitted rewrites]
  const allVersions = [
    { text: responseText, feedback: feedbackV1 },
    ...rewriteVersions.filter(v => v.text?.trim() && v.feedback?.dimensions),
  ]
  const showTabs = allVersions.length > 1
  const activeResponseNum = typeof activeTab === 'number' ? activeTab : 1

  // Right column shows feedback for the active response tab
  const displayedFeedback = allVersions[activeResponseNum - 1]?.feedback ?? feedbackV1
  const versionPending = false
  const totalScore = computeTotalScore(displayedFeedback?.dimensions)

  // Per-version annotated segments
  const getVersionSegments = (v: { text: string; feedback: { dimensions?: unknown } | null }) => {
    const dims = v.feedback?.dimensions as Record<string, { highlighted_text?: string }> | undefined
    if (!dims) return [{ text: v.text, key: null as string | null }]
    const anns = DIMENSIONS.map(d => ({ key: d.key, quote: dims[d.key]?.highlighted_text }))
    return annotateEssay(v.text, anns)
  }

  const handleStartRewrite = () => {
    startRewrite()
    setPromptOpen(false)
    setActiveTab('writing')
  }

  const handleRewriteSubmit = async () => {
    setIsSubmittingRewrite(true)
    try {
      if (sessionId && rewriteVersions.length === 0) {
        await supabase.from('sessions').update({ response_v2: pendingText }).eq('id', sessionId)
      }
      const versionNum = allVersions.length + 1
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, position, response: pendingText, session_id: sessionId, version: versionNum }),
      })
      const feedback = await res.json() as FeedbackResponse
      submitRewriteVersion(pendingText, feedback)
      setActiveTab(versionNum)
    } catch (err) { console.error(err) }
    finally { setIsSubmittingRewrite(false) }
  }

  const handleHighlightClick = (key: string) => {
    const isActive = key === activeDimension
    const next = isActive ? null : key
    setActiveDimension(next)
    if (next) {
      // Measure positions BEFORE state update so layout is still stable
      const markEl = highlightRefs.current[next]
      const cardEl = cardRefs.current[next]
      const panel = rightPanelRef.current
      let desiredScrollTop: number | null = null
      if (markEl && cardEl && panel) {
        const markTop = markEl.getBoundingClientRect().top
        const panelRect = panel.getBoundingClientRect()
        const cardRect = cardEl.getBoundingClientRect()
        const cardTopInPanel = cardRect.top - panelRect.top + panel.scrollTop
        desiredScrollTop = cardTopInPanel - (markTop - panelRect.top)
      }

      // Expand only the clicked section, collapse all others (including Overall)
      setOpenDimensions(new Set([next]))
      setOverallOpen(false)

      // Scroll on the next frame so it starts simultaneously with the expansion
      if (desiredScrollTop !== null && panel) {
        requestAnimationFrame(() => {
          panel.scrollTo({ top: desiredScrollTop!, behavior: 'smooth' })
        })
      }
    } else {
      // Clicking active highlight again — collapse that section
      setOpenDimensions(prev => {
        const updated = new Set(Array.from(prev))
        updated.delete(key)
        return updated
      })
    }
  }

  const toggleDimension = (key: string) => {
    const willOpen = !openDimensions.has(key)
    // Single-open: opening one collapses all others
    setOpenDimensions(willOpen ? new Set([key]) : new Set())
    setActiveDimension(willOpen ? key : (activeDimension === key ? null : activeDimension))
    if (willOpen) {
      setOverallOpen(false)
      setTimeout(() => highlightRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
    }
  }

  const tabCls = (tab: 'comparison' | 'writing' | number) => [
    'q-sh4 px-[var(--q-space-16)] py-[var(--q-space-10)] rounded-[var(--q-radius-full)] transition-all whitespace-nowrap flex-shrink-0',
    activeTab === tab
      ? 'bg-[var(--q-twilight-100)] text-[var(--q-twilight-600)] ring-2 ring-inset ring-[var(--q-twilight-300)]'
      : 'bg-[var(--q-btn-tertiary-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)] cursor-pointer',
  ].join(' ')

  // Shared prompt accordion used in both response and writing views
  const PromptCard = (
    <div className="rounded-[var(--q-radius-xl)] bg-[var(--q-surface-bg)] overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-[var(--q-space-8)] px-[var(--q-space-24)] py-[var(--q-space-16)] justify-between cursor-pointer" onClick={() => setPromptOpen(o => !o)}>
        <div className="flex items-center gap-[var(--q-space-8)] min-w-0 flex-1">
          <span className="inline-flex items-center flex-shrink-0 q-sh5 text-[var(--q-surface-base)] bg-[var(--q-text-primary)] px-[var(--q-space-12)] py-[var(--q-space-4)] rounded-[var(--q-radius-full)]">Prompt</span>
          <AnimatePresence mode="popLayout">
            {!promptOpen && (
              <motion.p key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.15 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="q-sh4 text-[var(--q-text-secondary)] truncate min-w-0 flex-1">{prompt}</motion.p>
            )}
          </AnimatePresence>
        </div>
        <Button variant="text-secondary" circle size="medium" tabIndex={-1}>
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{promptOpen ? 'expand_less' : 'expand_more'}</span>
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {promptOpen && (
          <motion.div
            key="prompt-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }, opacity: { duration: 0.2, delay: 0.12 } } }}
            exit={{ height: 0, opacity: 0, transition: { opacity: { duration: 0.12 }, height: { duration: 0.28, delay: 0.08, ease: [0.55, 0, 1, 0.45] } } }}
            className="overflow-hidden"
          >
            <p className="q-sh3 text-[var(--q-text-primary)] leading-relaxed px-[var(--q-space-24)] pb-[var(--q-space-24)]">{prompt}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return panel(
    <div className="flex flex-col h-full bg-[var(--q-surface-base)]">

      {/* Tab bar */}
      {showTabs && (
        <div className="flex-shrink-0 pl-[var(--q-space-32)] pr-[var(--q-space-8)] pt-[var(--q-space-24)] pb-[var(--q-space-4)] flex items-center gap-[var(--q-space-8)]">
          {allVersions.length >= 2 && (
            <button onClick={() => setActiveTab('comparison')} className={tabCls('comparison')}>Comparison</button>
          )}
          {allVersions.map((_, i) => (
            <button key={i + 1} onClick={() => setActiveTab(i + 1)} className={tabCls(i + 1)}>Response {i + 1}</button>
          ))}
          {activeTab === 'writing' && (
            <span className={tabCls('writing')}>Response {allVersions.length + 1}</span>
          )}
        </div>
      )}

      {/* Body */}
      <div className={typeof activeTab === 'number' ? 'flex-1 overflow-hidden flex' : 'flex-1 overflow-y-auto scrollbar-hide'}
        style={typeof activeTab !== 'number' ? { maskImage: 'linear-gradient(to bottom, transparent 0, black 32px, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 32px, black 100%)' } : undefined}>

        {/* ── Comparison view ── */}
        {activeTab === 'comparison' && (
          <div className="flex-1 bg-[var(--q-surface-base)] overflow-hidden flex gap-[var(--q-space-16)] px-[var(--q-space-32)] py-[var(--q-space-24)]">
            {allVersions.map((v, i) => {
              const score = computeTotalScore(v.feedback?.dimensions as Parameters<typeof computeTotalScore>[0])
              const prevScore = i > 0 ? computeTotalScore(allVersions[i - 1].feedback?.dimensions as Parameters<typeof computeTotalScore>[0]) : null
              const delta = prevScore !== null ? score - prevScore : null
              const scoreColor = score >= 80 ? 'var(--q-text-success)' : 'var(--q-text-warning)'
              const segs = getVersionSegments(v)
              return (
                <div key={i} className="flex-1 flex flex-col rounded-[var(--q-radius-xl)] bg-[var(--q-surface-bg)] overflow-hidden"
                  style={{ boxShadow: '0 4px 0 0 rgba(66,85,255,0.15), 0 -1px 0 0 #EDEFFF' }}>

                  {/* Card header: label + overall score */}
                  <div className="px-[var(--q-space-20)] pt-[var(--q-space-20)] pb-[var(--q-space-12)] flex items-center justify-between flex-shrink-0">
                    <p className="q-sh3 text-[var(--q-text-primary)]">Response {i + 1}</p>
                    <div className="flex items-center gap-[var(--q-space-4)]">
                      {delta !== null && delta > 0 && (
                        <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--q-text-success)' }}>arrow_upward</span>
                      )}
                      <p className="q-h3" style={{ color: scoreColor }}>{score}%</p>
                    </div>
                  </div>

                  {/* Dimension rows */}
                  <div className="px-[var(--q-space-20)] flex flex-col flex-shrink-0">
                    {DIMENSIONS.map(d => {
                      const dims = v.feedback?.dimensions as unknown as Record<string, { score: number }> | undefined
                      const dimScore = toDisplayScore(dims?.[d.key]?.score ?? 0)
                      const prevDims = i > 0 ? (allVersions[i - 1].feedback?.dimensions as unknown as Record<string, { score: number }> | undefined) : null
                      const prevDimScore = prevDims ? toDisplayScore(prevDims[d.key]?.score ?? 0) : null
                      const dimDelta = prevDimScore !== null ? dimScore - prevDimScore : null
                      const dimColors = getDimensionColors(dimScore)
                      const isWeak = dimScore < 18
                      const isHovered = hoveredCompDimKey === d.key
                      const isDimmed = hoveredCompDimKey !== null && !isHovered
                      return (
                        <div key={d.key} className="flex items-center justify-between py-[var(--q-space-8)] border-t border-[var(--q-border-primary)] transition-opacity duration-150"
                          style={{ opacity: isDimmed ? 0.3 : 1 }}>
                          <p className="q-sh4" style={{ color: isWeak ? dimColors.text : 'var(--q-text-muted)' }}>{d.name}</p>
                          <div className="flex items-center gap-[var(--q-space-6)]">
                            {dimDelta !== null && dimDelta > 0 && (
                              <span className="q-sh5 rounded-[var(--q-radius-full)] px-[var(--q-space-6)] py-[var(--q-space-2)] bg-[var(--q-mint-100)] text-[var(--q-text-success)]">+{dimDelta}</span>
                            )}
                            {dimDelta !== null && dimDelta < 0 && (
                              <span className="q-sh5 rounded-[var(--q-radius-full)] px-[var(--q-space-6)] py-[var(--q-space-2)] bg-[var(--q-sherbert-100)] text-[var(--q-text-warning)]">{dimDelta}</span>
                            )}
                            <p className="q-sh4" style={{ color: isWeak ? dimColors.text : 'var(--q-text-muted)' }}>{dimScore}/20</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Response text with highlights */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide px-[var(--q-space-20)] pt-[var(--q-space-16)] pb-[var(--q-space-16)] border-t border-[var(--q-border-primary)]"
                    style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
                    <p className="q-b4 text-[var(--q-text-primary)] leading-relaxed whitespace-pre-wrap">
                      {segs.map((seg, si) => {
                        if (!seg.key) return <span key={si}>{seg.text}</span>
                        const dims2 = v.feedback?.dimensions as unknown as Record<string, { score: number }> | undefined
                        const ds = toDisplayScore(dims2?.[seg.key]?.score ?? 0)
                        const c = getDimensionColors(ds)
                        // Only show highlights for warning-tier (weak) dimensions; suppress success/green
                        if (ds >= 18) return <span key={si}>{seg.text}</span>
                        return (
                          <mark key={si} className="cursor-pointer transition-colors rounded-sm"
                            style={{ backgroundColor: c.highlight, '--mark-hover-bg': c.hoverHighlight } as React.CSSProperties}
                            onMouseEnter={() => setHoveredCompDimKey(seg.key!)}
                            onMouseLeave={() => setHoveredCompDimKey(null)}>
                            {seg.text}
                          </mark>
                        )
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Writing view (Try again) ── */}
        {activeTab === 'writing' && (
          <div className="flex-1 bg-[var(--q-surface-base)] px-[var(--q-space-24)] py-[var(--q-space-24)] flex flex-col gap-[var(--q-space-12)]">
            {PromptCard}
            <div className="bg-[var(--q-surface-base)] border-2 border-[var(--q-twilight-300)] rounded-[var(--q-radius-xl)] overflow-hidden flex flex-col relative flex-shrink-0">
              <div className="absolute top-[var(--q-space-8)] right-[var(--q-space-12)] flex items-center gap-[var(--q-space-8)] z-10">
                <Button variant="text-secondary" circle size="medium" onClick={() => setIsPendingScratchPad(v => !v)} title="Scratch pad">
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: isPendingScratchPad ? 'var(--q-text-highlight)' : undefined }}>edit_note</span>
                </Button>
                <Button variant="text-secondary" circle size="medium" onClick={() => setIsPendingExpanded(v => !v)} title="Expand">
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{isPendingExpanded ? 'collapse_content' : 'expand_content'}</span>
                </Button>
              </div>
              {isPendingScratchPad ? (
                pendingScratchPadTemplate === 'custom' ? (
                  <WritingArea value={pendingScratchPadText} onChange={setPendingScratchPadText} className={isPendingExpanded ? 'border-0 focus:ring-0 rounded-none pr-[104px] placeholder:text-sm placeholder:font-semibold placeholder:text-[var(--q-text-secondary)]' : 'border-0 focus:ring-0 rounded-none pr-[104px] h-[38vh] min-h-[200px] placeholder:text-sm placeholder:font-semibold placeholder:text-[var(--q-text-secondary)]'} fill={isPendingExpanded} placeholder="Your position, why, supporting examples, etc." />
                ) : (
                  <div className={['overflow-y-auto px-[var(--q-space-16)] pt-[var(--q-space-16)] pb-[var(--q-space-4)] flex flex-col gap-[var(--q-space-16)]', isPendingExpanded ? 'flex-1 min-h-0' : 'h-[38vh] min-h-[200px]'].join(' ')} style={{ maskImage: 'linear-gradient(to bottom, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 20px, black calc(100% - 20px), transparent 100%)' }}>
                    {pendingScratchPadTemplate === 'outline' ? (
                      <>
                        <ScratchField label="What is the question?" value={pendingOutlineData.question} onChange={v => setPendingOutlineData(d => ({ ...d, question: v }))} />
                        <ScratchField label="What position will I take?" value={pendingOutlineData.position} onChange={v => setPendingOutlineData(d => ({ ...d, position: v }))} />
                        <div className="flex flex-col gap-[var(--q-space-8)]">
                          <p className="q-sh4 text-[var(--q-text-secondary)]">Why?</p>
                          <NumberedField number={1} value={pendingOutlineData.why1} onChange={v => setPendingOutlineData(d => ({ ...d, why1: v }))} />
                          <NumberedField number={2} value={pendingOutlineData.why2} onChange={v => setPendingOutlineData(d => ({ ...d, why2: v }))} />
                          <NumberedField number={3} value={pendingOutlineData.why3} onChange={v => setPendingOutlineData(d => ({ ...d, why3: v }))} />
                        </div>
                        <ScratchField label="Best example:" value={pendingOutlineData.example} onChange={v => setPendingOutlineData(d => ({ ...d, example: v }))} />
                        <ScratchField label="Final takeaway:" value={pendingOutlineData.takeaway} onChange={v => setPendingOutlineData(d => ({ ...d, takeaway: v }))} />
                      </>
                    ) : (
                      <>
                        <ScratchField label="Position:" value={pendingThoughtFlowData.position} onChange={v => setPendingThoughtFlowData(d => ({ ...d, position: v }))} />
                        <ScratchField label="Reason 1:" value={pendingThoughtFlowData.reason1} onChange={v => setPendingThoughtFlowData(d => ({ ...d, reason1: v }))} />
                        <ScratchField label="Reason 2:" value={pendingThoughtFlowData.reason2} onChange={v => setPendingThoughtFlowData(d => ({ ...d, reason2: v }))} />
                        <ScratchField label="Example(s):" value={pendingThoughtFlowData.examples} onChange={v => setPendingThoughtFlowData(d => ({ ...d, examples: v }))} />
                        <ScratchField label="Conclusion:" value={pendingThoughtFlowData.conclusion} onChange={v => setPendingThoughtFlowData(d => ({ ...d, conclusion: v }))} />
                      </>
                    )}
                  </div>
                )
              ) : (
                <WritingArea value={pendingText} onChange={setPendingText} className={isPendingExpanded ? 'border-0 focus:ring-0 rounded-none pr-[104px]' : 'border-0 focus:ring-0 rounded-none pr-[104px] h-[38vh] min-h-[200px]'} fill={isPendingExpanded} placeholder="Your response..." />
              )}
              <div className="px-[var(--q-space-16)] py-[var(--q-space-12)] flex items-center justify-between flex-shrink-0">
                {isPendingScratchPad ? (
                  <div className="relative">
                    {pendingTemplateMenuOpen && <div className="fixed inset-0 z-[5]" onClick={() => setPendingTemplateMenuOpen(false)} />}
                    {pendingTemplateMenuOpen && (
                      <div className="absolute bottom-full mb-2 left-0 z-10 bg-[var(--q-surface-base)] border border-[var(--q-border-primary)] rounded-[var(--q-radius-xl)] shadow-lg overflow-hidden min-w-[160px]">
                        {SCRATCH_PAD_TEMPLATES.map(t => (
                          <button key={t.id} onClick={() => { setPendingScratchPadTemplate(t.id); setPendingTemplateMenuOpen(false) }} className="w-full flex items-center justify-between px-[var(--q-space-16)] py-[var(--q-space-10)] q-sh4 hover:bg-[var(--q-surface-bg)] transition-colors">
                            <span style={{ color: pendingScratchPadTemplate === t.id ? 'var(--q-text-highlight)' : 'var(--q-text-primary)' }}>{t.label}</span>
                            {pendingScratchPadTemplate === t.id && <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--q-text-highlight)' }}>check_circle</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setPendingTemplateMenuOpen(v => !v)} className="flex items-center gap-[var(--q-space-4)] q-sh4 text-[var(--q-text-secondary)] hover:text-[var(--q-text-primary)] transition-colors">
                      <span>{SCRATCH_PAD_TEMPLATES.find(t => t.id === pendingScratchPadTemplate)?.label}</span>
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{pendingTemplateMenuOpen ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>
                ) : (
                  <WordCount text={pendingText} />
                )}
                <CountdownTimer totalSeconds={timeLimitSeconds} onExpire={handleRewriteSubmit} />
              </div>
            </div>
          </div>
        )}

        {/* ── Response view (left column) ── */}
        {typeof activeTab === 'number' && (
          <div ref={leftPanelRef} className="flex-1 min-w-0 overflow-y-auto bg-[var(--q-surface-base)] pl-[var(--q-space-32)] pr-[var(--q-space-8)] py-[var(--q-space-24)] flex flex-col gap-[var(--q-space-12)] scrollbar-hide" style={{ maskImage: 'linear-gradient(to bottom, transparent 0, black 28px, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 28px, black 100%)' }}>

          {PromptCard}

          {/* Response text with per-version annotations */}
          {(() => {
            const v = allVersions[activeResponseNum - 1]
            if (!v) return null
            const segs = getVersionSegments(v)
            return (
              <div className="rounded-[var(--q-radius-xl)] bg-[var(--q-surface-bg)] overflow-hidden flex-shrink-0">
                <div className="px-[var(--q-space-20)] py-[var(--q-space-20)]">
                  <p className="q-sh3 text-[var(--q-text-primary)] leading-relaxed whitespace-pre-wrap">
                    {segs.map((seg, si) => {
                      if (!seg.key) return <span key={si}>{seg.text}</span>
                      const dimScore = toDisplayScore(v.feedback?.dimensions?.[seg.key as keyof typeof v.feedback.dimensions]?.score ?? 0)
                      const colors = getDimensionColors(dimScore)
                      const isActive = activeDimension === seg.key
                      return (
                        <mark key={si} ref={el => { highlightRefs.current[seg.key!] = el }} onClick={() => handleHighlightClick(seg.key!)} className="cursor-pointer transition-colors rounded-sm" style={{ backgroundColor: isActive ? colors.activeHighlight : colors.highlight, '--mark-hover-bg': isActive ? colors.activeHighlight : colors.hoverHighlight } as React.CSSProperties}>
                          {seg.text}
                        </mark>
                      )
                    })}
                  </p>
                </div>
              </div>
            )
          })()}
        </div>
        )}

        {/* Right panel — only for response view */}
        {typeof activeTab === 'number' && (
        <div ref={rightPanelRef} className="w-[271px] flex-shrink-0 overflow-y-auto bg-[var(--q-surface-base)] px-[var(--q-space-6)] py-[var(--q-space-24)] flex flex-col gap-[var(--q-space-12)] scrollbar-hide" style={{ maskImage: 'linear-gradient(to bottom, transparent 0, black 28px, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 28px, black 100%)' }}>


          {/* Overall score card */}
          <div
            className="rounded-[var(--q-radius-xl)] border-2 bg-[var(--q-surface-base)] overflow-hidden flex-shrink-0"
            style={{ borderColor: versionPending ? 'var(--q-border-primary)' : overallOpen ? 'var(--q-twilight-300)' : 'var(--q-twilight-100)' }}
          >
            <div
              onClick={() => {
                if (versionPending) return
                setOverallOpen(o => !o)
                setOpenDimensions(new Set())
                setActiveDimension(null)
                leftPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                rightPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={['w-full px-[var(--q-space-16)] py-[var(--q-space-16)] flex items-center justify-between', !versionPending ? 'cursor-pointer' : ''].join(' ')}
            >
              {versionPending ? (
                <span className="q-sh4 text-[var(--q-text-muted)]">Overall — pending</span>
              ) : (
                <span className="q-sh3 text-[var(--q-twilight-600)]">Overall score {totalScore}/100</span>
              )}
              {!versionPending && (
                <Button variant="text-secondary" circle size="small" tabIndex={-1} className="bg-[var(--q-btn-tertiary-bg)]">
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                    {overallOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </Button>
              )}
            </div>
            <AnimatePresence initial={false}>
              {overallOpen && !versionPending && (
                <motion.div key={`overall-body-${activeResponseNum}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.30, 0.00, 0.44, 1.00] }} className="overflow-hidden">
                  <div className="px-[var(--q-space-16)] pb-[var(--q-space-16)]">
                    <p className="q-b4 text-[var(--q-text-primary)] leading-relaxed">{displayedFeedback.coach_note}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dimension cards */}
          {DIMENSIONS.map(d => {
            const dim = displayedFeedback.dimensions?.[d.key]
            if (!dim) return null
            const isOpen = openDimensions.has(d.key)
            const isActive = activeDimension === d.key
            const displayScore = versionPending ? null : toDisplayScore(dim.score)
            const colors = versionPending
              ? { bg: 'var(--q-surface-bg)', border: 'var(--q-border-primary)', text: 'var(--q-text-muted)', activeBg: 'var(--q-surface-bg)', highlight: 'var(--q-surface-bg)', hoverHighlight: 'var(--q-surface-bg)', activeHighlight: 'var(--q-surface-bg)' }
              : getDimensionColors(displayScore!)
            return (
              <div
                key={d.key}
                ref={el => { cardRefs.current[d.key] = el }}
                onClick={() => !versionPending && toggleDimension(d.key)}
                className={['rounded-[var(--q-radius-xl)] border-2 bg-[var(--q-surface-base)] overflow-hidden flex-shrink-0 transition-all', versionPending ? '' : 'cursor-pointer'].join(' ')}
                style={{ borderColor: isActive && !versionPending ? colors.activeHighlight : (colors.highlight ?? colors.border) }}
              >
                <div className="px-[var(--q-space-16)] py-[var(--q-space-16)] flex items-center justify-between gap-[var(--q-space-8)]">
                  <span className="q-sh3 min-w-0" style={{ color: colors.text }}>
                    {versionPending ? d.name : `${d.name} ${displayScore}/20`}
                  </span>
                  {!versionPending && (
                    <Button variant="text-secondary" circle size="small" tabIndex={-1} className="bg-[var(--q-btn-tertiary-bg)]">
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </Button>
                  )}
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key={`${d.key}-body`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.30, 0.00, 0.44, 1.00] }} className="overflow-hidden">
                      <div className="px-[var(--q-space-16)] py-[var(--q-space-16)] space-y-[var(--q-space-16)]">
                        <p className="q-b4 text-[var(--q-text-primary)] leading-relaxed">{displayedFeedback.dimensions[d.key].diagnosis}</p>
                        <div className="rounded-[var(--q-radius-xl)] p-[var(--q-space-16)] flex flex-col gap-[var(--q-space-8)] bg-[var(--q-mint-100)]">
                          <div className="flex items-center gap-[var(--q-space-6)]">
                            <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--q-text-success)' }}>trending_up</span>
                            <p className="q-sh4" style={{ color: 'var(--q-text-success)' }}>Next time</p>
                          </div>
                          <p className="q-sh4 text-[var(--q-text-primary)] leading-relaxed">{displayedFeedback.dimensions[d.key].suggestion}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}

          {/* Progress mini-chart */}
          {pastSessions.length > 1 && (
            <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-xl)] border border-[var(--q-border-primary)] p-[var(--q-space-16)] space-y-[var(--q-space-12)] mt-[var(--q-space-4)] flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="q-sh4 text-[var(--q-text-primary)]">Your progress</p>
                <p className="q-b5 text-[var(--q-text-muted)]">{pastSessions.length} sessions</p>
              </div>
              <div className="flex items-end gap-[var(--q-space-4)] h-10">
                {pastSessions.slice(0, 8).reverse().map((s, i) => {
                  const h = s.score != null ? Math.max(4, Math.round((s.score / 10) * 40)) : 4
                  const isLatest = i === pastSessions.slice(0, 8).reverse().length - 1
                  return (
                    <div key={s.id} title={`${s.score?.toFixed(1) ?? '—'}/10`} className="flex-1 rounded-sm transition-all"
                      style={{ height: h, backgroundColor: isLatest ? 'var(--q-twilight-500)' : s.score != null && s.score >= 8 ? 'var(--q-mint-400)' : s.score != null && s.score >= 5 ? 'var(--q-twilight-200)' : 'var(--q-cherry-300)', opacity: isLatest ? 1 : 0.6 }}
                    />
                  )
                })}
              </div>
              {(() => {
                const scored = pastSessions.filter(s => s.score != null)
                const avg = scored.length > 0 ? scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length : null
                const latest = pastSessions[0]?.score
                const prev = pastSessions[1]?.score
                const delta = latest != null && prev != null ? latest - prev : null
                return (
                  <div className="flex items-center gap-[var(--q-space-16)]">
                    {avg != null && <div><p className="q-b5 text-[var(--q-text-muted)]">All-time avg</p><p className={`q-sh3 tabular-nums ${scoreColorClass(Math.round(avg))}`}>{avg.toFixed(1)}</p></div>}
                    {delta != null && <div><p className="q-b5 text-[var(--q-text-muted)]">vs last session</p><p className={`q-sh3 tabular-nums ${delta > 0 ? 'text-[var(--q-mint-600)]' : delta < 0 ? 'text-[var(--q-cherry-500)]' : 'text-[var(--q-text-muted)]'}`}>{delta > 0 ? `+${delta.toFixed(1)}` : delta === 0 ? '—' : delta.toFixed(1)}</p></div>}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
        )}

      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 relative">
        <div className="absolute -top-10 left-0 right-0 h-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, var(--q-surface-base))' }} />
        <div className="bg-[var(--q-surface-base)] px-[var(--q-space-24)] py-[var(--q-space-16)] flex items-center justify-center gap-[var(--q-space-16)]">
          {activeTab === 'writing' ? (
            <Button size="xlarge" onClick={() => setShowRewriteConfirm(true)} disabled={countWords(pendingText) < 50 || isSubmittingRewrite}>
              {isSubmittingRewrite ? (
                <span className="flex items-center gap-[var(--q-space-8)]">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : 'Submit'}
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="xlarge" onClick={resetSession}>Change prompt</Button>
              <Button size="xlarge" onClick={handleStartRewrite}>Try again</Button>
            </>
          )}
        </div>
      </div>

      <Modal open={showRewriteConfirm} onClose={() => setShowRewriteConfirm(false)} title="Submit your response?">
        <div className="space-y-[var(--q-space-20)]">
          <p className="q-b4 text-[var(--q-text-secondary)]">This will be scored as Response {allVersions.length + 1}.</p>
          <div className="flex gap-[var(--q-space-12)]">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRewriteConfirm(false)}>Keep writing</Button>
            <Button size="md" className="flex-1" onClick={() => { setShowRewriteConfirm(false); handleRewriteSubmit() }}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
