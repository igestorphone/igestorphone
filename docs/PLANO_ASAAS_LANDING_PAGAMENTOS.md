# Plano de Automação de Pagamentos com Asaas + Self-Service na Landing

> **Objetivo:** Permitir que visitantes da landing page assinem o plano sozinhos, sem depender de WhatsApp/atendimento manual, usando a plataforma Asaas.

---

## 1. Situação atual

| Aspecto | Hoje |
|---------|------|
| **Landing** | Botões "Assinar" abrem WhatsApp |
| **Checkout** | Não existe – tudo via atendimento |
| **Pagamentos** | Stripe (cartão) + PIX manual no admin |
| **Asaas** | Chave API existe, zero implementação |
| **Planos** | Mensal R$150, Trimestral R$130/mês, Anual R$100/mês |

---

## 2. Fluxo desejado (self-service)

```
Visitante → Escolhe plano → Cadastro/Login → Checkout (cartão ou PIX) → Assinatura ativa → Acesso ao sistema
```

**Resumo:** A pessoa navega na landing, clica em "Assinar" no plano desejado, se cadastra ou entra, escolhe forma de pagamento (cartão ou PIX), paga e já recebe acesso sem passar por WhatsApp.

---

## 3. Opções de implementação

### Opção A: Checkout híbrido (recomendada)

| Forma de pagamento | Fluxo |
|--------------------|-------|
| **Cartão** | Formulário na sua própria página → envio seguro dos dados → API Asaas cria assinatura |
| **PIX** | Cria cobrança PIX no Asaas → exibe QR Code na tela → usuário paga → webhook confirma → acesso liberado |

**Vantagens:** Experiência dentro do seu domínio, menos dependência da interface do Asaas.

**Cuidados:** Cartão exige PCI compliance (não guardar número completo) – Asaas sugere usar tokenização ou formulário deles.

---

### Opção B: Redirect para Asaas

Redirecionar para a tela de checkout do Asaas (se existir) ou usar o [Asaas Pay](https://docs.asaas.com/docs/asaas-pay) (checkout embarcado).

**Vantagens:** Menos desenvolvimento, menos responsabilidade com dados de cartão.

**Desvantagens:** Sai do seu site, experiência menos integrada.

---

### Opção C: PIX apenas (fase 1)

Começar só com PIX: criar cobrança única/recorrente no Asaas, exibir QR Code, webhook confirma pagamento e libera acesso.

**Vantagens:** Implementação simples, sem lidar com cartão no início.

**Desvantagens:** Assinaturas recorrentes via PIX exigem cobrança manual a cada ciclo – menos automação.

---

## 4. Estratégia recomendada (por fases)

### Fase 1 – PIX para primeiro pagamento
- Visitante clica "Assinar" na landing.
- Cria conta (ou faz login).
- Escolhe plano → backend cria cobrança PIX no Asaas.
- Exibe QR Code (ou link copia e cola).
- Webhook Asaas confirma pagamento → backend atualiza `subscriptions` e `users.subscription_status` → libera acesso.
- **Sem renovação automática** – você cobra manualmente nos próximos ciclos (ou automatiza depois).

### Fase 2 – Assinatura recorrente com cartão
- Usar [Asaas Subscriptions](https://docs.asaas.com/docs/assinaturas) com `billingType: "CREDIT_CARD"`.
- Fluxo: cadastro de cliente no Asaas → criação de assinatura com cartão → renovação automática.
- Tokenização do Asaas ou formulário seguro (evitar passar dados de cartão pelo seu backend).

### Fase 3 – PIX recorrente
- Se Asaas permitir cobranças recorrentes via PIX, configurar ciclo (mensal/trimestral/anual) e deixar gerar cobranças automaticamente.
- Caso contrário, manter cobrança manual por ciclo ou migrar quem pagar PIX para cartão depois.

---

## 5. Mapeamento de planos no Asaas

| Plano | Valor | Ciclo Asaas | `cycle` |
|-------|-------|-------------|---------|
| Mensal | R$ 150 | Mensal | `MONTHLY` |
| Trimestral | R$ 390 (R$ 130/mês) | Trimestral | `QUARTERLY` |
| Anual | R$ 1.200 (R$ 100/mês) | Anual | `YEARLY` |

---

## 6. O que precisa existir no sistema

### Backend

1. **Cliente Asaas**
   - Antes de cobrar, criar `customer` no Asaas (nome, email, CPF, telefone).
   - Armazenar `asaas_customer_id` no `users` (similar ao `stripe_customer_id`).

2. **Rotas novas**
   - `POST /api/asaas/create-subscription` – cria assinatura (cartão ou PIX).
   - `POST /api/asaas/create-pix-charge` – só PIX, se fizer fase 1 isolada.
   - `POST /api/asaas/webhook` – recebe eventos de pagamento confirmado/cancelado.

3. **Banco**
   - Adicionar `asaas_customer_id` e `asaas_subscription_id` em `users` / `subscriptions`.
   - Manter Stripe para quem já assina por lá (ou migrar depois).

### Frontend

1. **Landing**
   - Botões "Assinar" → vão para página de checkout (não WhatsApp).
   - Passar plano escolhido (query param ou state): `?plan=mensal` | `trimestral` | `anual`.

2. **Página de checkout** (nova)
   - Se não logado: cadastro rápido (nome, email, senha, CPF, telefone).
   - Se logado: só escolher forma de pagamento e concluir.
   - Para cartão: formulário ou iframe Asaas (conforme documentação).
   - Para PIX: exibir QR Code e instruções até webhook confirmar.

3. **Fluxo pós-pagamento**
   - Redirect para dashboard com mensagem de boas-vindas.
   - Se PIX pendente: tela “aguardando confirmação” com QR Code ainda visível.

---

## 7. Segurança e variáveis de ambiente

- `ASAAS_API_KEY` – chave da API (já existe).
- Usar ambiente **Sandbox** para testes, **Produção** em live.
- Base URL: `https://sandbox.asaas.com` ou `https://api.asaas.com`.
- Webhook: configurar URL no painel Asaas e validar assinatura/token do webhook.

---

## 8. Webhooks Asaas (eventos importantes)

| Evento | Ação no seu sistema |
|--------|----------------------|
| `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` | Marcar cobrança como paga, ativar/renovar assinatura |
| `PAYMENT_DELETED` / `PAYMENT_OVERDUE` | Tratar inadimplência (avisar, suspender etc.) |
| `SUBSCRIPTION_CREATED` / `SUBSCRIPTION_UPDATED` | Atualizar `subscriptions` e `users.subscription_status` |

---

## 9. Resumo de decisões antes de codar

- [ ] **Qual fase começar?** (1 só PIX, 2 cartão, ou 1+2 em paralelo)
- [ ] **Manter Stripe** para clientes antigos ou migrar tudo para Asaas?
- [ ] **Onde o checkout vive?** Rota própria (`/checkout`) ou modal na landing?
- [ ] **Cadastro mínimo:** só email/senha ou já pedir CPF e telefone no primeiro passo?
- [ ] **Trial:** manter 30 dias e só cobrar depois, ou começar cobrando no ato?

---

## 10. Próximos passos (após decidir)

1. Registrar webhook no painel Asaas.
2. Implementar service de integração Asaas no backend (criar customer, criar assinatura, criar cobrança PIX).
3. Criar rota `/checkout` e adaptar botões da landing.
4. Implementar página de checkout com escolha de plano + forma de pagamento.
5. Testar fluxo completo em Sandbox antes de ir para produção.

---

*Documento criado para formalizar o plano antes da implementação.*
