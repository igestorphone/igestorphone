import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario, LoginRequest } from '@/types'
import { removeFromStorage } from '@/lib/utils'
import { api } from '@/lib/api'
import { clearActivity, touchActivity } from '@/lib/idle'

interface AuthState {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  testLoadPermissions: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
        login: async (credentials: LoginRequest) => {
          set({ isLoading: true, error: null })
          
          try {
            const response = await api.post('/auth/login', {
              email: credentials.email,
              password: credentials.password
            })
            
            const { user, token } = response.data
            const userData = {
              ...user,
              tipo: user.role || 'user'
            }
            set({
              user: userData,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })

            touchActivity()
            setTimeout(() => {
              get().refreshUser()
            }, 100)
            
            return true
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Erro ao fazer login'
            set({
              error: errorMessage,
              isLoading: false
            })
            return false
          }
        },

      logout: () => {
        // Clear storage
        removeFromStorage('auth-storage')
        clearActivity()
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      refreshUser: async () => {
        const { token, user } = get()
        if (!token || !user) return
        try {
          const response = await api.get('/users/profile')
          const userData = {
            ...response.data.user,
            tipo: response.data.user.tipo || response.data.user.role || 'user'
          }
          set({ user: userData })
        } catch (_) {
          get().logout()
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      testLoadPermissions: async () => {
        try {
          const response = await api.get('/users/profile')
          const userData = {
            ...response.data.user,
            tipo: response.data.user.tipo || response.data.user.role || 'user'
          }
          set({ user: userData })
        } catch (_) {}
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

