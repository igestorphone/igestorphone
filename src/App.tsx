import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuthStore } from '@/stores/authStore'
import { useIdleLogout } from '@/hooks/useIdleLogout'
import { usePermissions } from '@/hooks/usePermissions'

import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import RegisterPage from '@/pages/RegisterPage'
import SearchCheapestIPhonePage from '@/pages/SearchCheapestIPhonePage'
import ConsultListsPage from '@/pages/ConsultListsPage'
import OutsideSPPage from '@/pages/OutsideSPPage'
import ProcessListPage from '@/pages/ProcessListPage'
import ManageUsersPage from '@/pages/ManageUsersPage'
import CreateUserPage from '@/pages/CreateUserPage'
import EditUserPage from '@/pages/EditUserPage'
import StatisticsPage from '@/pages/StatisticsPage'
import ProfilePage from '@/pages/ProfilePage'
import DevicesPage from '@/pages/DevicesPage'
import { TermsPublicPage, PrivacyPublicPage, LgpdPublicPage } from '@/pages/PublicLegalPages'
import SupportPage from '@/pages/SupportPage'
import ManageSuppliersPage from '@/pages/ManageSuppliersPage'
import SupplierSuggestionsPage from '@/pages/SupplierSuggestionsPage'
import BugReportsPage from '@/pages/BugReportsPage'
import GoalsPage from '@/pages/GoalsPage'
import SubscriptionPage from '@/pages/SubscriptionPage'
import RankingPage from '@/pages/RankingPage'
import CalendarPage from '@/pages/CalendarPage'
import PriceAveragesPage from '@/pages/PriceAveragesPage'
import FuncionariosCalendarioPage from '@/pages/FuncionariosCalendarioPage'
import PostLoginRedirect from '@/components/routing/PostLoginRedirect'
import CheckoutPage from '@/pages/CheckoutPage'
import NotificationsAdminPage from '@/pages/NotificationsAdminPage'
import WhatsAppInboxPage from '@/pages/WhatsAppInboxPage'
import { hasActiveSubscriptionAccess, requiresCheckoutOnly } from '@/lib/subscriptionAccess'

const AUTH_REDIRECT_PATH = '/search-cheapest-iphone'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { canAccessOnlyCalendar } = usePermissions()
  useIdleLogout()

  const defaultAuthenticatedPath = (() => {
    if (!user) return AUTH_REDIRECT_PATH
    if (requiresCheckoutOnly(user)) return '/checkout'
    return canAccessOnlyCalendar() ? '/calendar' : AUTH_REDIRECT_PATH
  })()

  // "/" e "/login" permitem ver a landing/login mesmo com pagamento pendente ou assinatura vencida (ex.: botão Voltar)
  const canSeeLanding = !isAuthenticated || (user != null && requiresCheckoutOnly(user))

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={canSeeLanding ? <LandingPage /> : <Navigate to={defaultAuthenticatedPath} />} />
        <Route path="/login" element={
          isAuthenticated && user && hasActiveSubscriptionAccess(user) ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          )
        } />
        <Route path="/forgot-password" element={
          isAuthenticated && user && hasActiveSubscriptionAccess(user) ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          )
        } />
        <Route path="/reset-password/:token" element={
          isAuthenticated && user && hasActiveSubscriptionAccess(user) ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <ResetPasswordPage />
            </AuthLayout>
          )
        } />
        {/* Rotas de registro - IMPORTANTE: /register/:token DEVE vir ANTES de /register */}
        <Route path="/register/:token" element={
          isAuthenticated ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          )
        } />
        <Route path="/cadastro/:token" element={
          isAuthenticated ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          )
        } />
        <Route path="/r/:token" element={
          isAuthenticated ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          )
        } />
        {/* Rota /register sem token (deve vir DEPOIS das rotas com token) */}
        <Route path="/register" element={
          isAuthenticated ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          )
        } />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/terms" element={<TermsPublicPage />} />
        <Route path="/privacy" element={<PrivacyPublicPage />} />
        <Route path="/lgpd" element={<LgpdPublicPage />} />
        <Route path="/dashboard" element={<Navigate to="/search-cheapest-iphone" replace />} />
        <Route path="/entrando" element={
          <ProtectedRoute>
            <PostLoginRedirect />
          </ProtectedRoute>
        } />
        <Route path="/search-iphone-seminovo" element={<Navigate to="/search-cheapest-iphone?mode=seminovo" replace />} />
        <Route path="/search-android" element={<Navigate to="/search-cheapest-iphone?mode=android" replace />} />
        <Route path="/consult-lists" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ConsultListsPage />} />
        </Route>
        <Route path="/search-cheapest-iphone" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SearchCheapestIPhonePage />} />
        </Route>
        <Route path="/price-averages" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PriceAveragesPage />} />
        </Route>
        <Route path="/outside-sp" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<OutsideSPPage />} />
        </Route>
        <Route path="/process-list" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ProcessListPage />} />
        </Route>
        <Route path="/process-list-seminovo" element={<Navigate to="/process-list?mode=seminovo" replace />} />
        <Route path="/process-list-android" element={<Navigate to="/process-list?mode=android" replace />} />
        <Route path="/manage-users" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ManageUsersPage />} />
        </Route>
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ManageUsersPage />} />
        </Route>
        <Route path="/admin/manage-suppliers" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ManageSuppliersPage />} />
        </Route>
        <Route path="/admin/notifications" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<NotificationsAdminPage />} />
        </Route>
        <Route path="/admin/whatsapp-inbox" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<WhatsAppInboxPage />} />
        </Route>
        <Route path="/supplier-suggestions" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SupplierSuggestionsPage />} />
        </Route>
        <Route path="/bug-reports" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<BugReportsPage />} />
        </Route>
        <Route path="/goals" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<GoalsPage />} />
        </Route>
        <Route path="/admin/users/create" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CreateUserPage />} />
        </Route>
        <Route path="/admin/users/edit/:id" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<EditUserPage />} />
        </Route>
        <Route path="/statistics" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<StatisticsPage />} />
        </Route>
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ProfilePage />} />
        </Route>
        <Route path="/devices" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DevicesPage />} />
        </Route>
        <Route path="/support" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SupportPage />} />
        </Route>
        <Route path="/subscription" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SubscriptionPage />} />
        </Route>
        <Route path="/ranking" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<RankingPage />} />
        </Route>
        <Route path="/calendar" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CalendarPage />} />
        </Route>
        <Route path="/funcionarios-calendario" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<FuncionariosCalendarioPage />} />
        </Route>
      </Routes>
      <Analytics />
    </div>
  )
}

export default App