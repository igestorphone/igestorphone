# iGestorPhone - Sistema Web

Sistema inteligente de automação para lojistas Apple - Versão Web

## 🚀 Funcionalidades

- **Processamento de Listas com IA**: Organize listas desorganizadas automaticamente
- **Consulta de Fornecedores**: Visualize todos os fornecedores e produtos
- **Análise de Preços**: Estatísticas e tendências de preços por modelo
- **Busca de Melhores Preços**: Encontre o produto mais barato disponível
- **Gestão de Usuários**: Administração completa de usuários e permissões
- **Exportação de Dados**: Download de relatórios em formato CSV
- **PWA**: Funciona como aplicativo nativo no mobile

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Framer Motion
- **Estado**: Zustand
- **Queries**: TanStack Query
- **Roteamento**: React Router DOM
- **Formulários**: React Hook Form + Zod
- **Notificações**: React Hot Toast
- **Gráficos**: Recharts
- **PWA**: Vite PWA Plugin

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd web-system
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
VITE_API_URL=http://localhost:3001/api
VITE_OPENAI_API_KEY=sua_chave_openai_aqui
```

4. **Execute o projeto**
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── layouts/            # Layouts da aplicação
├── pages/              # Páginas da aplicação
├── stores/             # Estado global (Zustand)
├── types/              # Definições TypeScript
├── lib/                # Utilitários e configurações
└── main.tsx           # Ponto de entrada
```

## 🎯 Páginas Principais

- **Dashboard**: Visão geral do sistema
- **Processar Lista**: Processamento com IA
- **Consultar Fornecedores**: Lista de fornecedores
- **Estatísticas**: Análise de preços
- **Buscar Mais Barato**: Encontrar melhores preços
- **Perfil**: Gerenciar conta do usuário
- **Admin**: Painel administrativo
- **Suporte**: Central de ajuda

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting
npm run type-check   # Verificação de tipos
```

## 🌐 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Netlify

1. Build do projeto: `npm run build`
2. Upload da pasta `dist`
3. Configure as variáveis de ambiente

### Outros

O projeto gera arquivos estáticos na pasta `dist` que podem ser servidos por qualquer servidor web.

## 🔐 Segurança

- Autenticação JWT
- Validação de formulários com Zod
- Sanitização de dados
- Headers de segurança
- Validação de permissões

## 📱 PWA

O sistema é um Progressive Web App (PWA) que pode ser instalado no dispositivo:

- **Mobile**: Adicionar à tela inicial
- **Desktop**: Instalar como aplicativo
- **Offline**: Funciona sem conexão (dados em cache)

## 🤖 Integração com IA

- **OpenAI GPT**: Processamento de listas
- **Validação**: Verificação de dados
- **Fallback**: Processamento local como backup

## 📊 Monitoramento

- Logs de erro
- Métricas de performance
- Analytics de uso
- Relatórios de sistema

## 🆘 Suporte

- **Email**: suporte@igestorphone.com
- **WhatsApp**: +55 11 99999-9999
- **Documentação**: [Link para docs]

## 📄 Licença

© 2024 iGestorPhone. Todos os direitos reservados.

## 🔄 Atualizações

### v1.0.0
- Sistema completo implementado
- Todas as funcionalidades do app Flutter migradas
- Interface moderna e responsiva
- PWA configurado
- Integração com IA

---

**Desenvolvido com ❤️ para lojistas Apple**
