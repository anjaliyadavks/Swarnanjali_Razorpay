import React, { useState } from 'react';
import type { AuditLogEntry } from '../types';
import { CheckCircle, XCircle, AlertTriangle, Search, Download } from 'lucide-react';

interface Props {
  logs: AuditLogEntry[];
}

const OUTCOME_CONFIG = {
  RECOVERED:   { color: 'text-green-700 bg-green-50 border-green-200',  icon: <CheckCircle size={12} /> },
  STILL_FAILED: { color: 'text-red-700 bg-red-50 border-red-200',       icon: <XCircle size={12} /> },
  ESCALATED:   { color: 'text-orange-700 bg-orange-50 border-orange-200', icon: <AlertTriangle size={12} /> },
};

const CAUSE_COLORS: Record<string, string> = {
  BANK_DOWNTIME:      'bg-orange-50 text-orange-700 border-orange-200',
  CARD_EXPIRED:       'bg-blue-50 text-blue-700 border-blue-200',
  INSUFFICIENT_FUNDS: 'bg-red-50 text-red-700 border-red-200',
  RISK_BLOCK:         'bg-rose-50 text-rose-700 border-rose-200',
  UPI_TIMEOUT:        'bg-purple-50 text-purple-700 border-purple-200',
  OTP_AUTH_FAILURE:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  LIMIT_EXCEEDED:     'bg-teal-50 text-teal-700 border-teal-200',
  NETWORK_ERROR:      'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AuditLog({ logs }: Props) {
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    const matchOutcome = outcomeFilter === 'ALL' || l.outcome === outcomeFilter;
    const matchSearch  = search === '' || l.payment_id.toLowerCase().includes(search.toLowerCase()) || l.cause.toLowerCase().includes(search.toLowerCase());
    return matchOutcome && matchSearch;
  });

  const recovered   = logs.filter(l => l.outcome === 'RECOVERED').length;
  const failed      = logs.filter(l => l.outcome === 'STILL_FAILED').length;
  const escalated   = logs.filter(l => l.outcome === 'ESCALATED').length;

  const downloadCSV = () => {
    const header = 'Payment ID,Cause,Action,Attempt,Outcome,Classifier,Reasoning';
    const rows = logs.map(l =>
      `${l.payment_id},${l.cause},"${l.action}",${l.attempt_number},${l.outcome},${l.classified_by},"${(l.reasoning || '').replace(/"/g, "'")}"`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Audit Trail</h2>
            <p className="text-xs text-gray-400 mt-0.5">Full log of every AI decision and action taken</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick stats */}
            <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={11} /> {recovered} recovered
            </span>
            <span className="text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle size={11} /> {escalated} escalated
            </span>
            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <XCircle size={11} /> {failed} failed
            </span>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Payment ID or Cause..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 items-center">
            {(['ALL', 'RECOVERED', 'STILL_FAILED', 'ESCALATED'] as const).map(o => (
              <button
                key={o}
                onClick={() => setOutcomeFilter(o)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  outcomeFilter === o
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {o === 'ALL' ? 'All' : o === 'STILL_FAILED' ? 'Failed' : o.charAt(0) + o.slice(1).toLowerCase()}
              </button>
            ))}
            <button onClick={downloadCSV} className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg ml-1" title="Download CSV">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-96">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Payment ID</th>
              <th className="px-4 py-3 text-left font-semibold">Root Cause</th>
              <th className="px-4 py-3 text-left font-semibold">Action Taken</th>
              <th className="px-4 py-3 text-center font-semibold">Attempt</th>
              <th className="px-4 py-3 text-left font-semibold">Outcome</th>
              <th className="px-4 py-3 text-left font-semibold">Classifier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((log, i) => {
              const oc = OUTCOME_CONFIG[log.outcome as keyof typeof OUTCOME_CONFIG] || OUTCOME_CONFIG.STILL_FAILED;
              const cc = CAUSE_COLORS[log.cause] || 'bg-gray-50 text-gray-700 border-gray-200';
              return (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.payment_id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cc}`}>
                      {log.cause}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-48 truncate" title={log.action}>{log.action}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-gray-500">#{log.attempt_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${oc.color}`}>
                      {oc.icon}{log.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${log.classified_by === 'rule' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                      {log.classified_by === 'rule' ? 'T1 Rule' : 'T2 LLM'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No audit entries match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
        Showing {filtered.length} of {logs.length} entries
      </div>
    </div>
  );
}
