import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';

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
    const emailNormalized = (email || '').toString().toLowerCase().trim();

    // Buscar usuário (email normalizado para bater com o que foi salvo na criação)
    const result = await query(`
      SELECT 
        id,
        email,
        password_hash,
        name,
        COALESCE(tipo, role, 'user') AS role,
        subscription_status,
        subscription_expires_at,
        is_active,
        last_login,
        access_expires_at,
        approval_status
      FROM users
      WHERE LOWER(TRIM(email)) = $1
    `, [emailNormalized]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    // Verificar se usuário está aprovado (apenas se a coluna existir e não for nula)
    if (user.approval_status && user.approval_status === 'pending') {
      return res.status(403).json({ message: 'Aguardando aprovação do administrador' });
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada' });
    }

    // Verificar se o acesso expirou
    if (user.access_expires_at) {
      const now = new Date();
      const accessExpiresAt = new Date(user.access_expires_at);
      
      if (now > accessExpiresAt) {
        // Desativar usuário automaticamente
        await query(
          'UPDATE users SET is_active = false WHERE id = $1',
          [user.id]
        );
        
        return res.status(403).json({ 
          message: 'Seu período de acesso expirou. Entre em contato com o administrador.',
          access_expired: true
        });
      }
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


