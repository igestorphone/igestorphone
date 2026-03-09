import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import * as asaasService from '../services/asaas.js';

const router = express.Router();

// Planos disponíveis (público - teste oculto)
router.get('/plans', (req, res) => {
  const plans = Object.entries(asaasService.PLANS)
    .filter(([key]) => key !== 'teste')
    .map(([key, p]) => ({
      id: key,
      name: p.name,
      planName: p.planName,
      value: p.value,
      cycle: p.cycle,
      durationMonths: p.durationMonths,
    }));
  res.json({ plans });
});

// Criar assinatura (requer autenticação + cpf/phone no user ou no body)
const createSubscriptionValidation = [
  body('planKey').isIn(['teste', 'mensal', 'trimestral', 'anual']),
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

    const subscription = await asaasService.createSubscription({
      customerId: customer.id,
      planKey,
      billingType,
      creditCard,
      creditCardHolderInfo,
    });

    // Inserir assinatura no banco (status pendente até webhook PAYMENT_RECEIVED)
    const plan = asaasService.PLANS[planKey];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    await query(
      `INSERT INTO subscriptions (
        user_id, plan_name, status, asaas_subscription_id,
        plan_type, duration_months, price, payment_method,
        start_date, end_date, auto_renew
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [
        user.id,
        plan.planName,
        billingType === 'CREDIT_CARD' ? 'active' : 'PENDING',
        subscription.id,
        planKey,
        plan.durationMonths,
        plan.value,
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

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
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
      `SELECT id, subscription_status FROM users WHERE id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ paid: false, message: 'Usuário não encontrado' });
    }
    const user = userResult.rows[0];

    if (user.subscription_status !== 'pending_payment') {
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

    const endDate = new Date(paid.paymentDate || paid.dueDate || Date.now());
    endDate.setMonth(endDate.getMonth() + (sub.duration_months || 1));

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
      const endDate = new Date(payment.dueDate || new Date());
      endDate.setMonth(endDate.getMonth() + (sub.duration_months || 1));

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

export default router;
