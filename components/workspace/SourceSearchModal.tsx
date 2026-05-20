'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { QuizletSet } from '@/app/api/quizlet-search/route'
import type { FlashcardTerm } from '@/app/api/quizlet-set/route'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (set: QuizletSet, terms: FlashcardTerm[]) => void
}

export default function SourceSearchModal({ open, onClose, onAdd }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuizletSet[]>([])
  const [loading, setLoading] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [selectedSet, setSelectedSet] = useState<QuizletSet | null>(null)
  const [terms, setTerms] = useState<FlashcardTerm[]>([])
  const [termsLoading, setTermsLoading] = useState(false)
  const [termSearch, setTermSearch] = useState('')
  const [termSearchOpen, setTermSearchOpen] = useState(false)
  const termSearchRef = useRef<HTMLInputElement>(null)
  const [termSort, setTermSort] = useState<'original' | 'alphabetical'>('original')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quizlet-search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as QuizletSet[]
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
    setTermsLoading(true)
    try {
      const res = await fetch(`/api/quizlet-set?title=${encodeURIComponent(set.title)}&count=12`)
      const data = await res.json() as FlashcardTerm[]
      setTerms(data)
    } catch {
      setTerms([])
    } finally {
      setTermsLoading(false)
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
    onAdd(set, termsToAdd ?? terms)
    setAddedIds(prev => new Set(Array.from(prev).concat(set.id)))
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
              animate={{ scale: selectedSet ? 0.96 : 1, opacity: selectedSet ? 0.4 : 1 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col flex-1 overflow-hidden"
            >
            {/* Search input */}
            <div className="px-[var(--q-space-24)] pt-[var(--q-space-24)] pb-[var(--q-space-20)] flex-shrink-0">
              <div className={[
                'flex items-center gap-[var(--q-space-12)] bg-[var(--q-surface-bg)] rounded-[var(--q-radius-full)] px-[var(--q-space-16)] py-[var(--q-space-12)] transition-all',
                query ? 'ring-2 ring-[var(--q-twilight-300)]' : '',
              ].join(' ')}>
                <span className="material-symbols-rounded text-[var(--q-text-muted)] flex-shrink-0" style={{ fontSize: 20 }}>search</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search Quizlet for sources"
                  className="flex-1 bg-transparent q-sh4 text-[var(--q-text-primary)] placeholder-[var(--q-text-muted)] focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="flex-shrink-0 text-[var(--q-text-muted)] hover:text-[var(--q-text-secondary)] transition-colors">
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
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 bg-[var(--q-surface-base)]"
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Header */}
                <div className="flex items-center gap-[var(--q-space-16)] px-[var(--q-space-24)] pt-[var(--q-space-24)] pb-[var(--q-space-16)] flex-shrink-0">
                  <button
                    onClick={() => setSelectedSet(null)}
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--q-btn-tertiary-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)] transition-colors"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>arrow_back</span>
                  </button>
                  {termSearchOpen ? (
                    <input
                      ref={termSearchRef}
                      value={termSearch}
                      onChange={e => setTermSearch(e.target.value)}
                      placeholder="Search terms..."
                      autoFocus
                      className="flex-1 min-w-0 bg-transparent q-h5 text-[var(--q-text-primary)] focus:outline-none placeholder-[var(--q-text-muted)]"
                    />
                  ) : (
                    <p className="q-h5 text-[var(--q-text-primary)] flex-1 min-w-0 truncate">{selectedSet.title}</p>
                  )}
                  <div className="flex items-center gap-[var(--q-space-4)] flex-shrink-0">
                    <button
                      onClick={() => {
                        if (termSearchOpen) { setTermSearchOpen(false); setTermSearch('') }
                        else { setTermSearchOpen(true); setTimeout(() => termSearchRef.current?.focus(), 50) }
                      }}
                      className={['w-10 h-10 rounded-full flex items-center justify-center transition-colors', termSearchOpen ? 'bg-[var(--q-twilight-100)] text-[var(--q-twilight-600)]' : 'bg-[var(--q-btn-tertiary-bg)] text-[var(--q-text-secondary)] hover:bg-[var(--q-gray-300)]'].join(' ')}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{termSearchOpen ? 'close' : 'search'}</span>
                    </button>
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
                </div>

                {/* Bottom bar */}
                <div className="flex-shrink-0 relative px-[var(--q-space-24)] py-[var(--q-space-24)] flex items-center justify-center">
                  <div className="absolute -top-8 left-0 right-0 h-8 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, var(--q-surface-base))' }} />
                  <button
                    onClick={() => { handleAdd(selectedSet); setSelectedSet(null); onClose() }}
                    className="flex items-center justify-center gap-[var(--q-space-8)] bg-[var(--q-btn-primary-bg)] hover:bg-[var(--q-btn-primary-bg-hover)] text-white px-[var(--q-space-24)] q-sh3 transition-colors"
                    style={{ borderRadius: 'var(--q-radius-full)', paddingTop: 14, paddingBottom: 14 }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>add</span>
                    Add as source
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
