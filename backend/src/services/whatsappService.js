/**
 * Serviço para receber e processar mensagens do WhatsApp
 * 
 * IMPORTANTE: Este serviço apenas RECEBE mensagens (passivo)
 * Não envia mensagens automaticamente para evitar banimento
 */

import { query } from '../config/database.js'
import aiService from './aiService.js'

class WhatsAppService {
  constructor() {
    this.processingQueue = []
    this.isProcessing = false
  }

  /**
   * Normaliza número de WhatsApp para formato padrão
   * Remove caracteres especiais e formata para número limpo
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null
    
    // Remover tudo exceto números
    const cleaned = phone.replace(/\D/g, '')
    
    // Se começar com 55 (Brasil), remover
    if (cleaned.startsWith('55')) {
      return cleaned.substring(2)
    }
    
    return cleaned
  }

  /**
   * Busca fornecedor pelo número do WhatsApp
   * Busca na nova tabela supplier_whatsapp_numbers que suporta múltiplos números
   */
  async findSupplierByWhatsApp(phoneNumber) {
    try {
      const normalized = this.normalizePhoneNumber(phoneNumber)
      
      if (!normalized) return null

      // Buscar fornecedor pela tabela de números de WhatsApp (suporta múltiplos números)
      const result = await query(`
        SELECT s.id, s.name, s.whatsapp, s.contact_phone
        FROM suppliers s
        INNER JOIN supplier_whatsapp_numbers swn ON s.id = swn.supplier_id
        WHERE s.is_active = true
        AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(swn.phone_number, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE $1
        LIMIT 1
      `, [`%${normalized}%`])

      // Se não encontrou na nova tabela, buscar na tabela antiga (compatibilidade)
      if (!result.rows[0]) {
        const fallbackResult = await query(`
          SELECT id, name, whatsapp, contact_phone
          FROM suppliers
          WHERE is_active = true
          AND (
            REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE $1
            OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(contact_phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE $1
          )
          LIMIT 1
        `, [`%${normalized}%`])
        
        return fallbackResult.rows[0] || null
      }

      return result.rows[0] || null
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error)
      return null
    }
  }

  /**
   * Detecta se uma mensagem é uma lista de produtos
   * Procura por indicadores comuns de listas de produtos Apple
   */
  isProductList(messageText) {
    if (!messageText || messageText.length < 50) return false

    const text = messageText.toLowerCase()
    
    // Indicadores de lista de produtos
    const indicators = [
      'iphone',
      'ipad',
      'macbook',
      'airpods',
      'apple watch',
      'preço',
      'r$',
      'gb',
      '128',
      '256',
      '512',
      '1tb',
      'novo',
      'lacrado',
      'cpo'
    ]

    // Se tiver pelo menos 3 indicadores, provavelmente é uma lista
    const matches = indicators.filter(indicator => text.includes(indicator)).length
    
    return matches >= 3
  }

  /**
   * Processa mensagem recebida do WhatsApp
   * Se for de fornecedor conhecido e for lista de produtos, processa automaticamente
   */
  async processIncomingMessage(messageData) {
    try {
      const { from, body, timestamp } = messageData
      
      console.log('📱 Mensagem recebida do WhatsApp:', {
        from,
        length: body?.length,
        timestamp
      })

      // Verificar se é lista de produtos
      if (!this.isProductList(body)) {
        console.log('⏭️ Mensagem não é lista de produtos, ignorando')
        return { processed: false, reason: 'not_product_list' }
      }

      // Buscar fornecedor
      const supplier = await this.findSupplierByWhatsApp(from)
      
      if (!supplier) {
        console.log('⚠️ Fornecedor não encontrado para o número:', from)
        return { 
          processed: false, 
          reason: 'supplier_not_found',
          from 
        }
      }

      console.log('✅ Fornecedor encontrado:', supplier.name)

      // Adicionar à fila de processamento
      return await this.queueForProcessing({
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        raw_list_text: body,
        received_at: new Date(timestamp * 1000 || Date.now()),
        from_number: from
      })

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error)
      return { processed: false, error: error.message }
    }
  }

  /**
   * Adiciona lista à fila de processamento
   * Processa uma por vez para evitar sobrecarga
   */
  async queueForProcessing(listData) {
    this.processingQueue.push(listData)
    
    // Processar fila se não estiver processando
    if (!this.isProcessing) {
      this.processQueue()
    }

    return { 
      processed: true, 
      queued: true,
      queue_position: this.processingQueue.length 
    }
  }

  /**
   * Processa a fila de listas
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.processingQueue.length > 0) {
      const listData = this.processingQueue.shift()
      
      try {
        await this.processList(listData)
        
        // Esperar 2 segundos entre processamentos para não sobrecarregar
        if (this.processingQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error('❌ Erro ao processar lista da fila:', error)
        // Continuar processando próxima lista mesmo se uma falhar
      }
    }

    this.isProcessing = false
  }

  /**
   * Processa uma lista de produtos automaticamente
   */
  async processList(listData) {
    const { supplier_id, supplier_name, raw_list_text } = listData

    console.log(`🔄 Processando lista automaticamente do fornecedor: ${supplier_name}`)

    try {
      // Validar lista com IA
      const validationResult = await aiService.validateProductListFromText(raw_list_text)

      if (!validationResult.valid || !validationResult.validated_products?.length) {
        console.log('⚠️ Lista não contém produtos válidos')
        return {
          success: false,
          reason: 'no_valid_products',
          warnings: validationResult.warnings
        }
      }

      const validatedProducts = validationResult.validated_products

      // Salvar lista bruta
      await query(`
        INSERT INTO supplier_raw_lists (supplier_id, raw_list_text)
        VALUES ($1, $2)
      `, [supplier_id, raw_list_text])

      // Importar normalizador de cores
      const { normalizeColor } = await import('../utils/colorNormalizer.js')
      
      // Função helper para detectar variante (mesma lógica do ai.js)
      const detectVariant = (product) => {
        const combined = [
          product?.variant,
          product?.network,
          product?.notes,
          product?.model,
          product?.name,
          product?.additional_info,
          product?.description
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!combined) return null

        if (combined.includes('anatel')) return 'ANATEL'
        if (combined.includes('e-sim') || combined.includes('esim') || combined.includes('e sim')) return 'E-SIM'
        if (
          combined.includes('chip físico') ||
          combined.includes('chip fisico') ||
          combined.includes('chip fisco') ||
          combined.includes('1 chip') ||
          combined.includes('01 chip') ||
          combined.includes('2 chip') ||
          combined.includes('02 chip')
        ) return 'CHIP FÍSICO'
        if (combined.includes('chip virtual')) return 'CHIP VIRTUAL'
        if (combined.includes('chin')) return 'CHINÊS'
        if (combined.includes('jap')) return 'JAPONÊS'
        if (combined.includes('indi')) return 'INDIANO'
        if (combined.includes('usa') || combined.includes('americano')) return 'AMERICANO'
        if (combined.includes('cpo')) return 'CPO'

        return product?.variant ? product.variant.toString().toUpperCase() : null
      }
      
      // Salvar produtos no banco (usando mesma lógica da rota /ai/process-list)
      let savedCount = 0
      let updatedCount = 0
      
      for (const product of validatedProducts) {
        try {
          const condition = product.condition || 'Novo'
          const conditionDetail = product.condition_detail || (condition === 'Novo' ? 'LACRADO' : null)
          const normalizedColor = product.color ? normalizeColor(product.color, product.model) : null
          const normalizedVariant = detectVariant(product)

          // Normalizar nome e modelo para busca
          const normalizedName = product.name ? product.name.trim().toLowerCase() : ''
          const normalizedStorage = product.storage ? product.storage.trim().toLowerCase().replace(/\s+/g, '') : ''
          
          // Buscar produto existente (mesma lógica do process-list)
          let existingProduct
          
          if (product.model) {
            const modelPattern = product.model.trim().toLowerCase().replace(/\s+/g, '\\s*')
            existingProduct = await query(`
              SELECT id FROM products 
              WHERE supplier_id = $1 
                AND LOWER(REGEXP_REPLACE(model, '\\s+', '', 'g')) ~ $2
                AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
                AND COALESCE(TRIM(LOWER(REGEXP_REPLACE(COALESCE(storage, ''), '\\s+', '', 'g'))), '') = COALESCE(TRIM(LOWER($4)), '')
                AND condition = $5
              ORDER BY updated_at DESC
              LIMIT 1
            `, [
              supplier_id,
              `^${modelPattern}$`,
              normalizedColor || '',
              normalizedStorage || '',
              condition
            ])
          } else {
            existingProduct = await query(`
              SELECT id FROM products 
              WHERE supplier_id = $1 
                AND TRIM(LOWER(name)) = $2
                AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
                AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
                AND condition = $5
              ORDER BY updated_at DESC
              LIMIT 1
            `, [
              supplier_id,
              normalizedName,
              normalizedColor || '',
              normalizedStorage || '',
              condition
            ])
          }

          if (existingProduct.rows.length > 0) {
            // Atualizar produto existente
            const productId = existingProduct.rows[0].id
            await query(`
              UPDATE products 
              SET price = $1, 
                  name = $2,
                  model = $3,
                  color = $4,
                  storage = $5,
                  variant = $6,
                  condition_detail = $7,
                  is_active = $8,
                  updated_at = NOW()
              WHERE id = $9
            `, [
              product.price,
              product.name,
              product.model || null,
              normalizedColor || product.color || null,
              product.storage || null,
              normalizedVariant,
              conditionDetail || null,
              true,
              productId
            ])

            // Verificar se preço mudou antes de adicionar ao histórico
            const priceHistoryCheck = await query(`
              SELECT price FROM price_history 
              WHERE product_id = $1 
              ORDER BY created_at DESC 
              LIMIT 1
            `, [productId])
            
            const lastPrice = priceHistoryCheck.rows.length > 0 ? parseFloat(priceHistoryCheck.rows[0].price) : null
            const currentPrice = parseFloat(product.price)
            
            if (lastPrice === null || lastPrice !== currentPrice) {
              await query(`
                INSERT INTO price_history (product_id, supplier_id, price)
                VALUES ($1, $2, $3)
              `, [productId, supplier_id, product.price])
            }

            updatedCount++
          } else {
            // Criar novo produto
            const productResult = await query(`
              INSERT INTO products (
                supplier_id, name, model, color, storage, condition, condition_detail, variant,
                price, stock_quantity, is_active
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              RETURNING id
            `, [
              supplier_id,
              product.name,
              product.model || null,
              normalizedColor || product.color || null,
              product.storage || null,
              condition,
              conditionDetail || null,
              normalizedVariant || null,
              product.price || 0,
              1,
              true
            ])

            const productId = productResult.rows[0].id

            // Adicionar ao histórico de preços
            await query(`
              INSERT INTO price_history (product_id, supplier_id, price)
              VALUES ($1, $2, $3)
            `, [productId, supplier_id, product.price])

            savedCount++
          }
        } catch (error) {
          console.error('Erro ao salvar produto:', error)
        }
      }

      console.log(`✅ Lista processada: ${savedCount} produtos novos, ${updatedCount} produtos atualizados`)

      return {
        success: true,
        products_created: savedCount,
        products_updated: updatedCount,
        total_validated: validatedProducts.length
      }

    } catch (error) {
      console.error('❌ Erro ao processar lista:', error)
      throw error
    }
  }
}

export default new WhatsAppService()

