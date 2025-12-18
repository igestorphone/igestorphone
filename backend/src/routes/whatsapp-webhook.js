import express from 'express'
import whatsappService from '../services/whatsappService.js'

const router = express.Router()

/**
 * Webhook para receber mensagens do WhatsApp
 * 
 * Compatível com:
 * - Evolution API
 * - Twilio WhatsApp Business API
 * - Outros serviços que seguem padrão similar
 */
router.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Webhook recebido:', req.body)

    // Formato Evolution API
    if (req.body.event === 'messages.upsert') {
      const message = req.body.data?.messages?.[0]
      
      if (message && message.message) {
        const from = message.key.remoteJid?.replace('@s.whatsapp.net', '')
        const body = message.message.conversation || 
                    message.message.extendedTextMessage?.text ||
                    message.message.listMessage?.description ||
                    ''

        if (body) {
          const result = await whatsappService.processIncomingMessage({
            from,
            body,
            timestamp: message.messageTimestamp
          })

          return res.json({ 
            success: true, 
            processed: result.processed,
            ...result
          })
        }
      }
    }

    // Formato Twilio
    if (req.body.From && req.body.Body) {
      const from = req.body.From.replace('whatsapp:', '')
      const body = req.body.Body

      const result = await whatsappService.processIncomingMessage({
        from,
        body,
        timestamp: Date.now() / 1000
      })

      return res.json({ 
        success: true, 
        processed: result.processed,
        ...result
      })
    }

    // Formato genérico (para customizações)
    if (req.body.from && req.body.message) {
      const result = await whatsappService.processIncomingMessage({
        from: req.body.from,
        body: req.body.message,
        timestamp: req.body.timestamp || Date.now() / 1000
      })

      return res.json({ 
        success: true, 
        processed: result.processed,
        ...result
      })
    }

    // Se não reconheceu formato, retornar OK mas não processar
    res.json({ success: true, message: 'Webhook recebido mas formato não reconhecido' })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

/**
 * Endpoint para testar processamento manual
 * Útil para testes antes de configurar webhook
 */
router.post('/test-process', async (req, res) => {
  try {
    const { from, message } = req.body

    if (!from || !message) {
      return res.status(400).json({ 
        error: 'from e message são obrigatórios' 
      })
    }

    const result = await whatsappService.processIncomingMessage({
      from,
      body: message,
      timestamp: Date.now() / 1000
    })

    res.json(result)

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

export default router

