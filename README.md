# 💰 HZ Soluções - Sistema Financeiro Pessoal

Sistema completo de gestão financeira pessoal com integração WhatsApp, desenvolvido com arquitetura moderna e type-safe.

## 🎯 Funcionalidades

### ✅ Gestão Financeira
- Adicionar receitas e despesas
- Auto-categorização inteligente
- Despesas fixas mensais
- Relatórios por categoria
- Resumo financeiro mensal

### ✅ Metas Financeiras
- Criar e acompanhar metas
- Visualizar progresso
- Múltiplas metas simultâneas

### ✅ Lista de Compras
- Adicionar itens com preço
- Marcar como comprado
- Acompanhar total estimado

### ✅ Cuidados Diários
- Registrar hormônios, remédios, alimentação
- Marcar como concluído
- Histórico de cuidados

### ✅ Consumo de Água
- Registrar consumo em ml
- Meta diária de 2000ml
- Acompanhamento de progresso

### 🔄 Integração WhatsApp (Em Desenvolvimento)
- Comandos via texto
- Webhook configurado
- Parser de comandos funcional

---

## 🏗️ Arquitetura

### Monorepo
```
hz-solucoes/
├── apps/
│   ├── server/          # Backend (Express + tRPC)
│   └── web/             # Frontend (React + Vite)
└── packages/
    └── ui/              # Componentes compartilhados
```

### Stack Tecnológica

#### Backend
- **Runtime:** Node.js 20+ com TypeScript
- **Framework:** Express.js
- **API:** tRPC (type-safe RPC)
- **ORM:** Drizzle ORM
- **Banco de Dados:** LibSQL (SQLite local) / Turso (produção)
- **Validação:** Zod

#### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Roteamento:** React Router v7
- **Estado:** TanStack Query (React Query)
- **Gráficos:** Recharts
- **PWA:** Vite PWA Plugin
- **Validação:** React Hook Form + Zod

---

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20.15.1 ou superior
- npm ou yarn

### 1. Clonar o Repositório
```bash
git clone https://github.com/hzsolocoes1983-ui/hzsolucoes.git
cd hzsolucoes/hz-solucoes
```

### 2. Instalar Dependências

**Backend:**
```bash
cd apps/server
npm install
```

**Frontend:**
```bash
cd apps/web
npm install
```

### 3. Configurar Variáveis de Ambiente

**Backend:**
```bash
cd apps/server
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

**Frontend:**
```bash
cd apps/web
# O arquivo .env.development já está configurado
```

### 4. Inicializar Banco de Dados

```bash
cd apps/server

# Aplicar schema e índices
npm run db:push

