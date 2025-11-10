// Sistema de permissões detalhado
export const PERMISSIONS = {
  // Dashboard e estatísticas
  DASHBOARD_VIEW: 'dashboard_view',
  STATISTICS_VIEW: 'statistics_view',
  ANALYTICS_VIEW: 'analytics_view',
  
  // Gerenciamento de usuários
  USERS_VIEW: 'users_view',
  USERS_CREATE: 'users_create',
  USERS_EDIT: 'users_edit',
  USERS_DELETE: 'users_delete',
  USERS_MANAGE_PERMISSIONS: 'users_manage_permissions',
  
  // Gerenciamento de fornecedores
  SUPPLIERS_VIEW: 'suppliers_view',
  SUPPLIERS_CREATE: 'suppliers_create',
  SUPPLIERS_EDIT: 'suppliers_edit',
  SUPPLIERS_DELETE: 'suppliers_delete',
  
  // Gerenciamento de produtos
  PRODUCTS_VIEW: 'products_view',
  PRODUCTS_CREATE: 'products_create',
  PRODUCTS_EDIT: 'products_edit',
  PRODUCTS_DELETE: 'products_delete',
  PRODUCTS_IMPORT: 'products_import',
  PRODUCTS_EXPORT: 'products_export',
  
  // Análise de preços
  PRICE_ANALYSIS_VIEW: 'price_analysis_view',
  PRICE_ANALYSIS_CREATE: 'price_analysis_create',
  PRICE_AVERAGES_VIEW: 'price_averages_view',
  PRICE_AVERAGES_CREATE: 'price_averages_create',
  
  // Busca de produtos
  SEARCH_PRODUCTS: 'search_products',
  SEARCH_CHEAPEST: 'search_cheapest',
  SEARCH_OPTIMAL: 'search_optimal',
  
  // Funcionalidades de IA
  AI_DASHBOARD_VIEW: 'ai_dashboard_view',
  AI_VALIDATE_LISTS: 'ai_validate_lists',
  AI_PRICE_ANALYSIS: 'ai_price_analysis',
  AI_MARKET_TRENDS: 'ai_market_trends',
  AI_GENERATE_REPORTS: 'ai_generate_reports',
  
  // Relatórios
  REPORTS_VIEW: 'reports_view',
  REPORTS_GENERATE: 'reports_generate',
  REPORTS_EXPORT: 'reports_export',
  
  // Configurações do sistema
  SYSTEM_SETTINGS: 'system_settings',
  SYSTEM_LOGS: 'system_logs',
  SYSTEM_BACKUP: 'system_backup',
  
  // Administração
  ADMIN_PANEL: 'admin_panel',
  SUBSCRIPTION_MANAGE: 'subscription_manage',
  BILLING_MANAGE: 'billing_manage'
} as const;

// Grupos de permissões por tipo de usuário
export const PERMISSION_GROUPS = {
  admin: [
    // Todas as permissões
    ...Object.values(PERMISSIONS)
  ],
  
  manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.STATISTICS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_CREATE,
    PERMISSIONS.SUPPLIERS_EDIT,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.PRICE_ANALYSIS_VIEW,
    PERMISSIONS.PRICE_ANALYSIS_CREATE,
    PERMISSIONS.PRICE_AVERAGES_VIEW,
    PERMISSIONS.PRICE_AVERAGES_CREATE,
    PERMISSIONS.SEARCH_PRODUCTS,
    PERMISSIONS.SEARCH_CHEAPEST,
    PERMISSIONS.SEARCH_OPTIMAL,
    PERMISSIONS.AI_DASHBOARD_VIEW,
    PERMISSIONS.AI_VALIDATE_LISTS,
    PERMISSIONS.AI_PRICE_ANALYSIS,
    PERMISSIONS.AI_MARKET_TRENDS,
    PERMISSIONS.AI_GENERATE_REPORTS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT
  ],
  
  user: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.STATISTICS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRICE_ANALYSIS_VIEW,
    PERMISSIONS.PRICE_AVERAGES_VIEW,
    PERMISSIONS.SEARCH_PRODUCTS,
    PERMISSIONS.SEARCH_CHEAPEST,
    PERMISSIONS.AI_DASHBOARD_VIEW,
    PERMISSIONS.AI_VALIDATE_LISTS,
    PERMISSIONS.REPORTS_VIEW
  ],
  
  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.STATISTICS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRICE_ANALYSIS_VIEW,
    PERMISSIONS.SEARCH_PRODUCTS,
    PERMISSIONS.REPORTS_VIEW
  ]
} as const;

// Planos de assinatura
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Básico',
    price: 29.90,
    features: [
      'Até 100 produtos',
      'Análise de preços básica',
      'Relatórios simples',
      'Suporte por email'
    ],
    permissions: PERMISSION_GROUPS.user
  },
  
  PREMIUM: {
    name: 'Premium',
    price: 59.90,
    features: [
      'Até 500 produtos',
      'Análise de preços avançada',
      'IA para validação',
      'Relatórios detalhados',
      'Suporte prioritário'
    ],
    permissions: PERMISSION_GROUPS.manager
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    price: 99.90,
    features: [
      'Produtos ilimitados',
      'Todas as funcionalidades de IA',
      'Relatórios personalizados',
      'API completa',
      'Suporte dedicado'
    ],
    permissions: PERMISSION_GROUPS.admin
  }
} as const;

