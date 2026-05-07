'use client'

import { useRef, useState } from 'react'
import { useWorkspaceStore } from '@/lib/store/workspace'
import type { Source } from '@/lib/store/workspace'
import Button from '@/components/ui/Button'

export default function LeftRail() {
  const { sources, addSource, toggleSource, removeSource } = useWorkspaceStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [textInput, setTextInput] = useState(false)
  const [textName, setTextName] = useState('')
  const [textContent, setTextContent] = useState('')

  const selectedCount = sources.filter((s) => s.selected).length

  const handleFile = async (file: File) => {
    const text = await file.text()
    addSource({ name: file.name, content: text, type: 'pdf' })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleTextAdd = () => {
    if (!textName.trim() || !textContent.trim()) return
    addSource({ name: textName.trim(), content: textContent.trim(), type: 'text' })
    setTextName(''); setTextContent(''); setTextInput(false)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--q-surface-bg)] border-r border-[var(--q-twilight-200)]">
      {/* Header */}
      <div className={`flex items-center justify-between px-[var(--q-space-16)] pt-[var(--q-space-16)] pb-[var(--q-space-12)] ${sources.length > 0 ? 'border-b border-[var(--q-border-primary)]' : ''}`}>
        <div className="flex items-baseline gap-[var(--q-space-8)]">
          <span className="q-sh3 text-[var(--q-text-primary)]">Sources</span>
          {sources.length > 0 && (
            <span className="q-b5 text-[var(--q-text-muted)]">
              {selectedCount} of {sources.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-[var(--q-space-4)]">
          <Button variant="text-secondary" size="medium" circle onClick={() => setTextInput((v) => !v)} title="Add text source">
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add_2</span>
          </Button>
          <Button variant="text-secondary" size="medium" circle onClick={() => fileRef.current?.click()} title="Upload file">
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>search</span>
          </Button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".txt,.pdf,.md" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

      {/* Text source input */}
      {textInput && (
        <div className="px-[var(--q-space-12)] py-[var(--q-space-12)] border-b border-[var(--q-border-primary)] space-y-[var(--q-space-8)] bg-[var(--q-surface-bg)]">
          <input
            value={textName}
            onChange={(e) => setTextName(e.target.value)}
            placeholder="Source name"
            className="w-full q-b5 px-[var(--q-space-12)] py-[var(--q-space-8)] border border-[var(--q-border-primary)] rounded-[var(--q-radius-md)] focus:outline-none focus:ring-1 focus:ring-[var(--q-twilight-300)] bg-white text-[var(--q-text-primary)]"
          />
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste source text here..."
            rows={4}
            className="w-full q-b5 px-[var(--q-space-12)] py-[var(--q-space-8)] border border-[var(--q-border-primary)] rounded-[var(--q-radius-md)] focus:outline-none focus:ring-1 focus:ring-[var(--q-twilight-300)] resize-none bg-white text-[var(--q-text-primary)]"
          />
          <div className="flex gap-[var(--q-space-8)]">
            <button
              onClick={handleTextAdd}
              disabled={!textName.trim() || !textContent.trim()}
              className="flex-1 q-sh5 py-[var(--q-space-6)] rounded-[var(--q-radius-md)] bg-[var(--q-twilight-500)] text-white disabled:opacity-40 hover:bg-[var(--q-twilight-600)] transition-colors"
            >
              Add source
            </button>
            <button
              onClick={() => setTextInput(false)}
              className="q-b5 text-[var(--q-text-muted)] px-[var(--q-space-8)] hover:text-[var(--q-text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Source list */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {sources.length === 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              'm-[var(--q-space-12)] flex flex-col items-center justify-center gap-[var(--q-space-12)]',
              'rounded-[var(--q-radius-lg)] border-2 border-dashed transition-colors cursor-pointer flex-1',
              dragging
                ? 'border-[var(--q-twilight-500)] bg-[var(--q-twilight-100)]'
                : 'border-[var(--q-border-primary)] hover:border-[var(--q-twilight-300)] hover:bg-[var(--q-twilight-100)]/50',
            ].join(' ')}
            onClick={() => fileRef.current?.click()}
          >
            <img src="/documents.png" alt="Documents" style={{ width: 108, height: 48 }} className="object-contain" />
            <div className="text-center space-y-[var(--q-space-4)]">
              <p className="q-sh3 text-[var(--q-text-muted)]">Drag and drop documents here</p>
            </div>
            <Button
              size="large"
              variant="primary"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
            >
              Upload a file
            </Button>
          </div>
        ) : (
          <div className="py-[var(--q-space-4)]">
            {sources.map((src) => (
              <SourceItem key={src.id} source={src} onToggle={() => toggleSource(src.id)} onRemove={() => removeSource(src.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Clear all */}
      {selectedCount > 0 && (
        <div className="px-[var(--q-space-16)] py-[var(--q-space-8)] border-t border-[var(--q-border-primary)]">
          <button
            onClick={() => sources.forEach((s) => s.selected && toggleSource(s.id))}
            className="q-b5 text-[var(--q-text-muted)] hover:text-[var(--q-cherry-500)] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function SourceItem({ source, onToggle, onRemove }: { source: Source; onToggle: () => void; onRemove: () => void }) {
  return (
    <div
      className={[
        'flex items-center gap-[var(--q-space-12)] px-[var(--q-space-12)] py-[var(--q-space-10)]',
        'cursor-pointer group hover:bg-[var(--q-surface-bg)] transition-colors',
        source.selected ? 'bg-[var(--q-twilight-100)]/40' : '',
      ].join(' ')}
      onClick={onToggle}
    >
      <span className="q-b4 text-[var(--q-text-muted)] flex-shrink-0">
        {source.type === 'pdf' ? '📄' : '📝'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="q-sh5 text-[var(--q-text-primary)] truncate">{source.name}</p>
        <p className="q-b5 text-[var(--q-text-muted)]">{source.type.toUpperCase()}</p>
      </div>
      {source.selected ? (
        <span className="w-5 h-5 rounded-full bg-[var(--q-twilight-500)] flex items-center justify-center flex-shrink-0">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      ) : (
        <span className="w-5 h-5 rounded-full border-2 border-[var(--q-border-primary)] flex-shrink-0 group-hover:border-[var(--q-twilight-300)] transition-colors" />
      )}
    </div>
  )
}

