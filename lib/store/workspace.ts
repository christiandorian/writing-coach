import { create } from 'zustand'
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
  content: string   // extracted text, used for prompt generation
  type: 'text' | 'pdf'
  selected: boolean
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
  feedbackV2: FeedbackResponse | null
  rewriteText: string
  rewriteStartTime: number
  pastSessions: PastSession[]

  // Chat
  chatMessages: ChatMessage[]

  // Actions
  setRightTab: (tab: RightTab) => void
  addSource: (source: Omit<Source, 'id' | 'selected'>) => void
  toggleSource: (id: string) => void
  removeSource: (id: string) => void
  startActivity: (prompt: string, category: PromptCategory, timeLimitMinutes: TimeLimitOption) => void
  lockPosition: (position: string) => void
  setResponse: (text: string) => void
  setStep: (step: WorkspaceStep) => void
  setSessionId: (id: string) => void
  setFeedbackV1: (f: FeedbackResponse) => void
  setFeedbackV2: (f: FeedbackResponse) => void
  setRewriteText: (text: string) => void
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
  feedbackV2: null,
  rewriteText: '',
  rewriteStartTime: 0,
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rightTab: 'study',
  sources: [],
  pastSessions: [],
  chatMessages: [],
  ...sessionDefaults,

  setRightTab: (tab) => set({ rightTab: tab }),

  addSource: (source) =>
    set((s) => ({
      sources: [
        ...s.sources,
        { ...source, id: crypto.randomUUID(), selected: true },
      ],
    })),

  toggleSource: (id) =>
    set((s) => ({
      sources: s.sources.map((src) =>
        src.id === id ? { ...src, selected: !src.selected } : src
      ),
    })),

  removeSource: (id) =>
    set((s) => ({ sources: s.sources.filter((src) => src.id !== id) })),

  startActivity: (prompt, category, timeLimitMinutes) =>
    set({
      prompt,
      category,
      timeLimitSeconds: timeLimitMinutes * 60,
      step: 'setup',
      position: '',
      responseText: '',
      feedbackV1: null,
      feedbackV2: null,
      rewriteText: '',
      sessionId: null,
    }),

  lockPosition: (position) =>
    set({ position, step: 'writing', startTime: Date.now() }),

  setResponse: (text) => set({ responseText: text }),
  setStep: (step) => set({ step }),
  setSessionId: (id) => set({ sessionId: id }),
  setFeedbackV1: (f) => set({ feedbackV1: f }),
  setFeedbackV2: (f) => set({ feedbackV2: f }),
  setRewriteText: (text) => set({ rewriteText: text }),
  startRewrite: () => set({ rewriteStartTime: Date.now() }),

  addPastSession: (session) =>
    set((s) => ({ pastSessions: [session, ...s.pastSessions] })),

  setPastSessions: (sessions) => set({ pastSessions: sessions }),

  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  resetSession: () => set(sessionDefaults),
}))
