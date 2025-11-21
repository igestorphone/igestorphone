import OpenAI from 'openai';
import { query } from '../config/database.js';
import aiDashboardService from './aiDashboardService.js';

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 4000;
  }

  async createAIResponse({
    systemPrompt,
    userPrompt,
    temperature = 0.3,
    maxOutputTokens
  }) {
    const input = [];

    if (systemPrompt) {
      input.push({
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }]
      });
    }

    if (userPrompt) {
      input.push({
        role: 'user',
        content: [{ type: 'input_text', text: userPrompt }]
      });
    }

    // Calcular tamanho aproximado do prompt (1 token ≈ 4 caracteres)
    const promptSize = JSON.stringify(input).length;
    const estimatedTokens = Math.ceil(promptSize / 4);
    console.log(`📊 Tamanho do prompt: ~${estimatedTokens} tokens (${promptSize} caracteres)`);
    
    // Limitar tokens de saída baseado no tamanho do prompt
    // Se o prompt for muito grande, reduzir tokens de saída
    let adjustedMaxTokens = maxOutputTokens || this.maxTokens;
    if (estimatedTokens > 30000) {
      adjustedMaxTokens = Math.max(2000, adjustedMaxTokens * 0.5);
      console.log(`⚠️ Prompt muito grande, reduzindo max_output_tokens para ${adjustedMaxTokens}`);
    }
    
    const requestPayload = {
      model: this.model,
      input,
      temperature,
      max_output_tokens: adjustedMaxTokens
      // Nota: timeout não é um parâmetro aceito pela API da OpenAI
      // O timeout deve ser configurado no cliente OpenAI, não no payload
    };

    let response;
    const maxRetries = 2; // Tentar até 2 vezes adicionalmente (total 3 tentativas)
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Aguardar antes de tentar novamente (backoff exponencial mais longo para erro 500)
          const waitTime = Math.min(3000 * attempt, 10000); // 3s, 6s, 9s (max 10s)
          console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries + 1} após ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        response = await openai.responses.create(requestPayload);
        // Se chegou aqui, deu certo!
        if (attempt > 0) {
          console.log(`✅ Sucesso na tentativa ${attempt + 1}`);
        }
        break; // Sair do loop se deu certo
      } catch (apiError) {
        lastError = apiError;
        
        // Capturar erros da API da OpenAI e formatar mensagem mais amigável
        console.error(`❌ Erro na API da OpenAI (tentativa ${attempt + 1}/${maxRetries + 1}):`, apiError);
        console.error(`❌ Status: ${apiError.status}, Code: ${apiError.code}, Type: ${apiError.type}`);
        
        // Se não for erro 500 (server_error), não fazer retry
        if (apiError.status !== 500 && apiError.code !== 'server_error') {
          let errorMessage = 'Erro no serviço de IA';
          
          if (apiError.status === 429 || apiError.message?.includes('rate limit') || apiError.message?.includes('quota')) {
            errorMessage = 'Limite de uso da IA atingido temporariamente. Por favor, aguarde alguns minutos.';
          } else if (apiError.message?.includes('timeout')) {
            errorMessage = 'Tempo de processamento excedido. A lista pode estar muito grande. Tente dividir a lista em partes menores.';
          } else if (apiError.message) {
            const cleanMessage = apiError.message.split('request ID')[0].trim();
            if (cleanMessage && cleanMessage.length < 200) {
              errorMessage = `Erro no serviço de IA: ${cleanMessage}`;
            }
          }
          
          const formattedError = new Error(errorMessage);
          formattedError.originalError = apiError;
          throw formattedError;
        }
        
        // Se for a última tentativa, lançar erro
        if (attempt === maxRetries) {
          console.error(`❌ Todas as ${maxRetries + 1} tentativas falharam`);
          let errorMessage = 'Erro temporário no serviço de IA após várias tentativas.';
          errorMessage += '\n\nSugestões:';
          errorMessage += '\n• A lista pode estar muito grande - tente dividir em partes menores';
          errorMessage += '\n• Aguarde alguns minutos e tente novamente';
          errorMessage += '\n• Se o problema persistir, entre em contato com o suporte';
          
          const formattedError = new Error(errorMessage);
          formattedError.originalError = apiError;
          throw formattedError;
        }
      }
    }
    
    if (!response) {
      // Isso não deveria acontecer, mas por segurança...
      throw lastError || new Error('Erro desconhecido ao chamar a API da OpenAI');
    }

    let outputText = response.output_text ? response.output_text.trim() : '';

    if (!outputText && Array.isArray(response.output)) {
      outputText = response.output
        .map((block) =>
          (block.content || [])
            .filter((item) => item.type === 'text' && item.text)
            .map((item) => item.text)
            .join('')
        )
        .join('')
        .trim();
    }

    if (!outputText) {
      throw new Error('Resposta da IA vazia ou inválida');
    }

    const tokensUsed =
      (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    return { response, outputText, tokensUsed };
  }

  // Função auxiliar para fazer parse da resposta da IA (melhorada e mais robusta)
  parseAIResponse(content) {
    if (!content || typeof content !== 'string') {
      console.error('Conteúdo inválido recebido da IA:', content);
      throw new Error('Resposta da IA vazia ou inválida');
    }

    // Limpar markdown se presente
    let cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[^{]*\{/, '{') // Remover texto antes do primeiro {
      .replace(/\}[^}]*$/, '}') // Remover texto depois do último }
      .trim();
    
    // Tentar encontrar JSON válido
    try {
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Erro inicial ao fazer parse:', parseError.message);
      const errorPosition = parseError.message.match(/position (\d+)/)?.[1] || 'N/A';
      console.error('❌ Posição do erro:', errorPosition);
      
      // Tentar extrair JSON entre chaves mais externas
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = jsonMatch[0];
          return JSON.parse(extracted);
        }
      } catch (e) {
        console.error('❌ Erro ao parsear JSON extraído:', e.message);
      }

      // Tentar corrigir JSON comum - remover vírgulas extras antes de fechamentos
      try {
        let fixedContent = cleanContent
          // Remover vírgulas antes de } ou ]
          .replace(/,(\s*[}\]])/g, '$1')
          // Remover vírgulas duplicadas
          .replace(/,+/g, ',')
          // Corrigir vírgulas no final de arrays/objetos
          .replace(/,(\s*[}\]])/g, '$1')
          // Corrigir vírgulas após strings antes de fechamento
          .replace(/"\s*,\s*(\s*[}\]])/g, '"$1')
          // Remover vírgulas após números antes de fechamento
          .replace(/(\d)\s*,\s*(\s*[}\]])/g, '$1$2');
        
        return JSON.parse(fixedContent);
      } catch (e) {
        console.error('❌ Erro ao corrigir JSON:', e.message);
      }

      // Estratégia mais robusta: tentar encontrar e extrair produtos individuais
      try {
        const productsArray = [];
        
        // Procurar por objetos de produto completos usando regex mais robusto
        // Procurar por padrão: { "name": "...", ... outros campos ... }
        const productPattern = /\{\s*"name"\s*:\s*"([^"]+)"[^}]*"price"\s*:\s*(\d+\.?\d*)[^}]*\}/g;
        let match;
        
        while ((match = productPattern.exec(content)) !== null) {
          try {
            // Tentar extrair o objeto completo
            const startPos = content.lastIndexOf('{', match.index);
            const endPos = content.indexOf('}', match.index) + 1;
            
            if (startPos >= 0 && endPos > startPos) {
              const productStr = content.substring(startPos, endPos);
              // Tentar corrigir vírgulas extras
              const fixedProduct = productStr.replace(/,(\s*[}\]])/g, '$1');
              const product = JSON.parse(fixedProduct);
              
              if (product.name && product.price !== undefined) {
                productsArray.push({
                  name: product.name,
                  model: product.model || '',
                  color: product.color || '',
                  storage: product.storage || '',
                  condition: product.condition || 'Novo',
                  price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
                  validated: product.validated !== undefined ? product.validated : true,
                  confidence: product.confidence || 0.8
                });
              }
            }
          } catch (e) {
            // Ignorar produtos inválidos, continuar
          }
        }
        
        // Se encontrou produtos, retornar estrutura válida
        if (productsArray.length > 0) {
          console.log(`✅ Extraídos ${productsArray.length} produtos do JSON malformado`);
          return {
            valid: true,
            errors: [],
            warnings: ['JSON parcialmente parseado - alguns produtos podem estar faltando'],
            suggestions: [],
            validated_products: productsArray
          };
        }
      } catch (e) {
        console.error('❌ Erro ao extrair produtos:', e.message);
      }

      // Log detalhado para debug
      console.error('❌ Erro ao fazer parse da resposta da IA:', parseError.message);
      console.error('📝 Posição do erro:', errorPosition);
      if (errorPosition !== 'N/A') {
        const pos = parseInt(errorPosition);
        const start = Math.max(0, pos - 100);
        const end = Math.min(content.length, pos + 100);
        console.error('📝 Conteúdo ao redor do erro:', content.substring(start, end));
      }
      
      // Retornar estrutura padrão com erro
      return {
        valid: false,
        errors: ['Erro ao processar resposta da IA: ' + parseError.message],
        warnings: ['Resposta da IA não pôde ser parseada corretamente'],
        suggestions: ['Verifique se a lista contém produtos Apple válidos e tente novamente'],
        validated_products: []
      };
    }
  }

  // Validação inteligente de listas de produtos a partir de texto bruto
  async validateProductListFromText(rawListText) {
    try {
      // Limitar tamanho da lista para evitar erros 500 da OpenAI
      const MAX_LIST_SIZE = 8000; // caracteres (reduzido para ser mais conservador)
      const MAX_LINES = 150; // linhas (reduzido para ser mais conservador)
      
      const listSize = rawListText.length;
      const listLines = rawListText.split('\n').length;
      
      console.log(`📊 Lista recebida: ${listSize} caracteres, ${listLines} linhas`);
      
      // Se a lista for muito grande, avisar o usuário
      if (listSize > MAX_LIST_SIZE || listLines > MAX_LINES) {
        console.warn(`⚠️ Lista muito grande (${listSize} chars, ${listLines} linhas). Limite: ${MAX_LIST_SIZE} chars ou ${MAX_LINES} linhas.`);
        
        return {
          valid: false,
          errors: [`Lista muito grande (${listLines} linhas, ${listSize} caracteres).`],
          warnings: [`O limite recomendado é ${MAX_LINES} linhas ou ${MAX_LIST_SIZE.toLocaleString()} caracteres por vez para evitar erros.`],
          suggestions: [
            `Divida a lista em partes menores (máximo ${MAX_LINES} linhas por vez) e processe cada parte separadamente.`,
            'Ou remova linhas desnecessárias (anúncios, textos de aviso, etc) e mantenha apenas os produtos.'
          ],
          validated_products: []
        };
      }
      
      // Avisar se a lista está próxima do limite
      if (listSize > MAX_LIST_SIZE * 0.8 || listLines > MAX_LINES * 0.8) {
        console.warn(`⚠️ Lista grande (${Math.round(listSize/MAX_LIST_SIZE*100)}% do limite). Pode ter problemas.`);
      }
      
      // Prompt drasticamente simplificado para evitar erro 500 da OpenAI
      // Reduzido de ~280 linhas para ~15 linhas - mantém apenas o essencial
      const prompt = `Extraia produtos Apple desta lista. REGRAS:

1. PRODUTOS: iPhone, iPad, MacBook, AirPods, Apple Watch, Magic Keyboard, Apple Pencil
2. MODELO: Extraia EXATAMENTE como escrito - NUNCA adicione Pro/Max/Plus se não estiver explícito
3. PREÇO: Aceite R$, $, 💵, 💲, 🪙, números - normalize para numérico
4. CORES: Extraia cores (azul, preto, branco, silver, rose, etc) incluindo emojis (🔵, ⚫, ⚪, etc)
5. ARMAZENAMENTO: Normalize (256=256GB, 1T=1TB, 2tb=2TB)
6. CONDIÇÃO: SWAP/VITRINE/SEMINOVO= Seminovo; CPO/LACRADO/NOVO= Novo; condition_detail= original
7. VARIANTE: eSIM/ANATEL/🇺🇸/🇯🇵/🇨🇳/JP/HN= variant
8. FORMATO CRÍTICO: Se preço ANTES das cores (📍azul, ✅ Azul), cada cor = produto com mesmo preço
9. EXATIDÃO: Se lista diz "iPhone 17 256GB" → model="iPhone 17 256GB" (NÃO "Pro Max")

Lista:
${rawListText}

Retorne JSON válido com todos os produtos Apple encontrados:
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "suggestions": [],
  "validated_products": [
    {
      "name": "nome_limpo_do_produto",
      "model": "modelo_extraído", 
      "color": "cor_extraída_ou_vazio",
      "storage": "armazenamento_extraído_ou_vazio",
      "condition": "Novo|Seminovo|Usado|Recondicionado",
      "condition_detail": "SWAP|VITRINE|SEMINOVO|LACRADO|NOVO|CPO|USADO|RECONDICIONADO|\"\"",
      "price": preço_numérico,
      "variant": "ANATEL|E-SIM|CHIP FÍSICO|CPO|CHINÊS|JAPONÊS|INDIANO|AMERICANO|CHIP VIRTUAL|\"\"",
      "validated": true,
      "confidence": 0.9
    }
  ]
}
`;

      const { outputText, tokensUsed } = await this.createAIResponse({
        systemPrompt:
          'Você é um assistente especializado em produtos Apple. Retorne APENAS JSON válido. REGRAS: 1) Extraia modelos EXATAMENTE como aparecem - NUNCA adicione Pro/Max/Plus se não estiver explícito. 2) Se preço está ANTES das cores, cada cor = produto separado com mesmo preço. 3) Condições: SWAP/VITRINE/SEMINOVO= Seminovo; CPO/LACRADO/NOVO= Novo. 4) Cores: aceite português/inglês/emojis. 5) Armazenamento: normalize para GB/TB (ex: "256" = "256GB"). 6) Variantes: eSIM/ANATEL/🇺🇸/🇯🇵/🇨🇳 = variant. Ignore não-Apple.',
        userPrompt: prompt,
        temperature: 0.2, // Reduzido para ser mais determinístico
        maxOutputTokens: 4000 // Limite de tokens de saída
      });

      const parsedResponse = this.parseAIResponse(outputText);
      
      // Calcular tokens e custo
      const cost = aiDashboardService.calculateCost(tokensUsed);
      
      // Log da validação com tracking real
      const lineCount = rawListText.split('\n').length;
      await aiDashboardService.logAIUsage('validate_product_list', {
        input_count: lineCount,
        validation_result: parsedResponse
      }, tokensUsed, cost);

      // Garantir que a resposta tenha a estrutura esperada
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        console.error('❌ Resposta da IA inválida:', parsedResponse);
        return {
          valid: false,
          errors: ['Resposta da IA em formato inesperado'],
          warnings: [],
          suggestions: [],
          validated_products: []
        };
      }

      // Garantir que validated_products seja um array
      if (!Array.isArray(parsedResponse.validated_products)) {
        parsedResponse.validated_products = [];
      }

      const extractNormalizedStorage = (text) => {
        if (!text || typeof text !== 'string') return null;

        const normalized = text
          .replace(/[\r\n]/g, ' ')
          .replace(/[\s]+/g, ' ')
          .trim()
          .toLowerCase();

        if (!normalized) return null;

        const tbMatch = normalized.match(/(?<!\d)(1|2|4|8)\s*(?:tb|t|tera)(?!\w)/i);
        if (tbMatch) {
          return `${tbMatch[1]}TB`;
        }

        const gbMatch = normalized.match(/(?<!\d)(16|32|64|128|256|512|1024|2048|4096)(\s*(?:gb|g|gig|giga|gigabytes))?(?!\w)/i);
        if (gbMatch) {
          const value = gbMatch[1];

          if (value === '1024') return '1TB';
          if (value === '2048') return '2TB';
          if (value === '4096') return '4TB';
          if (value === '8192') return '8TB';

          return `${value}GB`;
        }

        return null;
      };

      const ensureStorageInModelText = (modelText, storageValue) => {
        if (!modelText || !storageValue) return modelText;
        const storageLower = storageValue.toLowerCase();
        if (modelText.toLowerCase().includes(storageLower)) return modelText;

        const numericPart = storageValue.replace(/[^0-9]/g, '');
        let updatedModel = modelText;

        if (numericPart) {
          const replacePattern = new RegExp(`(?<!\\d)${numericPart}(?:\\s*(?:g|gb|gig|giga|gigabytes))?(?!\\d)`, 'i');
          if (replacePattern.test(updatedModel)) {
            updatedModel = updatedModel.replace(replacePattern, storageValue);
            return updatedModel;
          }
        }

        return `${updatedModel.trim()} ${storageValue}`.trim();
      };

      const detectVariant = (product) => {
        const combined =
          [product.variant, product.network, product.notes, product.model, product.name, product.additional_info]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (!combined) return null;
        if (combined.includes('anatel')) return 'ANATEL';
        if (combined.includes('e-sim') || combined.includes('esim') || combined.includes('e sim')) return 'E-SIM';
        if (
          combined.includes('chip físico') ||
          combined.includes('chip fisico') ||
          combined.includes('chip fisco') ||
          combined.includes('1 chip') ||
          combined.includes('01 chip') ||
          combined.includes('2 chip') ||
          combined.includes('02 chip')
        )
          return 'CHIP FÍSICO';
        if (combined.includes('chip virtual')) return 'CHIP VIRTUAL';
        if (combined.includes('chin')) return 'CHINÊS';
        if (combined.includes('jap')) return 'JAPONÊS';
        if (combined.includes('indi')) return 'INDIANO';
        if (combined.includes('usa') || combined.includes('americano')) return 'AMERICANO';
        if (combined.includes('cpo')) return 'CPO';
        return product.variant ? product.variant.toString().toUpperCase() : null;
      };

      parsedResponse.validated_products = parsedResponse.validated_products.map((product) => {
        const combinedText = [product.storage, product.model, product.name]
          .filter(Boolean)
          .join(' ');

        const derivedStorage = extractNormalizedStorage(product.storage) || extractNormalizedStorage(combinedText);
        const storageValue = derivedStorage || null;
        const variantValue = detectVariant(product);

        const updatedProduct = {
          ...product,
          storage: storageValue,
          variant: variantValue || null
        };

        if (storageValue && product.model) {
          updatedProduct.model = ensureStorageInModelText(product.model, storageValue);
        }

        return updatedProduct;
      });

      return parsedResponse;
    } catch (error) {
      console.error('❌ Erro na validação de lista a partir de texto:', error);
      console.error('❌ Stack trace:', error.stack);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error status:', error.status);
      console.error('❌ Original error:', error.originalError);
      
      // Tratar erros da OpenAI de forma mais amigável
      let errorMessage = 'Erro temporário ao processar lista com IA.';
      let suggestion = 'Por favor, tente novamente em alguns segundos.';
      
      // Verificar se é erro da OpenAI
      if (error.originalError) {
        const originalError = error.originalError;
        console.error('❌ Original error status:', originalError.status);
        console.error('❌ Original error message:', originalError.message);
        
        if (originalError.status === 500 || error.message?.includes('500')) {
          errorMessage = 'Erro temporário no serviço de IA (erro 500).';
          suggestion = 'O serviço da OpenAI está temporariamente indisponível. Por favor, tente novamente em alguns segundos.';
        } else if (originalError.status === 429 || error.message?.includes('rate limit') || error.message?.includes('quota')) {
          errorMessage = 'Limite de uso da IA atingido temporariamente.';
          suggestion = 'Por favor, aguarde alguns minutos e tente novamente.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Tempo de processamento excedido.';
          suggestion = 'A lista pode estar muito grande. Tente dividir em partes menores ou tente novamente.';
        } else if (error.message?.includes('Request ID')) {
          // Erro da OpenAI com Request ID - simplificar mensagem
          errorMessage = 'Erro temporário no serviço de IA.';
          suggestion = 'Por favor, tente novamente. Se o problema persistir, verifique se a chave da OpenAI está configurada corretamente.';
        } else if (originalError.message) {
          // Usar mensagem do erro original se disponível
          const cleanMessage = originalError.message.split('request ID')[0].split('Request ID')[0].trim();
          if (cleanMessage && cleanMessage.length < 150) {
            errorMessage = `Erro no serviço de IA: ${cleanMessage}`;
          }
        }
      } else if (error.message) {
        // Verificar mensagem do erro direto
        if (error.message.includes('500')) {
          errorMessage = 'Erro temporário no serviço de IA (erro 500).';
          suggestion = 'O serviço da OpenAI está temporariamente indisponível. Por favor, tente novamente em alguns segundos.';
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
          errorMessage = 'Limite de uso da IA atingido temporariamente.';
          suggestion = 'Por favor, aguarde alguns minutos e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Tempo de processamento excedido.';
          suggestion = 'A lista pode estar muito grande. Tente dividir em partes menores ou tente novamente.';
        }
      }
      
      // Retornar resposta válida mesmo em caso de erro
      return {
        valid: false,
        errors: [errorMessage],
        warnings: ['Não foi possível processar a lista completamente'],
        suggestions: [suggestion],
        validated_products: []
      };
    }
  }

  // Cálculo inteligente de médias de preços
  async calculateSmartPriceAverage(productData) {
    try {
      const prompt = `
Você é um especialista em análise de preços de produtos Apple. Analise estes dados de preços e calcule médias inteligentes considerando:

1. Tendências de mercado
2. Sazonalidade
3. Condição do produto
4. Modelo específico
5. Variações por fornecedor

Dados de preços:
${JSON.stringify(productData, null, 2)}

Responda em JSON com:
{
  "simple_average": number,
  "weighted_average": number,
  "market_trend": "up" | "down" | "stable",
  "confidence_score": number (0-100),
  "price_ranges": {
    "low": number,
    "high": number,
    "recommended": number
  },
  "insights": [string],
  "predictions": {
    "next_week": number,
    "next_month": number
  }
}
`;

      const { outputText } = await this.createAIResponse({
        userPrompt: prompt,
        temperature: 0.2
      });

      const response = this.parseAIResponse(outputText);
      
      // Log da análise
      await this.logAIAction('calculate_price_average', {
        data_points: productData.length,
        analysis_result: response
      });

      return response;
    } catch (error) {
      console.error('Erro no cálculo de média:', error);
      throw new Error('Falha no cálculo de média com IA');
    }
  }

  // Busca inteligente de preços
  async searchOptimalPrices(searchCriteria) {
    try {
      // Buscar produtos no banco
      const products = await this.searchProductsInDatabase(searchCriteria);
      
      const prompt = `
Você é um especialista em busca de produtos Apple. Encontre os melhores preços considerando:

1. Critérios de busca: ${JSON.stringify(searchCriteria, null, 2)}
2. Produtos disponíveis: ${JSON.stringify(products, null, 2)}

Analise e recomende:

1. Melhor custo-benefício
2. Melhor preço absoluto
3. Melhor qualidade
4. Fornecedores mais confiáveis
5. Oportunidades de negócio

Responda em JSON com:
{
  "best_value": {
    "product_id": number,
    "reason": string,
    "score": number
  },
  "best_price": {
    "product_id": number,
    "reason": string,
    "score": number
  },
  "best_quality": {
    "product_id": number,
    "reason": string,
    "score": number
  },
  "recommendations": [{
    "product_id": number,
    "priority": "high" | "medium" | "low",
    "reason": string,
    "action": string
  }],
  "market_insights": [string],
  "alerts": [string]
}
`;

      const { outputText } = await this.createAIResponse({
        userPrompt: prompt,
        temperature: 0.3
      });

      const response = this.parseAIResponse(outputText);
      
      // Log da busca
      await this.logAIAction('search_optimal_prices', {
        search_criteria: searchCriteria,
        products_found: products.length,
        recommendations: response
      });

      return response;
    } catch (error) {
      console.error('Erro na busca de preços:', error);
      throw new Error('Falha na busca de preços com IA');
    }
  }

  // Análise de tendências de mercado
  async analyzeMarketTrends(timeframe = '30 days') {
    try {
      // Buscar dados históricos
      const historicalData = await query(`
        SELECT 
          p.name,
          p.model,
          p.condition,
          AVG(ph.price) as avg_price,
          COUNT(ph.price) as price_updates,
          DATE_TRUNC('day', ph.recorded_at) as date
        FROM price_history ph
        JOIN products p ON ph.product_id = p.id
        WHERE ph.recorded_at >= NOW() - INTERVAL '${timeframe}'
        GROUP BY p.id, p.name, p.model, p.condition, DATE_TRUNC('day', ph.recorded_at)
        ORDER BY date DESC
      `);

      const prompt = `
Analise estas tendências de preços de produtos Apple nos últimos ${timeframe}:

${JSON.stringify(historicalData.rows, null, 2)}

Identifique:
1. Tendências gerais de preços
2. Produtos com maior variação
3. Oportunidades de compra
4. Previsões para próximos períodos
5. Recomendações estratégicas

Responda em JSON com:
{
  "overall_trend": "up" | "down" | "stable",
  "trend_strength": number (0-100),
  "volatile_products": [{
    "name": string,
    "volatility_score": number,
    "reason": string
  }],
  "opportunities": [{
    "product": string,
    "opportunity_type": "buy_low" | "sell_high" | "stable_investment",
    "confidence": number,
    "reason": string
  }],
  "predictions": {
    "next_week": string,
    "next_month": string
  },
  "recommendations": [string],
  "risk_alerts": [string]
}
`;

      const { outputText } = await this.createAIResponse({
        userPrompt: prompt,
        temperature: 0.2
      });

      const response = this.parseAIResponse(outputText);
      
      // Log da análise
      await this.logAIAction('analyze_market_trends', {
        timeframe,
        data_points: historicalData.rows.length,
        analysis: response
      });

      return response;
    } catch (error) {
      console.error('Erro na análise de tendências:', error);
      throw new Error('Falha na análise de tendências com IA');
    }
  }

  // Geração de relatórios inteligentes
  async generateIntelligentReport(reportType, filters = {}) {
    try {
      // Buscar dados baseado no tipo de relatório
      let data;
      switch (reportType) {
        case 'sales_performance':
          data = await this.getSalesData(filters);
          break;
        case 'price_analysis':
          data = await this.getPriceAnalysisData(filters);
          break;
        case 'supplier_performance':
          data = await this.getSupplierData(filters);
          break;
        default:
          data = await this.getGeneralData(filters);
      }

      const prompt = `
Gere um relatório inteligente de ${reportType} baseado nestes dados:

${JSON.stringify(data, null, 2)}

Filtros aplicados: ${JSON.stringify(filters, null, 2)}

Crie um relatório profissional com:
1. Resumo executivo
2. Principais insights
3. Recomendações estratégicas
4. Alertas importantes
5. Próximos passos

Responda em JSON com:
{
  "executive_summary": string,
  "key_insights": [string],
  "strategic_recommendations": [string],
  "alerts": [string],
  "next_steps": [string],
  "metrics": {
    "performance_score": number,
    "risk_level": "low" | "medium" | "high",
    "opportunity_score": number
  },
  "detailed_analysis": string
}
`;

      const { outputText } = await this.createAIResponse({
        userPrompt: prompt,
        temperature: 0.3
      });

      const response = this.parseAIResponse(outputText);
      
      // Log da geração
      await this.logAIAction('generate_intelligent_report', {
        report_type: reportType,
        filters,
        report_generated: true
      });

      return response;
    } catch (error) {
      console.error('Erro na geração de relatório:', error);
      throw new Error('Falha na geração de relatório com IA');
    }
  }

  // Métodos auxiliares
  async searchProductsInDatabase(criteria) {
    const { model, color, storage, condition, minPrice, maxPrice } = criteria;
    
    let whereClause = 'WHERE p.is_active = true';
    const values = [];
    let paramCount = 1;

    if (model) {
      whereClause += ` AND p.model ILIKE $${paramCount}`;
      values.push(`%${model}%`);
      paramCount++;
    }

    if (color) {
      whereClause += ` AND p.color ILIKE $${paramCount}`;
      values.push(`%${color}%`);
      paramCount++;
    }

    if (storage) {
      whereClause += ` AND p.storage = $${paramCount}`;
      values.push(storage);
      paramCount++;
    }

    if (condition) {
      whereClause += ` AND p.condition = $${paramCount}`;
      values.push(condition);
      paramCount++;
    }

    if (minPrice) {
      whereClause += ` AND p.price >= $${paramCount}`;
      values.push(minPrice);
      paramCount++;
    }

    if (maxPrice) {
      whereClause += ` AND p.price <= $${paramCount}`;
      values.push(maxPrice);
      paramCount++;
    }

    const result = await query(`
      SELECT p.*, s.name as supplier_name, s.contact_email
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.price ASC
    `, values);

    return result.rows;
  }

  async logAIAction(action, details) {
    try {
      await query(`
        INSERT INTO system_logs (action, details, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [`ai_${action}`, JSON.stringify(details)]);
    } catch (error) {
      console.error('Erro ao logar ação de IA:', error);
    }
  }

  async getSalesData(filters) {
    // Implementar busca de dados de vendas
    return { message: 'Dados de vendas em desenvolvimento' };
  }

  async getPriceAnalysisData(filters) {
    // Implementar busca de dados de preços
    return { message: 'Dados de análise de preços em desenvolvimento' };
  }

  async getSupplierData(filters) {
    // Implementar busca de dados de fornecedores
    return { message: 'Dados de fornecedores em desenvolvimento' };
  }

  async getGeneralData(filters) {
    // Implementar busca de dados gerais
    return { message: 'Dados gerais em desenvolvimento' };
  }
}

export default new AIService();

