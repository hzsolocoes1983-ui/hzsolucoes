/**
 * Converte string brasileira (com vírgula) para número
 * Ex: "1.234,56" -> 1234.56
 */
export function parseBrazilianNumber(value: string): number {
  if (!value) return 0;
  // Remove espaços e substitui vírgula por ponto
  const cleaned = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata número para moeda brasileira
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrencyInput(value: string): string {
  if (value === undefined || value === null) return '';
  const num = parseBrazilianNumber(value);
  return Number.isFinite(num)
    ? num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';
}

/**
 * Valida se o usuário está autenticado
 */
export function getAuthenticatedUser(): { id: number; name: string; whatsapp: string } | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    if (!user || !user.id) return null;
    
    // Garante que user.id seja um número
    return {
      ...user,
      id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
    };
  } catch (error) {
    console.error('Erro ao parsear user do localStorage:', error);
    return null;
  }
}

/**
 * Redireciona para login se não autenticado
 */
export function requireAuth(): { id: number; name: string; whatsapp: string } {
  const user = getAuthenticatedUser();
  if (!user) {
    window.location.href = '/';
    throw new Error('Não autenticado');
  }
  return user;
}

/**
 * Exporta dados para CSV
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  // Usa headers fornecidos ou pega as chaves do primeiro objeto
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Cria o conteúdo CSV
  const csvContent = [
    // Headers
    csvHeaders.map(h => `"${h}"`).join(','),
    // Dados
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Escapa aspas e quebras de linha
        const escaped = String(value || '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  // Cria blob e download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta dados para PDF (usando window.print ou gera HTML)
 */
export function exportToPDF(title: string, content: string, filename?: string) {
  // Cria uma nova janela com o conteúdo
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para exportar PDF');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #3b82f6;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${content}
        <div class="footer">
          Gerado em ${new Date().toLocaleString('pt-BR')}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Formata transações para exportação
 */
export function formatTransactionsForExport(transactions: any[]) {
  return transactions.map(t => ({
    'Data': new Date(t.date).toLocaleDateString('pt-BR'),
    'Tipo': t.type === 'income' ? 'Receita' : 'Despesa',
    'Valor': formatCurrency(t.amount),
    'Descrição': t.description || 'Sem descrição',
    'Categoria': t.category || 'Sem categoria',
    'Fixa': t.isFixed ? 'Sim' : 'Não'
  }));
}

