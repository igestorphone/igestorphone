import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { requiresCheckoutOnly } from '@/lib/subscriptionAccess'

/** Compat: links antigos em /entrando vão direto ao destino pós-login. */
export default function PostLoginRedirect() {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (requiresCheckoutOnly(user)) {
    return <Navigate to="/checkout" replace />
  }

  return <Navigate to="/search-cheapest-iphone" replace />
}
