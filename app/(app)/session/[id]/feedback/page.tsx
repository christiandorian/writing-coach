'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/lib/store/session'
import { createClient } from '@/lib/supabase/client'
import { scoreColorClass, countWords } from '@/lib/utils'
import DimensionCard from '@/components/feedback/DimensionCard'
import CoachNote from '@/components/feedback/CoachNote'
import VersionComparison from '@/components/feedback/VersionComparison'
import WritingArea from '@/components/session/WritingArea'
import CountdownTimer from '@/components/session/CountdownTimer'
import WordCount from '@/components/session/WordCount'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { FeedbackResponse } from '@/lib/types'

const DIMENSIONS = [
  { key: 'position_clarity' as const, name: 'Position Clarity', label: 'Is there a clear, unambiguous thesis?' },
  { key: 'argument_structure' as const, name: 'Argument Structure', label: 'Is the response logically organized?' },
  { key: 'logical_consistency' as const, name: 'Logical Consistency', label: 'Do the points support each other?' },
  { key: 'use_of_evidence' as const, name: 'Use of Evidence', label: 'Are claims supported or reasoned?' },
  { key: 'tradeoff_awareness' as const, name: 'Tradeoff Awareness', label: 'Were counterarguments acknowledged?' },
]

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const sessionId = params.id as string

  const { prompt, position, responseText, timeLimitSeconds, feedbackV1, feedbackV2, setFeedbackV2 } = useSessionStore()

  const [showRewrite, setShowRewrite] = useState(false)
  const [rewriteText, setRewriteText] = useState('')
  const [isSubmittingRewrite, setIsSubmittingRewrite] = useState(false)
  const [showRewriteConfirm, setShowRewriteConfirm] = useState(false)
  const [rewriteStartTime, setRewriteStartTime] = useState<number>(0)
  const [loadedFeedback, setLoadedFeedback] = useState<FeedbackResponse | null>(null)

  useEffect(() => {
    if (!feedbackV1 && sessionId) {
      const load = async () => {
        const { data } = await supabase
          .from('feedback')
          .select('*')
          .eq('session_id', sessionId)
          .eq('version', 1)
          .single()

        if (data) {
          setLoadedFeedback({
            dimensions: {
              position_clarity: { score: data.position_clarity_score, diagnosis: data.position_clarity_diagnosis, suggestion: data.position_clarity_suggestion },
              argument_structure: { score: data.argument_structure_score, diagnosis: data.argument_structure_diagnosis, suggestion: data.argument_structure_suggestion },
              logical_consistency: { score: data.logical_consistency_score, diagnosis: data.logical_consistency_diagnosis, suggestion: data.logical_consistency_suggestion },
              use_of_evidence: { score: data.use_of_evidence_score, diagnosis: data.use_of_evidence_diagnosis, suggestion: data.use_of_evidence_suggestion },
              tradeoff_awareness: { score: data.tradeoff_awareness_score, diagnosis: data.tradeoff_awareness_diagnosis, suggestion: data.tradeoff_awareness_suggestion },
            },
            overall_score: data.overall_score,
            coach_note: data.coach_note,
          })
        }
      }
      load()
    }
  }, [feedbackV1, sessionId])

  const activeFeedback = feedbackV1 ?? loadedFeedback

  const handleStartRewrite = () => {
    setShowRewrite(true)
    setRewriteStartTime(Date.now())
  }

  const handleRewriteSubmit = async () => {
    setIsSubmittingRewrite(true)
    const elapsed = Math.round((Date.now() - rewriteStartTime) / 1000)

    try {
      await supabase.from('sessions').update({ response_v2: rewriteText }).eq('id', sessionId)

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, position, response: rewriteText, time_taken_seconds: elapsed, session_id: sessionId, version: 2 }),
      })

      const feedback = await res.json() as FeedbackResponse
      setFeedbackV2(feedback)
      setShowRewrite(false)
    } catch (err) {
      console.error('Rewrite error:', err)
    } finally {
      setIsSubmittingRewrite(false)
    }
  }

  if (!activeFeedback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const overallScore = activeFeedback.overall_score

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Overall score hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow p-8 text-center space-y-1"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Overall Score</p>
          <div className={`text-6xl font-display font-bold tabular-nums ${scoreColorClass(Math.round(overallScore))}`}>
            {overallScore.toFixed(1)}
          </div>
          <p className="text-sm text-[var(--text-muted)]">out of 10</p>
        </motion.div>

        {/* Coach note */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <CoachNote note={activeFeedback.coach_note} />
        </motion.div>

        {/* Dimension cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {DIMENSIONS.map((d) => (
            <DimensionCard
              key={d.key}
              name={d.name}
              label={d.label}
              score={activeFeedback.dimensions[d.key].score}
              diagnosis={activeFeedback.dimensions[d.key].diagnosis}
              suggestion={activeFeedback.dimensions[d.key].suggestion}
            />
          ))}
        </motion.div>

        {/* Version comparison */}
        {feedbackV2 && responseText && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <VersionComparison
              v1Text={responseText}
              v2Text={rewriteText}
              feedbackV1={activeFeedback}
              feedbackV2={feedbackV2}
            />
          </motion.div>
        )}

        {/* Rewrite area */}
        {showRewrite && !feedbackV2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)]">Rewrite</h3>
              <CountdownTimer totalSeconds={timeLimitSeconds} onExpire={handleRewriteSubmit} />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Fresh canvas — your original response is hidden. Write from scratch.
            </p>
            <WritingArea value={rewriteText} onChange={setRewriteText} />
            <div className="flex items-center justify-between">
              <WordCount text={rewriteText} />
              <Button
                onClick={() => setShowRewriteConfirm(true)}
                disabled={countWords(rewriteText) < 50 || isSubmittingRewrite}
                size="lg"
              >
                {isSubmittingRewrite ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : 'Submit rewrite →'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
          {!showRewrite && !feedbackV2 && (
            <Button variant="secondary" size="md" onClick={handleStartRewrite}>
              Try again with feedback in mind
            </Button>
          )}
          <Button variant="tertiary" size="md" onClick={() => router.push(`/session/${sessionId}/review`)}>
            Full review →
          </Button>
          <Button variant="tertiary" size="md" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>

      <Modal open={showRewriteConfirm} onClose={() => setShowRewriteConfirm(false)} title="Submit your rewrite?">
        <div className="space-y-5">
          <p className="text-sm text-[var(--text-secondary)]">
            This will be scored as Version 2. You'll see a comparison against your original.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowRewriteConfirm(false)}>
              Keep writing
            </Button>
            <Button size="md" className="flex-1" onClick={() => { setShowRewriteConfirm(false); handleRewriteSubmit() }}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
