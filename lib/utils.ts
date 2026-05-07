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

export function scoreColor(score: number): string {
  if (score < 5) return '#B00020'
  if (score <= 7) return '#FF983A'
  return '#18AE79'
}

export function scoreColorClass(score: number): string {
  if (score < 5) return 'text-[#B00020]'
  if (score <= 7) return 'text-[#CC4E00]'
  return 'text-[#12815A]'
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
