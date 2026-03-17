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
      <defs>
        <linearGradient id="shirtGlow" x1="18" y1="38" x2="46" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EDE9FE" />
        </linearGradient>
      </defs>
      {/* Cabeça branca */}
      <circle cx="32" cy="22" r="14" fill="#fff" stroke="#D9E0F0" strokeWidth="1.2" />
      {/* Orelhas / protuberâncias azul claro */}
      <circle cx="16" cy="22" r="6.3" fill="#8cc7ff" />
      <circle cx="48" cy="22" r="6.3" fill="#8cc7ff" />
      <circle cx="16" cy="22" r="3.2" fill="#cfe9ff" opacity=".75" />
      <circle cx="48" cy="22" r="3.2" fill="#cfe9ff" opacity=".75" />
      {/* Antena */}
      <path d="M32 8v6" stroke="#8cc7ff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="6" r="3" fill="#8cc7ff" />
      {/* Tela do rosto */}
      <rect x="22.5" y="15.2" width="19" height="14.5" rx="6" fill="#1f2b6b" stroke="#32408f" strokeWidth="1" />
      <rect x="24.5" y="17.5" width="15" height="10" rx="5" fill="#172355" opacity=".8" />
      {/* Olhos ciano com brilho */}
      <circle cx="27.8" cy="21.2" r="2.7" fill="#3dd8ff" />
      <circle cx="36.2" cy="21.2" r="2.7" fill="#3dd8ff" />
      <circle cx="28.6" cy="20.4" r="0.7" fill="#fff" />
      <circle cx="37" cy="20.4" r="0.7" fill="#fff" />
      {/* Sorriso */}
      <path d="M28.2 25.4c0 0 1.6 1.8 3.8 1.8s3.8-1.8 3.8-1.8" stroke="#3dd8ff" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Corpo / camiseta */}
      <path d="M18 38c2.6-3.8 6.7-6 14-6s11.4 2.2 14 6v14H18V38z" fill="url(#shirtGlow)" stroke="#D9E0F0" strokeWidth="1.2" />
      <path d="M22 38c1.4-2.6 4.6-4.2 10-4.2S40.6 35.4 42 38" stroke="#D9E0F0" strokeWidth="1.2" />
      {/* Ombros / braços */}
      <path d="M18 43c0-2.2 1-4.3 2.8-5.8" stroke="#cfd8e8" strokeWidth="1.1" />
      <path d="M46 43c0-2.2-1-4.3-2.8-5.8" stroke="#cfd8e8" strokeWidth="1.1" />
      <path d="M16.5 41.5c-1.2 1.6-1.8 4-1.8 6.5V56" stroke="#b9c6db" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M47.5 41.5c1.2 1.6 1.8 4 1.8 6.5V56" stroke="#b9c6db" strokeWidth="1.8" strokeLinecap="round" />
      {/* Texto iGestor */}
      <text x="32" y="48.8" textAnchor="middle" fill="#18315d" fontSize="7.4" fontFamily="system-ui, sans-serif" fontWeight="700">iGestor</text>
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
  const innerSize = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-14 h-14' }

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br ${bg} ${sizeMap[size]} ${className}`}
    >
      <Sparkles className="opacity-80" />
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
