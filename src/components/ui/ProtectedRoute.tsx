import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserPermissions } from '@/types'
import { requiresCheckoutOnly, isAccountRemovedAfterGrace } from '@/lib/subscriptionAccess'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: keyof UserPermissions
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, user, logout } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (isAccountRemovedAfterGrace(user)) {
    logout()
    return <Navigate to="/login?reason=account_removed" replace />
  }

  if (requiresCheckoutOnly(user)) {
    return <Navigate to="/checkout" replace />
  }

  if (requiredPermission && !user.permissoes?.[requiredPermission]) {
    return <Navigate to="/search-cheapest-iphone" replace />
  }

  return <>{children}</>
}
