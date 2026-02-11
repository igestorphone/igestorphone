import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuthStore } from '@/stores/authStore'
import { useIdleLogout } from '@/hooks/useIdleLogout'
import { usePermissions } from '@/hooks/usePermissions'

import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

// Primeiras telas (sem lazy para abrir mais rápido)
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// Restante das páginas em lazy (reduz bundle inicial no mobile)
const SearchCheapestIPhonePage = lazy(() => import('@/pages/SearchCheapestIPhonePage'))
const ConsultListsPage = lazy(() => import('@/pages/ConsultListsPage'))
const OutsideSPPage = lazy(() => import('@/pages/OutsideSPPage'))
const ProcessListPage = lazy(() => import('@/pages/ProcessListPage'))
const ManageUsersPage = lazy(() => import('@/pages/ManageUsersPage'))
const CreateUserPage = lazy(() => import('@/pages/CreateUserPage'))
const EditUserPage = lazy(() => import('@/pages/EditUserPage'))
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const AIPage = lazy(() => import('@/pages/AIPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const SupportPage = lazy(() => import('@/pages/SupportPage'))
const ManageSuppliersPage = lazy(() => import('@/pages/ManageSuppliersPage'))
const SupplierSuggestionsPage = lazy(() => import('@/pages/SupplierSuggestionsPage'))
const BugReportsPage = lazy(() => import('@/pages/BugReportsPage'))
const GoalsPage = lazy(() => import('@/pages/GoalsPage'))
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'))
const PreferencesPage = lazy(() => import('@/pages/PreferencesPage'))
const RankingPage = lazy(() => import('@/pages/RankingPage'))
const DevelopmentPlaceholderPage = lazy(() => import('@/pages/DevelopmentPlaceholderPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const PriceAveragesPage = lazy(() => import('@/pages/PriceAveragesPage'))
const FuncionariosCalendarioPage = lazy(() => import('@/pages/FuncionariosCalendarioPage'))

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-gray-50 dark:bg-black">
      <div className="animate-pulse text-gray-500 dark:text-white/50">Carregando...</div>
    </div>
  )
}

const AUTH_REDIRECT_PATH = '/search-cheapest-iphone'

function App() {
  const { isAuthenticated } = useAuthStore()
  const { canAccessOnlyCalendar } = usePermissions()
  useIdleLogout()

  const defaultAuthenticatedPath = canAccessOnlyCalendar() ? '/calendar' : AUTH_REDIRECT_PATH

  return (
    <div className="min-h-screen">
      <Suspense fallback={<PageFallback />}>
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
        <Route path="/preferences" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PreferencesPage />} />
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
      </Suspense>
      <Analytics />
    </div>
  )
}

export default App