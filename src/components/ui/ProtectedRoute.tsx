import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserPermissions } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: keyof UserPermissions
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check if user has required permission
  if (requiredPermission && !user.permissoes[requiredPermission]) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
