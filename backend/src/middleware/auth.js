import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const IDLE_TIMEOUT_MINUTES = parseInt(process.env.IDLE_TIMEOUT_MINUTES || '15', 10);
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const TOUCH_INTERVAL_MS = parseInt(process.env.IDLE_TOUCH_INTERVAL_MS || `${60 * 1000}`, 10); // 1 min

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token de acesso necessário' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco para verificar se ainda está ativo
    const result = await query(`
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, is_active, last_activity_at, parent_id
      FROM users WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada' });
    }

    // Verificar inatividade (logout após 15 minutos sem atividade)
    const nowMs = Date.now();
    const lastActivityMs = user.last_activity_at ? new Date(user.last_activity_at).getTime() : null;

    if (lastActivityMs && nowMs - lastActivityMs > IDLE_TIMEOUT_MS) {
      return res.status(401).json({ message: 'Sessão expirada por inatividade' });
    }

    // Verificar se a assinatura não expirou
    if (user.subscription_status === 'trial' && user.subscription_expires_at) {
      const now = new Date();
      const expiresAt = new Date(user.subscription_expires_at);
      
      if (now > expiresAt) {
        // Atualizar status para expirado
        await query(
          'UPDATE users SET subscription_status = $1 WHERE id = $2',
          ['expired', user.id]
        );
        
        return res.status(403).json({ 
          message: 'Assinatura expirada',
          subscription_status: 'expired'
        });
      }
    }

    // Atualizar last_activity_at com throttle (evita update em todo request)
    const shouldTouch =
      !lastActivityMs || (nowMs - lastActivityMs) > TOUCH_INTERVAL_MS;
    if (shouldTouch) {
      await query('UPDATE users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    }

    // Adicionar dados do usuário ao request (parent_id: funcionário usa o calendário do assinante)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.tipo,
      subscription_status: user.subscription_status,
      subscription_expires_at: user.subscription_expires_at,
      parent_id: user.parent_id || null
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Acesso negado. Permissão insuficiente.',
        required_roles: allowedRoles,
        user_role: userRole
      });
    }

    next();
  };
};

export const requireSubscription = (requiredStatus = 'active') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const userStatus = req.user.subscription_status;
    const allowedStatuses = Array.isArray(requiredStatus) ? requiredStatus : [requiredStatus];

    if (!allowedStatuses.includes(userStatus)) {
      return res.status(403).json({ 
        message: 'Assinatura necessária para acessar este recurso',
        required_status: allowedStatuses,
        current_status: userStatus
      });
    }

    next();
  };
};


