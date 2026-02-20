import express from 'express';
import axios from 'axios';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Totais gerais (produtos e fornecedores ativos) — para barra da página Buscar mais barato
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM products WHERE is_active = true AND price > 0 AND price IS NOT NULL) AS total_products,
        (SELECT COUNT(*)::int FROM suppliers WHERE is_active = true) AS total_suppliers
    `);
    const row = result.rows[0];
    res.json({
      total_products: row?.total_products ?? 0,
      total_suppliers: row?.total_suppliers ?? 0
    });
  } catch (err) {
    console.error('Erro ao buscar stats:', err);
    res.status(500).json({ total_products: 0, total_suppliers: 0 });
  }
});

// Buscar cotação do dólar em tempo real
router.get('/dollar-rate', async (req, res) => {
  try {
    // Usar API da AwesomeAPI (gratuita e sem necessidade de chave)
    const response = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      timeout: 5000
    });
    
    if (response.data && response.data.USDBRL) {
      const usdbrl = response.data.USDBRL;
      res.json({
        rate: parseFloat(usdbrl.bid || usdbrl.ask || usdbrl.high),
        timestamp: new Date().toISOString(),
        source: 'AwesomeAPI'
      });
    } else {
      throw new Error('Dados inválidos da API');
    }
  } catch (error) {
    console.error('Erro ao buscar cotação do dólar:', error);
    // Retornar valor padrão em caso de erro
    res.json({
      rate: 5.38, // Valor padrão
      timestamp: new Date().toISOString(),
      source: 'default',
      error: error.message
    });
  }
});

export default router;





