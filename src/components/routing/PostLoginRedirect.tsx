import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'

/** Compat: links antigos em /entrando vão direto ao destino pós-login. */
export default function PostLoginRedirect() {
  const { user } = useAuthStore()
  const { canAccessOnlyCalendar } = usePermissions()

  if (!user) return <Navigate to="/login" replace />

  if (user.subscription_status === 'pending_payment' || user.subscription_status === 'overdue') {
    return <Navigate to="/checkout" replace />
  }

  const to = canAccessOnlyCalendar() ? '/calendar' : '/search-cheapest-iphone'
  return <Navigate to={to} replace />
}
