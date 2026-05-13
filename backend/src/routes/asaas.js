import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as asaasService from '../services/asaas.js';
import { createSessionForUser } from '../services/userSessions.js';
import { addCalendarDays, BILLING_PERIOD_DAYS, computeExpiryAfterRenewal } from '../utils/billingPeriod.js';

const router = express.Router();

const MENSAL_VALUE_OVERRIDE_KEY = 'asaas_mensal_value_override';

/** Valor mensal forçado via ambiente (ex.: 5 para testar Asaas; mínimo da cobrança é R$ 5). Remova em produção. */
function getMensalOverrideFromEnv() {
  const raw = process.env.ASAAS_MENSAL_OVERRIDE_BRL;
  if (raw == null || String(raw).trim() === '') return null;
  const num = parseFloat(String(raw).trim().replace(',', '.'));
  if (Number.isFinite(num) && num > 0) return num;
  return null;
}

function normalizeSettingsOverrideRaw(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : null;
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    const inner = raw.value;
    if (typeof inner === 'number' && Number.isFinite(inner) && inner > 0) return inner;
    const parsed = parseFloat(String(inner).replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  const num = parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/** Override DB/env; Asaas não aceita cobrança líquida abaixo de R$ 5,00. */
async function getMensalValueOverride() {
  let num = getMensalOverrideFromEnv();
  if (num == null) {
    try {
      const r = await query(`SELECT value FROM settings WHERE key = $1`, [MENSAL_VALUE_OVERRIDE_KEY]);
      num = normalizeSettingsOverrideRaw(r.rows[0]?.value);
    } catch (_) {
      /* settings pode não existir em ambientes muito antigos */
    }
  }
  if (num == null || !Number.isFinite(num) || num <= 0) return null;
  if (num < 5) return 5;
  return num;
}

// Planos disponíveis (público - teste oculto). Valor mensal pode ter override admin (teste Asaas).
router.get('/plans', async (req, res) => {
  try {
    const override = await getMensalValueOverride();
    const plans = Object.entries(asaasService.PLANS)
      .filter(([key]) => key !== 'teste')
      .map(([key, p]) => ({
        id: key,
        name: p.name,
        planName: p.planName,
        value: key === 'mensal' && override != null ? override : p.value,
        cycle: p.cycle,
        durationMonths: p.durationMonths,
      }));
    res.json({ plans });
  } catch (e) {
    console.error('GET /asaas/plans:', e);
    res.status(500).json({ message: 'Erro ao listar planos' });
  }
});

// Admin: valor mensal no Asaas (ex.: R$ 5 para teste — mínimo da plataforma). null/clear remove o override.
router.get('/admin/mensal-override', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const value = await getMensalValueOverride();
    res.json({ value });
  } catch (e) {
    console.error('GET mensal-override:', e);
    res.status(500).json({ message: 'Erro ao ler configuração' });
  }
});

