export type PromptCategory =
  | 'general'
  | 'business'
  | 'policy'
  | 'ethics'
  | 'case_study'

export interface Prompt {
  id: string
  text: string
  category: PromptCategory
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  prompt_id: string | null
  prompt_text: string
  position: string
  response_v1: string
  response_v2: string | null
  time_taken_seconds: number
  time_limit_seconds: number
  status: 'complete' | 'abandoned'
  created_at: string
}

export interface DimensionFeedback {
  score: number
  diagnosis: string
  suggestion: string
}

export interface Feedback {
  id: string
  session_id: string
  version: 1 | 2
  position_clarity_score: number
  position_clarity_diagnosis: string
  position_clarity_suggestion: string
  argument_structure_score: number
  argument_structure_diagnosis: string
  argument_structure_suggestion: string
  logical_consistency_score: number
  logical_consistency_diagnosis: string
  logical_consistency_suggestion: string
  use_of_evidence_score: number
  use_of_evidence_diagnosis: string
  use_of_evidence_suggestion: string
  tradeoff_awareness_score: number
  tradeoff_awareness_diagnosis: string
  tradeoff_awareness_suggestion: string
  overall_score: number
  coach_note: string
  created_at: string
}

export interface FeedbackDimensions {
  position_clarity: DimensionFeedback
  argument_structure: DimensionFeedback
  logical_consistency: DimensionFeedback
  use_of_evidence: DimensionFeedback
  tradeoff_awareness: DimensionFeedback
}

export interface FeedbackResponse {
  dimensions: FeedbackDimensions
  overall_score: number
  coach_note: string
}

export interface SessionWithFeedback extends Session {
  feedback?: Feedback[]
}

export type TimeLimitOption = 10 | 15 | 20 | 30
