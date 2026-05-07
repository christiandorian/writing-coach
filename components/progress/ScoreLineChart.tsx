'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  overall: number
  position_clarity?: number
  argument_structure?: number
  logical_consistency?: number
  use_of_evidence?: number
  tradeoff_awareness?: number
}

interface ScoreLineChartProps {
  data: DataPoint[]
  activeDimension?: string | null
}

const DIMENSION_COLORS: Record<string, string> = {
  overall: '#4255ff',
  position_clarity: '#00c48c',
  argument_structure: '#4255ff',
  logical_consistency: '#ff6b6b',
  use_of_evidence: '#ff9500',
  tradeoff_awareness: '#9b59b6',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#EDEFF4] rounded-[8px] p-3 shadow-[0_4px_16px_0_#282E3E1A] q-b5 space-y-1">
      <p className="q-sh5 text-[#586380] mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="q-sh5 text-[#282E3E]">{p.value?.toFixed(1)}/10</span>
        </div>
      ))}
    </div>
  )
}

export default function ScoreLineChart({ data, activeDimension }: ScoreLineChartProps) {
  const key = activeDimension ?? 'overall'

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e6f0" />
        <XAxis dataKey="date" tick={{ fill: '#9999b3', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 10]} tick={{ fill: '#9999b3', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={key}
          stroke={DIMENSION_COLORS[key] ?? '#4255ff'}
          strokeWidth={2.5}
          dot={{ fill: DIMENSION_COLORS[key] ?? '#4255ff', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
