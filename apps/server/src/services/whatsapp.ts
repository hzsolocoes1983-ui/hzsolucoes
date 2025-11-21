import axios from 'axios';

interface WhatsAppMessage {
  to: string;
  text: string;
}

interface EvolutionAPIConfig {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
}

class WhatsAppService {
  private config: EvolutionAPIConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'hzsolucoes',
      apiKey: process.env.EVOLUTION_API_KEY || '',
    };
  }

  /**
   * Envia uma mensagem de texto via WhatsApp
   */
  async sendMessage(to: string, text: string): Promise<boolean> {
    try {
      // Remove caracteres não numéricos do número
      const cleanNumber = to.replace(/\D/g, '');
      
      // Adiciona @s.whatsapp.net se não tiver
      const formattedNumber = cleanNumber.includes('@') 
        ? cleanNumber 
        : `${cleanNumber}@s.whatsapp.net`;

      const url = `${this.config.baseUrl}/message/sendText/${this.config.instanceName}`;
      
      const payload = {
        number: formattedNumber,
        text: text,
      };

      console.log('[WhatsApp] Enviando mensagem:', { to: formattedNumber, text });

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.apiKey,
        },
      });

      console.log('[WhatsApp] Mensagem enviada com sucesso:', response.data);
      return true;
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao enviar mensagem:', error.message);
      if (error.response) {
        console.error('[WhatsApp] Resposta de erro:', error.response.data);
      }
      return false;
    }
  }

  /**
   * Formata uma mensagem de resumo financeiro
   */
  formatSummaryMessage(summary: {
    revenue: number;
    expenses: number;
    balance: number;
  }): string {
    return `💰 *Resumo Financeiro*\n\n` +
      `📈 Receitas: R$ ${this.formatCurrency(summary.revenue)}\n` +
      `📉 Despesas: R$ ${this.formatCurrency(summary.expenses)}\n` +
      `💵 Saldo: R$ ${this.formatCurrency(summary.balance)}\n\n` +
      `_Atualizado em ${new Date().toLocaleString('pt-BR')}_`;
  }

  /**
   * Formata uma mensagem de confirmação de transação
   */
  formatTransactionConfirmation(type: 'income' | 'expense', amount: number, description?: string): string {
    const emoji = type === 'income' ? '✅' : '❌';
    const typeText = type === 'income' ? 'Receita' : 'Despesa';
    
    return `${emoji} *${typeText} Adicionada*\n\n` +
      `💵 Valor: R$ ${this.formatCurrency(amount)}\n` +
      (description ? `📝 Descrição: ${description}\n` : '') +
      `\n_Registrado em ${new Date().toLocaleString('pt-BR')}_`;
  }

  /**
   * Formata uma mensagem de lista de transações
   */
  formatTransactionsList(transactions: any[]): string {
    if (transactions.length === 0) {
      return '📋 *Transações Recentes*\n\nNenhuma transação encontrada.';
    }

    let message = '📋 *Transações Recentes*\n\n';
    
    transactions.slice(0, 10).forEach((t, index) => {
      const emoji = t.type === 'income' ? '📈' : '📉';
      const sign = t.type === 'income' ? '+' : '-';
      message += `${index + 1}. ${emoji} ${sign}R$ ${this.formatCurrency(t.amount)}\n`;
      if (t.description) {
        message += `   ${t.description}\n`;
      }
      message += `   ${new Date(t.date).toLocaleDateString('pt-BR')}\n\n`;
    });

    return message;
  }

  /**
   * Formata uma mensagem de lista de compras
   */
  formatShoppingList(items: any[]): string {
    if (items.length === 0) {
      return '🛒 *Lista de Compras*\n\nNenhum item pendente.';
    }

    let message = '🛒 *Lista de Compras*\n\n';
    let total = 0;
    
    items.forEach((item, index) => {
      const status = item.status === 'bought' ? '✅' : '⭕';
      message += `${index + 1}. ${status} ${item.name}`;
      
      if (item.price) {
        message += ` - R$ ${this.formatCurrency(item.price)}`;
        if (item.status === 'pending') {
          total += item.price;
        }
      }
      message += '\n';
    });

    if (total > 0) {
      message += `\n💰 Total pendente: R$ ${this.formatCurrency(total)}`;
    }

    return message;
  }

  /**
   * Formata uma mensagem de ajuda
   */
  formatHelpMessage(): string {
    return `🤖 *Comandos Disponíveis*\n\n` +
      `💰 *Finanças:*\n` +
      `• despesa 50 compras - Adiciona despesa\n` +
      `• receita 1000 salário - Adiciona receita\n` +
      `• saldo - Ver resumo financeiro\n` +
      `• transações - Ver últimas transações\n\n` +
      `🛒 *Lista de Compras:*\n` +
      `• comprar arroz 5kg - Adiciona item\n` +
      `• lista - Ver lista de compras\n\n` +
      `❓ *Outros:*\n` +
      `• ajuda - Mostra esta mensagem`;
  }

  /**
   * Formata valor em moeda brasileira
   */
  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Verifica se a Evolution API está configurada
   */
  isConfigured(): boolean {
    return !!(this.config.baseUrl && this.config.instanceName && this.config.apiKey);
  }

  /**
   * Testa a conexão com a Evolution API
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/instance/connectionState/${this.config.instanceName}`;
      
      const response = await axios.get(url, {
        headers: {
          'apikey': this.config.apiKey,
        },
      });

      console.log('[WhatsApp] Status da conexão:', response.data);
      return response.data.state === 'open';
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao testar conexão:', error.message);
      return false;
    }
  }
}

// Exporta uma instância única (singleton)
export const whatsappService = new WhatsAppService();
