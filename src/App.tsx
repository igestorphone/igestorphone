import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Layouts
import AuthLayout from '@/components/layout/AuthLayout'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

// Pages
import DashboardPage from '@/pages/DashboardPage'
import ConsultListsPage from '@/pages/ConsultListsPage'
import PriceAveragesPage from '@/pages/PriceAveragesPage'
import SearchCheapestIPhonePage from '@/pages/SearchCheapestIPhonePage'
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

function App() {
  const { isAuthenticated, login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    const success = await login({ email, password: password })
    if (!success) {
      setError('Email ou senha inválidos')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, redirecting to dashboard...')
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-gradient-primary">
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <AuthLayout>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 space-y-6 bg-white/5 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">iGestorPhone</h1>
                  <p className="text-white/70">Sistema de Automação Apple</p>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">Senha</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                      placeholder="********"
                    />
                  </div>
                  <motion.button
                    onClick={handleLogin}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    Fazer Login
                  </motion.button>
                </div>
              </motion.div>
            </AuthLayout>
          )
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
        </Route>
        <Route path="/consult-lists" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ConsultListsPage />} />
        </Route>
        <Route path="/price-averages" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PriceAveragesPage />} />
        </Route>
        <Route path="/search-cheapest-iphone" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SearchCheapestIPhonePage />} />
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
      </Routes>
    </div>
  )
}

export default App