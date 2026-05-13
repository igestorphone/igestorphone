import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { sendPasswordResetEmail, isMailConfigured } from '../services/mail.js';

const router = express.Router();

// Rota de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

// Validações
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

function hashPasswordResetToken(raw) {
  return crypto.createHash('sha256').update(String(raw), 'utf8').digest('hex');
}

function buildPasswordResetFrontendBase() {
  const frontendUrlRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
  let frontendUrl = frontendUrlRaw.split(',')[0].trim();
  if (frontendUrl.includes('igestorphone.com.br') && !frontendUrl.includes('www.')) {
    frontendUrl = frontendUrl.replace('igestorphone.com.br', 'www.igestorphone.com.br');
  }
  return frontendUrl.replace(/\/+$/, '');
}

// Registrar novo usuário
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Verificar se usuário já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const result = await query(`
      INSERT INTO users (email, password_hash, name, subscription_status, subscription_expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, subscription_status, created_at
    `, [
      email,
      passwordHash,
      name,
      'trial',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias de trial
    ]);

    const user = result.rows[0];

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      'user_registered',
      JSON.stringify({ email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        created_at: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const emailStr = (email || '').toString().trim();
    const emailNormalized = emailStr.toLowerCase();

    const baseWhere = 'WHERE LOWER(TRIM(email)) = $1';
    const fallbackWhere = 'WHERE TRIM(email) = $1';
    const fullSelect = `id, email, password_hash, name, is_active, last_login,
      subscription_status, subscription_expires_at,
      COALESCE(tipo, role, 'user') AS role,
      access_expires_at, approval_status, parent_id`;
    const minimalSelect = `id, email, password_hash, name, is_active, last_login,
      subscription_status, subscription_expires_at`;

    let result;
    try {
      result = await query(`SELECT ${fullSelect} FROM users ${baseWhere}`, [emailNormalized]);
    } catch (err) {
      if (err.message && err.message.includes('column')) {
        result = await query(`SELECT ${minimalSelect} FROM users ${baseWhere}`, [emailNormalized]);
        if (result.rows.length > 0) result.rows[0].role = 'user';
      } else throw err;
    }
    if (result.rows.length === 0 && emailStr !== emailNormalized) {
      try {
        result = await query(`SELECT ${fullSelect} FROM users ${fallbackWhere}`, [emailStr]);
      } catch (err) {
        if (err.message && err.message.includes('column')) {
          result = await query(`SELECT ${minimalSelect} FROM users ${fallbackWhere}`, [emailStr]);
          if (result.rows.length > 0) result.rows[0].role = 'user';
        } else throw err;
      }
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    user.role = user.role || 'user';
    if (user.access_expires_at) {
      const now = new Date();
      const accessExpiresAt = new Date(user.access_expires_at);
      if (now > accessExpiresAt) {
        await query('UPDATE users SET is_active = false WHERE id = $1', [user.id]);
        return res.status(403).json({
          message: 'Seu período de acesso expirou. Entre em contato com o administrador.',
          access_expired: true
        });
      }
    }
    if (user.approval_status === 'pending') {
      if (user.parent_id) {
        await query('UPDATE users SET approval_status = $1 WHERE id = $2', ['approved', user.id]).catch(() => {});
      } else {
        return res.status(403).json({ message: 'Aguardando aprovação do administrador' });
      }
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_activity_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      'user_login',
      JSON.stringify({ email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        subscription_expires_at: user.subscription_expires_at,
        last_login: user.last_login
      },
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

const forgotPasswordMessage =
  'Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Verifique também a caixa de spam.';

// Solicitar link de redefinição de senha (público)
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Informe um e-mail válido.' });
    }

    const email = (req.body.email || '').toString().toLowerCase().trim();

    if (!isMailConfigured()) {
      console.warn('[auth] forgot-password: SMTP não configurado');
      return res.status(503).json({
        message: 'Recuperação de senha indisponível no momento. Entre em contato com o suporte.',
      });
    }

    const result = await query(
      `SELECT id, name, email FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json({ message: forgotPasswordMessage });
    }

    const user = result.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(`DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL`, [user.id]);
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${buildPasswordResetFrontendBase()}/reset-password/${rawToken}`;

    void sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    }).catch((e) => console.error('[mail] password reset:', e?.message || e));

    await query(
      `INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        'password_reset_requested',
        JSON.stringify({ email: user.email }),
        req.ip,
        req.get('User-Agent'),
      ]
    ).catch(() => {});

    return res.json({ message: forgotPasswordMessage });
  } catch (error) {
    console.error('Erro em forgot-password:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar se o token do link ainda é válido (público)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const raw = req.params.token;
    if (!raw || String(raw).length < 32) {
      return res.json({ valid: false, message: 'Link inválido.' });
    }
    const tokenHash = hashPasswordResetToken(raw);
    const r = await query(
      `SELECT prt.id FROM password_reset_tokens prt
       WHERE prt.token_hash = $1 AND prt.used_at IS NULL AND prt.expires_at > NOW()`,
      [tokenHash]
    );
    if (r.rows.length === 0) {
      return res.json({ valid: false, message: 'Link inválido ou expirado. Solicite um novo.' });
    }
    return res.json({ valid: true });
  } catch (error) {
    console.error('Erro em reset-password (GET):', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Definir nova senha com o token do e-mail (público)
router.post(
  '/reset-password',
  [
    body('token').isString().isLength({ min: 32 }).withMessage('Token inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0]?.msg || 'Dados inválidos.' });
      }

      const { token, password } = req.body;
      const tokenHash = hashPasswordResetToken(token);

      const r = await query(
        `SELECT id, user_id FROM password_reset_tokens
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
        [tokenHash]
      );

      if (r.rows.length === 0) {
        return res.status(400).json({ message: 'Link inválido ou expirado. Solicite um novo.' });
      }

      const row = r.rows[0];
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      await query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        passwordHash,
        row.user_id,
      ]);
      await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [row.id]);
      await query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL AND id != $2`,
        [row.user_id, row.id]
      );

      await query(
        `INSERT INTO system_logs (user_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
        [
          row.user_id,
          'password_reset_completed',
          JSON.stringify({}),
          req.ip,
          req.get('User-Agent'),
        ]
      ).catch(() => {});

      return res.json({ message: 'Senha atualizada. Você já pode entrar com a nova senha.' });
    } catch (error) {
      console.error('Erro em reset-password (POST):', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar dados atualizados do usuário
    const result = await query(`
      SELECT id, email, name, role, subscription_status, subscription_expires_at, 
             is_active, created_at, last_login
      FROM users WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        subscription_expires_at: user.subscription_expires_at,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    console.error('Erro na verificação do token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Logout (opcional - para invalidar tokens)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Log da ação
      await query(`
        INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        decoded.userId,
        'user_logout',
        JSON.stringify({}),
        req.ip,
        req.get('User-Agent')
      ]);
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;


