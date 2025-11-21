import { describe, it, expect } from 'vitest';

/**
 * Função de auto-categorização (extraída do trpc.ts para testar)
 */
function categorizeExpense(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('comida')) return 'Alimentação';
  if (desc.includes('combustível') || desc.includes('gasolina') || desc.includes('posto')) return 'Transporte';
  if (desc.includes('farmacia') || desc.includes('farmácia') || desc.includes('remédio') || desc.includes('medicamento')) return 'Saúde';
  if (desc.includes('conta') || desc.includes('luz') || desc.includes('água') || desc.includes('internet')) return 'Contas';
  if (desc.includes('restaurante') || desc.includes('lanche') || desc.includes('ifood')) return 'Alimentação';
  return 'Outros';
}

describe('Expense Categorization', () => {
  describe('Alimentação', () => {
    it('should categorize "mercado" as Alimentação', () => {
      expect(categorizeExpense('Compras no mercado')).toBe('Alimentação');
      expect(categorizeExpense('MERCADO EXTRA')).toBe('Alimentação');
    });

    it('should categorize "supermercado" as Alimentação', () => {
      expect(categorizeExpense('Supermercado Pão de Açúcar')).toBe('Alimentação');
    });

    it('should categorize "comida" as Alimentação', () => {
      expect(categorizeExpense('Comida delivery')).toBe('Alimentação');
    });

    it('should categorize "restaurante" as Alimentação', () => {
      expect(categorizeExpense('Restaurante japonês')).toBe('Alimentação');
    });

    it('should categorize "lanche" as Alimentação', () => {
      expect(categorizeExpense('Lanche da tarde')).toBe('Alimentação');
    });

    it('should categorize "ifood" as Alimentação', () => {
      expect(categorizeExpense('Pedido iFood')).toBe('Alimentação');
    });
  });

  describe('Transporte', () => {
    it('should categorize "combustível" as Transporte', () => {
      expect(categorizeExpense('Combustível do carro')).toBe('Transporte');
    });

    it('should categorize "gasolina" as Transporte', () => {
      expect(categorizeExpense('Gasolina Shell')).toBe('Transporte');
    });

    it('should categorize "posto" as Transporte', () => {
      expect(categorizeExpense('Abastecimento no posto')).toBe('Transporte');
    });
  });

  describe('Saúde', () => {
    it('should categorize "farmacia" as Saúde', () => {
      expect(categorizeExpense('Farmácia Drogasil')).toBe('Saúde');
    });

    it('should categorize "remédio" as Saúde', () => {
      expect(categorizeExpense('Remédio para dor')).toBe('Saúde');
    });

    it('should categorize "medicamento" as Saúde', () => {
      expect(categorizeExpense('Medicamento controlado')).toBe('Saúde');
    });
  });

  describe('Contas', () => {
    it('should categorize "conta" as Contas', () => {
      expect(categorizeExpense('Conta de telefone')).toBe('Contas');
    });

    it('should categorize "luz" as Contas', () => {
      expect(categorizeExpense('Conta de luz')).toBe('Contas');
    });

    it('should categorize "água" as Contas', () => {
      expect(categorizeExpense('Conta de água')).toBe('Contas');
    });

    it('should categorize "internet" as Contas', () => {
      expect(categorizeExpense('Internet fibra')).toBe('Contas');
    });
  });

  describe('Outros', () => {
    it('should categorize unknown descriptions as Outros', () => {
      expect(categorizeExpense('Presente de aniversário')).toBe('Outros');
      expect(categorizeExpense('Roupas')).toBe('Outros');
      expect(categorizeExpense('Eletrônicos')).toBe('Outros');
      expect(categorizeExpense('Random expense')).toBe('Outros');
    });

    it('should handle empty string', () => {
      expect(categorizeExpense('')).toBe('Outros');
    });
  });

  describe('Case Insensitivity', () => {
    it('should work with uppercase', () => {
      expect(categorizeExpense('MERCADO')).toBe('Alimentação');
      expect(categorizeExpense('GASOLINA')).toBe('Transporte');
      expect(categorizeExpense('FARMACIA')).toBe('Saúde');
    });

    it('should work with mixed case', () => {
      expect(categorizeExpense('MeRcAdO')).toBe('Alimentação');
      expect(categorizeExpense('GaSoLiNa')).toBe('Transporte');
    });
  });

  describe('Complex Descriptions', () => {
    it('should categorize descriptions with multiple words', () => {
      expect(categorizeExpense('Compras no supermercado Extra da esquina')).toBe('Alimentação');
      expect(categorizeExpense('Abastecimento de gasolina no posto Ipiranga')).toBe('Transporte');
      expect(categorizeExpense('Compra de remédio na farmácia do bairro')).toBe('Saúde');
    });

    it('should prioritize first matching keyword', () => {
      // Se tiver múltiplas categorias, pega a primeira que der match
      expect(categorizeExpense('Mercado e farmácia')).toBe('Alimentação'); // mercado vem primeiro no código
    });
  });
});
