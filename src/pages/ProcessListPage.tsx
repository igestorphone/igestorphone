import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Upload, Bot, CheckCircle, AlertCircle, Plus, Users, Phone, Mail, MapPin, Download, ChevronDown, Brain, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const RAW_API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')
const API_BASE_URL = /\/api$/i.test(RAW_API_BASE) ? RAW_API_BASE : `${RAW_API_BASE}/api`

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export default function ProcessListPage() {
  const { user } = useAuthStore()
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [rawList, setRawList] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState(null)
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Debug: Verificar configuração da API ao carregar a página
  useEffect(() => {
    console.log('🔍 ProcessListPage - Configuração da API:')
    console.log('🔍 - VITE_API_URL:', import.meta.env.VITE_API_URL)
    console.log('🔍 - RAW_API_BASE:', RAW_API_BASE)
    console.log('🔍 - API_BASE_URL:', API_BASE_URL)
    console.log('🔍 - URL completa (validate-list):', buildApiUrl('/ai/validate-list'))
    
    if (!import.meta.env.VITE_API_URL) {
      console.warn('⚠️ AVISO: VITE_API_URL não está configurada! Usando padrão:', RAW_API_BASE)
    }
  }, [])
  const [newSupplier, setNewSupplier] = useState({
    nome: '',
    whatsapp: '',
    cidade: 'São Paulo'
  })

  // Debug removido - página funcionando
  
  // Estado local para fornecedores
  const [fornecedores, setFornecedores] = useState([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)

  // Carregar fornecedores do banco de dados (não do localStorage)
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setIsLoadingSuppliers(true)
        // Limpar cache do localStorage primeiro
        localStorage.removeItem('fornecedores')
        
        // Buscar fornecedores do banco de dados
        const authData = localStorage.getItem('auth-storage')
        if (!authData) {
          console.error('Token não encontrado')
          setFornecedores([])
          return
        }
        
        const token = JSON.parse(authData).state?.token
        if (!token) {
          console.error('Token inválido')
          setFornecedores([])
          return
        }

        const response = await fetch(buildApiUrl('/suppliers'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          // Não logar erro 404 silenciosamente, apenas se for outro erro
          if (response.status !== 404) {
            console.error('Erro ao buscar fornecedores:', response.status)
          }
          setFornecedores([])
          return
        }

        const data = await response.json()
        const suppliers = data.suppliers || data.data?.suppliers || data.data || []
        setFornecedores(suppliers)
        console.log('✅ Fornecedores carregados do banco:', suppliers.length)
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      setFornecedores([])
      } finally {
        setIsLoadingSuppliers(false)
    }
    }

    loadSuppliers()
  }, [])

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-white/70">Apenas administradores podem processar listas.</p>
        </div>
      </div>
    )
  }

  const handleProcessList = async () => {
    if (!selectedSupplier || !rawList.trim()) {
      alert('Selecione um fornecedor e cole a lista para processar.')
      return
    }

    console.log('🔍 ProcessList - Fornecedor selecionado:', selectedSupplier)
    console.log('🔍 ProcessList - Lista bruta (primeiras 5 linhas):', rawList.split('\n').slice(0, 5))
    
    setIsProcessing(true)
    
    try {
      // Processamento automático com IA
        const authData = localStorage.getItem('auth-storage')
        if (!authData) {
          throw new Error('Token não encontrado')
        }
        
        const token = JSON.parse(authData).state?.token
        if (!token) {
          throw new Error('Token inválido')
        }

      const apiUrl = buildApiUrl('/ai/validate-list')
      console.log('🔍 ProcessList - Enviando lista BRUTA para IA processar')
      console.log('🔍 ProcessList - URL da API:', apiUrl)
      console.log('🔍 ProcessList - Tamanho da lista:', rawList.length, 'caracteres')
      console.log('🔍 ProcessList - Primeiras linhas:', rawList.split('\n').slice(0, 5))
      console.log('🔍 ProcessList - Token disponível:', token ? 'Sim' : 'Não')

      // Enviar lista BRUTA para IA processar tudo
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ rawListText: rawList })
        })
      
      console.log('🔍 ProcessList - Response status:', response.status)
      console.log('🔍 ProcessList - Response ok:', response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ ProcessList - Erro na API:', response.status)
          console.error('❌ ProcessList - Error text:', errorText)
          console.error('❌ ProcessList - Response headers:', Object.fromEntries(response.headers.entries()))
          
          let errorMessage = 'Erro ao processar lista com IA'
          
          // Verificar se é erro 404 (endpoint não encontrado)
          if (response.status === 404) {
            errorMessage = 'Endpoint da API não encontrado.\n\n'
            errorMessage += `Verifique se o backend está rodando e a URL está correta:\n${apiUrl}\n\n`
            errorMessage += 'Se estiver em produção, verifique a variável de ambiente VITE_API_URL.'
          } else if (response.status === 500) {
            // Erro 500 (erro temporário da OpenAI)
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = 'Erro temporário no serviço de IA.\n\n'
              errorMessage += 'Por favor, tente novamente em alguns segundos.\n'
              errorMessage += 'Se o problema persistir, verifique se a lista contém produtos Apple válidos.'
              
              // Adicionar mensagem técnica apenas se disponível e relevante
              if (errorJson.error && !errorJson.error.includes('Request ID')) {
                const errorMsg = errorJson.error.split('request ID')[0].trim()
                if (errorMsg && errorMsg.length < 100) {
                  errorMessage += `\n\nDetalhes: ${errorMsg}`
                }
              }
            } catch (e) {
              errorMessage = 'Erro temporário no serviço de IA. Por favor, tente novamente em alguns segundos.'
            }
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = 'Erro de autenticação.\n\n'
            errorMessage += 'Por favor, faça login novamente.'
          } else {
            // Outros erros
            try {
              const errorJson = JSON.parse(errorText)
              if (errorJson.message) {
                errorMessage = errorJson.message
              }
              if (errorJson.error && !errorJson.error.includes('Request ID')) {
                const cleanError = errorJson.error.split('request ID')[0].trim()
                if (cleanError && cleanError.length < 150) {
                  errorMessage += `\n\n${cleanError}`
                }
              }
            } catch (e) {
              errorMessage += ` (Erro ${response.status})`
              if (errorText && errorText.length < 200) {
                errorMessage += `\n\n${errorText}`
              }
            }
          }
          
          throw new Error(errorMessage)
        }

        const validationResult = await response.json()
        console.log('🔍 ProcessList - Resultado da IA:', validationResult)
        
        // Processar resultados da IA
        const validProducts = validationResult.validation.validated_products || []
        console.log('🔍 ProcessList - Produtos validados pela IA:', validProducts.length)
        console.log('🔍 ProcessList - Primeiros produtos validados:', validProducts.slice(0, 3))
        
        if (validProducts.length === 0) {
          const errors = validationResult.validation?.errors || []
          const warnings = validationResult.validation?.warnings || []
          const suggestions = validationResult.validation?.suggestions || []
          
          // Verificar se é erro temporário da IA
          const isTemporaryError = errors.some(err => 
            err.includes('temporário') || 
            err.includes('temporariamente') || 
            err.includes('tente novamente')
          )
          
          let errorMessage = isTemporaryError 
            ? '⚠️ Erro temporário ao processar lista\n\n'
            : '⚠️ Nenhum produto válido encontrado na lista.\n\n'
          
          if (errors.length > 0) {
            errorMessage += `Erros:\n${errors.slice(0, 3).map(err => `• ${err}`).join('\n')}\n\n`
          }
          if (warnings.length > 0) {
            errorMessage += `Avisos:\n${warnings.slice(0, 2).map(warn => `• ${warn}`).join('\n')}\n\n`
          }
          if (suggestions.length > 0) {
            errorMessage += `${suggestions.slice(0, 2).map(sugg => `💡 ${sugg}`).join('\n')}\n\n`
          }
          
          if (!isTemporaryError) {
            errorMessage += 'Verifique se a lista contém produtos Apple válidos e tente novamente.'
          }
          
          alert(errorMessage)
          setIsProcessing(false)
          return
        }

        // Buscar informações do fornecedor selecionado
        const fornecedorSelecionado = fornecedores.find(f => f.id?.toString() === selectedSupplier || f.id === selectedSupplier)
        console.log('🔍 ProcessList - Fornecedor selecionado:', fornecedorSelecionado)
        console.log('🔍 ProcessList - selectedSupplier:', selectedSupplier)
        
        const supplierId = fornecedorSelecionado?.id || fornecedorSelecionado?.id?.toString() || null
        const supplierName = fornecedorSelecionado?.name || fornecedorSelecionado?.nome || 'Fornecedor'
        const supplierWhatsapp = fornecedorSelecionado?.whatsapp || fornecedorSelecionado?.contact_phone || ''

        // Salvar produtos validados no banco de dados
        console.log('🔍 ProcessList - Salvando produtos no banco de dados...')
        console.log('🔍 ProcessList - Fornecedor:', { supplierId, supplierName, supplierWhatsapp })
        console.log('🔍 ProcessList - Produtos validados:', validProducts.length)
        console.log('🔍 ProcessList - Primeiros produtos:', validProducts.slice(0, 3))
        
        const requestBody = {
          supplier_id: supplierId ? parseInt(supplierId) : undefined, // Enviar ID se disponível
          supplier_name: supplierName,
          supplier_whatsapp: supplierWhatsapp,
          validated_products: validProducts,
          raw_list_text: rawList
        }
        
        console.log('🔍 ProcessList - Request body:', {
          ...requestBody,
          validated_products: `${validProducts.length} produtos`,
          raw_list_text: `${rawList.length} caracteres`
        })
        
        const saveResponse = await fetch(buildApiUrl('/ai/process-list'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text()
          console.error('❌ ProcessList - Erro ao salvar produtos:', errorText)
          throw new Error(`Erro ao salvar produtos: ${saveResponse.status}`)
        }

        const saveResult = await saveResponse.json()
        console.log('🔍 ProcessList - Resposta do servidor:', saveResult)
        console.log('🔍 ProcessList - Produtos salvos:', saveResult.summary?.saved_products || 0)
        console.log('🔍 ProcessList - Erros:', saveResult.summary?.errors || 0)
        if (saveResult.errors && saveResult.errors.length > 0) {
          console.error('🔍 ProcessList - Erros detalhados:', saveResult.errors)
        }

        const totalProdutos = validProducts.length
        const produtosValidos = saveResult.summary?.saved_products || validProducts.length
        const produtosInvalidos = 0 // A IA já filtra apenas produtos válidos
        const precoMedio = saveResult.summary?.average_price || (validProducts.length > 0 
          ? validProducts.reduce((sum, p) => sum + p.price, 0) / validProducts.length 
          : 0)

        const processedData = {
          id: Date.now().toString(),
          fornecedor: supplierName,
          fornecedorId: saveResult.supplier_id || selectedSupplier,
          totalProdutos,
          produtosValidos,
          produtosInvalidos,
          precoMedio: Math.round(precoMedio),
          produtos: [],
          produtosValidadosIA: validProducts.map((produto, index) => ({
            id: (index + 1).toString(),
            nome: produto.name,
            modelo: produto.model || '',
            cor: produto.color || '',
            armazenamento: produto.storage || '',
            condicao: produto.condition?.toLowerCase() || 'novo',
            preco: produto.price,
            disponivel: true,
            observacoes: `Validado pela IA - ${produto.model || 'Modelo não especificado'}`,
            nomeCompleto: `${produto.name} ${produto.model || ''} ${produto.color || ''} ${produto.storage || ''}`.trim()
          })),
          aiValidation: validationResult.validation,
          errors: validationResult.validation.errors || [],
          warnings: validationResult.validation.warnings || [],
          suggestions: validationResult.validation.suggestions || [],
          dataProcessamento: new Date().toISOString(),
          listaOriginal: rawList,
          modo: 'ai'
        }

        // Salvar no localStorage
        const existingProcessamentos = JSON.parse(localStorage.getItem('processamentos') || '[]')
        existingProcessamentos.unshift(processedData)
        localStorage.setItem('processamentos', JSON.stringify(existingProcessamentos))

        // Recarregar fornecedores do banco de dados após salvar
        const suppliersResponse = await fetch(buildApiUrl('/suppliers'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json()
          const suppliers = suppliersData.suppliers || suppliersData.data?.suppliers || suppliersData.data || []
          setFornecedores(suppliers)
        }

        setProcessedData(processedData)
        alert(`✅ Lista processada com IA!\n\n📊 Resumo:\n• Total de produtos: ${totalProdutos}\n• Produtos válidos: ${produtosValidos}\n• Produtos salvos: ${saveResult.summary?.saved_products || 0}\n• Produtos inválidos: ${produtosInvalidos}\n• Preço médio: R$ ${Math.round(precoMedio)}\n\n✅ A lista foi salva no banco de dados e alimentará o sistema de busca e médias.`)
    } catch (error) {
      console.error('❌ Erro no processamento:', error)
      console.error('❌ Erro completo:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // Detectar tipo de erro
      let errorMessage = 'Erro ao processar lista.\n\n'
      
      // Erro de conexão/rede
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
        errorMessage = '❌ Erro de conexão com o servidor.\n\n'
        errorMessage += 'Verifique:\n'
        errorMessage += '• Se o backend está rodando\n'
        errorMessage += '• Se a URL da API está correta\n'
        errorMessage += `• URL atual: ${buildApiUrl('/ai/validate-list')}\n\n`
        errorMessage += 'Se estiver em produção, verifique se:\n'
        errorMessage += '• A variável de ambiente VITE_API_URL está configurada corretamente\n'
        errorMessage += '• O backend está deployado e acessível\n'
      } else if (error.message) {
        errorMessage += `Detalhes: ${error.message}\n\n`
      }
      
      // Adicionar instruções gerais
      if (!errorMessage.includes('Erro de conexão')) {
        errorMessage += 'Verifique:\n'
        errorMessage += '• Se a chave da API da OpenAI está configurada\n'
        errorMessage += '• Se o backend está rodando\n'
        errorMessage += '• Se você tem permissões de administrador\n'
      }
      
      errorMessage += '\nConsulte o console do navegador (F12) para mais detalhes.'
      
      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateSupplier = async () => {
    if (!newSupplier.nome || !newSupplier.whatsapp) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }
    
    try {
      // Buscar token
      const authData = localStorage.getItem('auth-storage')
      if (!authData) {
        throw new Error('Token não encontrado')
      }
      
      const token = JSON.parse(authData).state?.token
      if (!token) {
        throw new Error('Token inválido')
      }

      // Criar fornecedor no banco de dados via API
      const response = await fetch(buildApiUrl('/suppliers'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSupplier.nome,
          whatsapp: newSupplier.whatsapp,
          contact_phone: newSupplier.whatsapp,
          city: newSupplier.cidade,
          is_active: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao criar fornecedor: ${response.status} - ${errorText}`)
      }

      const newSupplierData = await response.json()
      console.log('✅ Fornecedor criado no banco:', newSupplierData)

      // Recarregar fornecedores do banco de dados
      const suppliersResponse = await fetch(buildApiUrl('/suppliers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json()
        const suppliers = suppliersData.suppliers || suppliersData.data?.suppliers || suppliersData.data || []
        setFornecedores(suppliers)
      }
    
    // Reset form
    setNewSupplier({
      nome: '',
      whatsapp: '',
      cidade: 'São Paulo'
    })
    setShowCreateSupplier(false)
      alert('✅ Fornecedor criado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao criar fornecedor:', error)
      alert(`Erro ao criar fornecedor: ${error.message}`)
    }
  }

  const handleExportProcessedData = () => {
    if (!processedData) return
    
    const csvContent = [
      ['Produto', 'Preço', 'Condição', 'Disponível', 'Observações'],
      ...processedData.produtos.map(produto => [
        produto.nome,
        `R$ ${produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        produto.condicao,
        produto.disponivel ? 'Sim' : 'Não',
        produto.observacoes
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lista-processada-${processedData.fornecedor}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-2">Processar Lista Apple</h1>
          <p className="text-white/70">Cole a lista do fornecedor e a IA processará automaticamente todos os produtos Apple</p>
          <p className="text-white/50 text-sm mt-2">O status de processamento é resetado automaticamente às 00h</p>
        </div>
      </motion.div>

      {/* Step 1: Selecionar Fornecedor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">1. Selecionar Fornecedor</h2>
          <motion.button
            onClick={() => setShowCreateSupplier(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Fornecedor</span>
          </motion.button>
        </div>

        {/* Dropdown de Fornecedores */}
        <div className="relative mb-4">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-left text-white hover:bg-white/15 transition-colors flex items-center justify-between"
          >
            <span className="flex items-center space-x-2">
              {isLoadingSuppliers ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : selectedSupplier ? (
                (() => {
                  const fornecedor = fornecedores.find(f => f.id?.toString() === selectedSupplier || f.id === selectedSupplier)
                  return (
                    <>
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{fornecedor?.name || fornecedor?.nome || 'Selecione um fornecedor'}</span>
                    </>
                  )
                })()
              ) : (
                <span className="text-white/70">Selecione um fornecedor</span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/98 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
              {fornecedores.length === 0 ? (
                <div className="p-4 text-white/70 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-white/40" />
                  <p>Nenhum fornecedor cadastrado</p>
                  <p className="text-sm mt-1">Clique em "Cadastrar Fornecedor" para adicionar</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {fornecedores.map((fornecedor) => {
                    const isSelected = selectedSupplier === fornecedor.id?.toString() || selectedSupplier === fornecedor.id
                    const whatsapp = fornecedor.whatsapp || fornecedor.contact_phone
                    const cidade = fornecedor.city || fornecedor.cidade
                    const totalProducts = fornecedor.product_count || fornecedor.total_products || fornecedor.totalProdutos || 0
                    
                    // Verificar se foi processado hoje
                    const processedToday = fornecedor.processed_today === true || fornecedor.processed_today === 'true' || fornecedor.processed_today === true
                    const lastProcessedAt = fornecedor.last_processed_at
                    const productsProcessedToday = parseInt(fornecedor.products_processed_today || 0)
                    
                    // Formatar data do último processamento
                    let lastProcessedText = ''
                    if (lastProcessedAt) {
                      try {
                        const lastProcessed = new Date(lastProcessedAt)
                        const now = new Date()
                        const diffMs = now.getTime() - lastProcessed.getTime()
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                        
                        if (processedToday) {
                          if (diffHours < 1) {
                            if (diffMinutes < 1) {
                              lastProcessedText = 'há menos de 1 min'
                            } else if (diffMinutes === 1) {
                              lastProcessedText = 'há 1 min'
                            } else {
                              lastProcessedText = `há ${diffMinutes} min`
                            }
                          } else if (diffHours === 1) {
                            lastProcessedText = 'há 1h'
                          } else {
                            lastProcessedText = `há ${diffHours}h`
                          }
                        } else {
                          lastProcessedText = `em ${lastProcessed.toLocaleDateString('pt-BR')}`
                        }
                      } catch (e) {
                        lastProcessedText = ''
                      }
                    }
                    
                    return (
                  <button
                    key={fornecedor.id}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const supplierId = fornecedor.id?.toString() || String(fornecedor.id || '')
                          if (supplierId) {
                            setSelectedSupplier(supplierId)
                      setIsDropdownOpen(false)
                          }
                        }}
                        className={`w-full p-4 text-left transition-colors ${
                          isSelected 
                            ? 'bg-blue-500/20 border-l-4 border-blue-500' 
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white truncate">{fornecedor.name || fornecedor.nome}</span>
                              {isSelected && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      </div>
                            
                            {/* Informações do fornecedor */}
                            <div className="flex flex-wrap items-center gap-2 text-sm text-white/60 mb-2">
                              {whatsapp && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span className="truncate">{whatsapp}</span>
                                </span>
                              )}
                              {cidade && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{cidade}</span>
                                </span>
                              )}
                              {totalProducts > 0 && (
                                <span className="text-white/50">
                                  {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'}
                                </span>
                              )}
                    </div>
                            
                            {/* Status de processamento */}
                            {processedToday ? (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2.5 py-1 rounded-md text-xs font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Processado hoje</span>
                                </span>
                                {lastProcessedText && (
                                  <span className="text-xs text-green-400/80">
                                    {lastProcessedText}
                                  </span>
                                )}
                                {productsProcessedToday > 0 && (
                                  <span className="text-xs text-green-400/80 font-medium">
                                    • {productsProcessedToday} {productsProcessedToday === 1 ? 'produto' : 'produtos'} processados
                                  </span>
                                )}
                              </div>
                            ) : lastProcessedAt ? (
                              <div className="mt-2">
                                <span className="text-xs text-white/50">
                                  Último processamento: {lastProcessedText}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <span className="text-xs text-yellow-400/70">
                                  Ainda não processado hoje
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                  </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Fornecedor Selecionado - Card */}
        {selectedSupplier && !isDropdownOpen && (() => {
          const fornecedorSelecionado = fornecedores.find(f => f.id?.toString() === selectedSupplier || f.id === selectedSupplier)
          if (!fornecedorSelecionado) return null
          
          const whatsapp = fornecedorSelecionado.whatsapp || fornecedorSelecionado.contact_phone
          const cidade = fornecedorSelecionado.city || fornecedorSelecionado.cidade
          const totalProducts = fornecedorSelecionado.product_count || fornecedorSelecionado.total_products || fornecedorSelecionado.totalProdutos || 0
          const processedToday = fornecedorSelecionado.processed_today === true || fornecedorSelecionado.processed_today === 'true' || fornecedorSelecionado.processed_today === true
          const lastProcessedAt = fornecedorSelecionado.last_processed_at
          const productsProcessedToday = parseInt(fornecedorSelecionado.products_processed_today || 0)
          
          // Formatar data do último processamento
          let lastProcessedText = ''
          if (lastProcessedAt) {
            try {
              const lastProcessed = new Date(lastProcessedAt)
              const now = new Date()
              const diffMs = now.getTime() - lastProcessed.getTime()
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
              
              if (processedToday) {
                if (diffHours < 1) {
                  if (diffMinutes < 1) {
                    lastProcessedText = 'há menos de 1 min'
                  } else if (diffMinutes === 1) {
                    lastProcessedText = 'há 1 min'
                  } else {
                    lastProcessedText = `há ${diffMinutes} min`
                  }
                } else if (diffHours === 1) {
                  lastProcessedText = 'há 1h'
                } else {
                  lastProcessedText = `há ${diffHours}h`
                }
              } else {
                lastProcessedText = `em ${lastProcessed.toLocaleDateString('pt-BR')}`
              }
            } catch (e) {
              lastProcessedText = ''
            }
          }
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white text-lg truncate">
                        {fornecedorSelecionado.name || fornecedorSelecionado.nome}
                      </h4>
                      {processedToday && (
                        <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          <span>Processado hoje</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {cidade && (
                        <span className="text-white/70 text-sm flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{cidade}</span>
                        </span>
                      )}
                      {whatsapp && (
                        <span className="text-white/70 text-sm flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{whatsapp}</span>
                        </span>
                      )}
                      {totalProducts > 0 && (
                        <span className="text-blue-400 text-sm font-medium">
                          {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'} cadastrados
                        </span>
                      )}
                    </div>
                    {processedToday && (
                      <div className="flex items-center gap-2 text-sm">
                        {lastProcessedText && (
                          <span className="text-green-400/80">
                            {lastProcessedText}
                          </span>
                        )}
                        {productsProcessedToday > 0 && (
                          <span className="text-green-400/80 font-medium">
                            • {productsProcessedToday} {productsProcessedToday === 1 ? 'produto' : 'produtos'} processados hoje
                          </span>
                        )}
                      </div>
                    )}
                    {!processedToday && lastProcessedAt && (
                      <div className="text-sm text-white/50">
                        Último processamento: {lastProcessedText}
                      </div>
                    )}
                    {!processedToday && !lastProcessedAt && (
                      <div className="text-sm text-yellow-400/70">
                        Ainda não processado hoje
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSupplier('')
                    setIsDropdownOpen(false)
                  }}
                  className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                  title="Remover seleção"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )
        })()}
      </motion.div>

      {/* Step 2: Colar Lista */}
      {selectedSupplier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">2. Colar Lista do Fornecedor</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Cole aqui a lista completa do fornecedor. A IA processará automaticamente todos os produtos Apple.
              </label>
              <textarea
                value={rawList}
                onChange={(e) => setRawList(e.target.value)}
                placeholder="Exemplo:&#10;R$1950&#10;AIRPODS PRO 02 R$1150&#10;PENCIL USBC R$600&#10;iPhone 17 Pro Max 256GB Azul R$ 4.500,00&#10;Apple Watch Series 9 45mm Preto R$ 2.800,00&#10;&#10;A IA identificará automaticamente: cores, GB, tamanhos (MM), preços, condições, etc."
                className="w-full h-48 p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">
                {rawList.length} caracteres
              </div>
              <motion.button
                onClick={handleProcessList}
                disabled={!rawList.trim() || isProcessing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${
                  !rawList.trim() || isProcessing
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando com IA...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Processar Lista</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 4: Resultados do Processamento */}
      {processedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Resultados do Processamento</h2>
            <motion.button
              onClick={handleExportProcessedData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Dados</span>
            </motion.button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-white">{processedData.totalProdutos}</h3>
              <p className="text-white/70">Total de Produtos</p>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-white">{processedData.produtosValidos}</h3>
              <p className="text-white/70">Produtos Válidos</p>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-white">{processedData.produtosInvalidos}</h3>
              <p className="text-white/70">Produtos Inválidos</p>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
              <h3 className="text-2xl font-bold text-white">
                R$ {processedData.precoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-white/70">Preço Médio</p>
            </div>
          </div>

          {/* Insights da IA */}
          {(processedData.errors?.length > 0 || processedData.warnings?.length > 0 || processedData.suggestions?.length > 0) && (
            <div className="mb-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2 text-purple-400" />
                Análise da IA
              </h3>
              
              {/* Erros */}
              {processedData.errors?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Erros Encontrados ({processedData.errors.length})
                  </h4>
                  <ul className="space-y-1">
                    {processedData.errors.map((error, index) => (
                      <li key={index} className="text-red-300 text-sm">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Avisos */}
              {processedData.warnings?.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Avisos ({processedData.warnings.length})
                  </h4>
                  <ul className="space-y-1">
                    {processedData.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-300 text-sm">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sugestões */}
              {processedData.suggestions?.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sugestões da IA ({processedData.suggestions.length})
                  </h4>
                  <ul className="space-y-1">
                    {processedData.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-blue-300 text-sm">• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Lista de Produtos Processados */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">Produtos Processados:</h3>
            {processedData.produtos.map((produto, index) => (
              <motion.div
                key={produto.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{produto.nome}</h4>
                    <div className="flex items-center space-x-4 text-white/70 text-sm mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        produto.condicao === 'lacrado' ? 'bg-green-500/20 text-green-400' :
                        produto.condicao === 'seminovo' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {produto.condicao}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        produto.disponivel ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {produto.disponivel ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs mt-1">{produto.observacoes}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center text-white/70 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                      Validado pela IA
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal para Cadastrar Fornecedor */}
      {showCreateSupplier && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Cadastrar Novo Fornecedor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Nome do Fornecedor *</label>
                <input
                  type="text"
                  value={newSupplier.nome}
                  onChange={(e) => setNewSupplier({...newSupplier, nome: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: TechStore SP"
                />
              </div>
              
              
              <div>
                <label className="block text-white/70 text-sm mb-2">WhatsApp *</label>
                <input
                  type="text"
                  value={newSupplier.whatsapp}
                  onChange={(e) => setNewSupplier({...newSupplier, whatsapp: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">Cidade</label>
                <input
                  type="text"
                  value={newSupplier.cidade}
                  onChange={(e) => setNewSupplier({...newSupplier, cidade: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="São Paulo"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateSupplier(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSupplier}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Cadastrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}