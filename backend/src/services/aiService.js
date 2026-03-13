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
  // options.listType: 'lacrada' (default) | 'seminovo' | 'android' — usuário já cola lista filtrada
  async validateProductListFromText(rawListText, options = {}) {
    const listType = options.listType || 'lacrada';
    try {
      let cleanedList = rawListText;
      // Para seminovo/android o usuário já colou lista filtrada — não cortar seções
      const skipSeminovoSectionCut = listType === 'seminovo' || listType === 'android';
      
      if (skipSeminovoSectionCut) {
        cleanedList = rawListText.replace(/\r\n/g, '\n').trim();
      }

      // Lista seminovo ou android: usuário já colou filtrada — prompt direto
      if (listType === 'seminovo' || listType === 'android') {
        const isSeminovo = listType === 'seminovo';
        const systemPrompt = isSeminovo
          ? `Você extrai produtos Apple SEMINOVOS de uma lista. SWAP, VITRINE e SEMINOVO são a MESMA COISA (todos são seminovos). Extraia todos.

VARIANTE/ORIGEM (identificar na lista, não pedir): A lista pode trazer indicação de origem como variante do modelo — por exemplo título "iPhone seminovo AMERICANO" ou "AMERICANO" e em baixo os aparelhos; ou bandeira/emoji (🇺🇸 🇨🇳 🇦🇪); ou as palavras americano, chinês/chines, dubai no título da seção ou no texto. VOCÊ DEVE IDENTIFICAR ISSO NA PRÓPRIA LISTA e, quando achar, preencher o campo "variant" de cada produto daquela seção com exatamente: AMERICANO, CHINÊS ou DUBAI. Se na lista não tiver nenhuma dessas indicações, deixe variant vazio (não envie o campo ou ""). Não invente e não peça nada ao usuário — só use o que já está na lista.

Cada item: name, model, color, storage, price (número), condition ("Seminovo"), condition_detail ("SEMINOVO"), variant (só se identificou na lista: "AMERICANO" | "CHINÊS" | "DUBAI"; senão omita ou "").
CPO não é seminovo; se aparecer CPO na lista, não inclua. Normalize preços (R$ 1.500 = 1500).
Retorne APENAS JSON válido: { "validated_products": [ { "name": "...", "model": "...", "color": "...", "storage": "...", "price": número, "condition": "Seminovo", "condition_detail": "SEMINOVO", "variant": "AMERICANO"|"CHINÊS"|"DUBAI" ou omitir } ] }`
          : 'Você extrai produtos ANDROID (Samsung, Xiaomi, Motorola, etc.) de uma lista. O usuário colou APENAS Android. Retorne JSON com array validated_products. Cada item: name, model, color, storage, price (número), condition ("Novo" ou "Seminovo" conforme a lista). Normalize preços. Retorne APENAS JSON válido no formato { "validated_products": [ { "name": "...", "model": "...", "color": "...", "storage": "...", "price": número, "condition": "Novo" ou "Seminovo" } ] }.';
        const userPrompt = `Extraia todos os produtos desta lista (${isSeminovo ? 'Apple seminovos' : 'Android'}).\n\n${cleanedList}`;
        const { outputText } = await this.createAIResponse({
          systemPrompt,
          userPrompt,
          temperature: 0.2,
          maxOutputTokens: 4000
        });
        const parsed = this.parseAIResponse(outputText);
        if (parsed.validated_products && parsed.validated_products.length > 0 && isSeminovo) {
          parsed.validated_products.forEach(p => {
            p.condition = 'Seminovo';
            const detail = (p.condition_detail || '').toUpperCase().trim();
            if (detail === 'SWAP' || detail === 'VITRINE' || detail === 'SEMINOVO' || !detail) {
              p.condition_detail = 'SEMINOVO';
            }
            const v = (p.variant || '').toString().toUpperCase().trim();
            if (v === 'CHINES') p.variant = 'CHINÊS';
            else if (v === 'AMERICANO' || v === 'CHINÊS' || v === 'DUBAI') p.variant = v;
            else if (!v || v === '') p.variant = null;
          });
        } else if (parsed.validated_products && parsed.validated_products.length > 0) {
          parsed.validated_products.forEach(p => {
            if (!p.condition) p.condition = 'Novo';
          });
        }
        return parsed;
      }
      
      // Remover seções de seminovos que podem estar no final ou meio da lista (apenas para lacrada)
      // NOTA: Não remover linhas com "(DESATIVADO)" se estiverem em seção de LACRADOS
      const seminovoMarkers = [
        /💎\s*[Ss]emi\s*[Nn]ovo.*💎/gi,
        /.*[Ss]emi\s*[Nn]ovo\s*americano.*/gi,
        /.*[Ss]wap\s*\([Vv]itrine\).*/gi,
        /.*[Ss]wap.*/gi,
        /.*[Vv]itrine.*/gi,
        /.*[Ss]eminovo.*/gi,
        /.*[Ss]emi\s*[Nn]ovo.*/gi,
        /.*30\s*[Dd]ias\s*de\s*[Gg]arantia.*/gi,
        /.*80%\s*[—-]>\s*100%.*/gi,
        /.*SEM\s*SELO.*/gi,
        /.*garantia\s*6\s*meses\s*pela\s*loja.*/gi,
        /.*garantia.*meses.*pela.*loja.*/gi
      ];
      
      // Remover linhas que são apenas marcadores de seção (sem produtos)
      const lines = cleanedList.split('\n');
      let foundSeminovoSection = false;
      const filteredLines = lines.filter((line, index) => {
        const trimmedLine = line.trim();
        
        // Se já encontrou seção de seminovos, ignorar tudo depois
        if (foundSeminovoSection) {
          return false;
        }
        
        // Verificar se a linha é um marcador de seção de seminovos/vitrine
        // IMPORTANTE: Ignorar avisos sobre SWAP antes da seção de LACRADOS
        const isAvisoSwap = /.*SWAP.*TÁ.*BAIXO.*LACRADO.*/gi.test(trimmedLine) ||
                           /.*IPHONE\s*SWAP.*TÁ.*EM\s*BAIXO.*/gi.test(trimmedLine) ||
                           /.*SWAP.*EM.*BAIXO.*LACRADO.*/gi.test(trimmedLine);
        
        // Se for apenas um aviso sobre SWAP estar abaixo, não ignorar
        if (isAvisoSwap) {
          return true; // Manter o aviso mas continuar processando
        }
        
        // Verificar se a linha é um marcador específico de seção VITRINE
        // IMPORTANTE: Só ignorar se já tivermos produtos LACRADOS processados antes
        const isVitrineMarker = /.*IPHONE\s*VITRINE.*/gi.test(trimmedLine) ||
                               /.*VITRINE.*SOMENTE.*APARELHO.*/gi.test(trimmedLine);
        
        if (isVitrineMarker) {
          // Verificar se há produtos LACRADOS antes desta linha
          const beforeThisLine = lines.slice(0, index).join('\n');
          const hasLacradoProducts = /⚫️.*LACRADO|⚫️.*CPO|LACRADO.*GARANTIA|LACRADO.*UM.*ANO/i.test(beforeThisLine);
          const hasLacradoSection = /LACRADO.*GARANTIA.*APPLE|LACRADO.*COM.*GARANTIA|LACRADO.*UM.*ANO/i.test(beforeThisLine);
          
          // Se não tem produtos LACRADOS antes, não é seção VITRINE válida ainda
          if (!hasLacradoProducts && !hasLacradoSection) {
            console.log('⚠️ Marcador VITRINE encontrado mas sem produtos LACRADOS antes - mantendo');
            return true;
          }
          
          // Esta é claramente uma seção de VITRINE após produtos LACRADOS - marcar e ignorar tudo depois
          console.log('🚫 Seção VITRINE encontrada na linha', index + 1, '- ignorando tudo depois');
          foundSeminovoSection = true;
          return false;
        }
        
        // Verificar outros marcadores de seminovos (mas não se estiver em seção de LACRADOS)
        const beforeThisLine = lines.slice(0, index).join('\n');
        const afterThisLine = lines.slice(index + 1).join('\n');
        const isInLacradoSection = /LACRADO.*GARANTIA.*APPLE/i.test(beforeThisLine) || 
                                   /LACRADO.*COM.*GARANTIA/i.test(beforeThisLine);
        
        // Verificar se há seção de LACRADOS DEPOIS desta linha (importante!)
        const hasLacradoSectionAfter = /LACRADO.*GARANTIA.*APPLE|LACRADO.*COM.*GARANTIA/i.test(afterThisLine);
        
        if (seminovoMarkers.some(marker => marker.test(trimmedLine))) {
          // Se estamos em seção de LACRADOS, não ignorar ainda
          if (isInLacradoSection && !isVitrineMarker) {
            // Continuar processando produtos LACRADOS
            return true;
          }
          
          // Se há seção de LACRADOS DEPOIS, não cortar - precisa processar os LACRADOS
          if (hasLacradoSectionAfter) {
            console.log('✅ Seção LACRADOS detectada DEPOIS - mantendo linha para processar LACRADOS:', trimmedLine.substring(0, 50));
            return true;
          }
          
          // Verificar se há produtos LACRADOS antes desta linha
          const hasLacradoProductsBefore = /⚫️.*LACRADO|⚫️.*CPO|LACRADO.*GARANTIA|LACRADO.*UM.*ANO|LACRADO.*COM.*GARANTIA/i.test(beforeThisLine);
          
          // Se tem produtos LACRADOS antes, não cortar ainda
          if (hasLacradoProductsBefore) {
            console.log('✅ Produtos LACRADOS detectados antes - mantendo linha:', trimmedLine.substring(0, 50));
            return true;
          }
          
          // Verificar se há produtos Apple ANTES desta linha
          const hasAppleProductsBefore = /iphone|ipad|macbook|airpods|apple watch/i.test(beforeThisLine);
          
          // Se tem produtos antes e não está em seção LACRADOS e não tem LACRADOS depois, esta é uma nova seção de seminovos
          if (hasAppleProductsBefore && !isInLacradoSection && !hasLacradoProductsBefore && !hasLacradoSectionAfter) {
            console.log('🚫 Seção de seminovos detectada na linha', index + 1, '- cortando');
            foundSeminovoSection = true;
            return false;
          }
          
          // Se não tem produtos antes, ignorar esta linha também
          return false;
        }
        
        // Ignorar linhas vazias excessivas e separadores
        if (trimmedLine === '' || /^[-=_]{3,}$/.test(trimmedLine)) {
          // Não contar linha vazia como início de seção de seminovos
          return true; // Manter algumas linhas vazias para formatação
        }
        
        return true;
      }).filter(line => line.trim() !== ''); // Remover linhas vazias no final
      
      cleanedList = filteredLines.join('\n');
      
      // Log para debug - ver o que está sendo enviado para a IA
      console.log('📝 Lista após limpeza:', cleanedList.substring(0, 500));
      console.log('📝 Total de linhas após filtro:', filteredLines.length);
      console.log('📝 Seção de seminovos encontrada?', foundSeminovoSection);
      
      // Verificar ANTES da limpeza se a lista contém APENAS vitrine/seminovos
      // Verificar na lista ORIGINAL para detectar antes de qualquer limpeza
      const vitrineMarkersOriginal = /vitrine|swap|seminovo|semi\s*novo|usado|recondicionado|80%|85%|90%.*bateria/i;
      const novoMarkersOriginal = /lacrado|cpo|novo|⚫️.*lacrado|⚫️.*cpo|garantia.*apple|1.*ano.*garantia|GARANTIA.*APPLE/i;
      const hasAppleOriginal = /iphone|ipad|macbook|airpods|apple watch|pencil|airtag/i.test(rawListText);
      const hasVitrineOriginal = vitrineMarkersOriginal.test(rawListText);
      const hasNovoOriginal = novoMarkersOriginal.test(rawListText);
      
      // Se tem produtos Apple, tem vitrine mas NÃO tem novos, é apenas vitrine
      const isOnlyVitrineOriginal = hasAppleOriginal && hasVitrineOriginal && !hasNovoOriginal;
      
      // Verificar também na lista limpa
      const hasAppleProducts = /iphone|ipad|macbook|airpods|apple watch|pencil|airtag/i.test(cleanedList);
      const hasLacradoProducts = /lacrado|cpo|⚫️.*lacrado|⚫️.*cpo|garantia.*apple|1.*ano.*garantia/i.test(cleanedList);
      const hasVitrineOnly = /vitrine|swap|seminovo|semi\s*novo|usado|recondicionado/i.test(cleanedList);
      const hasOnlyVitrineMarkers = hasVitrineOnly && !hasLacradoProducts && !/novo|lacrado|cpo/i.test(cleanedList);
      
      console.log('📝 [ORIGINAL] Produtos Apple?', hasAppleOriginal, '| Vitrine?', hasVitrineOriginal, '| Novos?', hasNovoOriginal);
      console.log('📝 [ORIGINAL] Lista contém apenas vitrine?', isOnlyVitrineOriginal);
      console.log('📝 [LIMPA] Produtos Apple detectados?', hasAppleProducts);
      console.log('📝 [LIMPA] Produtos LACRADOS/CPO detectados?', hasLacradoProducts);
      console.log('📝 [LIMPA] Lista contém apenas vitrine/seminovos?', hasOnlyVitrineMarkers);
      
      // Se a lista ORIGINAL contém APENAS vitrine/seminovos, retornar 0 produtos sem processar pela IA
      if (isOnlyVitrineOriginal || (hasOnlyVitrineMarkers && !hasLacradoProducts && cleanedList.length < rawListText.length * 0.3)) {
        console.warn('🚫 LISTA IGNORADA: Contém apenas produtos de vitrine/seminovos. Retornando 0 produtos.');
        console.warn('🚫 Lista original tinha', rawListText.length, 'caracteres');
        
        // Log sem usar IA (para não consumir tokens)
        const lineCount = rawListText.split('\n').length;
        try {
          await aiDashboardService.logAIUsage('validate_product_list', {
            input_count: lineCount,
            validation_result: {
              valid: true,
              validated_products: []
            },
            filtered_to_novos_only: true,
            skipped_vitrine_only: true
          }, 0, 0); // 0 tokens, 0 custo
        } catch (logError) {
          // Ignorar erro de log
        }
        
        return {
          valid: true,
          errors: [],
          warnings: ['Lista contém apenas produtos de vitrine/seminovos. Apenas produtos NOVOS, LACRADOS ou CPO são processados.'],
          suggestions: [],
          validated_products: [],
          raw_text: rawListText
        };
      }
      
      if (!hasAppleProducts) {
        console.warn('⚠️ AVISO: Nenhum produto Apple detectado na lista após limpeza!');
        console.warn('⚠️ Primeiras linhas da lista limpa:', filteredLines.slice(0, 10).join('\n'));
      }
      
      // Se a lista ficou muito pequena após limpeza, pode ter removido demais
      // Calcular percentual de redução sempre
      const reductionPercent = ((rawListText.length - cleanedList.length) / rawListText.length) * 100;
      console.log('📊 Percentual de redução:', reductionPercent.toFixed(2), '%');
      
      if (cleanedList.length < 100 && rawListText.length > 500) {
        console.warn('⚠️ AVISO: Lista ficou muito pequena após limpeza! Pode ter removido produtos válidos.');
        console.warn('⚠️ Lista original tinha', rawListText.length, 'caracteres');
        console.warn('⚠️ Lista limpa tem apenas', cleanedList.length, 'caracteres');
      }
      
      // Se removemos mais de 80% do conteúdo, algo está errado - usar lista original
      if (reductionPercent > 80) {
        console.error('❌ ERRO CRÍTICO: Mais de 80% da lista foi removida! (', reductionPercent.toFixed(2), '%)');
        console.error('❌ Revertendo para lista original (removendo apenas seção VITRINE explícita)...');
        // Se removemos demais, usar lista original e remover apenas seções explícitas de VITRINE
        cleanedList = rawListText;
        // Remover apenas a partir de "IPHONE VITRINE" em diante
        const vitrineIndex = cleanedList.search(/IPHONE\s*VITRINE.*/gi);
        if (vitrineIndex > 0) {
          cleanedList = cleanedList.substring(0, vitrineIndex);
          console.log('📝 Removida seção VITRINE da lista original. Nova posição:', vitrineIndex);
        } else {
          console.log('📝 Nenhuma seção VITRINE encontrada na lista original');
        }
        console.log('📝 Usando lista original após correção. Tamanho:', cleanedList.length, 'caracteres');
        
        // Recalcular hasAppleProducts após correção
        const hasAppleProductsAfter = /iphone|ipad|macbook|airpods|apple watch|pencil|airtag/i.test(cleanedList);
        console.log('📝 Produtos Apple após correção?', hasAppleProductsAfter);
      }
      
      // Limitar tamanho da lista para evitar erros 500 da OpenAI
      const MAX_LIST_SIZE = 30000; // caracteres (aumentado para listas maiores)
      const MAX_LINES = 700; // linhas (aumentado para listas maiores que podem ter seção LACRADOS depois)
      
      const listSize = cleanedList.length;
      const listLines = cleanedList.split('\n').length;
      
      console.log(`📊 Lista recebida: ${rawListText.length} caracteres originais, ${rawListText.split('\n').length} linhas originais`);
      console.log(`📊 Lista limpa: ${listSize} caracteres, ${listLines} linhas após limpeza`);
      
      // Se a lista for muito grande, avisar mas tentar processar mesmo assim
      if (listSize > MAX_LIST_SIZE || listLines > MAX_LINES) {
        console.warn(`⚠️ Lista grande (${listSize} chars, ${listLines} linhas). Limite recomendado: ${MAX_LIST_SIZE} chars ou ${MAX_LINES} linhas.`);
        console.warn(`⚠️ Tentando processar mesmo assim (pode ter erros da IA)...`);
        
        // Não bloquear completamente - tentar processar e ver se funciona
        // Se der erro da IA, aí sim retornar erro ao usuário
      }
      
      // Avisar se a lista está próxima do limite
      if (listSize > MAX_LIST_SIZE * 0.8 || listLines > MAX_LINES * 0.8) {
        console.warn(`⚠️ Lista grande (${Math.round(listSize/MAX_LIST_SIZE*100)}% do limite). Pode ter problemas.`);
      }
      
      // Prompt simplificado mas completo para listas de produtos Apple NOVOS
      const prompt = `Extraia APENAS produtos Apple NOVOS desta lista. REGRAS CRÍTICAS:

⚠️ ATENÇÃO CRÍTICA - ESTES PRODUTOS SÃO SEMPRE NOVOS/LACRADOS:
- APPLE WATCH (Ultra, Series, SE, todas variações) → SEMPRE NOVO/LACRADO → PROCESSAR TODOS
- MACBOOK (M1, M2, M3, M4, Air, Pro, todas configurações) → SEMPRE NOVO/LACRADO → PROCESSAR TODOS  
- IPAD (Air, Pro, A16, M1, M2, M3, todas variações) → SEMPRE NOVO/LACRADO → PROCESSAR TODOS
- AIRPODS (Pro, Pro 2, Pro 3, AirPods 2, AirPods 3) → SEMPRE NOVO/LACRADO → PROCESSAR TODOS

NÃO IGNORE ESTES PRODUTOS! Se encontrar na lista, EXTRAIA TODOS!

REGRAS CRÍTICAS:

1. PRODUTOS: APENAS iPhone (11, 12, 13, 14, 15, 16, 17 e todas variações Pro/Max/Air/Plus), iPad, MacBook, AirPods, Apple Watch, Magic Keyboard, Apple Pencil, AirTag
   - CRÍTICO: Processe TODOS os modelos iPhone encontrados (11, 12, 13, 14, 15, 16, 17 e variações). NÃO IGNORE modelos mais antigos (11, 12, 13, 14, 15) só porque são mais antigos - todos são válidos se forem LACRADOS/NOVOS.
   - CRÍTICO: Processe TODOS os Apple Watch encontrados (Series, Ultra, SE e todas variações de tamanho: 40mm, 42mm, 44mm, 45mm, 46mm, 49mm, etc.)
   - CRÍTICO: Processe TODOS os MacBook encontrados (M1, M2, M3, M4, Air, Pro, 13", 14", 16", todas configurações de RAM/armazenamento)
   - CRÍTICO: Processe TODOS os iPad encontrados (Air, Pro, A16, M1, M2, M3, todas variações de tamanho: 11", 12.9", etc.)
   - CRÍTICO: Processe TODOS os AirPods encontrados (Pro, Pro 2, Pro 3, AirPods 2, AirPods 3, etc.)
2. CONDITION - APENAS NOVOS: Aceite APENAS produtos com condição NOVO, LACRADO ou CPO
   - CPO (Certified Pre-Owned Apple) = NOVO — sempre processar como condition: "Novo", condition_detail: "CPO"
   - REGRA CRÍTICA: iPad, MacBook, AirPods, Apple Watch são SEMPRE NOVOS - sempre marque como condition: "Novo" e condition_detail: "LACRADO"
   - REGRA CRÍTICA: Se encontrar "Apple Watch", "MacBook", "iPad", "AirPods" na lista SEM qualificação de "usado" ou "seminovo", ASSUMA que é NOVO/LACRADO e PROCESSAR
3. TERMOS PARA NOVOS (PROCESSAR): "lacrado", "novo", "1 ano de garantia apple", "cpo", "garantia apple", "garantia dos aparelhos lacrados"
4. TERMOS PARA SEMINOVOS (IGNORAR em lista lacrada): "swap", "vitrine", "seminovo", "seminovos" — SWAP/VITRINE/SEMINOVO são a mesma coisa (seminovos); em lista de NOVOS não extrair esses produtos
5. IGNORE COMPLETAMENTE: Se um produto menciona SWAP, VITRINE, SEMINOVO, SEMINOVOS, USADO, REcondicionado, NON ACTIVE, 80%, 85%, 90% bateria - NÃO EXTRAIA ESTES PRODUTOS
   - IMPORTANTE: Se produto está em seção LACRADOS/NOVOS, PROCESSAR mesmo se tiver "(DESATIVADO)" na descrição - isso pode ser apenas uma nota da lista
6. LACRADO = NOVO: Se encontrar "LACRADO", "IPHONE LACRADO", "GARANTIA APPLE", "1 ANO DE GARANTIA APPLE", "GARANTIA DOS APARELHOS LACRADOS" → condition: "Novo", condition_detail: "LACRADO"
7. MODELO: Extraia EXATAMENTE como escrito - NUNCA adicione Pro/Max/Plus se não estiver explícito. Processe TODOS os modelos iPhone encontrados (11, 12, 13, 14, 15, 16, 17 e todas variações). IMPORTANTE: Se encontrar "iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "iPhone 17" na lista LACRADOS/NOVOS, EXTRAIA esses produtos normalmente - todos são válidos se forem LACRADOS/NOVOS.
8. PREÇO: Aceite R$, $, 💵, 💲, 🪙, 💰, 💸 - normalize para numérico puro (remova pontos, vírgulas, espaços). Preço pode vir na mesma linha que a cor ou em linha separada. Ex: "Laranja 8300,00" ou "* Laranja" depois "💸4250,00"
9. CORES: Aceite cores em português (azul, preto, branco, rose, verde) e inglês (space black, jet black, midnight, starlight, desert, natural, silver, gold)
10. ARMAZENAMENTO: Normalize (256=256GB, 1T=1TB, 2tb=2TB, 128GB=128GB, 64GB=64GB)
11. CONDIÇÃO PADRONIZADA:
   - iPad, MacBook, AirPods, Apple Watch são SEMPRE NOVOS → condition: "Novo", condition_detail: "LACRADO" ou "NOVO"
   - LACRADO, LACRADOS, "IPHONE LACRADO", "1 ANO DE GARANTIA APPLE" → condition: "Novo", condition_detail: "LACRADO"
   - NOVO → condition: "Novo", condition_detail: "NOVO"
   - CPO (Certified Pre-Owned Apple) = NOVO → condition: "Novo", condition_detail: "CPO"
   - Se não encontrar condição clara, mas está em seção de LACRADOS/NOVOS, assuma condition_detail: "LACRADO"
12. VARIANTE (CRÍTICO):
   - ANATEL, 🇧🇷 → variant: "ANATEL"
   - CPO → variant: "CPO" (além de condition_detail: "CPO")
   - eSIM/ESIM/E-SIM/CHIP VIRTUAL → variant: "E-SIM"
   - CHIP FÍSICO/LL → variant baseado na região (🇺🇸=AMERICANO, 🇯🇵=JAPONÊS, 🇮🇳=INDIANO)
   - 🇺🇸/🇯🇵/🇮🇳/🇨🇳/JP/HN/JA → variant: "AMERICANO"/"JAPONÊS"/"INDIANO"/"CHINÊS"
   - IMPORTANTE: "americano" como variante de produto NOVO → OK. "americano" em contexto de SWAP/VITRINE/SEMINOVO → IGNORAR
13. FORMATOS DE LISTA:
   - Formato 1: 📲17 PRO MAX 1TB → depois 🚦AZUL 💲10600 → produto separado por cor
   - Formato 2: 🌐IPHONE 17 PROMAX 1T 💰11,000 💰 → depois cores → produto com preço único para todas cores
   - Formato 3: 📲17 PRO MAX 256G → depois 📲AZUL 💲8650 → produto com cor e preço na linha seguinte
   - Formato 4: IPHONE 17 PRO MAX 1TB LL/A → depois  LARANJA — R$ 10.850,00 → produto com modelo completo e cor separada por hífen longo (—)
   - Formato 5: IPHONE 13 128GB LZ/A → depois  BRANCO — R$ 2.770,00 → modelo com código LZ/A, cor separada por hífen
   - Formato 6: ⚫️  17 pro max 256G LACRADO → depois * Laranja 8300,00 → produto com emoji ⚫️, modelo e condição na mesma linha, cor com asterisco (*) e preço na mesma linha
   - Formato 7: ⚫️  14 pro max 128G CPO → depois * preto → depois 💸4250,00 → produto com CPO, cor em linha separada com asterisco (*), preço com 💸 em linha separada
   - Formato 8: ⚫️  17 pro max 256G LACRADO❗️ → depois * Laranja 8300,00 → produto com emoji ⚫️ e ❗️, modelo, condição LACRADO, cor e preço
   - Formato 9 (APPLE WATCH): "⌚ Apple Watch" ou "Apple Watch Ultra 3" → depois "• Black — R$ 4.900" → cada cor/preço = produto separado
   - Formato 10 (MACBOOK): "💻 MacBook" ou "MacBook M4 — 16GB / 256GB — 13"" → depois "• ⚫ Midnight — R$ 6.100" → cada cor/preço = produto separado
   - Formato 11 (IPAD): "📱 iPad" ou "iPad Air M3 — 11"" → depois "• Azul — R$ 3.650" → cada cor/preço = produto separado
   - Formato 12 (AIRPODS): "🎧 AirPods" ou "AirPods Pro 3 — Original Apple" → depois "• ⚪ Novo lacrado — R$ 1.750" → produto com condição na descrição
   - IMPORTANTE: Se produto tem LACRADO, CPO na descrição OU está em seção "LACRADO COM GARANTIA APPLE", PROCESSAR como condition: "Novo", condition_detail: "LACRADO" ou "CPO"
   - IMPORTANTE: Apple Watch, MacBook, iPad, AirPods que aparecem em listas são SEMPRE NOVOS/LACRADOS - PROCESSAR TODOS encontrados
   - Se preço ANTES das cores (🚦, 📲, 📍, ✅), cada cor = produto separado com mesmo preço
   - Se cor vem DEPOIS do modelo com hífen longo (—) ou asterisco (*), cada cor = produto separado
   - Preço pode vir com 💸, 💵, 💲, 💰, R$ em linha separada ou na mesma linha
14. EXATIDÃO: Se lista diz "iPhone 17 256GB" → model="iPhone 17 256GB" (NÃO "Pro Max"). Processe TODOS os modelos iPhone encontrados (11, 12, 13, 14, 15, 16, 17 e todas variações) se forem LACRADOS/NOVOS.
15. IGNORAR PRODUTOS:
   - Se produto está em seção de LACRADOS/NOVOS, PROCESSAR mesmo se tiver "(DESATIVADO)" - pode ser apenas nota da lista
   - Produtos com "garantia 6 meses pela loja", "3 meses garantia pela loja" APENAS se NÃO estiverem em seção LACRADOS/NOVOS
   - Se encontrar marcador "IPHONE VITRINE", "IPHONE SWAP" → IGNORE completamente tudo DEPOIS desse marcador

16. EXEMPLOS ESPECÍFICOS DE PRODUTOS:
   - APPLE WATCH: "Apple Watch Ultra 3" → "• Black — R$ 4.900" → Extrair: name="Apple Watch Ultra 3", model="Apple Watch Ultra 3", color="Black", price=4900, condition="Novo", condition_detail="LACRADO"
   - APPLE WATCH: "Apple Watch Series 11 (42mm)" → "• Preto — R$ 2.500" → Extrair: name="Apple Watch Series 11", model="Apple Watch Series 11 42mm", color="Preto", price=2500, condition="Novo", condition_detail="LACRADO"
   - MACBOOK: "MacBook M4 — 16GB / 256GB — 13"" → "• ⚫ Midnight — R$ 6.100" → Extrair: name="MacBook M4 13"", model="MacBook M4 16GB 256GB 13"", color="Midnight", storage="256GB", price=6100, condition="Novo", condition_detail="LACRADO"
   - IPAD: "iPad Air M3 — 11"" → "• Azul — R$ 3.650" → Extrair: name="iPad Air M3", model="iPad Air M3 11"", color="Azul", price=3650, condition="Novo", condition_detail="LACRADO"
   - AIRPODS: "AirPods Pro 3 — Original Apple" → "• ⚪ Novo lacrado — R$ 1.750" → Extrair: name="AirPods Pro 3", model="AirPods Pro 3", price=1750, condition="Novo", condition_detail="LACRADO"

IMPORTANTE: 
- Se um produto tem SWAP, VITRINE, SEMINOVO, SEMINOVOS, USADO, bateria (80%, 85%, 90%), NON ACTIVE → IGNORE completamente
- Se houver seção "SWAP", "Vitrine", "Seminovo" → IGNORE apenas produtos DENTRO dessa seção
- "americano" como variante de produto NOVO → PROCESSAR. "seminovo americano" ou "americano" em seção SWAP/VITRINE → IGNORAR
- EXTRAIA TODOS os modelos iPhone encontrados: 11, 12, 13, 14, 15, 16, 17 e variações. Não ignore modelos mais antigos (11, 12, 13, 14, 15). Todos são válidos se forem LACRADOS/NOVOS.
- EXTRAIA TODOS os Apple Watch, MacBook, iPad e AirPods encontrados na lista - são SEMPRE NOVOS/LACRADOS quando aparecem em listas de preços

Lista:
${cleanedList}

Retorne JSON válido APENAS com produtos Apple NOVOS encontrados:
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
      "condition": "Novo",
      "condition_detail": "LACRADO|NOVO|CPO|\"\"",
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
          'Você é um assistente especializado em produtos Apple NOVOS. Retorne APENAS JSON válido. REGRAS CRÍTICAS: 1) EXTRAIA APENAS produtos NOVOS (NOVO, LACRADO, CPO, "1 ano de garantia apple"). CPO = NOVO (Certified Pre-Owned). IGNORE completamente SWAP, VITRINE, SEMINOVO, SEMINOVOS (são a mesma coisa = seminovos), USADO, REcondicionado, NON ACTIVE, bateria (80%, 85%, 90%). 2) TERMOS NOVOS: "lacrado", "novo", "cpo", "1 ano de garantia apple" → PROCESSAR. 3) TERMOS SEMINOVOS (não extrair): "swap", "vitrine", "seminovo" → IGNORAR. 4) IMPORTANTE: Se produto está em seção LACRADOS/NOVOS, PROCESSAR mesmo se tiver "(DESATIVADO)" na descrição - isso pode ser apenas uma nota da lista, não significa que não é novo. 5) LACRADO = NOVO sempre. 6) Processe TODOS os modelos iPhone encontrados (11, 12, 13, 14, 15, 16, 17 e todas variações Pro, Max, Air, Plus) se forem LACRADOS/NOVOS. NÃO IGNORE modelos mais antigos. 7) EXTRAIA TODOS os Apple Watch encontrados (Ultra, Series, SE e todas variações de tamanho: 40mm, 42mm, 44mm, 45mm, 46mm, 49mm) - são SEMPRE NOVOS/LACRADOS. 8) EXTRAIA TODOS os MacBook encontrados (M1, M2, M3, M4, Air, Pro, 13", 14", 16", todas configurações) - são SEMPRE NOVOS/LACRADOS. 9) EXTRAIA TODOS os iPad encontrados (Air, Pro, A16, M1, M2, M3, 11", 12.9") - são SEMPRE NOVOS/LACRADOS. 10) EXTRAIA TODOS os AirPods encontrados (Pro, Pro 2, Pro 3, AirPods 2, AirPods 3) - são SEMPRE NOVOS/LACRADOS. 11) Extraia modelos EXATAMENTE como aparecem - NUNCA adicione Pro/Max/Plus se não estiver explícito. 12) Se preço está ANTES das cores (🚦, 📲, 📍, ✅) ou cor vem DEPOIS com hífen longo (—), cada cor = produto separado com mesmo preço. 13) CPO → condition_detail: "CPO" E variant: "CPO". 14) ANATEL/🇧🇷 → variant: "ANATEL". 15) eSIM/CHIP VIRTUAL → variant: "E-SIM". 16) CHIP FÍSICO/LL/LL/A → variant baseado na região (🇺🇸=AMERICANO, 🇯🇵=JAPONÊS). 17) "americano" como variante de produto NOVO → OK. "seminovo americano" ou em contexto SWAP/VITRINE → IGNORAR. 18) Cores: aceite português/inglês (space black, jet black, midnight, starlight, desert, natural, prata, laranja). 19) Armazenamento: normalize (256=256GB, 1T=1TB). 20) Preços: remova pontos, vírgulas, espaços - normalize para número puro (ex: "R$ 10.850,00" → 10850). 21) Ignore produtos não-Apple e produtos usados/seminovos, mas PROCESSAR produtos LACRADOS mesmo com notas adicionais.',
        userPrompt: prompt,
        temperature: 0.2, // Reduzido para ser mais determinístico
        maxOutputTokens: 4000 // Limite de tokens de saída
      });

      const parsedResponse = this.parseAIResponse(outputText);
      
      // FILTRAR APENAS PRODUTOS NOVOS (NOVO, LACRADO, CPO)
      // Ignorar produtos com SWAP, VITRINE, SEMINOVO, USADO, REcondicionado
      // NOTA: NÃO ignorar produtos LACRADOS apenas por terem "(DESATIVADO)" - isso pode ser apenas nota da lista
      if (parsedResponse.validated_products && parsedResponse.validated_products.length > 0) {
        const produtosNovos = parsedResponse.validated_products.filter(product => {
          // Verificar condition - deve ser "Novo"
          if (product.condition && product.condition.toLowerCase() !== 'novo') {
            return false;
          }
          
          // Verificar condition_detail - deve ser LACRADO, NOVO, CPO ou vazio
          // NOTA: Não ignorar produtos com "(DESATIVADO)" se forem LACRADOS/NOVOS - pode ser apenas nota da lista
          const detail = (product.condition_detail || '').toUpperCase();
          const condicoesInvalidas = ['SWAP', 'VITRINE', 'SEMINOVO', 'SEMINOVOS', 'USADO', 'RECONDICIONADO'];
          if (detail && condicoesInvalidas.some(invalida => detail.includes(invalida))) {
            return false;
          }
          
          // Verificar variant - se tiver SWAP, VITRINE no variant, ignorar
          const variant = (product.variant || '').toUpperCase();
          if (condicoesInvalidas.some(invalida => variant.includes(invalida))) {
            return false;
          }
          
          // Verificar nome e modelo - se mencionar vitrine/swap/seminovo, ignorar
          const name = (product.name || '').toUpperCase();
          const model = (product.model || '').toUpperCase();
          const notes = (product.notes || '').toUpperCase();
          
          if (condicoesInvalidas.some(invalida => 
            name.includes(invalida) || 
            model.includes(invalida) || 
            notes.includes(invalida)
          )) {
            return false;
          }
          
          return true;
        }).map(product => {
          // GARANTIR que iPad, MacBook, AirPods, Apple Watch são SEMPRE NOVOS
          const productName = (product.name || '').toLowerCase();
          const productModel = (product.model || '').toLowerCase();
          
          const isAlwaysNewProduct = 
            productName.includes('ipad') || productModel.includes('ipad') ||
            productName.includes('macbook') || productModel.includes('macbook') ||
            productName.includes('airpod') || productModel.includes('airpod') ||
            productName.includes('apple watch') || productName.includes('watch') || productModel.includes('watch') ||
            productModel.includes('apple watch') || productModel.includes('ultra') || productModel.includes('series');
          
          if (isAlwaysNewProduct) {
            // Forçar condition: "Novo" para esses produtos
            product.condition = 'Novo';
            if (!product.condition_detail || product.condition_detail === '') {
              product.condition_detail = 'LACRADO';
            }
            // Garantir que produtos sempre novos NÃO sejam filtrados
            console.log(`✅ Produto sempre novo detectado: ${product.name || product.model} - condition forçada para "Novo"`);
          }
          
          return product;
        });
        
        // Atualizar a resposta com apenas produtos novos
        parsedResponse.validated_products = produtosNovos;
        
        // Se todos foram filtrados, significa que eram apenas vitrine/seminovos
        if (produtosNovos.length === 0) {
          if (parsedResponse.validated_products && parsedResponse.validated_products.length > 0) {
            console.warn('🚫 Todos os produtos foram filtrados - eram apenas vitrine/seminovos');
            parsedResponse.valid = true; // Mantém como válido, mas com 0 produtos
            if (!parsedResponse.warnings) parsedResponse.warnings = [];
            parsedResponse.warnings.push('Lista contém apenas produtos de vitrine/seminovos. Apenas produtos NOVOS, LACRADOS ou CPO são processados.');
          } else {
            // Nenhum produto foi retornado pela IA
            parsedResponse.valid = true;
            if (!parsedResponse.warnings) parsedResponse.warnings = [];
            parsedResponse.warnings.push('Nenhum produto NOVO encontrado na lista. Apenas produtos NOVOS, LACRADOS ou CPO são aceitos.');
          }
        }
      }
      
      // Garantir que produtos com CPO tenham variant correto
      if (parsedResponse.validated_products) {
        parsedResponse.validated_products.forEach(product => {
          // Se condition_detail é CPO, garantir que variant também seja CPO
          if (product.condition_detail && product.condition_detail.toUpperCase() === 'CPO') {
            if (!product.variant || product.variant.toUpperCase() !== 'CPO') {
              product.variant = 'CPO';
            }
          }
        });
      }
      
      // Calcular tokens e custo
      const cost = aiDashboardService.calculateCost(tokensUsed);
      
      // Log da validação com tracking real (ignorar erro se tabela não existir)
      const lineCount = rawListText.split('\n').length;
      try {
        await aiDashboardService.logAIUsage('validate_product_list', {
          input_count: lineCount,
          validation_result: parsedResponse,
          filtered_to_novos_only: true
        }, tokensUsed, cost);
      } catch (logError) {
        // Ignorar erro se tabela não existir (não é crítico)
        const errorMsg = logError?.message || logError?.toString() || '';
        if (!errorMsg.includes('does not exist') && !errorMsg.includes('relation') && !errorMsg.includes('42P01')) {
          console.error('Erro ao registrar uso da IA:', logError);
        }
        // Não bloquear o fluxo principal se o log falhar
      }

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

