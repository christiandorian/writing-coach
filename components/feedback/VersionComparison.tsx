'use client'

import type { FeedbackResponse } from '@/lib/types'
import { scoreColorClass } from '@/lib/utils'

interface VersionComparisonProps {
  v1Text: string
  v2Text: string
  feedbackV1: FeedbackResponse
  feedbackV2: FeedbackResponse
}

const DIMENSIONS = [
  { key: 'position_clarity', label: 'Position Clarity' },
  { key: 'argument_structure', label: 'Argument Structure' },
  { key: 'logical_consistency', label: 'Logical Consistency' },
  { key: 'use_of_evidence', label: 'Use of Evidence' },
  { key: 'tradeoff_awareness', label: 'Tradeoff Awareness' },
] as const

export default function VersionComparison({ v1Text, v2Text, feedbackV1, feedbackV2 }: VersionComparisonProps) {
  return (
    <div className="space-y-[var(--q-space-16)]">
      <h3 className="q-h5 text-[var(--q-text-primary)]">Version Comparison</h3>

      <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-12)] border border-[var(--q-border-primary)] shadow-q-sm divide-y divide-[var(--q-border-primary)]">
        {DIMENSIONS.map(({ key, label }) => {
          const v1Score = feedbackV1.dimensions[key].score
          const v2Score = feedbackV2.dimensions[key].score
          const delta = v2Score - v1Score
          return (
            <div key={key} className="flex items-center justify-between px-[var(--q-space-16)] py-[var(--q-space-10)]">
              <span className="q-b4 text-[var(--q-text-secondary)]">{label}</span>
              <div className="flex items-center gap-[var(--q-space-12)] tabular-nums">
                <span className={`q-sh4 ${scoreColorClass(v1Score)}`}>{v1Score}</span>
                <span className="q-b5 text-[var(--q-text-muted)]">→</span>
                <span className={`q-sh4 ${scoreColorClass(v2Score)}`}>{v2Score}</span>
                <span className={`q-sh4 w-10 text-right ${delta > 0 ? 'text-[var(--q-mint-600)]' : delta < 0 ? 'text-[var(--q-cherry-500)]' : 'text-[var(--q-text-muted)]'}`}>
                  {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
                </span>
              </div>
            </div>
          )
        })}

        <div className="flex items-center justify-between px-[var(--q-space-16)] py-[var(--q-space-10)] bg-[var(--q-surface-bg)]">
          <span className="q-sh4 text-[var(--q-text-primary)]">Overall</span>
          <div className="flex items-center gap-[var(--q-space-12)] tabular-nums">
            <span className={`q-sh3 ${scoreColorClass(Math.round(feedbackV1.overall_score))}`}>{feedbackV1.overall_score.toFixed(1)}</span>
            <span className="q-b5 text-[var(--q-text-muted)]">→</span>
            <span className={`q-sh3 ${scoreColorClass(Math.round(feedbackV2.overall_score))}`}>{feedbackV2.overall_score.toFixed(1)}</span>
            {(() => {
              const delta = feedbackV2.overall_score - feedbackV1.overall_score
              return (
                <span className={`q-sh3 w-10 text-right ${delta > 0 ? 'text-[var(--q-mint-600)]' : delta < 0 ? 'text-[var(--q-cherry-500)]' : 'text-[var(--q-text-muted)]'}`}>
                  {delta > 0 ? `+${delta.toFixed(1)}` : delta === 0 ? '—' : delta.toFixed(1)}
                </span>
              )
            })()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--q-space-16)]">
        <div className="space-y-[var(--q-space-8)]">
          <p className="q-sh5 uppercase tracking-wider text-[var(--q-text-muted)]">Version 1</p>
          <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-12)] border border-[var(--q-border-primary)] p-[var(--q-space-16)] q-b4 text-[var(--q-text-secondary)] leading-relaxed max-h-56 overflow-y-auto">
            {v1Text}
          </div>
        </div>
        <div className="space-y-[var(--q-space-8)]">
          <p className="q-sh5 uppercase tracking-wider text-[var(--q-twilight-500)]">Version 2</p>
          <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-12)] border-2 border-[var(--q-twilight-500)] p-[var(--q-space-16)] q-b4 text-[var(--q-text-primary)] leading-relaxed max-h-56 overflow-y-auto">
            {v2Text}
          </div>
        </div>
      </div>
    </div>
  )
}
