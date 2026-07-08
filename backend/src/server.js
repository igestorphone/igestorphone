import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import winston from 'winston';

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import subscriptionRoutes from './routes/subscriptions.js';
import productRoutes from './routes/products.js';
import productsRestoreRoutes from './routes/products-restore.js';
import supplierRoutes from './routes/suppliers.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import utilsRoutes from './routes/utils.js';
import supplierSuggestionsRoutes from './routes/supplier-suggestions.js';
import bugReportsRoutes from './routes/bug-reports.js';
import supportRoutes from './routes/support.js';
import devlogRoutes from './routes/devlog.js';
import calendarRoutes from './routes/calendar.js';
import registrationRoutes from './routes/registration.js';
import productsCleanupRoutes from './routes/products-cleanup.js';
import asaasRoutes from './routes/asaas.js';
import notificationsRoutes from './routes/notifications.js';
import whatsappRoutes from './routes/whatsapp.js';
import { runMigrations } from './migrate.js';
import { autoPromoteYesterdayStockIfNeeded } from './services/autoRollYesterdayStock.js';
import { purgeOverdueAccountsPastGrace } from './services/purgeOverdueAccountsPastGrace.js';
// Importar middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Configurar dotenv
dotenv.config();
// deploy-smoke: confirma deploy Render (comentário apenas)

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
// Render (e Docker) exigem escutar em todas as interfaces — só PORT não basta em alguns ambientes
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Adicionar variações do domínio (com/sem www)
const additionalOrigins = [];
allowedOrigins.forEach(origin => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    const protocol = url.protocol;
    
    // Se não tem www, adicionar versão com www
    if (!hostname.startsWith('www.')) {
      additionalOrigins.push(`${protocol}//www.${hostname}`);
    }
    // Se tem www, adicionar versão sem www
    else {
      additionalOrigins.push(`${protocol}//${hostname.replace(/^www\./, '')}`);
    }
  } catch (e) {
    console.warn('⚠️  Erro ao processar origem para CORS:', origin, e.message);
  }
});

const allAllowedOrigins = [...new Set([...allowedOrigins, ...additionalOrigins])];

// Log para debug
console.log('🌐 Configuração de CORS:');
console.log('   FRONTEND_URL:', frontendUrl);
console.log('   Origens permitidas:', allAllowedOrigins);

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/** Onde está o build do Vite (index.html). Render: cwd costuma ser a raiz do repo; __dirname sozinho pode apontar para .../src/dist errado. */
function resolveFrontendDistDir() {
  const fromEnv = process.env.FRONTEND_DIST_DIR;
  if (fromEnv) {
    const p = resolve(fromEnv);
    if (existsSync(join(p, 'index.html'))) return p;
    logger.warn(`FRONTEND_DIST_DIR sem index.html: ${p}`);
  }
  const candidates = [
    join(process.cwd(), 'dist'),
    join(process.cwd(), '..', 'dist'),
    join(__dirname, '..', '..', 'dist'),
    join(__dirname, '..', '..', '..', 'dist'),
  ];
  for (const rel of candidates) {
    const p = resolve(rel);
    if (existsSync(join(p, 'index.html'))) return p;
  }
  return null;
}

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: Postman, mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se está na lista de origens permitidas (match exato)
    if (allAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log para debug
    console.log('🚫 CORS bloqueado para origem:', origin);
    console.log('✅ Origens permitidas:', allAllowedOrigins);
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const defaultRateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10); // default 15 minutos
const defaultRateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '500', 10); // default 500 req/IP

const limiter = rateLimit({
  windowMs: defaultRateLimitWindow,
  max: defaultRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas, tente novamente em alguns minutos.',
  skip: (req) => req.path === '/health' || req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '50', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api', registrationRoutes); // Rotas de registro (algumas públicas, outras protegidas)
app.use('/api/asaas', asaasRoutes);  // Planos, webhook e checkout (create-subscription exige auth)
app.use('/api/notifications', notificationsRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Rotas de teste (sem autenticação)
app.use('/api/test', userRoutes);

// Rotas protegidas
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/subscriptions', authenticateToken, subscriptionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products', productsRestoreRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/supplier-suggestions', supplierSuggestionsRoutes);
app.use('/api/bug-reports', bugReportsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/devlog', devlogRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);

// Rotas de IA - algumas públicas, outras protegidas
app.use('/api/ai', aiRoutes);

// Rotas de limpeza de produtos
app.use('/api/products', productsCleanupRoutes);


// Health checks (Render: TCP ou HTTP; path costuma ser /health ou /api/health)
const healthPayload = () => ({
  status: 'OK',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
});
app.get('/health', (req, res) => {
  res.json(healthPayload());
});
app.get('/api/health', (req, res) => {
  res.json(healthPayload());
});

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  const frontendDist = resolveFrontendDistDir();
  if (frontendDist) {
    logger.info(`📁 Frontend estático: ${frontendDist}`);
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(join(frontendDist, 'index.html'));
    });
  } else {
    logger.warn(
      '⚠️ dist/ não encontrado (npm run build na raiz do repo ou defina FRONTEND_DIST_DIR). GET / não servirá o SPA.'
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.status(503).type('text').send('Frontend indisponível neste deploy.');
    });
  }
}

// Middleware de tratamento de erros
app.use(errorHandler);

// Scheduler automático para limpeza de produtos (reter 3 dias) no horário de São Paulo
let cleanupInterval = null;
let subscriptionOverdueInterval = null;
let gracePurgeInterval = null;

