'use client'

import { scoreColor } from '@/lib/utils'

interface HeatmapDay {
  date: string
  score: number | null
  count: number
}

interface SessionHeatmapProps {
  data: HeatmapDay[]
}

export default function SessionHeatmap({ data }: SessionHeatmapProps) {
  const weeks: HeatmapDay[][] = []
  let week: HeatmapDay[] = []

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 6 * 7 * 7)

  const dataMap = new Map(data.map((d) => [d.date, d]))

  let cursor = new Date(startDate)
  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0]
    const entry = dataMap.get(dateStr) ?? { date: dateStr, score: null, count: 0 }
    week.push(entry)

    if (week.length === 7) {
      weeks.push(week)
      week = []
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  if (week.length > 0) weeks.push(week)

  const scoreToColor = (score: number) => {
    if (score < 5) return '#ffd0d0'
    if (score <= 7) return '#ffe0b2'
    return '#c8f5e0'
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((day) => (
              <div
                key={day.date}
                title={day.count > 0 ? `${day.date}: ${day.count} session(s), avg ${day.score?.toFixed(1)}` : day.date}
                className="w-3 h-3 rounded-sm transition-all"
                style={{
                  backgroundColor: day.count === 0 ? '#e4e6f0' : scoreToColor(Math.round(day.score ?? 0)),
                  border: day.count > 0 ? '1px solid rgba(66,85,255,0.1)' : '1px solid transparent',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
