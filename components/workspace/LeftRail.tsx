'use client'

import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { useWorkspaceStore } from '@/lib/store/workspace'
import type { Source } from '@/lib/store/workspace'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import SourceSearchModal, { prefetchPopularSets } from '@/components/workspace/SourceSearchModal'
import type { QuizletSet } from '@/app/api/quizlet-search/route'

export default function LeftRail({ sourcesLoading = false }: { sourcesLoading?: boolean }) {
  const { sources, addSource, toggleSource, removeSource, setSourceTags, updateSourceContent, step, resetSession } = useWorkspaceStore()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [restartWarningOpen, setRestartWarningOpen] = useState(false)
  const pendingToggleRef = useRef<(() => void) | null>(null)
  const [textName, setTextName] = useState('')
  const [textContent, setTextContent] = useState('')
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Prefetch popular Quizlet sets in background on mount
  useEffect(() => { prefetchPopularSets() }, [])

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
  }

  const saveSourceToDB = async (source: Source) => {
    const userId = await getUserId()
    if (!userId) return
    await supabase.from('sources').upsert({
      id: source.id,
      user_id: userId,
      name: source.name,
      content: source.content,
      file_data: source.fileData ?? null,
      type: source.type,
      selected: source.selected,
    })
  }

  const deleteSourceFromDB = async (id: string) => {
    await supabase.from('sources').delete().eq('id', id)
  }

  const updateSelectedInDB = async (id: string, selected: boolean) => {
    await supabase.from('sources').update({ selected }).eq('id', id)
  }

  const selectedCount = sources.filter((s) => s.selected).length

  const generateTags = async (id: string, content: string, name: string) => {
    try {
      const res = await fetch('/api/sources/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.slice(0, 3000), name }),
      })
      if (!res.ok) return
      const { tags } = await res.json()
      if (Array.isArray(tags) && tags.length > 0) setSourceTags(id, tags)
    } catch {}
  }

  const handleAddQuizletSet = (set: QuizletSet, terms: import('@/app/api/quizlet-set/route').FlashcardTerm[]): string => {
    const termLines = terms.length > 0
      ? terms.map(t => `${t.term}: ${t.definition}`).join('\n')
      : `${set.title} — ${set.termCount} terms by ${set.author}`
    const id = addSource({ name: set.title, content: termLines, type: 'quizlet', fileData: set.author })
    // Preload tags in background so they're ready when the user opens the source
    generateTags(id, termLines, set.title)
    return id
  }

  const handleFile = async (file: File) => {
    setLoadingFile(true)
    try {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
      const isImage = file.type.startsWith('image/')
      if (isPdf || isImage) {
        // Add placeholder first so user sees the item appear with loading state
        const dataUrl = URL.createObjectURL(file)
        const id = addSource({ name: file.name, content: '', dataUrl, type: 'pdf' })
        setLoadingSourceId(id)
        // Read as base64 for persistence
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        bytes.forEach(b => { binary += String.fromCharCode(b) })
        const base64 = btoa(binary)
        // Update store with fileData
        useWorkspaceStore.setState(state => ({
          sources: state.sources.map(s =>
            s.id === id ? { ...s, fileData: base64 } : s
          )
        }))
        const src = useWorkspaceStore.getState().sources.find(s => s.id === id)
        if (src) await saveSourceToDB({ ...src, fileData: base64 })
        setLoadingSourceId(null)
        generateTags(id, '', file.name)
      } else {
        const id = addSource({ name: file.name, content: '', type: 'text' })
        setLoadingSourceId(id)
        const text = await file.text()
        useWorkspaceStore.setState(state => ({
          sources: state.sources.map(s =>
            s.id === id ? { ...s, content: text } : s
          )
        }))
        const src = useWorkspaceStore.getState().sources.find(s => s.id === id)
        if (src) await saveSourceToDB({ ...src, content: text })
        setLoadingSourceId(null)
        generateTags(id, text, file.name)
      }
    } finally {
      setLoadingFile(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // Auto-focus textarea when paste modal opens
  useEffect(() => {
    if (pasteModalOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [pasteModalOpen])

  const handlePasteInsert = () => {
    if (!textContent.trim()) return
    const name = textName.trim() || 'Pasted text'
    const content = textContent.trim()
    const id = addSource({ name, content, type: 'text' })
    const src = useWorkspaceStore.getState().sources.find(s => s.id === id)
    if (src) saveSourceToDB(src)
    setTextName('')
    setTextContent('')
    setPasteModalOpen(false)
    generateTags(id, content, name)
  }

  // Close add menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false)
      }
    }
    if (addMenuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addMenuOpen])

  return (
    <div className="flex flex-col h-full bg-[var(--q-surface-base)] border-r border-[var(--q-twilight-200)]">
      {/* Header */}
      <div className="flex items-center justify-between pl-[var(--q-space-24)] pr-[var(--q-space-16)] pt-[var(--q-space-16)] pb-[var(--q-space-12)]">
        <div className="flex items-center gap-[var(--q-space-8)]">
          <span className="q-sh3 text-[var(--q-text-primary)]">Sources</span>
          {loadingFile && (
            <span className="w-4 h-4 border-2 border-[var(--q-twilight-300)] border-t-[var(--q-twilight-500)] rounded-full animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-[var(--q-space-4)]">
          {/* Add button with dropdown */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="text-secondary"
              size="medium"
              circle
              onClick={() => setAddMenuOpen((v) => !v)}
              title="Add source"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add_2</span>
            </Button>

            {addMenuOpen && (
              <div
                className="absolute right-0 mt-[var(--q-space-4)] bg-[var(--q-surface-base)] py-[var(--q-space-4)] min-w-[180px]"
                style={{
                  borderRadius: 'var(--q-radius-lg)',
                  border: '1px solid var(--q-border-primary)',
                  boxShadow: 'var(--q-shadow-md)',
                  zIndex: 20001,
                }}
              >
                <button
                  onClick={() => { setAddMenuOpen(false); fileRef.current?.click() }}
                  className="w-full flex items-center gap-[var(--q-space-12)] px-[var(--q-space-16)] py-[var(--q-space-8)] q-sh3 text-[var(--q-text-secondary)] hover:bg-[var(--q-surface-bg)] hover:text-[var(--q-text-primary)] transition-colors"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 24 }}>upload</span>
                  Upload files
                </button>
                <button
                  onClick={() => { setAddMenuOpen(false); setPasteModalOpen(true) }}
                  className="w-full flex items-center gap-[var(--q-space-12)] px-[var(--q-space-16)] py-[var(--q-space-8)] q-sh3 text-[var(--q-text-secondary)] hover:bg-[var(--q-surface-bg)] hover:text-[var(--q-text-primary)] transition-colors"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 24 }}>content_paste</span>
                  Paste text
                </button>
              </div>
            )}
          </div>

          <Button variant="text-secondary" size="medium" circle onClick={() => setSearchModalOpen(true)} title="Search Quizlet">
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>search</span>
          </Button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".txt,.pdf,.md,.png,.jpg,.jpeg,.gif,.webp" className="hidden" multiple
        onChange={(e) => {
          Array.from(e.target.files ?? []).forEach(handleFile)
          e.target.value = ''
        }} />

      {/* Divider + selection bar — shown when sources exist */}
      {sources.length > 0 && (
        <>
          <div className="px-[var(--q-space-24)]">
            <div className="h-px bg-[var(--q-border-primary)]" />
          </div>
          <div style={{ height: 16 }} />
        <div className="flex items-center gap-[var(--q-space-8)] px-[var(--q-space-24)] py-[var(--q-space-6)]">
          <p className="flex-1 q-sh4 text-[var(--q-text-secondary)] truncate">
            {selectedCount} of {sources.length} selected
          </p>
          <button
            onClick={() => {
              if (selectedCount === 0) {
                sources.forEach((s) => {
                  if (!s.selected) {
                    toggleSource(s.id)
                    updateSelectedInDB(s.id, true)
                  }
                })
              } else {
                sources.forEach((s) => {
                  if (s.selected) {
                    toggleSource(s.id)
                    updateSelectedInDB(s.id, false)
                  }
                })
              }
            }}
            className="q-sh4 flex-shrink-0 transition-colors text-[var(--q-twilight-500)] hover:text-[var(--q-twilight-600)] cursor-pointer"
          >
            {selectedCount === 0 ? 'Select all' : 'Clear all'}
          </button>
        </div>
        </>
      )}

      {/* Source list */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {sourcesLoading ? (
          /* Shimmer skeleton matching Quizlet DS */
          <div className="flex flex-col pt-[var(--q-space-16)]">
            {/* Selection bar shimmer — same height as real bar (32px = py-6 + 20px line-height) */}
            <div className="px-[var(--q-space-24)] py-[var(--q-space-6)] flex items-center">
              <div className="shimmer h-[14px] rounded-[var(--q-radius-full)] w-1/2" />
            </div>
            {/* Source row skeletons — same layout as real SourceItem */}
            <div className="py-[var(--q-space-4)] px-[var(--q-space-16)]">
              {[143, 110, 130].map((w, i) => (
                <div key={i} className="flex items-center gap-[var(--q-space-8)] p-[var(--q-space-8)] rounded-[var(--q-radius-12)]">
                  <div className="shimmer flex-shrink-0 w-10 h-10 rounded-[var(--q-radius-md)]" />
                  <div className="flex-1 flex flex-col gap-[var(--q-space-4)]">
                    <div className="shimmer h-[14px] rounded-[var(--q-radius-full)]" style={{ width: w }} />
                    <div className="shimmer h-[14px] rounded-[var(--q-radius-full)] w-[89px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : sources.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              'm-[var(--q-space-12)] flex flex-col items-center justify-center gap-[var(--q-space-12)]',
              'rounded-[var(--q-radius-lg)] transition-colors cursor-pointer flex-1',
              dragging ? 'bg-[var(--q-twilight-100)]' : 'hover:bg-[var(--q-twilight-100)]/50',
            ].join(' ')}
            style={{
              backgroundImage: dragging
                ? `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='1' y='1' width='99%25' height='99%25' fill='none' rx='15' ry='15' stroke='%234255FF' stroke-width='2' stroke-dasharray='10 10' stroke-linejoin='miter' stroke-miterlimit='4'/%3e%3c/svg%3e")`
                : `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='1' y='1' width='99%25' height='99%25' fill='none' rx='15' ry='15' stroke='%23D9DDE8' stroke-width='2' stroke-dasharray='10 10' stroke-linejoin='miter' stroke-miterlimit='4'/%3e%3c/svg%3e")`,
            }}
            onClick={() => fileRef.current?.click()}
          >
            <img src="/documents.png" alt="Documents" style={{ width: 108, height: 48 }} className="object-contain" />
            <p className="q-sh3 text-[var(--q-text-muted)] text-center">Drag and drop documents here</p>
            <Button size="large" variant="primary" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>
              Upload a file
            </Button>
          </div>
        ) : (
          <div className="py-[var(--q-space-4)] px-[var(--q-space-16)]">
            {sources.map((src) => (
              <SourceItem
                key={src.id}
                source={src}
                loading={loadingSourceId === src.id}
                onToggle={() => {
                  if (step === 'writing') {
                    pendingToggleRef.current = () => {
                      toggleSource(src.id)
                      updateSelectedInDB(src.id, !src.selected)
                    }
                    setRestartWarningOpen(true)
                    return
                  }
                  toggleSource(src.id)
                  updateSelectedInDB(src.id, !src.selected)
                }}
                onRemove={() => {
                  removeSource(src.id)
                  deleteSourceFromDB(src.id)
                }}
              />
            ))}
          </div>
        )}
      </div>


      {/* Restart activity warning modal */}
      <Modal open={restartWarningOpen} onClose={() => setRestartWarningOpen(false)} maxWidth={560}>
        <div className="flex flex-col -mx-[var(--q-space-24)] -mb-[var(--q-space-24)]">
          <div className="flex flex-col gap-[var(--q-space-16)] px-[var(--q-space-32)] pb-[var(--q-space-32)] pt-[var(--q-space-4)]">
            <p className="q-h2 text-[var(--q-text-primary)]">Restart activity?</p>
            <p className="q-b2 text-[var(--q-text-primary)]">Changing sources during an activity will restart the activity and you will lose your current progress. Would you like to proceed?</p>
          </div>
          <div className="h-px bg-[var(--q-border-primary)] w-full mb-[var(--q-space-16)]" />
          <div className="flex items-center justify-end gap-[var(--q-space-16)] px-[var(--q-space-16)] pb-[var(--q-space-16)]">
            <Button variant="tertiary" size="large" onClick={() => setRestartWarningOpen(false)}>Cancel</Button>
            <Button variant="danger" size="large" onClick={() => {
              setRestartWarningOpen(false)
              resetSession()
              pendingToggleRef.current?.()
              pendingToggleRef.current = null
            }}>Restart activity</Button>
          </div>
        </div>
      </Modal>

      {/* Quizlet search modal */}
      <SourceSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onAdd={handleAddQuizletSet}
        onUpdateContent={updateSourceContent}
      />

      {/* Paste text modal */}
      <Modal
        open={pasteModalOpen}
        onClose={() => setPasteModalOpen(false)}
        title="Paste copied text"
        subtitle="Paste your copied text below to upload as a source"
      >
        <div className="space-y-[var(--q-space-16)]">
          <textarea
            ref={textareaRef}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste text here"
            rows={8}
            className="w-full bg-[var(--q-surface-bg)] border border-[var(--q-border-primary)] rounded-[var(--q-radius-md)] text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)] px-[var(--q-space-12)] py-[var(--q-space-10)] q-b3 focus:outline-none focus:ring-2 focus:ring-[var(--q-twilight-300)] focus:border-transparent resize-none transition-all"
          />
          <div className="flex justify-end">
            <Button size="large" onClick={handlePasteInsert} disabled={!textContent.trim()}>
              Add source
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SourceTagsDisplay({ tags, loading }: { tags?: string[]; loading?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)

  // Two rows = chip height (28px) + gap (8px) + second chip (28px) = 64px
  const TWO_ROWS_PX = 64

  useLayoutEffect(() => {
    if (showAll || !containerRef.current || !tags?.length) return
    const el = containerRef.current
    setHasOverflow(el.scrollHeight > TWO_ROWS_PX + 2)
  }, [tags, showAll])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-[var(--q-space-8)] mb-[var(--q-space-16)]">
        {[88, 64, 104, 72, 96, 56].map((w, i) => (
          <div key={i} className="shimmer h-6 rounded-full" style={{ width: w }} />
        ))}
      </div>
    )
  }

  if (!tags?.length) return null

  return (
    <div className="mb-[var(--q-space-16)]">
      <div
        ref={containerRef}
        className="flex flex-wrap gap-[var(--q-space-8)] overflow-hidden"
        style={{ maxHeight: showAll ? 'none' : TWO_ROWS_PX }}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center px-[var(--q-space-10)] rounded-[var(--q-radius-full)] bg-[var(--q-gray-300)] q-sh5 text-[var(--q-text-secondary)] whitespace-nowrap"
            style={{ height: 28 }}
          >
            {tag}
          </span>
        ))}
      </div>
      {hasOverflow && (
        <Button
          variant="tertiary"
          size="xsmall"
          onClick={() => setShowAll((v) => !v)}
          className="mt-[var(--q-space-8)] gap-[var(--q-space-4)]"
        >
          {showAll ? 'See less' : 'See more'}
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
            {showAll ? 'expand_less' : 'expand_more'}
          </span>
        </Button>
      )}
    </div>
  )
}

