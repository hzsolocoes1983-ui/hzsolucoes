function toCSV(rows: Record<string, any>[], headers?: string[]) {
  if (!rows || rows.length === 0) return '';
  const cols = headers || Object.keys(rows[0]);
  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    const s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => escape(r[c])).join(','));
  }
  return lines.join('\n');
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(transactions: any[]) {
  const rows = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description ?? '',
    category: t.category ?? '',
    isFixed: t.isFixed ? 'true' : 'false',
    date: t.date ? new Date(t.date).toISOString() : '',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
  }));
  const csv = toCSV(rows, ['id','type','amount','description','category','isFixed','date','createdAt']);
  downloadCSV('transactions.csv', csv);
}

export function exportGoalsToCSV(goals: any[]) {
  const rows = goals.map((g) => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    createdAt: g.createdAt ? new Date(g.createdAt).toISOString() : '',
  }));
  const csv = toCSV(rows, ['id','name','targetAmount','currentAmount','createdAt']);
  downloadCSV('goals.csv', csv);
}

export function exportItemsToCSV(items: any[]) {
  const rows = items.map((i) => ({
    id: i.id,
    name: i.name,
    status: i.status,
    price: i.price ?? '',
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : '',
  }));
  const csv = toCSV(rows, ['id','name','status','price','createdAt']);
  downloadCSV('items.csv', csv);
}