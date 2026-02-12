export const ROUTES = {
  // Public routes
  SPLASH: '/splash',
  LOGIN: '/login',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROCESS_LIST: '/process-list',
  CONSULT_SUPPLIERS: '/consult-suppliers',
  STATISTICS: '/statistics',
  SEARCH_CHEAPEST: '/search-cheapest',
  PROFILE: '/profile',
  
  // Admin routes
  ADMIN: '/admin',
  CREATE_USER: '/admin/create-user',
  EDIT_USER: '/admin/edit-user',
  DATABASE_ADMIN: '/admin/database',
  MANAGE_SUPPLIERS: '/admin/manage-suppliers',
  
  // Support routes
  SUPPORT: '/support',
  TERMS: '/terms',
} as const

export const PUBLIC_ROUTES = [ROUTES.SPLASH, ROUTES.LOGIN]
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PROCESS_LIST,
  ROUTES.CONSULT_SUPPLIERS,
  ROUTES.STATISTICS,
  ROUTES.SEARCH_CHEAPEST,
  ROUTES.PROFILE,
  ROUTES.SUPPORT,
  ROUTES.TERMS,
]
export const ADMIN_ROUTES = [
  ROUTES.ADMIN,
  ROUTES.CREATE_USER,
  ROUTES.EDIT_USER,
  ROUTES.DATABASE_ADMIN,
  ROUTES.MANAGE_SUPPLIERS,
]



