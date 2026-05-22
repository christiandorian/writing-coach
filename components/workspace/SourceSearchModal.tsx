'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { QuizletSet } from '@/app/api/quizlet-search/route'
import type { FlashcardTerm } from '@/app/api/quizlet-set/route'

// Module-level cache so popular sets are shared across renders
let popularSetsCache: QuizletSet[] | null = null
let prefetchPromise: Promise<void> | null = null

export function prefetchPopularSets() {
  if (popularSetsCache || prefetchPromise) return
  prefetchPromise = fetch('/api/quizlet-search?q=')
    .then(r => r.json())
    .then((data: QuizletSet[]) => { popularSetsCache = data })
    .catch(() => {})
    .finally(() => { prefetchPromise = null })
}

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (set: QuizletSet, terms: FlashcardTerm[]) => string
  onUpdateContent?: (id: string, content: string) => void
}

export default function SourceSearchModal({ open, onClose, onAdd, onUpdateContent }: Props) {
  const pendingUpdateRef = useRef<{ sourceId: string } | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuizletSet[]>([])
  const [loading, setLoading] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [selectedSet, setSelectedSet] = useState<QuizletSet | null>(null)
  const [terms, setTerms] = useState<FlashcardTerm[]>([])
  const [termsLoading, setTermsLoading] = useState(false)
  const [loadingMoreTerms, setLoadingMoreTerms] = useState(false)
  const [termSearch, setTermSearch] = useState('')
  const [termSearchOpen, setTermSearchOpen] = useState(false)
  const termSearchRef = useRef<HTMLInputElement>(null)
  const [termSort, setTermSort] = useState<'original' | 'alphabetical'>('original')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    // Use cache for empty query (popular sets)
    if (!q.trim() && popularSetsCache) {
      setResults(popularSetsCache)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/quizlet-search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as QuizletSet[]
      if (!q.trim()) popularSetsCache = data  // cache popular results
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Load popular sets when modal opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setAddedIds(new Set())
      setSelectedSet(null)
      setTerms([])
      fetchResults('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, fetchResults])

  const openSet = async (set: QuizletSet) => {
    setSelectedSet(set)
    setTermSearch('')
    setTermSearchOpen(false)
    setTermSort('original')
    setSortMenuOpen(false)
    setTerms([])
    setTermsLoading(true)
    setLoadingMoreTerms(false)

    const totalCount = Math.min(set.termCount, 40)
    const firstBatch = Math.min(8, totalCount)
    const remaining = totalCount - firstBatch

    try {
      const titleParam = encodeURIComponent(set.title)

      // Kick off both fetches in parallel
      const firstPromise = fetch(`/api/quizlet-set?title=${titleParam}&count=${firstBatch}`).then(r => r.json() as Promise<FlashcardTerm[]>)
      const morePromise = remaining > 0
        ? fetch(`/api/quizlet-set?title=${titleParam}&count=${remaining}&offset=${firstBatch}`).then(r => r.json() as Promise<FlashcardTerm[]>)
        : Promise.resolve([] as FlashcardTerm[])

      if (remaining > 0) setLoadingMoreTerms(true)

      // Show first batch as soon as it's ready
      const first = await firstPromise
      setTerms(first)
      setTermsLoading(false)

      // Append second batch when it arrives
      const more = await morePromise
      if (more.length > 0) {
        setTerms(prev => [...prev, ...more])
        // If the user already added the source, update its content with all terms
        if (pendingUpdateRef.current && onUpdateContent) {
          const allTerms = [...first, ...more]
          const allContent = allTerms.map(t => `${t.term}: ${t.definition}`).join('\n')
          onUpdateContent(pendingUpdateRef.current.sourceId, allContent)
          pendingUpdateRef.current = null
        }
      }
      setLoadingMoreTerms(false)
    } catch {
      setTerms([])
      setTermsLoading(false)
      setLoadingMoreTerms(false)
    }
  }

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchResults(query)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchResults])

  const handleAdd = (set: QuizletSet, termsToAdd?: FlashcardTerm[]) => {
    const sourceId = onAdd(set, termsToAdd ?? terms)
    setAddedIds(prev => new Set(Array.from(prev).concat(set.id)))
    return sourceId
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-[rgba(1,1,16,0.45)]" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative bg-[var(--q-surface-base)] rounded-[var(--q-radius-xxl,32px)] w-[600px] max-h-[80vh] flex flex-col overflow-hidden"
            style={{ boxShadow: '0 4px 32px 0 rgba(40,46,62,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search content — scales back when set view is open */}
            <motion.div
              animate={{ scale: selectedSet ? 0.97 : 1, opacity: selectedSet ? 0 : 1 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col flex-1 overflow-hidden"
            >
            {/* Search input */}
            <div className="px-[var(--q-space-24)] pt-[var(--q-space-24)] pb-[var(--q-space-20)] flex-shrink-0">
              <div className={[
                'flex items-center gap-[var(--q-space-12)] bg-[var(--q-surface-bg)] rounded-[var(--q-radius-full)] px-[var(--q-space-16)] py-[var(--q-space-12)] transition-all',
                query ? 'ring-2 ring-[var(--q-twilight-300)]' : '',
              ].join(' ')}>
                <span className="material-symbols-rounded text-[var(--q-text-secondary)] flex-shrink-0" style={{ fontSize: 20 }}>search</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search Quizlet for sources"
                  className="flex-1 bg-transparent q-sh4 text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)] focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="flex-shrink-0 flex items-center text-[var(--q-text-secondary)] hover:text-[var(--q-text-primary)] transition-colors">
                    <span className="material-symbols-rounded" style={{ fontSize: 22 }}>cancel</span>
                  </button>
                )}
              </div>
            </div>

            {/* Section label */}
            <div className="px-[var(--q-space-24)] pb-[var(--q-space-20)] flex items-center gap-[var(--q-space-8)] flex-shrink-0">
              <span className="material-symbols-rounded text-[var(--q-text-secondary)]" style={{ fontSize: 16 }}>trending_up</span>
              <p className="q-sh5 text-[var(--q-text-secondary)]">
                {query ? `Results for "${query}"` : 'Popular on Quizlet'}
              </p>
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto px-[var(--q-space-16)] pb-[var(--q-space-24)]">
              {loading ? (
                <div className="flex flex-col gap-[var(--q-space-4)]">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-[var(--q-space-12)] p-[var(--q-space-8)] rounded-[var(--q-radius-12)]">
                      <div className="w-10 h-10 rounded-[8px] bg-[var(--q-surface-bg)] flex-shrink-0 animate-pulse" />
                      <div className="flex-1 space-y-[var(--q-space-4)]">
                        <div className="h-4 bg-[var(--q-surface-bg)] rounded animate-pulse w-full" />
                        <div className="h-4 bg-[var(--q-surface-bg)] rounded animate-pulse w-[80%]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.length === 0 ? (
                <p className="q-b4 text-[var(--q-text-muted)] text-center py-[var(--q-space-24)]">No results found</p>
              ) : (
                <div className="flex flex-col gap-[var(--q-space-4)]">
                  {results.map(set => {
                    const added = addedIds.has(set.id)
                    return (
                      <div
                        key={set.id}
                        className="flex items-center gap-[var(--q-space-8)] p-[var(--q-space-8)] rounded-[var(--q-radius-12)] hover:bg-[var(--q-surface-bg)] transition-colors group cursor-pointer"
                        onClick={() => openSet(set)}
                      >
                        {/* Flashcard set thumbnail */}
                        <div className="w-10 h-10 rounded-[8px] flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#eaf9ff' }}>
                          <img src="/set.png" alt="" className="w-6 h-6 object-contain" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="q-sh4 text-[var(--q-text-primary)] truncate">{set.title}</p>
                          <p className="q-sh5 text-[var(--q-text-secondary)]">{set.termCount} terms · by {set.author}</p>
                        </div>

                        {/* Chevron */}
                        <button
                          onClick={e => { e.stopPropagation(); openSet(set) }}
                          className="w-10 h-10 rounded-[var(--q-radius-full)] flex items-center justify-center flex-shrink-0 transition-all text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)] hover:text-[var(--q-gray-700)]"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 24 }}>chevron_right</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Set view — slides in from the right */}
          <AnimatePresence>
            {selectedSet && (
              <motion.div
                initial={{ x: '6%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '6%', opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 bg-[var(--q-surface-base)]"
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Header */}
                <div className="px-[var(--q-space-24)] pt-[var(--q-space-24)] pb-[var(--q-space-16)] flex-shrink-0">
                  {/* Icon row */}
                  <div className="flex items-center gap-[var(--q-space-12)] mb-[var(--q-space-16)]">
                    <button
                      onClick={() => setSelectedSet(null)}
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--q-btn-tertiary-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)] transition-colors"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_back</span>
                    </button>

                    {/* Term search inline in the header row */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      {termSearchOpen ? (
                        <motion.div key="search-pill" initial={{ opacity: 0, scaleX: 0.92 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.92 }} transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }} style={{ originX: 0 }}
                          className="flex-1 h-10 flex items-center gap-[var(--q-space-8)] bg-[var(--q-surface-bg)] rounded-[var(--q-radius-full)] px-[var(--q-space-16)]">
                          <span className="material-symbols-rounded text-[var(--q-text-secondary)] flex-shrink-0" style={{ fontSize: 18 }}>search</span>
                          <input
                            ref={termSearchRef}
                            value={termSearch}
                            onChange={e => setTermSearch(e.target.value)}
                            placeholder="Find a term..."
                            autoFocus
                            onBlur={() => setTimeout(() => { setTermSearchOpen(false); setTermSearch('') }, 150)}
                            className="flex-1 bg-transparent q-sh3 text-[var(--q-text-primary)] focus:outline-none placeholder-[var(--q-text-muted)]"
                          />
                          {termSearch && (
                            <button onClick={() => setTermSearch('')} className="flex-shrink-0 flex items-center text-[var(--q-text-secondary)] hover:text-[var(--q-text-primary)] transition-colors">
                              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>cancel</span>
                            </button>
                          )}
                        </motion.div>
                      ) : (
                        <div key="spacer" className="flex-1" />
                      )}
                    </AnimatePresence>

                    {/* Right buttons — search + filter always present */}
                    <div className="flex items-center gap-[var(--q-space-8)] flex-shrink-0">
                      {!termSearchOpen && (
                        <button
                          onClick={() => { setTermSearchOpen(true); setTimeout(() => termSearchRef.current?.focus(), 50) }}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-[var(--q-btn-tertiary-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)]"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>search</span>
                        </button>
                      )}
                      <div className="relative">
                        {sortMenuOpen && <div className="fixed inset-0 z-[5]" onClick={() => setSortMenuOpen(false)} />}
                        <button
                          onClick={() => setSortMenuOpen(v => !v)}
                          className={['w-10 h-10 rounded-full flex items-center justify-center transition-colors', sortMenuOpen || termSort === 'alphabetical' ? 'bg-[var(--q-twilight-100)] text-[var(--q-twilight-600)]' : 'bg-[var(--q-btn-tertiary-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)]'].join(' ')}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>filter_list</span>
                        </button>
                        {sortMenuOpen && (
                          <div className="absolute top-full mt-[var(--q-space-4)] right-0 z-10 bg-[var(--q-surface-base)] py-[var(--q-space-4)] min-w-[180px]"
                            style={{ borderRadius: 'var(--q-radius-lg)', border: '1px solid var(--q-border-primary)', boxShadow: 'var(--q-shadow-md)', zIndex: 20001 }}>
                            {([['original', 'Original order'], ['alphabetical', 'Alphabetical']] as const).map(([val, label]) => (
                              <button key={val} onClick={() => { setTermSort(val); setSortMenuOpen(false) }}
                                className="w-full flex items-center justify-between px-[var(--q-space-16)] py-[var(--q-space-10)] q-sh4 hover:bg-[var(--q-surface-bg)] transition-colors">
                                <span style={{ color: termSort === val ? 'var(--q-text-highlight)' : 'var(--q-text-primary)' }}>{label}</span>
                                {termSort === val && <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--q-text-highlight)' }}>check_circle</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title row — always visible */}
                  <p className="q-h3 text-[var(--q-text-primary)] leading-tight">{selectedSet.title}</p>
                  <p className="q-sh5 text-[var(--q-text-secondary)] mt-[var(--q-space-4)]">
                    {selectedSet.termCount} terms · by {selectedSet.author}
                  </p>
                </div>

                {/* Terms list */}
                <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }} className="scrollbar-hide px-[var(--q-space-24)] pb-[var(--q-space-24)] flex flex-col gap-[var(--q-space-8)]">
                  {(() => {
                    let filtered = termSearch.trim()
                      ? terms.filter(t =>
                          t.term.toLowerCase().includes(termSearch.toLowerCase()) ||
                          t.definition.toLowerCase().includes(termSearch.toLowerCase())
                        )
                      : [...terms]
                    if (termSort === 'alphabetical') {
                      filtered = [...filtered].sort((a, b) => a.term.localeCompare(b.term))
                    }
                    if (termsLoading) return [...Array(4)].map((_, i) => (
                      <div key={i} className="grid grid-cols-2 gap-[2px]">
                        <div className="bg-[var(--q-surface-bg)] px-4 py-5 rounded-l-[16px] flex flex-col gap-3">
                          <div className="h-3.5 bg-[#DFE2EA] rounded-full animate-pulse w-full" />
                          <div className="h-3.5 bg-[#DFE2EA] rounded-full animate-pulse w-[65%]" />
                        </div>
                        <div className="bg-[var(--q-surface-bg)] px-4 py-5 rounded-r-[16px] flex flex-col gap-2">
                          <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-full" />
                          <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-[88%]" />
                          <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-[70%]" />
                          <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-[55%]" />
                        </div>
                      </div>
                    ))
                    if (filtered.length === 0) return (
                      <p className="q-b4 text-[var(--q-text-muted)] text-center py-[var(--q-space-16)]">No matching terms</p>
                    )
                    return filtered.map((t, i) => (
                      <div key={i} className="grid grid-cols-2 gap-[2px]">
                        <div className="bg-[var(--q-surface-bg)] px-4 py-4 rounded-l-[16px]">
                          <p className="q-sh3 text-[var(--q-text-primary)]">{t.term}</p>
                        </div>
                        <div className="bg-[var(--q-surface-bg)] px-4 py-4 rounded-r-[16px]">
                          <p className="q-b4 text-[var(--q-text-secondary)] leading-relaxed">{t.definition}</p>
                        </div>
                      </div>
                    ))
                  })()}

                  {/* Shimmer for lazy-loading more terms */}
                  {loadingMoreTerms && !termSearch && [...Array(3)].map((_, i) => (
                    <div key={`more-${i}`} className="grid grid-cols-2 gap-[2px]">
                      <div className="bg-[var(--q-surface-bg)] px-4 py-5 rounded-l-[16px] flex flex-col gap-3">
                        <div className="h-3.5 bg-[#DFE2EA] rounded-full animate-pulse w-full" />
                        <div className="h-3.5 bg-[#DFE2EA] rounded-full animate-pulse w-[65%]" />
                      </div>
                      <div className="bg-[var(--q-surface-bg)] px-4 py-5 rounded-r-[16px] flex flex-col gap-2">
                        <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-full" />
                        <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-[80%]" />
                        <div className="h-3 bg-[#DFE2EA] rounded-full animate-pulse w-[60%]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom bar */}
                <div className="flex-shrink-0 relative px-[var(--q-space-24)] py-[var(--q-space-24)] flex items-center justify-center">
                  <div className="absolute -top-8 left-0 right-0 h-8 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, var(--q-surface-base))' }} />
                  <button
                    onClick={() => {
                      const sourceId = handleAdd(selectedSet)
                      // If second batch still loading, register for update when it arrives
                      if (loadingMoreTerms && sourceId && onUpdateContent) {
                        pendingUpdateRef.current = { sourceId }
                      }
                      setSelectedSet(null)
                      onClose()
                    }}
                    disabled={termsLoading}
                    className="flex items-center justify-center gap-[var(--q-space-8)] bg-[var(--q-btn-primary-bg)] hover:bg-[var(--q-btn-primary-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-[var(--q-space-24)] q-sh3 transition-colors"
                    style={{ borderRadius: 'var(--q-radius-full)', paddingTop: 14, paddingBottom: 14 }}
                  >
                    {termsLoading ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
                    )}
                    Add source
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
