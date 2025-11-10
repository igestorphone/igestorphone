import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === 'production';

const basePoolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10)
};

let dbConfig;

if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    ...basePoolConfig
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'igestorphone',
    user: process.env.DB_USER || 'MAC',
    password: process.env.DB_PASSWORD || '',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    ...basePoolConfig
  };
}

// Criar pool de conexões
const pool = new Pool(dbConfig);

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões PostgreSQL:', err);
  process.exit(-1);
});

// Função para executar queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
};

// Função para transações
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Monkey patch para logging
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    console.log('Conexão liberada');
    return release.apply(client);
  };
  
  return client;
};

export default pool;


