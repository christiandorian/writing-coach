'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ScoreLineChart from '@/components/progress/ScoreLineChart'
import SkillBreakdown from '@/components/progress/SkillBreakdown'
import SessionHeatmap from '@/components/progress/SessionHeatmap'

const DIMENSIONS = [
  { key: 'position_clarity', label: 'Position Clarity' },
  { key: 'argument_structure', label: 'Argument Structure' },
  { key: 'logical_consistency', label: 'Logical Consistency' },
  { key: 'use_of_evidence', label: 'Use of Evidence' },
  { key: 'tradeoff_awareness', label: 'Tradeoff Awareness' },
] as const

export default function ProgressPage() {
  const supabase = createClient()

  const [activeDimension, setActiveDimension] = useState<string | null>(null)
  const [lineData, setLineData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [radarData, setRadarData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: feedbackRows } = await supabase
        .from('feedback')
        .select('*, sessions!inner(created_at)')
        .eq('version', 1)
        .order('created_at', { ascending: true })

      if (!feedbackRows || feedbackRows.length === 0) {
        setLoading(false)
        return
      }

      const line = feedbackRows.map((f) => ({
        date: new Date(f.sessions.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        overall: Number(f.overall_score),
        position_clarity: f.position_clarity_score,
        argument_structure: f.argument_structure_score,
        logical_consistency: f.logical_consistency_score,
        use_of_evidence: f.use_of_evidence_score,
        tradeoff_awareness: f.tradeoff_awareness_score,
      }))
      setLineData(line)

      const dateMap = new Map<string, { scores: number[]; count: number }>()
      feedbackRows.forEach((f) => {
        const date = new Date(f.sessions.created_at).toISOString().split('T')[0]
        const existing = dateMap.get(date) ?? { scores: [], count: 0 }
        existing.scores.push(Number(f.overall_score))
        existing.count++
        dateMap.set(date, existing)
      })

      setHeatmapData(Array.from(dateMap.entries()).map(([date, { scores, count }]) => ({
        date,
        score: scores.reduce((a, b) => a + b, 0) / scores.length,
        count,
      })))

      const latest = feedbackRows[feedbackRows.length - 1]
      setRadarData(DIMENSIONS.map((d) => ({
        subject: d.label.split(' ').slice(0, 2).join(' '),
        latest: latest[`${d.key}_score`] ?? 0,
        average: feedbackRows.reduce((sum, f) => sum + (f[`${d.key}_score`] ?? 0), 0) / feedbackRows.length,
      })))

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">Progress</h1>

        {lineData.length === 0 ? (
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm py-20 text-center text-[var(--text-muted)] text-sm">
            Complete some sessions to see your progress.
          </div>
        ) : (
          <>
            {/* Score over time */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Score Over Time
                </h2>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveDimension(null)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                      activeDimension === null
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]'
                    }`}
                  >
                    Overall
                  </button>
                  {DIMENSIONS.map((d) => (
                    <button
                      key={d.key}
                      onClick={() => setActiveDimension(d.key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                        activeDimension === d.key
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--bg)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <ScoreLineChart data={lineData} activeDimension={activeDimension} />
            </div>

            {/* Heatmap */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Session Activity
              </h2>
              <SessionHeatmap data={heatmapData} />
            </div>

            {/* Radar */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Skill Breakdown
              </h2>
              <SkillBreakdown data={radarData} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
