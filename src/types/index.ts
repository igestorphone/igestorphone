// Enums
export enum TipoUsuario {
  ADMIN = 'admin',
  USUARIO = 'usuario'
}

export enum StatusAssinatura {
  ATIVA = 'ativa',
  EXPIRADA = 'expirada',
  CANCELADA = 'cancelada',
  TRIAL = 'trial'
}

export enum CondicaoProduto {
  LACRADO = 'lacrado',
  SEMINOVO = 'seminovo'
}

// Interfaces principais
export interface Assinatura {
  id: string;
  planoId: string;
  nomePlano: string;
  preco: number;
  dataInicio: Date;
  dataFim: Date;
  status: StatusAssinatura;
  metodoPagamento?: string;
  proximaRenovacao?: Date;
}

export interface UserPermissions {
  canViewSuppliers: boolean;
  canViewStatistics: boolean;
  canSearchCheapest: boolean;
  canProcessLists: boolean;
  canManageUsers: boolean;
  canAccessAdmin: boolean;
  canViewDatabase: boolean;
  canSendMessages: boolean;
  canManageSuppliers: boolean;
  canViewPriceAverages: boolean;
  canConsultLists: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  avatar?: string;
  dataCriacao: Date;
  ultimoLogin: Date;
  tipo: TipoUsuario;
  assinatura?: Assinatura;
  isAtivo: boolean;
  token?: string;
  permissoes: UserPermissions;
}

export interface Produto {
  id: string;
  nome: string;
  modelo: string;
  capacidade: string;
  preco: number;
  condicao: CondicaoProduto;
  observacoes?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  whatsapp: string;
  produtos: Produto[];
  ultimaAtualizacao: Date;
}

export interface ProdutoEnvio {
  id: string;
  produto: Produto;
  fornecedor: Fornecedor;
  precoEnvio: number;
  dataEnvio: Date;
  status: 'pendente' | 'enviado' | 'entregue' | 'cancelado';
}

// Interfaces de API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: Usuario;
    token: string;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface StatisticsResponse {
  totalFornecedores: number;
  totalProdutos: number;
  precoMedio: number;
  produtosPorFornecedor: Array<{
    fornecedorId: string;
    fornecedorNome: string;
    quantidade: number;
  }>;
  produtosPorCondicao: Array<{
    condicao: CondicaoProduto;
    quantidade: number;
  }>;
}

export interface ProcessamentoListaRequest {
  fornecedorId: string;
  lista: string;
}

export interface ProcessamentoListaResponse {
  success: boolean;
  data: {
    totalItens: number;
    itensValidos: number;
    itensInvalidos: number;
    precoMedio: number;
    detalhes: Array<{
      item: string;
      valido: boolean;
      motivo?: string;
    }>;
  };
  message?: string;
}

export interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
  permissoes: Partial<UserPermissions>;
}

export interface UpdateUserRequest {
  nome?: string;
  email?: string;
  tipo?: TipoUsuario;
  permissoes: Partial<UserPermissions>;
}

export interface CreateFornecedorRequest {
  nome: string;
  whatsapp: string;
  email?: string;
  cidade?: string;
  observacoes?: string;
}

export interface UpdateFornecedorRequest {
  nome?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface SearchCheapestRequest {
  modelo: string;
  capacidade?: string;
  condicao?: CondicaoProduto;
}

export interface SearchCheapestResponse {
  success: boolean;
  data: Array<{
    fornecedor: Fornecedor;
    produto: Produto;
    preco: number;
    diferenca: number;
  }>;
  message?: string;
}

export interface PriceAverageRequest {
  modelo: string;
  capacidade?: string;
  condicao?: CondicaoProduto;
}

export interface PriceAverageResponse {
  success: boolean;
  data: {
    modelo: string;
    precoMedio: number;
    quantidade: number;
    fornecedores: Array<{
      fornecedor: Fornecedor;
      preco: number;
      diferenca: number;
    }>;
  };
  message?: string;
}

export interface OutsideSPRequest {
  modelo: string;
  capacidade?: string;
  condicao?: CondicaoProduto;
  valorFrete?: number;
}

export interface OutsideSPResponse {
  success: boolean;
  data: Array<{
    fornecedor: Fornecedor;
    produto: Produto;
    precoOriginal: number;
    precoComFrete: number;
    valorFrete: number;
  }>;
  message?: string;
}

// Interfaces de notificação
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Interfaces de configuração
export interface AppConfig {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  dashboard: {
    defaultView: 'grid' | 'list';
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

// Interfaces de relatório
export interface RelatorioRequest {
  tipo: 'fornecedores' | 'produtos' | 'vendas' | 'estatisticas';
  periodo: {
    inicio: Date;
    fim: Date;
  };
  filtros?: {
    fornecedorId?: string;
    condicao?: CondicaoProduto;
    precoMin?: number;
    precoMax?: number;
  };
  formato: 'pdf' | 'excel' | 'csv';
}

export interface RelatorioResponse {
  success: boolean;
  data: {
    url: string;
    nomeArquivo: string;
    tamanho: number;
    dataGeracao: Date;
  };
  message?: string;
}