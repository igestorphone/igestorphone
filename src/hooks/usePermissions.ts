import { useAuthStore } from '@/stores/authStore'

export const usePermissions = () => {
  const { user } = useAuthStore()

  console.log('🔐 usePermissions - user:', user)
  console.log('🔐 usePermissions - permissions:', user?.permissions)
  console.log('🔐 usePermissions - user.tipo:', user?.tipo)
  console.log('🔐 usePermissions - user.role:', user?.role)

  const isAdmin = user?.tipo === 'admin'
  console.log('🔐 usePermissions - isAdmin calculado:', isAdmin)

  // Funções de permissão para usuários comuns
  const canAccessConsultLists = () => {
    const hasPermission = user?.permissions?.includes('consultar_listas') || false
    console.log('🔐 canAccessConsultLists - isAdmin:', isAdmin, 'hasPermission:', hasPermission, 'permissions:', user?.permissions)
    if (isAdmin) return true
    return hasPermission
  }

  const canAccessPriceAverages = () => {
    const hasPermission = user?.permissions?.includes('medias_preco') || false
    console.log('🔐 canAccessPriceAverages - isAdmin:', isAdmin, 'hasPermission:', hasPermission, 'permissions:', user?.permissions)
    if (isAdmin) return true
    return hasPermission
  }

  const canAccessSearchCheapest = () => {
    const hasPermission = user?.permissions?.includes('buscar_iphone_barato') || false
    console.log('🔐 canAccessSearchCheapest - isAdmin:', isAdmin, 'hasPermission:', hasPermission, 'permissions:', user?.permissions)
    if (isAdmin) return true
    return hasPermission
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
