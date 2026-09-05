import React, { useState } from 'react';
import type { MetricsSummary } from '../types';
import { TrendingUp, DollarSign, Calculator } from 'lucide-react';

interface Props {
  metrics: MetricsSummary;
}

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function ROIProjector({ metrics }: Props) {
  const [monthlyFailed, setMonthlyFailed] = useState(10000);
  const [avgTicket, setAvgTicket] = useState(1200);

  const rateDecimal = metrics.overall_recovery_rate / 100;
  const baselineRateDecimal = metrics.baseline_recovered / metrics.total_at_risk;

  const monthlyAtRisk = monthlyFailed * avgTicket;
  const aiRecovered   = monthlyAtRisk * rateDecimal;
  const baselineRec   = monthlyAtRisk * baselineRateDecimal;
  const lift          = aiRecovered - baselineRec;
  const llmCostScale  = (monthlyFailed / 80) * metrics.llm_api_cost_inr;
  const roi           = llmCostScale > 0 ? (lift / llmCostScale).toFixed(0) : '∞';

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white p-6 rounded-xl shadow-md">
      <div className="flex items-center gap-2 mb-6">
        <Calculator size={20} className="text-indigo-300" />
        <h2 className="text-base font-bold">ROI Projector — Scale Your Revenue Recovery</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-indigo-200 block mb-2">
              Monthly Failed Payments
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1000}
                max={500000}
                step={1000}
                value={monthlyFailed}
                onChange={e => setMonthlyFailed(Number(e.target.value))}
                className="flex-1 accent-blue-400"
              />
              <span className="font-bold text-white w-20 text-right">{monthlyFailed.toLocaleString()}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-indigo-200 block mb-2">
              Avg Transaction Value
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={avgTicket}
                onChange={e => setAvgTicket(Number(e.target.value))}
                className="flex-1 accent-blue-400"
              />
              <span className="font-bold text-white w-20 text-right">₹{avgTicket.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-sm text-indigo-200">
            <p>Total monthly revenue at risk: <span className="text-white font-bold">{formatINR(monthlyAtRisk)}</span></p>
          </div>
        </div>

        {/* Outputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">Baseline Recovered</p>
            <p className="text-xl font-bold">{formatINR(baselineRec)}</p>
            <p className="text-xs text-indigo-300 mt-1">Dumb retry system</p>
          </div>
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
            <p className="text-xs text-green-300 uppercase tracking-wider mb-1">AI Recovered</p>
            <p className="text-xl font-bold text-green-300">{formatINR(aiRecovered)}</p>
            <p className="text-xs text-green-400 mt-1">RecoveryTree AI</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">AI Lift</p>
            <p className="text-xl font-bold text-yellow-300">+{formatINR(lift)}</p>
            <p className="text-xs text-indigo-300 mt-1">Extra monthly revenue</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">LLM Cost vs Lift</p>
            <p className="text-xl font-bold text-pink-300">{roi}x ROI</p>
            <p className="text-xs text-indigo-300 mt-1">{formatINR(llmCostScale)} AI cost</p>
          </div>
        </div>
      </div>
    </div>
  );
}
