import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Upload, Bot, CheckCircle, AlertCircle, Plus, Users, Phone, Mail, MapPin, Download, ChevronDown, Brain, X, Search, RefreshCw, AlertTriangle, Apple, Smartphone, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const RAW_API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')
const API_BASE_URL = /\/api$/i.test(RAW_API_BASE) ? RAW_API_BASE : `${RAW_API_BASE}/api`

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

type ListType = 'lacrada' | 'seminovo' | 'android'

export default function ProcessListPage({ initialListType }: { initialListType?: ListType }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const modeFromUrl = searchParams.get('mode') as ListType | null
  const urlModeValid = modeFromUrl === 'lacrada' || modeFromUrl === 'seminovo' || modeFromUrl === 'android'
  const [listType, setListType] = useState<ListType>(() =>
    initialListType ?? (urlModeValid ? modeFromUrl! : 'lacrada')
  )

  const setListMode = (mode: ListType) => {
    setListType(mode)
    setSearchParams({ mode }, { replace: true })
  }

  const { user } = useAuthStore()
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [rawList, setRawList] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState(null)
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')

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
  
  // Filtrar e ordenar fornecedores
  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = [...fornecedores]
    
    // Filtrar por busca
    if (supplierSearch.trim()) {
      const searchLower = supplierSearch.toLowerCase()
      filtered = filtered.filter(f => {
        const name = (f.name || f.nome || '').toLowerCase()
        const whatsapp = (f.whatsapp || f.contact_phone || '').toLowerCase()
        const cidade = (f.city || f.cidade || '').toLowerCase()
        return name.includes(searchLower) || whatsapp.includes(searchLower) || cidade.includes(searchLower)
      })
    }
    
    // Ordenar: não processados hoje primeiro, depois processados no final (ordem alfabética dentro de cada grupo)
    filtered.sort((a, b) => {
      const aProcessedToday = a.processed_today === true || a.processed_today === 'true'
      const bProcessedToday = b.processed_today === true || b.processed_today === 'true'
      
      // Se um foi processado hoje e o outro não, o não processado vem primeiro
      if (aProcessedToday && !bProcessedToday) return 1
      if (!aProcessedToday && bProcessedToday) return -1
      
      // Dentro do mesmo grupo (processados ou não processados), ordenar por nome
      const aName = (a.name || a.nome || '').toLowerCase()
      const bName = (b.name || b.nome || '').toLowerCase()
      return aName.localeCompare(bName, 'pt-BR')
    })
    
    return filtered
  }, [fornecedores, supplierSearch])


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

  const [isZeroing, setIsZeroing] = useState(false)
  const [isRollingYesterday, setIsRollingYesterday] = useState(false)

  const handleRollYesterdayToToday = async () => {
    if (
      !confirm(
        'Usar estoque de ONTEM em HOJE?\n\n• Desativa produtos processados hoje (dia ruim do WPP)\n• Promove listas de ontem para aparecer na busca\n\nAmanhã de manhã use "Zerar estoque" antes das listas novas.'
      )
    ) {
      return
    }

    setIsRollingYesterday(true)
    try {
      const authData = localStorage.getItem('auth-storage')
      if (!authData) throw new Error('Token não encontrado')

      const token = JSON.parse(authData).state?.token
      if (!token) throw new Error('Token inválido')

      const response = await fetch(buildApiUrl('/products/roll-yesterday-to-today'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deactivateToday: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao promover estoque de ontem')
      }

      const result = await response.json()
      alert(
        `✅ Estoque de ontem ativo em "Hoje"!\n\n• Hoje desativados: ${result.deactivatedToday}\n• Promovidos de ontem: ${result.rolled}\n• Fornec. na busca: ${result.suppliersToday}\n• Produtos na busca: ${result.productsToday}\n\nCards do topo: 102 fornec. / 5138 produtos (após deploy).`
      )
    } catch (error: any) {
      console.error('Erro roll-yesterday:', error)
      alert(`❌ Erro: ${error.message}`)
    } finally {
      setIsRollingYesterday(false)
    }
  }

  const handleZeroAllProducts = async () => {
    if (!confirm('⚠️ Zerar TODO o estoque ativo?\n\nOs produtos somem da busca até você processar as listas de novo.')) {
      return
    }

    setIsZeroing(true)
    try {
      const authData = localStorage.getItem('auth-storage')
      if (!authData) throw new Error('Token não encontrado')

      const token = JSON.parse(authData).state?.token
      if (!token) throw new Error('Token inválido')

      const response = await fetch(buildApiUrl('/products/zero-all-products'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao zerar produtos')
      }

      const result = await response.json()
      alert(`✅ Estoque zerado!\n\n• ${result.deactivated} produto(s) desativado(s)\n• Ativos agora: ${result.statistics?.active ?? 0}`)
    } catch (error: any) {
      console.error('Erro ao zerar produtos:', error)
      alert(`❌ Erro ao zerar produtos: ${error.message}`)
    } finally {
      setIsZeroing(false)
    }
  }

  // Função para restaurar produtos de hoje (emergência)
  const [isRestoring, setIsRestoring] = useState(false)
  const handleRestoreTodayProducts = async () => {
    if (
      !confirm(
        '⚠️ RESTAURAR estoque de hoje?\n\nUse AGORA se zerou o estoque ou o WPP falhou — reativa tudo que foi desativado hoje e volta a busca.'
      )
    ) {
      return
    }

    setIsRestoring(true)
    try {
      const authData = localStorage.getItem('auth-storage')
      if (!authData) throw new Error('Token não encontrado')
      
      const token = JSON.parse(authData).state?.token
      if (!token) throw new Error('Token inválido')

      const response = await fetch(buildApiUrl('/products/restore-today-emergency'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao restaurar produtos')
      }

      const result = await response.json()
      alert(`✅ ${result.restored} produtos de hoje restaurados com sucesso!\n\n📊 Estatísticas:\n- Produtos ativos hoje: ${result.statistics.active_today}\n- Produtos inativos hoje: ${result.statistics.inactive_today}`)
      
      // Recarregar página após 2 segundos para mostrar produtos restaurados
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao restaurar produtos:', error)
      alert(`❌ Erro ao restaurar produtos: ${error.message}`)
    } finally {
      setIsRestoring(false)
    }
  }

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

      // Enviar lista BRUTA para IA processar (list_type: lacrada | seminovo | android)
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ rawListText: rawList, list_type: listType })
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
        console.log('🔍 ProcessList - Validation object completo:', JSON.stringify(validationResult.validation, null, 2))
        
        // Processar resultados da IA
        const validProducts = validationResult.validation?.validated_products || []
        const errors = validationResult.validation?.errors || []
        const warnings = validationResult.validation?.warnings || []
        const suggestions = validationResult.validation?.suggestions || []
        
        console.log('🔍 ProcessList - Produtos validados pela IA:', validProducts.length)
        console.log('🔍 ProcessList - Erros:', errors)
        console.log('🔍 ProcessList - Avisos:', warnings)
        console.log('🔍 ProcessList - Sugestões:', suggestions)
        console.log('🔍 ProcessList - Primeiros produtos validados:', validProducts.slice(0, 3))
        
        if (validProducts.length === 0) {
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
            errorMessage += `Erros:\n${errors.slice(0, 5).map(err => `• ${err}`).join('\n')}\n\n`
          } else {
            errorMessage += `A IA processou a lista mas não encontrou produtos Apple válidos.\n\n`
          }
          
          if (warnings.length > 0) {
            errorMessage += `Avisos:\n${warnings.slice(0, 3).map(warn => `• ${warn}`).join('\n')}\n\n`
          }
          
          if (suggestions.length > 0) {
            errorMessage += `Sugestões:\n${suggestions.slice(0, 3).map(sugg => `💡 ${sugg}`).join('\n')}\n\n`
          } else {
            errorMessage += `💡 Verifique se a lista contém produtos Apple válidos (iPhone, iPad, MacBook, AirPods, etc.)\n`
            errorMessage += `💡 Certifique-se de que os produtos têm preços especificados\n\n`
          }
          
          if (!isTemporaryError) {
            errorMessage += 'Dica: Certifique-se de que a lista contém apenas produtos Apple com preços claramente especificados.'
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
          supplier_id: supplierId ? parseInt(supplierId) : undefined,
          supplier_name: supplierName,
          supplier_whatsapp: supplierWhatsapp,
          validated_products: validProducts,
          raw_list_text: rawList,
          list_type: listType
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

        // Dados completos para uso imediato (não salvar no localStorage)
        const processedDataFull = {
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

        // Versão otimizada para localStorage (apenas dados essenciais)
        const processedDataOptimized = {
          id: processedDataFull.id,
          fornecedor: supplierName,
          fornecedorId: saveResult.supplier_id || selectedSupplier,
          totalProdutos,
          produtosValidos,
          produtosInvalidos,
          precoMedio: Math.round(precoMedio),
          produtosSalvos: saveResult.summary?.saved_products || 0,
          dataProcessamento: new Date().toISOString(),
          modo: 'ai',
          // Apenas contadores de erros/warnings (não os textos completos)
          totalErrors: validationResult.validation.errors?.length || 0,
          totalWarnings: validationResult.validation.warnings?.length || 0,
          totalSuggestions: validationResult.validation.suggestions?.length || 0,
          listaOriginalLength: rawList.length
        }

        // Salvar no localStorage com limite otimizado e tratamento de erro
        try {
          const existingProcessamentos = JSON.parse(localStorage.getItem('processamentos') || '[]')
          
          // Adicionar novo processamento no início
          existingProcessamentos.unshift(processedDataOptimized)
          
          // Limitar a 200 processamentos mais recentes (suficiente para ~2 dias de trabalho)
          // Como os dados estão otimizados, 200 cabe facilmente no localStorage
          const limitedProcessamentos = existingProcessamentos.slice(0, 200)
          
          // Tentar salvar
          localStorage.setItem('processamentos', JSON.stringify(limitedProcessamentos))
          console.log('✅ Processamento salvo no localStorage (otimizado)')
        } catch (storageError: any) {
          // Se der erro de quota, tentar reduzir para 100 e depois 50
          if (storageError.message?.includes('quota') || storageError.message?.includes('QuotaExceededError')) {
            console.warn('⚠️ Quota do localStorage excedida. Tentando reduzir histórico...')
            try {
              const existingProcessamentos = JSON.parse(localStorage.getItem('processamentos') || '[]')
              existingProcessamentos.unshift(processedDataOptimized)
              
              // Tentar com 100 primeiro
              try {
                const reduced100 = existingProcessamentos.slice(0, 100)
                localStorage.setItem('processamentos', JSON.stringify(reduced100))
                console.log('✅ Processamento salvo com histórico reduzido para 100')
              } catch {
                // Se ainda der erro, tentar com 50
                const reduced50 = existingProcessamentos.slice(0, 50)
                localStorage.setItem('processamentos', JSON.stringify(reduced50))
                console.log('✅ Processamento salvo com histórico reduzido para 50')
              }
            } catch (retryError) {
              console.error('❌ Erro ao salvar no localStorage mesmo após redução:', retryError)
              // Não mostrar erro ao usuário, pois o processamento foi bem-sucedido
            }
          } else {
            console.error('❌ Erro ao salvar no localStorage:', storageError)
            // Não mostrar erro ao usuário, pois o processamento foi bem-sucedido
          }
        }

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

        setProcessedData(processedDataFull)
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
        // Ignorar erros de localStorage (quota excedida) - não são críticos
        if (error.message.includes('quota') || error.message.includes('QuotaExceededError') || error.message.includes('setItem')) {
          console.warn('⚠️ Erro de localStorage (não crítico):', error.message)
          // Não mostrar erro ao usuário se for apenas problema de localStorage
          // O processamento foi bem-sucedido, apenas não foi salvo no histórico local
          return // Sair silenciosamente
        }
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
      {/* Seletor: Lacrada | Seminovo | Android (1 página, não mistura) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"
      >
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">O que você vai processar?</p>
        <div className="flex flex-wrap gap-2">
          {([
            { mode: 'lacrada' as const, Icon: Apple, label: 'Apple Lacrada', activeClass: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' },
            { mode: 'seminovo' as const, Icon: RefreshCw, label: 'Apple Seminovo', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
            { mode: 'android' as const, Icon: Smartphone, label: 'Android', activeClass: 'bg-green-600 text-white border-green-600' }
          ]).map(({ mode, Icon, label, activeClass }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setListMode(mode)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                listType === mode
                  ? `${activeClass} shadow-md`
                  : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {listType === 'android' ? 'Processar Lista Android' : listType === 'seminovo' ? 'Processar Lista Apple Seminovo' : 'Processar Lista Apple Lacrada'}
            </h1>
          <p className="text-gray-600 dark:text-white/70">
            {listType === 'android'
              ? 'Cole aqui apenas a lista de aparelhos Android (ex.: Xiaomi, Samsung). A IA extrairá os produtos.'
              : listType === 'seminovo'
                ? 'Cole aqui apenas a lista de Apple seminovos. A IA extrairá os produtos.'
                : 'Cole aqui apenas iPhones/Apple lacrados (MacBook, AirPods, Apple Watch lacrado). A IA processará automaticamente.'}
          </p>
          <p className="text-gray-500 dark:text-white/50 text-sm mt-2">O status de processamento é resetado automaticamente às 00h</p>
          
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={handleRollYesterdayToToday}
              disabled={isRollingYesterday || isZeroing || isRestoring}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isRollingYesterday ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Promovendo ontem...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Usar listas de ontem (hoje)</span>
                </>
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleZeroAllProducts}
              disabled={isZeroing || isRestoring || isRollingYesterday}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isZeroing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Zerando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Zerar estoque</span>
                </>
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleRestoreTodayProducts}
              disabled={isRestoring || isZeroing || isRollingYesterday}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Restaurando...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>RESTAURAR estoque (urgente)</span>
                </>
              )}
            </motion.button>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-2">
              Zerar antes de colar listas novas. Restaurar só se zerou por engano.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step 1: Selecionar Fornecedor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Selecionar Fornecedor</h2>
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

        {/* Campo de busca SEMPRE visível */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/50" />
            <input
              type="text"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="Buscar fornecedor por nome, WhatsApp ou cidade..."
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-white/15"
            />
            {supplierSearch && (
              <button
                onClick={() => setSupplierSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de fornecedores filtrados */}
        {isLoadingSuppliers ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-600 dark:text-white/70">Carregando fornecedores...</p>
          </div>
        ) : filteredAndSortedSuppliers.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-white/70">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-white/40" />
            <p>Nenhum fornecedor encontrado</p>
            {supplierSearch && (
              <p className="text-sm mt-2">Tente buscar com outros termos</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAndSortedSuppliers.map((fornecedor) => {
              const isSelected = selectedSupplier === fornecedor.id?.toString() || selectedSupplier === fornecedor.id
              const whatsapp = fornecedor.whatsapp || fornecedor.contact_phone
              const cidade = fornecedor.city || fornecedor.cidade
              const processedToday = fornecedor.processed_today === true || fornecedor.processed_today === 'true'
              
              return (
                <button
                  key={fornecedor.id}
                  onClick={() => {
                    const supplierId = fornecedor.id?.toString() || String(fornecedor.id || '')
                    if (supplierId) {
                      setSelectedSupplier(supplierId)
                    }
                  }}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-blue-500/20 border-2 border-blue-500' 
                      : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">{fornecedor.name || fornecedor.nome}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-white/60">
                        {whatsapp && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{whatsapp}</span>
                          </span>
                        )}
                        {cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{cidade}</span>
                          </span>
                        )}
                        {processedToday && (
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Processado hoje</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        
        {/* Fornecedor Selecionado - Card */}
        {selectedSupplier && (() => {
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
              className="mt-4 bg-blue-50 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4"
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
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
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
                        <span className="text-gray-600 dark:text-white/70 text-sm flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{cidade}</span>
                        </span>
                      )}
                      {whatsapp && (
                        <span className="text-gray-600 dark:text-white/70 text-sm flex items-center space-x-1">
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
                      <div className="text-sm text-gray-500 dark:text-white/50">
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
                  className="flex-shrink-0 text-gray-600 dark:text-white/70 dark:hover:text-white transition-colors p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
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
          className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 relative"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Colar Lista do Fornecedor</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">
                {listType === 'android' ? 'Cole aqui apenas a lista Android.' : listType === 'seminovo' ? 'Cole aqui apenas a lista de Apple seminovos.' : 'Cole aqui apenas a lista Apple lacrada (iPhone, MacBook, AirPods, Apple Watch).'}
              </label>
              <textarea
                value={rawList}
                onChange={(e) => setRawList(e.target.value)}
                placeholder="Exemplo:&#10;R$1950&#10;AIRPODS PRO 02 R$1150&#10;PENCIL USBC R$600&#10;iPhone 17 Pro Max 256GB Azul R$ 4.500,00&#10;Apple Watch Series 9 45mm Preto R$ 2.800,00&#10;&#10;A IA identificará automaticamente: cores, GB, tamanhos (MM), preços, condições, etc."
                className="w-full h-48 p-4 bg-gray-50 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-white/70">
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
          className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resultados do Processamento</h2>
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{processedData.totalProdutos}</h3>
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowCreateSupplier(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cadastrar Novo Fornecedor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Nome do Fornecedor *</label>
                <input
                  type="text"
                  value={newSupplier.nome}
                  onChange={(e) => setNewSupplier({...newSupplier, nome: e.target.value})}
                  className="w-full p-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="Ex: TechStore SP"
                />
              </div>
              
              
              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">WhatsApp *</label>
                <input
                  type="text"
                  value={newSupplier.whatsapp}
                  onChange={(e) => setNewSupplier({...newSupplier, whatsapp: e.target.value})}
                  className="w-full p-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-gray-600 dark:text-white/70 text-sm mb-2">Cidade</label>
                <input
                  type="text"
                  value={newSupplier.cidade}
                  onChange={(e) => setNewSupplier({...newSupplier, cidade: e.target.value})}
                  className="w-full p-3 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/50 focus:outline-none focus:border-blue-500"
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