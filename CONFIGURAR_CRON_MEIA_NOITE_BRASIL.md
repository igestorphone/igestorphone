# Configurar Cron Job para Limpar Produtos à Meia-Noite (Horário de Brasília)

## ✅ CORREÇÃO IMPLEMENTADA

O sistema agora está configurado para **GARANTIR** que os produtos só sejam desativados às **00h horário de Brasília (America/Sao_Paulo)**.

## 📋 O que foi feito:

1. **Script corrigido** (`backend/src/scripts/cleanup-products-midnight-brasil.js`):
   - Obtém o horário atual **diretamente do banco de dados** no timezone de Brasília
   - Verifica se é exatamente meia-noite em Brasília antes de executar
   - Desativa apenas produtos atualizados **ANTES de hoje** (no horário de Brasília)

2. **Rota API corrigida** (`backend/src/routes/products-cleanup.js`):
   - Também usa timezone de Brasília para todas as verificações
   - Query SQL usa `AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'`

## 🔧 Como configurar no Render:

### Opção 1: Usar Cron Job do Render (Recomendado)

1. No painel do Render, vá em **Cron Jobs**
2. Crie um novo cron job:
   - **Nome**: `Cleanup Products Midnight Brasil`
   - **Schedule**: `0 3 * * *` (03:00 UTC = 00:00 em Brasília durante horário padrão)
     - **OU** `0 4 * * *` (04:00 UTC = 00:00 em Brasília durante horário de verão)
   - **Command**: `cd backend && node src/scripts/cleanup-products-midnight-brasil.js`
   - **Service**: Selecione seu serviço backend

### Opção 2: Ajustar Schedule para Horário de Verão

O horário de verão no Brasil pode variar. Para garantir que sempre rode às 00h em Brasília:

- **Durante horário padrão (março a outubro)**: `0 3 * * *` (03:00 UTC)
- **Durante horário de verão (outubro a março)**: `0 2 * * *` (02:00 UTC)

**OU** configure para rodar nas duas horas:
```
0 2,3 * * *  # Roda às 02:00 e 03:00 UTC, mas o script só executa se for meia-noite em Brasília
```

O script verifica internamente se é meia-noite em Brasília, então só executará no horário correto.

### Opção 3: Testar Manualmente

Para testar se está funcionando (sem esperar meia-noite):

```bash
# No Render Shell:
cd backend
node src/scripts/cleanup-products-midnight-brasil.js --force
```

O flag `--force` permite executar mesmo fora do horário de meia-noite (útil para testes).

## ✅ Garantias:

- ✅ **Verificação dupla**: Script verifica o horário de Brasília ANTES de executar
- ✅ **Timezone correto**: Todas as queries SQL usam `America/Sao_Paulo`
- ✅ **Logs detalhados**: Mostra exatamente qual horário foi verificado
- ✅ **Segurança**: Só executa entre 00:00 e 00:10 horário de Brasília (tolerância de 10 minutos)

## 🧪 Como verificar:

Após configurar o cron, verifique os logs do Render na execução:

```
🕐 VERIFICAÇÃO DE HORÁRIO DE BRASÍLIA:
   Data/Hora atual em Brasília: 2024-12-10 00:00:15
   Hora: 00:00
   Data: 2024-12-10

🕛 Iniciando limpeza de produtos à meia-noite (horário de Brasília)...
```

Se você ver esse log, significa que está funcionando corretamente!

