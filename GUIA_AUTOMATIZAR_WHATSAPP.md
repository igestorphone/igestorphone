# 🤖 Guia: Automatizar Recebimento de Listas via WhatsApp

## ✅ O que já está implementado

Já criamos a base do sistema:
- ✅ **Serviço de WhatsApp** (`backend/src/services/whatsappService.js`)
- ✅ **Webhook** (`backend/src/routes/whatsapp-webhook.js`)
- ✅ **Integração com IA** para processar listas
- ✅ **Detecção automática** de fornecedores pelo número
- ✅ **Fila de processamento** para evitar sobrecarga

## 🎯 Opções para Conectar WhatsApp

### Opção 1: Evolution API (RECOMENDADO para começar)

**Vantagens:**
- ✅ Gratuito para começar
- ✅ Fácil de configurar
- ✅ Suporta WhatsApp Web
- ✅ Webhooks nativos

**Como configurar:**

1. **Instalar Evolution API:**
   ```bash
   # Em um servidor separado ou Docker
   docker run -d \
     -p 8080:8080 \
     -e AUTHENTICATION_API_KEY=seu_token_aqui \
     evolutionapi/evolution-api:latest
   ```

2. **Conectar WhatsApp:**
   - Acesse: `http://localhost:8080`
   - Escaneie QR Code com seu WhatsApp
   - Configure webhook: `https://seu-backend.com/api/whatsapp/webhook`

3. **Configurar no .env:**
   ```env
   WHATSAPP_API_URL=http://localhost:8080
   WHATSAPP_API_KEY=seu_token_aqui
   ```

---

### Opção 2: WhatsApp Business API (Twilio) - MAIS SEGURO

**Vantagens:**
- ✅ 100% Oficial (sem risco de ban)
- ✅ Suporte profissional
- ✅ Escalável

**Desvantagens:**
- 💰 Pago (cerca de R$ 100-300/mês)

**Como configurar:**

1. Criar conta Twilio
2. Ativar WhatsApp Business API
3. Configurar webhook no Twilio apontando para: `https://seu-backend.com/api/whatsapp/webhook`

---

## 📋 Próximos Passos

### 1. Testar o Webhook Manualmente

Primeiro, vamos testar se o sistema funciona:

```bash
# Testar processamento manual
curl -X POST https://seu-backend.com/api/whatsapp/test-process \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999",
    "message": "iPhone 17 Pro Max 256GB Laranja 8500"
  }'
```

### 2. Configurar Fornecedor no Sistema

Certifique-se de que os fornecedores estão cadastrados com o número do WhatsApp:
- Vá em "Gerenciar Fornecedores"
- Adicione/edite fornecedor
- Coloque o número do WhatsApp (apenas números, ex: 5511999999999)

### 3. Configurar Webhook Real

Quando tiver Evolution API ou Twilio configurado:
- Configure o webhook para apontar para: `https://seu-backend.com/api/whatsapp/webhook`
- O sistema processará automaticamente

---

## 🔒 Segurança do Webhook

Para proteger o webhook, você pode adicionar validação de token:

```javascript
// No whatsapp-webhook.js, adicionar:
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET

router.post('/webhook', async (req, res) => {
  // Validar token se configurado
  if (WEBHOOK_SECRET && req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // ... resto do código
})
```

---

## ⚠️ Boas Práticas para Evitar Banimento

1. ✅ **Apenas RECEBER** (não enviar automaticamente)
2. ✅ Limitar frequência (sistema já faz isso - 1 msg a cada 2s)
3. ✅ Processar apenas mensagens de fornecedores conhecidos
4. ✅ Monitorar logs regularmente
5. ✅ Não compartilhar a conta com outras automações

---

## 🧪 Testando Localmente

1. **Rodar backend localmente**
2. **Usar ngrok** para expor o webhook:
   ```bash
   ngrok http 3001
   ```
3. **Configurar webhook temporário** apontando para URL do ngrok
4. **Enviar mensagem de teste** do WhatsApp
5. **Verificar logs** no backend

---

## 📊 Monitoramento

O sistema já loga:
- ✅ Mensagens recebidas
- ✅ Fornecedores identificados
- ✅ Listas processadas
- ✅ Produtos salvos/atualizados
- ❌ Erros

Verifique os logs regularmente para garantir que está funcionando.

---

## 💡 Próximas Melhorias (Opcional)

- [ ] Notificação por email quando lista é processada
- [ ] Dashboard para ver mensagens recebidas
- [ ] Filtros para aceitar/rejeitar fornecedores automaticamente
- [ ] Integração com WhatsApp Business API oficial

---

**Quer que eu implemente alguma dessas melhorias ou configurar alguma opção específica?**

