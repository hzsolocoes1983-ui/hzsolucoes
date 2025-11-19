# 📦 Dashboard.tsx Atualizado

## ✅ O que tem neste arquivo?

Este arquivo `Dashboard.tsx` contém **TODAS** as correções:

1. ✅ **Correção do bug userId** - Todas as mutations validam userId corretamente
2. ✅ **Logos dos bancos** - Mostra as logos oficiais ao invés das letras

---

## 🔧 Como Instalar

### Passo 1: Localize o arquivo original

No seu projeto, vá até:
```
hz-solucoes-realtime-whatsapp/apps/web/src/pages/
```

### Passo 2: Faça backup (opcional)

Renomeie o arquivo original:
```
Dashboard.tsx → Dashboard.tsx.backup
```

### Passo 3: Substitua o arquivo

Copie o arquivo `Dashboard.tsx` deste pacote para:
```
hz-solucoes-realtime-whatsapp/apps/web/src/pages/Dashboard.tsx
```

### Passo 4: Teste localmente (opcional)

Se quiser testar antes de fazer deploy:

```bash
cd hz-solucoes-realtime-whatsapp/apps/web
npm install
npm run dev
```

Acesse: http://localhost:5173

### Passo 5: Fazer commit e push

```bash
cd hz-solucoes-realtime-whatsapp

git add apps/web/src/pages/Dashboard.tsx

git commit -m "fix: corrigir userId e adicionar logos dos bancos"

git push origin main
```

### Passo 6: Aguardar deploy

O Render vai fazer deploy automático em 5-10 minutos.

---

## 🎯 O que foi corrigido?

### 1. Bug userId (linhas 191-392)

Todas as mutations agora validam se `user.id` existe e convertem para número:

```javascript
if (!user?.id) {
  throw new Error('Usuário não encontrado. Faça login novamente.');
}
const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
```

**Mutations corrigidas:**
- ✅ addExpense
- ✅ addIncome
- ✅ addItem
- ✅ addWater
- ✅ markCare
- ✅ addQuick

### 2. Logos dos Bancos (linhas 733-738)

Substituído:
```javascript
// ANTES:
<span className="text-white font-bold text-sm">{b.name[0]}</span>

// DEPOIS:
<img src={b.logo} alt={b.name} className="w-full h-full object-contain" />
```

E ajustado o fundo para melhor visualização:
```javascript
// ANTES:
<div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center">

// DEPOIS:
<div className="w-12 h-12 rounded bg-white/90 flex items-center justify-center p-2">
```

---

## 🏦 Logos dos Bancos

As logos são carregadas da Wikimedia Commons (SVG oficial):

- **Itaú**: https://upload.wikimedia.org/wikipedia/commons/3/37/Ita%C3%BA_Unibanco_logo_2023.svg
- **Santander**: https://upload.wikimedia.org/wikipedia/commons/2/25/Banco_Santander_Logotipo.svg
- **Banco do Brasil**: https://upload.wikimedia.org/wikipedia/commons/8/8f/Banco_do_Brasil_logo.svg
- **Bradesco**: https://upload.wikimedia.org/wikipedia/commons/f/f2/Banco_Bradesco_logo.svg
- **Caixa**: https://upload.wikimedia.org/wikipedia/commons/1/15/Caixa_Econ%C3%B4mica_Federal_logo_1997.svg
- **Nubank**: https://upload.wikimedia.org/wikipedia/commons/5/5f/Nubank_logo_2021.svg

---

## ✅ Resultado Esperado

Após instalar e fazer deploy:

1. ✅ **Adicionar receita/despesa funciona** sem erro de userId
2. ✅ **Logos dos bancos aparecem** na seção Contas Bancárias
3. ✅ **Sistema 100% funcional**

---

## 📞 Problemas?

Se tiver algum problema:

1. Verifique se substituiu o arquivo correto
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Aguarde o deploy completo no Render
4. Me avise se continuar com problemas

---

**Boa sorte!** 🚀
