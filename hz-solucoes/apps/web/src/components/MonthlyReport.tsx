import React from 'react';

export function MonthlyReport() {
  const items = [
    { date: '2025-11-01', type: 'Entrada', amount: 250 },
    { date: '2025-11-02', type: 'Saída', amount: 100 },
    { date: '2025-11-03', type: 'Entrada', amount: 320 },
  ];

  return (
    <div className="bg-white shadow rounded p-4">
      <div className="text-lg font-semibold mb-2">Relatório Mensal</div>
      <div className="space-y-2">
        {items.map((i, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="text-gray-600">{i.date}</div>
            <div className={i.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}>
              {i.type}: R$ {i.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}