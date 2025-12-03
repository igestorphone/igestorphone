import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

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
    
    // Gerar URL completa - pegar apenas a primeira URL se tiver múltiplas
    const frontendUrlRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = frontendUrlRaw.split(',')[0].trim(); // Pega apenas a primeira URL
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
        u.name as created_by_name,
        u2.name as used_by_name
      FROM registration_tokens rt
      LEFT JOIN users u ON rt.created_by = u.id
      LEFT JOIN users u2 ON rt.used_by = u2.id
      ORDER BY rt.created_at DESC
    `);
    
    const frontendUrlRaw = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = frontendUrlRaw.split(',')[0].trim(); // Pega apenas a primeira URL
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
      isValid: !row.is_used && new Date(row.expires_at) > new Date()
    }));
    
    res.json({ data: { links } });
  } catch (error) {
    console.error('Erro ao listar links de cadastro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar se token é válido (público)
router.get('/register/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await query(`
      SELECT id, token, expires_at, is_used
      FROM registration_tokens
      WHERE token = $1
    `, [token]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Token inválido' });
    }
    
    const tokenData = result.rows[0];
    
    // Removido: não verificar mais se foi usado (permite múltiplos cadastros)
    // Apenas verificar se expirou
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Este link expirou' });
    }
    
    res.json({
      message: 'Token válido',
      data: {
        token: tokenData.token,
        expiresAt: tokenData.expires_at
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Registrar usuário via token (público)
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
    const { name, email, password, endereco, data_nascimento, whatsapp, nome_loja, cnpj } = req.body;
    
    // Verificar se CNPJ tem 14 dígitos (se fornecido)
    if (cnpj && cnpj.replace(/\D/g, '').length !== 14) {
      return res.status(400).json({ message: 'CNPJ inválido. Deve ter 14 dígitos.' });
    }
    
    // Verificar token
    const tokenResult = await query(`
      SELECT id, expires_at, is_used
      FROM registration_tokens
      WHERE token = $1
    `, [token]);
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ message: 'Token inválido' });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Removido: não verificar mais se foi usado (permite múltiplos cadastros)
    // Apenas verificar se expirou
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Este link expirou' });
    }
    
    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    
    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Adicionar colunas se não existirem (executar individualmente para evitar erro)
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`).catch(() => {});
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS nome_loja VARCHAR(255)`).catch(() => {});
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18)`).catch(() => {});
    
    // Criar usuário com status pendente
    const userResult = await query(`
      INSERT INTO users (
        name, email, password_hash, tipo, is_active, approval_status, 
        endereco, data_nascimento, whatsapp, nome_loja, cnpj
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, email, tipo, approval_status, created_at
    `, [
      name, 
      email, 
      passwordHash, 
      'user', 
      false, 
      'pending', 
      endereco || null, 
      data_nascimento || null,
      whatsapp || null,
      nome_loja || null,
      cnpj ? cnpj.replace(/\D/g, '') : null
    ]);
    
    const user = userResult.rows[0];
    
    // Removido: não marcar token como usado (permite múltiplos cadastros com o mesmo link)
    // Apenas registrar o uso no log para histórico
    
    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      user.id,
      'user_registered_via_token',
      JSON.stringify({ token_id: tokenData.id, email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);
    
    res.status(201).json({
      message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          approvalStatus: user.approval_status
        }
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