# Ou executar migrations manualmente
npm run db:migrate
```

### 5. Iniciar Servidores

**Backend (Terminal 1):**
```bash
cd apps/server
npm run dev
```
Servidor rodando em: http://localhost:3000

**Frontend (Terminal 2):**
```bash
cd apps/web
npm run dev
```
Aplicação rodando em: http://localhost:5173

---

## 📦 Scripts Disponíveis

### Backend (`apps/server`)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia servidor em produção |
| `npm test` | Executa testes |
| `npm run db:generate` | Gera migrations do Drizzle |
| `npm run db:push` | Aplica mudanças no banco |
| `npm run db:studio` | Abre interface visual do banco |
| `npm run db:migrate` | Executa migrations customizadas |

### Frontend (`apps/web`)

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia app em modo desenvolvimento |
| `npm run build` | Compila para produção |
| `npm run preview` | Preview da build de produção |

---

## 🗄️ Banco de Dados

### Schema

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `transactions` | Receitas e despesas |
| `goals` | Metas financeiras |
| `items` | Lista de compras |
| `daily_care` | Cuidados diários |
| `water_intake` | Consumo de água |
| `accounts` | Contas bancárias |

### Índices de Performance

O projeto inclui 8 índices otimizados para as queries mais comuns:
- Transações por usuário e data
- Transações por tipo
- Itens por status
- Cuidados e água por data
- Metas e contas por usuário

---

## 🎨 Componentes e Hooks

### Componentes UI
- `Button` - Botão estilizado
- `Card` - Container de conteúdo
- `Modal` - Janela modal
- `Input` - Input com validação
- `Toast` - Notificações

### Hooks Customizados
- `useFormValidation` - Validação de formulários com Zod
- `useErrorHandler` - Tratamento centralizado de erros
- `useToast` - Sistema de notificações

### Schemas de Validação
- `transactionSchema` - Receitas e despesas
- `itemSchema` - Lista de compras
- `goalSchema` - Metas financeiras
- `loginSchema` - Autenticação

---

## 📱 PWA (Progressive Web App)

O frontend é configurado como PWA, permitindo:
- Instalação no dispositivo
- Funcionamento offline (cache)
- Ícones personalizados
- Experiência nativa

---

## 🔐 Segurança (A Implementar)

**Pendente:**
- [ ] Hash de senhas com bcrypt
- [ ] JWT para autenticação
- [ ] Rate limiting
- [ ] CORS configurado para produção

**Nota:** Para uso pessoal, as medidas de segurança atuais são suficientes. Para produção pública, implemente as melhorias acima.

---

## 📡 WhatsApp (A Implementar)

**Status Atual:**
- ✅ Webhook configurado
- ✅ Parser de comandos funcional
- ⏳ Envio de mensagens (requer configuração)

**Comandos Disponíveis:**
- `gasto [valor] [descrição]` - Adicionar despesa
- `receita [valor] [descrição]` - Adicionar receita
- `saldo` - Ver resumo financeiro
- `despesas` - Últimas 5 despesas
- `itens` - Lista de compras pendente
- `item [nome] [preço]` - Adicionar item
- `agua [ml]` - Registrar água
- `ajuda` - Lista de comandos

**Para Implementar:**
Escolha entre:
1. **Meta WhatsApp Business API** (oficial, mais complexo)
2. **Evolution API** (mais fácil, recomendado)

---

## 🚀 Deploy

### Backend
**Opções recomendadas:**
- Railway (grátis com limitações)
- Render (grátis com limitações)
- Fly.io

### Frontend
**Opções recomendadas:**
- Vercel (grátis, recomendado)
- Netlify (grátis)
- Render (grátis)

### Banco de Dados
**Opções recomendadas:**
- Turso (LibSQL na nuvem, grátis)
- SQLite local (desenvolvimento)

**Guias de deploy disponíveis:**
- `DEPLOY.md` - Deploy completo
- `DEPLOY-FREE.md` - Deploy gratuito
- `DEPLOY-SIMPLES.md` - Deploy simplificado

---

## 📚 Documentação Adicional

- `MELHORIAS-IMPLEMENTADAS.md` - Detalhes das melhorias recentes
- `ANALISE-PROJETO.md` - Análise completa do projeto
- `STATUS-FINAL.md` - Status atual do desenvolvimento
- `COMO-REINICIAR-SERVIDOR.md` - Guia de troubleshooting

---

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é de uso pessoal.

---

## 👨‍💻 Autor

**HZ Soluções**
- GitHub: [@hzsolocoes1983-ui](https://github.com/hzsolocoes1983-ui)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a documentação em `MELHORIAS-IMPLEMENTADAS.md`
2. Consulte os logs do servidor e do navegador
3. Verifique as variáveis de ambiente
4. Abra uma issue no GitHub

---

## 📊 Status do Projeto

| Componente | Status | Completude |
|------------|--------|------------|
| Backend | ✅ Funcional | 95% |
| Frontend | ✅ Funcional | 80% |
| Banco de Dados | ✅ Otimizado | 100% |
| WhatsApp | ⏳ Parcial | 60% |
| Segurança | ⏳ Básica | 40% |
| Testes | ❌ Pendente | 0% |
| Deploy | ✅ Configurado | 100% |

**Última atualização:** 20 de Novembro de 2025

---

**Desenvolvido com ❤️ para gestão financeira pessoal**
