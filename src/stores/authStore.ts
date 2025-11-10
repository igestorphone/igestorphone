import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario, LoginRequest, TipoUsuario } from '@/types'
import { removeFromStorage } from '@/lib/utils'
import { api } from '@/lib/api'

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
            
            console.log('🔐 Login - Resposta do backend:', response.data)
            
            // Mapear o campo 'role' para 'tipo' para compatibilidade
            const userData = {
              ...user,
              tipo: user.role || 'user'
            }
            
            console.log('🔐 Login - UserData mapeado:', userData)
            
            set({
              user: userData,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
            
            // Após o login, carregar as permissões
            console.log('🔐 Login - Carregando permissões...')
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
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      refreshUser: async () => {
        const { token, user } = get()
        console.log('🔄 refreshUser - Token:', token)
        console.log('🔄 refreshUser - User atual:', user)
        
        if (!token || !user) {
          console.log('❌ refreshUser - Sem token ou user, saindo')
          return
        }
        
        try {
          const response = await api.get('/users/profile')
          console.log('🔄 refreshUser - Resposta da API:', response.data)
          console.log('🔄 refreshUser - User da resposta:', response.data.user)
          console.log('🔄 refreshUser - Permissões da resposta:', response.data.user.permissions)
          
          const userData = {
            ...response.data.user,
            tipo: response.data.user.tipo || response.data.user.role || 'user'
          }
          
          console.log('🔄 refreshUser - UserData processado:', userData)
          console.log('🔄 refreshUser - Permissões do usuário:', userData.permissions)
          console.log('🔄 refreshUser - Tipo do usuário:', userData.tipo)
          
          set({ user: userData })
          console.log('✅ refreshUser - Usuário atualizado no store')
          
          // Verificar se as permissões foram salvas
          const currentUser = get().user
          console.log('✅ refreshUser - Usuário atual no store:', currentUser)
          console.log('✅ refreshUser - Permissões atuais no store:', currentUser?.permissions)
        } catch (error) {
          console.error('❌ Erro ao atualizar usuário:', error)
          // Se houver erro, fazer logout
          get().logout()
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Função de teste para carregar permissões
      testLoadPermissions: async () => {
        console.log('🧪 TESTE - Carregando permissões...')
        try {
          const response = await api.get('/users/profile')
          console.log('🧪 TESTE - Resposta:', response.data)
          console.log('🧪 TESTE - Permissões:', response.data.user.permissions)
          
          const userData = {
            ...response.data.user,
            tipo: response.data.user.tipo || response.data.user.role || 'user'
          }
          
          console.log('🧪 TESTE - UserData:', userData)
          set({ user: userData })
          console.log('🧪 TESTE - Usuário atualizado no store')
        } catch (error) {
          console.error('🧪 TESTE - Erro:', error)
        }
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

// Initialize auth on app start
const initializeAuth = () => {
  const { token, user, isAuthenticated } = useAuthStore.getState()
  
  if (token && user) {
    console.log('Auth initialized successfully')
  }
}

// Call initialization
initializeAuth()
