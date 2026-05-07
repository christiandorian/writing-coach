'use client'

import { useState } from 'react'
import { useWorkspaceStore } from '@/lib/store/workspace'
import type { PromptCategory, TimeLimitOption } from '@/lib/types'
import { formatDate, scoreColorClass } from '@/lib/utils'

const ACTIVITIES = [
  { id: 'writing_coach', label: 'Writing coach', icon: '✍️', available: true },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏', available: false },
  { id: 'learn', label: 'Learn', icon: '🧠', available: false },
  { id: 'test', label: 'Test', icon: '📋', available: false },
  { id: 'summarize', label: 'Summarize', icon: '📝', available: false },
  { id: 'podcast', label: 'Podcast', icon: '🎙️', available: false },
]

const CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'policy', label: 'Policy' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'case_study', label: 'Case Study' },
]

const TIME_OPTIONS: { value: TimeLimitOption; label: string }[] = [
  { value: 10, label: '10m' },
  { value: 15, label: '15m' },
  { value: 20, label: '20m' },
  { value: 30, label: '30m' },
]

export default function RightRail() {
  const { rightTab, setRightTab, sources, startActivity, pastSessions, step, chatMessages, addChatMessage } = useWorkspaceStore()

  return (
    <div className="flex flex-col h-full bg-white border-l border-[var(--border)]">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] px-3 pt-2">
        {(['study', 'chat'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setRightTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize rounded-t transition-colors ${
              rightTab === tab
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {rightTab === 'study' ? (
          <StudyTab sources={sources} pastSessions={pastSessions} startActivity={startActivity} step={step} />
        ) : (
          <ChatTab messages={chatMessages} addMessage={addChatMessage} sources={sources} />
        )}
      </div>
    </div>
  )
}

function StudyTab({ sources, pastSessions, startActivity, step }: any) {
  const [category, setCategory] = useState<PromptCategory>('general')
  const [timeLimit, setTimeLimit] = useState<TimeLimitOption>(20)
  const [generating, setGenerating] = useState(false)
  const [activeActivity, setActiveActivity] = useState<string | null>(null)

  const selectedSources = sources.filter((s: any) => s.selected)

  const handleLaunch = async () => {
    setGenerating(true)
    try {
      const sourceText = selectedSources.map((s: any) => s.content).join('\n\n')
      const res = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, sourceText: sourceText || undefined }),
      })
      const { prompt } = await res.json()
      startActivity(prompt, category, timeLimit)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-3 space-y-5">
      {/* Activity grid */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">
          Activities
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              disabled={!a.available}
              onClick={() => a.available && setActiveActivity(activeActivity === a.id ? null : a.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius)] border transition-all ${
                !a.available
                  ? 'border-[var(--border)] opacity-40 cursor-not-allowed'
                  : activeActivity === a.id
                  ? 'border-[var(--accent)] bg-[var(--accent-light)] shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]/50 cursor-pointer'
              }`}
            >
              <span className="text-xl">{a.icon}</span>
              <span className={`text-[10px] font-semibold text-center leading-tight ${
                activeActivity === a.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
              }`}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Writing coach config — shown when selected */}
      {activeActivity === 'writing_coach' && (
        <div className="bg-[var(--bg)] rounded-[var(--radius)] p-3 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Topic</p>
            <div className="grid grid-cols-1 gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`text-left px-3 py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${
                    category === c.value
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Time</p>
            <div className="grid grid-cols-4 gap-1">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeLimit(t.value)}
                  className={`py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${
                    timeLimit === t.value
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-white border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {selectedSources.length > 0 && (
            <p className="text-[10px] text-[var(--accent)] bg-[var(--accent-light)] px-2 py-1.5 rounded font-medium">
              ✓ Using {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} to generate prompt
            </p>
          )}

          <button
            onClick={handleLaunch}
            disabled={generating}
            className="w-full py-2.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : 'Start session →'}
          </button>
        </div>
      )}

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">
            Your sessions
          </p>
          <div className="space-y-1">
            {pastSessions.map((s: any) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg)] transition-colors group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] font-medium truncate">{s.promptSnippet}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatDate(s.createdAt)}</p>
                </div>
                {s.score != null && (
                  <span className={`text-xs font-bold tabular-nums flex-shrink-0 ${scoreColorClass(Math.round(s.score))}`}>
                    {Number(s.score).toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChatTab({ messages, addMessage, sources }: any) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: input.trim(), createdAt: new Date().toISOString() }
    addMessage(userMsg)
    setInput('')
    setLoading(true)

    try {
      const sourceText = sources.filter((s: any) => s.selected).map((s: any) => s.content).join('\n\n')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), sourceText: sourceText || undefined }),
      })
      const { reply } = await res.json()
      addMessage({ id: crypto.randomUUID(), role: 'assistant' as const, content: reply, createdAt: new Date().toISOString() })
    } catch {
      addMessage({ id: crypto.randomUUID(), role: 'assistant' as const, content: 'Something went wrong. Please try again.', createdAt: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <span className="text-3xl">💬</span>
            <p className="text-xs text-[var(--text-muted)]">Ask anything about your sources or writing</p>
          </div>
        ) : (
          messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-[var(--radius)] px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--accent)] text-white rounded-br-sm'
                  : 'bg-[var(--bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
              }`}>
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ask about your sources..."
            className="flex-1 text-xs px-3 py-2.5 border border-[var(--border)] rounded-[var(--radius-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