function SourceItem({ source, loading = false, onToggle, onRemove }: { source: Source; loading?: boolean; onToggle: () => void; onRemove: () => void }) {
  const { setSourceTags } = useWorkspaceStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [tagsLoading, setTagsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Generate tags lazily when the view modal opens for the first time
  useEffect(() => {
    if (!viewOpen || source.tags || tagsLoading) return
    const run = async () => {
      setTagsLoading(true)
      try {
        const res = await fetch('/api/sources/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: (source.content ?? '').slice(0, 3000),
            name: source.name,
          }),
        })
        if (res.ok) {
          const { tags } = await res.json()
          if (Array.isArray(tags) && tags.length > 0) setSourceTags(source.id, tags)
        }
      } catch {}
      setTagsLoading(false)
    }
    run()
  }, [viewOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <>
      <div
        className={[
          'flex items-center gap-[var(--q-space-8)] p-[var(--q-space-8)]',
          'cursor-pointer group transition-all',
          'rounded-[var(--q-radius-12)]',
          loading ? 'opacity-50 pointer-events-none' : '',
          source.selected ? 'bg-[var(--q-twilight-100)]/40' : 'hover:bg-[var(--q-surface-bg)]',
        ].join(' ')}
        onClick={onToggle}
      >
        {/* Thumbnail */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-[var(--q-radius-md)] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: source.type === 'quizlet' ? '#eaf9ff' : '#EDEFF4' }}
        >
          {loading ? (
            <span className="material-symbols-rounded text-[var(--q-text-secondary)] animate-spin" style={{ fontSize: 24 }}>progress_activity</span>
          ) : source.type === 'quizlet' ? (
            <img src="/set.png" alt="" className="w-6 h-6 object-contain" />
          ) : (
            <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#586380' }}>
              {source.type === 'pdf'
                ? (source.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? 'image' : 'docs')
                : 'content_paste'}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="q-sh4 text-[var(--q-text-primary)] truncate">
            {source.type === 'text' ? source.content : source.name}
          </p>
          <p className="q-sh5 text-[var(--q-text-secondary)]">
            {source.type === 'quizlet'
              ? 'Flashcards'
              : source.type === 'text'
              ? 'Pasted text'
              : source.name?.split('.').pop()?.toUpperCase() ?? 'PDF'}
          </p>
        </div>

        {/* More options menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <Button
            variant="text-secondary"
            size="medium"
            circle
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            title="More options"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>more_horiz</span>
          </Button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-[var(--q-space-4)] bg-[var(--q-surface-base)] py-[var(--q-space-4)] min-w-[160px]"
              style={{
                borderRadius: 'var(--q-radius-lg)',
                border: '1px solid var(--q-border-primary)',
                boxShadow: 'var(--q-shadow-md)',
                zIndex: 20001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setMenuOpen(false); setViewOpen(true) }}
                className="w-full flex items-center gap-[var(--q-space-12)] px-[var(--q-space-16)] py-[var(--q-space-8)] q-sh3 text-[var(--q-text-secondary)] hover:bg-[var(--q-surface-bg)] hover:text-[var(--q-text-primary)] transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>visibility</span>
                View
              </button>
              <button
                onClick={() => { setMenuOpen(false); onRemove() }}
                className="w-full flex items-center gap-[var(--q-space-12)] px-[var(--q-space-16)] py-[var(--q-space-8)] q-sh3 text-[var(--q-text-error)] hover:bg-[var(--q-surface-bg)] transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 24 }}>delete</span>
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Select/deselect */}
        <Button
          variant="text-secondary"
          size="medium"
          circle
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          title={source.selected ? 'Deselect' : 'Select'}
          className={`flex-shrink-0 transition-colors ${source.selected ? 'text-[var(--q-twilight-500)]' : ''}`}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>
            {source.selected ? 'check_circle' : 'radio_button_unchecked'}
          </span>
        </Button>
      </div>

      {/* View source modal */}
      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={source.name || (source.type === 'text' ? 'Pasted text' : source.name)} titleClass={source.type === 'quizlet' ? 'q-h2' : undefined} maxWidth={620}>
        {source.type === 'quizlet' && (() => {
          const termCount = (source.content ?? '').split('\n').filter(l => l.trim()).length
          const author = source.fileData
          return <p className="q-sh5 text-[var(--q-text-secondary)] -mt-[var(--q-space-8)] mb-[var(--q-space-16)]">{termCount} terms{author ? ` · by ${author}` : ''}</p>
        })()}
        {source.type !== 'quizlet' && <SourceTagsDisplay tags={source.tags} loading={tagsLoading} />}
        {source.dataUrl ? (
          source.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
            <div className="rounded-[var(--q-radius-md)] overflow-hidden bg-[var(--q-surface-bg)] flex items-center justify-center" style={{ maxHeight: '65vh' }}>
              <img src={source.dataUrl} alt={source.name} className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="rounded-[var(--q-radius-md)] overflow-hidden bg-[var(--q-surface-bg)]" style={{ height: '65vh' }}>
              <iframe src={source.dataUrl} className="w-full h-full border-0" title={source.name} />
            </div>
          )
        ) : source.type === 'quizlet' ? (() => {
            const termLines = (source.content ?? '').split('\n').filter(l => l.trim())
            const termCount = termLines.length
            return (
              <div className="flex flex-col gap-[var(--q-space-12)]">
                <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-[var(--q-space-8)] pr-1">
                  {termLines.map((line, i) => {
                    const colonIdx = line.indexOf(': ')
                    const term = colonIdx >= 0 ? line.slice(0, colonIdx) : line
                    const def = colonIdx >= 0 ? line.slice(colonIdx + 2) : ''
                    return (
                      <div key={i} className="grid grid-cols-2 gap-[2px]">
                        <div className="bg-[var(--q-surface-bg)] px-4 py-4 rounded-l-[16px]">
                          <p className="q-sh3 text-[var(--q-text-primary)]">{term}</p>
                        </div>
                        <div className="bg-[var(--q-surface-bg)] px-4 py-4 rounded-r-[16px]">
                          <p className="q-b4 text-[var(--q-text-secondary)] leading-relaxed">{def}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()
        : (
          <div className="max-h-[60vh] overflow-y-auto bg-[var(--q-surface-bg)] rounded-[var(--q-radius-md)] p-[var(--q-space-16)]">
            <p className="q-b3 text-[var(--q-text-primary)] whitespace-pre-wrap leading-relaxed break-words">{source.content}</p>
          </div>
        )}
      </Modal>
    </>
  )
}
