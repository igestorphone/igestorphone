import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Endpoint público de teste
router.get('/test', (req, res) => {
  res.json({ message: 'API de usuários funcionando!' });
});

// Criar usuário público (sem auth)
router.post('/create', [
  body('nome').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('senha').isLength({ min: 6 }),
  body('tipo').isIn(['admin', 'manager', 'user', 'viewer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      nome, email, senha, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento,
      subscription, permissions
    } = req.body;

    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(senha, saltRounds);

    // Criar usuário
    const userResult = await query(`
      INSERT INTO users (name, email, password_hash, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, email, tipo, created_at
    `, [nome, email, passwordHash, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, true]);

    const user = userResult.rows[0];

    // Criar assinatura se fornecida
    if (subscription) {
      const { planType, durationMonths, price, autoRenew } = subscription;
      console.log('Subscription data:', { planType, durationMonths, price, autoRenew });
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      await query(`
        INSERT INTO subscriptions (user_id, plan_name, status, plan_type, duration_months, price, start_date, end_date, auto_renew)
        VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8)
      `, [user.id, planType, planType, durationMonths, price, startDate, endDate, autoRenew]);
    }

    // Definir permissões - usuários comuns sempre têm todas as permissões
    const defaultPermissions = ['consultar_listas', 'medias_preco', 'buscar_iphone_barato'];
    const userPermissions = tipo === 'admin' ? (permissions || []) : defaultPermissions;
    
    console.log('🔐 Permissões para usuário:', userPermissions);
    for (const permission of userPermissions) {
      console.log('➕ Adicionando permissão:', permission, 'para usuário:', user.id);
      await query(`
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES ($1, $2, true)
        ON CONFLICT (user_id, permission_name) DO UPDATE SET granted = true
      `, [user.id, permission]);
    }

    // Log da ação (sem user_id para teste)
    await query(`
      INSERT INTO system_logs (action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
    `, [
      'user_created',
      JSON.stringify({ created_user_id: user.id, email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      user 
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar usuários (teste sem auth)
router.get('/test-list', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, 
             created_at, last_login, is_active, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar usuário (teste sem auth)
router.delete('/test-delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se usuário existe
    const userResult = await query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = userResult.rows[0];

    // Deletar permissões primeiro
    await query('DELETE FROM user_permissions WHERE user_id = $1', [id]);
    
    // Deletar assinaturas
    await query('DELETE FROM subscriptions WHERE user_id = $1', [id]);
    
    // Deletar usuário
    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
    `, [
      'user_deleted',
      JSON.stringify({ deleted_user_id: id, email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ 
      message: 'Usuário deletado com sucesso',
      deletedUser: user
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar perfil do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, 
             created_at, last_login, is_active, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento
      FROM users WHERE id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    
    // Buscar permissões
    const permissionsResult = await query(`
      SELECT permission_name FROM user_permissions WHERE user_id = $1 AND granted = true
    `, [req.user.id]);
    
    user.permissions = permissionsResult.rows.map(row => row.permission_name);
    
    // Buscar assinatura ativa
    const subscriptionResult = await query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [req.user.id]);
    
    user.subscription = subscriptionResult.rows[0] || null;

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar perfil
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (email) {
      // Verificar se email já existe
      const existingUser = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
      
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (telefone !== undefined) {
      updates.push(`telefone = $${paramCount++}`);
      values.push(telefone);
    }

    if (endereco !== undefined) {
      updates.push(`endereco = $${paramCount++}`);
      values.push(endereco);
    }

    if (cidade !== undefined) {
      updates.push(`cidade = $${paramCount++}`);
      values.push(cidade);
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramCount++}`);
      values.push(estado);
    }

    if (cep !== undefined) {
      updates.push(`cep = $${paramCount++}`);
      values.push(cep);
    }

    if (cpf !== undefined) {
      updates.push(`cpf = $${paramCount++}`);
      values.push(cpf);
    }

    if (rg !== undefined) {
      updates.push(`rg = $${paramCount++}`);
      values.push(rg);
    }

    if (data_nascimento !== undefined) {
      updates.push(`data_nascimento = $${paramCount++}`);
      values.push(data_nascimento);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    values.push(req.user.id);
    const queryText = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    const user = result.rows[0];

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'profile_updated',
      JSON.stringify({ updated_fields: Object.keys(req.body) }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tipo: user.tipo,
        subscription_status: user.subscription_status,
        subscription_expires_at: user.subscription_expires_at
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Alterar senha
router.put('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Buscar senha atual
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'password_changed',
      JSON.stringify({}),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo usuário (apenas admin)
router.post('/', authenticateToken, requireRole('admin'), [
  body('nome').notEmpty().trim().withMessage('Nome é obrigatório'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('tipo').optional().isIn(['admin', 'manager', 'user', 'viewer']).withMessage('Tipo inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      nome, email, senha, tipo = 'user', telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento,
      subscription, permissions, is_active = true
    } = req.body;

    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(senha, saltRounds);

    // Criar usuário - quando criado pelo admin, deve estar aprovado e ativo por padrão
    // Primeiro, tentar adicionar approval_status se não existir (execução silenciosa)
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50)`).catch(() => {});
    
    // Criar usuário - se approval_status existir, definir como 'approved', senão criar sem ele
    let userResult;
    try {
      // Tentar criar com approval_status
      userResult = await query(`
        INSERT INTO users (name, email, password_hash, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, is_active, approval_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'approved')
        RETURNING id, name, email, tipo, created_at, is_active
      `, [nome, email, passwordHash, tipo, telefone || null, endereco || null, cidade || null, estado || null, cep || null, cpf || null, rg || null, data_nascimento || null, is_active]);
    } catch (error) {
      // Se der erro (coluna não existe), criar sem approval_status
      console.log('⚠️ Coluna approval_status não existe, criando usuário sem ela');
      userResult = await query(`
        INSERT INTO users (name, email, password_hash, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, name, email, tipo, created_at, is_active
      `, [nome, email, passwordHash, tipo, telefone || null, endereco || null, cidade || null, estado || null, cep || null, cpf || null, rg || null, data_nascimento || null, is_active]);
    }

    const user = userResult.rows[0];

    // Criar assinatura se fornecida
    if (subscription) {
      const { planType, durationMonths, price, autoRenew } = subscription;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      await query(`
        INSERT INTO subscriptions (user_id, plan_name, status, plan_type, duration_months, price, start_date, end_date, auto_renew)
        VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8)
      `, [user.id, planType, planType, durationMonths, price, startDate, endDate, autoRenew]);
    }

    // Definir permissões
    const defaultPermissions = ['consultar_listas', 'medias_preco', 'buscar_iphone_barato'];
    const userPermissions = permissions && permissions.length > 0 ? permissions : defaultPermissions;
    
    for (const permission of userPermissions) {
      await query(`
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES ($1, $2, true)
        ON CONFLICT (user_id, permission_name) DO UPDATE SET granted = true
      `, [user.id, permission]);
    }

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'user_created_by_admin',
      JSON.stringify({ created_user_id: user.id, email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      user 
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar todos os usuários (apenas admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '', status = '' } = req.query; // Aumentar limite para ver mais usuários
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    // Temporariamente mostrar todos os usuários até a migração ser executada
    // Depois que a migração for executada, podemos adicionar o filtro de volta
    
    if (search) {
      whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND subscription_status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    // Buscar usuários - usar campos básicos que sempre existem
    const usersResult = await query(`
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, 
             created_at, last_login, is_active, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...values, limit, offset]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM users 
      ${whereClause}
    `, values);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar usuários pendentes de aprovação (apenas admin)
// IMPORTANTE: Esta rota deve vir ANTES da rota /:id para não capturar "pending" como ID
router.get('/pending', requireRole('admin'), async (req, res) => {
  try {
    // Verificar se a coluna approval_status existe
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'approval_status'
    `);
    
    let result;
    if (columnCheck.rows.length > 0) {
      // Coluna existe, buscar usuários pendentes
      result = await query(`
        SELECT 
          id, email, name, tipo, created_at, 
          COALESCE(approval_status, 'pending') as approval_status,
          access_expires_at, access_duration_days
        FROM users 
        WHERE COALESCE(approval_status, 'pending') = 'pending'
        ORDER BY created_at DESC
      `);
    } else {
      // Coluna não existe ainda, retornar array vazio
      console.warn('⚠️ Coluna approval_status não existe no banco. Execute a migração add-registration-system.js');
      result = { rows: [] };
    }
    
    res.json({ 
      data: { 
        users: result.rows 
      } 
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários pendentes:', error);
    console.error('❌ Detalhes do erro:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      message: 'Erro ao buscar usuários pendentes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Listar usuários próximos do vencimento (apenas admin)
// IMPORTANTE: Esta rota deve vir ANTES da rota /:id para não capturar "expiring" como ID
router.get('/expiring', requireRole('admin'), async (req, res) => {
  try {
    // Verificar se a coluna access_expires_at existe
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'access_expires_at'
    `);
    
    if (columnCheck.rows.length === 0) {
      return res.json({ 
        data: { 
          expired: [],
          expiring_3_days: [],
          expiring_7_days: [],
          expiring_30_days: []
        } 
      });
    }
    
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Usuários já expirados
    const expiredResult = await query(`
      SELECT 
        id, email, name, tipo, created_at, is_active,
        access_expires_at, access_duration_days,
        EXTRACT(EPOCH FROM (access_expires_at - NOW())) / 86400 as days_expired
      FROM users 
      WHERE access_expires_at IS NOT NULL
        AND access_expires_at < NOW()
        AND is_active = true
        AND COALESCE(approval_status, 'approved') = 'approved'
      ORDER BY access_expires_at ASC
    `);
    
    // Usuários expirando em até 3 dias
    const expiring3DaysResult = await query(`
      SELECT 
        id, email, name, tipo, created_at, is_active,
        access_expires_at, access_duration_days,
        EXTRACT(EPOCH FROM (access_expires_at - NOW())) / 86400 as days_remaining
      FROM users 
      WHERE access_expires_at IS NOT NULL
        AND access_expires_at >= NOW()
        AND access_expires_at <= $1
        AND is_active = true
        AND COALESCE(approval_status, 'approved') = 'approved'
      ORDER BY access_expires_at ASC
    `, [in3Days]);
    
    // Usuários expirando em até 7 dias
    const expiring7DaysResult = await query(`
      SELECT 
        id, email, name, tipo, created_at, is_active,
        access_expires_at, access_duration_days,
        EXTRACT(EPOCH FROM (access_expires_at - NOW())) / 86400 as days_remaining
      FROM users 
      WHERE access_expires_at IS NOT NULL
        AND access_expires_at > $1
        AND access_expires_at <= $2
        AND is_active = true
        AND COALESCE(approval_status, 'approved') = 'approved'
      ORDER BY access_expires_at ASC
    `, [in3Days, in7Days]);
    
    // Usuários expirando em até 30 dias
    const expiring30DaysResult = await query(`
      SELECT 
        id, email, name, tipo, created_at, is_active,
        access_expires_at, access_duration_days,
        EXTRACT(EPOCH FROM (access_expires_at - NOW())) / 86400 as days_remaining
      FROM users 
      WHERE access_expires_at IS NOT NULL
        AND access_expires_at > $1
        AND access_expires_at <= $2
        AND is_active = true
        AND COALESCE(approval_status, 'approved') = 'approved'
      ORDER BY access_expires_at ASC
    `, [in7Days, in30Days]);
    
    res.json({ 
      data: { 
        expired: expiredResult.rows,
        expiring_3_days: expiring3DaysResult.rows,
        expiring_7_days: expiring7DaysResult.rows,
        expiring_30_days: expiring30DaysResult.rows
      } 
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários próximos do vencimento:', error);
    console.error('❌ Detalhes do erro:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      message: 'Erro ao buscar usuários próximos do vencimento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Buscar usuário por ID
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se não é "pending" (deve ter sido capturado pela rota acima)
    if (id === 'pending') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const result = await query(`
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, 
             created_at, last_login, is_active, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento
      FROM users WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    
    // Buscar permissões
    const permissionsResult = await query(`
      SELECT permission_name FROM user_permissions WHERE user_id = $1 AND granted = true
    `, [id]);
    
    user.permissions = permissionsResult.rows.map(row => row.permission_name);
    
    // Buscar assinatura ativa
    const subscriptionResult = await query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [id]);
    
    user.subscription = subscriptionResult.rows[0] || null;

    res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo usuário (teste sem auth)
router.post('/test-create', [
  body('nome').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('senha').isLength({ min: 6 }),
  body('tipo').isIn(['admin', 'manager', 'user', 'viewer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      nome, email, senha, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento,
      subscription, permissions
    } = req.body;

    // Verificar se email já existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Hash da senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(senha, saltRounds);

    // Criar usuário
    const userResult = await query(`
      INSERT INTO users (name, email, password_hash, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, name, email, tipo, created_at
    `, [nome, email, passwordHash, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, true]);

    const user = userResult.rows[0];

    // Criar assinatura se fornecida
    if (subscription) {
      const { planType, durationMonths, price, autoRenew } = subscription;
      console.log('Subscription data:', { planType, durationMonths, price, autoRenew });
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      await query(`
        INSERT INTO subscriptions (user_id, plan_name, status, plan_type, duration_months, price, start_date, end_date, auto_renew)
        VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8)
      `, [user.id, planType, planType, durationMonths, price, startDate, endDate, autoRenew]);
    }

    // Definir permissões - usuários comuns sempre têm todas as permissões
    const defaultPermissions = ['consultar_listas', 'medias_preco', 'buscar_iphone_barato'];
    const userPermissions = tipo === 'admin' ? (permissions || []) : defaultPermissions;
    
    console.log('🔐 Permissões para usuário:', userPermissions);
    for (const permission of userPermissions) {
      console.log('➕ Adicionando permissão:', permission, 'para usuário:', user.id);
      await query(`
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES ($1, $2, true)
        ON CONFLICT (user_id, permission_name) DO UPDATE SET granted = true
      `, [user.id, permission]);
    }

    // Log da ação (sem user_id para teste)
    await query(`
      INSERT INTO system_logs (action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
    `, [
      'user_created',
      JSON.stringify({ created_user_id: user.id, email: user.email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({ 
      message: 'Usuário criado com sucesso',
      user 
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
router.put('/:id', requireRole('admin'), [
  body('nome').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('tipo').optional().isIn(['admin', 'manager', 'user', 'viewer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { 
      nome, email, senha, tipo, telefone, endereco, cidade, estado, cep, cpf, rg, data_nascimento, isActive,
      subscription, permissions, renewAccess, durationDays
    } = req.body;

    // Verificar se usuário existe
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    // Preparar atualizações
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (nome) {
      updates.push(`name = $${paramCount++}`);
      values.push(nome);
    }

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (senha) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(senha, saltRounds);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (tipo) {
      updates.push(`tipo = $${paramCount++}`);
      values.push(tipo);
    }

    if (telefone !== undefined) {
      updates.push(`telefone = $${paramCount++}`);
      values.push(telefone);
    }

    if (endereco !== undefined) {
      updates.push(`endereco = $${paramCount++}`);
      values.push(endereco);
    }

    if (cidade !== undefined) {
      updates.push(`cidade = $${paramCount++}`);
      values.push(cidade);
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramCount++}`);
      values.push(estado);
    }

    if (cep !== undefined) {
      updates.push(`cep = $${paramCount++}`);
      values.push(cep);
    }

    if (cpf !== undefined) {
      updates.push(`cpf = $${paramCount++}`);
      values.push(cpf);
    }

    if (rg !== undefined) {
      updates.push(`rg = $${paramCount++}`);
      values.push(rg);
    }

    if (data_nascimento !== undefined) {
      updates.push(`data_nascimento = $${paramCount++}`);
      values.push(data_nascimento);
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    // Renovar/perlongar acesso se solicitado
    if (renewAccess && durationDays) {
      // Verificar se durationDays é válido
      if (![5, 30, 90, 365].includes(durationDays)) {
        return res.status(400).json({ message: 'Período inválido. Use: 5, 30, 90 ou 365 dias' });
      }
      
      // Buscar data de expiração atual do usuário
      const currentUserResult = await query(`
        SELECT access_expires_at, is_active
        FROM users 
        WHERE id = $1
      `, [id]);
      
      if (currentUserResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      const currentUser = currentUserResult.rows[0];
      let newExpiresAt;
      
      // Se já tem data de expiração e ainda não expirou, prolongar a partir dela
      // Se não tem ou já expirou, calcular a partir de agora
      if (currentUser.access_expires_at) {
        const currentExpiresAt = new Date(currentUser.access_expires_at);
        const now = new Date();
        
        if (currentExpiresAt > now) {
          // Prolongar a partir da data atual de expiração
          newExpiresAt = new Date(currentExpiresAt);
          newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
        } else {
          // Renovar a partir de agora (já expirou)
          newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
        }
      } else {
        // Primeira vez definindo período
        newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
      }
      
      updates.push(`access_expires_at = $${paramCount++}`);
      values.push(newExpiresAt);
      
      updates.push(`access_duration_days = $${paramCount++}`);
      values.push(durationDays);
      
      // Ativar usuário se estava inativo (renovação)
      if (!currentUser.is_active) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(true);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      const queryText = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      await query(queryText, values);
    }

    // Atualizar assinatura se fornecida
    if (subscription) {
      const { planType, durationMonths, price, autoRenew } = subscription;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      // Desativar assinatura atual
      await query(`
        UPDATE subscriptions SET status = 'cancelled' 
        WHERE user_id = $1 AND status = 'active'
      `, [id]);

      // Criar nova assinatura
      await query(`
        INSERT INTO subscriptions (user_id, plan_type, duration_months, price, status, start_date, end_date, auto_renew)
        VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
      `, [id, planType, durationMonths, price, startDate, endDate, autoRenew]);
    }

    // Atualizar permissões se fornecidas
    if (permissions) {
      // Remover permissões existentes
      await query('DELETE FROM user_permissions WHERE user_id = $1', [id]);

      // Adicionar novas permissões
      for (const permission of permissions) {
        await query(`
          INSERT INTO user_permissions (user_id, permission_name, granted)
          VALUES ($1, $2, true)
        `, [id, permission]);
      }
    }

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'user_updated',
      JSON.stringify({ updated_user_id: id, updated_fields: Object.keys(req.body) }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ message: 'Usuário atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar usuário
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const existingUser = await query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Não permitir deletar a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Não é possível deletar seu próprio usuário' });
    }

    // Deletar usuário (cascade vai deletar permissões e assinaturas)
    await query('DELETE FROM users WHERE id = $1', [id]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'user_deleted',
      JSON.stringify({ deleted_user_id: id, deleted_user_email: existingUser.rows[0].email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ message: 'Usuário deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Ativar/desativar usuário (apenas admin)
router.put('/:id/toggle-status', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await query(`
      UPDATE users 
      SET is_active = $1 
      WHERE id = $2 
      RETURNING id, email, name, is_active
    `, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'user_status_changed',
      JSON.stringify({ target_user_id: id, new_status: is_active }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ 
      message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`,
      user 
    });

  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar permissões do usuário
router.patch('/:id/permissions', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Verificar se usuário existe
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Remover permissões existentes
    await query('DELETE FROM user_permissions WHERE user_id = $1', [id]);

    // Adicionar novas permissões
    if (permissions && permissions.length > 0) {
      for (const permission of permissions) {
        await query(`
          INSERT INTO user_permissions (user_id, permission_name, granted)
          VALUES ($1, $2, true)
        `, [id, permission]);
      }
    }

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'user_permissions_updated',
      JSON.stringify({ target_user_id: id, permissions }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ message: 'Permissões atualizadas com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar assinatura do usuário
router.patch('/:id/subscription', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { planType, durationMonths, price, autoRenew } = req.body;

    // Verificar se usuário existe
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Desativar assinatura atual
    await query(`
      UPDATE subscriptions SET status = 'cancelled' 
      WHERE user_id = $1 AND status = 'active'
    `, [id]);

    // Criar nova assinatura
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    await query(`
      INSERT INTO subscriptions (user_id, plan_type, duration_months, price, status, start_date, end_date, auto_renew)
      VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
    `, [id, planType, durationMonths, price, startDate, endDate, autoRenew]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'user_subscription_updated',
      JSON.stringify({ target_user_id: id, planType, durationMonths, price }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ message: 'Assinatura atualizada com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar assinatura do usuário
router.get('/:id/subscription', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT * FROM subscriptions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Assinatura não encontrada' });
    }

    res.json({ subscription: result.rows[0] });

  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar permissões do usuário
router.get('/:id/permissions', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT permission_name FROM user_permissions 
      WHERE user_id = $1 AND granted = true
    `, [id]);

    res.json({ permissions: result.rows.map(row => row.permission_name) });

  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});


// Aprovar usuário e definir período de acesso (apenas admin)
router.post('/:id/approve', requireRole('admin'), [
  body('durationDays').isIn([5, 30, 90, 365]).withMessage('Período inválido. Use: 5, 30, 90 ou 365 dias')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { durationDays } = req.body;
    const adminId = req.user.id;
    
    // Verificar se usuário existe e está pendente
    const userResult = await query(`
      SELECT id, email, name, approval_status
      FROM users
      WHERE id = $1
    `, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const user = userResult.rows[0];
    
    if (user.approval_status !== 'pending') {
      return res.status(400).json({ 
        message: `Usuário já está com status: ${user.approval_status}` 
      });
    }
    
    // Calcular data de expiração
    const accessExpiresAt = new Date();
    accessExpiresAt.setDate(accessExpiresAt.getDate() + durationDays);
    
    // Atualizar usuário: aprovar, ativar e definir período
    await query(`
      UPDATE users
      SET 
        approval_status = 'approved',
        is_active = true,
        access_expires_at = $1,
        access_duration_days = $2
      WHERE id = $3
    `, [accessExpiresAt, durationDays, id]);
    
    // Garantir permissões padrão
    const defaultPermissions = ['consultar_listas', 'medias_preco', 'buscar_iphone_barato'];
    for (const permission of defaultPermissions) {
      await query(`
        INSERT INTO user_permissions (user_id, permission_name, granted)
        VALUES ($1, $2, true)
        ON CONFLICT (user_id, permission_name) DO UPDATE SET granted = true
      `, [id, permission]);
    }
    
    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      adminId,
      'user_approved',
      JSON.stringify({ 
        approved_user_id: id, 
        approved_user_email: user.email,
        duration_days: durationDays,
        expires_at: accessExpiresAt
      }),
      req.ip,
      req.get('User-Agent')
    ]);
    
    res.json({
      message: 'Usuário aprovado com sucesso',
      data: {
        user: {
          id: id,
          email: user.email,
          name: user.name,
          approvalStatus: 'approved',
          accessExpiresAt: accessExpiresAt,
          durationDays: durationDays
        }
      }
    });
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;