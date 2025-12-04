# Script para Normalizar Cores dos Produtos Antigos

Este script normaliza todas as cores dos produtos já existentes no banco de dados, unificando variações como:
- "Cosmic orange" → "Laranja"
- "Deep blue" → "Azul"
- "Prata" → "Branco" (para iPhone 17 Pro/Pro Max)

## Como executar:

### Opção 1: Via Render Shell (Produção)

1. Acesse o Render Dashboard
2. Vá para o seu serviço backend
3. Clique em "Shell" (terminal)
4. Execute o comando:

```bash
cd backend && node --loader ./node_modules/.bin/esbuild-register src/scripts/normalize-colors.js
```

Ou se tiver configurado um script no package.json:

```bash
npm run normalize-colors
```

### Opção 2: Local (Desenvolvimento)

1. Certifique-se de ter as variáveis de ambiente configuradas (`.env`)
2. Execute:

```bash
cd backend
node --loader ./node_modules/.bin/esbuild-register src/scripts/normalize-colors.js
```

### Opção 3: Adicionar script ao package.json

Adicione ao `backend/package.json`:

```json
{
  "scripts": {
    "normalize-colors": "node --loader ./node_modules/.bin/esbuild-register src/scripts/normalize-colors.js"
  }
}
```

Depois execute:

```bash
npm run normalize-colors
```

## O que o script faz:

1. ✅ Busca todos os produtos com cores no banco
2. ✅ Normaliza cada cor usando a função de normalização
3. ✅ Atualiza apenas produtos cujas cores mudaram
4. ✅ Mostra estatísticas ao final:
   - Quantos produtos foram atualizados
   - Quantos não precisaram de alteração
   - Se houver erros

## Exemplo de saída:

```
🔄 Normalizando cores de todos os produtos...

📦 Encontrados 1234 produtos com cores para normalizar

⏳ Processados 100 produtos...
⏳ Processados 200 produtos...
...

✅ Normalização concluída!
📊 Estatísticas:
   - Produtos atualizados: 856
   - Produtos sem alteração: 378
   - Erros: 0
   - Total processado: 1234
```

## Importante:

- ⚠️ O script é seguro e apenas atualiza as cores, não remove produtos
- ⚠️ Recomenda-se fazer backup do banco antes (opcional, mas seguro)
- ⚠️ O script pode demorar alguns minutos se houver muitos produtos

## Verificar resultado:

Após executar o script, verifique no filtro de cores que:
- "Laranja" e "Cosmic orange" aparecem apenas como "Laranja"
- "Azul" e "Deep blue" aparecem apenas como "Azul"
- "Branco" e "Prata" aparecem apenas como "Branco" (iPhone 17 Pro)


