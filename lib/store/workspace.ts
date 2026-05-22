import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FeedbackResponse, PromptCategory, TimeLimitOption } from '@/lib/types'

export type WorkspaceStep =
  | 'idle'        // nothing selected / welcome state
  | 'setup'       // prompt shown, awaiting position
  | 'writing'     // timed writing in progress
  | 'submitting'  // awaiting AI feedback
  | 'feedback'    // feedback returned

export type RightTab = 'study' | 'chat'

export interface Source {
  id: string
  name: string
  content: string     // extracted text for AI prompt generation
  dataUrl?: string    // object URL for preview (rebuilt from fileData on load)
  fileData?: string   // base64 for binary files — persisted to DB
  type: 'text' | 'pdf' | 'quizlet'
  selected: boolean
  tags?: string[]     // AI-generated concept tags (in-memory, not persisted)
}

interface WorkspaceState {
  // Rails
  rightTab: RightTab
  sources: Source[]

  // Session
  step: WorkspaceStep
  prompt: string
  category: PromptCategory
  position: string
  responseText: string
  timeLimitSeconds: number
  startTime: number
  sessionId: string | null
  feedbackV1: FeedbackResponse | null
  rewriteVersions: { text: string; feedback: FeedbackResponse }[]
  pendingText: string
  rewriteStartTime: number
  pastSessions: PastSession[]

  // Chat
  chatMessages: ChatMessage[]

  // Actions
  setRightTab: (tab: RightTab) => void
  addSource: (source: Omit<Source, 'id' | 'selected'>) => string
  toggleSource: (id: string) => void
  removeSource: (id: string) => void
  setSourceTags: (id: string, tags: string[]) => void
  updateSourceContent: (id: string, content: string) => void
  startActivity: (prompt: string, category: PromptCategory, timeLimitMinutes: TimeLimitOption) => void
  lockPosition: (position: string) => void
  setResponse: (text: string) => void
  setStep: (step: WorkspaceStep) => void
  setSessionId: (id: string) => void
  setFeedbackV1: (f: FeedbackResponse) => void
  setPendingText: (text: string) => void
  submitRewriteVersion: (text: string, feedback: FeedbackResponse) => void
  startRewrite: () => void
  addPastSession: (session: PastSession) => void
  setPastSessions: (sessions: PastSession[]) => void
  addChatMessage: (msg: ChatMessage) => void
  resetSession: () => void
}

export interface PastSession {
  id: string
  promptSnippet: string
  score: number | null
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const sessionDefaults = {
  step: 'idle' as WorkspaceStep,
  prompt: '',
  category: 'general' as PromptCategory,
  position: '',
  responseText: '',
  timeLimitSeconds: 20 * 60,
  startTime: 0,
  sessionId: null,
  feedbackV1: null,
  rewriteVersions: [] as { text: string; feedback: FeedbackResponse }[],
  pendingText: '',
  rewriteStartTime: 0,
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
  rightTab: 'study',
  sources: [],
  pastSessions: [],
  chatMessages: [],
  ...sessionDefaults,

  setRightTab: (tab) => set({ rightTab: tab }),

  addSource: (source) => {
    const id = crypto.randomUUID()
    set((s) => ({
      sources: [
        ...s.sources,
        { ...source, id, selected: true },
      ],
    }))
    return id
  },

  toggleSource: (id) =>
    set((s) => ({
      sources: s.sources.map((src) =>
        src.id === id ? { ...src, selected: !src.selected } : src
      ),
    })),

  removeSource: (id) =>
    set((s) => ({ sources: s.sources.filter((src) => src.id !== id) })),

  setSourceTags: (id, tags) =>
    set((s) => ({
      sources: s.sources.map((src) => src.id === id ? { ...src, tags } : src),
    })),

  updateSourceContent: (id, content) =>
    set((s) => ({
      sources: s.sources.map((src) => src.id === id ? { ...src, content } : src),
    })),

  startActivity: (prompt, category, timeLimitMinutes) =>
    set({
      prompt,
      category,
      timeLimitSeconds: timeLimitMinutes * 60,
      step: 'writing',
      position: '',
      responseText: '',
      feedbackV1: null,
      rewriteVersions: [],
      pendingText: '',
      sessionId: null,
      startTime: Date.now(),
    }),

  lockPosition: (position) =>
    set({ position, step: 'writing', startTime: Date.now() }),

  setResponse: (text) => set({ responseText: text }),
  setStep: (step) => set({ step }),
  setSessionId: (id) => set({ sessionId: id }),
  setFeedbackV1: (f) => set({ feedbackV1: f }),
  setPendingText: (text) => set({ pendingText: text }),
  submitRewriteVersion: (text, feedback) =>
    set((s) => ({ rewriteVersions: [...s.rewriteVersions, { text, feedback }], pendingText: '' })),
  startRewrite: () => set({ rewriteStartTime: Date.now(), pendingText: '' }),

  addPastSession: (session) =>
    set((s) => ({ pastSessions: [session, ...s.pastSessions] })),

  setPastSessions: (sessions) => set({ pastSessions: sessions }),

  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  resetSession: () => set(sessionDefaults),
    }),
    {
      name: 'writing-coach-workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rightTab: state.rightTab,
        // Strip dataUrl (invalid after refresh) and tags (in-memory only)
        sources: state.sources.map(({ dataUrl: _d, tags: _t, ...rest }) => rest),
        pastSessions: state.pastSessions,
        chatMessages: state.chatMessages,
        // If the user refreshes mid-submit, drop back to writing so they can re-submit
        step: state.step === 'submitting' ? 'writing' : state.step,
        prompt: state.prompt,
        category: state.category,
        position: state.position,
        responseText: state.responseText,
        timeLimitSeconds: state.timeLimitSeconds,
        startTime: state.startTime,
        sessionId: state.sessionId,
        feedbackV1: state.feedbackV1,
        rewriteVersions: state.rewriteVersions,
        pendingText: state.pendingText,
        rewriteStartTime: state.rewriteStartTime,
      }),
    }
  )
)
