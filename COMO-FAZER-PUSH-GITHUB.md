# Como Fazer Push para o GitHub

## Problema Identificado
O repositório remoto `https://github.com/hzsolocoes1983-ui/hzsolucoes.git` não existe ou você não tem acesso a ele.

## Solução: Criar o Repositório no GitHub

### Opção 1: Criar via Interface Web do GitHub (Recomendado)

1. **Acesse o GitHub**: https://github.com
2. **Faça login** na sua conta
3. **Clique no botão "+"** no canto superior direito e selecione **"New repository"**
4. **Configure o repositório**:
   - **Repository name**: `hzsolucoes` (ou outro nome de sua preferência)
   - **Description**: (opcional) Descrição do projeto
   - **Visibility**: Escolha Public ou Private
   - **NÃO marque** "Initialize this repository with a README" (já temos arquivos)
   - **NÃO adicione** .gitignore ou license (já temos)
5. **Clique em "Create repository"**

### Opção 2: Usar um Repositório Existente

Se você já tem um repositório no GitHub com outro nome, você pode:

1. **Atualizar a URL do remote**:
   ```powershell
   git remote set-url origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   ```

## Após Criar o Repositório

### 1. Verificar a URL do Remote
```powershell
git remote -v
```

### 2. Se Precisar Atualizar a URL
```powershell
git remote set-url origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```

### 3. Adicionar e Fazer Commit dos Arquivos

**IMPORTANTE**: Antes de fazer push, certifique-se de que:
- O frontend foi buildado: `cd hz-solucoes/apps/web && npm run build`
- Os arquivos desnecessários estão no .gitignore

```powershell
# Adicionar todos os arquivos (exceto os ignorados)
git add .

# Verificar o que será commitado
git status

# Fazer commit
git commit -m "feat: integração frontend/backend e melhorias no projeto"

# Fazer push
git push -u origin main
```

### 4. Se Der Erro de Autenticação

O GitHub não aceita mais senhas. Você precisa usar um **Personal Access Token**:

1. **Criar Token**:
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Dê um nome e selecione as permissões: `repo`
   - Copie o token gerado

2. **Usar o Token**:
   - Quando pedir senha, use o token no lugar da senha
   - Ou configure via URL: `https://SEU_TOKEN@github.com/SEU_USUARIO/SEU_REPOSITORIO.git`

## Estrutura do Projeto Após Integração

Agora o projeto está configurado para:

✅ **Backend (Express)** serve:
- API tRPC em `/trpc/*`
- Webhook WhatsApp em `/whatsapp/*`
- Health check em `/health`
- **Frontend buildado** em todas as outras rotas

✅ **Frontend (React + Vite)**:
- Build gera arquivos estáticos em `hz-solucoes/apps/web/dist`
- Backend serve esses arquivos automaticamente

## Comandos Úteis

```powershell
# Build do frontend
cd hz-solucoes/apps/web
npm run build

# Rodar o servidor (desenvolvimento)
cd hz-solucoes/apps/server
npm run dev

# Build do backend
cd hz-solucoes/apps/server
npm run build

# Rodar produção
cd hz-solucoes/apps/server
npm start
```

## Próximos Passos

1. ✅ `.gitignore` atualizado
2. ✅ Frontend integrado ao backend
3. ⏳ Criar repositório no GitHub
4. ⏳ Fazer push do código


