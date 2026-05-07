'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/lib/store/session'
import { createClient } from '@/lib/supabase/client'
import { countWords } from '@/lib/utils'
import PromptDisplay from '@/components/session/PromptDisplay'
import PositionInput from '@/components/session/PositionInput'
import WritingArea from '@/components/session/WritingArea'
import CountdownTimer from '@/components/session/CountdownTimer'
import WordCount from '@/components/session/WordCount'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

type Step = 'prompt' | 'writing' | 'submitting'

export default function SessionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('prompt')
  const [showConfirm, setShowConfirm] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [autoSubmitted, setAutoSubmitted] = useState(false)

  const {
    prompt,
    category,
    position,
    responseText,
    timeLimitSeconds,
    setPosition,
    setResponse,
    setTimeTaken,
    setSessionId,
    setFeedbackV1,
    setIsSubmitting,
  } = useSessionStore()

  useEffect(() => {
    if (!prompt) {
      router.replace('/dashboard')
    }
  }, [prompt, router])

  const handlePositionLocked = (pos: string) => {
    setPosition(pos)
    setStartTime(Date.now())
    setStep('writing')
  }

  const handleTimerExpire = () => {
    if (!autoSubmitted && step === 'writing') {
      setAutoSubmitted(true)
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setStep('submitting')
    setIsSubmitting(true)

    const elapsed = Math.round((Date.now() - startTime) / 1000)
    setTimeTaken(elapsed)

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          prompt_text: prompt,
          position,
          response_v1: responseText,
          time_taken_seconds: elapsed,
          time_limit_seconds: timeLimitSeconds,
          status: 'complete',
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      const sessionId = sessionData.id
      setSessionId(sessionId)

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          position,
          response: responseText,
          time_taken_seconds: elapsed,
          session_id: sessionId,
          version: 1,
        }),
      })

      if (!res.ok) throw new Error('Feedback API failed')

      const feedback = await res.json()
      setFeedbackV1(feedback)
      router.push(`/session/${sessionId}/feedback`)
    } catch (err) {
      console.error('Submit error:', err)
      setStep('writing')
      setIsSubmitting(false)
    }
  }

  const wordCount = countWords(responseText)

  if (!prompt) return null

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AnimatePresence mode="wait">
        {step === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="max-w-2xl mx-auto px-6 py-12 space-y-6"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Step 1 of 2
              </p>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Read the prompt</h1>
            </div>
            <PromptDisplay text={prompt} category={category} />
            <PositionInput onSubmit={handlePositionLocked} />
          </motion.div>
        )}

        {step === 'writing' && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col min-h-screen"
          >
            {/* Writing top bar */}
            <div className="bg-white border-b border-[var(--border)] px-6 py-3">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <WordCount text={responseText} minWords={50} />
                <CountdownTimer
                  totalSeconds={timeLimitSeconds}
                  onExpire={handleTimerExpire}
                />
              </div>
            </div>

            <div className="max-w-2xl mx-auto w-full px-6 py-6 flex flex-col gap-4 flex-1">
              {/* Locked position */}
              <div className="flex items-start gap-3 bg-[var(--accent-light)] rounded-[var(--radius-sm)] px-4 py-3">
                <span className="text-[var(--accent)] text-sm mt-0.5">📌</span>
                <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
                  {position}
                </p>
              </div>

              <WritingArea
                value={responseText}
                onChange={setResponse}
                disabled={step !== 'writing'}
              />

              <div className="flex justify-end">
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={wordCount < 50}
                  size="lg"
                >
                  Submit for feedback →
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'submitting' && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen gap-5"
          >
            <div className="w-12 h-12 bg-[var(--accent-light)] rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-[var(--text-primary)]">Analyzing your reasoning...</p>
              <p className="text-sm text-[var(--text-muted)]">This takes about 10 seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Ready to submit?">
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-secondary)]">
            You won't be able to edit your response after submitting. Make sure you're done.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowConfirm(false)}>
              Keep writing
            </Button>
            <Button
              size="md"
              className="flex-1"
              onClick={() => {
                setShowConfirm(false)
                handleSubmit()
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
