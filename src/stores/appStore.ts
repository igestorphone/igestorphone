import { create } from 'zustand'
import { Fornecedor, Produto, StatisticsResponse } from '@/types'

interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>
  
  // Data State
  fornecedores: Fornecedor[]
  produtos: Produto[]
  statistics: StatisticsResponse | null
  
  // Loading States
  isLoadingFornecedores: boolean
  isLoadingProdutos: boolean
  isLoadingStatistics: boolean
  
  // Error States
  error: string | null
}

interface AppActions {
  // UI Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Omit<AppState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Data Actions
  setFornecedores: (fornecedores: Fornecedor[]) => void
  addFornecedor: (fornecedor: Fornecedor) => void
  updateFornecedor: (id: string, updates: Partial<Fornecedor>) => void
  removeFornecedor: (id: string) => void
  
  setProdutos: (produtos: Produto[]) => void
  addProduto: (produto: Produto) => void
  updateProduto: (id: string, updates: Partial<Produto>) => void
  removeProduto: (id: string) => void
  
  setStatistics: (statistics: StatisticsResponse | null) => void
  
  // Loading Actions
  setLoadingFornecedores: (loading: boolean) => void
  setLoadingProdutos: (loading: boolean) => void
  setLoadingStatistics: (loading: boolean) => void
  
  // Error Actions
  setError: (error: string | null) => void
  clearError: () => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  sidebarOpen: false,
  theme: 'dark',
  notifications: [],
  fornecedores: [],
  produtos: [],
  statistics: null,
  isLoadingFornecedores: false,
  isLoadingProdutos: false,
  isLoadingStatistics: false,
  error: null,

  // UI Actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open })
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme })
    // Save to localStorage
    localStorage.setItem('theme', theme)
  },

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration)
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  // Data Actions
  setFornecedores: (fornecedores: Fornecedor[]) => {
    set({ fornecedores })
  },

  addFornecedor: (fornecedor: Fornecedor) => {
    set((state) => ({
      fornecedores: [...state.fornecedores, fornecedor]
    }))
  },

  updateFornecedor: (id: string, updates: Partial<Fornecedor>) => {
    set((state) => ({
      fornecedores: state.fornecedores.map(f =>
        f.id === id ? { ...f, ...updates } : f
      )
    }))
  },

  removeFornecedor: (id: string) => {
    set((state) => ({
      fornecedores: state.fornecedores.filter(f => f.id !== id)
    }))
  },

  setProdutos: (produtos: Produto[]) => {
    set({ produtos })
  },

  addProduto: (produto: Produto) => {
    set((state) => ({
      produtos: [...state.produtos, produto]
    }))
  },

  updateProduto: (id: string, updates: Partial<Produto>) => {
    set((state) => ({
      produtos: state.produtos.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }))
  },

  removeProduto: (id: string) => {
    set((state) => ({
      produtos: state.produtos.filter(p => p.id !== id)
    }))
  },

  setStatistics: (statistics: StatisticsResponse | null) => {
    set({ statistics })
  },

  // Loading Actions
  setLoadingFornecedores: (loading: boolean) => {
    set({ isLoadingFornecedores: loading })
  },

  setLoadingProdutos: (loading: boolean) => {
    set({ isLoadingProdutos: loading })
  },

  setLoadingStatistics: (loading: boolean) => {
    set({ isLoadingStatistics: loading })
  },

  // Error Actions
  setError: (error: string | null) => {
    set({ error })
  },

  clearError: () => {
    set({ error: null })
  }
}))

// Initialize theme from localStorage
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (savedTheme) {
    useAppStore.getState().setTheme(savedTheme)
  }
}

// Call initialization
initializeTheme()
