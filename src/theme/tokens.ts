/**
 * TypeScript token registry — mirrors the CSS custom properties in
 * primitives.css and semantic.css so that consumers can reference
 * tokens programmatically (e.g. for inline styles or Naive UI overrides).
 *
 * Components MUST use semantic tokens only.
 * v0.6 Modern Enhancement
 */

/* ──────────────────────── Primitive Scales ──────────────────────── */

export const primitiveColors = {
  blue: [
    '#f0f7ff',
    '#d6eaff',
    '#aed4ff',
    '#7ab8ff',
    '#4a9cff',
    '#2080f0',
    '#1a6dd4',
    '#155ab8',
    '#0f4899',
    '#0a3577',
  ],
  neutral: [
    '#ffffff',
    '#fafbfc',
    '#f5f6f7',
    '#eef0f2',
    '#dde1e5',
    '#c2c8ce',
    '#99a1ab',
    '#6b7785',
    '#4a5568',
    '#2d3748',
    '#1a202c',
    '#0f1419',
  ],
  green: [
    '#ecfdf5',
    '#d1fae5',
    '#a7f3d0',
    '#6ee7b7',
    '#34d399',
    '#18a058',
    '#158a4d',
    '#117340',
    '#0d5d33',
    '#094727',
  ],
  amber: [
    '#fffbeb',
    '#fef3c7',
    '#fde68a',
    '#fcd34d',
    '#fbbf24',
    '#f0a020',
    '#d4891a',
    '#b87315',
    '#925a0f',
    '#6b420b',
  ],
  red: [
    '#fef2f2',
    '#fee2e2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
    '#d03050',
    '#b52a46',
    '#99233c',
    '#7d1d31',
    '#611727',
  ],
  teal: [
    '#f0fdfa',
    '#ccfbf1',
    '#99f6e4',
    '#5eead4',
    '#2dd4bf',
    '#14b8a6',
    '#0f9688',
    '#0d7a6f',
    '#0a5e55',
    '#07423c',
  ],
  cyan: [
    '#ecfeff',
    '#cffafe',
    '#a5f3fc',
    '#67e8f9',
    '#22d3ee',
    '#06b6d4',
    '#0891b2',
    '#0e7490',
    '#155e75',
    '#164e63',
  ],
  violet: [
    '#f5f3ff',
    '#ede9fe',
    '#ddd6fe',
    '#c4b5fd',
    '#a78bfa',
    '#8b5cf6',
    '#7c3aed',
    '#6d28d9',
    '#5b21b6',
    '#4c1d95',
  ],
} as const

/* ──────────────────────── Semantic Token Keys ──────────────────────── */

export type SemanticColorToken =
  | 'bg-page'
  | 'bg-surface'
  | 'bg-surface-secondary'
  | 'bg-surface-tertiary'
  | 'bg-elevated'
  | 'bg-elevated-soft'
  | 'bg-overlay'
  | 'bg-muted'
  | 'bg-code'
  | 'bg-hover'
  | 'bg-active'
  | 'text-primary'
  | 'text-secondary'
  | 'text-tertiary'
  | 'text-quaternary'
  | 'text-inverse'
  | 'text-code'
  | 'text-link'
  | 'text-link-hover'
  | 'border-default'
  | 'border-light'
  | 'border-strong'
  | 'border-interactive'
  | 'border-focus'
  | 'brand-primary'
  | 'brand-hover'
  | 'brand-active'
  | 'brand-light'
  | 'brand-subtle'
  | 'success'
  | 'success-bg'
  | 'success-text'
  | 'success-border'
  | 'warning'
  | 'warning-bg'
  | 'warning-text'
  | 'warning-border'
  | 'danger'
  | 'danger-bg'
  | 'danger-text'
  | 'danger-border'
  | 'info'
  | 'info-bg'
  | 'info-text'
  | 'info-border'
  | 'focus-ring'
  | 'text-on-brand'

export type SpacingToken =
  | '0'
  | 'px'
  | '0-5'
  | '1'
  | '1-5'
  | '2'
  | '2-5'
  | '3'
  | '4'
  | '5'
  | '6'
  | '8'
  | '10'
  | '12'
  | '16'
  | '20'
  | '24'

export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

export type ShadowToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'card' | 'inner'

export type FontSizeToken =
  | '2xs'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'

export type FontWeightToken = 'normal' | 'medium' | 'semibold' | 'bold'

export type LineHeightToken = 'none' | 'tight' | 'snug' | 'base' | 'relaxed' | 'loose'

export type TransitionToken = 'fast' | 'base' | 'slow' | 'slower'

export type ZIndexToken =
  | 'dropdown'
  | 'sticky'
  | 'fixed'
  | 'modal-backdrop'
  | 'modal'
  | 'popover'
  | 'tooltip'
  | 'command-palette'

/* ──────────────────────── CSS Variable Resolvers ──────────────────────── */

/** Returns `var(--ra-color-{token})` */
export function colorVar(token: SemanticColorToken): string {
  return `var(--ra-color-${token})`
}

/** Returns `var(--ra-spacing-{token})` */
export function spacingVar(token: SpacingToken): string {
  return `var(--ra-spacing-${token})`
}

/** Returns `var(--ra-radius-{token})` */
export function radiusVar(token: RadiusToken): string {
  return `var(--ra-radius-${token})`
}

/** Returns `var(--ra-shadow-{token})` */
export function shadowVar(token: ShadowToken): string {
  return `var(--ra-shadow-${token})`
}

/** Returns `var(--ra-font-size-{token})` */
export function fontSizeVar(token: FontSizeToken): string {
  return `var(--ra-font-size-${token})`
}

/** Returns `var(--ra-transition-{token})` */
export function transitionVar(token: TransitionToken): string {
  return `var(--ra-transition-${token})`
}

/** Returns `var(--ra-font-weight-{token})` */
export function fontWeightVar(token: FontWeightToken): string {
  return `var(--ra-font-weight-${token})`
}

/** Returns `var(--ra-line-height-{token})` */
export function lineHeightVar(token: LineHeightToken): string {
  return `var(--ra-line-height-${token})`
}

/** Returns `var(--ra-z-{token})` */
export function zIndexVar(token: ZIndexToken): string {
  return `var(--ra-z-${token})`
}

/* ──────────────────────── Runtime Computed Value ──────────────────────── */

/**
 * Reads the computed value of a CSS custom property from the root element.
 * Returns empty string if unavailable (e.g. SSR).
 */
export function resolveToken(property: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim()
}
