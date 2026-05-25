import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendRegistrationEmails } from '../services/mail.js';

const router = express.Router();

const TRIAL_DAYS = 3;
const TRIAL_GRACE_DAYS = 5;

// Gerar link de cadastro (apenas admin)
router.post('/registration-links', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { expiresInDays = 7 } = req.body;
    const adminId = req.user.id;
    
    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    // Salvar token no banco
    const result = await query(`
      INSERT INTO registration_tokens (token, created_by, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, token, created_at, expires_at
    `, [token, adminId, expiresAt]);
    
    const registrationToken = result.rows[0];
    
    // Gerar URL completa - garantir formato correto: https://www.igestorphone.com.br/register/TOKEN
    const frontendUrlRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
    let frontendUrl = frontendUrlRaw.split(',')[0].trim(); // Pega apenas a primeira URL
    
    // Garantir que use www.igestorphone.com.br (formato que funciona)
    if (frontendUrl.includes('igestorphone.com.br') && !frontendUrl.includes('www.')) {
      frontendUrl = frontendUrl.replace('igestorphone.com.br', 'www.igestorphone.com.br');
    }
    
    // Remover barra final se houver
    frontendUrl = frontendUrl.replace(/\/+$/, '');
    
    // Usar path parameter - formato que funciona perfeitamente: /register/TOKEN
    const registrationUrl = `${frontendUrl}/register/${token}`;
    
    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      adminId,
      'registration_link_created',
      JSON.stringify({ token_id: registrationToken.id, expires_at: expiresAt }),
      req.ip,
      req.get('User-Agent')
    ]);
    
    res.status(201).json({
      message: 'Link de cadastro gerado com sucesso',
      data: {
        id: registrationToken.id,
        token: registrationToken.token,
        url: registrationUrl,
        expiresAt: registrationToken.expires_at,
        createdAt: registrationToken.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao gerar link de cadastro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Gerar link trial (3 dias grátis + 5 dias p/ pagar, senão exclui)
router.post('/registration-links/trial', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const adminId = req.user.id;
    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await query(`ALTER TABLE registration_tokens ADD COLUMN IF NOT EXISTS trial_days INTEGER`).catch(() => {});
    await query(`ALTER TABLE registration_tokens ADD COLUMN IF NOT EXISTS trial_grace_days INTEGER`).catch(() => {});

    const result = await query(`
      INSERT INTO registration_tokens (token, created_by, expires_at, trial_days, trial_grace_days)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, token, created_at, expires_at, trial_days, trial_grace_days
    `, [token, adminId, expiresAt, TRIAL_DAYS, TRIAL_GRACE_DAYS]);

    const registrationToken = result.rows[0];

    const frontendUrlRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
    let frontendUrl = frontendUrlRaw.split(',')[0].trim();
    if (frontendUrl.includes('igestorphone.com.br') && !frontendUrl.includes('www.')) {
      frontendUrl = frontendUrl.replace('igestorphone.com.br', 'www.igestorphone.com.br');
    }
    frontendUrl = frontendUrl.replace(/\/+$/, '');
    const registrationUrl = `${frontendUrl}/register/${token}`;

    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      adminId,
      'trial_link_created',
      JSON.stringify({ token_id: registrationToken.id, trial_days: TRIAL_DAYS, trial_grace_days: TRIAL_GRACE_DAYS }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      message: `Link trial gerado: ${TRIAL_DAYS} dias grátis + ${TRIAL_GRACE_DAYS} dias p/ pagar`,
      data: {
        id: registrationToken.id,
        token: registrationToken.token,
        url: registrationUrl,
        expiresAt: registrationToken.expires_at,
        trialDays: TRIAL_DAYS,
        trialGraceDays: TRIAL_GRACE_DAYS,
      }
    });
  } catch (error) {
    console.error('Erro ao gerar link trial:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar links de cadastro gerados (apenas admin)
router.get('/registration-links', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        rt.id,
        rt.token,
        rt.created_at,
        rt.expires_at,
        rt.is_used,
        rt.used_at,
        rt.trial_days,
        rt.trial_grace_days,
        u.name as created_by_name,
        u2.name as used_by_name
      FROM registration_tokens rt
      LEFT JOIN users u ON rt.created_by = u.id
      LEFT JOIN users u2 ON rt.used_by = u2.id
      ORDER BY rt.created_at DESC
    `);
    
    const frontendUrlRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
    let frontendUrl = frontendUrlRaw.split(',')[0].trim(); // Pega apenas a primeira URL
    
    // Garantir que use www.igestorphone.com.br (formato que funciona)
    if (frontendUrl.includes('igestorphone.com.br') && !frontendUrl.includes('www.')) {
      frontendUrl = frontendUrl.replace('igestorphone.com.br', 'www.igestorphone.com.br');
    }
    
    // Remover barra final se houver
    frontendUrl = frontendUrl.replace(/\/+$/, '');
    
    const links = result.rows.map(row => ({
      id: row.id,
      token: row.token,
      url: `${frontendUrl}/register/${row.token}`,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      isUsed: row.is_used,
      usedAt: row.used_at,
      createdByName: row.created_by_name,
      usedByName: row.used_by_name,
      isValid: !row.is_used && new Date(row.expires_at) > new Date(),
      isTrial: row.trial_days != null && row.trial_days > 0,
      trialDays: row.trial_days || null,
    }));
    
    res.json({ data: { links } });
  } catch (error) {
    console.error('Erro ao listar links de cadastro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Função helper para verificar token (reutilizável)
const verifyTokenHelper = async (token) => {
  if (!token) {
    return { valid: false, message: 'Token não fornecido' };
  }
  
  const result = await query(`
    SELECT id, token, expires_at, is_used, trial_days, trial_grace_days
    FROM registration_tokens
    WHERE token = $1
  `, [token]);
  
  if (result.rows.length === 0) {
    return { valid: false, message: 'Token inválido' };
  }
  
  const tokenData = result.rows[0];

  if (tokenData.is_used) {
    return { valid: false, message: 'Este link de cadastro já foi utilizado' };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return { valid: false, message: 'Este link expirou' };
  }

  return { valid: true, tokenData };
};

/** Cria usuário (pendente ou trial ativo). opts.trial ativa o acesso direto. */
const insertPendingUserRecord = async (req, logAction, logDetails = {}, opts = {}) => {
  const { name, email, password, endereco, data_nascimento, whatsapp, nome_loja, cnpj } = req.body;

  if (cnpj && String(cnpj).replace(/\D/g, '').length !== 14) {
    return { success: false, status: 400, message: 'CNPJ inválido. Deve ter 14 dígitos.' };
  }

  const existingUser = await query('SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);
  if (existingUser.rows.length > 0) {
    return { success: false, status: 400, message: 'Email já está em uso' };
  }

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`).catch(() => {});
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nome_loja VARCHAR(255)`).catch(() => {});
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18)`).catch(() => {});
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_grace_days INTEGER`).catch(() => {});

  const phone = whatsapp ? String(whatsapp).trim() : null;

  const isTrial = !!opts.trial;
  const trialDays = opts.trialDays || TRIAL_DAYS;
  const trialGraceDays = opts.trialGraceDays || TRIAL_GRACE_DAYS;

  const isActive = isTrial ? true : false;
  const approvalStatus = isTrial ? 'approved' : 'pending';
  const subscriptionStatus = isTrial ? 'trial' : null;
  const subscriptionExpiresAt = isTrial
    ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
    : null;
  const userTrialGraceDays = isTrial ? trialGraceDays : null;

  const userResult = await query(
    `
    INSERT INTO users (
      name, email, password_hash, tipo, is_active, approval_status,
      endereco, data_nascimento, telefone, whatsapp, nome_loja, cnpj,
      subscription_status, subscription_expires_at, trial_grace_days
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $12, $13, $14)
    RETURNING id, name, email, tipo, approval_status, created_at, subscription_status, subscription_expires_at
  `,
    [
      name,
      email,
      passwordHash,
      'user',
      isActive,
      approvalStatus,
      endereco || null,
      data_nascimento || null,
      phone,
      nome_loja || null,
      cnpj ? String(cnpj).replace(/\D/g, '') : null,
      subscriptionStatus,
      subscriptionExpiresAt,
      userTrialGraceDays,
    ]
  );

  const user = userResult.rows[0];

  await query(
    `
    INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
  `,
    [user.id, logAction, JSON.stringify({ email: user.email, ...logDetails }), req.ip, req.get('User-Agent')]
  );

  const nomeLojaVal = req.body.nome_loja != null && String(req.body.nome_loja).trim() ? String(req.body.nome_loja).trim() : null;
  void sendRegistrationEmails({
    userId: user.id,
    userName: name,
    userEmail: email,
    nomeLoja: nomeLojaVal,
    whatsapp: phone,
    endereco: req.body.endereco != null ? String(req.body.endereco).trim() : null,
    cnpj: req.body.cnpj != null ? String(req.body.cnpj).replace(/\D/g, '') : null,
    registrationKind: logAction,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }).catch((err) => console.error('[mail] cadastro:', err?.message || err));

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        approvalStatus: user.approval_status,
      },
    },
  };
};

// Verificar se token é válido (público) - Path Parameter
router.get('/register/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const verification = await verifyTokenHelper(token);
    
    if (!verification.valid) {
      return res.status(verification.message.includes('inválido') ? 404 : 400).json({ message: verification.message });
    }
    
    const td = verification.tokenData;
    res.json({
      message: 'Token válido',
      data: {
        token: td.token,
        expiresAt: td.expires_at,
        trialDays: td.trial_days || null,
        trialGraceDays: td.trial_grace_days || null,
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar se token é válido (público) - Query String
router.get('/register', async (req, res) => {
  try {
    const token = req.query.token;
    const verification = await verifyTokenHelper(token);
    
    if (!verification.valid) {
      return res.status(verification.message.includes('inválido') ? 404 : 400).json({ message: verification.message });
    }
    
    const td = verification.tokenData;
    res.json({
      message: 'Token válido',
      data: {
        token: td.token,
        expiresAt: td.expires_at,
        trialDays: td.trial_days || null,
        trialGraceDays: td.trial_grace_days || null,
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Função helper para registrar usuário (reutilizável)
const registerUserHelper = async (token, req) => {
  const verification = await verifyTokenHelper(token);
  if (!verification.valid) {
    return {
      success: false,
      status: verification.message.includes('inválido') ? 404 : 400,
      message: verification.message,
    };
  }

  const tokenData = verification.tokenData;
  const isTrial = tokenData.trial_days != null && tokenData.trial_days > 0;
  const trialOpts = isTrial
    ? { trial: true, trialDays: tokenData.trial_days, trialGraceDays: tokenData.trial_grace_days || TRIAL_GRACE_DAYS }
    : {};

  const inserted = await insertPendingUserRecord(
    req,
    isTrial ? 'user_registered_trial' : 'user_registered_via_token',
    { token_id: tokenData.id },
    trialOpts
  );
  if (!inserted.success) {
    return inserted;
  }

  const userId = inserted.data.user.id;
  try {
    await query(
      `UPDATE registration_tokens SET is_used = true, used_at = NOW(), used_by = $1 WHERE id = $2`,
      [userId, tokenData.id]
    );
  } catch (e) {
    console.error('Aviso: não foi possível marcar token de cadastro como usado:', e.message);
  }

  return inserted;
};

// Cadastro público (sem link) — fica pendente até aprovação no painel admin
router.post(
  '/register/public',
  [
    body('name').notEmpty().trim().withMessage('Nome é obrigatório'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('whatsapp').notEmpty().trim().withMessage('WhatsApp é obrigatório'),
    body('nome_loja').optional({ values: 'falsy' }).trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome_loja, name } = req.body;
      req.body.endereco = req.body.endereco ?? null;
      req.body.data_nascimento = req.body.data_nascimento ?? null;
      req.body.cnpj = req.body.cnpj ?? null;
      req.body.nome_loja = nome_loja && String(nome_loja).trim() ? String(nome_loja).trim() : String(name).trim();

      const result = await insertPendingUserRecord(req, 'user_registered_public', {});

      if (!result.success) {
        return res.status(result.status).json({ message: result.message });
      }

      res.status(201).json({
        message: 'Cadastro recebido! Aguarde a aprovação de um administrador para acessar o sistema.',
        data: result.data,
      });
    } catch (error) {
      console.error('Erro no cadastro público:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Registrar usuário via token (público) - Path Parameter
router.post('/register/:token', [
  body('name').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('endereco').optional().trim(),
  body('data_nascimento').optional().isISO8601().withMessage('Data de nascimento inválida'),
  body('whatsapp').notEmpty().trim().withMessage('WhatsApp é obrigatório'),
  body('nome_loja').notEmpty().trim().withMessage('Nome da loja é obrigatório'),
  body('cnpj').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { token } = req.params;
    const result = await registerUserHelper(token, req);
    
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    
    res.status(201).json({
      message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
      data: result.data
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Registrar usuário via token (público) - Query String
router.post('/register', [
  body('name').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('endereco').optional().trim(),
  body('data_nascimento').optional().isISO8601().withMessage('Data de nascimento inválida'),
  body('whatsapp').notEmpty().trim().withMessage('WhatsApp é obrigatório'),
  body('nome_loja').notEmpty().trim().withMessage('Nome da loja é obrigatório'),
  body('cnpj').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ message: 'Token não fornecido' });
    }
    
    const result = await registerUserHelper(token, req);
    
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }
    
    res.status(201).json({
      message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
      data: result.data
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

