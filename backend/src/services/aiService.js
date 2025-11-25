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
      // Limpar lista: remover seções de "semi novo", "swap", "vitrine" que podem confundir a IA
      // Remover linhas que contenham apenas esses termos ou seções marcadas
      let cleanedList = rawListText;
      
      // Remover seções de seminovos que podem estar no final ou meio da lista
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
        const isVitrineMarker = /.*IPHONE\s*VITRINE.*/gi.test(trimmedLine) ||
                               /.*VITRINE.*SOMENTE.*APARELHO.*/gi.test(trimmedLine);
        
        if (isVitrineMarker) {
          // Esta é claramente uma seção de VITRINE - marcar e ignorar tudo depois
          console.log('🚫 Seção VITRINE encontrada na linha', index + 1, '- ignorando tudo depois');
          foundSeminovoSection = true;
          return false;
        }
        
        // Verificar outros marcadores de seminovos (mas não se estiver em seção de LACRADOS)
        const beforeThisLine = lines.slice(0, index).join('\n');
        const isInLacradoSection = /LACRADO.*GARANTIA.*APPLE/i.test(beforeThisLine) || 
                                   /LACRADO.*COM.*GARANTIA/i.test(beforeThisLine);
        
        if (seminovoMarkers.some(marker => marker.test(trimmedLine))) {
          // Se estamos em seção de LACRADOS, não ignorar ainda
          if (isInLacradoSection && !isVitrineMarker) {
            // Continuar processando produtos LACRADOS
            return true;
          }
          
          // Verificar se há produtos Apple ANTES desta linha
          const hasAppleProductsBefore = /iphone|ipad|macbook|airpods|apple watch/i.test(beforeThisLine);
          
          // Se tem produtos antes e não está em seção LACRADOS, esta é uma nova seção de seminovos
          if (hasAppleProductsBefore && !isInLacradoSection) {
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
      
      // Verificar se há produtos Apple na lista limpa
      const hasAppleProducts = /iphone|ipad|macbook|airpods|apple watch|pencil|airtag/i.test(cleanedList);
      if (!hasAppleProducts) {
        console.warn('⚠️ AVISO: Nenhum produto Apple detectado na lista após limpeza!');
      }
      
      // Limitar tamanho da lista para evitar erros 500 da OpenAI
      const MAX_LIST_SIZE = 20000; // caracteres (aumentado para listas maiores)
      const MAX_LINES = 300; // linhas (aumentado para listas maiores)
      
      const listSize = cleanedList.length;
      const listLines = cleanedList.split('\n').length;
      
      console.log(`📊 Lista recebida: ${rawListText.length} caracteres originais, ${rawListText.split('\n').length} linhas originais`);
      console.log(`📊 Lista limpa: ${listSize} caracteres, ${listLines} linhas após limpeza`);
      
      // Se a lista for muito grande, avisar o usuário
      if (listSize > MAX_LIST_SIZE || listLines > MAX_LINES) {
        console.warn(`⚠️ Lista muito grande (${listSize} chars, ${listLines} linhas). Limite: ${MAX_LIST_SIZE} chars ou ${MAX_LINES} linhas.`);
        
        return {
          valid: false,
          errors: [`Lista muito grande (${listLines} linhas, ${listSize} caracteres).`],
          warnings: [`O limite recomendado é ${MAX_LINES} linhas ou ${MAX_LIST_SIZE.toLocaleString()} caracteres por vez para evitar erros.`],
          suggestions: [
            `Divida a lista em partes menores (máximo ${MAX_LINES} linhas por vez) e processe cada parte separadamente.`,
            'Ou remova linhas desnecessárias (anúncios, textos de aviso, etc) e mantenha apenas os produtos Apple.'
          ],
          validated_products: []
        };
      }
      
      // Avisar se a lista está próxima do limite
      if (listSize > MAX_LIST_SIZE * 0.8 || listLines > MAX_LINES * 0.8) {
        console.warn(`⚠️ Lista grande (${Math.round(listSize/MAX_LIST_SIZE*100)}% do limite). Pode ter problemas.`);
      }
      
      // Prompt simplificado mas completo para listas de produtos Apple NOVOS
      const prompt = `Extraia APENAS produtos Apple NOVOS desta lista. REGRAS CRÍTICAS:

1. PRODUTOS: APENAS iPhone (12, 13, 14, 15, 16, 17 e todas variações Pro/Max/Air), iPad, MacBook, AirPods, Apple Watch, Magic Keyboard, Apple Pencil
   - CRÍTICO: Processe TODOS os modelos iPhone 12, 13, 14, 15, 16, 17 e variações. NÃO IGNORE iPhone 12, 13, 14, 15 só porque são mais antigos.
2. CONDITION - APENAS NOVOS: Aceite APENAS produtos com condição NOVO, LACRADO ou CPO
   - REGRA CRÍTICA: iPad, MacBook, AirPods, Apple Watch são SEMPRE NOVOS - sempre marque como condition: "Novo"
3. TERMOS PARA NOVOS (PROCESSAR): "lacrado", "novo", "1 ano de garantia apple", "cpo", "garantia apple", "garantia dos aparelhos lacrados"
4. TERMOS PARA SEMINOVOS (IGNORAR COMPLETAMENTE): "swap", "vitrine", "seminovo", "seminovos", "seminovo americano", "americano" (quando usado com swap/vitrine/seminovo), "usado", "recondicionado", "non active", bateria (80%, 85%, 90%)
5. IGNORE COMPLETAMENTE: Se um produto menciona SWAP, VITRINE, SEMINOVO, SEMINOVOS, USADO, REcondicionado, NON ACTIVE, 80%, 85%, 90% bateria - NÃO EXTRAIA ESTES PRODUTOS
   - IMPORTANTE: Se produto está em seção LACRADOS/NOVOS, PROCESSAR mesmo se tiver "(DESATIVADO)" na descrição - isso pode ser apenas uma nota da lista
6. LACRADO = NOVO: Se encontrar "LACRADO", "IPHONE LACRADO", "GARANTIA APPLE", "1 ANO DE GARANTIA APPLE", "GARANTIA DOS APARELHOS LACRADOS" → condition: "Novo", condition_detail: "LACRADO"
7. MODELO: Extraia EXATAMENTE como escrito - NUNCA adicione Pro/Max/Plus se não estiver explícito. Processe TODOS os modelos iPhone 12, 13, 14, 15, 16, 17 e todas variações. IMPORTANTE: Se encontrar "iPhone 13", "iPhone 15", "iPhone 14" na lista, EXTRAIA esses produtos normalmente - eles são válidos e devem ser processados.
8. PREÇO: Aceite R$, $, 💵, 💲, 🪙, 💰, 💸 - normalize para numérico puro (remova pontos, vírgulas, espaços). Preço pode vir na mesma linha que a cor ou em linha separada. Ex: "Laranja 8300,00" ou "* Laranja" depois "💸4250,00"
9. CORES: Aceite cores em português (azul, preto, branco, rose, verde) e inglês (space black, jet black, midnight, starlight, desert, natural, silver, gold)
10. ARMAZENAMENTO: Normalize (256=256GB, 1T=1TB, 2tb=2TB, 128GB=128GB, 64GB=64GB)
11. CONDIÇÃO PADRONIZADA:
   - iPad, MacBook, AirPods, Apple Watch são SEMPRE NOVOS → condition: "Novo", condition_detail: "LACRADO" ou "NOVO"
   - LACRADO, LACRADOS, "IPHONE LACRADO", "1 ANO DE GARANTIA APPLE" → condition: "Novo", condition_detail: "LACRADO"
   - NOVO → condition: "Novo", condition_detail: "NOVO"
   - CPO → condition: "Novo", condition_detail: "CPO"
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
   - IMPORTANTE: Se produto tem LACRADO, CPO na descrição OU está em seção "LACRADO COM GARANTIA APPLE", PROCESSAR como condition: "Novo", condition_detail: "LACRADO" ou "CPO"
   - Se preço ANTES das cores (🚦, 📲, 📍, ✅), cada cor = produto separado com mesmo preço
   - Se cor vem DEPOIS do modelo com hífen longo (—) ou asterisco (*), cada cor = produto separado
   - Preço pode vir com 💸, 💵, 💲, 💰, R$ em linha separada ou na mesma linha
14. EXATIDÃO: Se lista diz "iPhone 17 256GB" → model="iPhone 17 256GB" (NÃO "Pro Max"). Processe iPhone 12, 13, 14, 15, 16, 17 e todas variações
15. IGNORAR PRODUTOS:
   - Se produto está em seção de LACRADOS/NOVOS, PROCESSAR mesmo se tiver "(DESATIVADO)" - pode ser apenas nota da lista
   - Produtos com "garantia 6 meses pela loja", "3 meses garantia pela loja" APENAS se NÃO estiverem em seção LACRADOS/NOVOS
   - Se encontrar marcador "IPHONE VITRINE", "IPHONE SWAP" → IGNORE completamente tudo DEPOIS desse marcador

IMPORTANTE: 
- Se um produto tem SWAP, VITRINE, SEMINOVO, SEMINOVOS, USADO, bateria (80%, 85%, 90%), NON ACTIVE → IGNORE completamente
- Se houver seção "SWAP", "Vitrine", "Seminovo" → IGNORE apenas produtos DENTRO dessa seção
- "americano" como variante de produto NOVO → PROCESSAR. "seminovo americano" ou "americano" em seção SWAP/VITRINE → IGNORAR
- EXTRAIA TODOS os modelos iPhone encontrados: 12, 13, 14, 15, 16, 17 e variações. Não ignore modelos mais antigos (12, 13, 14, 15). Todos são válidos se forem NOVOS.

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
          'Você é um assistente especializado em produtos Apple NOVOS. Retorne APENAS JSON válido. REGRAS CRÍTICAS: 1) EXTRAIA APENAS produtos NOVOS (NOVO, LACRADO, CPO, "1 ano de garantia apple") - IGNORE completamente SWAP, VITRINE, SEMINOVO, SEMINOVOS, USADO, REcondicionado, NON ACTIVE, produtos com bateria (80%, 85%, 90%). 2) TERMOS NOVOS: "lacrado", "novo", "1 ano de garantia apple", "cpo" → PROCESSAR. 3) TERMOS SEMINOVOS: "swap", "vitrine", "seminovo", "seminovos", "seminovo americano" → IGNORAR. 4) IMPORTANTE: Se produto está em seção LACRADOS/NOVOS, PROCESSAR mesmo se tiver "(DESATIVADO)" na descrição - isso pode ser apenas uma nota da lista, não significa que não é novo. 5) LACRADO = NOVO sempre. 6) Processe iPhone 12, 13, 14, 15, 16, 17 e todas variações (Pro, Max, Air). 7) Extraia modelos EXATAMENTE como aparecem - NUNCA adicione Pro/Max/Plus se não estiver explícito. 8) Se preço está ANTES das cores (🚦, 📲, 📍, ✅) ou cor vem DEPOIS com hífen longo (—), cada cor = produto separado com mesmo preço. 9) CPO → condition_detail: "CPO" E variant: "CPO". 10) ANATEL/🇧🇷 → variant: "ANATEL". 11) eSIM/CHIP VIRTUAL → variant: "E-SIM". 12) CHIP FÍSICO/LL/LL/A → variant baseado na região (🇺🇸=AMERICANO, 🇯🇵=JAPONÊS). 13) "americano" como variante de produto NOVO → OK. "seminovo americano" ou em contexto SWAP/VITRINE → IGNORAR. 14) Cores: aceite português/inglês (space black, jet black, midnight, starlight, desert, natural, prata, laranja). 15) Armazenamento: normalize (256=256GB, 1T=1TB). 16) Preços: remova pontos, vírgulas, espaços - normalize para número puro (ex: "R$ 10.850,00" → 10850). 17) Ignore produtos não-Apple e produtos usados/seminovos, mas PROCESSAR produtos LACRADOS mesmo com notas adicionais.',
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
          
          return true;
        }).map(product => {
          // GARANTIR que iPad, MacBook, AirPods, Apple Watch são SEMPRE NOVOS
          const productName = (product.name || '').toLowerCase();
          const productModel = (product.model || '').toLowerCase();
          
          const isAlwaysNewProduct = 
            productName.includes('ipad') || productModel.includes('ipad') ||
            productName.includes('macbook') || productModel.includes('macbook') ||
            productName.includes('airpod') || productModel.includes('airpod') ||
            productName.includes('apple watch') || productName.includes('watch') || productModel.includes('watch');
          
          if (isAlwaysNewProduct) {
            // Forçar condition: "Novo" para esses produtos
            product.condition = 'Novo';
            if (!product.condition_detail || product.condition_detail === '') {
              product.condition_detail = 'LACRADO';
            }
          }
          
          return product;
        });
        
        // Atualizar a resposta com apenas produtos novos
        parsedResponse.validated_products = produtosNovos;
        
        // Se todos foram filtrados, marcar como inválido
        if (produtosNovos.length === 0 && parsedResponse.validated_products.length > 0) {
          parsedResponse.valid = false;
          if (!parsedResponse.errors) parsedResponse.errors = [];
          parsedResponse.errors.push('Nenhum produto NOVO encontrado. Apenas produtos NOVOS, LACRADOS ou CPO são aceitos.');
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
      
      // Log da validação com tracking real
      const lineCount = rawListText.split('\n').length;
      await aiDashboardService.logAIUsage('validate_product_list', {
        input_count: lineCount,
        validation_result: parsedResponse,
        filtered_to_novos_only: true
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

