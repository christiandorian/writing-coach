'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface SkillData {
  subject: string
  latest: number
  average: number
}

interface SkillBreakdownProps {
  data: SkillData[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#EDEFF4] rounded-[8px] p-3 shadow-[0_4px_16px_0_#282E3E1A] space-y-1">
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="q-b5 text-[#586380]">{p.name}:</span>
          <span className="q-sh5 text-[#282E3E]">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

export default function SkillBreakdown({ data }: SkillBreakdownProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#e4e6f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b6b8a', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Radar name="All-time avg" dataKey="average" stroke="#e4e6f0" fill="#e4e6f0" fillOpacity={0.6} />
        <Radar name="Latest" dataKey="latest" stroke="#4255ff" fill="#4255ff" fillOpacity={0.2} />
        <Legend formatter={(v) => <span style={{ color: '#6b6b8a', fontSize: 12 }}>{v}</span>} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