router.put('/admin/mensal-override', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const clear = req.body?.clear === true || req.body?.value === null || req.body?.value === '';
    if (clear) {
      await query(`DELETE FROM settings WHERE key = $1`, [MENSAL_VALUE_OVERRIDE_KEY]);
      return res.json({
        value: null,
        message: 'Override removido. Checkout mensal volta ao valor padrão (R$ 199,99).',
      });
    }
    const num = Number(req.body?.value);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({ message: 'Informe value numérico > 0 ou clear: true' });
    }
    if (num < 5) {
      return res.status(400).json({
        message:
          'O Asaas não aceita cobrança abaixo de R$ 5,00. Use 5 ou mais para testes, ou clear: true para voltar ao padrão.',
      });
    }
    await query(
      `INSERT INTO settings (key, value, description)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [MENSAL_VALUE_OVERRIDE_KEY, JSON.stringify(num), 'Override valor mensal Asaas (admin / testes)']
    );
    res.json({
      value: num,
      message: `Checkout mensal usará R$ ${num.toFixed(2).replace('.', ',')} até você remover o override.`,
    });
  } catch (e) {
    console.error('PUT mensal-override:', e);
    res.status(500).json({ message: 'Erro ao salvar configuração' });
  }
});

// Criar assinatura (requer autenticação + cpf/phone no user ou no body)
const createSubscriptionValidation = [
  body('planKey').isIn(['teste', 'mensal']),
  body('billingType').isIn(['PIX', 'CREDIT_CARD']),
  body('cpfCnpj').optional().isString().trim(),
  body('phone').optional().isString().trim(),
  body('creditCard').optional().isObject(),
  body('creditCardHolderInfo').optional().isObject(),
];

router.post('/create-subscription', authenticateToken, createSubscriptionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planKey, billingType, cpfCnpj, phone, creditCard, creditCardHolderInfo } = req.body;

    const userResult = await query(
      `SELECT id, name, email, cpf_cnpj, phone, asaas_customer_id FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    const user = userResult.rows[0];

    const cpf = cpfCnpj || user.cpf_cnpj;
    const userPhone = phone || user.phone;

    if (!cpf) {
      return res.status(400).json({
        message: 'CPF ou CNPJ é obrigatório. Informe no checkout.',
        code: 'CPF_REQUIRED',
      });
    }

    const userWithCpf = { ...user, cpf_cnpj: cpf, phone: userPhone };

    const customer = await asaasService.getOrCreateCustomer(
      userWithCpf,
      user.asaas_customer_id
    );

    if (!user.asaas_customer_id) {
      await query(
        `UPDATE users SET asaas_customer_id = $1, cpf_cnpj = $2, phone = $3 WHERE id = $4`,
        [customer.id, cpf, userPhone || null, user.id]
      );
    }

    const plan = asaasService.PLANS[planKey];
    const valueOverride = planKey === 'mensal' ? await getMensalValueOverride() : null;
    const chargedPrice =
      valueOverride != null && Number.isFinite(Number(valueOverride))
        ? Number(valueOverride)
        : plan.value;
    const descriptionOverride =
      planKey === 'mensal' && valueOverride != null
        ? `iGestorPhone Mensal (teste R$ ${chargedPrice.toFixed(2).replace('.', ',')})`
        : undefined;

    const subscription = await asaasService.createSubscription({
      customerId: customer.id,
      planKey,
      billingType,
      creditCard,
      creditCardHolderInfo,
      valueOverride: planKey === 'mensal' ? valueOverride ?? undefined : undefined,
      descriptionOverride,
    });

    // Inserir assinatura no banco (status pendente até webhook PAYMENT_RECEIVED)
    const startDate = new Date();
    const endDate = addCalendarDays(startDate, BILLING_PERIOD_DAYS);

    await query(
      `INSERT INTO subscriptions (
        user_id, plan_name, status, asaas_subscription_id,
        plan_type, duration_months, price, payment_method,
        start_date, end_date, auto_renew
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [
        user.id,
        descriptionOverride || plan.planName,
        billingType === 'CREDIT_CARD' ? 'active' : 'PENDING',
        subscription.id,
        planKey,
        plan.durationMonths,
        chargedPrice,
        billingType.toLowerCase(),
        startDate,
        endDate,
      ]
    );

    if (billingType === 'CREDIT_CARD') {
      await query(
        `UPDATE users SET subscription_status = 'active', subscription_expires_at = $1, is_active = true WHERE id = $2`,
        [endDate, user.id]
      );
      return res.json({
        success: true,
        subscriptionId: subscription.id,
        status: 'active',
        message: 'Assinatura ativada com sucesso!',
      });
    }

    // PIX: buscar primeira cobrança e QR Code
    const payment = await asaasService.getSubscriptionFirstPayment(subscription.id);
    const pixData = await asaasService.getPixQrCode(payment.id);

    return res.json({
      success: true,
      subscriptionId: subscription.id,
      paymentId: payment.id,
      status: 'PENDING',
      pix: {
        encodedImage: pixData.encodedImage,
        payload: pixData.payload || pixData.copyPaste,
        expirationDate: pixData.expirationDate || payment.dueDate,
      },
      message: 'Escaneie o QR Code ou use o Pix Copia e Cola para pagar.',
    });
  } catch (error) {
    console.error('Erro ao criar assinatura Asaas:', error);
    res.status(500).json({
      message: error.message || 'Erro ao criar assinatura',
      code: error.code,
    });
  }
});

// Registrar com CPF/telefone (para checkout de novos usuários)
const registerCheckoutValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('cpfCnpj').trim().notEmpty().withMessage('CPF é obrigatório'),
  body('phone').trim().notEmpty().withMessage('Telefone é obrigatório')
    .custom((v) => (v || '').replace(/\D/g, '').length >= 10).withMessage('Telefone inválido (informe com DDD)'),
];

router.post('/register-checkout', registerCheckoutValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const first = errors.array()[0];
      return res.status(400).json({
        message: first?.msg || 'Verifique os dados preenchidos.',
        errors: errors.array()
      });
    }

    const { name, email, password, cpfCnpj, phone } = req.body;
    const bcrypt = (await import('bcryptjs')).default;
    const jwt = (await import('jsonwebtoken')).default;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado. Faça login.' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (email, password_hash, name, cpf_cnpj, phone, subscription_status, subscription_expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING id, email, name, role, subscription_status, cpf_cnpj, phone`,
      [
        email,
        passwordHash,
        name,
        cpfCnpj.replace(/\D/g, ''),
        phone || null,
        'pending_payment',
        null,
      ]
    );
    const user = result.rows[0];

    const sessionId = await createSessionForUser(user.id);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, sid: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Cadastro realizado. Prosseguir para pagamento.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        cpf_cnpj: user.cpf_cnpj,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    console.error('Erro no registro checkout:', error);
    res.status(500).json({ message: 'Erro ao cadastrar' });
  }
});

