import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Convert a 1-10 dimension score to the 0-100 display scale.
 * Each of 5 dimensions is worth 20 points (score × 2).
 */
export function toDisplayScore(rawScore: number): number {
  return Math.round(rawScore * 2)
}

/**
 * Compute total score out of 100 from a FeedbackDimensions object.
 */
export function computeTotalScore(dimensions: {
  position_clarity: { score: number }
  argument_structure: { score: number }
  logical_consistency: { score: number }
  use_of_evidence: { score: number }
  tradeoff_awareness: { score: number }
} | null | undefined): number {
  if (!dimensions) return 0
  const sum =
    (dimensions.position_clarity?.score ?? 0) +
    (dimensions.argument_structure?.score ?? 0) +
    (dimensions.logical_consistency?.score ?? 0) +
    (dimensions.use_of_evidence?.score ?? 0) +
    (dimensions.tradeoff_awareness?.score ?? 0)
  return Math.round(sum * 2) // max 100
}

export function scoreColor(score: number, max = 100): string {
  const pct = score / max
  if (pct < 0.5) return '#B00020'
  if (pct <= 0.7) return '#FF983A'
  return '#18AE79'
}

export function scoreColorClass(score: number, max = 100): string {
  const pct = score / max
  if (pct < 0.5) return 'text-[#B00020]'
  if (pct <= 0.7) return 'text-[#CC4E00]'
  return 'text-[#12815A]'
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
