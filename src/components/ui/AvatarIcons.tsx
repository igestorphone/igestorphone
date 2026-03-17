/** Ícones de avatar para escolha no perfil: 5 masculinos + 5 femininos (robozinhos/ícones bonitinhos) */

import type { ReactNode } from 'react'

const baseClass = 'w-full h-full'

export const AVATAR_OPTIONS = [
  { id: 'male1', label: 'Ícone 1', gender: 'male' as const },
  { id: 'male2', label: 'Ícone 2', gender: 'male' as const },
  { id: 'male3', label: 'Ícone 3', gender: 'male' as const },
  { id: 'male4', label: 'Ícone 4', gender: 'male' as const },
  { id: 'male5', label: 'Ícone 5', gender: 'male' as const },
  { id: 'female1', label: 'Ícone 6', gender: 'female' as const },
  { id: 'female2', label: 'Ícone 7', gender: 'female' as const },
  { id: 'female3', label: 'Ícone 8', gender: 'female' as const },
  { id: 'female4', label: 'Ícone 9', gender: 'female' as const },
  { id: 'female5', label: 'Ícone 10', gender: 'female' as const }
] as const

export type AvatarType = typeof AVATAR_OPTIONS[number]['id']

function IconMale1() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="20" r="10" />
      <path d="M20 58V42c0-6.6 5.4-12 12-12h0c6.6 0 12 5.4 12 12v16" />
      <circle cx="26" cy="26" r="2" fill="currentColor" />
      <circle cx="38" cy="26" r="2" fill="currentColor" />
      <path d="M28 34h8" />
    </svg>
  )
}

function IconMale2() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="16" y="12" width="32" height="36" rx="4" />
      <circle cx="32" cy="24" r="6" />
      <path d="M24 44h16" />
      <circle cx="24" cy="32" r="2" fill="currentColor" />
      <circle cx="40" cy="32" r="2" fill="currentColor" />
    </svg>
  )
}

function IconMale3() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M32 8c-8 0-14 6-14 14v6c0 8 6 14 14 14s14-6 14-14v-6c0-8-6-14-14-14z" />
      <path d="M20 52h24v6H20z" />
      <circle cx="28" cy="26" r="2.5" fill="currentColor" />
      <circle cx="36" cy="26" r="2.5" fill="currentColor" />
      <path d="M30 34h4" />
    </svg>
  )
}

function IconMale4() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="32" cy="22" rx="12" ry="14" />
      <path d="M18 54c0-8 6-14 14-14s14 6 14 14" />
      <circle cx="26" cy="22" r="2" fill="currentColor" />
      <circle cx="38" cy="22" r="2" fill="currentColor" />
      <path d="M28 30h8" />
    </svg>
  )
}

function IconMale5() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="32" cy="20" r="11" />
      <path d="M18 58V40c0-7.7 6.3-14 14-14h0c7.7 0 14 6.3 14 14v18" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
      <path d="M24 38l8-4 8 4" />
    </svg>
  )
}

function IconFemale1() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="32" cy="18" r="10" />
      <path d="M20 56V40c0-6.6 5.4-12 12-12h0c6.6 0 12 5.4 12 12v16" />
      <path d="M28 22c2 0 4-1 4-3s-2-3-4-3-4 1-4 3 2 3 4 3z" />
      <path d="M36 22c2 0 4-1 4-3s-2-3-4-3-4 1-4 3 2 3 4 3z" />
      <path d="M28 32h8" />
    </svg>
  )
}

function IconFemale2() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="32" cy="20" rx="11" ry="12" />
      <path d="M20 56V38c0-6.6 5.4-12 12-12s12 5.4 12 12v18" />
      <circle cx="26" cy="20" r="2" fill="currentColor" />
      <circle cx="38" cy="20" r="2" fill="currentColor" />
      <path d="M28 28h8" />
    </svg>
  )
}

function IconFemale3() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="32" cy="22" r="11" />
      <path d="M18 58V40c0-7.7 6.3-14 14-14h0c7.7 0 14 6.3 14 14v18" />
      <circle cx="26" cy="22" r="2.5" fill="currentColor" />
      <circle cx="38" cy="22" r="2.5" fill="currentColor" />
      <path d="M30 30c0 1 .5 2 2 2s2-1 2-2" />
    </svg>
  )
}

function IconFemale4() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M32 10c-9 0-16 7-16 16v4c0 9 7 16 16 16s16-7 16-16v-4c0-9-7-16-16-16z" />
      <path d="M22 52h20v6H22z" />
      <circle cx="28" cy="28" r="2" fill="currentColor" />
      <circle cx="36" cy="28" r="2" fill="currentColor" />
      <path d="M30 36h4" />
    </svg>
  )
}

function IconFemale5() {
  return (
    <svg viewBox="0 0 64 64" className={baseClass} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="32" cy="20" r="10" />
      <path d="M20 56V42c0-6.6 5.4-12 12-12h0c6.6 0 12 5.4 12 12v14" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
      <path d="M26 26h12M26 38h12" />
    </svg>
  )
}

const AVATAR_ICONS: Record<AvatarType, () => ReactNode> = {
  male1: IconMale1,
  male2: IconMale2,
  male3: IconMale3,
  male4: IconMale4,
  male5: IconMale5,
  female1: IconFemale1,
  female2: IconFemale2,
  female3: IconFemale3,
  female4: IconFemale4,
  female5: IconFemale5
}

export function getAvatarIcon(type: AvatarType | string | null | undefined): (() => ReactNode) | null {
  if (!type || !AVATAR_ICONS[type as AvatarType]) return null
  return AVATAR_ICONS[type as AvatarType]
}

export function AvatarIcon({ type, className = '' }: { type: AvatarType | string; className?: string }) {
  const Icon = getAvatarIcon(type)
  if (!Icon) return null
  return (
    <span className={`inline-block flex items-center justify-center ${className}`}>
      <Icon />
    </span>
  )
}
