import { create } from 'zustand'
import type { FeedbackResponse, PromptCategory, TimeLimitOption } from '@/lib/types'

interface SessionState {
  prompt: string
  category: PromptCategory
  position: string
  responseText: string
  timeTakenSeconds: number
  timeLimitSeconds: number
  sessionId: string | null
  feedbackV1: FeedbackResponse | null
  feedbackV2: FeedbackResponse | null
  isSubmitting: boolean

  setPrompt: (prompt: string, category: PromptCategory) => void
  setPosition: (position: string) => void
  setResponse: (text: string) => void
  setTimeTaken: (seconds: number) => void
  setTimeLimit: (minutes: TimeLimitOption) => void
  setSessionId: (id: string) => void
  setFeedbackV1: (feedback: FeedbackResponse) => void
  setFeedbackV2: (feedback: FeedbackResponse) => void
  setIsSubmitting: (val: boolean) => void
  reset: () => void
}

const initialState = {
  prompt: '',
  category: 'general' as PromptCategory,
  position: '',
  responseText: '',
  timeTakenSeconds: 0,
  timeLimitSeconds: 20 * 60,
  sessionId: null,
  feedbackV1: null,
  feedbackV2: null,
  isSubmitting: false,
}

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setPrompt: (prompt, category) => set({ prompt, category }),
  setPosition: (position) => set({ position }),
  setResponse: (text) => set({ responseText: text }),
  setTimeTaken: (seconds) => set({ timeTakenSeconds: seconds }),
  setTimeLimit: (minutes) => set({ timeLimitSeconds: minutes * 60 }),
  setSessionId: (id) => set({ sessionId: id }),
  setFeedbackV1: (feedback) => set({ feedbackV1: feedback }),
  setFeedbackV2: (feedback) => set({ feedbackV2: feedback }),
  setIsSubmitting: (val) => set({ isSubmitting: val }),
  reset: () => set(initialState),
}))
