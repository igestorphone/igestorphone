import { useAuthStore } from '@/stores/authStore'

export const usePermissions = () => {
  const { user } = useAuthStore()
  const isAdmin = user?.tipo === 'admin'

  const canAccessConsultLists = () => {
    if (isAdmin) return true
    return (user?.permissions?.includes('consultar_listas') ?? false)
  }

  const canAccessSearchCheapest = () => {
    if (isAdmin) return true
    return (user?.permissions?.includes('buscar_iphone_barato') ?? false)
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
    canAccessSearchCheapest,
    canManageUsers,
    canAccessAdmin
  }
}
