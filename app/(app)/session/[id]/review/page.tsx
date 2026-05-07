import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, scoreColorClass } from '@/lib/utils'
import type { Session, Feedback } from '@/lib/types'

interface ReviewPageProps {
  params: { id: string }
}

const DIMENSIONS = [
  { key: 'position_clarity' as const, label: 'Position Clarity' },
  { key: 'argument_structure' as const, label: 'Argument Structure' },
  { key: 'logical_consistency' as const, label: 'Logical Consistency' },
  { key: 'use_of_evidence' as const, label: 'Use of Evidence' },
  { key: 'tradeoff_awareness' as const, label: 'Tradeoff Awareness' },
]

export default async function ReviewPage({ params }: ReviewPageProps) {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single() as { data: Session | null }

  if (!session) notFound()

  const { data: feedbackRows } = await supabase
    .from('feedback')
    .select('*')
    .eq('session_id', params.id)
    .order('version', { ascending: true }) as { data: Feedback[] | null }

  const v1Feedback = feedbackRows?.find((f) => f.version === 1)
  const v2Feedback = feedbackRows?.find((f) => f.version === 2)

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Session Review</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{formatDate(session.created_at)}</p>
          </div>
          {v1Feedback && (
            <span className={`text-2xl font-bold font-display tabular-nums ${scoreColorClass(Math.round(v1Feedback.overall_score))}`}>
              {Number(v1Feedback.overall_score).toFixed(1)}/10
            </span>
          )}
        </div>

        {/* Prompt */}
        <div className="bg-[var(--accent-light)] rounded-[var(--radius-lg)] p-6 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Prompt</p>
          <p className="text-base font-semibold text-[var(--text-primary)] leading-relaxed">{session.prompt_text}</p>
        </div>

        {/* Position */}
        <div className="bg-white rounded-[var(--radius)] border border-[var(--border)] shadow-sm p-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Declared Position</p>
          <p className="text-base text-[var(--text-primary)] italic leading-relaxed">{session.position}</p>
        </div>

        {/* Response V1 */}
        <div className="bg-white rounded-[var(--radius)] border border-[var(--border)] shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Your Response {v2Feedback ? '(Version 1)' : ''}
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {session.response_v1}
          </p>
        </div>

        {/* Feedback V1 */}
        {v1Feedback && (
          <details className="group bg-white rounded-[var(--radius)] border border-[var(--border)] shadow-sm overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4">
              <span className="text-sm font-bold text-[var(--text-primary)]">AI Feedback — Version 1</span>
              <div className="flex items-center gap-3">
                <span className={`text-base font-bold tabular-nums ${scoreColorClass(Math.round(v1Feedback.overall_score))}`}>
                  {Number(v1Feedback.overall_score).toFixed(1)}/10
                </span>
                <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform text-sm">▾</span>
              </div>
            </summary>
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)] pt-4">
              <div className="bg-[var(--accent)] rounded-[var(--radius-sm)] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Coach's Note</p>
                <p className="text-sm text-white">{v1Feedback.coach_note}</p>
              </div>
              {DIMENSIONS.map((d) => {
                const scoreKey = `${d.key}_score` as keyof Feedback
                const diagKey = `${d.key}_diagnosis` as keyof Feedback
                const suggKey = `${d.key}_suggestion` as keyof Feedback
                return (
                  <div key={d.key} className="bg-[var(--bg)] rounded-[var(--radius-sm)] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{d.label}</p>
                      <span className={`text-sm font-bold tabular-nums ${scoreColorClass(v1Feedback[scoreKey] as number)}`}>
                        {v1Feedback[scoreKey]}/10
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{v1Feedback[diagKey] as string}</p>
                    <div className="bg-[var(--accent-light)] rounded p-2">
                      <p className="text-xs text-[var(--accent)] font-semibold">{v1Feedback[suggKey] as string}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        {/* Response V2 */}
        {session.response_v2 && (
          <>
            <div className="bg-white rounded-[var(--radius)] border-2 border-[var(--accent)] shadow-sm p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Your Response (Version 2)</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {session.response_v2}
              </p>
            </div>

            {v2Feedback && (
              <details className="group bg-white rounded-[var(--radius)] border border-[var(--border)] shadow-sm overflow-hidden">
                <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4">
                  <span className="text-sm font-bold text-[var(--text-primary)]">AI Feedback — Version 2</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-bold tabular-tabs ${scoreColorClass(Math.round(v2Feedback.overall_score))}`}>
                      {Number(v2Feedback.overall_score).toFixed(1)}/10
                    </span>
                    <span className="text-[var(--text-muted)] group-open:rotate-180 transition-transform text-sm">▾</span>
                  </div>
                </summary>
                <div className="px-5 pb-5 border-t border-[var(--border)] pt-4">
                  <div className="bg-[var(--accent)] rounded-[var(--radius-sm)] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Coach's Note</p>
                    <p className="text-sm text-white">{v2Feedback.coach_note}</p>
                  </div>
                </div>
              </details>
            )}
          </>
        )}

        {/* Footer nav */}
        <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
          <Link href={`/session/${params.id}/feedback`} className="text-sm font-semibold text-[var(--accent)] hover:underline">
            ← Back to feedback
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