// Durações de assinatura
export const SUBSCRIPTION_DURATIONS = [
  { value: 1, label: '1 Mês', discount: 0 },
  { value: 3, label: '3 Meses', discount: 5 },
  { value: 6, label: '6 Meses', discount: 10 },
  { value: 12, label: '1 Ano', discount: 20 }
] as const;

// Status de assinatura
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
} as const;

// Tipos de usuário
export const USER_TYPES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
} as const;

// Estados brasileiros
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

// Mapeamento de permissões para português
export const PERMISSION_LABELS = {
  // Dashboard e estatísticas
  [PERMISSIONS.DASHBOARD_VIEW]: 'Visualizar Dashboard',
  [PERMISSIONS.STATISTICS_VIEW]: 'Visualizar Estatísticas',
  [PERMISSIONS.ANALYTICS_VIEW]: 'Visualizar Análises',
  
  // Gerenciamento de usuários
  [PERMISSIONS.USERS_VIEW]: 'Visualizar Usuários',
  [PERMISSIONS.USERS_CREATE]: 'Criar Usuários',
  [PERMISSIONS.USERS_EDIT]: 'Editar Usuários',
  [PERMISSIONS.USERS_DELETE]: 'Excluir Usuários',
  [PERMISSIONS.USERS_MANAGE_PERMISSIONS]: 'Gerenciar Permissões',
  
  // Gerenciamento de fornecedores
  [PERMISSIONS.SUPPLIERS_VIEW]: 'Visualizar Fornecedores',
  [PERMISSIONS.SUPPLIERS_CREATE]: 'Criar Fornecedores',
  [PERMISSIONS.SUPPLIERS_EDIT]: 'Editar Fornecedores',
  [PERMISSIONS.SUPPLIERS_DELETE]: 'Excluir Fornecedores',
  
  // Gerenciamento de produtos
  [PERMISSIONS.PRODUCTS_VIEW]: 'Visualizar Produtos',
  [PERMISSIONS.PRODUCTS_CREATE]: 'Criar Produtos',
  [PERMISSIONS.PRODUCTS_EDIT]: 'Editar Produtos',
  [PERMISSIONS.PRODUCTS_DELETE]: 'Excluir Produtos',
  [PERMISSIONS.PRODUCTS_IMPORT]: 'Importar Produtos',
  [PERMISSIONS.PRODUCTS_EXPORT]: 'Exportar Produtos',
  
  // Análise de preços
  [PERMISSIONS.PRICE_ANALYSIS_VIEW]: 'Visualizar Análise de Preços',
  [PERMISSIONS.PRICE_ANALYSIS_CREATE]: 'Criar Análise de Preços',
  [PERMISSIONS.PRICE_AVERAGES_VIEW]: 'Visualizar Médias de Preço',
  [PERMISSIONS.PRICE_AVERAGES_CREATE]: 'Criar Médias de Preço',
  
  // Busca de produtos
  [PERMISSIONS.SEARCH_PRODUCTS]: 'Buscar Produtos',
  [PERMISSIONS.SEARCH_CHEAPEST]: 'Buscar Mais Barato',
  [PERMISSIONS.SEARCH_OPTIMAL]: 'Busca Otimizada',
  
  // Funcionalidades de IA
  [PERMISSIONS.AI_DASHBOARD_VIEW]: 'Visualizar Dashboard de IA',
  [PERMISSIONS.AI_VALIDATE_LISTS]: 'Validar Listas com IA',
  [PERMISSIONS.AI_PRICE_ANALYSIS]: 'Análise de Preços com IA',
  [PERMISSIONS.AI_MARKET_TRENDS]: 'Tendências de Mercado com IA',
  [PERMISSIONS.AI_GENERATE_REPORTS]: 'Gerar Relatórios com IA',
  
  // Relatórios
  [PERMISSIONS.REPORTS_VIEW]: 'Visualizar Relatórios',
  [PERMISSIONS.REPORTS_GENERATE]: 'Gerar Relatórios',
  [PERMISSIONS.REPORTS_EXPORT]: 'Exportar Relatórios',
  
  // Configurações do sistema
  [PERMISSIONS.SYSTEM_SETTINGS]: 'Configurações do Sistema',
  [PERMISSIONS.SYSTEM_LOGS]: 'Visualizar Logs do Sistema',
  [PERMISSIONS.SYSTEM_BACKUP]: 'Fazer Backup do Sistema',
  
  // Administração
  [PERMISSIONS.ADMIN_PANEL]: 'Painel Administrativo',
  [PERMISSIONS.SUBSCRIPTION_MANAGE]: 'Gerenciar Assinaturas',
  [PERMISSIONS.BILLING_MANAGE]: 'Gerenciar Cobrança'
} as const;