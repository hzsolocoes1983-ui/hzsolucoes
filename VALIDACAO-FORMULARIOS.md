# 📝 Validação de Formulários

## Visão Geral

O projeto agora possui validação robusta de formulários usando **React Hook Form** + **Zod**. Isso garante:

✅ **Type-safety** - Validação em tempo de compilação  
✅ **Feedback instantâneo** - Erros mostrados em tempo real  
✅ **Código limpo** - Menos boilerplate  
✅ **Melhor UX** - Mensagens de erro claras  

## 📦 Dependências Instaladas

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x"
}
```

## 📁 Arquivos Criados

### 1. `src/lib/schemas.ts`

Contém todos os schemas de validação Zod:

- `expenseSchema` - Validação de despesas
- `incomeSchema` - Validação de receitas
- `itemSchema` - Validação de itens da lista
- `accountSchema` - Validação de contas bancárias
- `goalSchema` - Validação de metas
- `loginSchema` - Validação de login
- `registerSchema` - Validação de registro

### 2. Componentes de Modal com Validação

- `src/components/ExpenseModal.tsx` - Modal de despesas validado
- `src/components/IncomeModal.tsx` - Modal de receitas validado
- `src/components/ItemModal.tsx` - Modal de itens validado

## 🎯 Como Usar

### Exemplo 1: Usando o ExpenseModal

```tsx
import { ExpenseModal } from '../components/ExpenseModal';

function Dashboard() {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  const addExpense = useMutation({
    mutationFn: async (data: { amount: number; description: string; isFixed?: boolean }) => {
      await trpcFetch('addTransaction', {
        userId: user.id,
        type: 'expense',
        amount: data.amount,
        description: data.description,
        isFixed: data.isFixed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['summary']);
      setShowExpenseModal(false);
    },
  });

  return (
    <>
      <Button onClick={() => setShowExpenseModal(true)}>
        Adicionar Despesa
      </Button>
      
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSubmit={(data) => addExpense.mutate(data)}
        isLoading={addExpense.isPending}
      />
    </>
  );
}
```

### Exemplo 2: Criando um Novo Formulário Validado

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Defina o schema
const mySchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Deve ser maior de idade'),
});

type MyFormData = z.infer<typeof mySchema>;

// 2. Use no componente
function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MyFormData>({
    resolver: zodResolver(mySchema),
  });

  const onSubmit = (data: MyFormData) => {
    console.log('Dados validados:', data);
    // Enviar para o backend
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span>{errors.age.message}</span>}
      
      <button type="submit">Enviar</button>
    </form>
  );
}
```

## 🎨 Recursos dos Componentes

### ExpenseModal

**Props:**
- `isOpen: boolean` - Controla visibilidade
- `onClose: () => void` - Callback ao fechar
- `onSubmit: (data) => void` - Callback ao submeter
- `isLoading?: boolean` - Estado de carregamento

**Validações:**
- Valor deve ser maior que zero
- Descrição entre 3 e 100 caracteres
- Checkbox para despesa fixa

**Recursos:**
- Formatação automática de moeda (R$ 1.234,56)
- Validação em tempo real
- Mensagens de erro claras

### IncomeModal

Similar ao ExpenseModal, mas para receitas.

### ItemModal

**Validações:**
- Nome entre 2 e 50 caracteres
- Preço opcional (se fornecido, deve ser > 0)

## 🔧 Personalizando Validações

### Validação Customizada

```tsx
const schema = z.object({
  cpf: z.string().refine(
    (val) => validarCPF(val),
    { message: 'CPF inválido' }
  ),
});
```

### Validação Condicional

```tsx
const schema = z.object({
  type: z.enum(['pf', 'pj']),
  document: z.string(),
}).refine(
  (data) => {
    if (data.type === 'pf') {
      return validarCPF(data.document);
    }
    return validarCNPJ(data.document);
  },
  { message: 'Documento inválido', path: ['document'] }
);
```

### Validação Assíncrona

```tsx
const schema = z.object({
  email: z.string().email(),
}).refine(
  async (data) => {
    const exists = await checkEmailExists(data.email);
    return !exists;
  },
  { message: 'Email já cadastrado' }
);
```

## 📊 Schemas Disponíveis

| Schema | Campos | Validações |
|--------|--------|------------|
| `expenseSchema` | amount, description, isFixed | Valor > 0, descrição 3-100 chars |
| `incomeSchema` | amount, description | Valor > 0, descrição 3-100 chars |
| `itemSchema` | name, price (opcional) | Nome 2-50 chars, preço > 0 |
| `accountSchema` | name, type, balance, icon | Nome 2-30 chars, tipo enum |
| `goalSchema` | name, targetAmount, currentAmount | Nome 3-50 chars, valores > 0 |
| `loginSchema` | whatsapp, password | WhatsApp 10+ dígitos, senha 4+ chars |
| `registerSchema` | whatsapp, name, password, confirmPassword | Senha forte, confirmação |

## 🚀 Próximos Passos

### Para Integrar no Dashboard Existente

1. **Substitua os modais antigos:**

```tsx
// Antes
<Modal isOpen={showExpenseModal} onClose={...}>
  <input value={expenseAmount} onChange={...} />
  <input value={expenseDesc} onChange={...} />
  <Button onClick={handleAddExpense}>Adicionar</Button>
</Modal>

// Depois
<ExpenseModal
  isOpen={showExpenseModal}
  onClose={() => setShowExpenseModal(false)}
  onSubmit={(data) => addExpense.mutate(data)}
  isLoading={addExpense.isPending}
/>
```

2. **Remova os estados antigos:**

```tsx
// Pode remover:
const [expenseAmount, setExpenseAmount] = useState('');
const [expenseDesc, setExpenseDesc] = useState('');
```

3. **Atualize as mutations:**

```tsx
const addExpense = useMutation({
  mutationFn: async (data: { amount: number; description: string }) => {
    await trpcFetch('addTransaction', {
      userId: user.id,
      type: 'expense',
      ...data,
    });
  },
});
```

## 💡 Dicas

### 1. Validação de Moeda Brasileira

Use as funções utilitárias:

```tsx
import { formatCurrencyInput, parseBrazilianNumber } from '../lib/utils';

// Formatar input
const formatted = formatCurrencyInput('1234.56'); // "1.234,56"

// Parsear para número
const number = parseBrazilianNumber('1.234,56'); // 1234.56
```

### 2. Reset do Formulário

```tsx
const { reset } = useForm();

// Resetar para valores padrão
reset();

// Resetar para valores específicos
reset({ amount: '100,00', description: 'Teste' });
```

### 3. Validação Manual

```tsx
const { trigger, getValues } = useForm();

// Validar campo específico
const isValid = await trigger('amount');

// Validar todos os campos
const isFormValid = await trigger();

// Obter valores atuais
const values = getValues();
```

## 🎓 Recursos de Aprendizado

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Exemplos no Repositório](./src/components/)

---

**Desenvolvido com ❤️ para HZ Soluções**
