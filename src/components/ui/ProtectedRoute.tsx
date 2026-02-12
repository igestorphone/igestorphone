import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserPermissions } from '@/types'

const ONLY_CALENDAR_ALLOWED_PATHS = ['/calendar', '/profile', '/entrando']

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
