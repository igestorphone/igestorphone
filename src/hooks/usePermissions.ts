import { useAuthStore } from '@/stores/authStore'

export const usePermissions = () => {
  const { user } = useAuthStore()
  const isAdmin = user?.tipo === 'admin'

  const canAccessConsultLists = () => {
    if (isAdmin) return true
    return (user?.permissions?.includes('consultar_listas') ?? false)
  }

  const canAccessPriceAverages = () => {
    if (isAdmin) return true
    return (user?.permissions?.includes('medias_preco') ?? false)
  }

  const canAccessSearchCheapest = () => {
    if (isAdmin) return true
    return (user?.permissions?.includes('buscar_iphone_barato') ?? false)
  }

  /** Usuário funcionário: só tem permissão "calendario" – acesso apenas ao calendário do assinante */
  const canAccessOnlyCalendar = () => {
    const p = user?.permissions
    return Array.isArray(p) && p.length === 1 && p[0] === 'calendario'
  }

  const canManageUsers = () => {
    return isAdmin
  }

  const canAccessAdmin = () => {
    return isAdmin
  }

  return {
    isAdmin,
    canAccessConsultLists,
    canAccessPriceAverages,
    canAccessSearchCheapest,
    canAccessOnlyCalendar,
    canManageUsers,
    canAccessAdmin
  }
}
