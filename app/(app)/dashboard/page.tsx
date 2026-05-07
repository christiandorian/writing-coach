'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace'
import LeftRail from '@/components/workspace/LeftRail'
import CenterPanel from '@/components/workspace/CenterPanel'

const DEFAULT_WIDTH = 460

export default function WorkspacePage() {
  const { setPastSessions } = useWorkspaceStore()
  const supabase = createClient()
  const [railWidth] = useState(DEFAULT_WIDTH)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id, prompt_text, created_at, feedback(overall_score, version)')
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        setPastSessions(
          data.map((s: any) => {
            const v1 = s.feedback?.find((f: any) => f.version === 1)
            return {
              id: s.id,
              promptSnippet: s.prompt_text.slice(0, 60) + (s.prompt_text.length > 60 ? '...' : ''),
              score: v1?.overall_score ?? null,
              createdAt: s.created_at,
            }
          })
        )
      }
    }
    load()
  }, [])


  return (
    <div className="flex h-full px-[var(--q-space-16)] pb-[var(--q-space-16)] bg-[var(--q-surface-bg)]">
      {/* Workspace container — rounded, twilight/200 border */}
      <div
        className="flex flex-1 overflow-hidden bg-[var(--q-surface-bg)]"
        style={{
          borderRadius: 'var(--q-radius-xxl)',
          border: '1px solid var(--q-twilight-200)',
          boxShadow: '0 -1px 0 0 #EDEFFF, 0 4px 0 0 rgba(66, 85, 255, 0.25)',
          position: 'relative',
          zIndex: 10000,
        }}
      >
        {/* Left rail */}
        <div style={{ width: railWidth, flexShrink: 0 }} className="flex flex-col overflow-hidden">
          <LeftRail />
        </div>

        <CenterPanel />
      </div>
    </div>
  )
}