/** Verifica assinaturas com validade já passada e marca como overdue (alinhado ao bloqueio imediato no auth) */
async function checkSubscriptionOverdue() {
  try {
    const { query } = await import('./config/database.js');
    const result = await query(
      `UPDATE users SET subscription_status = 'overdue'
       WHERE subscription_status = 'active' AND subscription_expires_at IS NOT NULL AND subscription_expires_at < NOW()
       RETURNING id, email`,
      []
    );
    if (result.rowCount > 0) {
      logger.info(`📋 Assinaturas vencidas: ${result.rowCount} usuário(s) marcado(s) como pagamento atrasado`);
    }
  } catch (error) {
    logger.error('❌ Erro ao verificar assinaturas vencidas:', error);
  }
}

async function pruneOldProductsAndLists() {
  try {
    const { query } = await import('./config/database.js');
    
    // Horário em São Paulo: UMA conversão só (timestamptz AT TIME ZONE 'America/Sao_Paulo' = hora local SP)
    const timeCheck = await query(`
      SELECT 
        (NOW() AT TIME ZONE 'America/Sao_Paulo') as agora_brasil,
        EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Sao_Paulo'))::int as hora_brasil,
        EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'America/Sao_Paulo'))::int as minuto_brasil
    `);
    
    const horaBrasil = timeCheck.rows[0].hora_brasil;
    const minutoBrasil = timeCheck.rows[0].minuto_brasil;
    const agoraBrasil = timeCheck.rows[0].agora_brasil;
    
    // Verificar se é meia-noite (00h) em SP (com tolerância até 00:10)
    const isMidnightWindow = horaBrasil === 0 && minutoBrasil >= 0 && minutoBrasil <= 10;
    
    if (isMidnightWindow) {
      // Desativado: DELETE apagava estoque antigo e não volta. Só desativa fora da janela de 3 dias.
      const todaySP = `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`;
      const cutoffExpr = `${todaySP} - 2`; // mantém >= hoje-2
      logger.info(`🧹 00h SP: desativando produtos/listas com data < ${todaySP} - 2 (${agoraBrasil})`);

      const deletedProducts = await query(`
        UPDATE products p
        SET is_active = false, updated_at = NOW()
        WHERE p.is_active = true
          AND GREATEST(
            (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
            (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
          ) < ${cutoffExpr}
      `);

      const deletedRawLists = await query(`
        DELETE FROM supplier_raw_lists r
        WHERE (r.processed_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date < ${cutoffExpr}
      `);

      const dp = deletedProducts.rowCount || 0;
      const dl = deletedRawLists.rowCount || 0;
      logger.info(`✅ Limpeza concluída: ${dp} produtos desativados, ${dl} listas brutas removidas (retendo 3 dias)`);
    }
  } catch (error) {
    logger.error('❌ Erro no scheduler de limpeza automática:', error);
  }
}

// Bind na porta antes das migrações: hosts como Render fazem health check cedo; se runMigrations()
// bloquear por DB lento, o deploy dava "Timed Out" mesmo com o processo saudável depois.
app.listen(PORT, LISTEN_HOST, async () => {
  logger.info(`🚀 Servidor rodando em http://${LISTEN_HOST}:${PORT}`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);

  try {
    await runMigrations();
    logger.info('✅ Migrações do banco verificadas/aplicadas');

    await autoPromoteYesterdayStockIfNeeded(logger);
  } catch (err) {
    logger.error('❌ Falha ao rodar migrações:', err);
    process.exit(1);
  }

  // Scheduler: reter 3 dias e apagar o resto à 00h SP — em produção LIGADO por padrão; em dev desligado (testes)
  const explicitOff = process.env.ENABLE_PRODUCTS_PRUNE === 'false' || process.env.ENABLE_PRODUCTS_PRUNE === '0';
  const explicitOn = process.env.ENABLE_PRODUCTS_PRUNE === 'true' || process.env.ENABLE_PRODUCTS_PRUNE === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  const enableProductsPrune = explicitOn || (isProduction && !explicitOff);
  if (enableProductsPrune) {
    logger.info('⏰ Iniciando scheduler: reter 3 dias (hoje/ontem/anteontem) e limpar à 00h SP');
    cleanupInterval = setInterval(pruneOldProductsAndLists, 60000);
    logger.info('✅ Scheduler ativo');
  } else {
    logger.info('⏸️ Scheduler de limpeza de produtos DESATIVADO (em dev: normal; em prod use ENABLE_PRODUCTS_PRUNE=true para forçar)');
  }

  // Scheduler: assinaturas vencidas há 1+ dia → overdue (pagamento atrasado)
  const runOverdueCheck = () => {
    checkSubscriptionOverdue().catch(() => {});
  };
  runOverdueCheck(); // executa ao subir
  subscriptionOverdueInterval = setInterval(runOverdueCheck, 60 * 60 * 1000); // a cada 1h
  logger.info('📋 Scheduler de assinaturas vencidas ativo (1x/hora)');

  const runGracePurge = () => purgeOverdueAccountsPastGrace(logger).catch(() => {});
  runGracePurge();
  gracePurgeInterval = setInterval(runGracePurge, 60 * 60 * 1000);
  logger.info('🗑️ Exclusão automática pós-tolerância (10 dias sem pagar) ativa (1x/hora)');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Cleanup ao encerrar o servidor
process.on('SIGTERM', () => {
  logger.info('🛑 Encerrando servidor...');
  if (cleanupInterval) clearInterval(cleanupInterval);
  if (subscriptionOverdueInterval) clearInterval(subscriptionOverdueInterval);
  if (gracePurgeInterval) clearInterval(gracePurgeInterval);
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Encerrando servidor...');
  if (cleanupInterval) clearInterval(cleanupInterval);
  if (subscriptionOverdueInterval) clearInterval(subscriptionOverdueInterval);
  if (gracePurgeInterval) clearInterval(gracePurgeInterval);
  process.exit(0);
});

export default app;

