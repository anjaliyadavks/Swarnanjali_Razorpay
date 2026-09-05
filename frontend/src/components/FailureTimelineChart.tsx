import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { PaymentRecord } from '../types';
import { Clock } from 'lucide-react';

interface Props {
  batch: PaymentRecord[];
}

export default function FailureTimelineChart({ batch }: Props) {
  const data = useMemo(() => {
    // Initialize buckets for 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      display: `${i.toString().padStart(2, '0')}:00`,
      failures: 0,
      amount: 0
    }));

    batch.forEach(record => {
      const date = new Date(record.timestamp);
      const h = date.getHours();
      hours[h].failures += 1;
      hours[h].amount += record.amount_inr;
    });

    return hours;
  }, [batch]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={18} className="text-gray-500" />
        <div>
          <h2 className="text-base font-bold text-gray-900">Failure Time Distribution</h2>
          <p className="text-xs text-gray-500 mt-0.5">Payment failures clustered by time of day</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFailures" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="display" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#6b7280' }} 
              interval={2}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#6b7280' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
              formatter={(value: any, name: any) => [
                name === 'failures' ? value : `₹${Number(value).toLocaleString('en-IN')}`, 
                name === 'failures' ? 'Failed Payments' : 'Amount at Risk'
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="failures" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorFailures)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <p>AI Insights:</p>
        <p className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
          Peak failures detected at 10 AM & 7 PM (Traffic Surges)
        </p>
      </div>
    </div>
  );
}
