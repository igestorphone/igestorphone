import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'
import { getErrorMessage } from '@/lib/utils'

function ensureApiSuffix(url: string) {
  const trimmed = (url || '').trim().replace(/\/+$/, '')
  if (!trimmed) return 'http://localhost:3001/api'
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`
}

const API_BASE_URL = ensureApiSuffix(import.meta.env.VITE_API_URL || 'http://localhost:3001/api')

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Create axios instance for test routes (no auth required)
export const testApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor (sem logs em produção para melhor performance no mobile)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      } catch (_) {
        // token inválido
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle common errors - apenas para rotas protegidas
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Não redirecionar se for uma rota pública de registro
      if (!url.includes('/register/') && !url.includes('/register/public') && !url.includes('/auth/login') && !url.includes('/auth/forgot-password') && !url.includes('/auth/reset-password')) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('auth-storage')
        // Só redirecionar se não estiver já na página de registro ou login
        if (!window.location.pathname.includes('/register') && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Generic API methods
export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.patch<ApiResponse<T>>(url, data, config)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete<ApiResponse<T>>(url, config)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
}

// Specific API endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<{ usuario: any; token: string }>('/auth/login', credentials),

  forgotPassword: (email: string) => api.post<{ message: string }>('/auth/forgot-password', { email }),

  verifyResetToken: (token: string) =>
    api.get<{ valid?: boolean; message?: string }>(`/auth/reset-password/${encodeURIComponent(token)}`),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),

  me: () =>
    apiClient.get<any>('/auth/me'),

  refresh: () =>
    apiClient.post<{ token: string }>('/auth/refresh'),
}

export const subscriptionsApi = {
  getMySubscription: () =>
    apiClient.get<any>('/subscriptions/my-subscription'),
}

export const asaasApi = {
  getPlans: () =>
    apiClient.get<{ plans: Array<{ id: string; name: string; planName: string; value: number; cycle: string; durationMonths: number }> }>('/asaas/plans'),

  /** Admin: valor atual do override do mensal (null = padrão 150,00) */
  getMensalOverride: () => apiClient.get<{ value: number | null }>('/asaas/admin/mensal-override'),

  /** Admin: { value: 5 } (mín. Asaas) ou { clear: true } */
  setMensalOverride: (payload: { value?: number; clear?: boolean }) =>
    apiClient.put<{ value: number | null; message?: string }>('/asaas/admin/mensal-override', payload),

  getMyPayments: () =>
    apiClient.get<{ payments: Array<{ id: string; status: string; value: number; dueDate?: string; paymentDate?: string; billingType?: string; description?: string }> }>(
      '/asaas/my-payments'
    ),

  updateSubscriptionPaymentMethod: (data: {
    creditCard: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string }
    creditCardHolderInfo: { name: string; email: string; cpfCnpj: string; postalCode?: string; addressNumber?: string; mobilePhone?: string }
  }) =>
    apiClient.put<{ success: boolean; message?: string }>('/asaas/subscription-payment-method', data),

  registerCheckout: async (data: { name: string; email: string; password: string; cpfCnpj: string; phone: string }) => {
    const res = await testApi.post<{ message: string; user: any; token: string }>('/asaas/register-checkout', data)
    return res.data
  },

  createSubscription: (data: {
    planKey: 'teste' | 'mensal'
    billingType: 'PIX' | 'CREDIT_CARD'
    cpfCnpj?: string
    phone?: string
    creditCard?: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string }
    creditCardHolderInfo?: { name: string; email: string; cpfCnpj: string; postalCode?: string; addressNumber?: string; mobilePhone?: string }
  }) =>
    apiClient.post<{
      success: boolean
      subscriptionId?: string
      paymentId?: string
      status: string
      pix?: { encodedImage: string; payload: string; expirationDate: string }
      message?: string
    }>('/asaas/create-subscription', data),

  verifyPayment: () =>
    apiClient.get<{ paid: boolean; message?: string; status?: string }>('/asaas/verify-payment'),
}

export const fornecedoresApi = {
  getAll: (params?: any) =>
    apiClient.get<any[]>('/suppliers', { params }),

  getById: (id: string) =>
    apiClient.get<any>(`/suppliers/${id}`),

  create: (data: any) =>
    apiClient.post<any>('/suppliers', data),

  update: (id: string, data: any) =>
    apiClient.put<any>(`/suppliers/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/suppliers/${id}`),

  deleteProducts: (id: string) =>
    apiClient.delete<{ message: string; products_deactivated: number }>(`/suppliers/${id}/products`),

  getRawList: (id: number) =>
    apiClient.get<any>(`/suppliers/${id}/raw-list`)
}

export const supplierReviewsApi = {
  contact: (supplierId: number) =>
    apiClient.post<any>('/supplier-reviews/contact', { supplier_id: supplierId }),

  getPending: () =>
    apiClient.get<any>('/supplier-reviews/pending'),

  getMine: () =>
    apiClient.get<any>('/supplier-reviews/mine'),

  getTop: (limit = 12) =>
    apiClient.get<any>('/supplier-reviews/top', { params: { limit } }),

  search: (params?: { search?: string; limit?: number; rated_only?: boolean }) =>
    apiClient.get<any>('/supplier-reviews', { params }),

  submit: (data: { supplier_id: number; rating: number; comment?: string }) =>
    apiClient.post<any>('/supplier-reviews/submit', data),

  dismiss: (supplierId: number) =>
    apiClient.post<any>('/supplier-reviews/dismiss', { supplier_id: supplierId }),
}

export const produtosApi = {
  getAll: (params?: any) =>
    apiClient.get<any[]>('/products', { params }),
  
  getById: (id: string) =>
    apiClient.get<any>(`/products/${id}`),
  
  search: (query: string) =>
    apiClient.get<any[]>(`/products/search?q=${encodeURIComponent(query)}`),
  
  getCheapest: (modelo: string, condicao?: string) =>
    apiClient.get<any>(`/products/cheapest?modelo=${encodeURIComponent(modelo)}&condicao=${condicao || ''}`),

  getPriceHistory: (productId: number) =>
    apiClient.get<any>(`/products/${productId}/price-history`),

  getPriceHistoryByModel: (params: { model: string; storage?: string; color?: string }) =>
    apiClient.get<any>('/products/price-history-by-model', { params })
}

export const statisticsApi = {
  getByModelo: (modelo: string) =>
    apiClient.get<any>(`/statistics/modelo/${encodeURIComponent(modelo)}`),
  
  getGeneral: () =>
    apiClient.get<any>('/statistics/general'),
}

export const aiApi = {
  processList: (data: { fornecedorNome: string; fornecedorWhatsapp: string; rawListText: string }) =>
    apiClient.post<any>('/ai/process-list', data),
  
  validateList: (rawListText: string) =>
    apiClient.post<any>('/ai/validate-list', { rawListText }),
  
  getDashboard: () =>
    apiClient.get<any>('/ai/dashboard'),
  
  getStatus: () =>
    apiClient.get<any>('/ai/status'),
}

export const utilsApi = {
  getDollarRate: async () => {
    const response = await api.get('/utils/dollar-rate')
    return response.data
  },
  getServerStatus: async () => {
    const response = await api.get('/health')
    return response.data
  },
  getGlobalStats: async (
    dateOffset: 0 | -1 | -2 = 0,
    searchMode?: string | null
  ): Promise<{
    total_products: number
    total_suppliers: number
    total_without_list?: number
    display_override?: boolean
  }> => {
    const response = await api.get('/utils/stats', {
      params: {
        date_offset: dateOffset,
        ...(searchMode ? { search_mode: searchMode } : {}),
      },
    })
    return response.data
  }
}

export const supplierSuggestionsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/supplier-suggestions', { params })
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/supplier-suggestions', data)
    return response.data
  },
  updateStatus: async (id: number, status: 'pending' | 'approved' | 'rejected') => {
    const response = await api.patch(`/supplier-suggestions/${id}`, { status })
    return response.data
  },
  getPendingCount: async () => {
    const response = await api.get('/supplier-suggestions/count/pending')
    return response.data
  }
}

export const bugReportsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/bug-reports', { params })
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/bug-reports', data)
    return response.data
  },
  updateStatus: async (id: number, status: 'pending' | 'in_progress' | 'resolved' | 'rejected') => {
    const response = await api.patch(`/bug-reports/${id}`, { status })
    return response.data
  }
}

export const supportApi = {
  getTickets: () => api.get<{ success: boolean; tickets: Array<{ id: string; subject: string; message: string; status: string; priority: string; createdAt: string | null }> }>('/support/tickets').then(r => r.data),
  createTicket: (data: { subject: string; message: string; priority?: 'low' | 'medium' | 'high' }) => api.post<{ success: boolean; ticket: { id: string; subject: string; message: string; status: string; priority: string; createdAt: string | null } }>('/support/tickets', data).then(r => r.data)
}

export const devlogApi = {
  tasks: {
    getAll: async () => (await api.get('/devlog/tasks')).data,
    create: async (data: any) => (await api.post('/devlog/tasks', data)).data,
    update: async (id: number, data: any) => (await api.put(`/devlog/tasks/${id}`, data)).data,
    delete: async (id: number) => (await api.delete(`/devlog/tasks/${id}`)).data
  },
  releases: {
    getAll: async () => (await api.get('/devlog/releases')).data,
    create: async (data: any) => (await api.post('/devlog/releases', data)).data,
    update: async (id: number, data: any) => (await api.put(`/devlog/releases/${id}`, data)).data,
    delete: async (id: number) => (await api.delete(`/devlog/releases/${id}`)).data
  },
  notes: {
    getAll: async () => (await api.get('/devlog/notes')).data,
    create: async (data: any) => (await api.post('/devlog/notes', data)).data,
    update: async (id: number, data: any) => (await api.put(`/devlog/notes/${id}`, data)).data,
    delete: async (id: number) => (await api.delete(`/devlog/notes/${id}`)).data
  }
}

export type LivePresenceGeo = {
  lat: number
  lng: number
  city: string | null
  region: string | null
  country: string | null
  countryCode: string | null
}

export type LivePresenceSession = {
  sessionId: string
  userId: number
  userName: string | null
  userEmail: string | null
  userTipo: string | null
  createdAt: string
  lastActivityAt: string
  ip: string | null
  ipIsPublic: boolean
  deviceLabel: string
  geo: LivePresenceGeo | null
}

export type LivePresenceResponse = {
  withinMinutes: number
  generatedAt: string
  uniqueUsers: number
  sessionCount: number
  brazilByState: Array<{ state: string; count: number }>
  sessions: LivePresenceSession[]
}

export const analyticsApi = {
  livePresence: (params?: { minutes?: number }) =>
    apiClient.get<LivePresenceResponse>('/analytics/live-presence', { params }),
}

export const whatsappApi = {
  status: () => apiClient.get<any>('/whatsapp/status'),
  inbox: (params?: { status?: string; limit?: number }) => apiClient.get<any>('/whatsapp/inbox', { params }),
  conversations: (params?: { limit?: number }) => apiClient.get<any>('/whatsapp/conversations', { params }),
  conversationMessages: (phone: string, params?: { limit?: number; list_type?: 'lacrada' | 'seminovo' | 'android' | 'geral' }) =>
    apiClient.get<any>(`/whatsapp/conversations/${phone}/messages`, { params }),
  sendMessage: (phone: string, message: string) =>
    apiClient.post<any>(`/whatsapp/conversations/${phone}/send`, { message }, { timeout: 300000 }),
  updateInboxStatus: (id: number, status: 'new' | 'processed' | 'error' | 'pending_supplier' | 'ignored') =>
    apiClient.patch<any>(`/whatsapp/inbox/${id}/status`, { status }),
  updateInboxMessageText: (id: number, messageText: string) =>
    apiClient.patch<any>(`/whatsapp/inbox/${id}/message-text`, { message_text: messageText }),
  processInboxItem: (id: number, listType?: 'lacrada' | 'seminovo' | 'android' | 'auto') =>
    apiClient.post<any>(
      `/whatsapp/inbox/${id}/process`,
      listType && listType !== 'auto' ? { list_type: listType } : {},
      { timeout: 300000 }
    ),
  splitInboxItem: (id: number) => apiClient.post<any>(`/whatsapp/inbox/${id}/split`, {}),
  deleteInboxItem: (id: number) => apiClient.delete<any>(`/whatsapp/inbox/${id}`),
}

export interface UserSessionRow {
  id: string
  deviceLabel: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastActivityAt: string
  isCurrent: boolean
}

export const usersApi = {
  getAll: () =>
    apiClient.get<any>('/users'),
  
  getById: (id: string) =>
    apiClient.get<any>(`/users/${id}`),
  
  create: (data: any) =>
    apiClient.post<any>('/users', data),
  
  update: (id: string, data: any) =>
    apiClient.put<any>(`/users/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<any>(`/users/${id}`),
  
  updatePermissions: (id: string, permissions: any) =>
    apiClient.patch<any>(`/users/${id}/permissions`, { permissions }),
  
  updateSubscription: (id: string, subscription: any) =>
    apiClient.patch<any>(`/users/${id}/subscription`, subscription),
  
  getSubscription: (id: string) =>
    apiClient.get<any>(`/users/${id}/subscription`),
  
  getPermissions: (id: string) =>
    apiClient.get<any>(`/users/${id}/permissions`),
  
  getPending: () =>
    apiClient.get<any>('/users/pending'),
  
  getExpiring: () =>
    apiClient.get<any>('/users/expiring'),

  approve: (id: string, durationDays: number) =>
    apiClient.post<any>(`/users/${id}/approve`, { durationDays }),
  
  forceLogoutAll: () =>
    apiClient.post<any>('/users/force-logout-all', {}),

  cleanupInactive: () =>
    apiClient.delete<any>('/users/cleanup-inactive'),

  /** Admin: ajustar subscription_expires_at para NOW + N dias (testes) */
  patchSubscriptionExpiryTest: (
    id: string,
    data: { daysFromNow: number; extend?: boolean; subscription_status?: string }
  ) => apiClient.patch<{ message: string; user: unknown }>(`/users/${id}/subscription-expiry-test`, data),

  /** Admin: mesmo que acima, buscando usuário por e-mail */
  patchSubscriptionExpiryTestByEmail: (data: { email: string; daysFromNow: number; subscription_status?: string }) =>
    apiClient.patch<{ message: string; user: unknown }>(`/users/by-email/subscription-expiry-test`, data),

  getSessions: () =>
    apiClient.get<{ maxConcurrent: number; sessions: UserSessionRow[] }>('/users/sessions'),

  revokeSession: (sessionId: string) =>
    apiClient.delete<{ message: string }>(`/users/sessions/${sessionId}`),
}

