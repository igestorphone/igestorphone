// Mock data para o frontend funcionar sem backend
export const mockUsers = [
  {
    id: '1',
    nome: 'Administrador',
    email: 'admin@igestorphone.com',
    tipo: 'admin',
    ativo: true,
    ultimoLogin: new Date().toISOString(),
    dataCriacao: new Date().toISOString(),
    isAtivo: true,
    permissoes: {
      canManageUsers: true,
      canManageSuppliers: true,
      canProcessLists: true,
      canViewStatistics: true,
      canViewSuppliers: true,
      canSearchCheapest: true,
      canViewPriceAverages: true,
      canConsultLists: true,
      canAccessAdmin: true,
      canViewDatabase: true,
      canSendMessages: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    nome: 'Usuário Teste',
    email: 'usuario@igestorphone.com',
    tipo: 'usuario',
    ativo: true,
    ultimoLogin: new Date().toISOString(),
    dataCriacao: new Date().toISOString(),
    isAtivo: true,
    permissoes: {
      canManageUsers: false,
      canManageSuppliers: true,
      canProcessLists: true,
      canViewStatistics: true,
      canViewSuppliers: true,
      canSearchCheapest: true,
      canViewPriceAverages: true,
      canConsultLists: true,
      canAccessAdmin: false,
      canViewDatabase: false,
      canSendMessages: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const mockFornecedores = []

export const mockStatistics = {
  totalFornecedores: 0,
  totalProdutos: 0,
  precoMedio: 0,
  totalProcessamentos: 0,
  fornecedoresAtivos: 0,
  produtosAtivos: 0,
  ultimaAtualizacao: new Date().toISOString(),
  mediaIPhone: 0,
  totalIPhones: 0,
  totalSamsungs: 0
}

export const mockIPhones = []

export const mockWhatsapp = {
  numero: '',
  mensagem: 'Nenhum produto encontrado para enviar.'
}

export const mockProcessamentos = []
