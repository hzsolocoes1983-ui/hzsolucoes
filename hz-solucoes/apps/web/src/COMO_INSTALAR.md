# 📦 Como Instalar as Correções

## 🎯 O que tem neste pacote?

Este pacote contém **5 arquivos corrigidos** que resolvem o bug de `userId undefined`:

- ✅ `Dashboard.tsx` - 3 mutations corrigidas
- ✅ `Transactions.tsx` - 1 query + 1 mutation corrigidas
- ✅ `Items.tsx` - 1 query + 1 mutation corrigidas
- ✅ `Goals.tsx` - 1 query + 1 mutation corrigidas
- ✅ `Reports.tsx` - 2 queries corrigidas

---

## 📋 Passo a Passo para Instalar

### 1️⃣ Baixar e Extrair

Você já deve ter baixado e extraído este ZIP.

### 2️⃣ Localizar seu Projeto Local

Abra o terminal e navegue até a pasta do seu projeto:

```bash
cd caminho/para/hzsolucoes
```

**Exemplo:**
- Windows: `cd C:\Users\SeuNome\Documents\hzsolucoes`
- Mac/Linux: `cd ~/Documents/hzsolucoes`

### 3️⃣ Fazer Backup (Opcional mas Recomendado)

```bash
# Criar backup dos arquivos originais
mkdir backup_arquivos_originais
cp hz-solucoes/apps/web/src/pages/Dashboard.tsx backup_arquivos_originais/
cp hz-solucoes/apps/web/src/pages/Transactions.tsx backup_arquivos_originais/
cp hz-solucoes/apps/web/src/pages/Items.tsx backup_arquivos_originais/
cp hz-solucoes/apps/web/src/pages/Goals.tsx backup_arquivos_originais/
cp hz-solucoes/apps/web/src/pages/Reports.tsx backup_arquivos_originais/
```

### 4️⃣ Substituir os Arquivos

**Copie os arquivos da pasta `pages/` deste ZIP para:**

```
seu-projeto/hz-solucoes/apps/web/src/pages/
```

**Substitua os seguintes arquivos:**
- `Dashboard.tsx`
- `Transactions.tsx`
- `Items.tsx`
- `Goals.tsx`
- `Reports.tsx`

**Via terminal:**

```bash
# A partir da raiz do projeto hzsolucoes
cp caminho/do/zip/pages/Dashboard.tsx hz-solucoes/apps/web/src/pages/
cp caminho/do/zip/pages/Transactions.tsx hz-solucoes/apps/web/src/pages/
cp caminho/do/zip/pages/Items.tsx hz-solucoes/apps/web/src/pages/
cp caminho/do/zip/pages/Goals.tsx hz-solucoes/apps/web/src/pages/
cp caminho/do/zip/pages/Reports.tsx hz-solucoes/apps/web/src/pages/
```

**Ou manualmente:**
1. Abra a pasta `hz-solucoes/apps/web/src/pages/` no seu explorador de arquivos
2. Copie os 5 arquivos do ZIP para lá
3. Confirme que quer substituir os arquivos existentes

### 5️⃣ Verificar as Mudanças

```bash
# Ver quais arquivos foram modificados
git status
```

Você deve ver algo como:
```
modified:   hz-solucoes/apps/web/src/pages/Dashboard.tsx
modified:   hz-solucoes/apps/web/src/pages/Goals.tsx
modified:   hz-solucoes/apps/web/src/pages/Items.tsx
modified:   hz-solucoes/apps/web/src/pages/Reports.tsx
modified:   hz-solucoes/apps/web/src/pages/Transactions.tsx
```

### 6️⃣ Fazer Commit

```bash
# Adicionar os arquivos modificados
git add hz-solucoes/apps/web/src/pages/

# Fazer commit com mensagem descritiva
git commit -m "fix: corrigir validação de userId em todas as mutations e queries

- Adicionar validação de user.id antes de usar em mutations
- Garantir conversão de userId para número quando necessário
- Corrigir Dashboard.tsx: addWater, markCare, addItem
- Corrigir Transactions.tsx: query e mutation
- Corrigir Items.tsx: query e mutation
- Corrigir Goals.tsx: query e mutation
- Corrigir Reports.tsx: queries

Resolve o erro HTTP 400 'invalid_type' para userId"
```

### 7️⃣ Enviar para o GitHub

```bash
# Enviar para o repositório remoto
git push origin main
```

**Se der erro de autenticação:**
- No GitHub, vá em Settings → Developer settings → Personal access tokens
- Crie um novo token com permissão `repo`
- Use o token como senha quando o Git pedir

### 8️⃣ Aguardar Deploy Automático

Após o push:
1. ⏳ O Render vai detectar a mudança automaticamente
2. ⏳ Vai fazer build e deploy (5-10 minutos)
3. ✅ Seu site estará atualizado com as correções!

**Acompanhe o deploy em:**
https://dashboard.render.com/

---

## 🧪 Testar as Correções

Após o deploy:

1. Acesse: https://hz-frontend-br7l.onrender.com/
2. Faça login
3. Tente adicionar uma receita ou despesa
4. **Deve funcionar sem erros!** 🎉

---

## ❓ Problemas Comuns

### "git: command not found"
- Você precisa instalar o Git: https://git-scm.com/downloads

### "Permission denied"
- Configure suas credenciais do Git:
  ```bash
  git config --global user.name "Seu Nome"
  git config --global user.email "seu@email.com"
  ```

### "Authentication failed"
- Use um Personal Access Token do GitHub como senha
- Ou configure SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Deploy não acontece automaticamente
- Verifique se o Render está conectado ao repositório correto
- Vá em Settings do serviço no Render e verifique "Auto-Deploy"

---

## 📞 Precisa de Ajuda?

Se tiver qualquer problema durante a instalação, me avise e eu te ajudo! 🚀

---

## 📊 O Que Foi Corrigido?

Veja o arquivo `CORRECOES_APLICADAS.md` para detalhes técnicos de todas as correções.

---

**Boa sorte! Em breve seu sistema estará 100% funcional!** 🎉
