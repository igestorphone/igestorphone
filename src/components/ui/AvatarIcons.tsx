/** 3 opções de avatar: robozinho iGestor com fundo Neutro (cinza), Azul ou Rosa */

export const AVATAR_OPTIONS = [
  { id: 'neutral', label: 'Neutro' },
  { id: 'azul', label: 'Azul' },
  { id: 'rosa', label: 'Rosa' }
] as const

export type AvatarType = typeof AVATAR_OPTIONS[number]['id']

const BG_NEUTRAL = 'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600'
const BG_AZUL = 'from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600'
const BG_ROSA = 'from-pink-300 to-pink-400 dark:from-pink-400 dark:to-pink-500'

const AVATAR_IMAGE_MAP: Record<AvatarType, string> = {
  neutral: '/assets/images/avatarcinza.png',
  azul: '/assets/images/avatarazul.png',
  rosa: '/assets/images/avatarrosa.png'
}

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

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br ${bg} ${sizeMap[size]} ${className}`}
    >
      <img
        src={AVATAR_IMAGE_MAP[variant]}
        alt={`Avatar ${variant}`}
        className="w-full h-full object-cover"
      />
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
