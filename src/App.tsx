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
import AIPage from '@/pages/AIPage'
import TermsPage from '@/pages/TermsPage'
import SupportPage from '@/pages/SupportPage'
import ManageSuppliersPage from '@/pages/ManageSuppliersPage'
import SupplierSuggestionsPage from '@/pages/SupplierSuggestionsPage'
import BugReportsPage from '@/pages/BugReportsPage'
import GoalsPage from '@/pages/GoalsPage'
import SubscriptionPage from '@/pages/SubscriptionPage'
import RankingPage from '@/pages/RankingPage'
import DevelopmentPlaceholderPage from '@/pages/DevelopmentPlaceholderPage'
import CalendarPage from '@/pages/CalendarPage'
import PriceAveragesPage from '@/pages/PriceAveragesPage'
import FuncionariosCalendarioPage from '@/pages/FuncionariosCalendarioPage'

const AUTH_REDIRECT_PATH = '/search-cheapest-iphone'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { canAccessOnlyCalendar } = usePermissions()
  useIdleLogout()

  const defaultAuthenticatedPath = canAccessOnlyCalendar() ? '/calendar' : AUTH_REDIRECT_PATH

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to={defaultAuthenticatedPath} /> : <LandingPage />} />
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to={defaultAuthenticatedPath} />
          ) : (
            <AuthLayout>
              <LoginPage />
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
        <Route path="/dashboard" element={<Navigate to="/search-cheapest-iphone" replace />} />
        <Route path="/search-iphone-seminovo" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DevelopmentPlaceholderPage />} />
        </Route>
        <Route path="/search-android" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DevelopmentPlaceholderPage />} />
        </Route>
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
        <Route path="/ai" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AIPage />} />
        </Route>
        <Route path="/terms" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TermsPage />} />
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