// Verificar pagamento PIX (fallback quando webhook não chega - ex: localhost)
// Usuário com pending_payment pode chamar para sincronizar status
router.get('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      `SELECT id, subscription_status, subscription_expires_at FROM users WHERE id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ paid: false, message: 'Usuário não encontrado' });
    }
    const user = userResult.rows[0];
    const st = (user.subscription_status || '').toLowerCase();

    const hasValidPaidThrough =
      user.subscription_expires_at &&
      !Number.isNaN(new Date(user.subscription_expires_at).getTime()) &&
      new Date(user.subscription_expires_at) > new Date();

    if ((st === 'active' || st === 'trial') && hasValidPaidThrough) {
      return res.json({ paid: true, status: user.subscription_status });
    }

    const needsAsaasCheck =
      st === 'pending_payment' ||
      st === 'overdue' ||
      st === 'expired' ||
      (st === 'active' && !hasValidPaidThrough) ||
      (st === 'trial' && !hasValidPaidThrough);

    if (!needsAsaasCheck) {
      return res.json({ paid: true, status: user.subscription_status });
    }

    const subResult = await query(
      `SELECT id, user_id, asaas_subscription_id, duration_months FROM subscriptions
       WHERE user_id = $1 AND asaas_subscription_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (subResult.rows.length === 0) {
      return res.json({ paid: false, message: 'Nenhuma assinatura pendente' });
    }

    const sub = subResult.rows[0];
    const payments = await asaasService.getSubscriptionPayments(sub.asaas_subscription_id);
    const paid = payments.find(
      (p) => (p.status || '').toUpperCase() === 'RECEIVED' || (p.status || '').toUpperCase() === 'CONFIRMED'
    );

    if (!paid) {
      return res.json({ paid: false });
    }

    const paymentMoment = paid.paymentDate || paid.clientPaymentDate || paid.confirmedDate || paid.dueDate;
    const paymentTime = paymentMoment ? new Date(paymentMoment).getTime() : NaN;
    const expiryTime = user.subscription_expires_at
      ? new Date(user.subscription_expires_at).getTime()
      : null;
    const accountExpiredByDate =
      expiryTime != null && !Number.isNaN(expiryTime) && expiryTime < Date.now();
    // Conta já vencida: não reativar com cobrança antiga (ex.: usuário abre /checkout e verify-payment encontrava o primeiro RECEIVED).
    if (
      accountExpiredByDate &&
      Number.isFinite(paymentTime) &&
      !Number.isNaN(expiryTime) &&
      paymentTime < expiryTime
    ) {
      return res.json({
        paid: false,
        message: 'Assinatura vencida; é necessário um novo pagamento.',
      });
    }

    const userRow = await query(
      `SELECT subscription_expires_at FROM users WHERE id = $1`,
      [userId]
    );
    const currentExpires = userRow.rows[0]?.subscription_expires_at;
    const endDate = computeExpiryAfterRenewal({
      currentExpiresAt: currentExpires,
      paymentDate: paymentMoment,
    });

    await query(
      `UPDATE subscriptions SET status = 'active', start_date = $1, end_date = $2 WHERE asaas_subscription_id = $3`,
      [new Date(paid.paymentDate || Date.now()), endDate, sub.asaas_subscription_id]
    );
    await query(
      `UPDATE users SET subscription_status = 'active', subscription_expires_at = $1, is_active = true WHERE id = $2`,
      [endDate, userId]
    );

    console.log(`Verify-payment: usuário ${userId} ativado (PIX confirmado via API)`);
    res.json({ paid: true, message: 'Pagamento confirmado! Acesso liberado.' });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    res.status(500).json({ paid: false, message: 'Erro ao verificar pagamento' });
  }
});

// Webhook Asaas (PÚBLICO - sem authenticateToken)
// Configurar URL em: https://www.asaas.com/config/integrations → Webhook
// Ex: https://seudominio.com/api/asaas/webhook
router.post('/webhook', async (req, res) => {
  try {
    const { event, payment } = req.body;
    console.log(`[Asaas Webhook] event=${event} paymentId=${payment?.id} subscription=${payment?.subscription}`);
    if (!event || !payment) {
      return res.status(400).send('Payload inválido');
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_ANTICIPATED') {
      const subscriptionId = payment.subscription;
      if (!subscriptionId) {
        // Cobrança avulsa, não é assinatura
        return res.status(200).send('OK');
      }

      const subResult = await query(
        `SELECT s.id, s.user_id, s.plan_name, s.duration_months
         FROM subscriptions s
         WHERE s.asaas_subscription_id = $1`,
        [subscriptionId]
      );
      if (subResult.rows.length === 0) {
        console.warn('Webhook: assinatura não encontrada', subscriptionId);
        return res.status(200).send('OK');
      }

      const sub = subResult.rows[0];
      const userRow = await query(
        `SELECT subscription_expires_at FROM users WHERE id = $1`,
        [sub.user_id]
      );
      const currentExpires = userRow.rows[0]?.subscription_expires_at;
      const paymentMoment =
        payment.paymentDate || payment.clientPaymentDate || payment.confirmedDate || payment.dueDate;
      const endDate = computeExpiryAfterRenewal({
        currentExpiresAt: currentExpires,
        paymentDate: paymentMoment,
      });

      await query(
        `UPDATE subscriptions SET status = 'active', start_date = $1, end_date = $2 WHERE asaas_subscription_id = $3`,
        [new Date(payment.paymentDate || Date.now()), endDate, subscriptionId]
      );
      await query(
        `UPDATE users SET subscription_status = 'active', subscription_expires_at = $1, is_active = true WHERE id = $2`,
        [endDate, sub.user_id]
      );

      console.log(`Webhook Asaas: pagamento confirmado - user ${sub.user_id}, subscription ${subscriptionId}`);
    }

    if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
      const subscriptionId = payment.subscription;
      if (subscriptionId) {
        await query(
          `UPDATE subscriptions SET status = 'past_due' WHERE asaas_subscription_id = $1`,
          [subscriptionId]
        );
        const subResult = await query(
          `SELECT user_id FROM subscriptions WHERE asaas_subscription_id = $1`,
          [subscriptionId]
        );
        if (subResult.rows.length > 0) {
          await query(
            `UPDATE users SET subscription_status = 'overdue' WHERE id = $1`,
            [subResult.rows[0].user_id]
          );
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook Asaas:', error);
    res.status(500).send('Erro');
  }
});

router.get('/my-payments', authenticateToken, async (req, res) => {
  try {
    const r = await query(
      `SELECT asaas_subscription_id FROM subscriptions
       WHERE user_id = $1 AND asaas_subscription_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (r.rows.length === 0) {
      return res.json({ payments: [] });
    }
    const payments = await asaasService.getSubscriptionPayments(r.rows[0].asaas_subscription_id);
    const list = (payments || []).map((p) => ({
      id: p.id,
      status: p.status,
      value: p.value,
      dueDate: p.dueDate,
      paymentDate: p.paymentDate || p.clientPaymentDate,
      billingType: p.billingType,
      description: p.description,
    }));
    res.json({ payments: list });
  } catch (error) {
    console.error('Erro ao listar pagamentos Asaas:', error);
    res.status(500).json({ message: error.message || 'Erro ao listar pagamentos' });
  }
});

const updateCardValidation = [
  body('creditCard').isObject(),
  body('creditCardHolderInfo').isObject(),
];

router.put('/subscription-payment-method', authenticateToken, updateCardValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { creditCard, creditCardHolderInfo } = req.body;
    const r = await query(
      `SELECT asaas_subscription_id FROM subscriptions
       WHERE user_id = $1 AND asaas_subscription_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (r.rows.length === 0) {
      return res.status(400).json({ message: 'Nenhuma assinatura Asaas encontrada para este usuário.' });
    }
    const subId = r.rows[0].asaas_subscription_id;
    await asaasService.updateSubscriptionPaymentMethod(subId, { creditCard, creditCardHolderInfo });
    await query(
      `UPDATE subscriptions SET payment_method = $1 WHERE asaas_subscription_id = $2`,
      ['credit_card', subId]
    );
    res.json({ success: true, message: 'Cartão cadastrado. As próximas cobranças serão no cartão.' });
  } catch (error) {
    console.error('Erro ao atualizar cartão Asaas:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar cartão' });
  }
});

export default router;