export const registrationApi = {
  verifyToken: async (token: string) => {
    // Tentar primeiro path parameter (formato que funciona), depois query string como fallback
    try {
      const response = await testApi.get(`/register/${token}`)
      return response.data
    } catch (error: any) {
      // Se falhar com path parameter, tentar query string (fallback)
      console.log('⚠️ Path parameter falhou, tentando query string:', error.response?.status)
      try {
        const response = await testApi.get(`/register?token=${token}`)
        return response.data
      } catch (queryError: any) {
        // Se ambos falharem, retornar o erro original
        throw error
      }
    }
  },
  
  registerPublic: async (data: { name: string; email: string; password: string; whatsapp: string; nome_loja?: string }) => {
    const response = await testApi.post('/register/public', data)
    return response.data
  },

  register: async (token: string, data: { name: string; email: string; password: string; endereco?: string; data_nascimento?: string; whatsapp?: string; nome_loja?: string; cnpj?: string | null }) => {
    // Tentar primeiro path parameter (formato que funciona), depois query string como fallback
    try {
      const response = await testApi.post(`/register/${token}`, data)
      return response.data
    } catch (error: any) {
      // Se falhar com path parameter, tentar query string (fallback)
      console.log('⚠️ Path parameter falhou, tentando query string:', error.response?.status)
      try {
        const response = await testApi.post(`/register?token=${token}`, data)
        return response.data
      } catch (queryError: any) {
        // Se ambos falharem, retornar o erro original
        throw error
      }
    }
  },
  
  generateLink: async (expiresInDays?: number) => {
    const response = await api.post('/registration-links', { expiresInDays })
    return response.data
  },

  generateTrialLink: async () => {
    const response = await api.post('/registration-links/trial')
    return response.data
  },
  
  getAllLinks: async () => {
    const response = await api.get('/registration-links')
    return response.data
  },
}
