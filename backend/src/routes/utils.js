import express from 'express';
import axios from 'axios';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { productUpdatedAtDayWhere, resolveDisplayStats } from '../utils/productDayFilter.js';
import { searchModeProductWhereSql } from '../utils/productSearchModeSql.js';

const router = express.Router();

// Totais por dia (hoje/ontem/anteontem) em timezone America/Sao_Paulo
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const rawOffset = Number(req.query?.date_offset ?? 0);
    const dateOffset = Number.isInteger(rawOffset) && rawOffset <= 0 && rawOffset >= -2 ? rawOffset : 0;
    const dateWhere = productUpdatedAtDayWhere(dateOffset, 'p');
    const searchMode = req.query?.search_mode ?? req.query?.searchMode ?? null;
    const modeWhere = searchModeProductWhereSql(searchMode, 'p');

    const result = await query(`
      WITH produtos_dia AS (
        SELECT p.id, p.supplier_id
        FROM products p
        WHERE p.is_active = true AND p.price > 0 AND p.price IS NOT NULL
          AND ${dateWhere}
          AND (${modeWhere})
      ),
      fornecedores_ativos AS (
        SELECT s.id
        FROM suppliers s
        WHERE s.is_active = true
      ),
      fornecedores_com_lista AS (
        SELECT DISTINCT pd.supplier_id
        FROM produtos_dia pd
        WHERE pd.supplier_id IS NOT NULL
      )
      SELECT
        (SELECT COUNT(*)::int FROM produtos_dia) AS total_products,
        (SELECT COUNT(*)::int FROM fornecedores_com_lista) AS total_suppliers,
        GREATEST(
          (SELECT COUNT(*)::int FROM fornecedores_ativos) - (SELECT COUNT(*)::int FROM fornecedores_com_lista),
          0
        ) AS total_without_list
    `);
    const row = result.rows[0];
    const displayOverride = resolveDisplayStats(searchMode);
    if (displayOverride) {
      return res.json({
        total_products: displayOverride.total_products,
        total_suppliers: displayOverride.total_suppliers,
        total_without_list: row?.total_without_list ?? 0,
        display_override: true,
      });
    }
    res.json({
      total_products: row?.total_products ?? 0,
      total_suppliers: row?.total_suppliers ?? 0,
      total_without_list: row?.total_without_list ?? 0,
    });
  } catch (err) {
    console.error('Erro ao buscar stats:', err);
    res.status(500).json({ total_products: 0, total_suppliers: 0, total_without_list: 0 });
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





