import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserPermissions } from '@/types'
import { requiresCheckoutOnly } from '@/lib/subscriptionAccess'

const ONLY_CALENDAR_ALLOWED_PATHS = ['/calendar', '/profile', '/devices']

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: keyof UserPermissions
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const { pathname } = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (requiresCheckoutOnly(user)) {
    return <Navigate to="/checkout" replace />
  }

  const onlyCalendar =
    Array.isArray(user.permissions) && user.permissions.length === 1 && user.permissions[0] === 'calendario'
  if (onlyCalendar && !ONLY_CALENDAR_ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return <Navigate to="/calendar" replace />
  }

  if (requiredPermission && !user.permissoes?.[requiredPermission]) {
    return <Navigate to="/search-cheapest-iphone" replace />
  }

  return <>{children}</>
}
