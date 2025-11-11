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

    const requestPayload = {
      model: this.model,
      input,
      temperature,
      max_output_tokens: maxOutputTokens || this.maxTokens
    };

    const response = await openai.responses.create(requestPayload);

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
      const prompt = `
Você é um especialista em produtos Apple. Analise esta lista BAGUNÇADA e identifique APENAS produtos Apple.

PRODUTOS APPLE VÁLIDOS:
- iPhones: iPhone 11, 12, 13, 14, 15, 16, 17 (incluindo Pro, Pro Max, Plus, Mini, E)
- MacBooks: MacBook Air, MacBook Pro (M1, M2, M3, M4)
- AirPods: AirPods, AirPods Pro, AirPods Pro 2, AirPods Max, AirPods Gen
- iPads: iPad, iPad Air, iPad Pro, iPad Mini
- Apple Watch: Series 7, 8, 9, Ultra (tamanhos: 38mm, 40mm, 41mm, 42mm, 44mm, 45mm, 49mm)
- Outros Apple: iMac, Mac Mini, Mac Studio, Apple TV, Apple Pencil, Pencil
- Acessórios: Magic Keyboard, Magic Mouse, Magic Trackpad

CONDIÇÕES PADRONIZADAS (lidar com códigos):
GRUPO SEMINOVO (todos são "Seminovo"):
- "SWAP" = "Seminovo"
- "VITRINE" = "Seminovo" 
- "SEMINOVO" = "Seminovo"
- "SEMINOVO PREMIUM" = "Seminovo"
- "SEMINOVO AMERICANO" = "Seminovo"
- "NON ACTIVE" = "Seminovo"
- "ASIS" = "Seminovo"
- "ASIS+" = "Seminovo"
- "AS IS PLUS" = "Seminovo"

GRUPO NOVO (todos são "Novo"):
- "CPO" = "Novo" (CPO = Certified Pre-Owned, mas vendido como novo)
- "LACRADO" = "Novo"
- "LACRADOS" = "Novo"
- "GARANTIA" = "Novo" (quando mencionado com "1 ano", "Apple", etc)
- "NOVO" = "Novo"
- "NOVOS" = "Novo"

OUTROS:
- "USADO" = "Usado"
- "RECONDICIONADO" = "Recondicionado"

CORES VÁLIDAS (incluindo variações e emojis):
Cores em português: azul, preto, branco, rosa, verde, amarelo, roxo, cinza, dourado, prata, lilas, vermelho, laranja
Cores em inglês: silver, midnight, starlight, natural, desert, gold, rose, pink, jet black, space gray, space grey, sky blue, titanium silver, titanium white, jetblack
Cores especiais: azul-titânio, preto-titânio, branco-titânio, natural-titânio, jettblack, jet black
Emojis de cores: 🟦, ⚫, ⚪, 🟥, 🟩, 🟨, 🟪, 🟫, 🟧, 🔵, 🔴, 🟢, 🟡, 🟣, 🟤, 🟠, 🩶 (cinza), 🤍 (branco), 💞 (rosa), 🌸 (rosa)
Emojis de cores com texto: 🔵azul, ⚪️branco, ⚫️preto, 🔴vermelho, 🟢verde, etc

ARMAZENAMENTO:
iPhone: 64GB, 128GB, 256GB, 512GB, 1TB
MacBook: 256GB, 512GB, 1TB, 2TB, 4TB, 8TB
AirPods: Não tem armazenamento
iPad: 64GB, 128GB, 256GB, 512GB, 1TB, 2TB
Apple Watch: Não tem armazenamento (mas tem tamanho em MM - ex: 45mm, 44mm, 41mm)
- Se encontrar apenas o número (ex: "256", "512" ou "1T") sem o sufixo "GB", converta para o formato correto ("256GB", "512GB", "1TB")
- Formatos como "1T", "1T GB", "1 TB" devem ser normalizados para "1TB"

TAMANHOS APPLE WATCH (MM):
- 38mm, 40mm, 41mm, 42mm, 44mm, 45mm, 49mm
- Extrair sempre que encontrar "Apple Watch" seguido de números + "mm" ou "MM"
- Se encontrar "Apple Watch 45mm", extrair "45mm" no campo "storage"

FORMATOS DE PREÇO ACEITOS:
- R$ 1150
- R$1150
- 1150
- $9100
- $ 9300
- 💵14800,00
- 💲4150
- 🪙920
- 💰9,300$💰
- R$ 1.150,00
- R$ 1.150.00
- R$: 8900
- R$:1250
- Qualquer formato numérico com ou sem R$, $, 💵, 💲, 🪙, 💰 ou símbolo de moeda
- Aceitar preços com vírgula ou ponto como separador decimal

FORMATOS DE LISTA COMUNS (CRÍTICO - ENTENDA TODOS OS FORMATOS):

FORMATO 1 - Preço ACIMA, cores ABAIXO (MAIS COMUM - FORNECEDOR EXPO):
📱 iPhone 17 PRO MAX 256GB eSIM
$9100
✅ Azul
$9300
✅ Silver
✅ Laranja

→ Neste formato, o PREÇO aparece ANTES das cores. Cada preço pode ter múltiplas cores associadas.
→ Extraia CORRETAMENTE: 
  - iPhone 17 PRO MAX 256GB (Azul) = $9100
  - iPhone 17 PRO MAX 256GB (Silver) = $9300
  - iPhone 17 PRO MAX 256GB (Laranja) = $9300

→ REGRA CRÍTICA: Se encontrar um preço seguido de linhas com cores (✅ Azul, ✅ Silver, etc), o preço se aplica a TODAS as cores listadas abaixo até aparecer um novo preço ou produto.

FORMATO 1.1 - Preço com emoji, cores com emoji:
📲17 pro max 256 🇺🇸
🔵azul R$: 8900
⚪️branco R$: 9150

→ Neste formato, cada cor tem seu próprio preço na mesma linha.
→ Extraia: iPhone 17 Pro Max 256GB (Azul) = R$ 8900, iPhone 17 Pro Max 256GB (Branco) = R$ 9150

FORMATO 1.2 - Produto, depois cores com preços individuais:
📱13 128🇺🇸 (acima de 85%)
🔴vermelho R$: 1800
🟢verde R$: 1800
🔵azul R$: 1800
⚫️preto R$:1800

→ Cada cor tem preço na mesma linha. O preço é aplicado à cor específica.

FORMATO 1.3 - Preço com emoji de dinheiro, cores separadas:
📱IPHONE 17 pro max 2tb 
📍azul 
📍silver 
📍laranja 
💵14800,00

→ O preço aparece DEPOIS de todas as cores e se aplica a TODAS as cores listadas acima.

FORMATO 1.4 - Preço na mesma linha do produto, cores abaixo:
✅📲*17 Pro Max 1T GB ESIM AMERICANO*
*Branco*🪙*12900*
*Azul*🪙*13000*
*(1)Laranja*🪙*13000*

→ Cada cor tem seu preço na mesma linha com emoji de dinheiro.

FORMATO 1.5 - Produto, preço, cores em lista:
♻️IPHONE 17 PRO MAX 256GB *E-SIM* 
◾️AZUL        ◾️R$9000
◾️LARANJA ◾️R$9150
◾️BRANCO  ◾️R$9200

→ Cada cor tem seu preço na mesma linha separado por símbolo (◾️).

FORMATO 2 - Preço e cor na mesma linha:
📱 iPhone 15 Pro Max 256GB Azul - R$ 8500
→ Extraia normalmente

FORMATO 3 - Produto, depois preço, depois cores:
iPhone 14 Pro
R$ 7500
Preto, Branco, Azul
→ O preço é aplicado a todas as cores listadas na mesma linha ou linhas seguintes até próximo preço/produto

FORMATO 4 - Produto com condição e região, cores com preços:
📱 iPhone 11 64GB 🇨🇳
🎨 ⚪ ⚫
🔋 R$ 1,180🇨🇳
🪫 R$ 1,250 🇺🇸

→ Neste formato, o produto tem múltiplos preços (diferentes condições/regiões). Cada preço pode ter suas próprias cores ou o mesmo conjunto de cores.

FORMATO 5 - Produto, cores com emoji, preço compartilhado:
📱16 plus 128 E-sim 🇺🇸R$: 4250
(Com garantia Apple de 2 a 6 meses )
⚫️preto 
🔵azul 

→ O preço aparece na linha do produto e se aplica a todas as cores listadas abaixo.

FORMATO 6 - Produto com emoji de cor na mesma linha:
📱17 PRO MAX 256 GB ESIM
⚫️preto R$: 4350
🔵azul R$: 4350

→ Cada cor tem seu preço na mesma linha.

FORMATO 7 - Produto, cores separadas, preço único:
📱15 pro max 512🇺🇸 R$: 4490
🩶natural 
🔵azul 
⚫️preto 
⚪️branco 

→ O preço aparece antes das cores e se aplica a todas as cores listadas.

FORMATO 8 - Produto com símbolos especiais:
✅📲*17 Pro Max 512 GB ESIM Japonês*
*Branco*🪙*10500*
*Azul*🪙*10400*
*Laranja*🪙*11000*

→ Cada cor tem preço com emoji de dinheiro (🪙) na mesma linha.

REGRAS CRÍTICAS DE PRECISÃO (MÁXIMA IMPORTÂNCIA):
**REGRA #1 - NUNCA ASSUMIR VARIANTES:**
- Se a lista diz "iPhone 17 256GB" → Extraia EXATAMENTE "iPhone 17 256GB" (NÃO "iPhone 17 Pro Max")
- Se a lista diz "iPhone 17" → Extraia EXATAMENTE "iPhone 17" (NÃO "iPhone 17 Pro", "iPhone 17 Pro Max", etc)
- Se a lista diz "iPhone 17 Pro" → Extraia EXATAMENTE "iPhone 17 Pro" (NÃO "iPhone 17 Pro Max")
- Se a lista diz "iPhone 17 Pro Max" → Extraia EXATAMENTE "iPhone 17 Pro Max"
- NUNCA adicione "Pro", "Pro Max", "Plus", "Mini", "Air", "SE" se não estiver EXPLICITAMENTE no texto original
- Se o texto diz apenas "17" ou "iPhone 17", NÃO adicione variantes
- Exemplos CORRETOS:
  * Texto: "📱 iPhone 17 256GB" → Nome: "iPhone", Model: "iPhone 17 256GB" (NÃO "iPhone 17 Pro Max")
  * Texto: "iPhone 17" → Nome: "iPhone", Model: "iPhone 17" (NÃO "iPhone 17 Pro")
  * Texto: "iPhone 17 Pro Max 256GB" → Nome: "iPhone", Model: "iPhone 17 Pro Max 256GB" ✓
- Exemplos INCORRETOS (NÃO FAÇA ISSO):
  * Texto: "iPhone 17 256GB" → ❌ ERRADO: "iPhone 17 Pro Max 256GB"
  * Texto: "iPhone 17" → ❌ ERRADO: "iPhone 17 Pro"
  * Texto: "17 256GB" → ❌ ERRADO: "iPhone 17 Pro Max 256GB"

**REGRA #2 - EXTRAIR EXATAMENTE O QUE ESTÁ ESCRITO:**
- Extraia o modelo EXATAMENTE como aparece no texto, sem adicionar, remover ou modificar variantes
- Se houver ambiguidade, prefira a versão MAIS SIMPLES (sem Pro, Pro Max, etc)
- Se o texto diz "17", não assuma que é "17 Pro Max"

REGRAS PARA LISTAS BAGUNÇADAS:
1. IGNORE emojis desnecessários, asteriscos, formatação, mas PRESERVE emojis de cores (🟦, ⚫, ⚪, 🟥, 🔵, 🔴, 🟢, 🟡, 🟣, 🟤, 🟠, 🩶, 🤍, 💞, 🌸)
2. PRESERVE emojis de cores quando próximos ao produto - eles indicam a cor do produto
3. ACEITE apenas produtos Apple - ignore Samsung, Xiaomi, Motorola, Realme, Amazon Echo, Fire TV, etc.
4. Se contém "iPhone", "MacBook", "AirPods", "iPad", "Apple Watch", "Pencil" = VÁLIDO
5. Padronize condições: SWAP/VITRINE/SEMINOVO/SEMINOVO PREMIUM/SEMINOVO AMERICANO/ASIS/ASIS+ = "Seminovo"
6. Padronize condições: CPO/LACRADO/LACRADOS/NOVO/NOVOS = "Novo"
7. Extraia informações mesmo se incompletas
8. Ignore linhas sem preço válido OU produtos não-Apple
9. Aceite variações de escrita (ex: "IPHONE" = "iPhone", "AIRPODS PRO 02" = "AirPods Pro 2", "SE3" = "iPhone SE 3")
10. **NUNCA adicione variantes (Pro, Pro Max, Plus, Mini, Air, SE) se não estiverem EXPLICITAMENTE no texto**
11. Emojis de cores são válidos para identificar cores dos produtos
12. Extraia preços mesmo que estejam em linha separada ou na mesma linha
13. Se uma linha tem apenas preço (ex: "R$1950", "$9100", "💵14800,00"), associe ao produto da linha anterior se for Apple
14. **CRÍTICO**: Se encontrar um preço seguido de linhas com cores (✅ Azul, ✅ Silver, 🔵azul, ⚪️branco, etc), crie um produto para CADA cor com o mesmo preço
15. **CRÍTICO**: Se encontrar múltiplos preços seguidos de cores, cada preço aplica-se às cores imediatamente abaixo dele até o próximo preço
16. **CRÍTICO**: Se encontrar "✅", "✓", "📍", "◾️", "☑️", "⚓️" ou emojis de cor seguido de cor, isso indica uma cor associada ao preço mais recente acima
17. **CRÍTICO**: Se o preço está ACIMA das cores, isso significa que o preço se aplica a todas as cores listadas abaixo até o próximo preço ou produto
18. **CRÍTICO**: Quando encontrar um novo preço, ele substitui o preço anterior e aplica-se às cores seguintes
19. **CRÍTICO**: Se o produto está na primeira linha e depois vem preço e cores, todas as cores pertencem a esse produto com esse preço
20. **CRÍTICO**: Se encontrar formato "📍cor 💵preço" ou "◾️COR ◾️R$preço", cada linha é um produto separado com cor e preço específicos
21. **CRÍTICO**: Se encontrar "🎨" seguido de emojis de cores, esses são as cores disponíveis para aquele produto
22. **CRÍTICO**: Se encontrar "🔋" e "🪫" (bateria cheia/vazia), isso indica diferentes condições/preços, não cores
23. **CRÍTICO**: Se encontrar "(Acima de 85% a 100%)", "(Não pode atualizar)", "(Mensagem de bateria)", etc, essas são informações adicionais, não cores
24. **CRÍTICO**: Se encontrar "🇨🇳", "🇺🇸", "🇯🇵" (bandeiras), isso indica região/origem, não cor
25. **CRÍTICO**: Se encontrar "eSIM", "ESIM", "ANATEL", "CHIP FÍSICO", "CHIP VIRTUAL", etc, EXTRAIA essa informação como campo "variant"
26. **CRÍTICO**: Aceitar cores como: azul, preto, branco, rosa, verde, amarelo, roxo, cinza, dourado, prata, silver, midnight, starlight, natural, desert, gold, lilas, vermelho, rose, pink, azul-titânio, preto-titânio, branco-titânio, natural-titânio, laranja, jettblack, jet black, space gray, space grey, sky blue, titanium silver, titanium white

VARIANTES DE REDE/ORIGEM/LOGÍSTICA:
- Se encontrar "ANATEL" → variant = "ANATEL"
- Se encontrar "E-SIM", "ESIM", "E SIM" → variant = "E-SIM"
- Se encontrar "CHIP FÍSICO", "CHIP FISCO", "FÍSICO", "FISICO" → variant = "CHIP FÍSICO"
- Se encontrar "CHIP VIRTUAL" → variant = "CHIP VIRTUAL"
- Se encontrar "CHINÊS", "CHINA", "🇨🇳" → variant = "CHINÊS"
- Se encontrar "JAPONÊS", "JAPÃO", "🇯🇵" → variant = "JAPONÊS"
- Se encontrar "INDIANO", "ÍNDIA", "🇮🇳" → variant = "INDIANO"
- Se encontrar "AMERICANO", "USA", "EUA", "🇺🇸" → variant = "AMERICANO"
- Se encontrar "CPO" → variant = "CPO"
- Caso apareçam múltiplas informações (ex: "ANATEL 1 CHIP FÍSICO"), priorize "ANATEL"
- Se não houver informação, retorne variant como string vazia ""

Lista completa (texto bruto):
${rawListText}

IMPORTANTE: Analise TODO o texto e extraia TODOS os produtos Apple válidos. Ignore produtos que não são Apple.

ATENÇÃO ESPECIAL #1: Se o formato for "Produto → Preço → Cores", extraia cada cor como um produto separado com o mesmo preço. O preço ACIMA das cores se aplica a TODAS as cores listadas abaixo.

ATENÇÃO ESPECIAL #2 - PRECISÃO ABSOLUTA DE MODELOS:
- Extraia o modelo EXATAMENTE como está escrito no texto original
- Se o texto diz "iPhone 17 256GB", extraia EXATAMENTE "iPhone 17 256GB" (campo "name": "iPhone", campo "model": "iPhone 17 256GB")
- NUNCA adicione "Pro", "Pro Max", "Plus", "Mini", "Air", "SE" se não estiver EXPLICITAMENTE no texto
- Se houver dúvida entre "iPhone 17" e "iPhone 17 Pro Max", escolha SEMPRE a versão mais simples (sem Pro/Pro Max)
- Exemplos do que NÃO fazer:
  * Texto original: "iPhone 17 256GB" → ❌ ERRADO: "iPhone 17 Pro Max 256GB"
  * Texto original: "17 256GB" → ❌ ERRADO: "iPhone 17 Pro Max 256GB"
  * Texto original: "iPhone 17" → ❌ ERRADO: "iPhone 17 Pro"
- Exemplos CORRETOS:
  * Texto original: "iPhone 17 256GB" → ✓ CORRETO: name="iPhone", model="iPhone 17 256GB"
  * Texto original: "iPhone 17 Pro Max 256GB" → ✓ CORRETO: name="iPhone", model="iPhone 17 Pro Max 256GB"
  * Texto original: "17 Pro Max 256GB" → ✓ CORRETO: name="iPhone", model="iPhone 17 Pro Max 256GB"

Responda APENAS em JSON válido:
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
          'Você é um assistente especializado em produtos Apple. Você SEMPRE retorna JSON válido e bem formatado. Nunca inclua vírgulas extras ou elementos malformados. Certifique-se de que todos os arrays e objetos estão corretamente fechados. REGRA CRÍTICA DE PRECISÃO: Extraia modelos EXATAMENTE como aparecem no texto. Se o texto diz "iPhone 17 256GB", extraia EXATAMENTE isso, NUNCA adicione "Pro" ou "Pro Max" se não estiver explícito. NUNCA assuma variantes (Pro, Pro Max, Plus, Mini, Air, SE) - apenas extraia o que está escrito. Quando encontrar um formato onde o preço aparece ANTES das cores, extraia cada cor como um produto separado com o mesmo preço.',
        userPrompt: prompt,
        temperature: 0.3
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
      
      // Retornar resposta válida mesmo em caso de erro
      return {
        valid: false,
        errors: ['Erro ao processar lista com IA: ' + error.message],
        warnings: ['Não foi possível processar a lista completamente'],
        suggestions: ['Verifique se a lista contém produtos Apple válidos e tente novamente'],
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

