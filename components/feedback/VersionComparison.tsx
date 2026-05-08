'use client'

import { useState } from 'react'
import type { FeedbackResponse } from '@/lib/types'
import { scoreColorClass, toDisplayScore, computeTotalScore } from '@/lib/utils'

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
  const [activeVersion, setActiveVersion] = useState<1 | 2>(2)

  const activeFeedback = activeVersion === 1 ? feedbackV1 : feedbackV2
  const activeText = activeVersion === 1 ? v1Text : v2Text
  const t1 = computeTotalScore(feedbackV1.dimensions)
  const t2 = computeTotalScore(feedbackV2.dimensions)

  return (
    <div className="space-y-[var(--q-space-16)]">
      <div className="flex items-center justify-between">
        <h3 className="q-h5 text-[var(--q-text-primary)]">Version Comparison</h3>

        {/* Version toggle */}
        <div className="flex items-center gap-[var(--q-space-2)] bg-[var(--q-surface-bg)] rounded-[var(--q-radius-full)] p-[var(--q-space-4)]">
          {([1, 2] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveVersion(v)}
              className={[
                'q-sh5 px-[var(--q-space-12)] py-[var(--q-space-6)] rounded-[var(--q-radius-full)] transition-all',
                activeVersion === v
                  ? 'bg-[var(--q-surface-base)] text-[var(--q-text-primary)] shadow-q-sm'
                  : 'text-[var(--q-text-muted)] hover:text-[var(--q-text-secondary)]',
              ].join(' ')}
            >
              Version {v}
            </button>
          ))}
        </div>
      </div>

      {/* Score comparison table — active version column highlighted */}
      <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-12)] border border-[var(--q-border-primary)] shadow-q-sm overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center px-[var(--q-space-16)] py-[var(--q-space-8)] border-b border-[var(--q-border-primary)] bg-[var(--q-surface-bg)]">
          <span className="flex-1 q-sh5 text-[var(--q-text-muted)] uppercase tracking-wider">Dimension</span>
          {([1, 2] as const).map((v) => (
            <span
              key={v}
              className={`w-20 text-right q-sh5 uppercase tracking-wider ${
                activeVersion === v ? 'text-[var(--q-twilight-500)]' : 'text-[var(--q-text-muted)]'
              }`}
            >
              V{v}
            </span>
          ))}
          <span className="w-10 text-right q-sh5 text-[var(--q-text-muted)] uppercase tracking-wider">Δ</span>
        </div>

        {/* Dimension rows */}
        {DIMENSIONS.map(({ key, label }) => {
          const v1 = toDisplayScore(feedbackV1.dimensions[key].score)
          const v2 = toDisplayScore(feedbackV2.dimensions[key].score)
          const delta = v2 - v1
          return (
            <div
              key={key}
              className={`flex items-center px-[var(--q-space-16)] py-[var(--q-space-10)] border-b border-[var(--q-border-primary)] transition-colors ${
                activeVersion === 1
                  ? 'bg-[var(--q-twilight-100)]/20'
                  : 'bg-[var(--q-surface-base)]'
              }`}
              style={activeVersion === 2 ? { background: 'rgba(66,85,255,0.03)' } : {}}
            >
              <span className="flex-1 q-b4 text-[var(--q-text-secondary)]">{label}</span>
              <span className={`w-20 text-right q-sh4 tabular-nums ${activeVersion === 1 ? scoreColorClass(v1, 20) : 'text-[var(--q-text-muted)]'}`}>
                {v1}/20
              </span>
              <span className={`w-20 text-right q-sh4 tabular-nums ${activeVersion === 2 ? scoreColorClass(v2, 20) : 'text-[var(--q-text-muted)]'}`}>
                {v2}/20
              </span>
              <span className={`w-10 text-right q-sh5 tabular-nums ${delta > 0 ? 'text-[var(--q-mint-600)]' : delta < 0 ? 'text-[var(--q-cherry-500)]' : 'text-[var(--q-text-muted)]'}`}>
                {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
              </span>
            </div>
          )
        })}

        {/* Total row */}
        <div className="flex items-center px-[var(--q-space-16)] py-[var(--q-space-12)] bg-[var(--q-surface-bg)]">
          <span className="flex-1 q-sh4 text-[var(--q-text-primary)]">Total</span>
          <span className={`w-20 text-right q-sh3 tabular-nums ${activeVersion === 1 ? scoreColorClass(t1, 100) : 'text-[var(--q-text-muted)]'}`}>
            {t1}
          </span>
          <span className={`w-20 text-right q-sh3 tabular-nums ${activeVersion === 2 ? scoreColorClass(t2, 100) : 'text-[var(--q-text-muted)]'}`}>
            {t2}
          </span>
          {(() => {
            const delta = t2 - t1
            return (
              <span className={`w-10 text-right q-sh4 tabular-nums ${delta > 0 ? 'text-[var(--q-mint-600)]' : delta < 0 ? 'text-[var(--q-cherry-500)]' : 'text-[var(--q-text-muted)]'}`}>
                {delta > 0 ? `+${delta}` : delta === 0 ? '—' : delta}
              </span>
            )
          })()}
        </div>
      </div>

      {/* Active version response */}
      <div className="space-y-[var(--q-space-8)]">
        <div className="flex items-center justify-between">
          <p className="q-sh5 uppercase tracking-wider text-[var(--q-twilight-500)]">
            Version {activeVersion} — Response
          </p>
          <span className={`q-sh5 tabular-nums ${scoreColorClass(activeVersion === 1 ? t1 : t2, 100)}`}>
            {activeVersion === 1 ? t1 : t2}/100
          </span>
        </div>
        <div className="bg-[var(--q-surface-base)] rounded-[var(--q-radius-12)] border-2 border-[var(--q-twilight-200)] p-[var(--q-space-16)] q-b4 text-[var(--q-text-primary)] leading-relaxed max-h-56 overflow-y-auto">
          {activeText}
        </div>
      </div>
    </div>
  )
}
