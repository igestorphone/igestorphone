/** 3 opções de avatar: robozinho iGestor com fundo Neutro (cinza), Azul ou Rosa */

import type { ReactNode } from 'react'

export const AVATAR_OPTIONS = [
  { id: 'neutral', label: 'Neutro' },
  { id: 'azul', label: 'Azul' },
  { id: 'rosa', label: 'Rosa' }
] as const

export type AvatarType = typeof AVATAR_OPTIONS[number]['id']

const BASE = 'w-full h-full'

// Robozinho: corpo branco, orelhas/antena azul claro, tela rosto azul escuro, olhos ciano, camiseta "iGestor"
function RobotSvg({ className = BASE }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Corpo / camiseta branca */}
      <path d="M18 38h28v14H18z" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M20 38V32a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v6" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
      {/* Texto iGestor na camiseta */}
      <text x="32" y="48" textAnchor="middle" fill="#1e3a5f" fontSize="8" fontFamily="system-ui, sans-serif" fontWeight="600">iGestor</text>
      {/* Cabeça branca */}
      <circle cx="32" cy="22" r="14" fill="#fff" stroke="#e2e8f0" strokeWidth="1" />
      {/* Orelhas / protuberâncias azul claro */}
      <circle cx="16" cy="22" r="6" fill="#93c5fd" />
      <circle cx="48" cy="22" r="6" fill="#93c5fd" />
      {/* Antena */}
      <path d="M32 8v6" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="6" r="3" fill="#93c5fd" />
      {/* Tela do rosto (azul escuro) */}
      <rect x="24" y="16" width="16" height="12" rx="3" fill="#1e3a5f" />
      {/* Olhos ciano com brilho */}
      <circle cx="28" cy="21" r="2.5" fill="#22d3ee" />
      <circle cx="36" cy="21" r="2.5" fill="#22d3ee" />
      <circle cx="28.5" cy="20" r="0.6" fill="#fff" />
      <circle cx="36.5" cy="20" r="0.6" fill="#fff" />
      {/* Sorriso */}
      <path d="M28 25c0 0 2 2 4 2s4-2 4-2" stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// Partículas de brilho
function Sparkles({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/60"
          style={{
            left: `${15 + (i * 7) % 70}%`,
            top: `${10 + (i * 11) % 80}%`,
            width: 2,
            height: 2
          }}
        />
      ))}
    </div>
  )
}

const BG_NEUTRAL = 'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600'
const BG_AZUL = 'from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600'
const BG_ROSA = 'from-pink-300 to-pink-400 dark:from-pink-400 dark:to-pink-500'

export function IgestorAvatarCircle({
  variant,
  className = '',
  size = 'md'
}: {
  variant: 'neutral' | 'azul' | 'rosa'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const bg =
    variant === 'neutral' ? BG_NEUTRAL :
    variant === 'azul' ? BG_AZUL : BG_ROSA

  const sizeMap = { sm: 'w-9 h-9', md: 'w-10 h-10', lg: 'w-16 h-16' }
  const innerSize = { sm: 'w-6 h-6', md: 'w-7 h-7', lg: 'w-11 h-11' }

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br ${bg} ${sizeMap[size]} ${className}`}
    >
      <Sparkles />
      <span className={`relative z-10 ${innerSize[size]}`}>
        <RobotSvg className="w-full h-full" />
      </span>
    </div>
  )
}

// Compatibilidade: ícones antigos mapeiam para neutro
export const AVATAR_LEGACY_MAP: Record<string, AvatarType> = {
  male1: 'neutral', male2: 'neutral', male3: 'neutral', male4: 'neutral', male5: 'neutral',
  female1: 'neutral', female2: 'neutral', female3: 'neutral', female4: 'neutral', female5: 'neutral',
  icon1: 'neutral', icon2: 'neutral', icon3: 'neutral', icon4: 'neutral', icon5: 'neutral'
}

export function getAvatarIcon(type: string | null | undefined): (() => ReactNode) | null {
  if (!type) return null
  const v = (AVATAR_LEGACY_MAP[type] || type) as AvatarType
  if (v !== 'neutral' && v !== 'azul' && v !== 'rosa') return null
  return () => <IgestorAvatarCircle variant={v} className="w-full h-full" size="lg" />
}

export function AvatarIcon({ type, className = '' }: { type: AvatarType | string; className?: string }) {
  const v = (AVATAR_LEGACY_MAP[type] || type) as AvatarType
  if (v !== 'neutral' && v !== 'azul' && v !== 'rosa') return null
  return (
    <span className={`inline-block flex items-center justify-center ${className}`}>
      <IgestorAvatarCircle variant={v} size="md" />
    </span>
  )
}
