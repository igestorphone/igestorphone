import express from 'express';
import Stripe from 'stripe';
import { query } from '../config/database.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Buscar assinatura do usuário
router.get('/my-subscription', async (req, res) => {
  try {
    // Buscar assinatura e dados do usuário
    const subscriptionResult = await query(`
      SELECT s.*, u.email, u.name, u.created_at as user_created_at, 
             u.last_login, u.subscription_status, u.subscription_expires_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [req.user.id]);

    if (subscriptionResult.rows.length === 0) {
      // Se não tiver assinatura, retornar apenas dados do usuário
      const userResult = await query(`
        SELECT id, email, name, created_at as user_created_at, 
               last_login, subscription_status, subscription_expires_at
        FROM users
        WHERE id = $1
      `, [req.user.id]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      return res.json({ 
        subscription: null,
        user: userResult.rows[0]
      });
    }

    const subscription = subscriptionResult.rows[0];
    res.json({ subscription });

  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar planos disponíveis
router.get('/plans', async (req, res) => {
  try {
    const result = await query(`
      SELECT value FROM settings WHERE key = 'subscription_plans'
    `);
    
    if (result.rows.length === 0) {
      return res.status(500).json({ message: 'Planos não configurados' });
    }

    const plans = JSON.parse(result.rows[0].value);
    res.json({ plans });

  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar sessão de checkout do Stripe
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planName, priceId } = req.body;

    if (!planName || !priceId) {
      return res.status(400).json({ message: 'Plano e preço são obrigatórios' });
    }

    // Buscar dados do usuário
    const userResult = await query(`
      SELECT email, name FROM users WHERE id = $1
    `, [req.user.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
      metadata: {
        userId: req.user.id.toString(),
        planName: planName
      }
    });

    res.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Webhook do Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Funções auxiliares para webhooks
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.userId;
  const planName = session.metadata.planName;

  // Buscar dados da subscription do Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Criar registro no banco
  await query(`
    INSERT INTO subscriptions (user_id, plan_name, status, stripe_subscription_id, 
                              current_period_start, current_period_end)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    userId,
    planName,
    subscription.status,
    subscription.id,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  ]);

  // Atualizar status do usuário
  await query(`
    UPDATE users 
    SET subscription_status = 'active', 
        subscription_expires_at = $1,
        stripe_customer_id = $2
    WHERE id = $3
  `, [
    new Date(subscription.current_period_end * 1000),
    subscription.customer,
    userId
  ]);

  console.log(`Assinatura criada para usuário ${userId}`);
}

async function handleSubscriptionUpdated(subscription) {
  await query(`
    UPDATE subscriptions 
    SET status = $1, 
        current_period_start = $2,
        current_period_end = $3,
        cancel_at_period_end = $4
    WHERE stripe_subscription_id = $5
  `, [
    subscription.status,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
    subscription.cancel_at_period_end,
    subscription.id
  ]);

  // Atualizar status do usuário
  const userResult = await query(`
    SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1
  `, [subscription.id]);

  if (userResult.rows.length > 0) {
    const userId = userResult.rows[0].user_id;
    
    await query(`
      UPDATE users 
      SET subscription_status = $1,
          subscription_expires_at = $2
      WHERE id = $3
    `, [
      subscription.status,
      new Date(subscription.current_period_end * 1000),
      userId
    ]);
  }

  console.log(`Assinatura atualizada: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription) {
  await query(`
    UPDATE subscriptions 
    SET status = 'canceled'
    WHERE stripe_subscription_id = $1
  `, [subscription.id]);

  // Atualizar status do usuário
  const userResult = await query(`
    SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1
  `, [subscription.id]);

  if (userResult.rows.length > 0) {
    const userId = userResult.rows[0].user_id;
    
    await query(`
      UPDATE users 
      SET subscription_status = 'canceled'
      WHERE id = $1
    `, [userId]);
  }

  console.log(`Assinatura cancelada: ${subscription.id}`);
}

async function handlePaymentFailed(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  await query(`
    UPDATE subscriptions 
    SET status = 'past_due'
    WHERE stripe_subscription_id = $1
  `, [subscription.id]);

  console.log(`Pagamento falhou para subscription: ${subscription.id}`);
}

// Cancelar assinatura
router.post('/cancel', async (req, res) => {
  try {
    // Buscar subscription ativa
    const result = await query(`
      SELECT stripe_subscription_id FROM subscriptions 
      WHERE user_id = $1 AND status IN ('active', 'past_due')
      ORDER BY created_at DESC LIMIT 1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assinatura ativa não encontrada' });
    }

    const subscriptionId = result.rows[0].stripe_subscription_id;

    // Cancelar no Stripe
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Atualizar no banco
    await query(`
      UPDATE subscriptions 
      SET cancel_at_period_end = true
      WHERE stripe_subscription_id = $1
    `, [subscriptionId]);

    res.json({ message: 'Assinatura será cancelada no final do período atual' });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Reativar assinatura
router.post('/reactivate', async (req, res) => {
  try {
    // Buscar subscription cancelada
    const result = await query(`
      SELECT stripe_subscription_id FROM subscriptions 
      WHERE user_id = $1 AND cancel_at_period_end = true
      ORDER BY created_at DESC LIMIT 1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assinatura cancelada não encontrada' });
    }

    const subscriptionId = result.rows[0].stripe_subscription_id;

    // Reativar no Stripe
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    // Atualizar no banco
    await query(`
      UPDATE subscriptions 
      SET cancel_at_period_end = false
      WHERE stripe_subscription_id = $1
    `, [subscriptionId]);

    res.json({ message: 'Assinatura reativada com sucesso' });

  } catch (error) {
    console.error('Erro ao reativar assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;












