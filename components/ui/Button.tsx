'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Quizlet design system Button
 *
 * Variants:  primary | secondary | tertiary | text-primary | text-secondary | upgrade | danger
 * Sizes:     xsmall | small | medium | large | xlarge
 * Shape:     pill (radius-full) by default, matching Quizlet's standard button shape
 */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'text-primary'
  | 'text-secondary'
  | 'upgrade'
  | 'danger'

export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge'
  | 'sm' | 'md' | 'lg' // legacy aliases

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Circle shape — equal w/h, no horizontal padding, for icon-only buttons */
  circle?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  // Primary — filled twilight blue
  primary: [
    'bg-[var(--q-btn-primary-bg)] text-[var(--q-btn-primary-fg)]',
    'hover:bg-[var(--q-btn-primary-bg-hover)]',
    'active:bg-[var(--q-twilight-700)]',
    'disabled:bg-[var(--q-btn-primary-bg-disabled)] disabled:text-[var(--q-btn-primary-fg-disabled)]',
  ].join(' '),

  // Secondary — light twilight tint
  secondary: [
    'bg-[var(--q-btn-secondary-bg)] text-[var(--q-btn-secondary-fg)]',
    'hover:bg-[var(--q-btn-secondary-bg-hover)] hover:text-[var(--q-btn-secondary-fg-hover)]',
    'active:bg-[var(--q-twilight-300)] active:text-[var(--q-twilight-700)]',
    'disabled:bg-[var(--q-btn-secondary-bg-disabled)] disabled:text-[var(--q-btn-secondary-fg-disabled)]',
  ].join(' '),

  // Tertiary — gray background
  tertiary: [
    'bg-[var(--q-btn-tertiary-bg)] text-[var(--q-btn-tertiary-fg)]',
    'hover:bg-[var(--q-btn-tertiary-bg-hover)]',
    'active:bg-[var(--q-gray-400)]',
    'disabled:opacity-40',
  ].join(' '),

  // Text Primary — no background, twilight text
  'text-primary': [
    'bg-transparent text-[var(--q-twilight-500)]',
    'hover:bg-[var(--q-twilight-100)]',
    'active:bg-[var(--q-twilight-200)] active:text-[var(--q-twilight-700)]',
    'disabled:text-[var(--q-text-disabled)]',
  ].join(' '),

  // Text Secondary — no background, gray text
  'text-secondary': [
    'bg-transparent text-[var(--q-text-secondary)]',
    'hover:bg-[var(--q-gray-300)] hover:text-[var(--q-gray-700)]',
    'active:bg-[var(--q-gray-400)] active:text-[var(--q-gray-900)]',
    'disabled:text-[var(--q-text-disabled)]',
  ].join(' '),

  // Upgrade — yellow/gold, dark text
  upgrade: [
    'bg-[var(--q-sunset-400)] text-[var(--q-gray-800)]',
    'hover:bg-[var(--q-sunset-300)]',
    'active:bg-[var(--q-sunset-200,#FFEDAB)]',
    'disabled:bg-[var(--q-btn-primary-bg-disabled)] disabled:text-[var(--q-btn-primary-fg-disabled)]',
  ].join(' '),

  // Danger — cherry red
  danger: [
    'bg-[var(--q-btn-danger-bg)] text-[var(--q-btn-danger-fg)]',
    'hover:bg-[var(--q-btn-danger-bg-hover)]',
    'active:bg-[var(--q-cherry-300)]',
    'disabled:bg-[var(--q-btn-primary-bg-disabled)] disabled:text-[var(--q-btn-primary-fg-disabled)]',
  ].join(' '),
}

// Sizes use Quizlet spacing + typography tokens
const sizeStyles: Record<ButtonSize, string> = {
  xsmall: 'px-[var(--q-space-8)]  py-[var(--q-space-4)]  q-sh5',
  small:  'px-[var(--q-space-12)] py-[var(--q-space-6)]  q-sh5',
  medium: 'px-[var(--q-space-16)] py-[var(--q-space-8)]  q-sh4',
  large:  'px-[var(--q-space-20)] py-[var(--q-space-10)] q-sh3',
  xlarge: 'px-[var(--q-space-24)] py-[var(--q-space-12)] q-sh3',
  // legacy aliases
  sm:  'px-[var(--q-space-12)] py-[var(--q-space-6)]  q-sh5',
  md:  'px-[var(--q-space-16)] py-[var(--q-space-8)]  q-sh4',
  lg:  'px-[var(--q-space-20)] py-[var(--q-space-10)] q-sh3',
}

// Legacy size aliases so existing callers (sm/md/lg) keep working
const legacySizeMap: Record<string, ButtonSize> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

const circleSizeStyles: Record<ButtonSize, string> = {
  xsmall: 'w-6  h-6  p-0',
  small:  'w-8  h-8  p-0',
  medium: 'w-10 h-10 p-0',
  large:  'w-12 h-12 p-0',
  xlarge: 'w-14 h-14 p-0',
  sm:  'w-8  h-8  p-0',
  md:  'w-10 h-10 p-0',
  lg:  'w-12 h-12 p-0',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'medium', circle, children, ...props }, ref) => {
    const resolvedSize = legacySizeMap[size as string] ?? (size as ButtonSize)

    const base = [
      'inline-flex items-center justify-center font-semibold transition-all duration-150',
      'rounded-[var(--q-radius-full)]',      // pill shape — standard in Quizlet DS
      'active:scale-[0.98]',
      'disabled:cursor-not-allowed',
      'focus:outline-none focus-visible:ring-2',
      'focus-visible:ring-[var(--q-twilight-300)] focus-visible:ring-offset-2',
    ].join(' ')

    return (
      <button
        ref={ref}
        className={cn(base, variantStyles[variant], circle ? circleSizeStyles[resolvedSize] : sizeStyles[resolvedSize], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
