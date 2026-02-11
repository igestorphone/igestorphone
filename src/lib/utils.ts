import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de preços
export function formatPrice(price: number): string {
  if (price === 0) return 'R$ 0,00'
  
  // Se o preço é um número inteiro, não mostra decimais
  if (price === Math.round(price)) {
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  
  return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Formatação de datas
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A'
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'N/A'
  }
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'N/A'
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch (error) {
    console.error('Erro ao formatar hora:', error)
    return 'N/A'
  }
}

// Códigos de país da região (não adicionar 55 quando já tiver um destes)
const OTHER_COUNTRY_CODES = ['595', '54', '598', '57', '51', '593', '591', '58', '56', '52', '593']

// Formatação de WhatsApp (Brasil +55, Paraguai +595, etc. — não forçar Brasil em número internacional)
export function formatWhatsApp(whatsapp: string): string {
  const numbers = whatsapp.replace(/\D/g, '')
  if (!numbers.length) return ''

  // Já tem código de país: manter como está (Brasil 55 ou outro)
  if (numbers.startsWith('55') && numbers.length >= 12) return `+${numbers}`
  for (const code of OTHER_COUNTRY_CODES) {
    if (numbers.startsWith(code) && numbers.length >= code.length + 8) return `+${numbers}`
  }

  // Começa com 0: remove e trata o resto
  const semZero = numbers.startsWith('0') ? numbers.substring(1) : numbers

  // 9 dígitos começando com 9: provável Paraguai (595 9XX XXX XXX)
  if (semZero.length === 9 && semZero.startsWith('9')) return `+595${semZero}`

  // 10 ou 11 dígitos: provável Brasil (DDD + 9 + número)
  if (semZero.length >= 10 && semZero.length <= 11) return `+55${semZero}`

  // 12+ dígitos sem código conhecido: assumir que já tem código
  if (semZero.length >= 12) return `+${semZero}`

  // Fallback: número curto, assumir Brasil
  return `+55${semZero}`
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validação de WhatsApp
export function isValidWhatsApp(whatsapp: string): boolean {
  const numbers = whatsapp.replace(/\D/g, '')
  return numbers.length >= 10 && numbers.length <= 15
}

// Geração de IDs únicos
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Capitalize first letter
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Get greeting based on time
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia! Que tal verificar os preços?'
  if (hour < 18) return 'Boa tarde! Encontre as melhores ofertas!'
  return 'Boa noite! Hora de analisar os dados!'
}

// Local storage helpers
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}

// URL helpers
export function createWhatsAppUrl(phone: string, message?: string): string {
  const formattedPhone = formatWhatsApp(phone)
  const encodedMessage = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${formattedPhone.replace('+', '')}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}

// Error handling
export function getErrorMessage(error: unknown): string {
  // Se for erro do axios, extrair mensagem do response.data
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }
    if (axiosError.response?.status) {
      const status = axiosError.response.status
      if (status === 401) return 'Não autenticado. Faça login novamente.'
      if (status === 403) return 'Acesso negado. Você não tem permissão para esta ação.'
      if (status === 404) return 'Recurso não encontrado.'
      if (status === 500) return 'Erro interno do servidor.'
      return `Erro ${status}: ${axiosError.response.statusText || 'Erro desconhecido'}`
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Ocorreu um erro inesperado'
}

// Array helpers
export function groupBy<T, K extends string | number>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = key(item)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export function sortBy<T>(
  array: T[],
  key: (item: T) => string | number,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = key(a)
    const bVal = key(b)
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Number helpers
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  
  return sorted[middle]
}
