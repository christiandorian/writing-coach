'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/lib/store/workspace'
import type { Source } from '@/lib/store/workspace'
import LeftRail from '@/components/workspace/LeftRail'
import CenterPanel from '@/components/workspace/CenterPanel'

const DEFAULT_WIDTH = 320
const MIN_WIDTH = 240
const MAX_WIDTH = 700

export default function WorkspacePage() {
  const { setPastSessions } = useWorkspaceStore()
  const supabase = createClient()
  const [railWidth, setRailWidth] = useState(DEFAULT_WIDTH)
  const [sourcesLoading, setSourcesLoading] = useState(true)
  const [dragging, setDragging] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_WIDTH)

  // Show persisted sources immediately on client mount (no loading flash for returning users)
  useEffect(() => {
    if (useWorkspaceStore.getState().sources.length > 0) {
      setSourcesLoading(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      // Load past sessions
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('id, prompt_text, created_at, feedback(overall_score, version)')
        .order('created_at', { ascending: false })
        .limit(20)

      if (sessionData) {
        setPastSessions(
          sessionData.map((s: any) => {
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

      // Load persisted sources
      const { data: sourceData } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: true })

      setSourcesLoading(false)

      if (sourceData && sourceData.length > 0) {
        const { sources: currentSources, addSource } = useWorkspaceStore.getState()
        // Only load if store is empty (avoid duplicating on hot reload)
        if (currentSources.length === 0) {
          sourceData.forEach((row: any) => {
            let dataUrl: string | undefined
            // Rebuild object URL from base64 for binary files
            if (row.file_data) {
              try {
                const binary = atob(row.file_data)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                const mimeType = row.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i)
                  ? `image/${row.name.split('.').pop()?.toLowerCase()}`
                  : 'application/pdf'
                const blob = new Blob([bytes], { type: mimeType })
                dataUrl = URL.createObjectURL(blob)
              } catch {}
            }
            // Inject with known id so we don't duplicate on re-load
            useWorkspaceStore.setState(state => ({
              sources: [
                ...state.sources,
                {
                  id: row.id,
                  name: row.name,
                  content: row.content ?? '',
                  fileData: row.file_data ?? undefined,
                  dataUrl,
                  type: row.type as 'text' | 'pdf',
                  selected: row.selected,
                }
              ]
            }))
          })
        }
      }
    }
    load()
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only respond to left button
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    isDragging.current = true
    setDragging(true)
    startX.current = e.clientX
    startWidth.current = railWidth

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const delta = ev.clientX - startX.current
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => setRailWidth(next))
    }

    const onMouseUp = () => {
      isDragging.current = false
      setDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex h-full px-[var(--q-space-16)] pb-[var(--q-space-16)] bg-[var(--q-surface-bg)]">
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
          <LeftRail sourcesLoading={sourcesLoading} />
        </div>

        {/* Drag handle — 8px grab zone, 1px line on hover, 2px on drag */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 flex-shrink-0 cursor-col-resize z-10 relative group bg-[var(--q-surface-base)]"
        >
          <div
            className="absolute inset-y-0 left-0 bg-transparent group-hover:bg-[var(--q-twilight-400)] transition-all duration-150"
            style={{
              width: dragging ? 2 : 1,
              backgroundColor: dragging ? 'var(--q-twilight-400)' : undefined,
            }}
          />
        </div>

        <CenterPanel />
      </div>
    </div>
  )
}
