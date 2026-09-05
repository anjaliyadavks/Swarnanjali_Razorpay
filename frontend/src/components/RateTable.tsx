import React from 'react';
import type { AuditLogEntry, PaymentRecord } from '../types';

interface Props {
  logs: AuditLogEntry[];
  batch: PaymentRecord[];
}

export default function RateTable({ logs, batch }: Props) {
  // Build a map of payment_id -> { cause, finalOutcome }
  // Last log per payment is the final outcome
  const paymentFinal: Record<string, { cause: string; outcome: string }> = {};
  logs.forEach(log => {
    // Always overwrite so we end up with the last entry (final outcome) per payment
    paymentFinal[log.payment_id] = { cause: log.cause, outcome: log.outcome };
  });

  const stats: Record<string, { total: number; recovered: number }> = {};
  Object.values(paymentFinal).forEach(({ cause, outcome }) => {
    if (!stats[cause]) stats[cause] = { total: 0, recovered: 0 };
    stats[cause].total += 1;
    if (outcome === 'RECOVERED') stats[cause].recovered += 1;
  });

  const data = Object.entries(stats).map(([cause, { total, recovered }]) => ({
    cause,
    total,
    recovered,
    rate: total > 0 ? (recovered / total) * 100 : 0
  })).sort((a, b) => b.rate - a.rate);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Recovery Rate by Cause</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Root Cause</th>
              <th className="px-4 py-3 font-semibold text-right">Total Cases</th>
              <th className="px-4 py-3 font-semibold text-right">Recovered</th>
              <th className="px-4 py-3 font-semibold text-right">Recovery Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(row => (
              <tr key={row.cause} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{row.cause}</td>
                <td className="px-4 py-3 text-right">{row.total}</td>
                <td className="px-4 py-3 text-right">{row.recovered}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${row.rate > 50 ? 'bg-green-100 text-green-700' : row.rate === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {row.rate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
