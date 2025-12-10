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
import goalsRoutes from './routes/goals.js';
import notesRoutes from './routes/notes.js';
import registrationRoutes from './routes/registration.js';
import productsCleanupRoutes from './routes/products-cleanup.js';

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
app.use('/api/goals', authenticateToken, goalsRoutes);
app.use('/api/notes', authenticateToken, notesRoutes);

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

async function checkAndCleanupProducts() {
  try {
    const { query } = await import('./config/database.js');
    
    // Verificar horário atual de Brasília
    const timeCheck = await query(`
      SELECT 
        NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
        EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))::int as hora_brasil,
        EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))::int as minuto_brasil
    `);
    
    const horaBrasil = timeCheck.rows[0].hora_brasil;
    const minutoBrasil = timeCheck.rows[0].minuto_brasil;
    const agoraBrasil = timeCheck.rows[0].agora_brasil;
    
    // Verificar se é meia-noite (00h) em Brasília (com tolerância até 00:10)
    const isMidnightWindow = horaBrasil === 0 && minutoBrasil >= 0 && minutoBrasil <= 10;
    
    if (isMidnightWindow) {
      // Verificar se há produtos antigos para limpar (de dias anteriores)
      const countQuery = await query(`
        SELECT COUNT(*) as total
        FROM products
        WHERE is_active = true
          AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') < 
              DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
      `);
      
      const totalToClean = parseInt(countQuery.rows[0].total);
      
      if (totalToClean > 0) {
        logger.info(`🕛 Executando limpeza automática de produtos (Brasília): ${agoraBrasil}`);
        logger.info(`📊 ${totalToClean} produtos antigos encontrados para limpar`);
        
        // Executar limpeza - apenas produtos de dias anteriores
        const result = await query(`
          UPDATE products 
          SET is_active = false,
              updated_at = NOW()
          WHERE is_active = true
            AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') < 
                DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
        `);
        
        const deactivatedCount = result.rowCount || 0;
        logger.info(`✅ ${deactivatedCount} produtos desativados automaticamente`);
      } else {
        logger.debug(`⏰ Horário de limpeza (${horaBrasil.toString().padStart(2, '0')}:${minutoBrasil.toString().padStart(2, '0')}), mas nenhum produto antigo encontrado`);
      }
    }
  } catch (error) {
    logger.error('❌ Erro no scheduler de limpeza automática:', error);
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  // Iniciar scheduler de limpeza automática (verifica a cada minuto)
  logger.info('⏰ Iniciando scheduler automático de limpeza de produtos...');
  cleanupInterval = setInterval(checkAndCleanupProducts, 60000); // Verifica a cada 1 minuto
  logger.info('✅ Scheduler iniciado - verificará meia-noite de Brasília automaticamente');
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
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 Encerrando servidor...');
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  process.exit(0);
});

export default app;

