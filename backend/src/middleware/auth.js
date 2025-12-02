import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

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
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, 
             is_active, access_expires_at, approval_status
      FROM users WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada' });
    }

    // Verificar se o acesso expirou (sistema de período de acesso)
    if (user.access_expires_at) {
      const now = new Date();
      const accessExpiresAt = new Date(user.access_expires_at);
      
      if (now > accessExpiresAt) {
        // Desativar usuário automaticamente quando o acesso expirar
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

    // Adicionar dados do usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.tipo,
      subscription_status: user.subscription_status,
      subscription_expires_at: user.subscription_expires_at
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


