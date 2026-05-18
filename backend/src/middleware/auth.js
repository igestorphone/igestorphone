import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { isSessionActive, touchSessionActivity } from '../services/userSessions.js';
import { isSubscriptionExpiredByCalendarSaoPaulo } from '../utils/subscriptionExpiryCalendar.js';

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

    if (!decoded.sid) {
      return res.status(401).json({
        message: 'Faça login novamente para continuar.',
        code: 'SESSION_STALE',
      });
    }

    const sessionOk = await isSessionActive(decoded.sid, decoded.userId);
    if (!sessionOk) {
      return res.status(401).json({
        message: 'Limite de sessões atingido ou login em outro dispositivo. Faça login novamente.',
        code: 'SESSION_REVOKED',
      });
    }

    // Buscar usuário no banco para verificar se ainda está ativo
    const result = await query(`
      SELECT id, email, name, tipo, subscription_status, subscription_expires_at, is_active, last_activity_at, parent_id
      FROM users WHERE id = $1
    `, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    const pathRaw = (req.originalUrl || req.path || '').split('?')[0];

    function isPaymentWallAllowedPath(p) {
      return (
        p === '/api/users/profile' ||
        p.startsWith('/api/users/profile/') ||
        p === '/api/users/sessions' ||
        p.startsWith('/api/users/sessions/') ||
        p === '/api/asaas/create-subscription' ||
        p.startsWith('/api/asaas/create-subscription/') ||
        p === '/api/asaas/verify-payment' ||
        p.startsWith('/api/asaas/verify-payment/')
      );
    }

    function isAdminRow(u) {
      return (u.tipo || '').toString().toLowerCase() === 'admin';
    }

    function subscriptionDatePassed(u) {
      return isSubscriptionExpiredByCalendarSaoPaulo(u.subscription_expires_at);
    }

    function isCanceledSubscription(u) {
      const s = (u.subscription_status || '').toLowerCase();
      return s === 'canceled' || s === 'cancelled';
    }

    function needsPaymentWall(u) {
      if (isAdminRow(u)) return false;
      const st = (u.subscription_status || '').toLowerCase();
      if (st === 'pending_payment') return true;
      if (st === 'overdue' || st === 'expired') return true;
      if (isCanceledSubscription(u)) return false;
      return subscriptionDatePassed(u);
    }

    // Cadastro via checkout: inativo até pagar — só rotas mínimas de pagamento/perfil
    if (user.subscription_status === 'pending_payment') {
      if (!isPaymentWallAllowedPath(pathRaw)) {
        return res.status(403).json({
          message: 'Complete o pagamento para acessar o sistema',
          subscription_status: 'pending_payment',
        });
      }
    } else if (!user.is_active) {
      return res.status(401).json({ message: 'Conta desativada' });
    }

    // Trial vencido → expired; libera apenas rotas de pagamento para regularizar
    if (user.subscription_status === 'trial' && user.subscription_expires_at) {
      if (isSubscriptionExpiredByCalendarSaoPaulo(user.subscription_expires_at)) {
        await query('UPDATE users SET subscription_status = $1 WHERE id = $2', ['expired', user.id]);
        user.subscription_status = 'expired';
        if (!isAdminRow(user) && !isPaymentWallAllowedPath(pathRaw)) {
          return res.status(403).json({
            message: 'Assinatura expirada',
            subscription_status: 'expired',
          });
        }
      }
    }

    // active com validade já passada: marca overdue (sem esperar job noturno)
    if (
      !isAdminRow(user) &&
      user.subscription_status === 'active' &&
      user.subscription_expires_at &&
      subscriptionDatePassed(user)
    ) {
      await query(
        `UPDATE users SET subscription_status = 'overdue' WHERE id = $1 AND subscription_status = 'active'`,
        [user.id]
      );
      user.subscription_status = 'overdue';
    }

    if (needsPaymentWall(user) && !isAdminRow(user) && !isPaymentWallAllowedPath(pathRaw)) {
      return res.status(403).json({
        message: 'Assinatura expirada ou pagamento pendente. Regularize para continuar.',
        subscription_status: user.subscription_status,
      });
    }

    // Verificar inatividade (logout após X minutos sem atividade)
    const nowMs = Date.now();
    const lastActivityMs = user.last_activity_at ? new Date(user.last_activity_at).getTime() : null;

    if (lastActivityMs && nowMs - lastActivityMs > IDLE_TIMEOUT_MS) {
      return res.status(401).json({ message: 'Sessão expirada por inatividade' });
    }

    // Atualizar last_activity_at com throttle (evita update em todo request)
    const shouldTouch =
      !lastActivityMs || (nowMs - lastActivityMs) > TOUCH_INTERVAL_MS;
    if (shouldTouch) {
      await query('UPDATE users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
      await touchSessionActivity(decoded.sid, decoded.userId);
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
    req.sessionId = decoded.sid;

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


