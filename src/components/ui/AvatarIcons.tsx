/** 5 ícones de avatar (estilo limpo, misto) para escolha no perfil */

import type { ReactNode } from 'react'

const base = 'w-full h-full'

export const AVATAR_OPTIONS = [
  { id: 'icon1', label: 'Ícone 1' },
  { id: 'icon2', label: 'Ícone 2' },
  { id: 'icon3', label: 'Ícone 3' },
  { id: 'icon4', label: 'Ícone 4' },
  { id: 'icon5', label: 'Ícone 5' }
] as const

export type AvatarType = typeof AVATAR_OPTIONS[number]['id']

// 1 – Pessoa (contorno clássico)
function Icon1() {
  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="22" r="10" />
      <path d="M18 56v-14a8 8 0 0 1 16 0v14" />
    </svg>
  )
}

// 2 – Robozinho (cabeça, antena, olhos e sorriso)
function Icon2() {
  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 10v-3" />
      <circle cx="32" cy="28" r="14" />
      <circle cx="26" cy="26" r="2.5" fill="currentColor" />
      <circle cx="38" cy="26" r="2.5" fill="currentColor" />
      <path d="M26 36h12" />
      <path d="M22 48h20M26 54h12" />
    </svg>
  )
}

// 3 – Pessoa alternativa (ombros mais marcados)
function Icon3() {
  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="20" r="9" />
      <path d="M16 56c0-9 7-16 16-16s16 7 16 16" />
    </svg>
  )
}

// 4 – Carinha redonda (olhos + sorriso)
function Icon4() {
  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="14" />
      <circle cx="26" cy="28" r="2" fill="currentColor" />
      <circle cx="38" cy="28" r="2" fill="currentColor" />
      <path d="M26 38c0 0 3 4 6 4s6-4 6-4" />
    </svg>
  )
}

// 5 – Silhueta minimalista
function Icon5() {
  return (
    <svg viewBox="0 0 64 64" className={base} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="32" cy="24" rx="10" ry="12" />
      <path d="M20 56v-12a6 6 0 0 1 12 0v12M32 44a6 6 0 0 1 12 0v12" />
    </svg>
  )
}

const AVATAR_ICONS: Record<AvatarType, () => ReactNode> = {
  icon1: Icon1,
  icon2: Icon2,
  icon3: Icon3,
  icon4: Icon4,
  icon5: Icon5
}

// Compatibilidade: ícones antigos (male1, female1, etc.) mapeiam para os 5 atuais
export const AVATAR_LEGACY_MAP: Record<string, AvatarType> = {
  male1: 'icon1', male2: 'icon2', male3: 'icon3', male4: 'icon4', male5: 'icon5',
  female1: 'icon1', female2: 'icon2', female3: 'icon3', female4: 'icon4', female5: 'icon5'
}
const LEGACY_MAP = AVATAR_LEGACY_MAP

export function getAvatarIcon(type: string | null | undefined): (() => ReactNode) | null {
  if (!type) return null
  const key = (LEGACY_MAP[type] || type) as AvatarType
  if (!AVATAR_ICONS[key]) return null
  return AVATAR_ICONS[key]
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
