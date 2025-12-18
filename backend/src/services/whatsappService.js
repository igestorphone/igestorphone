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
   */
  async findSupplierByWhatsApp(phoneNumber) {
    try {
      const normalized = this.normalizePhoneNumber(phoneNumber)
      
      if (!normalized) return null

      // Buscar fornecedor que tenha este número no campo whatsapp ou contact_phone
      const result = await query(`
        SELECT id, name, whatsapp, contact_phone
        FROM suppliers
        WHERE is_active = true
        AND (
          REPLACE(REPLACE(REPLACE(REPLACE(whatsapp, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $1
          OR REPLACE(REPLACE(REPLACE(REPLACE(contact_phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $1
        )
        LIMIT 1
      `, [`%${normalized}%`])

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
      
      // Salvar produtos no banco (usando mesma lógica da rota /ai/process-list)
      let savedCount = 0
      let updatedCount = 0
      
      for (const product of validatedProducts) {
        try {
          const condition = product.condition || 'Novo'
          const conditionDetail = product.condition_detail || (condition === 'Novo' ? 'LACRADO' : null)
          const normalizedColor = product.color ? normalizeColor(product.color, product.model) : null
          const normalizedVariant = product.variant ? product.variant.toUpperCase() : null

          // Verificar se produto já existe (mesmo fornecedor, modelo, cor, armazenamento, condição)
          const existingProduct = await query(`
            SELECT id FROM products
            WHERE supplier_id = $1
              AND model = $2
              AND color = $3
              AND storage = $4
              AND condition = $5
              AND COALESCE(variant, '') = COALESCE($6, '')
            LIMIT 1
          `, [
            supplier_id,
            product.model || null,
            normalizedColor || product.color || null,
            product.storage || null,
            condition,
            normalizedVariant || null
          ])

          if (existingProduct.rows.length > 0) {
            // Atualizar produto existente
            const productId = existingProduct.rows[0].id
            await query(`
              UPDATE products
              SET price = $1, updated_at = NOW(), is_active = true
              WHERE id = $2
            `, [product.price, productId])

            // Adicionar ao histórico de preços
            await query(`
              INSERT INTO price_history (product_id, supplier_id, price)
              VALUES ($1, $2, $3)
            `, [productId, supplier_id, product.price])

            updatedCount++
          } else {
            // Criar novo produto
            await query(`
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
              1, // stock_quantity padrão
              true // is_active
            ]).then(async (result) => {
              const productId = result.rows[0].id
              // Adicionar ao histórico de preços
              await query(`
                INSERT INTO price_history (product_id, supplier_id, price)
                VALUES ($1, $2, $3)
              `, [productId, supplier_id, product.price])
            })

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

