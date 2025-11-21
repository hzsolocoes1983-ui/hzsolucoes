# 🚀 Instruções Rápidas - Deploy no Vercel

## ⚡ Passo a Passo Rápido

### 1. Preparar Banco de Dados (Turso)
1. Acesse https://turso.tech
2. Crie uma conta e um banco de dados
3. Anote a URL e o token de autenticação

### 2. Deploy no Vercel
1. Acesse https://vercel.com
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Importe o repositório `hzsolocoes1983-ui/hzsolucoas`
5. **Configure**:
   - Framework: **Vite**
   - Root Directory: **deixe vazio** (raiz)
   - Build Command: `cd hz-solucoes/apps/web && npm install && npm run build`
   - Output Directory: `hz-solucoes/apps/web/dist`
6. Clique em **Deploy**

### 3. Configurar Variáveis de Ambiente
Após o primeiro deploy, vá em **Settings → Environment Variables** e adicione:

```
DATABASE_URL = libsql://seu-banco.turso.io
DATABASE_AUTH_TOKEN = seu-token-aqui
```

### 4. Fazer Redeploy
Após adicionar as variáveis, vá em **Deployments** e clique em **Redeploy**

## ✅ Testar

1. Acesse sua URL: `https://seu-projeto.vercel.app`
2. Teste `/health`: `https://seu-projeto.vercel.app/health`
3. Verifique se o frontend carrega

## 🐛 Se Der Erro

1. **Verifique os Logs** no Vercel (Deployments → selecione o deploy → Logs)
2. **Verifique as Variáveis** de ambiente
3. **Teste localmente**:
   ```bash
   cd hz-solucoes/apps/web
   npm install
   npm run build
   ```

## 📚 Documentação Completa

- `DEPLOY-VERCEL.md` - Guia completo
- `CORRECOES-VERCEL.md` - Correções aplicadas
- `RESUMO-ANALISE-VERCEL.md` - Análise detalhada


