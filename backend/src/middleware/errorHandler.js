import winston from 'winston';

// Configurar logger para erros
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Dados inválidos',
      errors: err.details || err.message
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado'
    });
  }

  // Erro de banco de dados
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          message: 'Recurso já existe',
          field: err.constraint
        });
      
      case '23503': // Foreign key violation
        return res.status(400).json({
          message: 'Referência inválida',
          field: err.constraint
        });
      
      case '23502': // Not null violation
        return res.status(400).json({
          message: 'Campo obrigatório não fornecido',
          field: err.column
        });
      
      case '42P01': // Undefined table
        return res.status(500).json({
          message: 'Erro de configuração do banco de dados'
        });
      
      default:
        return res.status(500).json({
          message: 'Erro interno do servidor'
        });
    }
  }

  // Erro de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      message: 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter: err.retryAfter
    });
  }

  // Erro padrão
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};












