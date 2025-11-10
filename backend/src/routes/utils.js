import express from 'express';
import axios from 'axios';

const router = express.Router();

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





