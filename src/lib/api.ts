import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'
import { getErrorMessage } from '@/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-storage')
    console.log('🔑 API Request - URL:', config.url)
    console.log('🔑 API Request - Token do localStorage:', token)
    
    if (token) {
      try {
        const authData = JSON.parse(token)
        console.log('🔑 API Request - AuthData:', authData)
        console.log('🔑 API Request - AuthData.state:', authData.state)
        console.log('🔑 API Request - AuthData.state.token:', authData.state?.token)
        
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
          console.log('🔑 API Request - Token enviado:', authData.state.token)
        } else {
          console.log('❌ API Request - Token não encontrado no authData.state')
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    } else {
      console.log('❌ API Request - Nenhum token encontrado no localStorage')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('🔑 API Response - URL:', response.config.url)
    console.log('🔑 API Response - Status:', response.status)
    console.log('🔑 API Response - Data:', response.data)
    return response
  },
  (error) => {
    console.error('❌ API Error:', error)
    console.error('❌ API Error - URL:', error.config?.url)
    console.error('❌ API Error - Status:', error.response?.status)
    console.error('❌ API Error - Data:', error.response?.data)
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
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
  
  me: () =>
    apiClient.get<any>('/auth/me'),
  
  refresh: () =>
    apiClient.post<{ token: string }>('/auth/refresh'),
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

  getRawList: (id: number) =>
    apiClient.get<any>(`/suppliers/${id}/raw-list`)
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

export const goalsApi = {
  getAll: async () => {
    const response = await api.get('/goals')
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/goals', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/goals/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/goals/${id}`)
    return response.data
  }
}

export const notesApi = {
  getAll: async () => {
    const response = await api.get('/notes')
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/notes', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/notes/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/notes/${id}`)
    return response.data
  }
}

export const usersApi = {
  getAll: () =>
    testApi.get<any[]>('/test/test-list'),
  
  getById: (id: string) =>
    apiClient.get<any>(`/users/${id}`),
  
  create: (data: any) =>
    testApi.post<any>('/test/create', data),
  
  update: (id: string, data: any) =>
    apiClient.put<any>(`/users/${id}`, data),
  
  delete: (id: string) =>
    testApi.delete(`/test/test-delete/${id}`),
  
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
  
  approve: (id: string, durationDays: number) =>
    apiClient.post<any>(`/users/${id}/approve`, { durationDays }),
}

export const registrationApi = {
  verifyToken: async (token: string) => {
    const response = await testApi.get(`/register/${token}`)
    return response.data
  },
  
  register: async (token: string, data: { name: string; email: string; password: string }) => {
    const response = await testApi.post(`/register/${token}`, data)
    return response.data
  },
  
  generateLink: async (expiresInDays?: number) => {
    const response = await api.post('/registration-links', { expiresInDays })
    return response.data
  },
  
  getAllLinks: async () => {
    const response = await api.get('/registration-links')
    return response.data
  },
}
