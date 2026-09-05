import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AuditLogEntry, PaymentRecord } from '../types';

interface Props {
  logs: AuditLogEntry[];
  batch: PaymentRecord[];
}

export default function RecoveredChart({ logs, batch }: Props) {
  const recoveredByCause: Record<string, number> = {};
  const countedPayments = new Set<string>();

  logs.forEach(log => {
    if (log.outcome === 'RECOVERED' && !countedPayments.has(log.payment_id)) {
      countedPayments.add(log.payment_id);
      const payment = batch.find(p => p.payment_id === log.payment_id);
      if (payment) {
        recoveredByCause[log.cause] = (recoveredByCause[log.cause] || 0) + payment.amount_inr;
      }
    }
  });

  const data = Object.entries(recoveredByCause).map(([cause, amount]) => ({
    cause,
    amount
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">₹ Recovered by Cause</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={(v) => `₹${v}`} />
            <YAxis dataKey="cause" type="category" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Recovered']} />
            <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
