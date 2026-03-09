import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
import goalsRoutes from './routes/goals.js';
import notesRoutes from './routes/notes.js';
import calendarRoutes from './routes/calendar.js';
import registrationRoutes from './routes/registration.js';
import productsCleanupRoutes from './routes/products-cleanup.js';
import asaasRoutes from './routes/asaas.js';
import { runMigrations } from './migrate.js';
// Importar middleware
import { authenticateToken } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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
  skip: (req) => req.path === '/health'
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
app.use('/api/goals', authenticateToken, goalsRoutes);
app.use('/api/notes', authenticateToken, notesRoutes);
app.use('/api/calendar', authenticateToken, calendarRoutes);

// Rotas de IA - algumas públicas, outras protegidas
app.use('/api/ai', aiRoutes);

// Rotas de limpeza de produtos
app.use('/api/products', productsCleanupRoutes);


// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../dist')));
  
  // Apenas servir index.html para rotas que não são da API
  app.get('*', (req, res, next) => {
    // Se for uma rota da API, não servir o index.html
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(join(__dirname, '../../dist/index.html'));
  });
}

// Middleware de tratamento de erros
app.use(errorHandler);

// Scheduler automático para limpeza de produtos à meia-noite de Brasília
let cleanupInterval = null;
let subscriptionOverdueInterval = null;

/** Verifica assinaturas vencidas há 1+ dia e marca como overdue (pagamento atrasado) */
async function checkSubscriptionOverdue() {
  try {
    const { query } = await import('./config/database.js');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await query(
      `UPDATE users SET subscription_status = 'overdue'
       WHERE subscription_status = 'active' AND subscription_expires_at IS NOT NULL AND subscription_expires_at < $1
       RETURNING id, email`,
      [oneDayAgo]
    );
    if (result.rowCount > 0) {
      logger.info(`📋 Assinaturas vencidas: ${result.rowCount} usuário(s) marcado(s) como pagamento atrasado`);
    }
  } catch (error) {
    logger.error('❌ Erro ao verificar assinaturas vencidas:', error);
  }
}

async function checkAndCleanupProducts() {
  try {
    const { query } = await import('./config/database.js');
    
    // Horário em Brasília: UMA conversão só (timestamptz AT TIME ZONE 'America/Sao_Paulo' = hora local SP)
    // O uso de dois AT TIME ZONE invertia e dava 00h quando em SP eram 18h (bug)
    const timeCheck = await query(`
      SELECT 
        (NOW() AT TIME ZONE 'America/Sao_Paulo') as agora_brasil,
        EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Sao_Paulo'))::int as hora_brasil,
        EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'America/Sao_Paulo'))::int as minuto_brasil
    `);
    
    const horaBrasil = timeCheck.rows[0].hora_brasil;
    const minutoBrasil = timeCheck.rows[0].minuto_brasil;
    const agoraBrasil = timeCheck.rows[0].agora_brasil;
    
    // Verificar se é meia-noite (00h) em Brasília (com tolerância até 00:10)
    const isMidnightWindow = horaBrasil === 0 && minutoBrasil >= 0 && minutoBrasil <= 10;
    
    if (isMidnightWindow) {
      // Zerar todos os produtos à 00h Brasília (is_active = false)
      const countQuery = await query(`
        SELECT COUNT(*) as total FROM products WHERE is_active = true
      `);
      const totalAtivos = parseInt(countQuery.rows[0].total);

      if (totalAtivos > 0) {
        logger.info(`🕛 00h Brasília: zerando todos os produtos (${agoraBrasil})`);
        const result = await query(`
          UPDATE products SET is_active = false, updated_at = NOW() WHERE is_active = true
        `);
        const deactivatedCount = result.rowCount || 0;
        logger.info(`✅ ${deactivatedCount} produtos desativados à meia-noite (Brasília)`);
      } else {
        logger.debug(`⏰ 00h Brasília: nenhum produto ativo para zerar`);
      }
    }
  } catch (error) {
    logger.error('❌ Erro no scheduler de limpeza automática:', error);
  }
}

// Rodar migrações e depois iniciar servidor
runMigrations()
  .then(() => {
    logger.info('✅ Migrações do banco verificadas/aplicadas');
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);

      // Scheduler: zerar produtos à 00h Brasília — em produção LIGADO por padrão; em dev desligado (testes)
      const explicitOff = process.env.ENABLE_MIDNIGHT_CLEANUP === 'false' || process.env.ENABLE_MIDNIGHT_CLEANUP === '0';
      const explicitOn = process.env.ENABLE_MIDNIGHT_CLEANUP === 'true' || process.env.ENABLE_MIDNIGHT_CLEANUP === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const enableMidnightCleanup = explicitOn || (isProduction && !explicitOff);
      if (enableMidnightCleanup) {
        logger.info('⏰ Iniciando scheduler: zerar produtos à 00h Brasília');
        cleanupInterval = setInterval(checkAndCleanupProducts, 60000);
        logger.info('✅ Scheduler ativo');
      } else {
        logger.info('⏸️ Scheduler de zerar produtos à 00h DESATIVADO (em dev: normal; em prod use ENABLE_MIDNIGHT_CLEANUP=true para forçar)');
      }

      // Scheduler: assinaturas vencidas há 1+ dia → overdue (pagamento atrasado)
      const runOverdueCheck = () => {
        checkSubscriptionOverdue().catch(() => {});
      };
      runOverdueCheck(); // executa ao subir
      subscriptionOverdueInterval = setInterval(runOverdueCheck, 60 * 60 * 1000); // a cada 1h
      logger.info('📋 Scheduler de assinaturas vencidas ativo (1x/hora)');
    });
  })
  .catch((err) => {
    logger.error('❌ Falha ao rodar migrações:', err);
    process.exit(1);
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
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Encerrando servidor...');
  if (cleanupInterval) clearInterval(cleanupInterval);
  if (subscriptionOverdueInterval) clearInterval(subscriptionOverdueInterval);
  process.exit(0);
});

export default app;

