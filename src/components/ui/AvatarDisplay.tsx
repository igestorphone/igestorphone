import { User } from 'lucide-react'
import { getAvatarIcon, IgestorAvatarCircle } from './AvatarIcons'

interface AvatarDisplayProps {
  /** Usuário com avatar_type e/ou avatar_url */
  user?: { avatar_type?: string | null; avatar_url?: string | null } | null
  /** Ou passar direto */
  avatarType?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Cor de fundo quando ícone (gradiente) */
  gradient?: boolean
}

const sizeClasses = {
  sm: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-16 h-16'
}

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-10 h-10'
}

export default function AvatarDisplay({
  user,
  avatarType: propAvatarType,
  avatarUrl: propAvatarUrl,
  size = 'md',
  className = '',
  gradient = true
}: AvatarDisplayProps) {
  const avatarType = propAvatarType ?? user?.avatar_type
  const avatarUrl = propAvatarUrl ?? user?.avatar_url

  const baseClass = `rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`
  const wrapperClass = gradient
    ? `${baseClass} bg-gradient-to-r from-indigo-500 to-purple-600 text-white`
    : `${baseClass} text-gray-600 dark:text-white/90`

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl.startsWith('data:') ? avatarUrl : avatarUrl}
        alt="Avatar"
        className={`${baseClass} object-cover`}
      />
    )
  }

  const variant = avatarType as string
  if (variant === 'neutral' || variant === 'azul' || variant === 'rosa') {
    return (
      <div className={`${baseClass} flex-shrink-0`}>
        <IgestorAvatarCircle variant={variant} size={size} className="w-full h-full" />
      </div>
    )
  }

  const IconComponent = avatarType ? getAvatarIcon(avatarType) : null
  if (IconComponent) {
    return (
      <div className={wrapperClass}>
        <span className={iconSizes[size]}><IconComponent /></span>
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      <User className={iconSizes[size]} />
    </div>
  )
}
